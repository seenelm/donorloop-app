import React, { useState, useEffect } from 'react';
import {
  faCalendarAlt,
  faChartLine,
  faPercent,
  faArrowUp,
  faArrowDown,
  faUserPlus,
  faArrowUpRightDots,
  faArrowDownShortWide,
  faArrowTrendUp,
  faArrowTrendDown,
  faInfoCircle,
  faUserSlash,
  faUser,
  faUserCheck,
  faUserFriends,
  faUserEdit,
  faUserTie,
  faStar,
  faGem,
  faPiggyBank,
  faGift,
  faHandHoldingHeart,
  faDollarSign,
} from '@fortawesome/free-solid-svg-icons';
import { fetchGifts, fetchDonors, type GiftData, type DonorData } from '../utils/supabaseClient';
import StatCard from '../components/stats/StatCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Controls from '../components/controls/Controls';
import './styles/metrics.css';
import Modal from '../components/popup/modal'; // Adjust path as needed

const donorInitials = (donor?: DonorData | null) =>
  donor ? `${donor.firstname?.[0] || ''}${donor.lastname?.[0] || ''}` : '—';

const donorFullName = (donor?: DonorData | null) =>
  donor ? `${donor.firstname || ''} ${donor.lastname || ''}`.trim() : '';

const formatDate = (date?: string) => {
  if (!date) return '';
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d.toLocaleDateString();
};

const formatAmount = (amount?: number) => {
  if (amount === undefined) return '';
  
  // This automatically handles currency symbols, commas, and decimal points.
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Create a new type that omits the 'donor' property from GiftData
type GiftDataWithoutDonor = Omit<GiftData, 'donor'>;

// Then create GiftWithDonor by extending GiftDataWithoutDonor
type GiftWithDonor = GiftDataWithoutDonor & { donor?: DonorData | null };

type TopDonorInfo = {
  donor: DonorData;
  totalAmount: number;
  type: 'Recurring' | 'One-Time';
};

type ClassifiedDonor = {
  donor: DonorData;
  amount: number; // This will be the monthly amount or annual total
};

type ChurnedDonorInfo = {
  donor: DonorData;
  lifetimeTotal: number;
  lastGiftDate: string;
  lastRecurringAmount?: number;
  lastRecurringDate?: string;
};

type ContributionListItem = {
  donor: DonorData;
  totalContribution: number;
};


type MetricsType = {
  newDonorsLastMonth: number;
  recurringDonorsLastMonth: number;
  medianDonation: number;
  weightedMovingAvg: number;
  recAboveMedian1mo: number;
  activeDonorsLast3mo: number;
  recBelowMedian1mo: number;
  nonRecAboveMedian1mo: number;
  nonRecBelowMedian1mo: number;
  recAboveWMA1mo: number;
  recBelowWMA1mo: number;
  nonRecAboveWMA1mo: number;
  nonRecBelowWMA1mo: number;
  recurringDonationRatio: number;
  churnedLargeDonors: number;
  monthlyDonorsWhoChurned: number;
};

const Metrics: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All Metrics');
  const [searchTerm, setSearchTerm] = useState('');

  const [newDonorsList, setNewDonorsList] = useState<DonorData[]>([]);
  const [recurringGiftsMonth, setRecurringGiftsMonth] = useState<GiftWithDonor[]>([]);
  const [rawDonationsList, setRawDonationsList] = useState<GiftWithDonor[]>([]);
  const [medianIndex, setMedianIndex] = useState<number | null>(null);
  const [normalOnetime, setNormalOnetime] = useState<ClassifiedDonor[]>([]);
  const [mediumOnetime, setMediumOnetime] = useState<ClassifiedDonor[]>([]);
  const [majorOnetime, setMajorOnetime] = useState<ClassifiedDonor[]>([]);
  const [normalMonthly, setNormalMonthly] = useState<ClassifiedDonor[]>([]);
  const [mediumMonthly, setMediumMonthly] = useState<ClassifiedDonor[]>([]);
  const [majorMonthly, setMajorMonthly] = useState<ClassifiedDonor[]>([]);
  const [allTimeNormalOnetime, setAllTimeNormalOnetime] = useState<ClassifiedDonor[]>([]);
  const [allTimeMediumOnetime, setAllTimeMediumOnetime] = useState<ClassifiedDonor[]>([]);
  const [allTimeMajorOnetime, setAllTimeMajorOnetime] = useState<ClassifiedDonor[]>([]);
  const [allTimeNormalMonthly, setAllTimeNormalMonthly] = useState<ClassifiedDonor[]>([]);
  const [allTimeMediumMonthly, setAllTimeMediumMonthly] = useState<ClassifiedDonor[]>([]);
  const [allTimeMajorMonthly, setAllTimeMajorMonthly] = useState<ClassifiedDonor[]>([]);
  const [churnedMonthlyMajor, setChurnedMonthlyMajor] = useState<ChurnedDonorInfo[]>([]);
  const [monthlyMajorDLV, setMonthlyMajorDLV] = useState<number>(0);
  const [onetimeMajorDLV, setOnetimeMajorDLV] = useState<number>(0);
  const [monthlyDlvCohort, setMonthlyDlvCohort] = useState<ContributionListItem[]>([]);
  const [onetimeDlvCohort, setOnetimeDlvCohort] = useState<ContributionListItem[]>([]);
  const [totalDonationsAllTime, setTotalDonationsAllTime] = useState<number>(0);
  const [monthlyDlvComponents, setMonthlyDlvComponents] = useState({ amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 });
  const [onetimeDlvComponents, setOnetimeDlvComponents] = useState({ amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 });
  const [totalOnetimeYTD, setTotalOnetimeYTD] = useState<number>(0);
  const [totalMonthlyYTD, setTotalMonthlyYTD] = useState<number>(0);
  const [majorOnetimeYTD, setMajorOnetimeYTD] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [mediumOnetimeYTD, setMediumOnetimeYTD] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [normalOnetimeYTD, setNormalOnetimeYTD] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [majorMonthlyYTD, setMajorMonthlyYTD] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [mediumMonthlyYTD, setMediumMonthlyYTD] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [normalMonthlyYTD, setNormalMonthlyYTD] = useState({ total: 0, gifts: [] as GiftWithDonor[] });

  const [totalOnetimeAllTime, setTotalOnetimeAllTime] = useState<number>(0);
  const [totalMonthlyAllTime, setTotalMonthlyAllTime] = useState<number>(0);
  const [majorOnetimeAllTime, setMajorOnetimeAllTime] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [mediumOnetimeAllTime, setMediumOnetimeAllTime] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [normalOnetimeAllTime, setNormalOnetimeAllTime] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [majorMonthlyAllTime, setMajorMonthlyAllTime] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [mediumMonthlyAllTime, setMediumMonthlyAllTime] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  const [normalMonthlyAllTime, setNormalMonthlyAllTime] = useState({ total: 0, gifts: [] as GiftWithDonor[] });
  
  

  const [counts3mo, setCounts3mo] = useState<Record<string, number>>({});
  const [totals3mo, setTotals3mo] = useState<Record<string, number>>({});
  const [activeDonorsList, setActiveDonorsList] = useState<DonorData[]>([]);
  const [wmaDetails, setWmaDetails] = useState< { monthLabel: string; total: number; weight: number }[]>([]);
  const [churnedLargeDetails, setChurnedLargeDetails] = useState<{ donor: DonorData; priorYearSum: number }[] >([]);
  const [churnedDonorsList, setChurnedDonorsList] = useState<DonorData[]>([]);
  const [countsOld3mo, setCountsOld3mo] = useState<Record<string, number>>({});
  const [totalsOld3mo, setTotalsOld3mo] = useState<Record<string, number>>({});
  const [lastGiftDates, setLastGiftDates] = useState<Record<string, Date>>({});

  const [topRecurringDonors, setTopRecurringDonors] = useState<TopDonorInfo[]>([]);
  const [topNonRecurringDonors, setTopNonRecurringDonors] = useState<TopDonorInfo[]>([]);
  const [majorDonorContributionAmount, setMajorDonorContributionAmount] = useState<string>('');
  const [majorDonorContributionPercentage, setMajorDonorContributionPercentage] = useState<number>(0);
  const [majorContributorsList, setMajorContributorsList] = useState<ContributionListItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContentId, setModalContentId] = useState<string | null>(null);
  const [retainedMajorMonthly, setRetainedMajorMonthly] = useState<ClassifiedDonor[]>([]);

      const openModal = (metricId: string) => {
        setModalContentId(metricId);
        setIsModalOpen(true);
      };

      const closeModal = () => {
        setIsModalOpen(false);
        setModalContentId(null);
      };



  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const [metrics, setMetrics] = useState<MetricsType>({
    newDonorsLastMonth: 0,
    recurringDonorsLastMonth: 0,
    medianDonation: 0,
    weightedMovingAvg: 0,
    recAboveMedian1mo: 0,
    activeDonorsLast3mo: 0,
    recBelowMedian1mo: 0,
    nonRecAboveMedian1mo: 0,
    nonRecBelowMedian1mo: 0,
    recAboveWMA1mo: 0,
    recBelowWMA1mo: 0,
    nonRecAboveWMA1mo: 0,
    nonRecBelowWMA1mo: 0,
    recurringDonationRatio : 0,
    churnedLargeDonors: 0,
    monthlyDonorsWhoChurned: 0,
  });

