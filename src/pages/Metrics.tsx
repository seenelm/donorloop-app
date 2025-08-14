import React, { useState } from 'react';
import {
  faCalendarAlt, faChartLine, faPercent, faArrowUp, faArrowDown, faUserPlus,
  faArrowUpRightDots, faArrowTrendUp, faArrowTrendDown, faUserSlash,
  faUser, faUserCheck, faUserFriends, faUserEdit, faUserTie, faStar, faGem,
  faPiggyBank, faGift, faHandHoldingHeart, faDollarSign, faChartPie, faWrench
} from '@fortawesome/free-solid-svg-icons';
import StatCard from '../components/stats/StatCard';
import Controls from '../components/controls/Controls';
import './styles/newmetrics.css';
import Modal from '../components/popup/modal';
import { 
  useMetrics,
  type DonorData,
  type GiftWithDonor,
  type TopDonorInfo,
  type ClassifiedDonor,
  type ChurnedDonorInfo,
  type ContributionListItem
} from '../components/hooks/useMetrics';

// --- Helper functions ---
const donorInitials = (donor?: any) => donor ? `${donor.firstname?.[0] || ''}${donor.lastname?.[0] || ''}` : '—';
const donorFullName = (donor?: any) => donor ? `${donor.firstname || ''} ${donor.lastname || ''}`.trim() : '';
const formatDate = (date?: string) => {
  if (!date) return '';
  const d = new Date(date);
  return new Date(d.getTime() + d.getTimezoneOffset() * 60000).toLocaleDateString();
};
const formatAmount = (amount?: number) => {
  if (amount === undefined) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
};

