import pandas as pd
import json
import joblib
import sys
import os
from sklearn.metrics import classification_report, confusion_matrix, roc_curve, roc_auc_score

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from preprocessing.preprocessing import LoanPreprocessor

def main():
    df_test = pd.read_csv('ml/data/test.csv')
    X_test = df_test.drop(columns=['Loan_Status'])
    y_test = df_test['Loan_Status']
    
    preprocessor = LoanPreprocessor.load('ml/models/preprocessing_pipeline.joblib')
    X_test_proc = preprocessor.transform(X_test)
    
    model = joblib.load('ml/models/best_model.joblib')
    
    y_pred = model.predict(X_test_proc)
    y_proba = model.predict_proba(X_test_proc)[:, 1]
    
    report = classification_report(y_test, y_pred, output_dict=True)
    with open('ml/artifacts/classification_report.json', 'w') as f:
        json.dump(report, f, indent=4)
        
    cm = confusion_matrix(y_test, y_pred)
    with open('ml/artifacts/confusion_matrix.json', 'w') as f:
        json.dump(cm.tolist(), f)
        
    fpr, tpr, thresholds = roc_curve(y_test, y_proba)
    roc_data = {
        'fpr': fpr.tolist(),
        'tpr': tpr.tolist(),
        'thresholds': thresholds.tolist(),
        'auc': float(roc_auc_score(y_test, y_proba))
    }
    with open('ml/artifacts/roc_curve.json', 'w') as f:
        json.dump(roc_data, f)
        
    if hasattr(model, 'feature_importances_'):
        importances = model.feature_importances_
        features = preprocessor.feature_names
        feat_imp = sorted([{'feature': f, 'importance': float(i)} for f, i in zip(features, importances)], key=lambda x: x['importance'], reverse=True)
        with open('ml/artifacts/feature_importance.json', 'w') as f:
            json.dump(feat_imp, f, indent=4)
            
    print("Evaluation completed and artifacts saved.")

if __name__ == "__main__":
    main()
