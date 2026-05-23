import os
import json
import torch
from transformers import DistilBertTokenizer, DistilBertForSequenceClassification, Trainer, TrainingArguments
from torch.utils.data import DataLoader, Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEANED_FILE = os.path.join(BASE_DIR, "data", "cleaned", "combined_100docs.json")
MODEL_DIR = os.path.join(BASE_DIR, "models", "distilbert_percept")

LABEL_MAP = {"Allied": 0, "Axis": 1, "Neutral": 2}

class DocumentDataset(Dataset):
    def __init__(self, texts, labels, tokenizer, max_length=512):
        self.texts = texts
        self.labels = labels
        self.tokenizer = tokenizer
        self.max_length = max_length

    def __len__(self):
        return len(self.texts)

    def __getitem__(self, idx):
        text = self.texts[idx]
        label = self.labels[idx]
        encoding = self.tokenizer(text, truncation=True, padding="max_length", max_length=self.max_length, return_tensors="pt")
        return {
            'input_ids': encoding['input_ids'].flatten(),
            'attention_mask': encoding['attention_mask'].flatten(),
            'labels': torch.tensor(label, dtype=torch.long)
        }

def compute_metrics(eval_pred):
    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)
    acc = accuracy_score(labels, predictions)
    f1 = f1_score(labels, predictions, average='weighted')
    return {'accuracy': acc, 'f1': f1}

def train():
    if not os.path.exists(CLEANED_FILE):
        print(f"Data file not found at {CLEANED_FILE}. Please run load_data.py first.")
        return

    with open(CLEANED_FILE, "r", encoding="utf-8") as f:
        docs = json.load(f)

    texts = []
    labels = []
    for doc in docs:
        if "text" in doc and "final_label" in doc:
            label_str = doc["final_label"]
            if label_str in LABEL_MAP:
                texts.append(doc["text"])
                labels.append(LABEL_MAP[label_str])

    if not texts:
        print("No valid documents found with 'text' and 'final_label'.")
        return

    # Train-test split (80/20)
    train_texts, val_texts, train_labels, val_labels = train_test_split(
        texts, labels, test_size=0.2, random_state=42, stratify=labels
    )

    print("Loading DistilBERT tokenizer and model...")
    tokenizer = DistilBertTokenizer.from_pretrained('distilbert-base-uncased')
    model = DistilBertForSequenceClassification.from_pretrained(
        'distilbert-base-uncased', 
        num_labels=3,
        id2label={0: "Allied", 1: "Axis", 2: "Neutral"},
        label2id={"Allied": 0, "Axis": 1, "Neutral": 2}
    )

    train_dataset = DocumentDataset(train_texts, train_labels, tokenizer)
    val_dataset = DocumentDataset(val_texts, val_labels, tokenizer)

    training_args = TrainingArguments(
        output_dir='./results',
        num_train_epochs=3,
        per_device_train_batch_size=8,
        per_device_eval_batch_size=8,
        learning_rate=2e-5,
        eval_strategy="epoch",
        save_strategy="epoch",
        logging_dir='./logs',
        load_best_model_at_end=True,
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    print("Starting training...")
    trainer.train()

    print("Evaluating model...")
    eval_results = trainer.evaluate()
    print(f"Evaluation Results: {eval_results}")

    os.makedirs(MODEL_DIR, exist_ok=True)
    print(f"Saving model to {MODEL_DIR}...")
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)
    print("Done!")

if __name__ == "__main__":
    train()
