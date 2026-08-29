import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600 flex items-center gap-2">
                <span>🏦</span> LoanWise
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500 text-sm font-medium">Dashboard</Link>
              <Link to="/apply" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500 text-sm font-medium">Apply for Loan</Link>
              <Link to="/history" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500 text-sm font-medium">History</Link>
              <Link to="/model-performance" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-primary-500 text-sm font-medium">Model Intelligence</Link>
              {isAdmin && (
                <Link to="/admin" className="text-purple-600 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-purple-500 text-sm font-medium">Admin Portal</Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            <div className="ml-3 relative group">
              <div className="flex items-center space-x-3 cursor-pointer py-2">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                  {user?.name?.[0]?.toUpperCase()}
                </div>
              </div>
              <div className="absolute right-0 w-48 mt-1 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="py-1">
                  <Link to="/profile" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">My Profile</Link>
                  <button onClick={logout} className="block w-full text-left px-4 py-2 text-sm text-danger-600 hover:bg-danger-50">Sign Out</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
