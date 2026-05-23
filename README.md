# PERCEPT (Perspective-Aware Information Retrieval System)

A full-stack application that leverages hybrid search (BM25 + FAISS) and a DistilBERT classifier to retrieve and group historical documents by perspective framing.

**Disclaimer: PERCEPT classifies narrative framing, not truth or propaganda.**

## Setup

1. Create a virtual environment:
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Add data files to `data/raw/`:
   - `PERCEPT_WW1_50docs.json`
   - `PERCEPT_WW2_50docs_combined.json`
4. Run processing scripts:
   ```bash
   cd scripts
   python load_data.py
   python build_bm25.py
   python build_faiss.py
   python train_classifier.py
   ```

## Running the Application

### Backend
```bash
cd backend
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```
