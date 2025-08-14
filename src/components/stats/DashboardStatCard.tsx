import React from 'react';
import '../styles/DashboardStatCard.css'; // Imports its own, separate CSS file
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

// Renamed interface
interface DashboardStatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  size?: 'default' | 'small';
  onClick?: () => void; // Optional click handler
}

// Renamed component
const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  title,
  value,
  icon,
  size = 'default',
  onClick
}) => {
  return (
    <div
      className={`dashboard-stat-card stat-card-${size}`}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      <div className="stat-card-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-value">{value}</div>
      </div>
    </div>
  );
};

export default DashboardStatCard;