const Metrics: React.FC = () => {

  const data = useMetrics();

  const [activeFilter, setActiveFilter] = useState('All Metrics');
  const [searchTerm, setSearchTerm] = useState('');
  const [donationTypeFilter, setDonationTypeFilter] = useState<'monthly' | 'one-time'>('monthly');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentId, setModalContentId] = useState<string | null>(null);

  const openModal = (metricId: string) => { setModalContentId(metricId); setIsModalOpen(true); };
  const closeModal = () => { setIsModalOpen(false); setModalContentId(null); };

  if (data.isLoading) return <div className="loading-state">Loading metrics...</div>;
  if (data.error) return <div className="error-state">Error loading metrics: {data.error}</div>;

  const currentYear = new Date().getFullYear();
  const { metrics } = data;

  // --- 3. METRIC DEFINITIONS (COMPLETE) ---
  const metricDefinitions = [
    // Main Metrics
    {
    id: 'totalDonationsAllTime',
    title: 'Total Donations (All-Time)',
    value: formatAmount(data.totalDonationsAllTime),
    icon: faPiggyBank, 
    variant: 'primary',
    subtitle: 'Accumulated from all gifts',
    donationType: ['monthly', 'one-time'],
    categories: ['All-Time Classifications','Lifetime Value'],
    },
    { 
    id: 'newDonors', 
    title: 'New Donors (Last 30 Days)', 
    value: metrics.newDonorsLastMonth, 
    icon: faUserPlus, 
    variant: 'primary', onClick: () => openModal('newDonors'), 
    subtitle: 'Click to view list',
    categories: ['Current Year Metrics'], 
    donationType: ['monthly', 'one-time'] 
    },
    {
    id: 'recurringDonors',
    title: 'Recurring Donors (Last 30 Days)',
    value: metrics.recurringDonorsLastMonth,
    icon: faCalendarAlt,
    variant: 'success',
    onClick: () => openModal('recurringDonors'),
    subtitle: 'Click to view IDs',
    categories: ['Current Year Metrics'],
    donationType: ['monthly', 'one-time']
  },
  {
    id: 'medianDonation',
    title: 'Median Donation (Last 30 Days)',
    value: formatAmount(metrics.medianDonation),
    icon: faChartLine,
    variant: 'success',
    onClick: () => openModal('medianDonation'),
    subtitle: 'Click to view details',
    categories: ['Current Year Metrics'],
    donationType: ['monthly', 'one-time']
  },
  {
    id: 'wma',
    title: '30-Day WMA Donations',
    value: formatAmount(metrics.weightedMovingAvg),
    icon: faPercent,
    variant: 'dark',
    onClick: () => openModal('wma'),
    subtitle: 'Click to view breakdown',
    categories: ['Current Year Metrics'],
    donationType: ['monthly', 'one-time']
  },

  {
    id: 'recAboveMedian',
    title: '> Median & Recurring (1mo)',
    value: metrics.recAboveMedian1mo,
    icon: faArrowUp,
    variant: 'success',
    onClick: () => openModal('recAboveMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
    donationType: ['monthly']
  },
  {
    id: 'recBelowMedian',
    title: '≤ Median & Recurring (1mo)',
    value: metrics.recBelowMedian1mo,
    icon: faArrowDown,
    variant: 'warning',
    onClick: () => openModal('recBelowMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
    donationType: ['monthly']
  },
  {
    id: 'nonRecAboveMedian',
    title: '> Median & Non-Recurring (1mo)',
    value: metrics.nonRecAboveMedian1mo,
    icon: faArrowUp,
    variant: 'success',
    onClick: () => openModal('nonRecAboveMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
    donationType: ['one-time']
  },
  {
    id: 'nonRecBelowMedian',
    title: '≤ Median & Non-Recurring (1mo)',
    value: metrics.nonRecBelowMedian1mo,
    icon: faArrowDown,
    variant: 'warning',
    onClick: () => openModal('nonRecBelowMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
    donationType: ['one-time']
  },
  {
    id: 'recAboveWMA',
    title: '> WMA & Recurring (1mo)',
    value: metrics.recAboveWMA1mo,
    icon: faArrowTrendUp,
    variant: 'success',
    onClick: () => openModal('recAboveWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
    donationType: ['monthly']
  },
  {
    id: 'recBelowWMA',
    title: '≤ WMA & Recurring (1mo)',
    value: metrics.recBelowWMA1mo,
    icon: faArrowTrendDown,
    variant: 'warning',
    onClick: () => openModal('recBelowWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
    donationType: ['monthly']
  },
  {
    id: 'nonRecAboveWMA',
    title: '> WMA & Non-Recurring (1mo)',
    value: metrics.nonRecAboveWMA1mo,
    icon: faArrowTrendUp,
    variant: 'success',
    onClick: () => openModal('nonRecAboveWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
    donationType: ['one-time']
  },
  {
    id: 'nonRecBelowWMA',
    title: '≤ WMA & Non-Recurring (1mo)',
    value: metrics.nonRecBelowWMA1mo,
    icon: faArrowTrendDown,
    variant: 'warning',
    onClick: () => openModal('nonRecBelowWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
    donationType: ['one-time']
  },
  {
    id: 'recurringRatio',
    title: 'Recurring Value Ratio',
    value: metrics.recurringDonationRatio !== undefined
    ? `${metrics.recurringDonationRatio.toFixed(1)}%`
    : 'N/A',
    icon: faPercent,
    subtitle: 'Recurring share of total donation value',
    categories: ['Current Year Metrics', 'Retention & Churn'],
    donationType: ['monthly']
  },
  {
    id: 'churnedLarge',
    title: 'Churned Large Donors',
    value: metrics.churnedLargeDonors,
    icon: faUserSlash,
    variant: 'warning',
    onClick: () => openModal('churnedLarge'),
    subtitle: 'Click to view list',
    categories: ['Retention & Churn', 'Top Donor Metrics'],
    donationType: ['monthly', 'one-time']
  },
  // Top Donors
  {
    id: 'churnedMonthly',
    title: 'Monthly Donors Who Churned',
    value: metrics.monthlyDonorsWhoChurned,
    icon: faUserSlash,
    variant: 'warning',
    onClick: () => openModal('churnedMonthly'),
    subtitle: 'Click to view list',
    categories: ['Retention & Churn'],
    donationType: ['monthly']
  },
  {
    id: 'top20Recurring',
    title: 'Top 20 Recurring Donors (YTD)',
    value: data.topRecurringDonors.length,
    icon: faCalendarAlt,
    variant: 'success',
    onClick: () => openModal('top20Recurring'),
    subtitle: 'Click to view list',
    categories: ['Top Donor Metrics'],
    donationType: ['monthly']
  },
  {
    id: 'top20NonRecurring',
    title: 'Top 20 One-Time Donors (YTD)',
    value: data.topNonRecurringDonors.length,
    icon: faArrowUpRightDots,
    variant: 'info',
    onClick: () => openModal('top20NonRecurring'),
    subtitle: 'Click to view list',
    categories: ['Top Donor Metrics'],
    donationType: ['one-time']
  },
  
  {
    id: 'majorMonthly',
    title: 'Major Monthly Donors (YTD)',
    value: data.majorMonthly.length,
    icon: faUserTie,
    variant: 'success',
    onClick: () => openModal('majorMonthly'),
    subtitle: '$100+/mo',
    categories: ['Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'mediumMonthly',
    title: 'Medium Monthly Donors (YTD)',
    value: data.mediumMonthly.length,
    icon: faUserFriends,
    variant: 'primary',
    onClick: () => openModal('mediumMonthly'),
    subtitle: '$50-100/mo',
    categories: ['Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'normalMonthly',
    title: 'Normal Monthly Donors (YTD)',
    value: data.normalMonthly.length,
    icon: faUser,
    variant: 'secondary',
    onClick: () => openModal('normalMonthly'),
    subtitle: '< $50/mo',
    categories: ['Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'majorOnetime',
    title: 'Major One-Time Donors (YTD)',
    value: data.majorOnetime.length,
    icon: faUserTie,
    variant: 'success',
    onClick: () => openModal('majorOnetime'),
    subtitle: '$1,000+',
    categories: ['Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'mediumOnetime',
    title: 'Medium One-Time Donors (YTD)',
    value: data.mediumOnetime.length,
    icon: faUserEdit,
    variant: 'primary',
    onClick: () => openModal('mediumOnetime'),
    subtitle: '$500-1,000',
    categories: ['Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'normalOnetime',
    title: 'Normal One-Time Donors (YTD)',
    value: data.normalOnetime.length,
    icon: faUser,
    variant: 'secondary',
    onClick: () => openModal('normalOnetime'),
    subtitle: '< $500',
    categories: ['Donor Classifications'],
    donationType: ['one-time']
  },

  // Donor Classifications (All-Time)
  {
    id: 'allTimeMajorMonthly',
    title: 'Major Monthly Donors (All-Time)',
    value: data.allTimeMajorMonthly.length,
    icon: faUserTie,
    variant: 'dark',
    onClick: () => openModal('allTimeMajorMonthly'),
    subtitle: '$100+/avg mo',
    categories: ['All-Time Classifications' , 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'allTimeMediumMonthly',
    title: 'Medium Monthly Donors (All-Time)',
    value: data.allTimeMediumMonthly.length,
    icon: faUserFriends,
    variant: 'primary',
    onClick: () => openModal('allTimeMediumMonthly'),
    subtitle: '$50-100/avg mo',
    categories: ['All-Time Classifications' , 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'allTimeNormalMonthly',
    title: 'Normal Monthly Donors (All-Time)',
    value: data.allTimeNormalMonthly.length,
    icon: faUser,
    variant: 'secondary',
    onClick: () => openModal('allTimeNormalMonthly'),
    subtitle: '< $50/avg mo',
    categories: ['All-Time Classifications' , 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'allTimeMajorOnetime',
    title: 'Major One-Time Donors (All-Time)',
    value: data.allTimeMajorOnetime.length,
    icon: faUserTie,
    variant: 'dark',
    onClick: () => openModal('allTimeMajorOnetime'),
    subtitle: '$1,000+',
    categories: ['All-Time Classifications' , 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'allTimeMediumOnetime',
    title: 'Medium One-Time Donors (All-Time)',
    value: data.allTimeMediumOnetime.length,
    icon: faUserEdit,
    variant: 'primary',
    onClick: () => openModal('allTimeMediumOnetime'),
    subtitle: '$500-1,000',
    categories: ['All-Time Classifications' , 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'allTimeNormalOnetime',
    title: 'Normal One-Time Donors (All-Time)',
    value: data.allTimeNormalOnetime.length,
    icon: faUser,
    variant: 'secondary',
    onClick: () => openModal('allTimeNormalOnetime'),
    subtitle: '< $500',
    categories: ['All-Time Classifications' , 'Donor Classifications'],
    donationType: ['one-time']
  },

  // Churn & Retention

  // Donation Tiers (YTD)
  {
    id: 'totalDonationsYTD',
    title: 'Total Donations (YTD)',
    value: formatAmount(data.totalYTD),
    icon: faChartPie,
    variant: 'primary',
    subtitle: `All gifts since Jan 1, ${currentYear}`,
    onClick: () => openModal('totalDonationsYTD'),
    categories: ['Donation Tiers (YTD)'],
    donationType: ['monthly', 'one-time']
  },
  {
    id: 'totalOnetimeYTD',
    title: 'Total One-Time Donations (YTD)',
    value: formatAmount(data.totalOnetimeYTD),
    icon: faDollarSign,
    variant: 'info',
    subtitle: `All non-recurring gifts this year`,
    onClick: () => openModal('totalOnetimeYTD'),
    categories: ['Donation Tiers (YTD)'],
    donationType: ['one-time']
  },
  {
    id: 'totalMonthlyYTD',
    title: 'Total Monthly Donations (YTD)',
    value: formatAmount(data.totalMonthlyYTD),
    icon: faCalendarAlt,
    variant: 'info',
    subtitle: `All recurring gifts this year`,
    onClick: () => openModal('totalMonthlyYTD'),
    categories: ['Donation Tiers (YTD)'],
    donationType: ['monthly']
  },
  {
    id: 'majorOnetimeYTD',
    title: 'Major One-Time Donations (YTD)',
    value: formatAmount(data.majorOnetimeYTD.total),
    icon: faStar,
    variant: 'success',
    subtitle: `Gifts ≥ $1,000 (${(data.totalOnetimeYTD > 0 ? (data.majorOnetimeYTD.total / data.totalOnetimeYTD) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('majorOnetimeYTD'),
   categories: ['Donation Tiers (YTD)', 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'mediumOnetimeYTD',
    title: 'Medium One-Time Donations (YTD)',
    value: formatAmount(data.mediumOnetimeYTD.total),
    icon: faGift,
    variant: 'info',
    subtitle: `Gifts $500-$999 (${(data.totalOnetimeYTD > 0 ? (data.mediumOnetimeYTD.total / data.totalOnetimeYTD) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('mediumOnetimeYTD'),
    categories: ['Donation Tiers (YTD)', 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'normalOnetimeYTD',
    title: 'Normal One-Time Donations (YTD)',
    value: formatAmount(data.normalOnetimeYTD.total),
    icon: faHandHoldingHeart,
    variant: 'secondary',
    subtitle: `Gifts < $500 (${(data.totalOnetimeYTD > 0 ? (data.normalOnetimeYTD.total / data.totalOnetimeYTD) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('normalOnetimeYTD'),
    categories: ['Donation Tiers (YTD)', 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'majorMonthlyYTD',
    title: 'Major Monthly Donations (YTD)',
    value: formatAmount(data.majorMonthlyYTD.total),
    icon: faStar,
    variant: 'success',
    subtitle: `Gifts ≥ $100 (${(data.totalMonthlyYTD > 0 ? (data.majorMonthlyYTD.total / data.totalMonthlyYTD) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('majorMonthlyYTD'),
    categories: ['Donation Tiers (YTD)', 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'mediumMonthlyYTD',
    title: 'Medium Monthly Donations (YTD)',
    value: formatAmount(data.mediumMonthlyYTD.total),
    icon: faGift,
    variant: 'info',
    subtitle: `Gifts $50-$99 (${(data.totalMonthlyYTD > 0 ? (data.mediumMonthlyYTD.total / data.totalMonthlyYTD) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('mediumMonthlyYTD'),
    categories: ['Donation Tiers (YTD)', 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'normalMonthlyYTD',
    title: 'Normal Monthly Donations (YTD)',
    value: formatAmount(data.normalMonthlyYTD.total),
    icon: faHandHoldingHeart,
    variant: 'secondary',
    subtitle: `Gifts < $50 (${(data.totalMonthlyYTD > 0 ? (data.normalMonthlyYTD.total / data.totalMonthlyYTD) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('normalMonthlyYTD'),
    categories: ['Donation Tiers (YTD)', 'Donor Classifications'],
    donationType: ['monthly']
  },

  // Donation Tiers (All-Time)
  {
    id: 'totalOnetimeAllTime',
    title: 'Total One-Time Donations (All-Time)',
    value: formatAmount(data.totalOnetimeAllTime),
    icon: faDollarSign,
    variant: 'dark',
    subtitle: 'All non-recurring gifts',
    onClick: () => openModal('totalOnetimeAllTime'),
    categories: ['Donation Tiers (All-Time)'],
    donationType: ['one-time']
  },
  {
    id: 'majorOnetimeAllTime',
    title: 'Major One-Time Donations (All-Time)',
    value: formatAmount(data.majorOnetimeAllTime.total),
    icon: faStar,
    variant: 'primary',
    subtitle: `Gifts ≥ $1,000 (${(data.totalOnetimeAllTime > 0 ? (data.majorOnetimeAllTime.total / data.totalOnetimeAllTime) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('majorOnetimeAllTime'),
    categories: ['Donation Tiers (All-Time)','Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'mediumOnetimeAllTime',
    title: 'Medium One-Time Donations (All-Time)',
    value: formatAmount(data.mediumOnetimeAllTime.total),
    icon: faGift,
    variant: 'info',
    subtitle: `Gifts $500-$999 (${(data.totalOnetimeAllTime > 0 ? (data.mediumOnetimeAllTime.total / data.totalOnetimeAllTime) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('mediumOnetimeAllTime'),
    categories: ['Donation Tiers (All-Time)', 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'normalOnetimeAllTime',
    title: 'Normal One-Time Donations (All-Time)',
    value: formatAmount(data.normalOnetimeAllTime.total),
    icon: faHandHoldingHeart,
    variant: 'secondary',
    subtitle: `Gifts < $500 (${(data.totalOnetimeAllTime > 0 ? (data.normalOnetimeAllTime.total / data.totalOnetimeAllTime) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('normalOnetimeAllTime'),
    categories: ['Donation Tiers (All-Time)', 'Donor Classifications'],
    donationType: ['one-time']
  },
  {
    id: 'totalMonthlyAllTime',
    title: 'Total Monthly Donations (All-Time)',
    value: formatAmount(data.totalMonthlyAllTime),
    icon: faCalendarAlt,
    variant: 'dark',
    subtitle: 'All recurring gifts',
    onClick: () => openModal('totalMonthlyAllTime'),
    categories: ['Donation Tiers (All-Time)'],
    donationType: ['monthly']
  },
  {
    id: 'majorMonthlyAllTime',
    title: 'Major Monthly Donations (All-Time)',
    value: formatAmount(data.majorMonthlyAllTime.total),
    icon: faStar,
    variant: 'primary',
    subtitle: `Gifts ≥ $100 (${(data.totalMonthlyAllTime > 0 ? (data.majorMonthlyAllTime.total / data.totalMonthlyAllTime) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('majorMonthlyAllTime'),
    categories: ['Donation Tiers (All-Time)', 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'mediumMonthlyAllTime',
    title: 'Medium Monthly Donations (All-Time)',
    value: formatAmount(data.mediumMonthlyAllTime.total),
    icon: faGift,
    variant: 'info',
    subtitle: `Gifts $50-$99 (${(data.totalMonthlyAllTime > 0 ? (data.mediumMonthlyAllTime.total / data.totalMonthlyAllTime) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('mediumMonthlyAllTime'),
    categories: ['Donation Tiers (All-Time)', 'Donor Classifications'],
    donationType: ['monthly']
  },
  {
    id: 'normalMonthlyAllTime',
    title: 'Normal Monthly Donations (All-Time)',
    value: formatAmount(data.normalMonthlyAllTime.total),
    icon: faHandHoldingHeart,
    variant: 'secondary',
    subtitle: `Gifts < $50 (${(data.totalMonthlyAllTime > 0 ? (data.normalMonthlyAllTime.total / data.totalMonthlyAllTime) * 100 : 0).toFixed(1)}%)`,
    onClick: () => openModal('normalMonthlyAllTime'),
    categories: ['Donation Tiers (All-Time)', 'Donor Classifications'],
    donationType: ['monthly']
  },

  // Lifetime Value

    {
    id: 'churnedMajorMonthly',
    title: 'Churned Major Monthly Donors',
    value: data.churnedMonthlyMajor.length,
    icon: faUserSlash,
    variant: 'danger',
    onClick: () => openModal('churnedMajorMonthly'),
    subtitle: 'All-Time Major Monthly Donors whom churned',
    categories: ['Retention & Churn'],
    donationType: ['monthly']
  },
    {
    id: 'retainedMajorMonthly',
    title: 'Retained Major Monthly Donors',
    value: data.retainedMajorMonthly.length,
    icon: faUserCheck,
    variant: 'success',
    onClick: () => openModal('retainedMajorMonthly'),
    subtitle: `Major Monthly in ${currentYear-1} & ${currentYear}`,
    categories: ['Retention & Churn'],
    donationType: ['monthly']
  },
  {
    id: 'monthlyMajorDLV',
    title: 'Avg. Monthly Major Donor DLV',
    value: formatAmount(data.monthlyMajorDLV),
    icon: faGem,
    variant: 'success',
    subtitle: 'Predicted value (Click to view cohort)',
    onClick: () => openModal('monthlyMajorDLV'),
    categories: ['Lifetime Value'],
    donationType: ['monthly']
  },
  {
    id: 'onetimeMajorDLV',
    title: 'Avg. One-Time Major Donor DLV',
    value: formatAmount(data.onetimeMajorDLV),
    icon: faGem,
    variant: 'info',
    subtitle: 'Predicted value (Click to view cohort)',
    onClick: () => openModal('onetimeMajorDLV'),
    categories: ['Lifetime Value'],
    donationType: ['one-time']
  },
  {
    id: 'activeDonors',
    title: 'Active Donors (Last 3 Months)',
    value: '---',
    icon: faWrench,
    variant: 'dark',
    subtitle: 'CURRENTLY BEING FIXED',
    onClick: () => {},
    categories: ['Top Donor Metrics', 'Current Year Metrics'],
    donationType: ['monthly', 'one-time']
  },
  // Median & WMA Analysis
      ];

  const filteredMetrics = metricDefinitions
    .filter(metric => metric.donationType.includes(donationTypeFilter))
    .filter(metric => activeFilter === 'All Metrics' || metric.categories.includes(activeFilter))
    .filter(metric => {
      if (!searchTerm) return true;
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      return metric.title.toLowerCase().includes(lowerCaseSearchTerm);
    });

  return (
    <div className="content-body metrics-container">
      <div className="manager-header">
        <h2>Metrics</h2>
        <p className="manager-description">Overview of donor categories and key counts.</p>
      </div>

      <Controls
        filterOptions={{
          defaultOption: 'All Metrics',
          options: [
            'All Metrics', 'Top Donor Metrics', 'Current Year Metrics', 
            'Donor Classifications', 
            'Retention & Churn', 'Lifetime Value', 'Donation Tiers (YTD)',
          ]
        }}
        onFilterChange={setActiveFilter}
        searchPlaceholder="Search metrics..."
        onSearch={setSearchTerm}
        primaryButtonLabel=""
        secondaryButtonLabel=""
        showSecondaryButton={false}
        onDonationTypeChange={setDonationTypeFilter}
      />

      <div className="metrics-display-area">
        {activeFilter === 'Donor Classifications' || activeFilter === 'All-Time Classifications' ? (
          <div className="grouped-grid-view">
            {(['Major', 'Medium', 'Normal']).map(tier => {
              const allTierCards = filteredMetrics.filter(m => m.title.includes(tier));
              if (allTierCards.length === 0) return null;
              const oneYearCards = allTierCards.filter(m => !m.title.includes('All-Time'));
              const allTimeCards = allTierCards.filter(m => m.title.includes('All-Time'));
              return (
                <div key={tier} className="classification-tier">
                  <h3 className="classification-header">{tier} Donors</h3>
                  {oneYearCards.length > 0 && (<><h4 className="classification-subheader">1 Year</h4><div className="stat-cards-grid">{oneYearCards.map(metric => (<StatCard key={metric.id} {...metric as any} />))}</div></>)}
                  {allTimeCards.length > 0 && (<><h4 className="classification-subheader">All-Time</h4><div className="stat-cards-grid">{allTimeCards.map(metric => (<StatCard key={metric.id} {...metric as any} />))}</div></>)}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="stat-cards-grid">
            {filteredMetrics.map((metric) => (<StatCard key={metric.id} {...metric as any} />))}
            {filteredMetrics.length === 0 && (<p>No metrics available for "{activeFilter}" filter.</p>)}
          </div>
        )}
      </div>


       <Modal isOpen={isModalOpen} onClose={closeModal} title={metricDefinitions.find(m => m.id === modalContentId)?.title || 'Details'}>
        
        {/* === Main Lists === */}
        {modalContentId === 'newDonors' && (
          <div className="top-list-content">
            {data.newDonorsList.length === 0 ? (<div className="top-list-empty">No new donors in the last 30 days.</div>) : (<ul className="top-list">{data.newDonorsList.map((item: DonorData, i: number) => (<li key={item.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item)}</div><div className="top-list-details">{donorFullName(item)}</div><div className="top-list-secondary">{formatDate(item.created_at)}</div></li>))}</ul>)}
          </div>
        )}
        {modalContentId === 'recurringDonors' && (
          <div className="top-list-content">
            {data.recurringGiftsMonth.length === 0 ? (<div className="top-list-empty">No recurring gifts in the last month.</div>) : (<ul className="top-list">{data.recurringGiftsMonth.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul>)}
          </div>
        )}

        {/* === Median/WMA Detailed Breakdowns === */}
        {modalContentId === 'medianDonation' && (
           <div className="top-list-content">
            {data.medianIndex !== null && (<p style={{ margin: '0 0 1rem' }}><strong>Median Position:</strong> Gift #{data.medianIndex + 1}</p>)}
            <p style={{ margin: '0 0 1rem' }}><strong>Computed Median:</strong> {formatAmount(data.metrics.medianDonation)}</p>
            <ul className="top-list">{data.rawDonationsList.map((item: GiftWithDonor, idx: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">Gift ID {item.giftid}<br />{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)}<br />{formatDate(item.giftdate)}</div></li>))}</ul>
          </div>
        )}
        {modalContentId === 'wma' && (
          <div className="top-list-content">
            {data.wmaDetails.length === 0 ? (<div className="top-list-empty">No data available for WMA.</div>) : (<ul className="top-list">{data.wmaDetails.map((item: { monthLabel: string; total: number; weight: number }, i: number) => (<li key={item.monthLabel} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-details">{item.monthLabel}: {formatAmount(item.total)} × {item.weight}</div><div className="top-list-secondary">= <strong>{formatAmount(item.total * item.weight)}</strong></div></li>))}</ul>)}
            <p style={{ marginTop: '1em', fontWeight: 'bold' }}>Final WMA: {formatAmount(data.metrics.weightedMovingAvg)}</p>
          </div>
        )}
        
        {/* === Older Churn Metrics === */}
        {modalContentId === 'churnedLarge' && (
          <div className="top-list-content">
            {data.churnedLargeDetails.length === 0 ? <div className="top-list-empty">No large donors have churned.</div> : <ul className="top-list">{data.churnedLargeDetails.map((item: { donor: DonorData; priorYearSum: number }, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">Prior-years total: {formatAmount(item.priorYearSum)}</div></li>))}</ul>}
          </div>
        )}
        {modalContentId === 'churnedMonthly' && (
      <div className="top-list-content">
        {(!data.churnedDonorsList || data.churnedDonorsList.length === 0) ? (
          <div className="top-list-empty">No monthly donors from last year have churned.</div>
        ) : (
          <ul className="top-list">
            {data.churnedDonorsList.map((item: ChurnedDonorInfo, i: number) => {
              if (!item?.donor) { return <li key={`error-${i}`} style={{ color: 'red' }}>Error: Invalid data at index {i}.</li>; }
              return (
                <li key={item.donor.donorid} className="top-list-item">
                  <div className="top-list-rank">{i + 1}</div>
                  <div className="top-list-avatar">{donorInitials(item.donor)}</div>
                  <div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email || 'No Email'}</span></div>
                  <div className="top-list-secondary">Lifetime Total: {formatAmount(item.lifetimeTotal)}<br/><span style={{color: '#6c757d', fontStyle: 'italic'}}>Last Gift: {formatDate(item.lastGiftDate)}</span></div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    )}
        
        {/* === Median/WMA Analysis Lists === */}
        {modalContentId === 'recAboveMedian' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => g.isrecurring && g.totalamount! > data.metrics.medianDonation).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'recBelowMedian' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => g.isrecurring && g.totalamount! <= data.metrics.medianDonation).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecAboveMedian' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => !g.isrecurring && g.totalamount! > data.metrics.medianDonation).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecBelowMedian' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => !g.isrecurring && g.totalamount! <= data.metrics.medianDonation).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'recAboveWMA' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => g.isrecurring && g.totalamount! > data.metrics.weightedMovingAvg).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'recBelowWMA' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => g.isrecurring && g.totalamount! <= data.metrics.weightedMovingAvg).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecAboveWMA' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => !g.isrecurring && g.totalamount! > data.metrics.weightedMovingAvg).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecBelowWMA' && (<div className="top-list-content"><ol className="top-list">{data.rawDonationsList.filter((g: GiftWithDonor) => !g.isrecurring && g.totalamount! <= data.metrics.weightedMovingAvg).map((g: GiftWithDonor, idx: number) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}

        {/* === Top Donor Lists === */}
        {modalContentId === 'top20Recurring' && (<div className="top-list-content">{data.topRecurringDonors.length === 0 ? <div className="top-list-empty">No recurring donors this year.</div> : <ul className="top-list">{data.topRecurringDonors.map((item: TopDonorInfo, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br /><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmount)}<br /><span style={{color: '#6c757d'}}>{item.type}</span></div></li>))}</ul>}</div>)}
        {modalContentId === 'top20NonRecurring' && (<div className="top-list-content">{data.topNonRecurringDonors.length === 0 ? <div className="top-list-empty">No one-time donors this year.</div> : <ul className="top-list">{data.topNonRecurringDonors.map((item: TopDonorInfo, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br /><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmount)}<br /><span style={{color: '#6c757d'}}>{item.type}</span></div></li>))}</ul>}</div>)}

        {/* === Current Year Donor Classifications === */}
        {modalContentId === 'majorMonthly' && (<div className="top-list-content"><ul className="top-list">{data.majorMonthly.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>)}
        {modalContentId === 'mediumMonthly' && (<div className="top-list-content"><ul className="top-list">{data.mediumMonthly.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>)}
        {modalContentId === 'normalMonthly' && (<div className="top-list-content"><ul className="top-list">{data.normalMonthly.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>)}
        {modalContentId === 'majorOnetime' && (<div className="top-list-content"><ul className="top-list">{data.majorOnetime.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumOnetime' && (<div className="top-list-content"><ul className="top-list">{data.mediumOnetime.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalOnetime' && (<div className="top-list-content"><ul className="top-list">{data.normalOnetime.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}

        {/* === All-Time Donor Classifications === */}
        {modalContentId === 'allTimeMajorMonthly' && (<div className="top-list-content"><ul className="top-list">{data.allTimeMajorMonthly.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/avg mo</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeMediumMonthly' && (<div className="top-list-content"><ul className="top-list">{data.allTimeMediumMonthly.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/avg mo</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeNormalMonthly' && (<div className="top-list-content"><ul className="top-list">{data.allTimeNormalMonthly.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/avg mo</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeMajorOnetime' && (<div className="top-list-content"><ul className="top-list">{data.allTimeMajorOnetime.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeMediumOnetime' && (<div className="top-list-content"><ul className="top-list">{data.allTimeMediumOnetime.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeNormalOnetime' && (<div className="top-list-content"><ul className="top-list">{data.allTimeNormalOnetime.map((item: ClassifiedDonor) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        
        {/* === Churn & Retention === */}
        {modalContentId === 'churnedMajorMonthly' && (<div className="top-list-content"><ul className="top-list">{data.churnedMonthlyMajor.map((item: ChurnedDonorInfo, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">Lifetime Total: {formatAmount(item.lifetimeTotal)}<br/><span style={{color: '#6c757d'}}>Last Recurring Gift: {formatAmount(item.lastRecurringAmount)} on {formatDate(item.lastRecurringDate)}</span></div></li>))}</ul></div>)}
        {modalContentId === 'churnedMajorOnetime' && (<div className="top-list-content"><ul className="top-list">{data.churnedOnetimeMajor.map((item: ChurnedDonorInfo, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">Lifetime Total: {formatAmount(item.lifetimeTotal)}<br/><span style={{color: '#6c757d'}}>Last Gift: {formatDate(item.lastGiftDate)}</span></div></li>))}</ul></div>)}
        {modalContentId === 'retainedMajorMonthly' && (<div className="top-list-content"><ul className="top-list">{data.retainedMajorMonthly.map((item: ClassifiedDonor, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>)}

        {/* === Donation Tier Lists (YTD) === */}
        {modalContentId === 'totalDonationsYTD' && (<div className="top-list-content"><ul className="top-list">{data.allGiftsYTD.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'totalOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{data.onetimeGiftsYTD.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'totalMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{data.monthlyGiftsYTD.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{data.majorOnetimeYTD.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{data.mediumOnetimeYTD.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{data.normalOnetimeYTD.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{data.majorMonthlyYTD.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{data.mediumMonthlyYTD.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{data.normalMonthlyYTD.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}

        {/* === Donation Tier Lists (All-Time) === */}
        {modalContentId === 'totalOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{data.majorOnetimeAllTime.gifts.concat(data.mediumOnetimeAllTime.gifts, data.normalOnetimeAllTime.gifts).sort((a: GiftWithDonor, b: GiftWithDonor) => new Date(b.giftdate!).getTime() - new Date(a.giftdate!).getTime()).map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'totalMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{data.majorMonthlyAllTime.gifts.concat(data.mediumMonthlyAllTime.gifts, data.normalMonthlyAllTime.gifts).sort((a: GiftWithDonor, b: GiftWithDonor) => new Date(b.giftdate!).getTime() - new Date(a.giftdate!).getTime()).map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{data.majorOnetimeAllTime.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{data.mediumOnetimeAllTime.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{data.normalOnetimeAllTime.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{data.majorMonthlyAllTime.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{data.mediumMonthlyAllTime.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{data.normalMonthlyAllTime.gifts.map((item: GiftWithDonor, i: number) => (<li key={item.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">{formatAmount(item.totalamount)} on {formatDate(item.giftdate)}</div></li>))}</ul></div>)}

        {/* === Contribution & Lifetime Value === */}
        {modalContentId === 'majorDonorContribution' && (<div className="top-list-content"><ul className="top-list">{data.majorContributorsList.map((item: ContributionListItem, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalContribution)}</div></li>))}</ul></div>)}
        {modalContentId === 'monthlyMajorDLV' && (
          <div className="top-list-content">
            <div className="dlv-breakdown">
              <p><strong>Average Lifetime Total per Donor:</strong> {formatAmount(data.monthlyDlvComponents.avgLifetimeTotal)}</p><hr/><p><em>DLV Formula Components:</em></p><p><strong>Average Gift Amount:</strong> {formatAmount(data.monthlyDlvComponents.amount)}</p><p><strong>Average Annual Donations:</strong> {data.monthlyDlvComponents.frequency.toFixed(2)}</p><p><strong>Average Donor Lifespan:</strong> {data.monthlyDlvComponents.lifespan.toFixed(2)} years</p><p className="dlv-formula">{formatAmount(data.monthlyDlvComponents.amount)} &times; {data.monthlyDlvComponents.frequency.toFixed(2)} &times; {data.monthlyDlvComponents.lifespan.toFixed(2)} years = <strong>{formatAmount(data.monthlyMajorDLV)}</strong></p>
            </div>
            <ul className="top-list">{data.monthlyDlvCohort.map((item: ContributionListItem, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalContribution)}</div></li>))}</ul>
          </div>
        )}
        {modalContentId === 'onetimeMajorDLV' && (
          <div className="top-list-content">
            <div className="dlv-breakdown">
              <p><strong>Average Lifetime Total per Donor:</strong> {formatAmount(data.onetimeDlvComponents.avgLifetimeTotal)}</p><hr/><p><em>DLV Formula Components:</em></p><p><strong>Average Gift Amount:</strong> {formatAmount(data.onetimeDlvComponents.amount)}</p><p><strong>Average Annual Donations:</strong> {data.onetimeDlvComponents.frequency.toFixed(2)}</p><p><strong>Average Donor Lifespan:</strong> {data.onetimeDlvComponents.lifespan.toFixed(2)} years</p><p className="dlv-formula">{formatAmount(data.onetimeDlvComponents.amount)} &times; {data.onetimeDlvComponents.frequency.toFixed(2)} &times; {data.onetimeDlvComponents.lifespan.toFixed(2)} years = <strong>{formatAmount(data.onetimeMajorDLV)}</strong></p>
            </div>
            {<ul className="top-list">{data.onetimeDlvCohort.map((item: ContributionListItem, i: number) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalContribution)}</div></li>))}</ul>}
          </div>
        )}
      </Modal>
    </div>
      );
    };

export default Metrics;


