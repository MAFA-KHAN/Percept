import json
import faiss
import pickle
import numpy as np
from sentence_transformers import SentenceTransformer
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEANED_FILE = os.path.join(BASE_DIR, "data", "cleaned", "combined_100docs.json")
EMBEDDINGS_DIR = os.path.join(BASE_DIR, "data", "embeddings")
BM25_INDEX_FILE = os.path.join(EMBEDDINGS_DIR, "bm25_index.pkl")
DOC_METADATA_FILE = os.path.join(EMBEDDINGS_DIR, "doc_metadata.json")
FAISS_INDEX_FILE = os.path.join(EMBEDDINGS_DIR, "faiss_index.bin")

def load_assets():
    # Load metadata
    with open(DOC_METADATA_FILE, "r", encoding="utf-8") as f:
        docs = json.load(f)
        
    # Load BM25
    with open(BM25_INDEX_FILE, "rb") as f:
        bm25 = pickle.load(f)
        
    # Load FAISS
    faiss_index = faiss.read_index(FAISS_INDEX_FILE)
    
    # Load embedding model
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    return docs, bm25, faiss_index, model

def rrf_score(bm25_rank, faiss_rank, k=60):
    # rank is 0-indexed internally, we use 1-indexed for formula
    bm25_s = 1.0 / (k + bm25_rank + 1) if bm25_rank is not None else 0.0
    faiss_s = 1.0 / (k + faiss_rank + 1) if faiss_rank is not None else 0.0
    return bm25_s + faiss_s

def hybrid_search(query, top_k=10):
    try:
        docs, bm25, faiss_index, model = load_assets()
    except Exception as e:
        print(f"Error loading assets: {e}")
        return []

    # 1. BM25 Search
    tokenized_query = query.lower().split()
    bm25_scores = bm25.get_scores(tokenized_query)
    bm25_top_indices = np.argsort(bm25_scores)[::-1][:top_k*2] # Get more to allow intersection
    
    # 2. FAISS Search
    query_embedding = model.encode([query])
    faiss.normalize_L2(query_embedding)
    faiss_scores, faiss_top_indices = faiss_index.search(query_embedding, top_k*2)
    faiss_top_indices = faiss_top_indices[0]
    
    # 3. RRF Fusion
    # Create rank dictionaries mapping doc_index -> rank
    bm25_ranks = {idx: rank for rank, idx in enumerate(bm25_top_indices)}
    faiss_ranks = {idx: rank for rank, idx in enumerate(faiss_top_indices)}
    
    all_indices = set(list(bm25_ranks.keys()) + list(faiss_ranks.keys()))
    
    rrf_scores = []
    for idx in all_indices:
        b_rank = bm25_ranks.get(idx, None)
        f_rank = faiss_ranks.get(idx, None)
        score = rrf_score(b_rank, f_rank)
        rrf_scores.append((score, idx))
        
    # Sort by RRF score descending
    rrf_scores.sort(key=lambda x: x[0], reverse=True)
    
    results = []
    for score, idx in rrf_scores[:top_k]:
        doc = docs[idx]
        results.append({
            "doc_id": doc.get("id", str(idx)),
            "title": doc.get("title", f"Document {idx}"),
            "snippet": doc.get("text", "")[:200] + "...",
            "perspective_label": doc.get("final_label", "Unknown"),
            "rrf_score": score
        })
        
    return results

if __name__ == "__main__":
    query = "war strategies"
    print(f"Executing hybrid search for: '{query}'")
    results = hybrid_search(query)
    for i, res in enumerate(results):
        print(f"{i+1}. [Score: {res['rrf_score']:.4f}] {res['title']} ({res['perspective_label']})")
