USE loanwise;

-- Insert users
INSERT INTO users (name, email, password_hash, role) VALUES
('Admin', 'admin@loanwise.com', '$2a$12$LJ3m4ys3Lf0Xg0gRD0FBzu1pGFdBmOF0.H8oUanJSCjyN2n3JMWXK', 'admin'),
('Demo User', 'demo@loanwise.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi.', 'user');

-- Insert model metrics
INSERT INTO model_metrics (model_name, accuracy, precision_score, recall_val, f1_score, roc_auc, is_best_model) VALUES
('Logistic Regression', 0.7895, 0.7950, 0.9100, 0.8486, 0.7550, FALSE),
('Decision Tree', 0.7105, 0.7400, 0.8800, 0.8040, 0.6700, FALSE),
('Random Forest', 0.7895, 0.7800, 0.9300, 0.8486, 0.7800, FALSE),
('Gradient Boosting', 0.8026, 0.8000, 0.9200, 0.8558, 0.7900, FALSE),
('XGBoost', 0.8158, 0.8100, 0.9300, 0.8660, 0.8100, TRUE);
