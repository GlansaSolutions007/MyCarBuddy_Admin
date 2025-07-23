const FormError = ({ error }) => {
  if (!error) return null;
  return <div className="text-danger mt-1 text-sm">{error}</div>;
};

export default FormError;