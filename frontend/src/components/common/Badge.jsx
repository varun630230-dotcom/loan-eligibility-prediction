const Badge = ({ children, variant = 'info' }) => {
  const variants = {
    success: 'bg-success-100 text-success-800',
    danger: 'bg-danger-100 text-danger-800',
    warning: 'bg-warning-100 text-warning-800',
    info: 'bg-primary-100 text-primary-800'
  };

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${variants[variant] || variants.info}`}>
      {children}
    </span>
  );
};

export default Badge;
