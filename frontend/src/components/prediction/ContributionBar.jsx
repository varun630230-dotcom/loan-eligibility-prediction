const ContributionBar = ({ feature, value, originalValue, isPositive }) => {
  const maxAbsValue = 1.0; // Assume 1.0 is max for scaling, adjust as needed or pass as prop
  const percentage = Math.min((Math.abs(value) / maxAbsValue) * 100, 100);

  return (
    <div className="flex items-center justify-between mb-2">
      <div className="w-1/3 truncate pr-2 text-sm text-gray-700">
        {feature} <span className="text-gray-400 text-xs">({originalValue})</span>
      </div>
      <div className="w-1/2 flex items-center">
        <div className="w-full bg-gray-200 rounded-full h-2.5 flex">
          <div
            className={`h-2.5 rounded-full ${isPositive ? 'bg-success-500' : 'bg-danger-500'}`}
            style={{ width: `${percentage}%`, marginLeft: isPositive ? 'auto' : '0' }}
          ></div>
        </div>
      </div>
      <div className="w-1/6 text-right text-xs font-semibold">
        {isPositive ? '+' : ''}{value.toFixed(4)}
      </div>
    </div>
  );
};

export default ContributionBar;
