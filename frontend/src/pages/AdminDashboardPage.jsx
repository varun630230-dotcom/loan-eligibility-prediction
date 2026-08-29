import { useState, useEffect } from 'react';
import api from '../services/api';
import StatsCard from '../components/dashboard/StatsCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Badge from '../components/common/Badge';
import { formatPercentage, formatPrediction, formatDate, formatCurrency } from '../utils/formatters';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-hot-toast';

const COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b'];

const AdminDashboardPage = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [statisticsData, setStatisticsData] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashRes, statsRes, usersRes] = await Promise.all([
          api.admin.getDashboard(),
          api.admin.getStatistics(),
          api.admin.getUsers()
        ]);
        setDashboardData(dashRes.data.data);
        setStatisticsData(statsRes.data.data);
        setUsersList(usersRes.data.data || []);
      } catch (error) {
        toast.error('Failed to load admin dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (!dashboardData) return <div className="text-center text-gray-500 p-8">No dashboard data available</div>;

  const {
    totalUsers = 0,
    totalApplications = 0,
    totalPredictions = 0,
    approvalRate = 0,
    averageProbability = 0,
    recentPredictions = []
  } = dashboardData;

  // Build Pie chart data for prediction distribution
  const distributionData = statisticsData?.predictionDistribution?.map((item, idx) => ({
    name: item.prediction,
    value: parseInt(item.count, 10),
    color: item.prediction.includes('Eligible') && !item.prediction.includes('Not') ? '#22c55e' : '#ef4444'
  })) || [
    { name: 'Eligible', value: Math.round((totalPredictions * approvalRate) / 100), color: '#22c55e' },
    { name: 'Not Eligible', value: totalPredictions - Math.round((totalPredictions * approvalRate) / 100), color: '#ef4444' }
  ];

  // Trends data
  const trendsData = statisticsData?.predictionTrends?.map(item => ({
    date: item.date,
    applications: parseInt(item.count, 10)
  })) || [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Control Center</h1>
        <p className="text-gray-500 mt-1">Platform analytics, model health monitoring, and system metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Total Registered Users" value={totalUsers} icon="👥" />
        <StatsCard title="Total Applications" value={totalApplications} icon="📝" />
        <StatsCard title="Approval Rate" value={`${parseFloat(approvalRate).toFixed(1)}%`} icon="📈" />
        <StatsCard title="Avg Probability" value={formatPercentage(averageProbability)} icon="📊" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Distribution Pie */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Prediction Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} applications`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Prediction Trends Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Prediction Activity</h3>
          <div className="h-64">
            {trendsData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendsData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="applications" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <span>Daily activity history will render as traffic grows</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-medium text-gray-900">Recent Applications Stream</h3>
        </div>
        {recentPredictions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No applications recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">App ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loan Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prediction</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Probability</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Timestamp</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentPredictions.map((pred) => {
                  const format = formatPrediction(pred.prediction);
                  return (
                    <tr key={pred.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">#{pred.id}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {pred.User ? `${pred.User.name} (${pred.User.email})` : `User #${pred.userId}`}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {pred.Applicant?.loanAmount ? formatCurrency(pred.Applicant.loanAmount) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={format.color}>{format.label}</Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatPercentage(parseFloat(pred.probability))}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">
                        {formatDate(pred.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Registered Users Summary */}
      {usersList.length > 0 && (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-medium text-gray-900">System Users ({usersList.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Member Since</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {usersList.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-500">#{u.id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">{u.email}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">{formatDate(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
