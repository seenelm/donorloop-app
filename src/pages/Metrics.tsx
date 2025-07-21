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
} from '@fortawesome/free-solid-svg-icons';
import { fetchGifts, fetchDonors, type GiftData, type DonorData } from '../utils/supabaseClient';
import StatCard from '../components/stats/StatCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type GiftWithDonor = GiftData & { donor?: DonorData | null };

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

  const [newDonorsList, setNewDonorsList] = useState<DonorData[]>([]);
  const [recurringGiftsMonth, setRecurringGiftsMonth] = useState<GiftWithDonor[]>([]);
  const [rawDonationsList, setRawDonationsList] = useState<GiftWithDonor[]>([]);
  const [medianIndex, setMedianIndex] = useState<number | null>(null);

  const [counts3mo, setCounts3mo] = useState<Record<string, number>>({});
  const [totals3mo, setTotals3mo] = useState<Record<string, number>>({});
  const [activeDonorsList, setActiveDonorsList] = useState<DonorData[]>([]);
  const [wmaDetails, setWmaDetails] = useState< { monthLabel: string; total: number; weight: number }[]>([]);
  const [churnedLargeDetails, setChurnedLargeDetails] = useState<{ donor: DonorData; priorYearSum: number }[] >([]);
  const [showChurnedLarge, setShowChurnedLarge] = useState(false);
  const [showChurned, setShowChurned] = useState(false);
  const [churnedDonorsList, setChurnedDonorsList] = useState<DonorData[]>([]);
  const [countsOld3mo, setCountsOld3mo] = useState<Record<string, number>>({});
  const [totalsOld3mo, setTotalsOld3mo] = useState<Record<string, number>>({});
  const [lastGiftDates, setLastGiftDates] = useState<Record<string, Date>>({});



  const [showNew, setShowNew] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showRecurring, setShowRecurring] = useState(false);
  const [showActive, setShowActive] = useState(false);
  const [showWMA, setShowWMA] = useState(false);
  const [showRecAbove, setShowRecAbove] = useState(false);
  const [showRecBelow, setShowRecBelow] = useState(false);
  const [showNonRecAbove, setShowNonRecAbove] = useState(false);
  const [showNonRecBelow, setShowNonRecBelow] = useState(false);
  const [showWMARecAbove, setShowWMARecAbove] = useState(false);
  const [showWMARecBelow, setShowWMARecBelow] = useState(false);
  const [showWMANonRecAbove, setShowWMANonRecAbove] = useState(false);
  const [showWMANonRecBelow, setShowWMANonRecBelow] = useState(false);



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
            const { donor, ...rest } = g;
            return { ...rest, donor: donorMap[g.donorid] || null };
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
          .filter(g => g.giftdate && new Date(g.giftdate) >= oneMonthAgo && g.totalamount! > 0)
          .map(g => {
            const { donor, ...rest } = g;
            return { ...rest, donor: donorMap[g.donorid!] || null };
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

          const lastGiftDates: Record<string, Date> = {};

        pastGifts.forEach(g => {
          if (!g.donorid || !g.giftdate) return;
          if (churnedDonorIds.includes(g.donorid)) {
            const giftDate = new Date(g.giftdate);
            if (!lastGiftDates[g.donorid] || giftDate > lastGiftDates[g.donorid]) {
              lastGiftDates[g.donorid] = giftDate;
            }
          }
        });

        setLastGiftDates(lastGiftDates);


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

  const formatAmount = (amount?: number) =>
    amount !== undefined ? `$${amount.toFixed(2)}` : '';

  return (
    <div className="content-body metrics-container">
      <div className="manager-header">
        <h2>Metrics</h2>
        <p className="manager-description">Overview of donor categories and key counts.</p>
      </div>

      <div className="stat-cards-grid">
        <StatCard
          title="New Donors (Last 30 Days)"
          value={metrics.newDonorsLastMonth}
          icon={faUserPlus}
          variant="primary"
          onClick={() => setShowNew(p => !p)}
          subtitle="Click to view list"
        />
        <StatCard
          title="Recurring Donors (Last 30 Days)"
          value={metrics.recurringDonorsLastMonth}
          icon={faCalendarAlt}
          variant="success"
          onClick={() => setShowRecurring(p => !p)}
          subtitle="Click to view IDs"
        />
        <StatCard
          title="Median Donation (Last 30 Days)"
          value={metrics.medianDonation}
          icon={faChartLine}
          variant="warning"
          onClick={() => setShowStats(p => !p)}
          subtitle="Click to view details"
        />
        <StatCard
          title="30-Day WMA Donations"
          value={metrics.weightedMovingAvg}
          icon={faPercent}
          variant="dark"
          onClick={() => setShowWMA(p => !p)}
          subtitle="Click to view breakdown"
        />
        <StatCard
          title="> Median & Recurring (1mo)"
          value={metrics.recAboveMedian1mo}
          icon={faArrowUp}
          variant="success"
          onClick={() => setShowRecAbove(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="≤ Median & Recurring (1mo)"
          value={metrics.recBelowMedian1mo}
          icon={faArrowDown}
          variant="info"
          onClick={() => setShowRecBelow(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="> Median & Non-Recurring (1mo)"
          value={metrics.nonRecAboveMedian1mo}
          icon={faArrowUpRightDots}
          variant="warning"
          onClick={() => setShowNonRecAbove(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="≤ Median & Non-Recurring (1mo)"
          value={metrics.nonRecBelowMedian1mo}
          icon={faArrowDownShortWide}
          variant="secondary"
          onClick={() => setShowNonRecBelow(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="> WMA & Recurring (1mo)"
          value={metrics.recAboveWMA1mo}
          icon={faArrowTrendUp}
          variant="success"
          onClick={() => setShowWMARecAbove(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="≤ WMA & Recurring (1mo)"
          value={metrics.recBelowWMA1mo}
          icon={faArrowTrendDown}
          variant="info"
          onClick={() => setShowWMARecBelow(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="> WMA & Non-Recurring (1mo)"
          value={metrics.nonRecAboveWMA1mo}
          icon={faArrowUpRightDots}
          variant="warning"
          onClick={() => setShowWMANonRecAbove(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="≤ WMA & Non-Recurring (1mo)"
          value={metrics.nonRecBelowWMA1mo}
          icon={faArrowDownShortWide}
          variant="secondary"
          onClick={() => setShowWMANonRecBelow(p => !p)}
          subtitle="Click to view"
        />
        <StatCard
          title="Active Donors (Last 3 Months)"
          value={metrics.activeDonorsLast3mo}
          icon={faUserPlus}
          variant="info"
          onClick={() => setShowActive(prev => !prev)}
          subtitle="Click to view list"
        />
        <StatCard
          title="Recurring Value Ratio"
          value={metrics.recurringDonationRatio !== undefined ? `${metrics.recurringDonationRatio.toFixed(1)}%`: 'N/A'}
          subtitle="Recurring share of total donation value"
          icon={faInfoCircle}
          />
        <StatCard
          title="Churned Large Donors"
          value={metrics.churnedLargeDonors}
          icon={faUserSlash}
          variant="warning"
          subtitle="Click to view list"
          onClick={() => setShowChurnedLarge(p => !p)}
        />
        <StatCard
          title="Monthly Donors Who Churned"
          value={metrics.monthlyDonorsWhoChurned}
          icon={faUserSlash}
          variant="warning"
          onClick={() => setShowChurned(prev => !prev)}
          subtitle="Click to view list"
        />


      </div>


      {showNew && (
        <div className="top-list-card top-list-card-info">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faUserPlus} />
            </div>
            <h3 className="top-list-title">New Donors (Last 30 Days)</h3>
          </div>
          <div className="top-list-content">
            {newDonorsList.length === 0 ? (
              <div className="top-list-empty">No new donors in the last 30 days.</div>
            ) : (
              <ul className="top-list">
                {newDonorsList.map((d, i) => (
                  <li key={d.donorid} className="top-list-item">
                    <div className="top-list-rank">{i + 1}</div>
                    <div className="top-list-avatar">{donorInitials(d)}</div>
                    <div className="top-list-details">{donorFullName(d)}</div>
                    <div className="top-list-secondary">{formatDate(d.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showRecurring && (
        <div className="top-list-card top-list-card-success">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
            <h3 className="top-list-title">Recurring Donations (Last 30 Days)</h3>
          </div>
          <div className="top-list-content">
            {recurringGiftsMonth.length === 0 ? (
              <div className="top-list-empty">No recurring gifts in the last month.</div>
            ) : (
              <ul className="top-list">
                {recurringGiftsMonth.map((g, i) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{i + 1}</div>
                    <div className="top-list-avatar">{donorInitials(g.donor)}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {showStats && (
        <div className="top-list-card top-list-card-warning">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <h3 className="top-list-title">All Donations (Last 30 Days)</h3>
          </div>
          <div className="top-list-content">
            {medianIndex !== null && (
              <p style={{ margin: '0 0 1rem' }}>
                <strong>Median Position:</strong> Gift #{medianIndex + 1}
              </p>
            )}
            <p style={{ margin: '0 0 1rem' }}>
              <strong>Computed Median:</strong> {formatAmount(metrics.medianDonation)}
            </p>
            <ul className="top-list">
              {rawDonationsList.map((g, idx) => (
                <li key={g.giftid} className="top-list-item">
                  <div className="top-list-rank">{idx + 1}</div>
                  <div className="top-list-avatar">{donorInitials(g.donor)}</div>
                  <div className="top-list-details">
                    Gift ID {g.giftid}
                    <br />
                    {donorFullName(g.donor)}
                  </div>
                  <div className="top-list-secondary">
                    {formatAmount(g.totalamount)}
                    <br />
                    {formatDate(g.giftdate)}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showWMA && (
        <div className="top-list-card top-list-card-warning">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faChartLine} />
            </div>
            <h3 className="top-list-title">30‑Day Weighted Moving Average Breakdown</h3>
          </div>
          <div className="top-list-content">
            {wmaDetails.length === 0 ? (
              <div className="top-list-empty">No data available for WMA.</div>
            ) : (
              <ul className="top-list">
                {wmaDetails.map(({ monthLabel, total, weight }, i) => (
                  <li key={monthLabel} className="top-list-item">
                    <div className="top-list-rank">{i + 1}</div>
                    <div className="top-list-details">
                      {monthLabel}: {formatAmount(total)} × {weight}
                    </div>
                    <div className="top-list-secondary">
                      = <strong>{formatAmount(total * weight)}</strong>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p style={{ marginTop: '1em', fontWeight: 'bold' }}>
              Final WMA: {formatAmount(metrics.weightedMovingAvg)}
            </p>
          </div>
        </div>
      )}

      {showRecAbove && (
        <div className="top-list-card top-list-card-success">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowUp} />
            </div>
            <h3 className="top-list-title">&gt; Median & Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => g.isrecurring && g.totalamount! > metrics.medianDonation)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}

      {showRecBelow && (
        <div className="top-list-card top-list-card-warning">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowDown} />
            </div>
            <h3 className="top-list-title">≤ Median & Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => g.isrecurring && g.totalamount! <= metrics.medianDonation)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}

      {showNonRecAbove && (
        <div className="top-list-card top-list-card-info">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowUpRightDots} />
            </div>
            <h3 className="top-list-title">&gt; Median & Non‑Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => !g.isrecurring && g.totalamount! > metrics.medianDonation)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}

      {showNonRecBelow && (
        <div className="top-list-card top-list-card-danger">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowDownShortWide} />
            </div>
            <h3 className="top-list-title">≤ Median & Non‑Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => !g.isrecurring && g.totalamount! <= metrics.medianDonation)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}

      {showWMARecAbove && (
        <div className="top-list-card top-list-card-success">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowTrendUp} />
            </div>
            <h3 className="top-list-title">&gt; WMA & Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => g.isrecurring && g.totalamount! > metrics.weightedMovingAvg)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}
      {showWMARecBelow && (
        <div className="top-list-card top-list-card-info">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowTrendDown} />
            </div>
            <h3 className="top-list-title">≤ WMA & Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => g.isrecurring && g.totalamount! <= metrics.weightedMovingAvg)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}
      {showWMANonRecAbove && (
        <div className="top-list-card top-list-card-warning">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowUpRightDots} />
            </div>
            <h3 className="top-list-title">&gt; WMA & Non-Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => !g.isrecurring && g.totalamount! > metrics.weightedMovingAvg)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}

      {showWMANonRecBelow && (
        <div className="top-list-card top-list-card-secondary">
          <div className="top-list-header">
            <div className="top-list-icon">
              <FontAwesomeIcon icon={faArrowDownShortWide} />
            </div>
            <h3 className="top-list-title">≤ WMA & Non-Recurring (1mo)</h3>
          </div>
          <div className="top-list-content">
            <ol className="top-list">
              {rawDonationsList
                .filter(g => !g.isrecurring && g.totalamount! <= metrics.weightedMovingAvg)
                .map((g, idx) => (
                  <li key={g.giftid} className="top-list-item">
                    <div className="top-list-rank">{idx + 1}</div>
                    <div className="top-list-details">{donorFullName(g.donor)}</div>
                    <div className="top-list-secondary">
                      {formatAmount(g.totalamount)} on {formatDate(g.giftdate)}
                    </div>
                  </li>
                ))}
            </ol>
          </div>
        </div>
      )}


          {showActive && (
      <div className="top-list-card top-list-card-info">
        <div className="top-list-header">
          <div className="top-list-icon">
            <FontAwesomeIcon icon={faUserPlus} />
          </div>
          <h3 className="top-list-title">Active Donors (Last 3 Months)</h3>
        </div>
        <div className="top-list-content">
          {activeDonorsList.length === 0 ? (
            <div className="top-list-empty">
              No donors gave more than once in the last 3 months.
            </div>
          ) : (
            <ul className="top-list">
            {activeDonorsList.map((d, i) => (
              <li key={d.donorid} className="top-list-item">
                <div className="top-list-rank">{i + 1}</div>
                <div className="top-list-avatar">{donorInitials(d)}</div>
                <div className="top-list-details">{donorFullName(d)}</div>
                <div className="top-list-secondary">
                  {counts3mo[d.donorid] || 0} gifts · {formatAmount(totals3mo[d.donorid])}
                </div>
              </li>
            ))}
            </ul>
          )}
        </div>
      </div>
    )}

            {showChurnedLarge && (
          <div className="top-list-card top-list-card-danger">
            <div className="top-list-header">
              <div className="top-list-icon">
                <FontAwesomeIcon icon={faUserSlash} />
              </div>
              <h3 className="top-list-title">
                Large Donors (Year – 1) but Churned
              </h3>
            </div>
            <div className="top-list-content">
              {churnedLargeDetails.length === 0 ? (
                <div className="top-list-empty">
                  No large donors have churned.
                </div>
              ) : (
                <ul className="top-list">
                  {churnedLargeDetails.map((item, i) => (
                    <li key={item.donor.donorid} className="top-list-item">
                      <div className="top-list-rank">{i + 1}</div>
                      <div className="top-list-avatar">
                        {donorInitials(item.donor)}
                      </div>
                      <div className="top-list-details">
                        {donorFullName(item.donor)}
                      </div>
                      <div className="top-list-secondary">
                        Prior‑year total: {formatAmount(item.priorYearSum)}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
    )}

              {showChurned && (
      <div className="top-list-card top-list-card-warning">
        <div className="top-list-header">
          <div className="top-list-icon">
            <FontAwesomeIcon icon={faUserSlash} />
          </div>
          <h3 className="top-list-title">Monthly Donors Who Churned (Over a Year Ago || 3 Months Span)</h3>
        </div>
        <div className="top-list-content">
          {churnedDonorsList.length === 0 ? (
            <div className="top-list-empty">No churned donors found.</div>
          ) : (
            <ul className="top-list">
              {churnedDonorsList.map((d, i) => {
                const lastDate = lastGiftDates[d.donorid];
                return (
                  <li key={d.donorid} className="top-list-item">
                    <div className="top-list-rank">{i + 1}</div>
                    <div className="top-list-avatar">{donorInitials(d)}</div>
                    <div className="top-list-details">{donorFullName(d)}</div>
                    <div className="top-list-secondary">
                      {countsOld3mo[d.donorid] || 0} gifts · {formatAmount(totalsOld3mo[d.donorid])}
                      {lastDate && (
                        <span style={{ marginLeft: 10, fontStyle: "italic", color: "#555" }}>
                          Last Gift: {new Date(lastDate.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    )}


    </div>
  );
};

export default Metrics;