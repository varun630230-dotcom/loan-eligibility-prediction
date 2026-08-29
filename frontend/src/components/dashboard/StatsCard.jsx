const StatsCard = ({ title, value, icon, change }) => {
  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg">
      <div className="p-5">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <span className="text-3xl">{icon}</span>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-medium text-gray-900">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {change && (
        <div className="bg-gray-50 px-5 py-3">
          <div className="text-sm">
            <span className={change.startsWith('+') ? 'text-success-600' : 'text-danger-600'}>
              {change}
            </span>
            <span className="text-gray-500 ml-2">from last month</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCard;
