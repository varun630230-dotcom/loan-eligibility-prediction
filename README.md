# LoanWise – Explainable Machine Learning-Based Loan Eligibility Prediction Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue.svg)](https://www.python.org/)
[![Node: 20+](https://img.shields.io/badge/Node-20%2B-green.svg)](https://nodejs.org/)
[![React: 18](https://img.shields.io/badge/React-18-cyan.svg)](https://react.dev/)
[![Docker: Ready](https://img.shields.io/badge/Docker-Compose-2496ED.svg)](https://www.docker.com/)

**LoanWise** is an end-to-end, production-grade decision-support platform that evaluates applicant financial profiles and estimates loan eligibility using specialized tabular machine learning models (XGBoost, Gradient Boosting, Random Forest) coupled with **SHAP (SHapley Additive exPlanations)** for localized and global explainability.

> ⚠️ **Disclaimer:** LoanWise is an educational and decision-support tool. It is not an automated real-world credit approval system. Real-world lending involves human underwriting, regulatory compliance, and broader financial contexts.

---

## 🌟 Key Features

- 🧠 **Specialized Tabular ML:** Multi-model comparative pipeline benchmarking Logistic Regression (baseline), Decision Trees, Random Forests, Gradient Boosting, and tuned XGBoost using Stratified 5-Fold Cross Validation.
- 🔍 **Explainable AI (XAI):** Feature-level localized and global attribution via SHAP TreeExplainer, isolating top positive and negative drivers behind individual predictions.
- 🛡️ **Responsible AI & Fairness:** Explicit exclusion of sensitive demographic attributes (e.g., gender) from inference features to prevent bias propagation; dedicated Responsible AI transparency portal.
- 🔐 **Secure Full-Stack Architecture:** Strict decoupling between React UI, Node.js/Express API gateway (JWT authentication, bcrypt, Joi validation, rate limiting, Helmet), MySQL persistence, and isolated Python FastAPI inference service.
- 📊 **Interactive Analytics & Audit:** Full prediction history, SHAP waterfall and contribution visualizations (Recharts), and a dedicated administrative intelligence dashboard.
- 🐳 **Containerized Deployment:** Multi-stage Dockerfiles and `docker-compose.yml` with health checks and network isolation.

---

## 🏗️ System Architecture

```text
                    +------------------------+
                    |   React.js Frontend    |
                    | (Vite, Tailwind, XAI)  |
                    +-----------+------------+
                                |
                                | REST API (JWT)
                                v
                    +------------------------+
                    | Node.js + Express API  |
                    | (Auth, ORM, Validation)|
                    +-----+------------+-----+
                          |            |
             +------------+            +-------------+
             |                                       |
             v                                       v
    +-----------------+                     +-----------------+
    |  MySQL Database |                     | Python FastAPI  |
    | (Users, History,|                     |   ML Service    |
    |  SHAP Explains) |                     +--------+--------+
    +-----------------+                              |
                                                     v
                                            +-----------------+
                                            | Preprocessing & |
                                            | Scikit Pipeline |
                                            +--------+--------+
                                                     |
                                                     v
                                            +-----------------+
                                            | Tuned XGBoost / |
                                            | Ensemble Models |
                                            +---+---------+---+
                                                |         |
                                                v         v
                                           Prediction   SHAP
                                           [Prob, Y/N] [Forces]
```

---

## 📊 Machine Learning Pipeline & Performance

### 1. Algorithms Evaluated (5-Fold Stratified CV)
1. **Logistic Regression (Baseline)**
2. **Decision Tree Classifier**
3. **Random Forest Classifier**
4. **Gradient Boosting Classifier**
5. **XGBoost (Hyperparameter Tuned)**

### 2. Feature Engineering & Preprocessing
- **Leakage-Free Transformation:** Imputation, log transforms (`ApplicantIncome`, `LoanAmount`, `TotalIncome`), one-hot encoding, and scaling encapsulated in a serialized `ColumnTransformer` pipeline.
- **Engineered Ratios:**
  - $\text{TotalIncome} = \text{ApplicantIncome} + \text{CoapplicantIncome}$
  - $\text{IncomeToLoanRatio} = \frac{\text{TotalIncome}}{\text{LoanAmount} \times 1000}$
  - $\text{EMI} = \frac{\text{LoanAmount} \times 1000}{\text{Loan\_Amount\_Term}}$
  - $\text{BalanceIncome} = \text{TotalIncome} - (\text{EMI} \times 1000)$

### 3. Hyperparameter Tuning (RandomizedSearchCV)
- `n_estimators`: 300
- `max_depth`: 6
- `learning_rate`: 0.05
- `subsample`: 1.0
- `colsample_bytree`: 0.8
- `min_child_weight`: 3

---

## 🚀 Quick Start with Docker Compose

Ensure [Docker](https://www.docker.com/) and Docker Compose are installed.

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/loan-eligibility-system.git
cd loan-eligibility-system

# 2. Copy environment file
cp .env.example .env

# 3. Build and launch all services
docker-compose up --build
```

### Services Endpoint Map:
- **Frontend App:** `http://localhost:3000`
- **Backend API Gateway:** `http://localhost:5000`
- **FastAPI ML Service:** `http://localhost:8000` (Docs: `http://localhost:8000/docs`)
- **MySQL Database:** `localhost:3306`

---

## 💻 Local Development Setup

### 1. Python ML Service
```bash
cd ml-service
python -m venv venv
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

pip install -r requirements.txt

# Run pipeline
python data/generate_dataset.py
python training/train.py
python training/tune.py
python training/evaluate.py

# Start FastAPI server
uvicorn app:app --reload --port 8000
```

### 2. Node.js Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

### 3. React Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Testing

### Machine Learning Unit & Integration Tests:
```bash
cd ml-service
pytest tests/ -v
```

### Node.js Backend Tests:
```bash
cd backend
npm test
```

### Frontend Tests:
```bash
cd frontend
npm test
```

---

## 🛡️ Responsible AI Principles

1. **Bias Mitigation:** Direct exclusion of sensitive demographic markers (e.g., gender) from model feature sets.
2. **Transparent Decision Support:** Instant generation of SHAP force contributions accompanying every probability score.
3. **No Unchecked Automation:** Explicit human-in-the-loop recommendations embedded into every user response.

---

## 💼 Resume Positioning

- **Full-Stack ML Engineering:** Engineered an explainable financial decision-support platform using React.js, Node.js, Express.js, MySQL, and a dedicated Python FastAPI inference microservice.
- **Advanced Tabular Modeling:** Benchmarked 5 machine learning classification algorithms with stratified 5-fold cross validation, optimizing hyperparameter configurations for gradient boosting.
- **Explainable AI (XAI):** Integrated SHAP (SHapley Additive exPlanations) to isolate positive and negative feature attributions for loan eligibility estimations in real-time.
- **Secure Architecture:** Implemented role-based JWT authentication, rate limiting, parameterized queries, and strict input validation schemas across microservices.
- **Containerized Orchestration:** Dockerized the full multi-tier ecosystem with health checking and isolated internal service networking.
