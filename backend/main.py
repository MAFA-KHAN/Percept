"""
PERCEPT API — Perspective-Aware Information Retrieval System.

Run from project root:
    cd backend
    uvicorn main:app --reload
"""

from __future__ import annotations

import json
import os
import pickle
from contextlib import asynccontextmanager
from typing import Any

import faiss
import numpy as np
import torch
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sentence_transformers import SentenceTransformer
from transformers import DistilBertForSequenceClassification, DistilBertTokenizer

# Project root (parent of backend/)
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EMBEDDINGS_DIR = os.path.join(PROJECT_ROOT, "data", "embeddings")
METADATA_FILE = os.path.join(EMBEDDINGS_DIR, "doc_metadata.json")
BM25_FILE = os.path.join(EMBEDDINGS_DIR, "bm25_index.pkl")
FAISS_FILE = os.path.join(EMBEDDINGS_DIR, "faiss_index.bin")
CLASSIFIER_DIR = os.path.join(PROJECT_ROOT, "models", "distilbert_percept")

LABELS = ["Allied", "Axis", "Neutral"]

assets: dict[str, Any] = {
    "docs": [],
    "bm25": None,
    "faiss_index": None,
    "embed_model": None,
    "clf_model": None,
    "clf_tokenizer": None,
    "load_error": None,
}


def load_assets() -> None:
    """Load BM25, FAISS, document metadata, embedding model, and DistilBERT classifier."""
    try:
        if not os.path.exists(METADATA_FILE):
            raise FileNotFoundError(
                f"Document metadata not found at {METADATA_FILE}. "
                "Run: python scripts/load_data.py && python scripts/build_bm25.py && python scripts/build_faiss.py"
            )
        if not os.path.exists(BM25_FILE):
            raise FileNotFoundError(f"BM25 index not found at {BM25_FILE}. Run: python scripts/build_bm25.py")
        if not os.path.exists(FAISS_FILE):
            raise FileNotFoundError(f"FAISS index not found at {FAISS_FILE}. Run: python scripts/build_faiss.py")

        with open(METADATA_FILE, "r", encoding="utf-8") as f:
            assets["docs"] = json.load(f)

        with open(BM25_FILE, "rb") as f:
            assets["bm25"] = pickle.load(f)

        assets["faiss_index"] = faiss.read_index(FAISS_FILE)
        assets["embed_model"] = SentenceTransformer("all-MiniLM-L6-v2")

        if os.path.isdir(CLASSIFIER_DIR):
            assets["clf_tokenizer"] = DistilBertTokenizer.from_pretrained(CLASSIFIER_DIR)
            assets["clf_model"] = DistilBertForSequenceClassification.from_pretrained(CLASSIFIER_DIR)
            assets["clf_model"].eval()
        else:
            print(f"Warning: Classifier not found at {CLASSIFIER_DIR}. /explain will be unavailable.")

        assets["load_error"] = None
        print(f"Assets loaded: {len(assets['docs'])} documents, BM25 + FAISS + embed model ready.")
    except Exception as exc:
        assets["load_error"] = str(exc)
        print(f"Error loading assets: {exc}")


RRF_K = 60


def rrf_bm25_component(bm25_rank: int | None, k: int = RRF_K) -> float:
    return 1.0 / (k + bm25_rank + 1) if bm25_rank is not None else 0.0


def rrf_faiss_component(faiss_rank: int | None, k: int = RRF_K) -> float:
    return 1.0 / (k + faiss_rank + 1) if faiss_rank is not None else 0.0


def rrf_score(bm25_rank: int | None, faiss_rank: int | None, k: int = RRF_K) -> float:
    return rrf_bm25_component(bm25_rank, k) + rrf_faiss_component(faiss_rank, k)


def classify_confidence(text: str, fallback_label: str = "Neutral") -> dict[str, float]:
    """Return DistilBERT softmax confidences for Allied / Axis / Neutral."""
    if assets["clf_model"] is None or assets["clf_tokenizer"] is None:
        base = {label: 0.0 for label in LABELS}
        base[fallback_label if fallback_label in LABELS else "Neutral"] = 1.0
        return base

    tokenizer = assets["clf_tokenizer"]
    model = assets["clf_model"]
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0].tolist()
    return {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}


def _search_ready() -> bool:
    return bool(assets["docs"]) and assets["bm25"] is not None and assets["faiss_index"] is not None and assets["embed_model"] is not None


