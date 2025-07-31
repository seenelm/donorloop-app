import React, { useState } from 'react';
import '../donationtoggle/DonationsTypeToggle.css'; // Well create this next

interface DonationTypeToggleProps {
  defaultValue?: 'monthly' | 'one-time';
  onChange: (type: 'monthly' | 'one-time') => void;
}

const DonationTypeToggle: React.FC<DonationTypeToggleProps> = ({
  defaultValue = 'monthly',
  onChange,
}) => {
  const [activeType, setActiveType] = useState(defaultValue);

  const handleToggle = (type: 'monthly' | 'one-time') => {
    setActiveType(type);
    onChange(type);
  };

  return (
    <div className="donation-type-toggle">
      <button
        className={activeType === 'monthly' ? 'toggle-button active' : 'toggle-button'}
        onClick={() => handleToggle('monthly')}
      >
        Monthly
      </button>
      <button
        className={activeType === 'one-time' ? 'toggle-button active' : 'toggle-button'}
        onClick={() => handleToggle('one-time')}
      >
        One-Time
      </button>
    </div>
  );
};

export default DonationTypeToggle;