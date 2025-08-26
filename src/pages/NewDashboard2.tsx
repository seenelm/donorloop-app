import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  faUsers, faSackDollar, faHandHoldingHeart, faUserPlus, faArrowTrendUp, faArrowTrendDown,
  type IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles/newdashboard2.css'; 
import Modal from '../components/popup/modal';
import { 
  useMetrics,
  type GiftWithDonor,
  type DonorData
} from '../components/hooks/useMetrics';

// Helper functions
const formatAmount = (amount?: number, compact: boolean = false) => {
  if (amount === undefined || amount === null) return '$0';
  const options: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD' };
  if (compact) {
    options.notation = 'compact';
    options.maximumFractionDigits = 1;
  } else {
    options.minimumFractionDigits = 0;
    options.maximumFractionDigits = 0;
  }
  return new Intl.NumberFormat('en-US', options).format(amount);
};

const formatDate = (date?: string) => {
  if (!date) return '';
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString();
};

const donorInitials = (donor?: any) => donor ? `${donor.firstname?.[0] || ''}${donor.lastname?.[0] || ''}` : '—';
const donorFullName = (donor?: any) => donor ? `${donor.firstname || ''} ${donor.lastname || ''}`.trim() : '';

// Dashboard Stat Card Component
interface DashboardStatCardProps {
  title: string;
  value: string;
  icon: IconDefinition;
  size?: 'small';
  onClick?: () => void;
  chartData?: number[];
}

