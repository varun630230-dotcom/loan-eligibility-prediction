import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { formatCurrency, formatPercentage, formatDate, formatPrediction } from '../utils/formatters';
import { toast } from 'react-hot-toast';

const HistoryPage = () => {
  const [predictions, setPredictions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.predictions.getHistory();
        const responseData = data.data || data;
        setPredictions(responseData.rows || []);
        setTotalCount(responseData.count || 0);
      } catch (error) {
        toast.error('Failed to load prediction history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Prediction History</h1>
        <span className="text-sm text-gray-500">{totalCount} total predictions</span>
      </div>
      
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        {predictions.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <p className="text-4xl mb-4">📋</p>
            <p className="mb-4">No predictions yet.</p>
            <Link to="/apply" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 inline-block">
              Apply for a Loan
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prediction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Model</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictions.map((item) => {
                  const predFormat = formatPrediction(item.prediction);
                  const loanAmount = item.Applicant?.loanAmount;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loanAmount ? formatCurrency(loanAmount) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={predFormat.color}>{predFormat.label}</Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatPercentage(parseFloat(item.probability))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.modelName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/prediction/${item.id}`} className="text-primary-600 hover:text-primary-900">
                          View Details →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
