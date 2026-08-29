const LoadingSpinner = ({ text }) => {
  return (
    <div className="flex flex-col justify-center items-center h-full min-h-[200px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      {text && <p className="mt-4 text-gray-600">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;
