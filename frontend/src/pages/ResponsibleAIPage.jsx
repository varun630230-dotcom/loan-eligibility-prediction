const ResponsibleAIPage = () => {
  const considerations = [
    {
      title: 'Model Limitations',
      icon: '⚠️',
      color: 'warning',
      content: 'The model is trained on a limited dataset and may not capture all factors relevant to lending decisions. It should not be used as the sole basis for lending decisions.'
    },
    {
      title: 'Dataset Limitations',
      icon: '📊',
      color: 'info',
      content: 'The training data may not represent all populations equally. The model\'s predictions may be less accurate for underrepresented groups.'
    },
    {
      title: 'Potential Bias',
      icon: '⚖️',
      color: 'danger',
      content: 'Historical lending data may contain systemic biases. While we\'ve excluded directly sensitive demographic attributes from predictions, proxy bias through correlated features may still exist.'
    },
    {
      title: 'Fairness Considerations',
      icon: '🤝',
      color: 'primary',
      content: 'We recommend monitoring prediction outcomes across demographic groups and adjusting the model if disparate impact is detected. Gender has been excluded from prediction features.'
    },
    {
      title: 'Explainability',
      icon: '🔍',
      color: 'success',
      content: 'Every prediction comes with SHAP-based explanations showing which factors influenced the decision and by how much. This transparency helps identify potential issues.'
    },
    {
      title: 'Data Privacy',
      icon: '🔒',
      color: 'info',
      content: 'Applicant information is stored securely. Data is used only for prediction purposes within this system.'
    },
    {
      title: 'Human Review',
      icon: '👁️‍🗨️',
      color: 'primary',
      content: 'This system is designed as a decision-support tool. All predictions should be reviewed by qualified lending professionals before any actual lending decisions are made.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-4">Responsible AI in Lending</h1>
        <p className="text-lg text-gray-600">
          We are committed to fair, transparent, and accountable use of artificial intelligence in our loan eligibility prediction system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {considerations.map((item, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border-l-4" style={{ borderColor: `var(--color-${item.color}-500, #3b82f6)` }}>
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-3">{item.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">{item.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ResponsibleAIPage;
