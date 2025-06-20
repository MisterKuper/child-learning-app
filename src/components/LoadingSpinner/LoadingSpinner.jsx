import React from "react";
import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="spinner-container">
      <svg className="spinner-svg" viewBox="0 0 50 50">
        <circle
          className="spinner-circle"
          cx="25"
          cy="25"
          r="20"
          fill="none"
          stroke="var(--primary-color)"
          strokeWidth="5"
        />
      </svg>
    </div>
  );
};

export default LoadingSpinner;
