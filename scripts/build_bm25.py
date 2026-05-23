import json
import os
import pickle
from rank_bm25 import BM25Okapi

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEANED_FILE = os.path.join(BASE_DIR, "data", "cleaned", "combined_100docs.json")
EMBEDDINGS_DIR = os.path.join(BASE_DIR, "data", "embeddings")
BM25_INDEX_FILE = os.path.join(EMBEDDINGS_DIR, "bm25_index.pkl")
DOC_METADATA_FILE = os.path.join(EMBEDDINGS_DIR, "doc_metadata.json")

def build_bm25():
    if not os.path.exists(CLEANED_FILE):
        print(f"Data file not found at {CLEANED_FILE}. Please run load_data.py first.")
        return
        
    with open(CLEANED_FILE, "r", encoding="utf-8") as f:
        docs = json.load(f)
        
    # Tokenize text
    tokenized_corpus = [doc.get("text", "").lower().split() for doc in docs]
    
    # Build BM25
    print("Building BM25 index...")
    bm25 = BM25Okapi(tokenized_corpus)
    
    # Save index and metadata
    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
    with open(BM25_INDEX_FILE, "wb") as f:
        pickle.dump(bm25, f)
        
    # Save metadata (store documents without full text if desired, but we keep it simple here)
    with open(DOC_METADATA_FILE, "w", encoding="utf-8") as f:
        json.dump(docs, f)
        
    print(f"BM25 index saved to {BM25_INDEX_FILE}")

if __name__ == "__main__":
    build_bm25()
