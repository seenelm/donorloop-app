import React from 'react';
import '../styles/TopListCard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { type IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface ListItem {
  id: string | number;
  primary: string;
  secondary: string | number;
  avatar?: string;
}

interface TopListCardProps {
  title: string;
  icon: IconDefinition;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info';
  items: ListItem[];
  isMonetary?: boolean;
  onItemClick?: (id: string | number) => void;
}

const TopListCard: React.FC<TopListCardProps> = ({
  title,
  icon,
  variant = 'primary',
  items,
  isMonetary = false,
  onItemClick
}) => {
  // Format currency if needed
  const formatValue = (value: string | number): string => {
    if (isMonetary && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    }
    return String(value);
  };
  
  return (
    <div className={`top-list-card top-list-card-${variant}`}>
      <div className="top-list-header">
        <div className="top-list-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        <h3 className="top-list-title">{title}</h3>
      </div>
      
      <div className="top-list-content">
        {items.length === 0 ? (
          <div className="top-list-empty">No data available</div>
        ) : (
          <ul className="top-list">
            {items.map((item, index) => (
              <li key={item.id} className="top-list-item">
                <div className="top-list-rank">{index + 1}</div>
                {item.avatar ? (
                  <div
                    className="top-list-avatar"
                    onClick={onItemClick ? () => onItemClick(item.id) : undefined}
                    role={onItemClick ? 'button' : undefined}
                    tabIndex={onItemClick ? 0 : undefined}
                    style={onItemClick ? { cursor: 'pointer' } : undefined}
                    title={onItemClick ? 'View donor profile' : undefined}
                  >
                    {item.avatar.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div
                    className="top-list-avatar"
                    onClick={onItemClick ? () => onItemClick(item.id) : undefined}
                    role={onItemClick ? 'button' : undefined}
                    tabIndex={onItemClick ? 0 : undefined}
                    style={onItemClick ? { cursor: 'pointer' } : undefined}
                    title={onItemClick ? 'View donor profile' : undefined}
                  >
                    {item.primary.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="top-list-details">
                  <div
                    className={`top-list-primary${onItemClick ? ' clickable-name' : ''}`}
                    onClick={onItemClick ? () => onItemClick(item.id) : undefined}
                    role={onItemClick ? 'button' : undefined}
                    tabIndex={onItemClick ? 0 : undefined}
                    style={onItemClick ? { cursor: 'pointer' } : undefined}
                    title={onItemClick ? 'View donor profile' : undefined}
                  >
                    {item.primary}
                  </div>
                </div>
                <div className="top-list-secondary">
                  {formatValue(item.secondary)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TopListCard;
