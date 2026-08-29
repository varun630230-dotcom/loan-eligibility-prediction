import pandas as pd
import numpy as np
import os
import json
import sys
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from xgboost import XGBClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

# Add ml-service to path so imports work correctly
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.preprocessing import LoanPreprocessor

def evaluate_model(model, X_train, y_train, X_test, y_test):
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_results = cross_validate(model, X_train, y_train, cv=cv, scoring=['accuracy', 'precision', 'recall', 'f1', 'roc_auc'])
    
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)
    y_proba = model.predict_proba(X_test)[:, 1] if hasattr(model, "predict_proba") else None
    
    metrics = {
        'cv_accuracy_mean': float(cv_results['test_accuracy'].mean()),
        'cv_accuracy_std': float(cv_results['test_accuracy'].std()),
        'cv_f1_mean': float(cv_results['test_f1'].mean()),
        'cv_f1_std': float(cv_results['test_f1'].std()),
        'test_accuracy': float(accuracy_score(y_test, y_pred)),
        'test_f1': float(f1_score(y_test, y_pred)),
        'test_precision': float(precision_score(y_test, y_pred)),
        'test_recall': float(recall_score(y_test, y_pred))
    }
    if y_proba is not None:
        metrics['test_roc_auc'] = float(roc_auc_score(y_test, y_proba))
        
    return metrics, model

def main():
    df = pd.read_csv('ml-service/data/loan_data.csv')
    df = df.dropna(subset=['Loan_Status'])
    
    X = df.drop(columns=['Loan_Status'])
    y = df['Loan_Status'].map({'Y': 1, 'N': 0})
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, stratify=y, random_state=42)
    
    preprocessor = LoanPreprocessor()
    X_train_proc = preprocessor.fit_transform(X_train)
    X_test_proc = preprocessor.transform(X_test)
    
    os.makedirs('ml-service/models', exist_ok=True)
    os.makedirs('ml-service/artifacts', exist_ok=True)
    
    preprocessor.save('ml-service/models/preprocessing_pipeline.joblib')
    with open('ml-service/models/feature_names.json', 'w') as f:
        json.dump(preprocessor.feature_names, f)
        
    models = {
        'LogisticRegression': LogisticRegression(max_iter=1000),
        'DecisionTree': DecisionTreeClassifier(max_depth=5, random_state=42),
        'RandomForest': RandomForestClassifier(n_estimators=100, random_state=42),
        'GradientBoosting': GradientBoostingClassifier(n_estimators=100, random_state=42),
        'XGBoost': XGBClassifier(n_estimators=100, eval_metric='logloss', random_state=42)
    }
    
    results = {}
    best_f1 = 0
    best_model_name = ""
    
    for name, model in models.items():
        metrics, trained_model = evaluate_model(model, X_train_proc, y_train, X_test_proc, y_test)
        results[name] = metrics
        joblib.dump(trained_model, f'ml-service/models/{name}.joblib')
        
        if metrics['test_f1'] > best_f1:
            best_f1 = metrics['test_f1']
            best_model_name = name
            
    with open('ml-service/artifacts/all_models_metrics.json', 'w') as f:
        json.dump(results, f, indent=4)
        
    print(f"Best model based on test F1: {best_model_name} with F1 = {best_f1:.4f}")

    # Save test data for tuning and evaluating
    pd.concat([X_train, y_train], axis=1).to_csv('ml-service/data/train.csv', index=False)
    pd.concat([X_test, y_test], axis=1).to_csv('ml-service/data/test.csv', index=False)

if __name__ == "__main__":
    main()
