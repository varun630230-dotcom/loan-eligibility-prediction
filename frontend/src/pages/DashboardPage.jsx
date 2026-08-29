import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import api from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import Badge from '../components/common/Badge';
import { formatCurrency, formatPercentage, formatDate, formatPrediction } from '../utils/formatters';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';

const DashboardPage = () => {
  const { user } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data } = await api.predictions.getHistory();
        // Backend returns { success, data: { count, rows } }
        const responseData = data.data || data;
        setPredictions((responseData.rows || []).slice(0, 5));
        setTotalCount(responseData.count || 0);
      } catch (error) {
        // No predictions yet is not an error state
        setPredictions([]);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) return <LoadingSpinner />;

  const latestPrediction = predictions[0];
  const avgProbability = predictions.length
    ? predictions.reduce((acc, curr) => acc + parseFloat(curr.probability || 0), 0) / predictions.length
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name} 👋</h1>
        <Link to="/apply" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium">
          + Apply for New Loan
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard title="Total Applications" value={totalCount} icon="📝" />
        <StatsCard 
          title="Latest Prediction" 
          value={latestPrediction 
            ? <Badge variant={formatPrediction(latestPrediction.prediction).color}>{formatPrediction(latestPrediction.prediction).label}</Badge> 
            : 'N/A'
          } 
          icon="🎯" 
        />
        <StatsCard title="Average Probability" value={formatPercentage(avgProbability)} icon="📊" />
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Recent Predictions</h3>
          {predictions.length > 0 && (
            <Link to="/history" className="text-sm text-primary-600 hover:text-primary-800">View All →</Link>
          )}
        </div>
        {predictions.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 mb-4">No predictions yet. Apply for a loan to get started.</p>
            <Link to="/apply" className="text-primary-600 hover:text-primary-800 font-medium">Submit Your First Application →</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Result</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {predictions.map((item) => {
                  const predFormat = formatPrediction(item.prediction);
                  const loanAmount = item.Applicant?.loanAmount || 'N/A';
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{typeof loanAmount === 'number' ? formatCurrency(loanAmount) : loanAmount}</td>
                      <td className="px-6 py-4 whitespace-nowrap"><Badge variant={predFormat.color}>{predFormat.label}</Badge></td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercentage(parseFloat(item.probability))}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link to={`/prediction/${item.id}`} className="text-primary-600 hover:text-primary-900">View Details</Link>
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

export default DashboardPage;
