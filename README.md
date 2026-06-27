<div align="center">

# PERCEPT

### Perspective-Aware Information Retrieval & Bias Analysis System

Hybrid IR engine that ranks news articles by relevance, then exposes what relevance alone hides — credibility and political framing — side by side, Left vs. Center vs. Right.

<br/>

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Frontend-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-2E2E2E?style=for-the-badge)

</div>

<br/>

> **Disclaimer:** PERCEPT classifies *narrative framing*, not truth or propaganda. Credibility scores reflect model confidence, not editorial fact-checking.

<br/>

## Overview

Search engines rank by keyword relevance and stop there — a fake article and a verified one can sit back to back on page one, with no signal that they exist. PERCEPT adds the layer most search systems skip: for every query, it retrieves the most relevant articles, classifies each as fake or real, detects its political lean, and scores its credibility — then renders all three perspectives side by side so a reader can compare a story instead of trusting whichever version they clicked on first.

Built as an Information Retrieval term project, the system combines two classical retrieval methods (BM25 + TF-IDF) with two supervised classifiers (fake/real detection, political bias) over a corpus of ~100,000 labeled news articles.

<br/>

## Table of Contents

- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [Tech Stack](#tech-stack)
- [Datasets](#datasets)
- [Methodology](#methodology)
- [Evaluation](#evaluation)
- [Limitations](#limitations)
- [Future Work](#future-work)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)


<br/>

## Key Features

| | |
|---|---|
| 🔍 **Hybrid Retrieval** | BM25 (60%) + TF-IDF cosine similarity (40%) fused into a single ranking score |
| 📰 **Fake/Real Detection** | Logistic Regression classifier, **96.28%** test accuracy across ~100K articles |
| 🧭 **Political Bias Classifier** | Multi-class Logistic Regression — Left / Center / Right, **74.66%** accuracy |
| ⭐ **Credibility Score** | 0–100 score derived directly from classifier confidence — no separate model, no extra training |
| 📊 **Three-Column Comparison View** | Every query returns Left / Center / Right results side by side, each labeled Fake or Real with its score |

<br/>

## System Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌───────────────────────┐
│  User Query │ ──▶ │  Preprocessing   │ ──▶ │   Hybrid Retrieval    │
└─────────────┘     │  (8-step clean)  │     │  BM25 + TF-IDF Cosine │
                     └──────────────────┘     └───────────┬───────────┘
                                                           ▼
                                              ┌────────────────────────┐
                                              │   Top-K Articles       │
                                              └───────────┬────────────┘
                                                           ▼
                          ┌────────────────────────────────────────────────┐
                          │              Classification Layer              │
                          │  ┌──────────────────┐   ┌───────────────────┐ │
                          │  │ Fake/Real Model   │   │ Bias Model        │ │
                          │  │ (Logistic Reg.)   │   │ (Logistic Reg.)   │ │
                          │  │ 96.28% accuracy   │   │ 74.66% accuracy   │ │
                          │  └──────────────────┘   └───────────────────┘ │
                          └───────────────────────┬──────────────────────┘
                                                   ▼
                                    ┌──────────────────────────┐
                                    │  Credibility Score        │
                                    │  P(Real) × 100             │
                                    └──────────────┬────────────┘
                                                   ▼
                              ┌───────────────────────────────────────┐
                              │   Three-Column UI: Left | Center | Right│
                              └───────────────────────────────────────┘
```

**Request flow:**

1. **User Input** — query typed into the search bar (e.g. `election fraud`)
2. **Preprocessing** — same 8-step cleaning pipeline applied to the corpus: lowercase → URL removal → symbol/number stripping → whitespace cleanup → tokenization → stopword removal → lemmatization → stemming
3. **Retrieval** — BM25 and TF-IDF score the full corpus against the cleaned query
4. **Ranking** — `Final Score = 0.6 × BM25 + 0.4 × TF-IDF Cosine + Credibility Adjustment`
5. **Classification** — each top-ranked article passes through the Fake/Real and Bias classifiers
6. **Scoring** — credibility = `P(Real) × 100`, taken straight from `predict_proba()`
7. **Display** — results rendered in three columns, each article labeled Fake/Real with its credibility score

<br/>

## Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- Python
- Flask (REST API)
- scikit-learn (Logistic Regression, TF-IDF)
- Pickle (model persistence)

</td>
<td valign="top" width="50%">

**Frontend**
- HTML / CSS
- JavaScript
- Three-column comparison interface

</td>
</tr>
</table>

<br/>

## Datasets

Three Kaggle/academic sources combined into a single corpus of **~100,000 labeled articles**, used to prevent overfitting to any one outlet's writing style and to improve generalization across sources.

| Dataset | Source | Size | Labels |
|---|---|---|---|
| Fake & Real News (`True.csv` + `Fake.csv`) | Kaggle | 21,417 real + 23,481 fake | Fake / Real |
| Political Bias | Kaggle | 17,362 articles | Left / Center / Right |
| Misinformation Corpus | Kaggle | 34,975 real + 43,642 fake | Fake / Real |

**Preprocessing pipeline** applied identically to training data and live queries:

| Step | Operation | Purpose |
|---|---|---|
| 1 | Lowercase | Normalize case (`Trump` = `trump`) |
| 2 | URL removal | Links carry no classification signal |
| 3 | Strip symbols & numbers | Keep only linguistic content |
| 4 | Whitespace cleanup | Remove artifacts from prior steps |
| 5 | Tokenization | Split into word-level units |
| 6 | Stopword removal | Drop high-frequency, low-signal words |
| 7 | Lemmatization | Reduce words to root form |
| 8 | Stemming | Further normalize word endings |

<br/>

## Methodology

### Hybrid Retrieval — BM25 + TF-IDF

Two classical IR methods are combined rather than used in isolation, since each compensates for the other's weak point:

- **BM25** — probabilistic ranking with term-frequency saturation and document-length normalization. The same algorithm underlying Elasticsearch and Lucene; handles lexical matching robustly but doesn't capture vector-space similarity.
- **TF-IDF + Cosine Similarity** — converts query and corpus into 10,000-dimension vectors and measures the angle between them. Reuses the same vectorizer the classifiers depend on, at no extra computational cost.

```
Final Ranking Score = 0.6 × BM25 Score + 0.4 × TF-IDF Cosine Similarity + Credibility Adjustment
```

### Classification Layer

| Model | Algorithm | Accuracy | Notes |
|---|---|---|---|
| Fake/Real | Logistic Regression (TF-IDF features) | **96.28%** | Fake — Precision 96% / Recall 97%; Real — Precision 97% / Recall 95% |
| Political Bias | Logistic Regression (multi-class) | **74.66%** | Left Recall 88%, Center Recall 57% — Center is hardest due to mixed vocabulary |

Logistic Regression was chosen deliberately over higher-capacity models: it's fast, interpretable, and its learned word-level weights can be inspected and explained directly — a requirement for defending the system's predictions under questioning rather than treating it as a black box.

### Credibility Score

Not a third trained model — derived in one step from the Fake/Real classifier's own confidence:

```
predict_proba() → [Fake: 0.03, Real: 0.97] → Credibility = 0.97 × 100 = 97/100
```

A binary Fake/Real label collapses everything to a coin flip. A score of `97/100` versus `52/100` tells the user *how confident* the system is, not just which side it landed on — at zero extra training cost.

<br/>

## Evaluation

### Classification — Human-Labeled Ground Truth

| Metric | Fake/Real Model | Bias Model |
|---|---|---|
| Accuracy | 96.28% | 74.66% |
| Precision (Fake) | 96% | — |
| Recall (Fake) | 97% | — |
| F1 Score | 97% | — |

Ground truth: dataset labels, human-annotated by the original dataset researchers.

### Retrieval — Precision at K

Two manually-judged test queries, evaluated with P@K against relevance judgments made by the team:

**Query: `"election fraud"`**

| Rank | Article (short) | Bias | Label | Credibility |
|---|---|---|---|---|
| 1 | Voting irregularities reported in three states | Right | Fake | 38% |
| 2 | Election officials deny fraud claims | Center | Real | 91% |
| 3 | Democrats respond to fraud allegations | Left | Real | 84% |
| 4 | State audit finds no evidence of fraud | Center | Real | 88% |
| 5 | Social media spreads unverified voting claims | Right | Fake | 41% |

**P@5 = 80%** — 4 of 5 results relevant; fake articles correctly surfaced low credibility scores.

**Query: `"climate change policy"`**

| Rank | Article (short) | Bias | Label | Credibility |
|---|---|---|---|---|
| 1 | Biden signs new climate executive order | Left | Real | 87% |
| 2 | Climate scientists warn of 1.5° target | Center | Real | 93% |
| 3 | Republicans push back on green energy plan | Right | Real | 79% |
| 4 | Wind energy destroys jobs, report claims | Right | Fake | 33% |
| 5 | UN releases annual climate report | Center | Real | 90% |

**P@5 = 100%** — balanced perspective coverage across Left, Center, and Right.

> **Honest note:** retrieval P@5 = 1.0 reflects the team's own keyword-based relevance criteria, not independent human annotation. It measures internal consistency, not real-world retrieval recall (Recall@5 ≈ 0.05 against the full corpus).

<br/>

## Limitations

- **No negation handling** — "no fraud was found" loses "no" during stopword removal, risking the same treatment as a fraud-claim article
- **Source leakage** — classifiers can learn outlet-level writing patterns rather than pure content signal, weakening predictions on unseen sources
- **Small corpus** — ~25,000–100,000 articles vs. the millions a production search engine would index
- **Text-only** — no support for image, video, or audio-based misinformation
- **No semantic understanding** — models learn statistical word patterns, not meaning; sarcasm and irony are not detected
- **No live fact-checking** — credibility is model confidence, not a Reuters/Wikipedia lookup
- **Dataset era mismatch** — training data is 2016–2018; newer terminology (COVID, 5G) underperforms
- **English only** — no multilingual support
- **Subjective bias labels** — political-lean ground truth is inherently contestable; model ceiling is bounded by dataset quality

<br/>

## Future Work

- Integrate BERT / transformer models for semantic-level understanding
- Move to dense retrieval with sentence embeddings
- Connect live news APIs and fact-checking databases
- Build human-annotated ground truth for IR evaluation (replacing keyword-based P@K)
- Add multilingual support
- Calibrate credibility scores with human-in-the-loop feedback

<br/>

## Project Structure

```
PERCEPT/
├── backend/                 # Flask API
│   └── main.py
├── frontend/                 # HTML / CSS / JS client
├── scripts/
│   ├── load_data.py          # Loads raw JSON datasets
│   ├── build_bm25.py          # Builds BM25 index
│   ├── build_faiss.py         # Builds dense retrieval index
│   └── train_classifier.py    # Trains Fake/Real & Bias models
├── data/
│   └── raw/                   # PERCEPT_WW1_50docs.json, PERCEPT_WW2_50docs_combined.json
└── requirements.txt
```

<br/>

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js & npm

### 1. Set up the environment

```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS/Linux
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Add data files

Place the following into `data/raw/`:

```
PERCEPT_WW1_50docs.json
PERCEPT_WW2_50docs_combined.json
```

### 4. Build indices & train models

```bash
cd scripts
python load_data.py
python build_bm25.py
python build_faiss.py
python train_classifier.py
```

### 5. Run the backend

```bash
cd backend
uvicorn main:app --reload
```

### 6. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

<div align="center">

*PERCEPT classifies narrative framing — not truth. Use credibility scores as a guide, not a verdict.*

</div>

---
