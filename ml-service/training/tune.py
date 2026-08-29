import pandas as pd
import os
import json
import joblib
import datetime
import sys
from xgboost import XGBClassifier
from sklearn.model_selection import RandomizedSearchCV, StratifiedKFold

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.preprocessing import LoanPreprocessor

def main():
    # Load training data
    df_train = pd.read_csv('ml-service/data/train.csv')
    X_train = df_train.drop(columns=['Loan_Status'])
    y_train = df_train['Loan_Status']
    
    preprocessor = LoanPreprocessor.load('ml-service/models/preprocessing_pipeline.joblib')
    X_train_proc = preprocessor.transform(X_train)
    
    param_grid = {
        'learning_rate': [0.01, 0.05, 0.1, 0.2, 0.3],
        'max_depth': [3, 4, 5, 6, 7, 8],
        'n_estimators': [50, 100, 150, 200, 300],
        'subsample': [0.6, 0.7, 0.8, 0.9, 1.0],
        'colsample_bytree': [0.6, 0.7, 0.8, 0.9, 1.0],
        'min_child_weight': [1, 3, 5, 7]
    }
    
    xgb = XGBClassifier(eval_metric='logloss', random_state=42)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    search = RandomizedSearchCV(
        estimator=xgb,
        param_distributions=param_grid,
        n_iter=30,
        scoring='f1',
        cv=cv,
        random_state=42,
        n_jobs=-1
    )
    
    search.fit(X_train_proc, y_train)
    
    best_model = search.best_estimator_
    joblib.dump(best_model, 'ml-service/models/best_model.joblib')
    
    best_params = search.best_params_
    with open('ml-service/artifacts/best_params.json', 'w') as f:
        json.dump({k: float(v) if isinstance(v, (int, float)) else v for k, v in best_params.items()}, f, indent=4)
        
    metadata = {
        'name': 'XGBoost_Tuned',
        'params': {k: float(v) if isinstance(v, (int, float)) else v for k, v in best_params.items()},
        'date': datetime.datetime.now().isoformat(),
        'version': '1.0'
    }
    with open('ml-service/models/model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=4)
        
    print("Tuning completed and best model saved.")

if __name__ == "__main__":
    main()
