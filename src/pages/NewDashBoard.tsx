import React, { useState } from 'react';
import { 
  faUsers, faChartLine, faSackDollar, faHandHoldingHeart, faUserPlus, faArrowTrendUp, faArrowTrendDown,
  faCalendarDays, faStar, faGift, faUserCheck, faPercent, faGem, faSyncAlt, type IconDefinition
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './styles/newdashboard.css'; 
import Modal from '../components/popup/modal';
import { 
  useMetrics,
  type GiftWithDonor,
  type DonorData,
  type SnapshotDonorInfo
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

// --- SELF-CONTAINED DASHBOARD STAT CARD COMPONENT ---
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
      {/* This part holds the title and value, and will slide up */}
      <div className="stat-card-info-content">
        <div className="stat-card-icon">
          <FontAwesomeIcon icon={icon} />
        </div>
        <div className="stat-card-info">
          <p className="stat-card-title">{title}</p>
          <p className="stat-card-value">{value}</p>
        </div>
      </div>

      {/* This part holds the chart and will expand */}
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


// --- MAIN DASHBOARD COMPONENT ---
const NewDashboard: React.FC = () => {
  // --- 1. FETCH LIVE DATA ---
  const { metrics, isLoading, error, ...data } = useMetrics();

  // --- 2. UI STATE ---
  const [actionPlanText, setActionPlanText] = useState(
    `• Call 2 major donors (see list)\n• Draft quarterly update email\n• Follow up with last month's new donors`
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentId, setModalContentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('retained'); 
  const [snapshotFilter, setSnapshotFilter] = useState<'monthly' | 'one-time'>('monthly');
  const [projectionChartTab, setProjectionChartTab] = useState('monthly');
  const [isFading, setIsFading] = useState(false);

  const modalTitles: { [key: string]: string } = {
    totalDonationsYTD: 'All Donations (Year-to-Date)',
    newDonors: 'New Donors (Last 30 Days)',
    totalValueCurrentMonth: "This Month's Donations",
    majorDonorsCurrentMonth: "This Month's Major Donors",
    mediumDonorsCurrentMonth: "This Month's Medium Donors",
    normalDonorsCurrentMonth: "This Month's Normal Donors",
    wma: '30-Day WMA Breakdown',
    medianDonation: 'Median Donation Details (30 Days)',
    retentionPercentageCurrentMonth: "This Month's Donor Retention",
    newDonorsThisMonth: "New Donors This Month",
    uniqueDonorsCurrentMonth: "This Month's Donors",
    yearlyProjection: "Yearly Donation Projection",
    totalDonorPool: 'All-Time Donor Pool',
    majorDonorsCurrentMonth_Monthly: "This Month's Major Monthly Donors",
    mediumDonorsCurrentMonth_Monthly: "This Month's Medium Monthly Donors",
    normalDonorsCurrentMonth_Monthly: "This Month's Normal Monthly Donors",
    majorDonorsCurrentMonth_Onetime: "This Month's Major One-Time Donors",
    mediumDonorsCurrentMonth_Onetime: "This Month's Medium One-Time Donors",
    normalDonorsCurrentMonth_Onetime: "This Month's Normal One-Time Donors",
  };

  const openModal = (metricId: string) => {
    setModalContentId(metricId);
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContentId(null);
  };

  const handleSnapshotToggle = () => {
    setIsFading(true); 

  
    setTimeout(() => {
 
      setSnapshotFilter(prev => (prev === 'monthly' ? 'one-time' : 'monthly'));

      setIsFading(false); 
    }, 150); 
  };

  // --- 3. LOADING AND ERROR HANDLING (CRITICAL FIX) ---
  if (isLoading) {
    return <div className="loading-state">Loading dashboard...</div>;
  }
  if (error) {
    return <div className="error-state">Error loading dashboard: {error}</div>;
  }

  // --- 4. DERIVED CALCULATIONS ---
  const averageDonationAllTime = (data.totalGiftsAllTime || 0) > 0 
    ? (data.totalDonationsAllTime || 0) / data.totalGiftsAllTime 
    : 0;

  // --- 4b. EXTRACT YEARLY PROJECTION ---
  const yearlyProjection = data.yearlyProjection || {
    percentage: 0,
    projectedTotal: 0,
    lastYearTotal: 0,
    monthlyComparison: [],
    quarterlyComparison: []
  };

  // --- 5. RENDER THE DASHBOARD ---
  return (
    <div className="content-body">
      <div className="dashboard-grid-layout">
        {/* === ROW 1: Financial Health Summary === */}
        <div className="summary-wrapper card-style">
          <h3 className="super-card-title">Financial Health Summary</h3>
          <div className="financial-summary">
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
              chartData={data.averageDonationChartData}
            />
            <div className="dashboard-stat-card projection-card" onClick={() => openModal('yearlyProjection')}>
              <div className="stat-card-info-content">
                <div className="stat-card-icon" style={{ color: yearlyProjection.percentage >= 0 ? 'var(--primary-color)' : 'var(--error-color)', backgroundColor: yearlyProjection.percentage >= 0 ? 'rgba(49, 223, 162, 0.1)' : 'rgba(255, 107, 107, 0.1)' }}>
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
        </div>

        {/* === ROW 2: Segmentation & Action Plan === */}
        <div className="dashboard-row segmentation-action-plan">
          <div className="super-card">
            <div className="super-card-header">
              <h3 className="super-card-title">This Month's Snapshot</h3>
              <button 
                className="snapshot-toggle-button" 
                onClick={handleSnapshotToggle}
              >
                <FontAwesomeIcon icon={faSyncAlt} />
                {snapshotFilter === 'monthly' ? 'Show One-Time' : 'Show Monthly'}
              </button>
            </div>
            <div className="nested-stat-grid">
              <DashboardStatCard 
                title="Total Gifts" 
                value={(metrics.totalGiftsCurrentMonth || 0).toLocaleString()} 
                icon={faGift} 
                size="small" 
                onClick={() => openModal('totalValueCurrentMonth')}
              />
              <DashboardStatCard 
                title="Average Donation" 
                value={formatAmount(metrics.averageDonationCurrentMonth)} 
                icon={faHandHoldingHeart} 
                size="small" 
              />
              <DashboardStatCard 
                title="Total Value" 
                value={formatAmount(metrics.totalValueCurrentMonth)} 
                icon={faSackDollar} 
                size="small"
                onClick={() => openModal('totalValueCurrentMonth')}
              />
            </div>
            <div className={`nested-stat-grid ${isFading ? 'is-fading' : ''}`}>
              <DashboardStatCard 
                title="Major Donors" 
                value={(snapshotFilter === 'monthly' ? metrics.majorDonorsCurrentMonth_Monthly : metrics.majorDonorsCurrentMonth_Onetime).toString()} 
                icon={faStar} 
                size="small" 
                onClick={() => openModal(snapshotFilter === 'monthly' ? 'majorDonorsCurrentMonth_Monthly' : 'majorDonorsCurrentMonth_Onetime')}
              />
              <DashboardStatCard 
                title="Medium Donors" 
                value={(snapshotFilter === 'monthly' ? metrics.mediumDonorsCurrentMonth_Monthly : metrics.mediumDonorsCurrentMonth_Onetime).toString()} 
                icon={faGift} 
                size="small" 
                onClick={() => openModal(snapshotFilter === 'monthly' ? 'mediumDonorsCurrentMonth_Monthly' : 'mediumDonorsCurrentMonth_Onetime')}
              />
              <DashboardStatCard 
                title="Normal Donors" 
                value={(snapshotFilter === 'monthly' ? metrics.normalDonorsCurrentMonth_Monthly : metrics.normalDonorsCurrentMonth_Onetime).toString()} 
                icon={faUserCheck} 
                size="small" 
                onClick={() => openModal(snapshotFilter === 'monthly' ? 'normalDonorsCurrentMonth_Monthly' : 'normalDonorsCurrentMonth_Onetime')}
              />
            </div>
            <div className="nested-stat-grid">
              <DashboardStatCard 
                title="Retention %" 
                value={`${(metrics.retentionPercentageCurrentMonth || 0).toFixed(1)}%`} 
                icon={faPercent} 
                size="small" 
                onClick={() => openModal('retentionPercentageCurrentMonth')}
              />
              <DashboardStatCard 
                title="New Donors This Month" 
                value={(metrics.newDonorsThisMonth || 0).toString()} 
                icon={faUserPlus} 
                size="small" 
                onClick={() => openModal('newDonorsThisMonth')}
              />
              <DashboardStatCard 
                title="This Month's Donors" 
                value={(metrics.uniqueDonorsCurrentMonth || 0).toString()} 
                icon={faCalendarDays} 
                size="small" 
                onClick={() => openModal('totalValueCurrentMonth')}
              />
            </div>
          </div>
          <div className="super-card">
            <h3 className="super-card-title">My Weekly Action Plan</h3>
            <textarea
              className="action-plan-textarea"
              value={actionPlanText}
              onChange={(e) => setActionPlanText(e.target.value)}
              placeholder="Type your weekly action items here..."
            />
          </div>
        </div>

        {/* === ROW 3: Key Analysis Metrics === */}
        <div className="dashboard-row key-analysis">
          <DashboardStatCard 
            title="30-Day WMA Donations" 
            value={formatAmount(metrics.weightedMovingAvg)} 
            icon={faChartLine} 
            onClick={() => openModal('wma')}
          />
          <DashboardStatCard 
            title="Median Donation (30 Days)" 
            value={formatAmount(metrics.medianDonation)} 
            icon={faGem} 
            onClick={() => openModal('medianDonation')}
          />
        </div>
      </div>

      {/* === MODAL FOR DETAILED POPUPS === */}
      <Modal isOpen={isModalOpen} onClose={closeModal} title={modalContentId ? modalTitles[modalContentId] : 'Details'}>
        {modalContentId === 'totalDonorPool' && (
          <div className="top-list-content"><ul className="top-list">{data.totalDonorPoolList.map((donor: DonorData, i: number) => (<li key={donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(donor)}</div><div className="top-list-details">{donorFullName(donor)}</div><div className="top-list-secondary">{donor.email}</div></li>))}</ul></div>
        )}
        {modalContentId === 'uniqueDonorsCurrentMonth' && (
          <div className="top-list-content"><ul className="top-list">{data.uniqueDonorsCurrentMonthList.map((donor: DonorData, i: number) => (<li key={donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(donor)}</div><div className="top-list-details">{donorFullName(donor)}</div></li>))}</ul></div>
        )}
        {modalContentId === 'totalDonationsYTD' && (<div className="top-list-content"><ul className="top-list">{data.allGiftsYTD.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'newDonors' && (<div className="top-list-content">{data.newDonorsList.length === 0 ? (<div className="top-list-empty">No new donors in the last 30 days.</div>) : (<ul className="top-list">{data.newDonorsList.map((item: DonorData, i: number) => (<li key={item.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item)}</div><div className="top-list-details">{donorFullName(item)}</div><div className="top-list-secondary">{formatDate(item.created_at)}</div></li>))}</ul>)}</div>)}
        {modalContentId === 'totalValueCurrentMonth' && (<div className="top-list-content"><ul className="top-list">{data.giftsCurrentMonthList.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Gift on {formatDate(item.giftdate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalamount)}</div></li>))}</ul></div>)}
        {modalContentId === 'wma' && (<div className="top-list-content">{data.wmaDetails.length === 0 ? (<div className="top-list-empty">No data available for WMA.</div>) : (<ul className="top-list">{data.wmaDetails.map((item: { monthLabel: string; total: number; weight: number }, i: number) => (<li key={item.monthLabel} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-details">{item.monthLabel}: {formatAmount(item.total)} × {item.weight}</div><div className="top-list-secondary">= <strong>{formatAmount(item.total * item.weight)}</strong></div></li>))}</ul>)}<p style={{ marginTop: '1em', fontWeight: 'bold' }}>Final WMA: {formatAmount(metrics.weightedMovingAvg)}</p></div>)}
        {modalContentId === 'medianDonation' && (<div className="top-list-content">{data.medianIndex !== null && (<p style={{ margin: '0 0 1rem' }}><strong>Median Position:</strong> Gift #{data.medianIndex + 1}</p>)}<p style={{ margin: '0 0 1rem' }}><strong>Computed Median:</strong> {formatAmount(metrics.medianDonation)}</p><ul className="top-list">{data.rawDonationsList.map((item: GiftWithDonor, idx: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">Gift ID {item.giftid}<br />{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)}<br />{formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorDonorsCurrentMonth_Monthly' && (<div className="top-list-content"><ul className="top-list">{data.majorDonorsCurrentMonthList_Monthly.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumDonorsCurrentMonth_Monthly' && (<div className="top-list-content"><ul className="top-list">{data.mediumDonorsCurrentMonthList_Monthly.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalDonorsCurrentMonth_Monthly' && (<div className="top-list-content"><ul className="top-list">{data.normalDonorsCurrentMonthList_Monthly.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorDonorsCurrentMonth_Onetime' && (<div className="top-list-content"><ul className="top-list">{data.majorDonorsCurrentMonthList_Onetime.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumDonorsCurrentMonth_Onetime' && (<div className="top-list-content"><ul className="top-list">{data.mediumDonorsCurrentMonthList_Onetime.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalDonorsCurrentMonth_Onetime' && (<div className="top-list-content"><ul className="top-list">{data.normalDonorsCurrentMonthList_Onetime.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {modalContentId === 'newDonorsThisMonth' && (<div className="top-list-content"><ul className="top-list">{data.newDonorsThisMonthList.map((item: SnapshotDonorInfo, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"><span>{donorFullName(item.donor)}</span><span className="top-list-subheader">Last Gift: {formatAmount(item.lastGiftAmount)} on {formatDate(item.lastGiftDate)}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmountThisMonth)}</div></li>))}</ul></div>)}
        {/* === NEW: Retention Breakdown Modal === */}
        {modalContentId === 'retentionPercentageCurrentMonth' && (
          <div>
            <div className="modal-summary"><strong>{data.retainedDonorsList.length}</strong> of <strong>{data.lastMonthDonorPool.length}</strong> donors from last month have given again this month.</div>
            <div className="modal-tabs">
              <button className={`tab-button ${activeTab === 'retained' ? 'active' : ''}`} onClick={() => setActiveTab('retained')}>Retained ({data.retainedDonorsList.length})</button>
              <button className={`tab-button ${activeTab === 'churned' ? 'active' : ''}`} onClick={() => setActiveTab('churned')}>Hasn't Donated ({data.churnedFromLastMonthList.length})</button>
              <button className={`tab-button ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>Last Month's Pool ({data.lastMonthDonorPool.length})</button>
            </div>
            <div className="top-list-content">
              {activeTab === 'retained' && (<ul className="top-list">{data.retainedDonorsList.map((donor: DonorData, i: number) => (<li key={donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(donor)}</div><div className="top-list-details">{donorFullName(donor)}</div></li>))}</ul>)}
              {activeTab === 'churned' && (<ul className="top-list">{data.churnedFromLastMonthList.map((donor: DonorData, i: number) => (<li key={donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(donor)}</div><div className="top-list-details">{donorFullName(donor)}</div></li>))}</ul>)}
              {activeTab === 'all' && (<ul className="top-list">{data.lastMonthDonorPool.map((donor: DonorData, i: number) => (<li key={donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(donor)}</div><div className="top-list-details">{donorFullName(donor)}</div></li>))}</ul>)}
            </div>
          </div>
        )}
        {modalContentId === 'yearlyProjection' && (
          <div>
            <div className="modal-summary">
              Raised So Far: <strong>{formatAmount(yearlyProjection.thisYearYTDSum)}</strong> |
              Projected Total: <strong>{formatAmount(yearlyProjection.projectedTotal)}</strong> (vs. {formatAmount(yearlyProjection.lastYearTotal)} last year)
            </div>            
            <div className="modal-tabs">
              <button className={`tab-button ${projectionChartTab === 'monthly' ? 'active' : ''}`} onClick={() => setProjectionChartTab('monthly')}>Monthly</button>
              <button className={`tab-button ${projectionChartTab === 'quarterly' ? 'active' : ''}`} onClick={() => setProjectionChartTab('quarterly')}>Quarterly</button>
            </div>
            <div className="projection-chart">
              {projectionChartTab === 'monthly' && yearlyProjection.monthlyComparison.map((item, index) => {
                const maxVal = Math.max(item.lastYear, item.thisYear, 1);
                return (
                  <div key={index} className="chart-group">
                    <div className="chart-bar-container">
                      <div className="chart-bar last-year" style={{ height: `${(item.lastYear / maxVal) * 100}%` }} data-tooltip={formatAmount(item.lastYear)}></div>
                      <div className="chart-bar this-year" style={{ height: `${(item.thisYear / maxVal) * 100}%` }} data-tooltip={formatAmount(item.thisYear)}></div>
                    </div>
                    <div className="chart-label">{item.month}</div>
                  </div>
                );
              })}
              {projectionChartTab === 'quarterly' && yearlyProjection.quarterlyComparison.map((item, index) => {
                const maxVal = Math.max(item.lastYear, item.thisYear, 1);
                return (
                  <div key={index} className="chart-group">
                    <div className="chart-bar-container">
                      <div className="chart-bar last-year" style={{ height: `${(item.lastYear / maxVal) * 100}%` }} data-tooltip={formatAmount(item.lastYear)}></div>
                      <div className="chart-bar this-year" style={{ height: `${(item.thisYear / maxVal) * 100}%` }} data-tooltip={formatAmount(item.thisYear)}></div>
                    </div>
                    <div className="chart-label">{item.quarter}</div>
                  </div>
                );
              })}
            </div>
             <div className="chart-legend">
              <div className="legend-item"><span className="legend-color last-year"></span>Last Year</div>
              <div className="legend-item"><span className="legend-color this-year"></span>This Year</div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default NewDashboard;
