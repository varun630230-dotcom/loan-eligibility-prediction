import { Link, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Sidebar = () => {
  const { isAdmin } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/', label: 'Overview Dashboard', icon: '📊' },
    { to: '/apply', label: 'Loan Application', icon: '📝' },
    { to: '/history', label: 'Prediction History', icon: '📁' },
    { to: '/model-performance', label: 'Model Intelligence', icon: '🧠' },
    { to: '/profile', label: 'Account Profile', icon: '👤' }
  ];

  if (isAdmin) {
    links.push({ to: '/admin', label: 'Admin Analytics', icon: '⚙️' });
  }

  return (
    <div className="w-64 bg-white shadow-sm border-r h-full min-h-[calc(100vh-4rem)]">
      <div className="py-4">
        <ul className="space-y-1">
          {links.map((link) => {
            const isActive = location.pathname === link.to;
            return (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${isActive ? 'bg-primary-50 text-primary-700 border-r-4 border-primary-500' : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  <span className="mr-3 text-lg">{link.icon}</span>
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;
