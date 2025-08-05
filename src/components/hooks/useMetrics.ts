import { useState, useEffect } from 'react';
import { fetchGifts, fetchDonors, type GiftData, type DonorData } from '../../utils/supabaseClient'; // Adjust path if needed
export type { GiftData, DonorData } from '../../utils/supabaseClient';

// --- DATA TYPE DEFINITIONS ---
export type GiftWithDonor = Omit<GiftData, 'donor'> & { donor?: DonorData | null };
export type TopDonorInfo = { donor: DonorData; totalAmount: number; type: 'Recurring' | 'One-Time'; };
export type ClassifiedDonor = { donor: DonorData; amount: number; };
export type ChurnedDonorInfo = { donor: DonorData; lifetimeTotal: number; lastGiftDate: string; lastRecurringAmount?: number; lastRecurringDate?: string; };
export type ContributionListItem = { donor: DonorData; totalContribution: number; };

export type MetricsType = {
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
  // This Month's Snapshot Metrics
  totalValueCurrentMonth: number;
  uniqueDonorsCurrentMonth: number;
  averageDonationCurrentMonth: number;
  majorDonorsCurrentMonth: number;
  mediumDonorsCurrentMonth: number;
  normalDonorsCurrentMonth: number;
  totalGiftsCurrentMonth: number;
  retentionPercentageCurrentMonth: number;
  totalDonorPoolCount: number;
};

// This defines the shape of the object our hook will return
export interface MetricsData {
  isLoading: boolean;
  error: string | null;
  metrics: MetricsType;
  rawDonationsList: GiftWithDonor[];
  medianIndex: number | null;
  wmaDetails: { monthLabel: string; total: number; weight: number }[];
  lastGiftDates: Record<string, string>;
  totalUniqueDonorsAllTime: number;
  totalGiftsAllTime: number;
  giftsCurrentMonthList: GiftWithDonor[];
  majorDonorsCurrentMonthList: ClassifiedDonor[];
  mediumDonorsCurrentMonthList: ClassifiedDonor[];
  normalDonorsCurrentMonthList: ClassifiedDonor[];
  retainedDonorsList: DonorData[];
  churnedFromLastMonthList: DonorData[];
  uniqueDonorsCurrentMonthList: DonorData[];
  lastMonthDonorPool: DonorData[];
  averageDonationChartData: number[];
  totalDonorPoolList: DonorData[];
  [key: string]: any;
}

