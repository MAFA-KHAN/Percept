import json
import os
from collections import Counter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW_DIR = os.path.join(BASE_DIR, "data", "raw")
CLEANED_DIR = os.path.join(BASE_DIR, "data", "cleaned")
OUTPUT_FILE = os.path.join(CLEANED_DIR, "combined_100docs.json")

def load_data():
    docs = []
    
    # Try to load WW1 data
    ww1_path = os.path.join(RAW_DIR, "PERCEPT_WW1_50docs.json")
    if os.path.exists(ww1_path):
        with open(ww1_path, "r", encoding="utf-8") as f:
            docs.extend(json.load(f).get("documents", []))
            
    # Try to load WW2 data
    ww2_path = os.path.join(RAW_DIR, "PERCEPT_WW2_50docs_combined.json")
    if os.path.exists(ww2_path):
        with open(ww2_path, "r", encoding="utf-8") as f:
            docs.extend(json.load(f).get("documents", []))
            
    if not docs:
        print("No documents found in data/raw. Please add the required JSON files.")
        return
        
    print(f"Loaded {len(docs)} documents total.")
    
    # Analyze label distribution
    labels = [doc.get("final_label", "Unknown") for doc in docs]
    print("Label Distribution:", Counter(labels))
    
    # Save combined file
    os.makedirs(CLEANED_DIR, exist_ok=True)
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(docs, f, indent=4)
        
    print(f"Saved combined data to {OUTPUT_FILE}")

if __name__ == "__main__":
    load_data()
