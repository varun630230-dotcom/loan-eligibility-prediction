export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

export const formatPercentage = (value) => {
  return `${(value * 100).toFixed(2)}%`;
};

export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString();
};

export const formatPrediction = (prediction) => {
  if (prediction === 'Likely Eligible' || prediction === 'Eligible' || prediction === 1) {
    return { label: 'Likely Eligible', color: 'success' };
  }
  return { label: 'Likely Not Eligible', color: 'danger' };
};
