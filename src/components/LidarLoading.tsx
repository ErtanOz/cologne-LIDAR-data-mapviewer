import React from 'react';
import './LidarLoading.css';

interface LidarLoadingProps {
  progress?: number;
  pointsLoaded?: number;
  isLoading: boolean;
}

const LidarLoading: React.FC<LidarLoadingProps> = ({ progress, pointsLoaded, isLoading }) => {
  if (!isLoading) return null;

  const displayPoints = pointsLoaded 
    ? (pointsLoaded / 1000000).toFixed(2) + 'M' 
    : null;

  return (
    <div className="lidar-loading-overlay">
      <div className="lidar-loading-card">
        <div className="loading-header">
          <div className="loading-title">
            <span>Loading</span>
            <span className="dot-one">.</span>
            <span className="dot-two">.</span>
            <span className="dot-three">.</span>
          </div>
          {displayPoints && (
            <div className="loading-stats">
              {displayPoints} points processed
            </div>
          )}
        </div>
        
        <div className="progress-container">
          <div 
            className="progress-bar-fill" 
            style={{ width: `${progress ?? 0}%` }}
          />
          <div className="progress-shimmer" />
        </div>

        <div className="technical-details">
          <div className="detail-item">
            <span className="detail-label">SENSOR STATUS:</span>
            <span className="detail-value active">ACTIVE</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">DATA STREAM:</span>
            <span className="detail-value pulse">SYNCING</span>
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="scanning-grid"></div>
      <div className="decor-ring ring-1"></div>
      <div className="decor-ring ring-2"></div>
    </div>
  );
};

export default LidarLoading;
