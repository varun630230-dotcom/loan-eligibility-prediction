import sys
from pathlib import Path
import pandas as pd
from fastapi.testclient import TestClient

ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(ROOT_DIR / "ml"))

from backend.main import app  # noqa: E402
from predict import LoanPredictor  # noqa: E402
from preprocessing.preprocessing import UnderwritingFeatureEngineer  # noqa: E402

SAMPLE_PAYLOAD = {
    "ApplicantIncome": 6000,
    "CoapplicantIncome": 1500,
    "ExistingMonthlyDebt": 500,
    "TotalAssetValue": 80,
    "LoanAmount": 200,
    "Loan_Amount_Term": 360,
    "LoanPurpose": "Home",
    "PropertyValue": 280,
    "Property_Area": "Urban",
    "CreditScore": 740,
    "Credit_History": 1.0,
    "ActiveLoansCount": 1,
    "EmploymentType": "Salaried",
    "WorkExperienceYears": 5,
    "Education": "Graduate",
    "Dependents": "0",
    "Married": "Yes",
}


def test_feature_engineering():
    fe = UnderwritingFeatureEngineer()
    df = pd.DataFrame([{k: SAMPLE_PAYLOAD[k] for k in fe.num_input_cols}])
    out = fe.transform(df)
    for col in ("DTI_Ratio", "LTV_Ratio", "AssetCoverageRatio", "DisposableIncome", "EstimatedNewEMI"):
        assert col in out.columns


def test_predictor_direct():
    predictor = LoanPredictor()
    res = predictor.predict(SAMPLE_PAYLOAD)
    assert res["prediction"] in (0, 1)
    assert 0.0 <= res["probability"] <= 1.0
    assert "dtiRatio" in res["underwriting"]


def test_api_endpoints():
    with TestClient(app) as client:
        assert client.get("/").status_code == 200
        assert client.get("/css/style.css").status_code == 200
        assert client.get("/js/app.js").status_code == 200

        health = client.get("/api/health")
        assert health.status_code == 200
        assert health.json()["status"] == "healthy"

        metrics = client.get("/api/metrics")
        assert metrics.status_code == 200
        mdata = metrics.json()
        assert len(mdata["models"]) == 5
        assert mdata["selected_model"]["id"] == "XGBoost"

        pred = client.post("/api/predict", json=SAMPLE_PAYLOAD)
        assert pred.status_code == 200
        pdata = pred.json()
        assert pdata["prediction"] in ("Eligible", "Not Eligible")
        assert 0.0 <= pdata["probability"] <= 1.0

        invalid = dict(SAMPLE_PAYLOAD, ApplicantIncome=-50)
        assert client.post("/api/predict", json=invalid).status_code == 422