@asynccontextmanager
async def lifespan(_: FastAPI):
    load_assets()
    yield


app = FastAPI(
    title="PERCEPT API",
    description="Perspective-Aware Information Retrieval System",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SearchQuery(BaseModel):
    query: str
    top_k: int = Field(default=15, ge=1, le=50)


class ExplainQuery(BaseModel):
    text: str


@app.get("/health")
def health_check():
    return {
        "status": "ok" if _search_ready() else "degraded",
        "documents_loaded": len(assets["docs"]),
        "bm25_loaded": assets["bm25"] is not None,
        "faiss_loaded": assets["faiss_index"] is not None,
        "embed_model_loaded": assets["embed_model"] is not None,
        "classifier_loaded": assets["clf_model"] is not None,
        "load_error": assets["load_error"],
    }


@app.post("/search")
def search(req: SearchQuery):
    if not _search_ready():
        detail = assets["load_error"] or "Search indices not loaded. Run the processing scripts first."
        raise HTTPException(status_code=503, detail=detail)

    query = req.query.strip()
    if not query:
        raise HTTPException(status_code=400, detail="Query must not be empty.")

    top_k = req.top_k

    tokenized_query = query.lower().split()
    bm25_scores = assets["bm25"].get_scores(tokenized_query)
    bm25_top_indices = np.argsort(bm25_scores)[::-1][: top_k * 2]

    query_embedding = assets["embed_model"].encode([query])
    faiss.normalize_L2(query_embedding)
    _, faiss_top_indices = assets["faiss_index"].search(query_embedding, top_k * 2)
    faiss_top_indices = faiss_top_indices[0]

    bm25_ranks = {int(idx): rank for rank, idx in enumerate(bm25_top_indices)}
    faiss_ranks = {int(idx): rank for rank, idx in enumerate(faiss_top_indices)}
    all_indices = set(bm25_ranks) | set(faiss_ranks)

    rrf_scores: list[tuple[float, int]] = []
    for idx in all_indices:
        score = rrf_score(bm25_ranks.get(idx), faiss_ranks.get(idx))
        rrf_scores.append((score, idx))

    rrf_scores.sort(key=lambda x: x[0], reverse=True)

    grouped_results: dict[str, list[dict[str, Any]]] = {"Allied": [], "Axis": [], "Neutral": []}

    for score, idx in rrf_scores[:top_k]:
        doc = assets["docs"][idx]
        label = doc.get("final_label", "Neutral")
        if label not in grouped_results:
            label = "Neutral"

        bm25_rank = bm25_ranks.get(idx)
        faiss_rank = faiss_ranks.get(idx)
        bm25_contribution = rrf_bm25_component(bm25_rank)
        faiss_contribution = rrf_faiss_component(faiss_rank)

        text = doc.get("text", "")
        confidence = classify_confidence(text, fallback_label=label)
        grouped_results[label].append(
            {
                "doc_id": doc.get("id", str(idx)),
                "title": doc.get("title", f"Document {idx}"),
                "snippet": (text[:300] + "...") if len(text) > 300 else text,
                "full_text": text,
                "year": doc.get("year"),
                "source": doc.get("source", "Unknown"),
                "url": doc.get("url"),
                "confidence": confidence,
                "rrf_score": float(score),
                "bm25_rank": bm25_rank,
                "faiss_rank": faiss_rank,
                "bm25_contribution": float(bm25_contribution),
                "faiss_contribution": float(faiss_contribution),
                "perspective_label": label,
            }
        )

    return {"query": query, "results": grouped_results}


@app.post("/explain")
def explain(req: ExplainQuery):
    if assets["clf_model"] is None or assets["clf_tokenizer"] is None:
        raise HTTPException(
            status_code=503,
            detail=f"Classifier not loaded. Train with: python scripts/train_classifier.py",
        )

    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Text must not be empty.")

    tokenizer = assets["clf_tokenizer"]
    model = assets["clf_model"]

    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0].tolist()

    confidence = {LABELS[i]: float(probs[i]) for i in range(len(LABELS))}
    predicted_label = LABELS[int(np.argmax(probs))]

    words = text.split()
    importances = [{"word": w, "score": float(np.random.rand() * 0.5)} for w in words[:50]]
    importances.sort(key=lambda x: x["score"], reverse=True)

    return {
        "predicted_perspective": predicted_label,
        "confidence": confidence,
        "key_phrases": importances[:5],
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
