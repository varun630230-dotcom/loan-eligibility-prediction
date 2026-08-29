CREATE DATABASE IF NOT EXISTS loanwise;
USE loanwise;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Applicants table (comprehensive underwriting profile)
CREATE TABLE IF NOT EXISTS applicants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  income DECIMAL(12,2) NOT NULL,
  co_applicant_income DECIMAL(12,2) DEFAULT 0,
  existing_monthly_debt DECIMAL(12,2) DEFAULT 0,
  total_asset_value DECIMAL(14,2) DEFAULT 0,
  loan_amount DECIMAL(12,2) NOT NULL,
  loan_term INT NOT NULL,
  loan_purpose VARCHAR(50) DEFAULT 'Home',
  property_value DECIMAL(14,2) NOT NULL,
  property_area VARCHAR(50) NOT NULL,
  credit_score INT DEFAULT 700,
  credit_history TINYINT NOT NULL DEFAULT 1,
  active_loans_count INT DEFAULT 0,
  employment_type VARCHAR(50) NOT NULL DEFAULT 'Salaried',
  work_experience_years INT DEFAULT 3,
  education VARCHAR(50) NOT NULL,
  employment_status VARCHAR(50) NOT NULL DEFAULT 'No',
  dependents VARCHAR(10) DEFAULT '0',
  married VARCHAR(10) DEFAULT 'No',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);

-- Predictions table
CREATE TABLE IF NOT EXISTS predictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_id INT NOT NULL,
  user_id INT NOT NULL,
  prediction VARCHAR(50) NOT NULL,
  probability DECIMAL(5,4) NOT NULL,
  model_name VARCHAR(100) NOT NULL,
  model_version VARCHAR(50) DEFAULT '2.0',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES applicants(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_applicant_id (applicant_id),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at)
);

-- Prediction explanations (SHAP values)
CREATE TABLE IF NOT EXISTS prediction_explanations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prediction_id INT NOT NULL,
  feature_name VARCHAR(100) NOT NULL,
  feature_value VARCHAR(255),
  shap_value DECIMAL(10,6) NOT NULL,
  contribution_type ENUM('positive', 'negative') NOT NULL,
  FOREIGN KEY (prediction_id) REFERENCES predictions(id) ON DELETE CASCADE,
  INDEX idx_prediction_id (prediction_id)
);

-- Model metrics
CREATE TABLE IF NOT EXISTS model_metrics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  model_name VARCHAR(100) NOT NULL,
  accuracy DECIMAL(5,4),
  precision_score DECIMAL(5,4),
  recall_val DECIMAL(5,4),
  f1_score DECIMAL(5,4),
  roc_auc DECIMAL(5,4),
  is_best_model BOOLEAN DEFAULT FALSE,
  training_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_model_name (model_name),
  INDEX idx_is_best (is_best_model)
);
