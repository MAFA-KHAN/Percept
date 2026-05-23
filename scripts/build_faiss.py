import json
import os
import faiss
import numpy as np
from sentence_transformers import SentenceTransformer

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEANED_FILE = os.path.join(BASE_DIR, "data", "cleaned", "combined_100docs.json")
EMBEDDINGS_DIR = os.path.join(BASE_DIR, "data", "embeddings")
FAISS_INDEX_FILE = os.path.join(EMBEDDINGS_DIR, "faiss_index.bin")

def build_faiss():
    if not os.path.exists(CLEANED_FILE):
        print(f"Data file not found at {CLEANED_FILE}. Please run load_data.py first.")
        return
        
    with open(CLEANED_FILE, "r", encoding="utf-8") as f:
        docs = json.load(f)
        
    texts = [doc.get("text", "") for doc in docs]
    
    print("Loading SentenceTransformer model...")
    model = SentenceTransformer('all-MiniLM-L6-v2')
    
    print("Generating embeddings...")
    embeddings = model.encode(texts, show_progress_bar=True)
    
    # L2 normalize for cosine similarity via Inner Product
    faiss.normalize_L2(embeddings)
    
    print("Building FAISS index...")
    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)
    
    os.makedirs(EMBEDDINGS_DIR, exist_ok=True)
    faiss.write_index(index, FAISS_INDEX_FILE)
    print(f"FAISS index saved to {FAISS_INDEX_FILE}")

if __name__ == "__main__":
    build_faiss()
