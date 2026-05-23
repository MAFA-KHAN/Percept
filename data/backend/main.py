from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import os
import json
import pickle
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification

app = FastAPI(title="PERCEPT API", description="Perspective-Aware Information Retrieval System")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global assets
assets = {
    "docs": [],
    "bm25": None,
    "faiss_index": None,
    "embed_model": None,
    "clf_model": None,
    "clf_tokenizer": None
}

def load_assets():
    base_dir = os.path.dirname(os.path.dirname(__file__))
    embeddings_dir = os.path.join(base_dir, "data", "embeddings")
    metadata_file = os.path.join(embeddings_dir, "doc_metadata.json")
    bm25_file = os.path.join(embeddings_dir, "bm25_index.pkl")
    faiss_file = os.path.join(embeddings_dir, "faiss_index.bin")
    model_dir = os.path.join(base_dir, "models", "distilbert_percept")

    try:
        with open(metadata_file, "r", encoding="utf-8") as f:
            assets["docs"] = json.load(f)
        with open(bm25_file, "rb") as f:
            assets["bm25"] = pickle.load(f)
        assets["faiss_index"] = faiss.read_index(faiss_file)
        assets["embed_model"] = SentenceTransformer('all-MiniLM-L6-v2')
        
        if os.path.exists(model_dir):
            assets["clf_model"] = DistilBertForSequenceClassification.from_pretrained(model_dir)
            assets["clf_tokenizer"] = DistilBertTokenizer.from_pretrained(model_dir)
        else:
            print("Warning: Classifier model not found. /explain endpoint may not work.")
            
        print("Assets loaded successfully.")
    except Exception as e:
        print(f"Error loading assets: {e}")

# Load assets on startup
@app.on_event("startup")
def startup_event():
    load_assets()

class SearchQuery(BaseModel):
    query: str
    top_k: int = 15

class ExplainQuery(BaseModel):
    text: str

def rrf_score(bm25_rank, faiss_rank, k=60):
    bm25_s = 1.0 / (k + bm25_rank + 1) if bm25_rank is not None else 0.0
    faiss_s = 1.0 / (k + faiss_rank + 1) if faiss_rank is not None else 0.0
    return bm25_s + faiss_s

@app.get("/health")
def health_check():
    return {
        "status": "ok", 
        "documents_loaded": len(assets["docs"]),
        "models_loaded": assets["clf_model"] is not None
    }

@app.post("/search")
def search(req: SearchQuery):
    if not assets["docs"]:
        raise HTTPException(status_code=500, detail="Data not loaded. Run processing scripts first.")

    query = req.query
    top_k = req.top_k
    
    # 1. BM25 Search
    tokenized_query = query.lower().split()
    bm25_scores = assets["bm25"].get_scores(tokenized_query)
    bm25_top_indices = np.argsort(bm25_scores)[::-1][:top_k*2]
    
    # 2. FAISS Search
    query_embedding = assets["embed_model"].encode([query])
    faiss.normalize_L2(query_embedding)
    faiss_scores, faiss_top_indices = assets["faiss_index"].search(query_embedding, top_k*2)
    faiss_top_indices = faiss_top_indices[0]
    
    # 3. RRF Fusion
    bm25_ranks = {idx: rank for rank, idx in enumerate(bm25_top_indices)}
    faiss_ranks = {idx: rank for rank, idx in enumerate(faiss_top_indices)}
    all_indices = set(list(bm25_ranks.keys()) + list(faiss_ranks.keys()))
    
    rrf_scores = []
    for idx in all_indices:
        score = rrf_score(bm25_ranks.get(idx, None), faiss_ranks.get(idx, None))
        rrf_scores.append((score, idx))
        
    rrf_scores.sort(key=lambda x: x[0], reverse=True)
    
    # Group results by perspective
    grouped_results = {"Allied": [], "Axis": [], "Neutral": []}
    
    for score, idx in rrf_scores[:top_k]:
        doc = assets["docs"][idx]
        label = doc.get("final_label", "Unknown")
        if label not in grouped_results:
            label = "Neutral" # Fallback
            
        grouped_results[label].append({
            "doc_id": doc.get("id", str(idx)),
            "title": doc.get("title", f"Document {idx}"),
            "snippet": doc.get("text", "")[:300] + "...",
            "full_text": doc.get("text", ""),
            "rrf_score": score,
            "perspective_label": label
        })
        
    return {"query": query, "results": grouped_results}

@app.post("/explain")
def explain(req: ExplainQuery):
    if assets["clf_model"] is None or assets["clf_tokenizer"] is None:
        raise HTTPException(status_code=500, detail="Classifier not loaded.")
        
    # Basic explanation mock based on attention or token importance
    # A full SHAP implementation is heavy; we use a simple heuristic for demo
    text = req.text
    tokenizer = assets["clf_tokenizer"]
    model = assets["clf_model"]
    
    inputs = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)
    with torch.no_grad():
        outputs = model(**inputs)
        probs = torch.nn.functional.softmax(outputs.logits, dim=-1)[0].tolist()
        
    labels = ["Allied", "Axis", "Neutral"]
    confidence = {labels[i]: probs[i] for i in range(3)}
    predicted_label = labels[np.argmax(probs)]
    
    # Mock highlighting keywords (in real system, extract via Integrated Gradients or SHAP)
    words = text.split()
    importances = [{"word": w, "score": np.random.rand() * 0.5} for w in words[:50]]
    importances.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "predicted_perspective": predicted_label,
        "confidence": confidence,
        "key_phrases": importances[:5]
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