// --- THE CUSTOM HOOK ---
export const useMetrics = (): MetricsData => {
  const [data, setData] = useState<Partial<MetricsData>>({
    isLoading: true,
    error: null,
    metrics: {
      newDonorsLastMonth: 0, recurringDonorsLastMonth: 0, medianDonation: 0, weightedMovingAvg: 0,
      recAboveMedian1mo: 0, activeDonorsLast3mo: 0, recBelowMedian1mo: 0, nonRecAboveMedian1mo: 0,
      nonRecBelowMedian1mo: 0, recAboveWMA1mo: 0, recBelowWMA1mo: 0, nonRecAboveWMA1mo: 0,
      nonRecBelowWMA1mo: 0, recurringDonationRatio: 0, churnedLargeDonors: 0, monthlyDonorsWhoChurned: 0,
      totalValueCurrentMonth: 0, uniqueDonorsCurrentMonth: 0, averageDonationCurrentMonth: 0,
      majorDonorsCurrentMonth: 0, mediumDonorsCurrentMonth: 0, normalDonorsCurrentMonth: 0, totalGiftsCurrentMonth: 0,
      retentionPercentageCurrentMonth: 0,totalDonorPoolCount: 0,
    },
    newDonorsList: [], recurringGiftsMonth: [], rawDonationsList: [], medianIndex: null, wmaDetails: [],
    topRecurringDonors: [], topNonRecurringDonors: [], majorMonthly: [], mediumMonthly: [], normalMonthly: [],
    majorOnetime: [], mediumOnetime: [], normalOnetime: [], allTimeMajorMonthly: [], allTimeMediumMonthly: [],
    allTimeNormalMonthly: [], allTimeMajorOnetime: [], allTimeMediumOnetime: [], allTimeNormalOnetime: [],
    churnedMonthlyMajor: [], churnedOnetimeMajor: [], retainedMajorMonthly: [], monthlyMajorDLV: 0, onetimeMajorDLV: 0,
    monthlyDlvCohort: [], onetimeDlvCohort: [],
    monthlyDlvComponents: { amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 },
    onetimeDlvComponents: { amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 },
    totalDonationsAllTime: 0, totalYTD: 0, totalOnetimeYTD: 0, totalMonthlyYTD: 0,
    majorOnetimeYTD: { total: 0, gifts: [] }, mediumOnetimeYTD: { total: 0, gifts: [] }, normalOnetimeYTD: { total: 0, gifts: [] },
    majorMonthlyYTD: { total: 0, gifts: [] }, mediumMonthlyYTD: { total: 0, gifts: [] }, normalMonthlyYTD: { total: 0, gifts: [] },
    allGiftsYTD: [], onetimeGiftsYTD: [], monthlyGiftsYTD: [],
    totalOnetimeAllTime: 0, totalMonthlyAllTime: 0,
    majorOnetimeAllTime: { total: 0, gifts: [] }, mediumOnetimeAllTime: { total: 0, gifts: [] }, normalOnetimeAllTime: { total: 0, gifts: [] },
    majorMonthlyAllTime: { total: 0, gifts: [] }, mediumMonthlyAllTime: { total: 0, gifts: [] }, normalMonthlyAllTime: { total: 0, gifts: [] },
    majorContributorsList: [],
    lastGiftDates: {},
    churnedLargeDetails: [], churnedDonorsList: [],
    totalUniqueDonorsAllTime: 0, totalGiftsAllTime: 0,
    giftsCurrentMonthList: [], majorDonorsCurrentMonthList: [], mediumDonorsCurrentMonthList: [], normalDonorsCurrentMonthList: [],
    retainedDonorsList: [],
    churnedFromLastMonthList: [],
    lastMonthDonorPool: [],
    uniqueDonorsCurrentMonthList: [],
    totalDonorPoolList: [],
  });

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const [giftsRes, donorsRes] = await Promise.all([fetchGifts(), fetchDonors()]);
        if (giftsRes.error) throw new Error(giftsRes.error as any);
        if (donorsRes.error) throw new Error(donorsRes.error as any);

        const gifts = giftsRes.data || [];
        const donors = donorsRes.data || [];
        
        // --- 1. CORE DATA PREPARATION ---
        const now = new Date();
        const currentYear = now.getFullYear();
        const previousYear = currentYear - 1;
        const oneMonthAgo = new Date(now); oneMonthAgo.setMonth(now.getMonth() - 1);
        const oneYearAgo = new Date(now); oneYearAgo.setFullYear(now.getFullYear() - 1);
        
        const donorMap: Record<string, DonorData> = {};
        donors.forEach(d => { if (d.donorid) donorMap[d.donorid] = d; });
        
        const lifetimeTotals: Record<string, number> = {};
        const lastGiftDates: Record<string, string> = {};
        gifts.forEach(gift => {
            if (gift.donorid && gift.giftdate) {
                lifetimeTotals[gift.donorid] = (lifetimeTotals[gift.donorid] || 0) + (gift.totalamount || 0);
                const giftDate = new Date(gift.giftdate);
                if (!lastGiftDates[gift.donorid] || giftDate > new Date(lastGiftDates[gift.donorid])) {
                    lastGiftDates[gift.donorid] = gift.giftdate;
                }
            }
        });

        const currentYearGifts = gifts.filter(g => g.giftdate && g.giftdate.startsWith(currentYear.toString()));
        const previousYearGifts = gifts.filter(g => g.giftdate && g.giftdate.startsWith(previousYear.toString()));
        
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
        
        const enrich = (gifts: GiftData[]): GiftWithDonor[] => gifts.map(g => ({ ...g, donor: donorMap[g.donorid] || null })).sort((a, b) => new Date(b.giftdate ?? '').getTime() - new Date(a.giftdate ?? '').getTime());

        // --- Calculations for "This Month's Snapshot" ---
        const currentYearString = now.getFullYear().toString();
        const currentMonthString = String(now.getMonth() + 1).padStart(2, '0');
        const firstDayOfMonthString = `${currentYearString}-${currentMonthString}-01`;

        const giftsCurrentMonth = gifts.filter(g =>
            g.giftdate && g.giftdate >= firstDayOfMonthString
        );

        const totalValueCurrentMonth = giftsCurrentMonth.reduce((acc, g) => acc + (g.totalamount || 0), 0);
        const totalGiftsCurrentMonth = giftsCurrentMonth.length;
        const uniqueDonorsCurrentMonthSet = new Set(giftsCurrentMonth.map(g => g.donorid));
        const uniqueDonorsCurrentMonth = uniqueDonorsCurrentMonthSet.size;
        const uniqueDonorsCurrentMonthList = Array.from(uniqueDonorsCurrentMonthSet).map(id => donorMap[id]).filter((d): d is DonorData => d !== null);
        const averageDonationCurrentMonth = totalGiftsCurrentMonth > 0 ? totalValueCurrentMonth / totalGiftsCurrentMonth : 0;

        const donorTiersCurrentMonth: { [key: string]: { tier: 'major' | 'medium' | 'normal', amount: number } } = {};
        giftsCurrentMonth.forEach(gift => {
            if (gift.donorid) {
                const amount = gift.totalamount || 0;
                const existing = donorTiersCurrentMonth[gift.donorid];
                if (!existing || amount > existing.amount) {
                    if (amount >= 1000) donorTiersCurrentMonth[gift.donorid] = { tier: 'major', amount };
                    else if (amount >= 500) donorTiersCurrentMonth[gift.donorid] = { tier: 'medium', amount };
                    else donorTiersCurrentMonth[gift.donorid] = { tier: 'normal', amount };
                }
            }
        });

        const majorDonorsCurrentMonthList: ClassifiedDonor[] = [];
        const mediumDonorsCurrentMonthList: ClassifiedDonor[] = [];
        const normalDonorsCurrentMonthList: ClassifiedDonor[] = [];
        for (const donorId in donorTiersCurrentMonth) {
            const donor = donorMap[donorId];
            if (donor) {
                const { tier, amount } = donorTiersCurrentMonth[donorId];
                const classifiedDonor = { donor, amount };
                if (tier === 'major') majorDonorsCurrentMonthList.push(classifiedDonor);
                else if (tier === 'medium') mediumDonorsCurrentMonthList.push(classifiedDonor);
                else normalDonorsCurrentMonthList.push(classifiedDonor);
            }
        }
        const majorDonorsCurrentMonth = majorDonorsCurrentMonthList.length;
        const mediumDonorsCurrentMonth = mediumDonorsCurrentMonthList.length;
        const normalDonorsCurrentMonth = normalDonorsCurrentMonthList.length;

        // --- NEW: Monthly Retention Calculation ---
        // 1. Get all unique donors who gave in the PREVIOUS month.
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        const lastMonthDonorIds = new Set(
            gifts
                .filter(g => {
                    if (!g.giftdate) return false;
                    const giftDate = new Date(g.giftdate);
                    return giftDate >= startOfLastMonth && giftDate <= endOfLastMonth;
                })
                .map(g => g.donorid)
        );

        // 2. Get all unique donors who gave THIS month.
        const thisMonthDonorIds = new Set(giftsCurrentMonth.map(g => g.donorid));

        // 3. Find how many of last month's donors also gave this month and prepare lists.
        const retainedDonorsList: DonorData[] = [];
        const churnedFromLastMonthList: DonorData[] = [];
        const lastMonthDonorPool = Array.from(lastMonthDonorIds).map(id => donorMap[id]).filter(Boolean);

        lastMonthDonorPool.forEach(donor => {
            if (thisMonthDonorIds.has(donor.donorid)) {
                retainedDonorsList.push(donor);
            } else {
                churnedFromLastMonthList.push(donor);
            }
        });

        // 4. Calculate the retention percentage.
        const retentionPercentageCurrentMonth = lastMonthDonorPool.length > 0
            ? (retainedDonorsList.length / lastMonthDonorPool.length) * 100
            : 0;

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

        const averageDonationChartData = generateMonthlyAverageData(gifts, 6)

        // --- All-Time Recurring Donor Ratio Calculation ---
        const recurringDonorIdsAllTime = new Set(gifts.filter(g => g.isrecurring).map(g => g.donorid).filter(Boolean));
        const uniqueRecurringDonorsAllTime = recurringDonorIdsAllTime.size;
        const allDonorIdsAllTime = new Set(gifts.map(g => g.donorid).filter(Boolean));
        const totalUniqueDonorsAllTime = allDonorIdsAllTime.size;
        const recurringDonorRatioAllTime = totalUniqueDonorsAllTime > 0
            ? (uniqueRecurringDonorsAllTime / totalUniqueDonorsAllTime) * 100 : 0;


        // --- 2. LEGACY & DETAILED METRICS ---
        const oneMonthGifts = gifts.filter(g => g.giftdate && new Date(g.giftdate) >= oneMonthAgo);
        const newDonors = donors.filter(d => d.created_at && new Date(d.created_at) >= oneMonthAgo);
        const amounts30 = oneMonthGifts.filter(g => g.totalamount != null && g.totalamount > 0).map(g => g.totalamount!);
        amounts30.sort((a, b) => a - b);
        let median30 = 0;
        if (amounts30.length) {
            const mid = Math.floor(amounts30.length / 2);
            median30 = amounts30.length % 2 !== 0 ? amounts30[mid] : (amounts30[mid - 1] + amounts30[mid]) / 2;
        }
        const rawDonationsList = enrich(oneMonthGifts);
        const medianIndex = rawDonationsList.length ? Math.floor((rawDonationsList.length - 1) / 2) : null;

        const toYMD = (date: Date): string => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const dayString = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${dayString}`;
        };

        const dailySums: number[] = [];
        const dailyWeights: number[] = [];
        for (let i = 29; i >= 0; i--) {
            const day = new Date(now);
            day.setDate(now.getDate() - i);
            const targetDateString = toYMD(day);
            const sum = gifts.filter(g => g.giftdate && g.giftdate.startsWith(targetDateString)).reduce((acc, g) => acc + (g.totalamount || 0), 0);
            dailySums.push(sum);
            dailyWeights.push(30 - i);
        }
        const weightedSumDaily = dailySums.reduce((acc, v, idx) => acc + v * dailyWeights[idx], 0);
        const weightTotalDaily = dailyWeights.reduce((a, b) => a + b, 0);
        const wmaDaily = weightTotalDaily > 0 ? weightedSumDaily / weightTotalDaily : 0;
        const wmaDetails = dailySums.map((total, idx) => {
            const d = new Date(now);
            d.setDate(now.getDate() - (29 - idx));
            return { monthLabel: d.toLocaleDateString(), total, weight: dailyWeights[idx] };
        });

        const recAbove = rawDonationsList.filter(g => g.isrecurring && g.totalamount! > median30);
        const recBelow = rawDonationsList.filter(g => g.isrecurring && g.totalamount! <= median30);
        const nonRecAbove = rawDonationsList.filter(g => !g.isrecurring && g.totalamount! > median30);
        const nonRecBelow = rawDonationsList.filter(g => !g.isrecurring && g.totalamount! <= median30);
        const recAboveWMA = rawDonationsList.filter(g => g.isrecurring && g.totalamount! > wmaDaily);
        const recBelowWMA = rawDonationsList.filter(g => g.isrecurring && g.totalamount! <= wmaDaily);
        const nonRecAboveWMA = rawDonationsList.filter(g => !g.isrecurring && g.totalamount! > wmaDaily);
        const nonRecBelowWMA = rawDonationsList.filter(g => !g.isrecurring && g.totalamount! <= wmaDaily);
        
        const giftsLast3mo = gifts.filter(g => g.giftdate && new Date(g.giftdate) >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate()));
        const counts3mo: Record<string, number> = {};
        giftsLast3mo.forEach(g => { if(g.donorid) counts3mo[g.donorid] = (counts3mo[g.donorid] || 0) + 1; });
        const activeDonorIds = Object.keys(counts3mo).filter(id => counts3mo[id] > 1);

        const priorYearSums: Record<string, number> = {};
        gifts.filter(g => g.donorid && g.giftdate && new Date(g.giftdate) < oneYearAgo).forEach(g => { priorYearSums[g.donorid!] = (priorYearSums[g.donorid!] || 0) + (g.totalamount || 0); });
        const recentDonorIds = new Set(gifts.filter(g => g.donorid && g.giftdate && new Date(g.giftdate) >= oneYearAgo).map(g => g.donorid!));
        const churnedLargeList = Object.entries(priorYearSums).filter(([donorid, sum]) => sum >= 1000 && !recentDonorIds.has(donorid)).map(([donorid, sum]) => ({ donor: donorMap[donorid]!, priorYearSum: sum }));

        // --- 3. ALL-TIME & YTD DONOR CLASSIFICATION ---
        const at_majMonthly: ClassifiedDonor[] = [], at_medMonthly: ClassifiedDonor[] = [], at_normMonthly: ClassifiedDonor[] = [], at_majOnetime: ClassifiedDonor[] = [], at_medOnetime: ClassifiedDonor[] = [], at_normOnetime: ClassifiedDonor[] = [];
        const majMonthly: ClassifiedDonor[] = [], medMonthly: ClassifiedDonor[] = [], normMonthly: ClassifiedDonor[] = [], majOnetime: ClassifiedDonor[] = [], medOnetime: ClassifiedDonor[] = [], normOnetime: ClassifiedDonor[] = [];
        for (const donorId in allTimeMonthlyDonations) {
            const donor = donorMap[donorId]; const amounts = allTimeMonthlyDonations[donorId];
            if (donor && amounts?.length > 0) {
                const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
                const classified = { donor, amount: avg };
                if (avg >= 100) at_majMonthly.push(classified); else if (avg >= 50) at_medMonthly.push(classified); else at_normMonthly.push(classified);
            }
        }
        const allTimeOnetimeTotals: Record<string, number> = {};
        gifts.filter(g => !g.isrecurring && g.donorid).forEach(gift => { allTimeOnetimeTotals[gift.donorid] = (allTimeOnetimeTotals[gift.donorid] || 0) + (gift.totalamount || 0); });
        for (const donorId in allTimeOnetimeTotals) {
            const donor = donorMap[donorId];
            if (donor) {
                const total = allTimeOnetimeTotals[donorId]; const classified = { donor, amount: total };
                if (total >= 1000) at_majOnetime.push(classified); else if (total >= 500) at_medOnetime.push(classified); else at_normOnetime.push(classified);
            }
        }
        const currentYearMonthlyAmounts: Record<string, number> = {};
        currentYearGifts.filter(g => g.isrecurring && g.donorid).forEach(gift => { currentYearMonthlyAmounts[gift.donorid] = gift.totalamount || 0; });
        for (const donorId in currentYearMonthlyAmounts) {
            const donor = donorMap[donorId];
            if (donor) {
                const amount = currentYearMonthlyAmounts[donorId]; const classified = { donor, amount };
                if (amount >= 100) majMonthly.push(classified); else if (amount >= 50) medMonthly.push(classified); else normMonthly.push(classified);
            }
        }
        const currentYearOnetimeTotals: Record<string, number> = {};
        currentYearGifts.filter(g => !g.isrecurring && g.donorid).forEach(gift => { currentYearOnetimeTotals[gift.donorid] = (currentYearOnetimeTotals[gift.donorid] || 0) + (gift.totalamount || 0); });
        for (const donorId in currentYearOnetimeTotals) {
            const donor = donorMap[donorId];
            if (donor) {
                const total = currentYearOnetimeTotals[donorId]; const classified = { donor, amount: total };
                if (total >= 1000) majOnetime.push(classified); else if (total >= 500) medOnetime.push(classified); else normOnetime.push(classified);
            }
        }
        
        // --- 4. DONATION TIER CALCULATIONS ---
        const calculateSplitTierTotals = (giftArray: GiftData[]) => {
            const result = { totalOnetime: 0, totalMonthly: 0, majorOnetime: { total: 0, gifts: [] as GiftData[] }, mediumOnetime: { total: 0, gifts: [] as GiftData[] }, normalOnetime: { total: 0, gifts: [] as GiftData[] }, majorMonthly: { total: 0, gifts: [] as GiftData[] }, mediumMonthly: { total: 0, gifts: [] as GiftData[] }, normalMonthly: { total: 0, gifts: [] as GiftData[] }, };
            giftArray.forEach(gift => {
                const amount = gift.totalamount || 0;
                if (gift.isrecurring) {
                    result.totalMonthly += amount;
                    if (amount >= 100) { result.majorMonthly.total += amount; result.majorMonthly.gifts.push(gift); } else if (amount >= 50) { result.mediumMonthly.total += amount; result.mediumMonthly.gifts.push(gift); } else { result.normalMonthly.total += amount; result.normalMonthly.gifts.push(gift); }
                } else {
                    result.totalOnetime += amount;
                    if (amount >= 1000) { result.majorOnetime.total += amount; result.majorOnetime.gifts.push(gift); } else if (amount >= 500) { result.mediumOnetime.total += amount; result.mediumOnetime.gifts.push(gift); } else { result.normalOnetime.total += amount; result.normalOnetime.gifts.push(gift); }
                }
            });
            return result;
        };
        const ytdTotals = calculateSplitTierTotals(currentYearGifts);
        const allTimeTotals = calculateSplitTierTotals(gifts);

        // --- 5. CHURN, RETENTION, DLV & CONTRIBUTION ---
        const donorsWhoGaveThisYear = new Set(currentYearGifts.map(g => g.donorid));
        const previousYearRecurringGifts = gifts.filter(g => g.isrecurring && g.giftdate && g.giftdate.startsWith(previousYear.toString()));
        const previousYearMonthlyDonorIds = new Set(previousYearRecurringGifts.map(g => g.donorid));
        const churnedMonthlyDonorIds: string[] = [];
        previousYearMonthlyDonorIds.forEach(donorId => {
            if (donorId && !donorsWhoGaveThisYear.has(donorId)) {
                churnedMonthlyDonorIds.push(donorId);
            }
        });
        const newChurnedDonorsList: ChurnedDonorInfo[] = churnedMonthlyDonorIds
          .map(donorId => {
            const donor = donorMap[donorId];
            if (!donor) return null;
            const churnedDonor: ChurnedDonorInfo = {
                donor: donor,
                lifetimeTotal: lifetimeTotals[donorId] || 0,
                lastGiftDate: lastGiftDates[donorId] || 'N/A',
                lastRecurringAmount: lastRecurringGiftDetails[donorId]?.amount,
                lastRecurringDate: lastRecurringGiftDetails[donorId]?.date?.toISOString(),
            };
            return churnedDonor;
          })
          .filter((d): d is ChurnedDonorInfo => d !== null);

        const allTimeMajorMonthlyIds = new Set(at_majMonthly.map(d => d.donor.donorid));
        const majorChurnedList: ChurnedDonorInfo[] = [];
        allTimeMajorMonthlyIds.forEach(donorId => {
            if (!donorsWhoGaveThisYear.has(donorId)) {
                const donor = donorMap[donorId];
                if (donor) { majorChurnedList.push({ donor, lifetimeTotal: lifetimeTotals[donorId] || 0, lastGiftDate: lastGiftDates[donorId] || 'N/A', lastRecurringAmount: lastRecurringGiftDetails[donorId]?.amount, lastRecurringDate: lastRecurringGiftDetails[donorId]?.date?.toISOString(), }); }
            }
        });
        const allTimeMajorOnetimeIds = new Set(at_majOnetime.map(d => d.donor.donorid));
        const currentYearMajorOnetimeIds = new Set(majOnetime.map(d => d.donor.donorid));
        const churnedOnetimeList: ChurnedDonorInfo[] = [];
        allTimeMajorOnetimeIds.forEach(donorId => {
            if (!currentYearMajorOnetimeIds.has(donorId)) {
                const donor = donorMap[donorId];
                if (donor) { churnedOnetimeList.push({ donor, lifetimeTotal: lifetimeTotals[donorId] || 0, lastGiftDate: lastGiftDates[donorId] || 'N/A' }); }
            }
        });
        const previousYearMonthlyAmounts: Record<string, number> = {};
        previousYearGifts.filter(g => g.isrecurring).forEach(gift => { if (gift.donorid) previousYearMonthlyAmounts[gift.donorid] = gift.totalamount || 0; });
        const previousYearMajorMonthlyIds = new Set<string>();
        for (const donorId in previousYearMonthlyAmounts) { if (previousYearMonthlyAmounts[donorId] >= 100) { previousYearMajorMonthlyIds.add(donorId); } }
        const currentYearMajorMonthlyIds = new Set(majMonthly.map(d => d.donor.donorid));
        const retainedList: ClassifiedDonor[] = [];
        currentYearMajorMonthlyIds.forEach(donorId => {
            if (previousYearMajorMonthlyIds.has(donorId)) {
                const donor = donorMap[donorId];
                if (donor) { retainedList.push({ donor, amount: currentYearMonthlyAmounts[donorId] || 0 }); }
            }
        });
        const calculateDLV = (donorIds: Set<string>) => {
            if (donorIds.size === 0) return { finalDLV: 0, cohortList: [], components: { amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 } };
            const cohortGifts = gifts.filter(g => g.donorid && donorIds.has(g.donorid));
            if (cohortGifts.length === 0) return { finalDLV: 0, cohortList: [], components: { amount: 0, frequency: 0, lifespan: 0, avgLifetimeTotal: 0 } };
            const totalAmount = cohortGifts.reduce((acc, g) => acc + (g.totalamount || 0), 0);
            const avgAmount = cohortGifts.length > 0 ? totalAmount / cohortGifts.length : 0;
            const avgLifetimeTotal = donorIds.size > 0 ? totalAmount / donorIds.size : 0;
            const giftsByDonor: Record<string, Date[]> = {};
            cohortGifts.forEach(g => { if (g.donorid && g.giftdate) { if (!giftsByDonor[g.donorid]) giftsByDonor[g.donorid] = []; giftsByDonor[g.donorid].push(new Date(g.giftdate)); } });
            let totalLifespanYears = 0;
            for (const id in giftsByDonor) {
                const dates = giftsByDonor[id];
                if (dates.length > 1) {
                    const first = new Date(Math.min(...dates.map(d => d.getTime()))); const last = new Date(Math.max(...dates.map(d => d.getTime())));
                    totalLifespanYears += (last.getTime() - first.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
                }
            }
            const avgLifespan = donorIds.size > 0 ? totalLifespanYears / donorIds.size : 0;
            const allGiftDates = gifts.map(g => new Date(g.giftdate as string));
            const orgStartDate = new Date(Math.min(...allGiftDates.map(d => d.getTime()))); const orgEndDate = new Date(Math.max(...allGiftDates.map(d => d.getTime())));
            const orgTotalYears = Math.max(1, (orgEndDate.getTime() - orgStartDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
            const avgFrequency = donorIds.size > 0 ? (cohortGifts.length / donorIds.size) / orgTotalYears : 0;
            const finalDLV = avgAmount * avgFrequency * avgLifespan;
            const cohortList: ContributionListItem[] = [];
            donorIds.forEach(donorId => { const donor = donorMap[donorId]; if (donor) { cohortList.push({ donor, totalContribution: lifetimeTotals[donorId] || 0 }); } });
            return { finalDLV, cohortList: cohortList.sort((a, b) => b.totalContribution - a.totalContribution), components: { amount: avgAmount, frequency: avgFrequency, lifespan: avgLifespan, avgLifetimeTotal: avgLifetimeTotal } };
        };
        const monthlyResult = calculateDLV(allTimeMajorMonthlyIds);
        const onetimeResult = calculateDLV(allTimeMajorOnetimeIds);
        const combinedCurrentYearMajorIds = new Set([...currentYearMajorMonthlyIds, ...currentYearMajorOnetimeIds]);
        const contributorsList: ContributionListItem[] = [];
        combinedCurrentYearMajorIds.forEach(donorId => {
            const donor = donorMap[donorId];
            if (donor) {
                const totalContribution = currentYearGifts.filter(g => g.donorid === donorId).reduce((acc, gift) => acc + (gift.totalamount || 0), 0);
                contributorsList.push({ donor, totalContribution });
            }
        });
        const aggregateAndSort = (totals: Record<string, number>, type: "Recurring" | "One-Time"): TopDonorInfo[] => {
            return Object.entries(totals).map(([donorId, totalAmount]) => ({ donor: donorMap[donorId], totalAmount, type })).filter(item => item.donor).sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 20);
        };
        const topRecurringDonors = aggregateAndSort(currentYearMonthlyAmounts, "Recurring");
        const topNonRecurringDonors = aggregateAndSort(currentYearOnetimeTotals, "One-Time");

        // --- FINAL STATE UPDATE ---
        setData({ 
          isLoading: false, error: null, 
          metrics: {
            newDonorsLastMonth: newDonors.length, recurringDonorsLastMonth: oneMonthGifts.filter(g => g.isrecurring).map(g => g.donorid).filter((v, i, a) => v && a.indexOf(v) === i).length,
            medianDonation: median30, weightedMovingAvg: parseFloat(wmaDaily.toFixed(2)),
            recAboveMedian1mo: recAbove.length, activeDonorsLast3mo: activeDonorIds.length, recBelowMedian1mo: recBelow.length,
            nonRecAboveMedian1mo: nonRecAbove.length, nonRecBelowMedian1mo: nonRecBelow.length, recAboveWMA1mo: recAboveWMA.length,
            recBelowWMA1mo: recBelowWMA.length, nonRecAboveWMA1mo: nonRecAboveWMA.length, nonRecBelowWMA1mo: nonRecBelowWMA.length,
            recurringDonationRatio: recurringDonorRatioAllTime,
            churnedLargeDonors: churnedLargeList.length,
            monthlyDonorsWhoChurned: newChurnedDonorsList.length,
            totalValueCurrentMonth: totalValueCurrentMonth,
            uniqueDonorsCurrentMonth,
            averageDonationCurrentMonth,
            majorDonorsCurrentMonth,
            mediumDonorsCurrentMonth,
            normalDonorsCurrentMonth,
            totalGiftsCurrentMonth,
            retentionPercentageCurrentMonth,
            totalDonorPoolCount: donors.length,
          },
          newDonorsList: newDonors, recurringGiftsMonth: enrich(oneMonthGifts.filter(g => g.isrecurring)), rawDonationsList, medianIndex, wmaDetails,
          topRecurringDonors, topNonRecurringDonors,
          majorMonthly: majMonthly, mediumMonthly: medMonthly, normalMonthly: normMonthly,
          majorOnetime: majOnetime, mediumOnetime: medOnetime, normalOnetime: normOnetime,
          allTimeMajorMonthly: at_majMonthly, allTimeMediumMonthly: at_medMonthly, allTimeNormalMonthly: at_normMonthly,
          allTimeMajorOnetime: at_majOnetime, allTimeMediumOnetime: at_medOnetime, allTimeNormalOnetime: at_normOnetime,
          totalYTD: ytdTotals.totalOnetime + ytdTotals.totalMonthly,
          totalOnetimeYTD: ytdTotals.totalOnetime, totalMonthlyYTD: ytdTotals.totalMonthly,
          majorOnetimeYTD: { total: ytdTotals.majorOnetime.total, gifts: enrich(ytdTotals.majorOnetime.gifts) },
          mediumOnetimeYTD: { total: ytdTotals.mediumOnetime.total, gifts: enrich(ytdTotals.mediumOnetime.gifts) },
          normalOnetimeYTD: { total: ytdTotals.normalOnetime.total, gifts: enrich(ytdTotals.normalOnetime.gifts) },
          majorMonthlyYTD: { total: ytdTotals.majorMonthly.total, gifts: enrich(ytdTotals.majorMonthly.gifts) },
          mediumMonthlyYTD: { total: ytdTotals.mediumMonthly.total, gifts: enrich(ytdTotals.mediumMonthly.gifts) },
          normalMonthlyYTD: { total: ytdTotals.normalMonthly.total, gifts: enrich(ytdTotals.normalMonthly.gifts) },
          allGiftsYTD: enrich(currentYearGifts),
          onetimeGiftsYTD: enrich(currentYearGifts.filter(g => !g.isrecurring)),
          monthlyGiftsYTD: enrich(currentYearGifts.filter(g => g.isrecurring)),
          totalOnetimeAllTime: allTimeTotals.totalOnetime, totalMonthlyAllTime: allTimeTotals.totalMonthly,
          majorOnetimeAllTime: { total: allTimeTotals.majorOnetime.total, gifts: enrich(allTimeTotals.majorOnetime.gifts) },
          mediumOnetimeAllTime: { total: allTimeTotals.mediumOnetime.total, gifts: enrich(allTimeTotals.mediumOnetime.gifts) },
          normalOnetimeAllTime: { total: allTimeTotals.normalOnetime.total, gifts: enrich(allTimeTotals.normalOnetime.gifts) },
          majorMonthlyAllTime: { total: allTimeTotals.majorMonthly.total, gifts: enrich(allTimeTotals.majorMonthly.gifts) },
          mediumMonthlyAllTime: { total: allTimeTotals.mediumMonthly.total, gifts: enrich(allTimeTotals.mediumMonthly.gifts) },
          normalMonthlyAllTime: { total: allTimeTotals.normalMonthly.total, gifts: enrich(allTimeTotals.normalMonthly.gifts) },
          totalDonationsAllTime: allTimeTotals.totalOnetime + allTimeTotals.totalMonthly,
          churnedMonthlyMajor: majorChurnedList, churnedOnetimeMajor: churnedOnetimeList,
          retainedMajorMonthly: retainedList,
          monthlyMajorDLV: monthlyResult.finalDLV, onetimeMajorDLV: onetimeResult.finalDLV,
          monthlyDlvCohort: monthlyResult.cohortList, onetimeDlvCohort: onetimeResult.cohortList,
          monthlyDlvComponents: monthlyResult.components, onetimeDlvComponents: onetimeResult.components,
          majorContributorsList: contributorsList.sort((a, b) => b.totalContribution - a.totalContribution),
          churnedLargeDetails: churnedLargeList, lastGiftDates,
          churnedDonorsList: newChurnedDonorsList,
          giftsCurrentMonthList: enrich(giftsCurrentMonth),
          majorDonorsCurrentMonthList,
          mediumDonorsCurrentMonthList,
          normalDonorsCurrentMonthList,
          totalUniqueDonorsAllTime,
          totalGiftsAllTime: gifts.length,
          retainedDonorsList,
          churnedFromLastMonthList,
          lastMonthDonorPool,
          averageDonationChartData,
          uniqueDonorsCurrentMonthList,
           totalDonorPoolList: donors,
        });

      } catch (err) {
        setData(prev => ({ ...prev, isLoading: false, error: err instanceof Error ? err.message : 'An unknown error occurred' }));
      }
    };

    loadMetrics();
  }, []);

  return data as MetricsData;
};