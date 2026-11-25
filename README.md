# Loan Eligibility Prediction

A clean Machine Learning web application that predicts loan eligibility using a preserved Scikit-learn preprocessing pipeline and a tuned **XGBoost** classifier, served via **FastAPI** with an **HTML / CSS / Vanilla JavaScript** frontend.

## Project Structure

```text
loan-eligibility-system/
├── ml/
│   ├── data/                  # Dataset & train/test splits (loan_data.csv, train.csv, test.csv)
│   ├── preprocessing/         # Preserved UnderwritingFeatureEngineer & LoanPreprocessor
│   ├── models/                # Serialized models & preprocessing_pipeline.joblib
│   ├── artifacts/             # Recorded evaluation metrics & best_params.json
│   ├── training/              # Original train, tune, and evaluate scripts
│   └── predict.py             # LoanPredictor inference wrapper
├── backend/
│   ├── main.py                # FastAPI server (/api/health, /api/predict, /api/metrics + UI)
│   └── requirements.txt       # Python dependencies
├── frontend/
│   ├── index.html             # Single-page UI (Home, Form, Results, Performance, About)
│   ├── css/
│   │   └── style.css          # Fintech-inspired responsive styling
│   └── js/
│       └── app.js             # Form validation, API calls, Chart.js comparison chart
├── tests/
│   └── test_app.py            # Unified ML & API test suite
├── README.md
└── .gitignore
```

## Recorded Model Performance

Five algorithms were evaluated on the 1,200-record stratified test split (`ml/data/test.csv`):

| Model | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Logistic Regression | 91.42% | 92.29% | 95.53% | 93.88% | 97.28% |
| Decision Tree | 93.83% | 93.83% | 97.46% | 95.61% | 95.36% |
| Random Forest | 93.67% | 93.71% | 97.34% | 95.49% | 98.26% |
| Gradient Boosting | 95.58% | 95.10% | 98.67% | 96.85% | 99.16% |
| **XGBoost (Selected)** | **95.08%** | **95.18%** | **97.82%** | **96.48%** | **99.12%** |

Recorded tuned XGBoost hyperparameters (`ml/artifacts/best_params.json`):
- `n_estimators`: `300`
- `max_depth`: `3`
- `learning_rate`: `0.1`
- `subsample`: `0.6`
- `colsample_bytree`: `0.8`
- `min_child_weight`: `5`

## How to Run

1. Install dependencies:
   ```bash
   pip install -r backend/requirements.txt
   ```
2. Start the FastAPI server from the project root:
   ```bash
   uvicorn backend.main:app --reload --port 8000
   ```
3. Open `http://localhost:8000` in your browser (API docs: `http://localhost:8000/docs`).

## Running Tests

```bash
python -m pytest tests/test_app.py -v
```