const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ title, value, icon, size, onClick, chartData }) => {
  const cardClasses = `dashboard-stat-card ${size === 'small' ? 'stat-card-small' : ''} ${chartData ? 'has-chart' : ''}`;
  const maxChartValue = chartData && chartData.length > 0 ? Math.max(...chartData) : 1;

  return (
    <div className={cardClasses} onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <div className="stat-card-info-content">
        <div className="stat-card-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
        </div>
      </div>

      {chartData && (
        <div className="stat-card-chart-container">
          {chartData.map((dataPoint, index) => (
            <div 
              key={index} 
              className="chart-bar-wrapper"
              data-tooltip={formatAmount(dataPoint)}
            >
              <div 
                className="chart-bar"
                style={{ height: `${(dataPoint / maxChartValue) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Donor Type Modal Component
interface DonorTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  donorType: 'major' | 'medium' | 'normal';
  donationType: 'monthly' | 'onetime';
  donors: any[];
}

const DonorTypeModal: React.FC<DonorTypeModalProps> = ({ 
  isOpen, 
  onClose, 
  donorType, 
  donationType,
  donors 
}) => {
  const navigate = useNavigate();

  const goToDonor = (donorId?: string) => {
    if (!donorId) return;
    navigate(`/donor-profile/${donorId}`);
  };

  const getModalTitle = () => {
    const typeLabel = donorType.charAt(0).toUpperCase() + donorType.slice(1);
    const donationLabel = donationType === 'monthly' ? 'Monthly' : 'One-Time';
    return `${typeLabel} ${donationLabel} Donors`;
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={getModalTitle()}
    >
      <div className="donor-type-modal">
        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-item">
            <span className="summary-label">Total Donors:</span>
            <span className="summary-value">{donors.length}</span>
          </div>
        </div>

        {/* Donors List */}
        <div className="donations-list">
          {donors.length === 0 ? (
            <div className="no-donations">
              No {donorType} {donationType} donors found
            </div>
          ) : (
            <ul className="top-list">
              {donors.map((donor: any, index: number) => (
                <li key={donor.donorid || index} className="top-list-item">
                  <div className="top-list-rank">{index + 1}</div>
                  <div className="top-list-avatar" onClick={() => goToDonor(donor.donorid)}>
                    {donorInitials(donor)}
                  </div>
                  <div className="top-list-details">
                    <span className="clickable-name" onClick={() => goToDonor(donor.donorid)}>
                      {donorFullName(donor) || 'Unknown Donor'}
                    </span>
                  </div>
                  <div className="top-list-secondary">
                    {donor.email || 'No email'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Monthly Donations Modal Component
interface MonthlyDonationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  month: string;
  year1: number;
  year2: number;
  allGifts: any[];
  viewMode: 'monthly' | 'quarterly';
}

const MonthlyDonationsModal: React.FC<MonthlyDonationsModalProps> = ({ 
  isOpen, 
  onClose, 
  month, 
  year1, 
  year2, 
  allGifts, 
  viewMode 
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(year2);
  const navigate = useNavigate();

  const goToDonor = (donorId?: string) => {
    if (!donorId) return;
    navigate(`/donor-profile/${donorId}`);
  };

  // Filter donations based on selected month/quarter and year
  const getFilteredDonations = () => {
    if (!allGifts || allGifts.length === 0) return [];

    return allGifts.filter((gift: any) => {
      if (!gift.giftdate) return false;
      
      const giftDate = new Date(gift.giftdate);
      const giftYear = giftDate.getFullYear();
      const giftMonth = giftDate.getMonth();
      
      // Check if year matches
      if (giftYear !== selectedYear) return false;
      
      if (viewMode === 'monthly') {
        // For monthly view, match exact month
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthIndex = monthNames.indexOf(month);
        return monthIndex !== -1 && giftMonth === monthIndex;
      } else {
        // For quarterly view, match quarter
        const quarterMap: { [key: string]: number[] } = {
          'Q1': [0, 1, 2],     // Jan, Feb, Mar
          'Q2': [3, 4, 5],     // Apr, May, Jun
          'Q3': [6, 7, 8],     // Jul, Aug, Sep
          'Q4': [9, 10, 11]    // Oct, Nov, Dec
        };
        const quarterMonths = quarterMap[month];
        return quarterMonths && quarterMonths.includes(giftMonth);
      }
    });
  };

  const filteredDonations = getFilteredDonations();
  const totalAmount = filteredDonations.reduce((sum, gift) => sum + (gift.totalamount || 0), 0);

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`${month} ${selectedYear} Donations`}
    >
      <div className="monthly-donations-modal">
        {/* Year Toggle */}
        <div className="modal-year-toggle">
          <button 
            className={`year-toggle-btn ${selectedYear === year1 ? 'active' : ''}`}
            onClick={() => setSelectedYear(year1)}
          >
            {year1}
          </button>
          <button 
            className={`year-toggle-btn ${selectedYear === year2 ? 'active' : ''}`}
            onClick={() => setSelectedYear(year2)}
          >
            {year2}
          </button>
        </div>

        {/* Summary */}
        <div className="modal-summary">
          <div className="summary-item">
            <span className="summary-label">Total Donations:</span>
            <span className="summary-value">{filteredDonations.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Total Amount:</span>
            <span className="summary-value">{formatAmount(totalAmount)}</span>
          </div>
        </div>

        {/* Donations List */}
        <div className="donations-list">
          {filteredDonations.length === 0 ? (
            <div className="no-donations">
              No donations found for {month} {selectedYear}
            </div>
          ) : (
            <ul className="top-list">
              {filteredDonations
                .sort((a, b) => (b.totalamount || 0) - (a.totalamount || 0))
                .map((gift: any, index: number) => (
                <li key={gift.giftid || index} className="top-list-item">
                  <div className="top-list-rank">{index + 1}</div>
                  <div className="top-list-avatar" onClick={() => goToDonor(gift.donor?.donorid)}>
                    {donorInitials(gift.donor)}
                  </div>
                  <div className="top-list-details">
                    <span className="clickable-name" onClick={() => goToDonor(gift.donor?.donorid)}>
                      {donorFullName(gift.donor) || 'Unknown Donor'}
                    </span>
                  </div>
                  <div className="top-list-secondary">
                    {formatAmount(gift.totalamount)} on {formatDate(gift.giftdate)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
};

// Yearly Projection Chart Component
interface YearlyProjectionChartProps {
  yearlyProjection: any;
  viewMode: 'monthly' | 'quarterly';
  allGifts?: any[];
  onSegmentClick?: (month: string, year1: number, year2: number) => void;
}

const YearlyProjectionChart: React.FC<YearlyProjectionChartProps> = ({ 
  yearlyProjection, 
  viewMode, 
  allGifts,
  onSegmentClick 
}) => {
  const [compareYear1, setCompareYear1] = React.useState(new Date().getFullYear() - 1);
  const [compareYear2, setCompareYear2] = React.useState(new Date().getFullYear());
  
  const data = viewMode === 'monthly' ? yearlyProjection.monthlyComparison : yearlyProjection.quarterlyComparison;
  
  // Calculate 2023 data from allGifts
  const calculate2023Data = (mode: 'monthly' | 'quarterly') => {
    // Use allGifts prop or fallback to empty array
    if (!allGifts || !allGifts.length) {
      console.log('No allGifts data available for 2023 calculation');
      return data.map(() => 0);
    }
    
    console.log('Total gifts available:', allGifts.length);
    
    const gifts2023 = allGifts.filter((gift: any) => {
      if (!gift.giftdate) return false;
      const giftDate = new Date(gift.giftdate);
      const year = giftDate.getFullYear();
      return year === 2023;
    });
    
    console.log('Gifts from 2023:', gifts2023.length);
    if (gifts2023.length > 0) {
      console.log('Sample 2023 gift:', gifts2023[0]);
    }

    if (mode === 'monthly') {
      return Array.from({ length: 12 }, (_, monthIndex) => {
        return gifts2023
          .filter((gift: any) => new Date(gift.giftdate!).getMonth() === monthIndex)
          .reduce((sum: number, gift: any) => sum + (gift.totalamount || 0), 0);
      });
    } else {
      return Array.from({ length: 4 }, (_, quarterIndex) => {
        const startMonth = quarterIndex * 3;
        const endMonth = startMonth + 2;
        return gifts2023
          .filter((gift: any) => {
            const month = new Date(gift.giftdate!).getMonth();
            return month >= startMonth && month <= endMonth;
          })
          .reduce((sum: number, gift: any) => sum + (gift.totalamount || 0), 0);
      });
    }
  };
  
  if (!data || data.length === 0) {
    return <div className="chart-empty">No data available</div>;
  }

  // Use real data including calculated 2023 data
  const currentYear = new Date().getFullYear();
  
  // Get data for years including calculated 2023 data
  const getYearData = (year: number) => {
    if (year === currentYear) {
      return data.map((item: any) => item.thisYear || 0);
    } else if (year === currentYear - 1) {
      return data.map((item: any) => item.lastYear || 0);
    } else if (year === 2023) {
      // Calculate 2023 data from allGifts
      return calculate2023Data(viewMode);
    } else {
      // For other years, return zeros since we don't have real data
      return data.map(() => 0);
    }
  };

  const year1Data = getYearData(compareYear1);
  const year2Data = getYearData(compareYear2);
  
  // Use a more balanced scaling approach to make smaller values visible
  const allValues = [...year1Data, ...year2Data].filter(v => v > 0);
  const maxValue = Math.max(...allValues, 1);
  
  // Use logarithmic scaling for better visibility of smaller values
  const getScaledHeight = (value: number) => {
    if (value === 0) return 0;
    // Use a combination of linear and logarithmic scaling
    const linearScale = (value / maxValue) * 100;
    const logScale = (Math.log(value + 1) / Math.log(maxValue + 1)) * 100;
    // Blend 70% linear with 30% logarithmic for better balance
    return Math.max((linearScale * 0.7 + logScale * 0.3), 8); // Minimum 8% height for visibility
  };
  
  // Calculate totals from real data only
  const year1Total = year1Data.reduce((sum: number, value: number) => sum + value, 0);
  const year2Total = year2Data.reduce((sum: number, value: number) => sum + value, 0);

  // Generate year options dynamically (future-proof)
  const generateYearOptions = () => {
    const years = [];
    const startYear = 2023; // Earliest year we support
    for (let year = currentYear; year >= startYear; year--) {
      years.push(year);
    }
    return years;
  };
  
  const yearOptions = generateYearOptions();

  const handleSegmentClick = (month: string) => {
    if (onSegmentClick) {
      onSegmentClick(month, compareYear1, compareYear2);
    }
  };

  return (
    <div className="yearly-projection-container">
      <div className="yearly-projection-chart" data-view={viewMode}>
        {data.map((item: any, index: number) => {
          const label = viewMode === 'monthly' ? item.month : item.quarter;
          const year1Value = year1Data[index];
          const year2Value = year2Data[index];
          return (
            <div 
              key={index} 
              className="chart-group"
              onClick={() => handleSegmentClick(label)}
              style={{ cursor: 'pointer' }}
            >
              <div className="chart-tooltip">
                <div className="chart-tooltip-year">{label}</div>
                <div className="chart-tooltip-amount">
                  {compareYear1}: {formatAmount(year1Value)}
                </div>
                <div className="chart-tooltip-amount">
                  {compareYear2}: {formatAmount(year2Value)}
                </div>
              </div>
              <div className="chart-bars">
                <div 
                  className="chart-bar last-year"
                  style={{ height: `${getScaledHeight(year1Value)}%` }}
                ></div>
                <div 
                  className="chart-bar this-year"
                  style={{ height: `${getScaledHeight(year2Value)}%` }}
                ></div>
              </div>
              <div className="chart-label">{label}</div>
            </div>
          );
        })}
      </div>
      
      {/* Year Totals and Comparison Controls */}
      <div className="chart-footer">
        <div className="year-totals">
          <div className="year-total-item">
            <span className="year-total-label">Total Raised {compareYear1}:</span>
            <span className="year-total-amount">{formatAmount(year1Total)}</span>
          </div>
          <div className="year-total-item">
            <span className="year-total-label">Total Raised {compareYear2}:</span>
            <span className="year-total-amount">{formatAmount(year2Total)}</span>
          </div>
        </div>
        
        <div className="year-selectors">
          <div className="year-selector">
            <label>Compare Year 1:</label>
            <select value={compareYear1} onChange={(e) => setCompareYear1(Number(e.target.value))}>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="year-selector">
            <label>Compare Year 2:</label>
            <select value={compareYear2} onChange={(e) => setCompareYear2(Number(e.target.value))}>
              {yearOptions.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Donor Type Pie Chart Component
interface DonorTypePieChartProps {
  metrics: any;
  donationType: 'monthly' | 'onetime';
  onSegmentClick?: (donorType: 'major' | 'medium' | 'normal', donationType: 'monthly' | 'onetime') => void;
}

const DonorTypePieChart: React.FC<DonorTypePieChartProps> = ({ metrics, donationType, onSegmentClick }) => {
  const [hoveredSegment, setHoveredSegment] = React.useState<string | null>(null);
  
  const majorCount = donationType === 'monthly' ? metrics.majorDonorsCurrentMonth_Monthly : metrics.majorDonorsCurrentMonth_Onetime;
  const mediumCount = donationType === 'monthly' ? metrics.mediumDonorsCurrentMonth_Monthly : metrics.mediumDonorsCurrentMonth_Onetime;
  const normalCount = donationType === 'monthly' ? metrics.normalDonorsCurrentMonth_Monthly : metrics.normalDonorsCurrentMonth_Onetime;
  
  
  const totalCount = (majorCount || 0) + (mediumCount || 0) + (normalCount || 0);
  
  if (totalCount === 0) {
    return <div className="chart-empty">No donor data available</div>;
  }

  const majorPercentage = ((majorCount || 0) / totalCount) * 100;
  const mediumPercentage = ((mediumCount || 0) / totalCount) * 100;
  const normalPercentage = ((normalCount || 0) / totalCount) * 100;
  

  return (
    <div className="donor-pie-chart">
      <div className="pie-chart-container">
        <svg viewBox="0 0 42 42" className="pie-chart-svg">
          {/* Background circle */}
          <circle
            cx="21"
            cy="21"
            r="15.915"
            fill="transparent"
            stroke="var(--border-color)"
            strokeWidth="3"
          />
          {/* Major donors segment */}
          {majorPercentage > 0 && (
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="var(--primary-color)"
              strokeWidth="3"
              strokeDasharray={`${majorPercentage} ${100 - majorPercentage}`}
              strokeDashoffset="25"
              className="pie-segment major"
              onMouseEnter={() => setHoveredSegment('major')}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => onSegmentClick?.('major', donationType)}
              style={{ 
                cursor: 'pointer',
                filter: hoveredSegment === 'major' ? 'brightness(1.2)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          )}
          {/* Medium donors segment */}
          {mediumPercentage > 0 && (
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="var(--secondary-color)"
              strokeWidth="3"
              strokeDasharray={`${mediumPercentage} ${100 - mediumPercentage}`}
              strokeDashoffset={`${25 - majorPercentage}`}
              className="pie-segment medium"
              onMouseEnter={() => setHoveredSegment('medium')}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => onSegmentClick?.('medium', donationType)}
              style={{ 
                cursor: 'pointer',
                filter: hoveredSegment === 'medium' ? 'brightness(1.2)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          )}
          {/* Normal donors segment */}
          {normalPercentage > 0 && (
            <circle
              cx="21"
              cy="21"
              r="15.915"
              fill="transparent"
              stroke="#230A2E"
              strokeWidth="3"
              strokeDasharray={`${normalPercentage} ${100 - normalPercentage}`}
              strokeDashoffset={`${25 - majorPercentage - mediumPercentage}`}
              className="pie-segment normal"
              onMouseEnter={() => setHoveredSegment('normal')}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => onSegmentClick?.('normal', donationType)}
              style={{ 
                cursor: 'pointer',
                filter: hoveredSegment === 'normal' ? 'brightness(1.2)' : 'none',
                transition: 'all 0.3s ease'
              }}
            />
          )}
          {/* Center text - show count, not amount */}
          <text x="21" y="21" textAnchor="middle" dominantBaseline="middle" className="pie-chart-center-number">
            {hoveredSegment === 'major' ? (majorCount || 0) : 
             hoveredSegment === 'medium' ? (mediumCount || 0) : 
             hoveredSegment === 'normal' ? (normalCount || 0) : 
             totalCount}
          </text>
        </svg>
      </div>
      
      <div className="legend-container">
        <div className="legend-item">
          <span className="legend-color major"></span>
          <span>Major Donors ({majorCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-color medium"></span>
          <span>Medium Donors ({mediumCount})</span>
        </div>
        <div className="legend-item">
          <span className="legend-color normal"></span>
          <span>Normal Donors ({normalCount})</span>
        </div>
      </div>
    </div>
  );
};

// Circular Total Chart Component
interface CircularTotalChartProps {
  totalAmount: number;
}

const CircularTotalChart: React.FC<CircularTotalChartProps> = ({ totalAmount }) => {
  const radius = 55;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  
  // Use 75% completion for the ring, with empty portion at bottom
  const progressPercentage = 75;
  const strokeDasharray = `${(progressPercentage / 100) * circumference} ${circumference}`;
  
  return (
    <div className="circular-total-chart">
      <div className="circular-chart-container">
        <svg width="180" height="180" viewBox="0 0 180 180">
          <defs>
            <linearGradient id="circularGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor= "#000000" />
              <stop offset="25%" stopColor="#1B0033" />
              <stop offset="50%" stopColor="#320157" />
              <stop offset="75%" stopColor="#53038F" />
              <stop offset="100%" stopColor="#9E00FF" />
            </linearGradient>
          </defs>
          
          {/* Background circle - transparent */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="transparent"
            strokeWidth={strokeWidth}
          />
          
          {/* Progress circle - rotated so empty portion is at bottom */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            fill="none"
            stroke="url(#circularGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={strokeDasharray}
            strokeDashoffset="0"
            transform="rotate(-90 90 90)"
            strokeLinecap="round"
          />
          
          {/* Center text */}
          <text x="90" y="80" textAnchor="middle" dominantBaseline="middle" className="circular-chart-amount">
            {formatAmount(totalAmount, true)}
          </text>
          <text x="90" y="100" textAnchor="middle" dominantBaseline="middle" className="circular-chart-label">
            Total Amount
          </text>
        </svg>
      </div>
    </div>
  );
};

// Alerts Component
const Alerts: React.FC = () => {
  return (
    <div className="alerts-section">
      <h4>Alerts</h4>
      <div className="alerts-placeholder">
        <p>No alerts at this time.</p>
        <p className="alerts-subtitle">This section will show important notifications about churned donors, pending emails, and other items requiring attention.</p>
      </div>
    </div>
  );
};

// Main Dashboard Component
const NewDashboard2: React.FC = () => {
  const { metrics, isLoading, error, ...data } = useMetrics();
  const navigate = useNavigate();
  const goToDonor = (donorId?: string) => {
    if (!donorId) return;
    navigate(`/donor-profile/${donorId}`);
  };
  const [projectionViewMode, setProjectionViewMode] = useState<'monthly' | 'quarterly'>('monthly');
  const [donorTypeFilter, setDonorTypeFilter] = useState<'monthly' | 'onetime'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentId, setModalContentId] = useState<string | null>(null);
  const [monthlyDonationsModal, setMonthlyDonationsModal] = useState<{
    isOpen: boolean;
    month: string;
    year1: number;
    year2: number;
    allGifts: any[];
  }>({
    isOpen: false,
    month: '',
    year1: 0,
    year2: 0,
    allGifts: []
  });

  const [donorTypeModal, setDonorTypeModal] = useState<{
    isOpen: boolean;
    donorType: 'major' | 'medium' | 'normal';
    donationType: 'monthly' | 'onetime';
  }>({
    isOpen: false,
    donorType: 'major',
    donationType: 'monthly'
  });

  const modalTitles: { [key: string]: string } = {
    totalDonorPool: 'All-Time Donor Pool',
    totalDonationsYTD: 'All Donations (Year-to-Date)',
    newDonors: 'New Donors (Last 30 Days)'
  };

  const openModal = (metricId: string) => {
    setModalContentId(metricId);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalContentId(null);
  };

  const openMonthlyDonationsModal = (month: string, year1: number, year2: number, allGifts: any[]) => {
    setMonthlyDonationsModal({
      isOpen: true,
      month,
      year1,
      year2,
      allGifts
    });
  };

  const closeMonthlyDonationsModal = () => {
    setMonthlyDonationsModal({
      isOpen: false,
      month: '',
      year1: 0,
      year2: 0,
      allGifts: []
    });
  };

  const openDonorTypeModal = (donorType: 'major' | 'medium' | 'normal', donationType: 'monthly' | 'onetime') => {
    setDonorTypeModal({
      isOpen: true,
      donorType,
      donationType
    });
  };

  const closeDonorTypeModal = () => {
    setDonorTypeModal({
      isOpen: false,
      donorType: 'major',
      donationType: 'monthly'
    });
  };

  const getDonorsByType = (donorType: 'major' | 'medium' | 'normal', donationType: 'monthly' | 'onetime') => {
    // The pie chart shows current month data, so we need to get current month donor lists
    const typeKey = `${donorType}DonorsCurrentMonthList_${donationType === 'monthly' ? 'Monthly' : 'Onetime'}`;
    const donorList = data[typeKey] || [];
    
    // Convert SnapshotDonorInfo[] to donor objects for the modal
    return donorList.map((item: any) => item.donor).filter(Boolean);
  };

  if (isLoading) {
    return <div className="loading-state">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="error-state">Error loading dashboard: {error}</div>;
  }

  const averageDonationAllTime = (data.totalGiftsAllTime || 0) > 0 
    ? (data.totalDonationsAllTime || 0) / data.totalGiftsAllTime 
    : 0;

  const yearlyProjection = data.yearlyProjection || {
    percentage: 0,
    projectedTotal: 0,
    lastYearTotal: 0,
    monthlyComparison: [],
    quarterlyComparison: []
  };

  return (
    <div className="dashboard2-container">
      {/* Main Content */}
      <div className="dashboard2-main-content">
        {/* Top Metrics Row */}
        <div className="metrics-row">
          <DashboardStatCard 
            title="Total Donor Pool" 
            value={(metrics.totalDonorPoolCount || 0).toLocaleString()} 
            icon={faUsers} 
            onClick={() => openModal('totalDonorPool')}
          />
          <DashboardStatCard 
            title="Total Raised (YTD)" 
            value={formatAmount(data.totalYTD)} 
            icon={faSackDollar} 
            onClick={() => openModal('totalDonationsYTD')}
          />
          <DashboardStatCard 
            title="Average Donation" 
            value={formatAmount(averageDonationAllTime)} 
            icon={faHandHoldingHeart} 
          />
          <div className="dashboard-stat-card projection-card">
            <div className="stat-card-info-content">
              <div className="stat-card-icon" style={{ 
                color: yearlyProjection.percentage >= 0 ? '#10b981' : '#ef4444', 
                backgroundColor: yearlyProjection.percentage >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' 
              }}>
                <FontAwesomeIcon icon={yearlyProjection.percentage >= 0 ? faArrowTrendUp : faArrowTrendDown} />
              </div>
              <div className="stat-card-info">
                <p className="stat-card-title">Yearly Projection</p>
                <div className="stat-card-value-container">
                  <p className="stat-card-value">{yearlyProjection.percentage.toFixed(1)}%</p>
                  <p className="stat-card-hover-value">{formatAmount(yearlyProjection.projectedTotal)}</p>
                </div>
              </div>
            </div>
          </div>
          <DashboardStatCard 
            title="New Donors (Last Month)" 
            value={(metrics.newDonorsLastMonth || 0).toString()} 
            icon={faUserPlus} 
            onClick={() => openModal('newDonors')}
          />
        </div>

        {/* Main Content Grid */}
        <div className="dashboard2-grid">
          {/* Yearly Projection Chart - Full Width */}
          <div className="chart-section yearly-projection-section">
            <div className="section-header">
              <h3>Yearly Donation Projection vs Last Year</h3>
              <div className="view-toggle">
                <button 
                  className={`toggle-btn ${projectionViewMode === 'monthly' ? 'active' : ''}`}
                  onClick={() => setProjectionViewMode('monthly')}
                >
                  Monthly
                </button>
                <button 
                  className={`toggle-btn ${projectionViewMode === 'quarterly' ? 'active' : ''}`}
                  onClick={() => setProjectionViewMode('quarterly')}
                >
                  Quarterly
                </button>
              </div>
            </div>
            <YearlyProjectionChart 
              yearlyProjection={yearlyProjection}
              viewMode={projectionViewMode}
              allGifts={[
                ...(data.majorMonthlyAllTime?.gifts || []),
                ...(data.mediumMonthlyAllTime?.gifts || []),
                ...(data.normalMonthlyAllTime?.gifts || []),
                ...(data.majorOnetimeAllTime?.gifts || []),
                ...(data.mediumOnetimeAllTime?.gifts || []),
                ...(data.normalOnetimeAllTime?.gifts || [])
              ]}
              onSegmentClick={(month, year1, year2) => openMonthlyDonationsModal(month, year1, year2, [
                ...(data.majorMonthlyAllTime?.gifts || []),
                ...(data.mediumMonthlyAllTime?.gifts || []),
                ...(data.normalMonthlyAllTime?.gifts || []),
                ...(data.majorOnetimeAllTime?.gifts || []),
                ...(data.mediumOnetimeAllTime?.gifts || []),
                ...(data.normalOnetimeAllTime?.gifts || [])
              ])}
            />
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-color last-year"></span>
                <span>Last Year</span>
              </div>
              <div className="legend-item">
                <span className="legend-color this-year"></span>
                <span>This Year</span>
              </div>
            </div>
          </div>

          {/* Bottom Row - Donor Type (1/3) and Todo (2/3) */}
          <div className="dashboard2-bottom-row">
            {/* Donor Type Distribution */}
            <div className="chart-section donor-type-section">
              <div className="section-header">
                <h3>Donor Type Distribution</h3>
                <div className="view-toggle">
                  <button 
                    className={`toggle-btn ${donorTypeFilter === 'monthly' ? 'active' : ''}`}
                    onClick={() => setDonorTypeFilter('monthly')}
                  >
                    Monthly
                  </button>
                  <button 
                    className={`toggle-btn ${donorTypeFilter === 'onetime' ? 'active' : ''}`}
                    onClick={() => setDonorTypeFilter('onetime')}
                  >
                    One-Time
                  </button>
                </div>
              </div>
              <DonorTypePieChart 
                metrics={metrics} 
                donationType={donorTypeFilter}
                onSegmentClick={openDonorTypeModal}
              />
            </div>

            {/* To-Do List */}
            <div className="chart-section todo-section">
              <div className="section-header">
                <h3>To-Do List</h3>
              </div>
              <div className="todo-placeholder">
                <p>No tasks to display at this time.</p>
                <p className="todo-subtitle">This section will be populated with action items and reminders.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="dashboard2-sidebar">
        {/* Total Amount Chart */}
        <CircularTotalChart totalAmount={data.totalDonationsAllTime || 0} />

        {/* Alerts */}
        <Alerts />
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalContentId ? modalTitles[modalContentId] : 'Details'}>
        {modalContentId === 'totalDonorPool' && (
                  <div className="top-list-content"><ul className="top-list">{data.totalDonorPoolList.map((donor: DonorData, i: number) => (<li key={donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar" onClick={() => goToDonor(donor.donorid)}>{donorInitials(donor)}</div><div className="top-list-details"><span className="clickable-name" onClick={() => goToDonor(donor.donorid)}>{donorFullName(donor)}</span></div><div className="top-list-secondary">{donor.email}</div></li>))}</ul></div>
                )}
        {modalContentId === 'totalDonationsYTD' && (<div className="top-list-content"><ul className="top-list">{data.allGiftsYTD.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar" onClick={() => goToDonor(item.donor?.donorid)}>{donorInitials(item.donor)}</div><div className="top-list-details"><span className="clickable-name" onClick={() => goToDonor(item.donor?.donorid)}>{donorFullName(item.donor)}</span></div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        
        {modalContentId === 'newDonors' && (<div className="top-list-content">{data.newDonorsList.length === 0 ? (<div className="top-list-empty">No new donors in the last 30 days.</div>) : (<ul className="top-list">{data.newDonorsList.map((item: DonorData, i: number) => (<li key={item.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar" onClick={() => goToDonor(item.donorid)}>{donorInitials(item)}</div><div className="top-list-details"><span className="clickable-name" onClick={() => goToDonor(item.donorid)}>{donorFullName(item)}</span></div><div className="top-list-secondary">{formatDate(item.created_at)}</div></li>))}</ul>)}</div>)}
        
      </Modal>

      <MonthlyDonationsModal 
        isOpen={monthlyDonationsModal.isOpen} 
        onClose={closeMonthlyDonationsModal} 
        month={monthlyDonationsModal.month} 
        year1={monthlyDonationsModal.year1} 
        year2={monthlyDonationsModal.year2} 
        allGifts={monthlyDonationsModal.allGifts} 
        viewMode={projectionViewMode} 
      />

      <DonorTypeModal 
        isOpen={donorTypeModal.isOpen} 
        onClose={closeDonorTypeModal} 
        donorType={donorTypeModal.donorType}
        donationType={donorTypeModal.donationType}
        donors={getDonorsByType(donorTypeModal.donorType, donorTypeModal.donationType)}
      />
    </div>
  );
};

export default NewDashboard2;
