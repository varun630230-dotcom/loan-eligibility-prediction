(() => {
  'use strict';

  const form = document.getElementById('prediction-form');
  const submitBtn = document.getElementById('submit-btn');
  const formErrorBanner = document.getElementById('form-error-banner');
  const resultPanel = document.getElementById('result-panel');
  const metricsTableBody = document.getElementById('metrics-table-body');
  let metricsChart = null;

  const pct = (v) => `${(Number(v) * 100).toFixed(2)}%`;
  const usd = (v) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(Number(v) || 0);

  function clearErrors() {
    formErrorBanner.hidden = true;
    formErrorBanner.textContent = '';
    form.querySelectorAll('.field').forEach((f) => f.classList.remove('has-error'));
    form.querySelectorAll('.error-msg').forEach((e) => { e.textContent = ''; });
  }

  function setError(name, msg) {
    const el = form.querySelector(`[data-error-for="${name}"]`);
    if (el) {
      el.textContent = msg;
      el.closest('.field')?.classList.add('has-error');
    }
  }

  function readAndValidate() {
    const fd = new FormData(form);
    const v = {
      ApplicantIncome: Number(fd.get('ApplicantIncome')),
      CoapplicantIncome: Number(fd.get('CoapplicantIncome') || 0),
      ExistingMonthlyDebt: Number(fd.get('ExistingMonthlyDebt') || 0),
      TotalAssetValue: Number(fd.get('TotalAssetValue') || 0),
      LoanAmount: Number(fd.get('LoanAmount')),
      Loan_Amount_Term: Number(fd.get('Loan_Amount_Term')),
      LoanPurpose: String(fd.get('LoanPurpose') || 'Home'),
      PropertyValue: Number(fd.get('PropertyValue')),
      Property_Area: String(fd.get('Property_Area') || ''),
      CreditScore: Number(fd.get('CreditScore')),
      Credit_History: Number(fd.get('Credit_History')),
      ActiveLoansCount: Number(fd.get('ActiveLoansCount') || 0),
      EmploymentType: String(fd.get('EmploymentType') || 'Salaried'),
      WorkExperienceYears: Number(fd.get('WorkExperienceYears') || 0),
      Education: String(fd.get('Education') || 'Graduate'),
      Dependents: String(fd.get('Dependents') || '0'),
      Married: String(fd.get('Married') || 'No'),
    };

    let ok = true;
    if (!(v.ApplicantIncome > 0)) { setError('ApplicantIncome', 'Must be greater than 0.'); ok = false; }
    if (v.CoapplicantIncome < 0) { setError('CoapplicantIncome', 'Cannot be negative.'); ok = false; }
    if (v.ExistingMonthlyDebt < 0) { setError('ExistingMonthlyDebt', 'Cannot be negative.'); ok = false; }
    if (v.TotalAssetValue < 0) { setError('TotalAssetValue', 'Cannot be negative.'); ok = false; }
    if (!(v.LoanAmount > 0)) { setError('LoanAmount', 'Must be greater than 0.'); ok = false; }
    if (!(v.PropertyValue > 0)) { setError('PropertyValue', 'Must be greater than 0.'); ok = false; }
    if (!v.Property_Area) { setError('Property_Area', 'Required.'); ok = false; }
    if (v.CreditScore < 300 || v.CreditScore > 850) { setError('CreditScore', 'Must be 300 to 850.'); ok = false; }
    if (v.ActiveLoansCount < 0) { setError('ActiveLoansCount', 'Cannot be negative.'); ok = false; }
    if (v.WorkExperienceYears < 0 || v.WorkExperienceYears > 60) { setError('WorkExperienceYears', 'Must be 0 to 60.'); ok = false; }

    if (!ok) return null;

    // Convert dollar fields to thousands ($k) expected by the preserved ML model
    return {
      ...v,
      TotalAssetValue: v.TotalAssetValue / 1000,
      LoanAmount: v.LoanAmount / 1000,
      PropertyValue: v.PropertyValue / 1000,
    };
  }

  function renderResult(data) {
    const isEligible = Boolean(data.eligible);
    const badge = document.getElementById('result-badge');
    badge.textContent = data.prediction;
    badge.className = `status-badge ${isEligible ? 'is-eligible' : 'is-ineligible'}`;

    document.getElementById('result-model').textContent = `Model: ${data.model}`;
    const p = Math.max(0, Math.min(100, Number(data.probability) * 100));
    document.getElementById('result-probability').textContent = `${p.toFixed(2)}%`;

    const bar = document.getElementById('result-prob-bar');
    bar.className = `prob-bar-fill ${isEligible ? 'is-eligible' : 'is-ineligible'}`;
    bar.style.width = `${p.toFixed(2)}%`;

    document.getElementById('result-explanation').textContent = data.explanation || '';

    const uw = data.underwriting || {};
    document.getElementById('ratio-dti').textContent = uw.dtiRatio !== undefined ? `${Number(uw.dtiRatio).toFixed(1)}%` : '—';
    document.getElementById('ratio-ltv').textContent = uw.ltvRatio !== undefined ? `${Number(uw.ltvRatio).toFixed(1)}%` : '—';
    document.getElementById('ratio-emi').textContent = uw.estimatedNewEMI !== undefined ? usd(uw.estimatedNewEMI) : '—';
    document.getElementById('ratio-disposable').textContent = uw.disposableIncome !== undefined ? usd(uw.disposableIncome) : '—';

    resultPanel.hidden = false;
    resultPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    clearErrors();
    const payload = readAndValidate();
    if (!payload) {
      formErrorBanner.textContent = 'Please fix the highlighted fields.';
      formErrorBanner.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Evaluating...';
    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.detail === 'string' ? data.detail : 'Prediction failed.');
      renderResult(data);
    } catch (err) {
      formErrorBanner.textContent = err.message;
      formErrorBanner.hidden = false;
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Predict Loan Eligibility';
    }
  });

  document.getElementById('reset-form').addEventListener('click', () => {
    clearErrors();
    form.reset();
    resultPanel.hidden = true;
  });

  async function loadMetrics() {
    try {
      const res = await fetch('/api/metrics');
      if (!res.ok) throw new Error('Failed to load metrics');
      const { models } = await res.json();

      metricsTableBody.innerHTML = models.map((m) => `
        <tr class="${m.is_selected ? 'is-selected' : ''}">
          <td>${m.model_name}</td>
          <td>${pct(m.test_accuracy)}</td>
          <td>${pct(m.test_precision)}</td>
          <td>${pct(m.test_recall)}</td>
          <td>${pct(m.test_f1)}</td>
          <td>${pct(m.test_roc_auc)}</td>
          <td>${m.is_selected ? '<span class="table-badge">Selected</span>' : 'Evaluated'}</td>
        </tr>
      `).join('');

      const canvas = document.getElementById('metrics-chart');
      if (canvas && typeof Chart !== 'undefined') {
        if (metricsChart) metricsChart.destroy();
        const toPct = (val) => Number((Number(val) * 100).toFixed(2));
        metricsChart = new Chart(canvas, {
          type: 'bar',
          data: {
            labels: models.map((m) => m.model_name),
            datasets: [
              { label: 'Accuracy', data: models.map((m) => toPct(m.test_accuracy)), backgroundColor: '#1d4ed8', borderRadius: 4 },
              { label: 'Precision', data: models.map((m) => toPct(m.test_precision)), backgroundColor: '#0d9488', borderRadius: 4 },
              { label: 'Recall', data: models.map((m) => toPct(m.test_recall)), backgroundColor: '#d97706', borderRadius: 4 },
              { label: 'F1-Score', data: models.map((m) => toPct(m.test_f1)), backgroundColor: '#6366f1', borderRadius: 4 },
              { label: 'ROC-AUC', data: models.map((m) => toPct(m.test_roc_auc)), backgroundColor: '#0f172a', borderRadius: 4 },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { min: 85, max: 100, ticks: { callback: (v) => `${v}%` } },
              x: { grid: { display: false } },
            },
          },
        });
      }
    } catch (_err) {
      metricsTableBody.innerHTML = '<tr><td colspan="7" class="loading-cell">Unable to load metrics.</td></tr>';
    }
  }

  loadMetrics();
})();