const today       = new Date();
const oneYearAgo  = new Date(today);
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);



  useEffect(() => {
    const loadMetrics = async () => {
      setIsLoading(true);
      try {
        const [giftsRes, donorsRes] = await Promise.all([fetchGifts(), fetchDonors()]);
        if (giftsRes.error) throw new Error(giftsRes.error);
        if (donorsRes.error) throw new Error(donorsRes.error);

        const gifts = giftsRes.data || [];
        const donors = donorsRes.data || [];
        const now = new Date();

        const currentYear = now.getFullYear();

        // Build donor lookup
        const donorMap: Record<string, DonorData> = {};
        donors.forEach(d => { if (d.donorid) donorMap[d.donorid] = d; });

        const oneMonthAgo = new Date(now);
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        threeMonthsAgo.setDate(threeMonthsAgo.getDate() - 1);
        threeMonthsAgo.setHours(0, 0, 0, 0);

        const giftsLast3mo = gifts.filter(g =>
          g.giftdate && new Date(g.giftdate) >= threeMonthsAgo
        );
        
        const lifetimeTotals: Record<string, number> = {};
        const lastGiftDates: Record<string, string> = {};

        gifts.forEach(gift => {
        if (gift.donorid) {
            // Add to lifetime total
            lifetimeTotals[gift.donorid] = (lifetimeTotals[gift.donorid] || 0) + (gift.totalamount || 0);

            // Check for last gift date
            if (gift.giftdate) {
              const giftDate = new Date(gift.giftdate);
              if (!lastGiftDates[gift.donorid] || giftDate > new Date(lastGiftDates[gift.donorid])) {
                  lastGiftDates[gift.donorid] = gift.giftdate;
              }
            }
        }
    });

        // 1. New donors
        const newDonors = donors.filter(d => d.created_at && new Date(d.created_at) >= oneMonthAgo);
        setNewDonorsList(newDonors);

        // 2. Recurring donors
        const recurringDonorsLastMonth = Array.from(
          new Set(
            gifts
              .filter(g => g.isrecurring && g.giftdate && new Date(g.giftdate) >= oneMonthAgo)
              .map(g => g.donorid!)
              .filter(Boolean)
          )
        ).length;

        // 3. Enriched recurring gifts
        const recurringMonth = gifts
          .filter(g => g.isrecurring && g.giftdate && new Date(g.giftdate) >= oneMonthAgo)
          .map(g => {
            // Create a proper GiftWithDonor object
            return { ...g, donor: donorMap[g.donorid] || null };
          });
        setRecurringGiftsMonth(recurringMonth);

        // 4. Median of last 30 days
        const amounts30 = gifts
          .filter(g => g.giftdate && new Date(g.giftdate) >= oneMonthAgo && g.totalamount! > 0)
          .map(g => g.totalamount!)
          .sort((a, b) => a - b);
        let median30 = 0;
        if (amounts30.length) {
          const mid = Math.floor(amounts30.length / 2);
          median30 = amounts30.length % 2
            ? amounts30[mid]
            : (amounts30[mid - 1] + amounts30[mid]) / 2;
        }

        // 5. Build full sorted list for dropdown
        const rawDonations = gifts
          .filter(g => g.giftdate && new Date(g.giftdate) >= oneMonthAgo)
          .map(g => {
            // Create a proper GiftWithDonor object
            return { ...g, donor: donorMap[g.donorid] || null };
          })
          .sort((a, b) => (b.totalamount! - a.totalamount!));
        setRawDonationsList(rawDonations);
        setMedianIndex(
          rawDonations.length ? Math.floor((rawDonations.length - 1) / 2) : null
        );

        // 5.5 Recurring Value Ratio
        const recurringCount = gifts.filter(g => g.isrecurring === true).length;
        const nonRecurringCount = gifts.filter(g => g.isrecurring === false).length;

        const totalDonations = recurringCount + nonRecurringCount;

        const recurringDonationRatio = totalDonations > 0
          ? (recurringCount / totalDonations) * 100
          : 0;


        // 6. Weighted moving average over last 30 days (daily)
        const dailySums: number[] = [];
        const dailyWeights: number[] = [];

        for (let i = 29; i >= 0; i--) {
          const day = new Date(now);
          day.setDate(now.getDate() - i);
          const start = new Date(day);
          start.setHours(0, 0, 0, 0);
          const end = new Date(day);
          end.setHours(23, 59, 59, 999);

          const sum = gifts
            .filter(g => g.giftdate)
            .filter(g => {
              const d = new Date(g.giftdate + "T00:00:00");
              return d >= start && d <= end;
            })
            .reduce((acc, g) => acc + (g.totalamount || 0), 0);

          dailySums.push(sum);
          dailyWeights.push(30 - i);
        }

        const weightedSumDaily = dailySums.reduce((acc, v, idx) => acc + v * dailyWeights[idx], 0);
        const weightTotalDaily = dailyWeights.reduce((a, b) => a + b, 0);
        const wmaDaily = weightTotalDaily ? weightedSumDaily / weightTotalDaily : 0;

        setWmaDetails(
          dailySums.map((total, idx) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (29 - idx));
            return {
              monthLabel: d.toLocaleDateString(),
              total,
              weight: dailyWeights[idx],
            };
          })
        );

        // 7. Splits by recurring & median
        const recAbove = rawDonations.filter(g => g.isrecurring && g.totalamount! > median30);
        const recBelow = rawDonations.filter(g => g.isrecurring && g.totalamount! <= median30);
        const nonRecAbove = rawDonations.filter(g => !g.isrecurring && g.totalamount! > median30);
        const nonRecBelow = rawDonations.filter(g => !g.isrecurring && g.totalamount! <= median30);

        // 8. WMA recurring & Median stuff
        const recAboveWMA = rawDonations.filter(g => g.isrecurring && g.totalamount! > wmaDaily);
        const recBelowWMA = rawDonations.filter(g => g.isrecurring && g.totalamount! <= wmaDaily);
        const nonRecAboveWMA = rawDonations.filter(g => !g.isrecurring && g.totalamount! > wmaDaily);
        const nonRecBelowWMA = rawDonations.filter(g => !g.isrecurring && g.totalamount! <= wmaDaily);


        // 9. Active Donors
        const counts3mo: Record<string, number> = {};
        const totals3mo: Record<string, number> = {};
        giftsLast3mo.forEach(g => {
          if (!g.donorid) return;
          const amt = g.totalamount ?? 0;
          counts3mo[g.donorid] = (counts3mo[g.donorid] || 0) + 1;
          totals3mo[g.donorid] = (totals3mo[g.donorid] || 0) + amt;
        });

        const activeDonorIds = Object.entries(counts3mo)
          .filter(([_, c]) => c > 1)
          .map(([donorid]) => donorid);

        const activeDonors = activeDonorIds
          .map(id => donorMap[id])
          .filter((d): d is DonorData => !!d);

        setCounts3mo(counts3mo);
        setTotals3mo(totals3mo);
        setActiveDonorsList(activeDonors);

        // 10. Large donors who gave any time before oneYearAgo, but nothing since:
        const priorYearSums: Record<string, number> = {};
        gifts.forEach(g => {
          if (!g.donorid || !g.giftdate) return;
          const d = new Date(g.giftdate);
          if (d < oneYearAgo) {
            priorYearSums[g.donorid] = (priorYearSums[g.donorid] || 0) + (g.totalamount || 0);
          }
        });

        const recentDonorIds = new Set(
          gifts
            .filter(g => g.donorid && g.giftdate && new Date(g.giftdate) >= oneYearAgo)
            .map(g => g.donorid!)
        );

        const LARGE_THRESHOLD = 1000;

        const churnedLargeDonors = Object.entries(priorYearSums)
          .filter(([donorid, sum]) => sum >= LARGE_THRESHOLD && !recentDonorIds.has(donorid))
          .length;

          const churnedLargeList = Object.entries(priorYearSums)
            .filter(([donorid, sum]) => sum >= LARGE_THRESHOLD && !recentDonorIds.has(donorid))
            .map(([donorid, sum]) => ({
              donor: donorMap[donorid]!,
              priorYearSum: sum,
            }));

          setChurnedLargeDetails(churnedLargeList);

          //11. Monthly Donors Who Churned
          const pastGifts = gifts.filter(g => {
            if (!g.giftdate) return false;
            return new Date(g.giftdate) < oneYearAgo;
          });

          const giftsByDonor: Record<string, Date[]> = {};
          pastGifts.forEach(g => {
            if (!g.donorid || !g.giftdate) return;
            if (!giftsByDonor[g.donorid]) giftsByDonor[g.donorid] = [];
            giftsByDonor[g.donorid].push(new Date(g.giftdate));
          });
          for (const donorid in giftsByDonor) {
            giftsByDonor[donorid].sort((a, b) => a.getTime() - b.getTime());
          }

          function hasActive3MonthWindow(dates: Date[]): boolean {
            for (let i = 0; i < dates.length; i++) {
              let start = dates[i];
              let count = 1;
              for (let j = i + 1; j < dates.length; j++) {
                const diffMonths = (dates[j].getFullYear() - start.getFullYear()) * 12 + (dates[j].getMonth() - start.getMonth());
                if (diffMonths <= 2) { // 3 months window
                  count++;
                  if (count >= 2) return true;
                } else {
                  break;
                }
              }
            }
            return false;
          }

          const churnedDonorIds = Object.entries(giftsByDonor)
            .filter(([donorid, dates]) => hasActive3MonthWindow(dates))
            .map(([donorid]) => donorid)
            .filter(donorid => !activeDonorIds.includes(donorid));

          const churnedDonors = churnedDonorIds
            .map(id => donorMap[id])
            .filter((d): d is DonorData => !!d);

          const countsOld3mo: Record<string, number> = {};
          const totalsOld3mo: Record<string, number> = {};
          pastGifts.forEach(g => {
            if (!g.donorid) return;
            if (churnedDonorIds.includes(g.donorid)) {
              countsOld3mo[g.donorid] = (countsOld3mo[g.donorid] || 0) + 1;
              totalsOld3mo[g.donorid] = (totalsOld3mo[g.donorid] || 0) + (g.totalamount ?? 0);
            }
          });

          setCountsOld3mo(countsOld3mo);
          setTotalsOld3mo(totalsOld3mo);
          setChurnedDonorsList(churnedDonors);

          const monthlyDonorsWhoChurned = churnedDonors.length;

          setMetrics(prev => ({ ...prev, monthlyDonorsWhoChurned }));

          //  Total All-Time Donations Calculation 
      const totalSum = gifts.reduce((acc, gift) => acc + (gift.totalamount || 0), 0);
      setTotalDonationsAllTime(totalSum);
      
      // Filter gifts for the current year (used by multiple calculations)
      const currentYearGifts = gifts.filter(g => g.giftdate && g.giftdate.startsWith(currentYear.toString()));
      
      const allTimeMonthlyDonations: Record<string, number[]> = {};
      const lastRecurringGiftDetails: Record<string, { date: Date; amount: number }> = {};
      gifts.filter(g => g.isrecurring).forEach(gift => {
          if (gift.donorid && gift.giftdate) {
              if (!allTimeMonthlyDonations[gift.donorid]) allTimeMonthlyDonations[gift.donorid] = [];
              allTimeMonthlyDonations[gift.donorid].push(gift.totalamount || 0);
              const currentGiftDate = new Date(gift.giftdate);
              const storedGift = lastRecurringGiftDetails[gift.donorid];
              if (!storedGift || currentGiftDate > storedGift.date) {
                  lastRecurringGiftDetails[gift.donorid] = { date: currentGiftDate, amount: gift.totalamount || 0 };
              }
          }
      });
      const allTimeMonthlyIds = new Set(Object.keys(allTimeMonthlyDonations));

      //ALL-TIME DONOR CLASSIFICATION

      // All-Time Monthly
      const at_normMonthly: ClassifiedDonor[] = [], at_medMonthly: ClassifiedDonor[] = [], at_majMonthly: ClassifiedDonor[] = [];
      for (const donorId in allTimeMonthlyDonations) {
          const donor = donorMap[donorId];
          const amounts = allTimeMonthlyDonations[donorId];
          if (donor && amounts && amounts.length > 0) {
              const averageAmount = amounts.reduce((acc, val) => acc + val, 0) / amounts.length;
              const classifiedDonor = { donor, amount: averageAmount };
              if (averageAmount >= 100) at_majMonthly.push(classifiedDonor);
              else if (averageAmount >= 50) at_medMonthly.push(classifiedDonor);
              else at_normMonthly.push(classifiedDonor);
          }
      }
      setAllTimeNormalMonthly(at_normMonthly);
      setAllTimeMediumMonthly(at_medMonthly);
      setAllTimeMajorMonthly(at_majMonthly);

      // All-Time One-Time (based on NON-recurring gifts)
      const allTimeOnetimeTotals: Record<string, number> = {};
      gifts.filter(g => !g.isrecurring && g.donorid).forEach(gift => { // The FIX is here: !g.isrecurring
          allTimeOnetimeTotals[gift.donorid] = (allTimeOnetimeTotals[gift.donorid] || 0) + (gift.totalamount || 0);
      });
      const at_normOnetime: ClassifiedDonor[] = [], at_medOnetime: ClassifiedDonor[] = [], at_majOnetime: ClassifiedDonor[] = [];
      for (const donorId in allTimeOnetimeTotals) {
          const donor = donorMap[donorId];
          if (donor) {
              const totalAmount = allTimeOnetimeTotals[donorId];
              const classifiedDonor = { donor, amount: totalAmount };
              if (totalAmount >= 1000) at_majOnetime.push(classifiedDonor);
              else if (totalAmount >= 500) at_medOnetime.push(classifiedDonor);
              else at_normOnetime.push(classifiedDonor);
          }
      }
      setAllTimeNormalOnetime(at_normOnetime);
      setAllTimeMediumOnetime(at_medOnetime);
      setAllTimeMajorOnetime(at_majOnetime);

      // Current-Year Monthly
      const currentYearMonthlyAmounts: Record<string, number> = {};
      currentYearGifts.filter(g => g.isrecurring && g.donorid).forEach(gift => {
          currentYearMonthlyAmounts[gift.donorid] = gift.totalamount || 0;
      });
      const normMonthly: ClassifiedDonor[] = [], medMonthly: ClassifiedDonor[] = [], majMonthly: ClassifiedDonor[] = [];
      for (const donorId in currentYearMonthlyAmounts) {
          const donor = donorMap[donorId];
          if (donor) {
              const amount = currentYearMonthlyAmounts[donorId];
              const classifiedDonor = { donor, amount };
              if (amount >= 100) majMonthly.push(classifiedDonor);
              else if (amount >= 50) medMonthly.push(classifiedDonor);
              else normMonthly.push(classifiedDonor);
          }
      }
      setNormalMonthly(normMonthly);
      setMediumMonthly(medMonthly);
      setMajorMonthly(majMonthly);

       // Current-Year One-Time
      const currentYearOnetimeTotals: Record<string, number> = {};
      currentYearGifts.filter(g => !g.isrecurring && g.donorid).forEach(gift => { // The FIX is here
          currentYearOnetimeTotals[gift.donorid] = (currentYearOnetimeTotals[gift.donorid] || 0) + (gift.totalamount || 0);
      });
      const normOnetime: ClassifiedDonor[] = [], medOnetime: ClassifiedDonor[] = [], majOnetime: ClassifiedDonor[] = [];
      for (const donorId in currentYearOnetimeTotals) {
          const donor = donorMap[donorId];
          if (donor) {
              const totalAmount = currentYearOnetimeTotals[donorId];
              const classifiedDonor = { donor, amount: totalAmount };
              if (totalAmount >= 1000) majOnetime.push(classifiedDonor);
              else if (totalAmount >= 500) medOnetime.push(classifiedDonor);
              else normOnetime.push(classifiedDonor);
          }
      }
      setNormalOnetime(normOnetime);
      setMediumOnetime(medOnetime);
      setMajorOnetime(majOnetime);

      //TOP 20 DONORS
      const aggregateAndSort = (totals: Record<string, number>, type: "Recurring" | "One-Time"): TopDonorInfo[] => {
          return Object.entries(totals)
              .map(([donorId, totalAmount]) => ({ donor: donorMap[donorId], totalAmount, type }))
              .filter(item => item.donor)
              .sort((a, b) => b.totalAmount - a.totalAmount)
              .slice(0, 20);
      };
      setTopRecurringDonors(aggregateAndSort(currentYearMonthlyAmounts, "Recurring"));
      setTopNonRecurringDonors(aggregateAndSort(currentYearOnetimeTotals, "One-Time"));


      //  CHURN CALCULATIONS 
      const allTimeMajorMonthlyIds = new Set(at_majMonthly.map(d => d.donor.donorid));
      const currentYearMajorMonthlyIds = new Set(majMonthly.map(d => d.donor.donorid));
      const churnedMonthlyList: ChurnedDonorInfo[] = [];
      //  Churned from Major Monthly Status (New 3-Month Inactivity Rule) 

      const donorsWhoGaveThisYear = new Set(
          currentYearGifts.map(g => g.donorid)
      );
      
            allTimeMajorMonthlyIds.forEach(donorId => {
          // A donor has churned if they are an all-time major monthly donor
          // AND their ID is NOT in the set of donors who gave this year.
          if (!donorsWhoGaveThisYear.has(donorId)) {
              const donor = donorMap[donorId];
              if (donor) {
                  churnedMonthlyList.push({
                      donor: donor,
                      lifetimeTotal: lifetimeTotals[donorId] || 0,
                      lastGiftDate: lastGiftDates[donorId] || 'N/A',
                      lastRecurringAmount: lastRecurringGiftDetails[donorId]?.amount || 0,
                      lastRecurringDate: lastRecurringGiftDetails[donorId]?.date.toISOString(),
                  });
              }
          }
      });
      setChurnedMonthlyMajor(churnedMonthlyList.sort((a, b) => b.lifetimeTotal - a.lifetimeTotal));

      //  Churned from Major One-Time Status (Status Drop Rule) 
      // This logic remains unchanged for now.
      const allTimeMajorOnetimeIds = new Set(at_majOnetime.map(d => d.donor.donorid));
      const currentYearMajorOnetimeIds = new Set(majOnetime.map(d => d.donor.donorid));
      const churnedOnetimeList: ChurnedDonorInfo[] = [];
      
      allTimeMajorOnetimeIds.forEach(donorId => {
          if (!currentYearMajorOnetimeIds.has(donorId)) {
              const donor = donorMap[donorId];
              if (donor) {
                  churnedOnetimeList.push({
                      donor: donor,
                      lifetimeTotal: lifetimeTotals[donorId] || 0,
                      lastGiftDate: lastGiftDates[donorId] || 'N/A',
                  });
              }
          }
      });


      //  CONTRIBUTION CALCULATIONS 
      const combinedCurrentYearMajorIds = new Set([...currentYearMajorMonthlyIds, ...currentYearMajorOnetimeIds]);
      const totalDonationsThisYear = currentYearGifts.reduce((acc, gift) => acc + (gift.totalamount || 0), 0);
      const majorDonationsThisYear = currentYearGifts
          .filter(gift => gift.donorid && combinedCurrentYearMajorIds.has(gift.donorid))
          .reduce((acc, gift) => acc + (gift.totalamount || 0), 0);
      const percentage = totalDonationsThisYear > 0 ? (majorDonationsThisYear / totalDonationsThisYear) * 100 : 0;
      const amountString = `${formatAmount(majorDonationsThisYear)} of ${formatAmount(totalDonationsThisYear)}`;
      setMajorDonorContributionAmount(amountString);
      setMajorDonorContributionPercentage(percentage);

      const contributorsList: ContributionListItem[] = [];
      combinedCurrentYearMajorIds.forEach(donorId => {
          const donor = donorMap[donorId];
          if (donor) {
              const totalContribution = currentYearGifts
                  .filter(g => g.donorid === donorId)
                  .reduce((acc, gift) => acc + (gift.totalamount || 0), 0);

              contributorsList.push({
                  donor,
                  totalContribution,
              });
          }
      });
      setMajorContributorsList(contributorsList.sort((a, b) => b.totalContribution - a.totalContribution));

      //  RETENTION CALCULATIONS 

      // First, find who was a Major Monthly Donor LAST year (2024)
      const previousYear = currentYear - 1;
      const previousYearGifts = gifts.filter(g => g.giftdate && g.giftdate.startsWith(previousYear.toString()));
      const previousYearMonthlyAmounts: Record<string, number> = {};
      previousYearGifts.filter(g => g.isrecurring).forEach(gift => {
          if (gift.donorid) previousYearMonthlyAmounts[gift.donorid] = gift.totalamount || 0;
      });
      const previousYearMajorMonthlyIds = new Set<string>();
      for (const donorId in previousYearMonthlyAmounts) {
          if (previousYearMonthlyAmounts[donorId] >= 100) {
              previousYearMajorMonthlyIds.add(donorId);
          }
      }

      // Now, find the donors who are in BOTH last year's set and this year's set
      const retainedList: ClassifiedDonor[] = [];
      // We reuse 'currentYearMajorMonthlyIds' from the classification logic
      currentYearMajorMonthlyIds.forEach(donorId => {
          if (previousYearMajorMonthlyIds.has(donorId)) {
              const donor = donorMap[donorId];
              if (donor) {
                  // The amount shown will be their CURRENT monthly amount
                  retainedList.push({
                      donor,
                      amount: currentYearMonthlyAmounts[donorId] || 0
                  });
              }
          }
      });
      setRetainedMajorMonthly(retainedList.sort((a,b) => b.amount - a.amount));

      //17. DLV STUFF WOOOO

      // Function to calculate DLV for a given cohort of donors
            // Function to calculate DLV for a given cohort of donors
      const calculateDLV = (donorIds: Set<string>) => {
        if (donorIds.size === 0) return { finalDLV: 0, cohortList: [], components: { amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 } };

        const cohortGifts = gifts.filter(g => g.donorid && donorIds.has(g.donorid));
        if (cohortGifts.length === 0) return { finalDLV: 0, cohortList: [], components: { amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 } };

        //  Calculation for DLV Components 
        const totalAmount = cohortGifts.reduce((acc, g) => acc + (g.totalamount || 0), 0);
        const avgAmount = totalAmount / cohortGifts.length; // Avg. per transaction

        // ADDED: The metric you are looking for
        const avgLifetimeTotal = totalAmount / donorIds.size; // Avg. total giving per donor

        // ... (rest of lifespan and frequency calculations remain the same) ...
        const giftsByDonor: Record<string, Date[]> = {};
        cohortGifts.forEach(g => {
            if (g.donorid && g.giftdate) {
                if (!giftsByDonor[g.donorid]) giftsByDonor[g.donorid] = [];
                giftsByDonor[g.donorid].push(new Date(g.giftdate));
            }
        });
        let totalLifespanYears = 0;
        for (const id in giftsByDonor) {
            const dates = giftsByDonor[id];
            if (dates.length > 1) {
                const first = new Date(Math.min(...dates.map(d => d.getTime())));
                const last = new Date(Math.max(...dates.map(d => d.getTime())));
                totalLifespanYears += (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
            }
        }
        const avgLifespan = totalLifespanYears / donorIds.size;

        const allGiftDates = gifts
          .filter(g => g.giftdate !== undefined)
          .map(g => new Date(g.giftdate as string));
        const orgStartDate = new Date(Math.min(...allGiftDates.map(d => d.getTime())));
        const orgEndDate = new Date(Math.max(...allGiftDates.map(d => d.getTime())));
        const orgTotalYears = Math.max(1, (orgEndDate.getTime() - orgStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
        const avgFrequency = cohortGifts.length / donorIds.size / orgTotalYears;
        
        const finalDLV = avgAmount * avgFrequency * avgLifespan;

        //  Build cohort list for the modal 
        const cohortList: ContributionListItem[] = [];
        donorIds.forEach(donorId => {
            const donor = donorMap[donorId];
            if (donor) {
              cohortList.push({ donor, totalContribution: lifetimeTotals[donorId] || 0 });
            }
        });

        // Return all calculated values
        return { 
          finalDLV, 
          cohortList: cohortList.sort((a, b) => b.totalContribution - a.totalContribution),
          components: { amount: avgAmount, frequency: avgFrequency, lifespan: avgLifespan, avgLifetimeTotal: avgLifetimeTotal } 
        };
      };

      //  Calculate for Monthly Major Donors 
      const monthlyResult = calculateDLV(allTimeMajorMonthlyIds);
      setMonthlyMajorDLV(monthlyResult.finalDLV);
      setMonthlyDlvCohort(monthlyResult.cohortList);
      setMonthlyDlvComponents(monthlyResult.components); // Save components to state

      //  Calculate for One-Time Major Donors 
      const onetimeResult = calculateDLV(allTimeMajorOnetimeIds);
      setOnetimeMajorDLV(onetimeResult.finalDLV);
      setOnetimeDlvCohort(onetimeResult.cohortList);
      setOnetimeDlvComponents(onetimeResult.components); // Save components to state


      // --- NEW: SPLIT DONATION TIER CALCULATION ---

       const calculateSplitTierTotals = (giftArray: GiftData[]) => {
        const result = {
          totalOnetime: 0, totalMonthly: 0,
          majorOnetime: { total: 0, gifts: [] as GiftData[] }, mediumOnetime: { total: 0, gifts: [] as GiftData[] }, normalOnetime: { total: 0, gifts: [] as GiftData[] },
          majorMonthly: { total: 0, gifts: [] as GiftData[] }, mediumMonthly: { total: 0, gifts: [] as GiftData[] }, normalMonthly: { total: 0, gifts: [] as GiftData[] },
        };

        giftArray.forEach(gift => {
          const amount = gift.totalamount || 0;
          if (gift.isrecurring) {
            result.totalMonthly += amount;
            if (amount >= 100) { result.majorMonthly.total += amount; result.majorMonthly.gifts.push(gift); }
            else if (amount >= 50) { result.mediumMonthly.total += amount; result.mediumMonthly.gifts.push(gift); }
            else { result.normalMonthly.total += amount; result.normalMonthly.gifts.push(gift); }
          } else {
            result.totalOnetime += amount;
            if (amount >= 1000) { result.majorOnetime.total += amount; result.majorOnetime.gifts.push(gift); }
            else if (amount >= 500) { result.mediumOnetime.total += amount; result.mediumOnetime.gifts.push(gift); }
            else { result.normalOnetime.total += amount; result.normalOnetime.gifts.push(gift); }
          }
        });
        return result;
      };

      const enrich = (gifts: GiftData[]): GiftWithDonor[] => gifts.map(g => ({ ...g, donor: donorMap[g.donorid] || null })).sort((a, b) => (b.totalamount || 0) - (a.totalamount || 0));

      // --- Calculate for Year-to-Date ---
      const ytdTotals = calculateSplitTierTotals(currentYearGifts);
      setTotalOnetimeYTD(ytdTotals.totalOnetime);
      setTotalMonthlyYTD(ytdTotals.totalMonthly);
      setMajorOnetimeYTD({ total: ytdTotals.majorOnetime.total, gifts: enrich(ytdTotals.majorOnetime.gifts) });
      setMediumOnetimeYTD({ total: ytdTotals.mediumOnetime.total, gifts: enrich(ytdTotals.mediumOnetime.gifts) });
      setNormalOnetimeYTD({ total: ytdTotals.normalOnetime.total, gifts: enrich(ytdTotals.normalOnetime.gifts) });
      setMajorMonthlyYTD({ total: ytdTotals.majorMonthly.total, gifts: enrich(ytdTotals.majorMonthly.gifts) });
      setMediumMonthlyYTD({ total: ytdTotals.mediumMonthly.total, gifts: enrich(ytdTotals.mediumMonthly.gifts) });
      setNormalMonthlyYTD({ total: ytdTotals.normalMonthly.total, gifts: enrich(ytdTotals.normalMonthly.gifts) });

      // --- Calculate for All-Time ---
      const allTimeTotals = calculateSplitTierTotals(gifts);
      setTotalOnetimeAllTime(allTimeTotals.totalOnetime);
      setTotalMonthlyAllTime(allTimeTotals.totalMonthly);
      setMajorOnetimeAllTime({ total: allTimeTotals.majorOnetime.total, gifts: enrich(allTimeTotals.majorOnetime.gifts) });
      setMediumOnetimeAllTime({ total: allTimeTotals.mediumOnetime.total, gifts: enrich(allTimeTotals.mediumOnetime.gifts) });
      setNormalOnetimeAllTime({ total: allTimeTotals.normalOnetime.total, gifts: enrich(allTimeTotals.normalOnetime.gifts) });
      setMajorMonthlyAllTime({ total: allTimeTotals.majorMonthly.total, gifts: enrich(allTimeTotals.majorMonthly.gifts) });
      setMediumMonthlyAllTime({ total: allTimeTotals.mediumMonthly.total, gifts: enrich(allTimeTotals.mediumMonthly.gifts) });
      setNormalMonthlyAllTime({ total: allTimeTotals.normalMonthly.total, gifts: enrich(allTimeTotals.normalMonthly.gifts) });

        setMetrics({
          newDonorsLastMonth: newDonors.length,
          recurringDonorsLastMonth,
          medianDonation: median30,
          weightedMovingAvg: parseFloat(wmaDaily.toFixed(2)),
          recAboveMedian1mo: recAbove.length,
          recBelowMedian1mo: recBelow.length,
          nonRecAboveMedian1mo: nonRecAbove.length,
          nonRecBelowMedian1mo: nonRecBelow.length,
          recAboveWMA1mo: recAboveWMA.length,
          recBelowWMA1mo: recBelowWMA.length,
          nonRecAboveWMA1mo: nonRecAboveWMA.length,
          nonRecBelowWMA1mo: nonRecBelowWMA.length,
          activeDonorsLast3mo: activeDonors.length,
          recurringDonationRatio,
          churnedLargeDonors,
          monthlyDonorsWhoChurned,
        });
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }

      
    };

    loadMetrics();
  }, []);

  if (isLoading) return <p>Loading metrics...</p>;
  if (error) return <p>Error loading metrics: {error}</p>;




// Add this line before metricDefinitions to define currentYear in the component scope
  const currentYear = new Date().getFullYear();

  const metricDefinitions = [
    {
      id: 'totalDonationsAllTime',
      title: 'Total Donations (All-Time)',
      value: formatAmount(totalDonationsAllTime),
      icon: faPiggyBank, 
      variant: 'primary',
      subtitle: 'Accumulated from all gifts',
      categories: ['All-Time Classifications'],
    },
    {
    id: 'newDonors',
    title: 'New Donors (Last 30 Days)',
    value: metrics.newDonorsLastMonth,
    icon: faUserPlus,
    variant: 'primary',
    onClick: () => openModal('newDonors'),
    subtitle: 'Click to view list',
    categories: ['Current Year Metrics'],
  },
  {
    id: 'recurringDonors',
    title: 'Recurring Donors (Last 30 Days)',
    value: metrics.recurringDonorsLastMonth,
    icon: faCalendarAlt,
    variant: 'success',
    onClick: () => openModal('recurringDonors'),
    subtitle: 'Click to view IDs',
    categories: ['Current Year Metrics', 'Donor Classifications'],
  },
  {
    id: 'medianDonation',
    title: 'Median Donation (Last 30 Days)',
    value: metrics.medianDonation,
    icon: faChartLine,
    variant: 'warning',
    onClick: () => openModal('medianDonation'),
    subtitle: 'Click to view details',
    categories: ['Current Year Metrics'],
  },
  {
    id: 'wma',
    title: '30-Day WMA Donations',
    value: metrics.weightedMovingAvg,
    icon: faPercent,
    variant: 'dark',
    onClick: () => openModal('wma'),
    subtitle: 'Click to view breakdown',
    categories: ['Current Year Metrics'],
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
  },
  {
    id: 'recBelowMedian',
    title: '≤ Median & Recurring (1mo)',
    value: metrics.recBelowMedian1mo,
    icon: faArrowDown,
    variant: 'info',
    onClick: () => openModal('recBelowMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
  },
  {
    id: 'nonRecAboveMedian',
    title: '> Median & Non-Recurring (1mo)',
    value: metrics.nonRecAboveMedian1mo,
    icon: faArrowUpRightDots,
    variant: 'warning',
    onClick: () => openModal('nonRecAboveMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
  },
  {
    id: 'nonRecBelowMedian',
    title: '≤ Median & Non-Recurring (1mo)',
    value: metrics.nonRecBelowMedian1mo,
    icon: faArrowDownShortWide,
    variant: 'secondary',
    onClick: () => openModal('nonRecBelowMedian'),
    subtitle: 'Click to view',
    categories: ['Median Analysis'],
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
  },
  {
    id: 'recBelowWMA',
    title: '≤ WMA & Recurring (1mo)',
    value: metrics.recBelowWMA1mo,
    icon: faArrowTrendDown,
    variant: 'info',
    onClick: () => openModal('recBelowWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
  },
  {
    id: 'nonRecAboveWMA',
    title: '> WMA & Non-Recurring (1mo)',
    value: metrics.nonRecAboveWMA1mo,
    icon: faArrowUpRightDots,
    variant: 'warning',
    onClick: () => openModal('nonRecAboveWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
  },
  {
    id: 'nonRecBelowWMA',
    title: '≤ WMA & Non-Recurring (1mo)',
    value: metrics.nonRecBelowWMA1mo,
    icon: faArrowDownShortWide,
    variant: 'secondary',
    onClick: () => openModal('nonRecBelowWMA'),
    subtitle: 'Click to view',
    categories: ['WMA Analysis'],
  },
  {
    id: 'activeDonors',
    title: 'Active Donors (Last 3 Months)',
    value: metrics.activeDonorsLast3mo,
    icon: faUserPlus,
    variant: 'info',
    onClick: () => openModal('activeDonors'),
    subtitle: 'Click to view list',
    categories: ['Current Year Metrics'],
  },
  {
    id: 'recurringRatio',
    title: 'Recurring Value Ratio',
    value: metrics.recurringDonationRatio !== undefined
      ? `${metrics.recurringDonationRatio.toFixed(1)}%`
      : 'N/A',
    icon: faInfoCircle,
    subtitle: 'Recurring share of total donation value',
    categories: ['Current Year Metrics'],
  },
  {
    id: 'churnedLarge',
    title: 'Churned Large Donors',
    value: metrics.churnedLargeDonors,
    icon: faUserSlash,
    variant: 'warning',
    subtitle: 'Click to view list',
    onClick: () => openModal('churnedLarge'),
    categories: ['Top Donor Metrics'],
  },
  {
    id: 'churnedMonthly',
    title: 'Monthly Donors Who Churned',
    value: metrics.monthlyDonorsWhoChurned,
    icon: faUserSlash,
    variant: 'warning',
    onClick: () => openModal('churnedMonthly'),
    subtitle: 'Click to view list',
    categories: ['currentYearMetrics'],
  },
  {
  id: 'top20Recurring',
  title: 'Top 20 Recurring Donors (Current Year)',
  value: topRecurringDonors.length,
  icon: faCalendarAlt,
  variant: 'success',
  onClick: () => openModal('top20Recurring'),
  subtitle: 'Click to view list',
  categories: ['Top Donor Metrics'],
},
{
  id: 'top20NonRecurring',
  title: 'Top 20 One-Time Donors (Current Year)',
  value: topNonRecurringDonors.length,
  icon: faArrowUpRightDots,
  variant: 'info',
  onClick: () => openModal('top20NonRecurring'),
  subtitle: 'Click to view list',
  categories: ['Top Donor Metrics'],
},
{
  id: 'majorDonorContribution',
  title: 'Major Donor Contribution (YTD)',
  value: `${majorDonorContributionPercentage.toFixed(1)}%`,
  icon: faStar,
  variant: 'primary',
  subtitle: `${majorDonorContributionAmount} (Click to view)`,
  onClick: () => openModal('majorDonorContribution'),
  categories: ['Current Year Metrics', 'Donor Classifications'],
},
{
  id: 'majorMonthly', 
  title: 'Major Monthly Donors (Year to date)', 
  value: majorMonthly.length, 
  icon: faUserCheck, 
  variant: 'success',
  onClick: () => openModal('majorMonthly'), 
  subtitle: '$100+/mo', 
  categories: ['Donor Classifications'],
},
{
  id: 'mediumMonthly', 
  title: 'Medium Monthly Donors (Year to date)', 
  value: mediumMonthly.length, 
  icon: faUserFriends, 
  variant: 'primary',
  onClick: () => openModal('mediumMonthly'), 
  subtitle: '$50-100/mo', 
  categories: ['Donor Classifications'],
},
{
  id: 'normalMonthly', 
  title: 'Normal Monthly Donors (Year to date)', 
  value: normalMonthly.length, 
  icon: faUser, 
  variant: 'secondary',
  onClick: () => openModal('normalMonthly'), 
  subtitle: '< $50/mo', 
  categories: ['Donor Classifications'],
},
{
  id: 'majorOnetime', 
  title: 'Major One-Time Donors (Year to date)', 
  value: majorOnetime.length, 
  icon: faUserTie, 
  variant: 'success',
  onClick: () => openModal('majorOnetime'), 
  subtitle: '$1,000+', 
  categories: ['Donor Classifications'],
},

{
  id: 'mediumOnetime', 
  title: 'Medium One-Time Donors (Year to date)', 
  value: mediumOnetime.length, 
  icon: faUserEdit, 
  variant: 'primary',
  onClick: () => openModal('mediumOnetime'), 
  subtitle: '$500-1,000', 
  categories: ['Donor Classifications'],
},
{
  id: 'normalOnetime', 
  title: 'Normal One-Time Donors (Year to date)', 
  value: normalOnetime.length, 
  icon: faUser, 
  variant: 'secondary',
  onClick: () => openModal('normalOnetime'), 
  subtitle: '< $500', 
  categories: ['Donor Classifications'],
},
{
  id: 'allTimeMajorMonthly', 
  title: 'Major Monthly Donors (All-Time)', 
  value: allTimeMajorMonthly.length, 
  icon: faUserCheck, 
  variant: 'dark',
  onClick: () => openModal('allTimeMajorMonthly'), 
  subtitle: '$100+/mo', 
  categories: ['Donor Classifications'],
},
{
  id: 'allTimeMediumMonthly', 
  title: 'Medium Monthly Donors (All-Time)', 
  value: allTimeMediumMonthly.length, 
  icon: faUserFriends, 
  variant: 'dark',
  onClick: () => openModal('allTimeMediumMonthly'), 
  subtitle: '$50-100/mo', 
  categories: ['Donor Classifications'],
},
{
  id: 'allTimeNormalMonthly', 
  title: 'Normal Monthly Donors (All-Time)', 
  value: allTimeNormalMonthly.length, 
  icon: faUser, 
  variant: 'dark',
  onClick: () => openModal('allTimeNormalMonthly'), 
  subtitle: '< $50/mo', 
  categories: ['Donor Classifications'],
},
{
  id: 'allTimeMajorOnetime', 
  title: 'Major One-Time Donors (All-Time)', 
  value: allTimeMajorOnetime.length, 
  icon: faUserTie, 
  variant: 'dark',
  onClick: () => openModal('allTimeMajorOnetime'), 
  subtitle: '$1,000+', 
  categories: ['Donor Classifications'],
},
{
  id: 'allTimeMediumOnetime', 
  title: 'Medium One-Time Donors (All-Time)', 
  value: allTimeMediumOnetime.length, 
  icon: faUserEdit, 
  variant: 'dark',
  onClick: () => openModal('allTimeMediumOnetime'), 
  subtitle: '$500-1,000', 
  categories: ['Donor Classifications'],
},
{
  id: 'allTimeNormalOnetime', 
  title: 'Normal One-Time Donors (All-Time)', 
  value: allTimeNormalOnetime.length, 
  icon: faUser, 
  variant: 'dark',
  onClick: () => openModal('allTimeNormalOnetime'), 
  subtitle: '< $500', 
  categories: ['Donor Classifications'],
},
{
  id: 'totalOneTimeYTD',
  title: 'Total Donations (YTD)',
  value: formatAmount(totalOnetimeYTD),
  icon: faDollarSign,
  variant: 'primary',
  subtitle: `Since Jan 1, ${currentYear}`,
  categories: ['Donor Classifications'],
},
// --- YTD One-Time Tiers ---
{
  id: 'totalOnetimeYTD',
  title: 'Total One-Time Donations (YTD)',
  value: formatAmount(totalOnetimeYTD),
  icon: faDollarSign,
  variant: 'primary',
  subtitle: `Since Jan 1, ${currentYear}`,
  categories: ['Donor Classifications'],
},
{
  id: 'majorOnetimeYTD',
  title: 'Major One-Time Donations (YTD)',
  value: formatAmount(majorOnetimeYTD.total),
  icon: faStar,
  variant: 'success',
  subtitle: `Gifts ≥ $1,000 (${(totalOnetimeYTD > 0 ? (majorOnetimeYTD.total / totalOnetimeYTD) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('majorOnetimeYTD'),
  categories: ['Donor Classifications'],
},
{
  id: 'mediumOnetimeYTD',
  title: 'Medium One-Time Donations (YTD)',
  value: formatAmount(mediumOnetimeYTD.total),
  icon: faGift,
  variant: 'info',
  subtitle: `Gifts $500-$999 (${(totalOnetimeYTD > 0 ? (mediumOnetimeYTD.total / totalOnetimeYTD) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('mediumOnetimeYTD'),
  categories: ['Donor Classifications'],
},
{
  id: 'normalOnetimeYTD',
  title: 'Normal One-Time Donations (YTD)',
  value: formatAmount(normalOnetimeYTD.total),
  icon: faHandHoldingHeart,
  variant: 'secondary',
  subtitle: `Gifts < $500 (${(totalOnetimeYTD > 0 ? (normalOnetimeYTD.total / totalOnetimeYTD) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('normalOnetimeYTD'),
  categories: ['Donor Classifications'],
},

// --- YTD Monthly Tiers ---
{
  id: 'totalMonthlyYTD',
  title: 'Total Monthly Donations (YTD)',
  value: formatAmount(totalMonthlyYTD),
  icon: faCalendarAlt,
  variant: 'primary',
  subtitle: `Since Jan 1, ${currentYear}`,
  categories: ['Donor Classifications'],
},
{
  id: 'majorMonthlyYTD',
  title: 'Major Monthly Donations (YTD)',
  value: formatAmount(majorMonthlyYTD.total),
  icon: faStar,
  variant: 'success',
  subtitle: `Gifts ≥ $100 (${(totalMonthlyYTD > 0 ? (majorMonthlyYTD.total / totalMonthlyYTD) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('majorMonthlyYTD'),
  categories: ['Donor Classifications'],
},
{
  id: 'mediumMonthlyYTD',
  title: 'Medium Monthly Donations (YTD)',
  value: formatAmount(mediumMonthlyYTD.total),
  icon: faGift,
  variant: 'info',
  subtitle: `Gifts $50-$99 (${(totalMonthlyYTD > 0 ? (mediumMonthlyYTD.total / totalMonthlyYTD) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('mediumMonthlyYTD'),
  categories: ['Donor Classifications'],
},
{
  id: 'normalMonthlyYTD',
  title: 'Normal Monthly Donations (YTD)',
  value: formatAmount(normalMonthlyYTD.total),
  icon: faHandHoldingHeart,
  variant: 'secondary',
  subtitle: `Gifts < $50 (${(totalMonthlyYTD > 0 ? (normalMonthlyYTD.total / totalMonthlyYTD) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('normalMonthlyYTD'),
  categories: ['Donor Classifications'],
},
// --- All-Time One-Time Tiers ---
{
  id: 'totalOnetimeAllTime',
  title: 'Total One-Time Donations (All-Time)',
  value: formatAmount(totalOnetimeAllTime),
  icon: faDollarSign,
  variant: 'dark',
  subtitle: 'All non-recurring gifts',
  categories: ['Donor Classifications'],
},
{
  id: 'majorOnetimeAllTime',
  title: 'Major One-Time Donations (All-Time)',
  value: formatAmount(majorOnetimeAllTime.total),
  icon: faStar,
  variant: 'dark',
  subtitle: `Gifts ≥ $1,000 (${(totalOnetimeAllTime > 0 ? (majorOnetimeAllTime.total / totalOnetimeAllTime) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('majorOnetimeAllTime'),
  categories: ['Donor Classifications'],
},
{
  id: 'mediumOnetimeAllTime',
  title: 'Medium One-Time Donations (All-Time)',
  value: formatAmount(mediumOnetimeAllTime.total),
  icon: faGift,
  variant: 'dark',
  subtitle: `Gifts $500-$999 (${(totalOnetimeAllTime > 0 ? (mediumOnetimeAllTime.total / totalOnetimeAllTime) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('mediumOnetimeAllTime'),
  categories: ['Donor Classifications'],
},
{
  id: 'normalOnetimeAllTime',
  title: 'Normal One-Time Donations (All-Time)',
  value: formatAmount(normalOnetimeAllTime.total),
  icon: faHandHoldingHeart,
  variant: 'dark',
  subtitle: `Gifts < $500 (${(totalOnetimeAllTime > 0 ? (normalOnetimeAllTime.total / totalOnetimeAllTime) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('normalOnetimeAllTime'),
  categories: ['Donor Classifications'],
},

// --- All-Time Monthly Tiers ---
{
  id: 'totalMonthlyAllTime',
  title: 'Total Monthly Donations (All-Time)',
  value: formatAmount(totalMonthlyAllTime),
  icon: faCalendarAlt,
  variant: 'dark',
  subtitle: 'All recurring gifts',
  categories: ['Donor Classifications'],
},
{
  id: 'majorMonthlyAllTime',
  title: 'Major Monthly Donations (All-Time)',
  value: formatAmount(majorMonthlyAllTime.total),
  icon: faStar,
  variant: 'dark',
  subtitle: `Gifts ≥ $100 (${(totalMonthlyAllTime > 0 ? (majorMonthlyAllTime.total / totalMonthlyAllTime) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('majorMonthlyAllTime'),
  categories: ['Donor Classifications'],
},
{
  id: 'mediumMonthlyAllTime',
  title: 'Medium Monthly Donations (All-Time)',
  value: formatAmount(mediumMonthlyAllTime.total),
  icon: faGift,
  variant: 'dark',
  subtitle: `Gifts $50-$99 (${(totalMonthlyAllTime > 0 ? (mediumMonthlyAllTime.total / totalMonthlyAllTime) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('mediumMonthlyAllTime'),
  categories: ['Donor Classifications'],
},
{
  id: 'normalMonthlyAllTime',
  title: 'Normal Monthly Donations (All-Time)',
  value: formatAmount(normalMonthlyAllTime.total),
  icon: faHandHoldingHeart,
  variant: 'dark',
  subtitle: `Gifts < $50 (${(totalMonthlyAllTime > 0 ? (normalMonthlyAllTime.total / totalMonthlyAllTime) * 100 : 0).toFixed(1)}%)`,
  onClick: () => openModal('normalMonthlyAllTime'),
  categories: ['Donor Classifications'],
},
{
  id: 'churnedMajorMonthly',
  title: 'Churned Major Monthly Donors (Year To Date)',
  value: churnedMonthlyMajor.length, 
  icon: faUserSlash,
  variant: 'danger',
  onClick: () => openModal('churnedMajorMonthly'), 
  subtitle: 'All-Time Major Monthly not currently in tier',
  categories: ['Retention & Churn'],
},
{
  id: 'retainedMajorMonthly',
  title: 'Retained Major Monthly Donors',
  value: retainedMajorMonthly.length,
  icon: faUserCheck,
  variant: 'success',
  onClick: () => openModal('retainedMajorMonthly'),
  subtitle: 'Major Monthly in 2024 & 2025',
  categories: ['Retention & Churn'],
},
{
  id: 'monthlyMajorDLV',
  title: 'Avg. Monthly Major Donor DLV',
  value: formatAmount(monthlyMajorDLV),
  icon: faGem,
  variant: 'success',
  subtitle: 'Predicted value (Click to view cohort)',
  onClick: () => openModal('monthlyMajorDLV'),
  categories: ['Lifetime Value'],
},
{
  id: 'onetimeMajorDLV',
  title: 'Avg. One-Time Major Donor DLV',
  value: formatAmount(onetimeMajorDLV),
  icon: faGem,
  variant: 'info',
  subtitle: 'Predicted value (Click to view cohort)',
  onClick: () => openModal('onetimeMajorDLV'),
  categories: ['Lifetime Value'],
},
  ];

    const filteredMetrics = metricDefinitions
      .filter(metric => 
        activeFilter === 'All Metrics' || metric.categories.includes(activeFilter)
      )
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
            'Retention & Churn', 'Lifetime Value',
          ]
        }}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Search metrics..."
        onSearch={setSearchTerm}
        primaryButtonLabel=""
        secondaryButtonLabel=""
        showSecondaryButton={false}
      />

        <div className="metrics-display-area">
        {activeFilter === 'Donor Classifications' || activeFilter === 'All-Time Classifications' ? (
          <div className="grouped-grid-view">
            {(['Major', 'Medium', 'Normal']).map(tier => {
              const allTierCards = filteredMetrics.filter(m => m.title.includes(tier));
              if (allTierCards.length === 0) return null;

              // Split cards into "All-Time" and "1 Year" (YTD) groups
              const oneYearCards = allTierCards.filter(m => !m.title.includes('All-Time'));
              const allTimeCards = allTierCards.filter(m => m.title.includes('All-Time'));

              return (
                <div key={tier} className="classification-tier">
                  <h3 className="classification-header">{tier} Donors</h3>
                  
                  {/*  1 Year Sub-section  */}
                  {oneYearCards.length > 0 && (
                    <>
                      <h4 className="classification-subheader">1 Year</h4>
                      <div className="stat-cards-grid">
                        {oneYearCards.map(metric => (
                          <StatCard key={metric.id} {...metric as any} />
                        ))}
                      </div>
                    </>
                  )}

                  {/*  All-Time Sub-section  */}
                  {allTimeCards.length > 0 && (
                    <>
                      <h4 className="classification-subheader">All-Time</h4>
                      <div className="stat-cards-grid">
                        {allTimeCards.map(metric => (
                          <StatCard key={metric.id} {...metric as any} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          //  EXISTING GRID VIEW (for all other filters) 
          <div className="stat-cards-grid">
            {filteredMetrics.map((metric) => (
              <StatCard key={metric.id} {...metric as any} />
            ))}
            {filteredMetrics.length === 0 && (
              <p>No metrics available for "{activeFilter}" filter.</p>
            )}
          </div>
        )}
      </div>

       <Modal isOpen={isModalOpen} onClose={closeModal} title={metricDefinitions.find(m => m.id === modalContentId)?.title || 'Details'}>
         {/* === Main Lists === */}
         {/* New Donors (Last 30 Days) */}
      {/* === Main Lists === */}
        {modalContentId === 'newDonors' && (
          <div className="top-list-content">
            {newDonorsList.length === 0 ? (<div className="top-list-empty">No new donors in the last 30 days.</div>) : (<ul className="top-list">{newDonorsList.map((d, i) => (<li key={d.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(d)}</div><div className="top-list-details">{donorFullName(d)}</div><div className="top-list-secondary">{formatDate(d.created_at)}</div></li>))}</ul>)}
          </div>
        )}
        {modalContentId === 'recurringDonors' && (
          <div className="top-list-content">
            {recurringGiftsMonth.length === 0 ? (<div className="top-list-empty">No recurring gifts in the last month.</div>) : (<ul className="top-list">{recurringGiftsMonth.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul>)}
          </div>
        )}
        {modalContentId === 'activeDonors' && (
           <div className="top-list-content">
            {activeDonorsList.length === 0 ? (<div className="top-list-empty">No donors gave more than once in the last 3 months.</div>) : (<ul className="top-list">{activeDonorsList.map((d, i) => (<li key={d.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(d)}</div><div className="top-list-details">{donorFullName(d)}</div><div className="top-list-secondary">{counts3mo[d.donorid] || 0} gifts · {formatAmount(totals3mo[d.donorid])}</div></li>))}</ul>)}
          </div>
        )}

        {/* === Median/WMA Detailed Breakdowns === */}
        {modalContentId === 'medianDonation' && (
           <div className="top-list-content">
            {medianIndex !== null && (<p style={{ margin: '0 0 1rem' }}><strong>Median Position:</strong> Gift #{medianIndex + 1}</p>)}
            <p style={{ margin: '0 0 1rem' }}><strong>Computed Median:</strong> {formatAmount(metrics.medianDonation)}</p>
            <ul className="top-list">{rawDonationsList.map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">Gift ID {g.giftid}<br />{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)}<br />{formatDate(g.giftdate)}</div></li>))}</ul>
          </div>
        )}
        {modalContentId === 'wma' && (
          <div className="top-list-content">
            {wmaDetails.length === 0 ? (<div className="top-list-empty">No data available for WMA.</div>) : (<ul className="top-list">{wmaDetails.map(({ monthLabel, total, weight }, i) => (<li key={monthLabel} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-details">{monthLabel}: {formatAmount(total)} × {weight}</div><div className="top-list-secondary">= <strong>{formatAmount(total * weight)}</strong></div></li>))}</ul>)}
            <p style={{ marginTop: '1em', fontWeight: 'bold' }}>Final WMA: {formatAmount(metrics.weightedMovingAvg)}</p>
          </div>
        )}

        {/* === Older Churn Metrics === */}
        {modalContentId === 'churnedLarge' && (
          <div className="top-list-content">
            {churnedLargeDetails.length === 0 ? <div className="top-list-empty">No large donors have churned.</div> : <ul className="top-list">{churnedLargeDetails.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}</div><div className="top-list-secondary">Prior-years total: {formatAmount(item.priorYearSum)}</div></li>))}</ul>}
          </div>
        )}
        {modalContentId === 'churnedMonthly' && (
          <div className="top-list-content">
            {churnedDonorsList.length === 0 ? <div className="top-list-empty">No churned donors found.</div> : <ul className="top-list">{churnedDonorsList.map((d, i) => { const lastDate = lastGiftDates[d.donorid]; return (<li key={d.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(d)}</div><div className="top-list-details">{donorFullName(d)}</div><div className="top-list-secondary">{countsOld3mo[d.donorid] || 0} gifts · {formatAmount(totalsOld3mo[d.donorid])}{lastDate && (<span style={{ marginLeft: 10, fontStyle: "italic", color: "#555" }}>Last Gift: {new Date(lastDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}</span>)}</div></li>); })}</ul>}
          </div>
        )}
        
        {/* === Median/WMA Analysis Lists === */}
        {modalContentId === 'recAboveMedian' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => g.isrecurring && g.totalamount! > metrics.medianDonation).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'recBelowMedian' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => g.isrecurring && g.totalamount! <= metrics.medianDonation).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecAboveMedian' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => !g.isrecurring && g.totalamount! > metrics.medianDonation).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecBelowMedian' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => !g.isrecurring && g.totalamount! <= metrics.medianDonation).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'recAboveWMA' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => g.isrecurring && g.totalamount! > metrics.weightedMovingAvg).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'recBelowWMA' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => g.isrecurring && g.totalamount! <= metrics.weightedMovingAvg).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecAboveWMA' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => !g.isrecurring && g.totalamount! > metrics.weightedMovingAvg).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}
        {modalContentId === 'nonRecBelowWMA' && (<div className="top-list-content"><ol className="top-list">{rawDonationsList.filter(g => !g.isrecurring && g.totalamount! <= metrics.weightedMovingAvg).map((g, idx) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{idx + 1}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ol></div>)}

        {/* === All of your custom lists === */}
        {/* Note: I'm omitting the Normal/Medium lists for brevity, but you would add them here */}
        {modalContentId === 'top20Recurring' && (<div className="top-list-content">{topRecurringDonors.length === 0 ? <div className="top-list-empty">No recurring donors this year.</div> : <ul className="top-list">{topRecurringDonors.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br /><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmount)}<br /><span style={{color: '#6c757d'}}>{item.type}</span></div></li>))}</ul>}</div>)}
        {modalContentId === 'top20NonRecurring' && (<div className="top-list-content">{topNonRecurringDonors.length === 0 ? <div className="top-list-empty">No one-time donors this year.</div> : <ul className="top-list">{topNonRecurringDonors.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br /><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalAmount)}<br /><span style={{color: '#6c757d'}}>{item.type}</span></div></li>))}</ul>}</div>)}
        {modalContentId === 'majorMonthly' && (<div className="top-list-content"><ul className="top-list">{majorMonthly.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>)}
        {modalContentId === 'majorOnetime' && (<div className="top-list-content"><ul className="top-list">{majorOnetime.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeMajorMonthly' && (<div className="top-list-content"><ul className="top-list">{allTimeMajorMonthly.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/avg mo</div></li>))}</ul></div>)}
        {modalContentId === 'allTimeMajorOnetime' && (<div className="top-list-content"><ul className="top-list">{allTimeMajorOnetime.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>)}
        {modalContentId === 'churnedMajorMonthly' && (<div className="top-list-content"><ul className="top-list">{churnedMonthlyMajor.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">Lifetime Total: {formatAmount(item.lifetimeTotal)}<br/><span style={{color: '#6c757d'}}>Last Recurring Gift: {formatAmount(item.lastRecurringAmount)} on {formatDate(item.lastRecurringDate)}</span></div></li>))}</ul></div>)}
        {modalContentId === 'retainedMajorMonthly' && (<div className="top-list-content"><ul className="top-list">{retainedMajorMonthly.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details"> {donorFullName(item.donor)}<br /><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>)}
        {modalContentId === 'majorDonorContribution' && (<div className="top-list-content"><ul className="top-list">{majorContributorsList.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalContribution)}</div></li>))}</ul></div>)}
        {modalContentId === 'monthlyMajorDLV' && (<div className="top-list-content"><div className="dlv-breakdown"><p><strong>Average Lifetime Total per Donor:</strong> {formatAmount(monthlyDlvComponents.avgLifetimeTotal)}</p><p><strong>Average Donation Amount:</strong> {formatAmount(monthlyDlvComponents.amount)}</p><p><strong>Average Annual Donations:</strong> {monthlyDlvComponents.frequency.toFixed(2)}</p><p><strong>Average Donor Lifespan:</strong> {monthlyDlvComponents.lifespan.toFixed(2)} years</p><p className="dlv-formula">{formatAmount(monthlyDlvComponents.amount)} &times; {monthlyDlvComponents.frequency.toFixed(2)} &times; {monthlyDlvComponents.lifespan.toFixed(2)} years = <strong>{formatAmount(monthlyMajorDLV)}</strong></p></div><ul className="top-list">{monthlyDlvCohort.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalContribution)}</div></li>))}</ul></div>)}
        {modalContentId === 'onetimeMajorDLV' && (<div className="top-list-content"><div className="dlv-breakdown"><p><strong>Average Lifetime Total per Donor:</strong> {formatAmount(onetimeDlvComponents.avgLifetimeTotal)}</p><p><strong>Average Donation Amount:</strong> {formatAmount(onetimeDlvComponents.amount)}</p><p><strong>Average Annual Donations:</strong> {onetimeDlvComponents.frequency.toFixed(2)}</p><p><strong>Average Donor Lifespan:</strong> {onetimeDlvComponents.lifespan.toFixed(2)} years</p><p className="dlv-formula">{formatAmount(onetimeDlvComponents.amount)} &times; {onetimeDlvComponents.frequency.toFixed(2)} &times; {onetimeDlvComponents.lifespan.toFixed(2)} years = <strong>{formatAmount(onetimeMajorDLV)}</strong></p></div><ul className="top-list">{onetimeDlvCohort.map((item, i) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.totalContribution)}</div></li>))}</ul></div>)}

        {modalContentId === 'mediumMonthly' && (
          <div className="top-list-content"><ul className="top-list">{mediumMonthly.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>
        )}
        {modalContentId === 'normalMonthly' && (
          <div className="top-list-content"><ul className="top-list">{normalMonthly.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/month</div></li>))}</ul></div>
        )}
        {modalContentId === 'mediumOnetime' && (
          <div className="top-list-content"><ul className="top-list">{mediumOnetime.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>
        )}
        {modalContentId === 'normalOnetime' && (
          <div className="top-list-content"><ul className="top-list">{normalOnetime.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>
        )}

        {modalContentId === 'allTimeMediumMonthly' && (
          <div className="top-list-content"><ul className="top-list">{allTimeMediumMonthly.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/avg mo</div></li>))}</ul></div>
        )}
        {modalContentId === 'allTimeNormalMonthly' && (
          <div className="top-list-content"><ul className="top-list">{allTimeNormalMonthly.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}/avg mo</div></li>))}</ul></div>
        )}
        {modalContentId === 'allTimeMediumOnetime' && (
          <div className="top-list-content"><ul className="top-list">{allTimeMediumOnetime.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>
        )}
        {modalContentId === 'allTimeNormalOnetime' && (
          <div className="top-list-content"><ul className="top-list">{allTimeNormalOnetime.map((item) => (<li key={item.donor.donorid} className="top-list-item"><div className="top-list-avatar">{donorInitials(item.donor)}</div><div className="top-list-details">{donorFullName(item.donor)}<br/><span style={{color: '#6c757d'}}>{item.donor.email}</span></div><div className="top-list-secondary">{formatAmount(item.amount)}</div></li>))}</ul></div>
        )}
       {/* === Donation Tier Lists (YTD) === */}
        {modalContentId === 'majorOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{majorOnetimeYTD.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{mediumOnetimeYTD.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalOnetimeYTD' && (<div className="top-list-content"><ul className="top-list">{normalOnetimeYTD.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{majorMonthlyYTD.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{mediumMonthlyYTD.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalMonthlyYTD' && (<div className="top-list-content"><ul className="top-list">{normalMonthlyYTD.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}

        {/* === Donation Tier Lists (All-Time) === */}
        {modalContentId === 'majorOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{majorOnetimeAllTime.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{mediumOnetimeAllTime.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalOnetimeAllTime' && (<div className="top-list-content"><ul className="top-list">{normalOnetimeAllTime.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'majorMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{majorMonthlyAllTime.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'mediumMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{mediumMonthlyAllTime.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}
        {modalContentId === 'normalMonthlyAllTime' && (<div className="top-list-content"><ul className="top-list">{normalMonthlyAllTime.gifts.map((g, i) => (<li key={g.giftid} className="top-list-item"><div className="top-list-rank">{i + 1}</div><div className="top-list-avatar">{donorInitials(g.donor)}</div><div className="top-list-details">{donorFullName(g.donor)}</div><div className="top-list-secondary">{formatAmount(g.totalamount)} on {formatDate(g.giftdate)}</div></li>))}</ul></div>)}

      </Modal>
    </div>
      )}

export default Metrics;

