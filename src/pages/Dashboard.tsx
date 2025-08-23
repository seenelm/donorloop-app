import React, { useState, useEffect } from 'react';
import './styles/Dashboard.css';
import '../components/styles/DonationMetrics.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faRocket,
  faBuilding,
  faDollarSign,
  faUsers,
  faChartLine,
  faRepeat,
  faTrophy,
  faCalendarAlt,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import OnboardingModal from '../components/onboarding/OnboardingModal';
import { initializeDatabase, fetchGifts, fetchDonors, type GiftData, type DonorData } from '../utils/supabaseClient';
import StatCard from '../components/stats/StatCard';
import TopListCard from '../components/stats/TopListCard';
import { useNavigate } from 'react-router';

const Dashboard: React.FC = () => {
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [metrics, setMetrics] = useState({
    totalDonationsMTD: 0,
    totalDonorPool: 0,
    averageDonationAmount: 0,
    recurringDonations: 0,
    donationsChart: [] as number[],
    donorsChart: [] as number[],
    averageChart: [] as number[],
    recurringChart: [] as number[],
    topDonors: [] as {id: string | number; primary: string; secondary: number}[],
    lybuntDonors: [] as {id: string | number; primary: string; secondary: number}[],
    sybuntDonors: [] as {id: string | number; primary: string; secondary: number}[]
  });

  // Initialize database and fetch existing donations and metrics on component mount
  useEffect(() => {
    const setupAndLoadData = async () => {
      setIsLoading(true);
      
      // First initialize the database
      try {
        const { success, error } = await initializeDatabase();
        if (!success) {
          console.error('Failed to initialize database:', error);
          setDbError(`Database initialization failed: ${error}`);
        } else {
          console.log('Database initialized successfully');
          
          // Fetch gifts and donors
          const [giftsResult, donorsResult] = await Promise.all([
            fetchGifts(),
            fetchDonors()
          ]);
          
          if (giftsResult.error) {
            console.error('Error fetching gifts:', giftsResult.error);
          } else {
            setGifts(giftsResult.data || []);
          }
          
          // Calculate metrics
          calculateMetrics(giftsResult.data || [], donorsResult.data || []);
        }
      } catch (err) {
        console.error('Error during database initialization:', err);
        setDbError('Database initialization error');
      }
      
      setIsLoading(false);
    };
    
    setupAndLoadData();
  }, []);
  
  // Calculate metrics from gifts and donors data
  const calculateMetrics = (gifts: GiftData[], donors: DonorData[]) => {
    // Get current date for MTD calculations
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // Filter gifts for current month
    const giftsMTD = gifts.filter(gift => {
      if (!gift.giftdate) return false;
      const giftDate = new Date(gift.giftdate);
      return giftDate.getMonth() === currentMonth && giftDate.getFullYear() === currentYear;
    });
    
    // Calculate total donations MTD
    const totalDonationsMTD = giftsMTD.reduce((sum, gift) => sum + (gift.totalamount || 0), 0);
    
    // Calculate total donor pool (unique donors)
    const totalDonorPool = donors.length;
    
    // Calculate average donation amount
    const averageDonationAmount = gifts.length > 0 
      ? gifts.reduce((sum, gift) => sum + (gift.totalamount || 0), 0) / gifts.length 
      : 0;
    
    // Calculate number of recurring donations
    const recurringDonations = gifts.filter(gift => gift.isrecurring).length;
    
    // Generate chart data for the last 6 months
    const donationsChart = generateMonthlyDonationsData(gifts, 6);
    const donorsChart = generateMonthlyDonorsData(gifts, 6);
    const averageChart = generateMonthlyAverageData(gifts, 6);
    const recurringChart = generateMonthlyRecurringData(gifts, 6);
    
    // Calculate top donors
    const topDonors = calculateTopDonors(gifts, donors);
    
    // Calculate LYBUNT and SYBUNT donors
    const { lybuntDonors, sybuntDonors } = calculateLybuntSybunt(gifts, donors);
    
    setMetrics({
      totalDonationsMTD,
      totalDonorPool,
      averageDonationAmount,
      recurringDonations,
      donationsChart,
      donorsChart,
      averageChart,
      recurringChart,
      topDonors,
      lybuntDonors,
      sybuntDonors
    });
  };
  
  // Calculate top donors by total donation amount
  const calculateTopDonors = (gifts: GiftData[], donors: DonorData[]) => {
    // Create a map to sum up donations by donor
    const donorTotals = new Map<string | number, number>();
    
    // Sum up all donations by donor ID
    gifts.forEach(gift => {
      if (!gift.donorid || !gift.totalamount) return;
      
      const currentTotal = donorTotals.get(gift.donorid) || 0;
      donorTotals.set(gift.donorid, currentTotal + gift.totalamount);
    });
    
    // Convert to array and sort by total amount
    const donorArray = Array.from(donorTotals.entries()).map(([donorid, total]) => {
      // Find donor details
      const donor = donors.find(d => d.donorid === donorid);
      const donorName = donor ? `${donor.firstname || ''} ${donor.lastname || ''}`.trim() : 'Unknown Donor';
      
      return {
        id: donorid,
        primary: donorName,
        secondary: total
      };
    });
    
    // Sort by total amount descending and take top 10
    return donorArray
      .sort((a, b) => (b.secondary as number) - (a.secondary as number))
      .slice(0, 10);
  };
  
  // Calculate LYBUNT and SYBUNT donors
  const calculateLybuntSybunt = (gifts: GiftData[], donors: DonorData[]) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const lastYear = currentYear - 1;
    
    // Create maps to track donor giving by year
    const donorsByYear = new Map<string, Set<number>>();
    const donorTotalByYear = new Map<string, Map<number, number>>();
    
    // Process all gifts to build donor giving history
    gifts.forEach(gift => {
      if (!gift.donorid || !gift.giftdate || !gift.totalamount) return;
      
      const giftDate = new Date(gift.giftdate);
      const giftYear = giftDate.getFullYear();
      const donorid = gift.donorid;
      
      // Track which years each donor gave
      if (!donorsByYear.has(donorid)) {
        donorsByYear.set(donorid, new Set());
      }
      donorsByYear.get(donorid)?.add(giftYear);
      
      // Track total giving by donor by year
      if (!donorTotalByYear.has(donorid)) {
        donorTotalByYear.set(donorid, new Map());
      }
      const yearMap = donorTotalByYear.get(donorid);
      if (yearMap) {
        const currentTotal = yearMap.get(giftYear) || 0;
        yearMap.set(giftYear, currentTotal + gift.totalamount);
      }
    });
    
    // Find LYBUNT donors (gave last year but not this year)
    const lybuntDonorIds = Array.from(donorsByYear.entries())
      .filter(([_, years]) => years.has(lastYear) && !years.has(currentYear))
      .map(([donorid, _]) => donorid);
    
    // Find SYBUNT donors (gave some year but not this year or last year)
    const sybuntDonorIds = Array.from(donorsByYear.entries())
      .filter(([_, years]) => {
        // Has given in some year
        return years.size > 0 
          // But not this year
          && !years.has(currentYear) 
          // And not last year (to avoid duplicates with LYBUNT)
          && !years.has(lastYear);
      })
      .map(([donorid, _]) => donorid);
    
    // Create LYBUNT list with donor info and last year's total
    const lybuntDonors = lybuntDonorIds.map(donorid => {
      const donor = donors.find(d => d.donorid === donorid);
      const donorName = donor ? `${donor.firstname || ''} ${donor.lastname || ''}`.trim() : 'Unknown Donor';
      const lastYearTotal = donorTotalByYear.get(donorid)?.get(lastYear) || 0;
      
      return {
        id: donorid,
        primary: donorName,
        secondary: lastYearTotal
      };
    })
    .sort((a, b) => (b.secondary as number) - (a.secondary as number))
    .slice(0, 5);
    
    // Create SYBUNT list with donor info and their highest year's total
    const sybuntDonors = sybuntDonorIds.map(donorid => {
      const donor = donors.find(d => d.donorid === donorid);
      const donorName = donor ? `${donor.firstname || ''} ${donor.lastname || ''}`.trim() : 'Unknown Donor';
      
      // Find the highest donation year for this donor
      const yearMap = donorTotalByYear.get(donorid);
      let highestAmount = 0;
      
      if (yearMap) {
        for (const [_, amount] of yearMap.entries()) {
          if (amount > highestAmount) {
            highestAmount = amount;
          }
        }
      }
      
      return {
        id: donorid,
        primary: donorName,
        secondary: highestAmount
      };
    })
    .sort((a, b) => (b.secondary as number) - (a.secondary as number))
    .slice(0, 5);
    
    return { lybuntDonors, sybuntDonors };
  };
  
  // Generate monthly donation totals for the past n months
  const generateMonthlyDonationsData = (gifts: GiftData[], monthsCount: number): number[] => {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthTotal = gifts.reduce((sum, gift) => {
        if (!gift.giftdate) return sum;
        const giftDate = new Date(gift.giftdate);
        if (giftDate.getMonth() === targetMonth.getMonth() && 
            giftDate.getFullYear() === targetMonth.getFullYear()) {
          return sum + (gift.totalamount || 0);
        }
        return sum;
      }, 0);
      
      data.push(monthTotal);
    }
    
    return data;
  };
  
  // Generate monthly unique donors count for the past n months
  const generateMonthlyDonorsData = (gifts: GiftData[], monthsCount: number): number[] => {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const uniqueDonors = new Set();
      
      gifts.forEach(gift => {
        if (!gift.giftdate) return;
        const giftDate = new Date(gift.giftdate);
        if (giftDate.getMonth() === targetMonth.getMonth() && 
            giftDate.getFullYear() === targetMonth.getFullYear()) {
          uniqueDonors.add(gift.donorid);
        }
      });
      
      data.push(uniqueDonors.size);
    }
    
    return data;
  };
  
  // Generate monthly average donation amount for the past n months
  const generateMonthlyAverageData = (gifts: GiftData[], monthsCount: number): number[] => {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      let totalAmount = 0;
      let count = 0;
      
      gifts.forEach(gift => {
        if (!gift.giftdate) return;
        const giftDate = new Date(gift.giftdate);
        if (giftDate.getMonth() === targetMonth.getMonth() && 
            giftDate.getFullYear() === targetMonth.getFullYear()) {
          totalAmount += (gift.totalamount || 0);
          count++;
        }
      });
      
      data.push(count > 0 ? totalAmount / count : 0);
    }
    
    return data;
  };
  
  // Generate monthly recurring donations count for the past n months
  const generateMonthlyRecurringData = (gifts: GiftData[], monthsCount: number): number[] => {
    const data: number[] = [];
    const now = new Date();
    
    for (let i = monthsCount - 1; i >= 0; i--) {
      const targetMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
      let count = 0;
      
      gifts.forEach(gift => {
        if (!gift.giftdate || !gift.isrecurring) return;
        const giftDate = new Date(gift.giftdate);
        if (giftDate.getMonth() === targetMonth.getMonth() && 
            giftDate.getFullYear() === targetMonth.getFullYear()) {
          count++;
        }
      });
      
      data.push(count);
    }
    
    return data;
  };
  
  const handleOpenOnboardingModal = () => {
    setShowOnboardingModal(true);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
  };
  
  const handleCloseOnboardingModal = () => {
    setShowOnboardingModal(false);
    // Re-enable body scrolling when modal is closed
    document.body.style.overflow = 'auto';
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Render content based on state
  const renderContent = () => {
    // Show loading state
    if (isLoading) {
      return (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <p>Loading your dashboard...</p>
        </div>
      );
    }
    
    // Show database error if there is one
    if (dbError) {
      return (
        <div className="dashboard-error">
          <h2> Service Unavailable </h2>
        </div>
      );
    }
    
    // Show empty state if no donations
    if (gifts.length === 0) {
      return (
        <div className="dashboard-empty">
          <div className="empty-state-icon">
            <FontAwesomeIcon icon={faRocket} />
          </div>
          <h2>Welcome to Givin AI!</h2>
          <p>Get started by importing your donation data or setting up your organization.</p>
          <div className="empty-state-actions">
            {/* <button className="primary-button" onClick={handleOpenImportModal}>
              <FontAwesomeIcon icon={faFileImport} />
              Import Donations
            </button> */}
            <button className="secondary-button" onClick={handleOpenOnboardingModal}>
              <FontAwesomeIcon icon={faBuilding} />
              Set Up Organization
            </button>
          </div>
        </div>
      );
    }
    
    // Show dashboard with metrics
    return (
      <div className="dashboard-content">
        <div className="manager-header">
          <h2>Dashboard</h2>
          <p className="manager-description">
            Overview of your donation metrics and fundraising performance.
          </p>
        </div>
        
        <div className="stat-cards-grid">
          <StatCard 
            title="Total Donations (MTD)" 
            value={formatCurrency(metrics.totalDonationsMTD)}
            icon={faDollarSign}
            variant="primary"
            subtitle="Month to date"
            chartData={metrics.donationsChart}
          />
          <StatCard 
            title="Total Donor Pool" 
            value={metrics.totalDonorPool}
            icon={faUsers}
            variant="secondary"
            subtitle="Unique donors"
            chartData={metrics.donorsChart}
          />
          <StatCard 
            title="Average Donation" 
            value={formatCurrency(metrics.averageDonationAmount)}
            icon={faChartLine}
            variant="info"
            subtitle="Per transaction"
            chartData={metrics.averageChart}
          />
          <StatCard 
            title="Recurring Donations" 
            value={metrics.recurringDonations}
            icon={faRepeat}
            variant="success"
            subtitle="Active recurring gifts"
            chartData={metrics.recurringChart}
          />
          
          {/* Top Donors Card */}
          <TopListCard 
            title="Top Donors" 
            icon={faTrophy}
            variant="secondary"
            items={metrics.topDonors}
            isMonetary={true}
            onItemClick={(id) => navigate(`/donor-profile/${id}`)}
          />
          
          {/* LYBUNT and SYBUNT Cards */}
          <div className="stacked-cards">
            <TopListCard 
              title="LYBUNT Donors" 
              icon={faCalendarAlt}
              variant="warning"
              items={metrics.lybuntDonors}
              isMonetary={true}
              onItemClick={(id) => navigate(`/donor-profile/${id}`)}
            />
            
            <TopListCard 
              title="SYBUNT Donors" 
              icon={faHistory}
              variant="info"
              items={metrics.sybuntDonors}
              isMonetary={true}
              onItemClick={(id) => navigate(`/donor-profile/${id}`)}
            />
          </div>
        </div>
        
        {/* Additional dashboard content can go here */}
      </div>
    );
  };

  return (
    <div className="content-body">
      {renderContent()}
      
      {/* Modals */}
      <OnboardingModal 
        showModal={showOnboardingModal} 
        onClose={handleCloseOnboardingModal} 
      />
    </div>
  );
};

export default Dashboard;
