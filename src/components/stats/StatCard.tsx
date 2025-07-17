import React from 'react';
import '../styles/statCard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: IconDefinition;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'dark';
  subtitle?: string;
  chartData?: number[]; // Array of values for the mini bar chart
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend,
  variant = 'primary',
  subtitle,
  chartData,
  onClick
}) => {
  // Find the max value for scaling the chart
  const maxValue = chartData ? Math.max(...chartData) : 0;
  
  // Format value for tooltip
  const formatTooltipValue = (value: number): string => {
    if (title.toLowerCase().includes('donation')) {
      // Format as currency for donation values
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    } else {
      // Format as number for other values
      return typeof value === 'number' && value % 1 === 0 
        ? value.toString() 
        : value.toFixed(1);
    }
  };
  
  return (
    <div className={`stat-card stat-card-${variant}`}
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}>
      
      <div className="stat-card-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
      <div className="stat-card-content">
        <h3 className="stat-card-title">{title}</h3>
        <div className="stat-card-value">{value}</div>
        {subtitle && <div className="stat-card-subtitle">{subtitle}</div>}
        {trend && (
          <div className={`stat-card-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
            <span>{trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%</span>
          </div>
        )}
        
        {/* Mini bar chart */}
        {chartData && chartData.length > 0 && (
          <div className="stat-card-chart">
            {chartData.map((value, index) => (
              <div 
                key={index} 
                className="stat-card-chart-bar-container"
              >
                <div className="stat-card-chart-tooltip">
                  {formatTooltipValue(value)}
                </div>
                <div 
                  className="stat-card-chart-bar"
                  style={{ 
                    height: `${Math.max((value / maxValue) * 100, 5)}%`, // Ensure minimum height of 5% for visibility
                    backgroundColor: `var(--${variant}-color, var(--primary-color))`,
                    opacity: 0.7 + (index / chartData.length * 0.3) // Gradually increase opacity
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;