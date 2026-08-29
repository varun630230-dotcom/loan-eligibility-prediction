import { Routes, Route } from 'react-router-dom';
import Layout from './components/common/Layout';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminRoute from './components/common/AdminRoute';
import { AuthProvider } from './context/AuthContext';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ApplicationPage from './pages/ApplicationPage';
import PredictionPage from './pages/PredictionPage';
import HistoryPage from './pages/HistoryPage';
import ModelPerformancePage from './pages/ModelPerformancePage';
import ProfilePage from './pages/ProfilePage';
import AdminDashboardPage from './pages/AdminDashboardPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<DashboardPage />} />
          <Route path="apply" element={<ApplicationPage />} />
          <Route path="prediction/:id" element={<PredictionPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="model-performance" element={<ModelPerformancePage />} />
          <Route path="profile" element={<ProfilePage />} />
          
          <Route path="admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
