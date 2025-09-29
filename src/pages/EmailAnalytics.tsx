import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faExclamationTriangle, 
  faRefresh,
  faChartLine,
  faDatabase,
  faCheckCircle,
  faTimesCircle,
  faEye,
  faMousePointer,
  faBolt,
  faUsers,
  faArrowTrendUp,
  faPercent
} from '@fortawesome/free-solid-svg-icons';
import { fetchEngagementRecords } from '../utils/supabaseClient';
import { getSMTPStatisticsEvents } from '../utils/brevoClient';
import StatCard from '../components/stats/StatCard';
import Modal from '../components/popup/modal';
import './styles/email-analytics.css';

// Helper function to format numbers
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Removed unused formatPercentage function

// Helper function to format dates
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

interface EmailAnalyticsData {
  totalEmails: number;
  totalDonors: number;
  engagementRecords: any[];
  emailEvents: any[];
  performanceMetrics: {
    deliveryRate: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
  };
  recentActivity: any[];
  topPerformers: any[];
}

const EmailAnalytics: React.FC = () => {
  const [data, setData] = useState<EmailAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);
  
  // Load and process engagement data
  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch engagement records from Supabase
      const response = await fetchEngagementRecords();
      if (response.error) {
        throw new Error(response.error);
      }
      
      const records = response.data || [];
      
      // Process engagement data to get email events from Brevo
      const emailEvents: any[] = [];
      const processedEmails = new Set();
      
      for (const record of records.slice(0, 50)) { // Limit to 50 for performance
        if (!processedEmails.has(record.email_id)) {
          try {
            const events = await getSMTPStatisticsEvents({
              messageId: record.email_id,
              limit: 100
            });
            
            if (events?.events) {
              emailEvents.push(...events.events.map((event: any) => ({
                ...event,
                engagementRecord: record
              })));
            }
            processedEmails.add(record.email_id);
          } catch (error) {
            // Skip failed requests
          }
        }
      }
      
      // Calculate performance metrics
      const totalSent = emailEvents.filter((e: any) => e.event === 'requests').length;
      const totalDelivered = emailEvents.filter((e: any) => e.event === 'delivered').length;
      const totalOpened = emailEvents.filter((e: any) => e.event === 'opened').length;
      const totalClicked = emailEvents.filter((e: any) => e.event === 'clicked').length;
      const totalBounced = emailEvents.filter((e: any) => e.event && (e.event.includes('Bounce') || e.event === 'blocked')).length;
      
      const performanceMetrics = {
        deliveryRate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
        openRate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
        clickRate: totalDelivered > 0 ? (totalClicked / totalDelivered) * 100 : 0,
        bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      };
      
      // Get recent activity (last 20 events)
      const recentActivity = emailEvents
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 20);
      
      // Get top performers (donors with most engagement)
      const donorEngagement = new Map();
      records.forEach((record: any) => {
        if (record.donor) {
          const key = record.donor.email;
          if (!donorEngagement.has(key)) {
            donorEngagement.set(key, {
              donor: record.donor,
              emailCount: 0,
              openCount: 0,
              clickCount: 0
            });
          }
          const stats = donorEngagement.get(key);
          stats.emailCount++;
          
          // Count opens and clicks from events
          const donorEvents = emailEvents.filter((e: any) => e.engagementRecord?.donorid === record.donorid);
          stats.openCount = donorEvents.filter((e: any) => e.event === 'opened').length;
          stats.clickCount = donorEvents.filter((e: any) => e.event === 'clicked').length;
        }
      });
      
      const topPerformers = Array.from(donorEngagement.values())
        .sort((a: any, b: any) => (b.openCount + b.clickCount) - (a.openCount + a.clickCount))
        .slice(0, 10);
      
      const analyticsData: EmailAnalyticsData = {
        totalEmails: records.length,
        totalDonors: new Set(records.filter((r: any) => r.donor).map((r: any) => r.donorid)).size,
        engagementRecords: records,
        emailEvents,
        performanceMetrics,
        recentActivity,
        topPerformers
      };
      
      setData(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    loadAnalyticsData();
  }, []);

  // Handle modal opening
  const openModal = (title: string, content: React.ReactNode) => {
    setModalContent({ title, content });
    setIsModalOpen(true);
  };

  // Handle modal closing
  const closeModal = () => {
    setIsModalOpen(false);
    setModalContent(null);
  };

  // Generate modals for detailed views
  const generateEngagementOverviewModal = () => (
    <div className="engagement-overview-modal">
      <div className="overview-summary">
        <h3>Email Engagement Overview</h3>
        <p>Complete breakdown of all email engagement data</p>
        <div className="summary-stats">
          <div className="summary-item">
            <span className="summary-label">Total Emails:</span>
            <span className="summary-value">{data?.totalEmails || 0}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Engaged Donors:</span>
            <span className="summary-value">{data?.totalDonors || 0}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Avg Open Rate:</span>
            <span className="summary-value">{data?.performanceMetrics.openRate.toFixed(1) || 0}%</span>
          </div>
        </div>
      </div>
      
      <div className="engagement-records">
        <h4>Recent Engagement Records</h4>
        <div className="records-list">
          {data?.engagementRecords.slice(0, 20).map((record: any) => (
            <div key={record.id} className="record-item">
              <div className="record-header">
                <span className="record-date">{formatDate(record.created_at)}</span>
                <span className="record-id">ID: {record.email_id.substring(0, 8)}...</span>
              </div>
              <div className="record-details">
                {record.donor && (
                  <div className="record-donor">
                    <strong>{record.donor.firstname} {record.donor.lastname}</strong>
                    <span className="donor-email">{record.donor.email}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const generateTopPerformersModal = () => (
    <div className="top-performers-modal">
      <div className="performers-header">
        <h3>Top Performing Donors</h3>
        <p>Donors with highest email engagement rates</p>
      </div>
      
      <div className="performers-list">
        {data?.topPerformers.map((performer: any, index: number) => (
          <div key={index} className="performer-item">
            <div className="performer-rank">#{index + 1}</div>
            <div className="performer-details">
              <div className="performer-name">
                {performer.donor.firstname} {performer.donor.lastname}
              </div>
              <div className="performer-email">{performer.donor.email}</div>
            </div>
            <div className="performer-stats">
              <div className="stat-item">
                <span className="stat-value">{performer.emailCount}</span>
                <span className="stat-label">Emails</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{performer.openCount}</span>
                <span className="stat-label">Opens</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{performer.clickCount}</span>
                <span className="stat-label">Clicks</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="email-analytics-container">
        <div className="email-analytics-header">
          <h1>Email Analytics Dashboard</h1>
          <p>Loading engagement insights...</p>
        </div>
        
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Processing engagement data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="email-analytics-container">
        <div className="email-analytics-header">
          <h1>Email Analytics Dashboard</h1>
          <p>Comprehensive email engagement insights</p>
        </div>
        
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          
          <div className="error-actions">
            <button className="retry-button" onClick={loadAnalyticsData}>
              <FontAwesomeIcon icon={faRefresh} />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }





  // Main component render
  return (
    <div className="email-analytics-container">
      {/* Header */}
      <div className="email-analytics-header">
        <div className="header-content">
          <h1>Email Analytics Dashboard</h1>
          <p>Comprehensive email engagement insights from your donor communications</p>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={loadAnalyticsData} disabled={isLoading}>
            <FontAwesomeIcon icon={faRefresh} className={isLoading ? 'spinning' : ''} />
            Refresh Data
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="overview-section">
        <h2>Overview</h2>
        <div className="overview-grid">
          <div className="overview-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faEnvelope} />
            </div>
            <div className="card-content">
              <div className="card-value">{formatNumber(data.totalEmails)}</div>
              <div className="card-label">Total Emails Sent</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faUsers} />
            </div>
            <div className="card-content">
              <div className="card-value">{formatNumber(data.totalDonors)}</div>
              <div className="card-label">Donors Reached</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faPercent} />
            </div>
            <div className="card-content">
              <div className="card-value">{data.performanceMetrics.openRate.toFixed(1)}%</div>
              <div className="card-label">Average Open Rate</div>
            </div>
          </div>
          
          <div className="overview-card">
            <div className="card-icon">
              <FontAwesomeIcon icon={faArrowTrendUp} />
            </div>
            <div className="card-content">
              <div className="card-value">{data.performanceMetrics.clickRate.toFixed(1)}%</div>
              <div className="card-label">Average Click Rate</div>
            </div>
          </div>
        </div>
      </div>


      {/* Performance Overview */}
      <div className="performance-overview">
        <h2>Performance Metrics</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faCheckCircle} className="performance-icon delivered" />
              <h3>Delivery Rate</h3>
            </div>
            <div className="performance-value">
              {data.performanceMetrics.deliveryRate.toFixed(1)}%
            </div>
            <div className="performance-details">
              Based on {data.emailEvents.length} tracked events
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faEye} className="performance-icon opened" />
              <h3>Open Rate</h3>
            </div>
            <div className="performance-value">
              {data.performanceMetrics.openRate.toFixed(1)}%
            </div>
            <div className="performance-details">
              From delivered emails to donors
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faMousePointer} className="performance-icon clicked" />
              <h3>Click Rate</h3>
            </div>
            <div className="performance-value">
              {data.performanceMetrics.clickRate.toFixed(1)}%
            </div>
            <div className="performance-details">
              Engagement beyond opens
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faTimesCircle} className="performance-icon bounced" />
              <h3>Bounce Rate</h3>
            </div>
            <div className="performance-value">
              {data.performanceMetrics.bounceRate.toFixed(1)}%
            </div>
            <div className="performance-details">
              Delivery issues tracked
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div className="activity-timeline">
        <h2>Recent Email Activity</h2>
        <div className="timeline-container">
          {data.recentActivity.map((activity: any, index: number) => (
            <div key={`${activity.messageId}-${index}`} className="timeline-item">
              <div className="timeline-marker">
                <FontAwesomeIcon icon={
                  activity.event === 'delivered' ? faCheckCircle :
                  activity.event === 'opened' ? faEye :
                  activity.event === 'clicked' ? faMousePointer :
                  activity.event === 'requests' ? faBolt :
                  faEnvelope
                } className={`timeline-icon ${activity.event}`} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-event">{activity.event}</span>
                  <span className="timeline-time">{formatDate(activity.date)}</span>
                </div>
                <div className="timeline-details">
                  <div className="timeline-subject">{activity.subject || 'No Subject'}</div>
                  <div className="timeline-recipient">To: {activity.to?.[0] || activity.email}</div>
                  {activity.engagementRecord?.donor && (
                    <div className="timeline-donor">
                      Donor: {activity.engagementRecord.donor.firstname} {activity.engagementRecord.donor.lastname}
                    </div>
                  )}
                  {activity.reason && <div className="timeline-reason">Reason: {activity.reason}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Performing Donors */}
      <div className="top-performers-section">
        <h2>Top Performing Donors</h2>
        <div className="performers-grid">
          {data.topPerformers.slice(0, 6).map((performer: any, index: number) => (
            <div key={index} className="performer-card">
              <div className="performer-rank">#{index + 1}</div>
              <div className="performer-info">
                <div className="performer-name">
                  {performer.donor.firstname} {performer.donor.lastname}
                </div>
                <div className="performer-email">{performer.donor.email}</div>
              </div>
              <div className="performer-metrics">
                <div className="metric">
                  <span className="metric-value">{performer.emailCount}</span>
                  <span className="metric-label">Emails</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{performer.openCount}</span>
                  <span className="metric-label">Opens</span>
                </div>
                <div className="metric">
                  <span className="metric-value">{performer.clickCount}</span>
                  <span className="metric-label">Clicks</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Email Insights */}
      <div className="metrics-section">
        <h2>Detailed Insights</h2>
        <div className="metrics-grid">
          <StatCard
            title="Total Engagement Records"
            value={formatNumber(data.totalEmails)}
            icon={faDatabase}
            variant="primary"
            subtitle="All emails tracked in system"
            onClick={() => openModal('Engagement Overview', generateEngagementOverviewModal())}
          />
          
          <StatCard
            title="Active Email Events"
            value={formatNumber(data.emailEvents.length)}
            icon={faChartLine}
            variant="info"
            subtitle="Events with detailed analytics"
            onClick={() => openModal('Email Events Overview', generateEngagementOverviewModal())}
          />
          
          <StatCard
            title="Top Performers"
            value={formatNumber(data.topPerformers.length)}
            icon={faUsers}
            variant="secondary"
            subtitle="Highly engaged donors"
            onClick={() => openModal('Top Performing Donors', generateTopPerformersModal())}
          />
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && modalContent && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={modalContent.title}
        >
          {modalContent.content}
        </Modal>
      )}
    </div>
  );
};

export default EmailAnalytics;
