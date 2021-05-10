import React from "react";

const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner-wrapper">
      <div className="loading-spinner"></div>
      <p className="loading-message">Please wait...</p>
    </div>
  );
};

export default LoadingSpinner;
