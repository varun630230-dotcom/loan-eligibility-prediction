import { useState, useEffect } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts';
import { toast } from 'react-hot-toast';

const ModelPerformancePage = () => {
  const [metrics, setMetrics] = useState([]);
  const [bestModel, setBestModel] = useState(null);
  const [featureImportance, setFeatureImportance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        // Fetch model metrics from DB
        const { data: metricsRes } = await api.model.getMetrics();
        const metricsData = metricsRes.data || [];
        setMetrics(metricsData);
        
        // Find best model
        const best = metricsData.find(m => m.isBestModel) || metricsData[0];
        setBestModel(best);

        // Try to fetch feature importance from ML service via model info
        try {
          const { data: infoRes } = await api.model.getInfo();
          const info = infoRes.data || {};
          setFeatureImportance(info.features || []);
        } catch (e) {
          // Feature info is optional
        }
      } catch (error) {
        toast.error('Failed to load model metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (metrics.length === 0) return <div className="text-center text-gray-500 p-12">No model metrics available.</div>;

  // Format for grouped bar chart
  const modelData = metrics.map(m => ({
    name: m.modelName,
    Accuracy: (parseFloat(m.accuracy) * 100).toFixed(1),
    Precision: (parseFloat(m.precisionScore) * 100).toFixed(1),
    Recall: (parseFloat(m.recallVal) * 100).toFixed(1),
    F1: (parseFloat(m.f1Score) * 100).toFixed(1),
    'ROC-AUC': (parseFloat(m.rocAuc) * 100).toFixed(1),
    isBest: m.isBestModel
  }));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Model Performance</h1>
      
      {/* Best Model Card */}
      {bestModel && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-6 border border-primary-200">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏆</span>
            <h2 className="text-xl font-semibold text-primary-900">Best Model: {bestModel.modelName}</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Accuracy', value: bestModel.accuracy },
              { label: 'Precision', value: bestModel.precisionScore },
              { label: 'Recall', value: bestModel.recallVal },
              { label: 'F1 Score', value: bestModel.f1Score },
              { label: 'ROC-AUC', value: bestModel.rocAuc },
            ].map(({ label, value }) => (
              <div key={label} className="bg-white p-4 rounded-lg shadow-sm text-center">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</div>
                <div className="text-xl font-bold text-gray-900 mt-1">{(parseFloat(value) * 100).toFixed(1)}%</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model Comparison Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Model Comparison (%)</h3>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="Accuracy" fill="#3b82f6" />
              <Bar dataKey="Precision" fill="#10b981" />
              <Bar dataKey="Recall" fill="#f59e0b" />
              <Bar dataKey="F1" fill="#8b5cf6" />
              <Bar dataKey="ROC-AUC" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* All Models Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Detailed Metrics</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Model</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Accuracy</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Precision</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Recall</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">F1</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">ROC-AUC</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {metrics.map(m => (
                <tr key={m.id} className={m.isBestModel ? 'bg-primary-50' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {m.modelName} {m.isBestModel && <span className="text-primary-600 text-xs ml-1">★ Best</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{(parseFloat(m.accuracy) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{(parseFloat(m.precisionScore) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{(parseFloat(m.recallVal) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{(parseFloat(m.f1Score) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-sm text-center text-gray-500">{(parseFloat(m.rocAuc) * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4 text-sm text-center">
                    {m.isBestModel 
                      ? <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-700 rounded-full">Selected</span>
                      : <span className="text-gray-400">—</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Selection Note */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
        <p className="text-sm text-blue-700">
          <strong>Model Selection:</strong> The best model was selected based on F1-score comparison using stratified 5-fold cross-validation. 
          F1-score was chosen over accuracy to properly handle class imbalance in the dataset.
        </p>
      </div>
    </div>
  );
};

export default ModelPerformancePage;
