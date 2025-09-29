import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, 
  faExclamationTriangle, 
  faRefresh,
  faSearch,
  faCog,
  faClock,
  faChartLine,
  faDatabase,
  faCheckCircle,
  faTimesCircle,
  faEye,
  faMousePointer,
  faBolt
} from '@fortawesome/free-solid-svg-icons';
import { useEmailAnalytics } from '../components/hooks/useEmailAnalytics';
import { testBrevoConnection } from '../utils/brevoClient';
import { fetchEngagementRecords } from '../utils/supabaseClient';
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

const EmailAnalytics: React.FC = () => {
  const { data, isLoading, error, refreshData, isConfigured, getEmailDetails } = useEmailAnalytics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{
    title: string;
    content: React.ReactNode;
  } | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionTestResult, setConnectionTestResult] = useState<string | null>(null);
  
  // Email ID Selector state
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [selectedEmailDetails, setSelectedEmailDetails] = useState<any>(null);
  
  // Engagement records state
  const [engagementRecords, setEngagementRecords] = useState<any[]>([]);
  const [engagementLoading, setEngagementLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  
  // Removed unused state variables
  

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

  // Load engagement records from Supabase
  const loadEngagementRecords = async () => {
    setEngagementLoading(true);
    try {
      const response = await fetchEngagementRecords();
      if (response.data) {
        setEngagementRecords(response.data);
      } else {
        setEngagementRecords([]);
      }
    } catch (error) {
      setEngagementRecords([]);
    } finally {
      setEngagementLoading(false);
    }
  };

  // Load engagement records when component mounts
  useEffect(() => {
    loadEngagementRecords();
  }, []);

  // Handle Email ID Analytics click
  const handleEmailIdAnalytics = async () => {
    setLoadingDetails(true);
    setSelectedEmailId(null);
    setSelectedEmailDetails(null);
    setLoadingDetails(false);
    
    // Open modal with the content
    const modalContent = generateEmailIdSelectorModal();
    openModal('Email ID Analytics', modalContent);
  };

  // Function is ready

  // Removed unused functions

  // Test API connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionTestResult(null);
    
    const result = await testBrevoConnection();
    
    if (result.success) {
      setConnectionTestResult('✅ Connection successful! Your API key is working.');
    } else {
      setConnectionTestResult(`❌ Connection failed: ${result.error}`);
    }
    
    setTestingConnection(false);
  };

  // Configuration check
  if (!isConfigured) {
    return (
      <div className="email-analytics-container">
        <div className="email-analytics-header">
          <h1>Email Analytics</h1>
          <p>Comprehensive email marketing insights powered by Brevo</p>
        </div>
        
        <div className="configuration-error">
          <FontAwesomeIcon icon={faCog} className="config-icon" />
          <h2>Configuration Required</h2>
          <p>To use Email Analytics, please configure your Brevo API credentials:</p>
          <ul>
            <li><code>VITE_BREVO_API_KEY</code> - Your Brevo API key</li>
            <li><code>VITE_SENDER_ADDRESS</code> - Your sender email address</li>
            <li><code>VITE_EMAIL_SENDER_NAME</code> - Your sender name</li>
          </ul>
          <p>Add these to your environment variables and restart the application.</p>
        </div>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="email-analytics-container">
        <div className="email-analytics-header">
          <h1>Email Analytics</h1>
          <p>Loading email marketing insights...</p>
        </div>
        
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Fetching data from Brevo...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="email-analytics-container">
        <div className="email-analytics-header">
          <h1>Email Analytics</h1>
          <p>Email marketing insights powered by Brevo</p>
        </div>
        
        <div className="error-state">
          <FontAwesomeIcon icon={faExclamationTriangle} className="error-icon" />
          <h2>Error Loading Data</h2>
          <p>{error}</p>
          
          <div className="error-actions">
            <button className="retry-button" onClick={refreshData}>
              <FontAwesomeIcon icon={faRefresh} />
              Retry
            </button>
            
            <button 
              className="test-connection-button" 
              onClick={handleTestConnection}
              disabled={testingConnection}
            >
              <FontAwesomeIcon icon={faCog} className={testingConnection ? 'spinning' : ''} />
              {testingConnection ? 'Testing...' : 'Test API Connection'}
            </button>
          </div>
          
          {connectionTestResult && (
            <div className="connection-test-result">
              <p>{connectionTestResult}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  // Removed unused modal generators

  const generateIndividualEmailsModal = () => (
    <div className="individual-emails-modal">
      {data.individualEmails.length === 0 ? (
        <p>No individual emails found.</p>
      ) : (
        <div className="individual-emails">
          <div className="emails-summary">
            <h3>Individual Email Events Overview</h3>
            <div className="summary-stats">
              <div className="summary-item">
                <span className="summary-label">Total Events:</span>
                <span className="summary-value">{formatNumber(data.totalIndividualEmails)}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Unique Messages:</span>
                <span className="summary-value">
                  {formatNumber(new Set(data.individualEmails.map(e => e.messageId)).size)}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Event Types:</span>
                <span className="summary-value">
                  {new Set(data.individualEmails.map(e => e.event)).size} types
                </span>
              </div>
            </div>
          </div>
          
          <div className="emails-detail">
            <h4>All Email Events ({data.individualEmails.length} total)</h4>
            <div className="emails-list">
              {data.individualEmails.map((email, index) => (
                <div key={`${email.messageId}-${index}`} className="email-event-item">
                  <div className="email-header">
                    <div className="email-subject">
                      <h5>{email.subject}</h5>
                      <span className="email-date">{formatDate(email.date)}</span>
                    </div>
                    <div className="email-status">
                      <span className={`status-badge ${email.event}`}>{email.event}</span>
                    </div>
                  </div>
                  
                  <div className="email-details">
                    <div className="email-info">
                      <div className="info-item">
                        <span className="info-label">From:</span>
                        <span className="info-value">{email.from}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">To:</span>
                        <span className="info-value">{email.to.join(', ')}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">Message ID:</span>
                        <span className="info-value message-id">{email.messageId}</span>
                      </div>
                      {email.templateId && (
                        <div className="info-item">
                          <span className="info-label">Template ID:</span>
                          <span className="info-value">{email.templateId}</span>
                        </div>
                      )}
                      {email.reason && (
                        <div className="info-item">
                          <span className="info-label">Reason:</span>
                          <span className="info-value reason">{email.reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const generateLastEmailModal = (email: any) => (
    <div className="last-email-modal">
      <div className="email-header">
        <h3>Last Sent Email Details</h3>
        <div className="email-meta">
          <div className="meta-item">
            <strong>Date:</strong> {formatDate(email.date)} at {new Date(email.date).toLocaleTimeString()}
          </div>
          <div className="meta-item">
            <strong>Message ID:</strong> {email.messageId}
          </div>
        </div>
      </div>

      <div className="email-details">
        <div className="detail-section">
          <h4>Email Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <span className="detail-label">Subject:</span>
              <span className="detail-value">{email.subject || 'No subject'}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">From:</span>
              <span className="detail-value">{email.from}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">To:</span>
              <span className="detail-value">{email.to.join(', ')}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Type:</span>
              <span className="detail-value">{email.type}</span>
            </div>
            <div className="detail-item">
              <span className="detail-label">Status:</span>
              <span className={`status-badge ${email.status.toLowerCase()}`}>
                {email.status}
              </span>
            </div>
            {email.templateId && (
              <div className="detail-item">
                <span className="detail-label">Template ID:</span>
                <span className="detail-value">{email.templateId}</span>
              </div>
            )}
            {email.campaignName && (
              <div className="detail-item">
                <span className="detail-label">Campaign:</span>
                <span className="detail-value">{email.campaignName}</span>
              </div>
            )}
          </div>
        </div>

        {email.reason && (
          <div className="detail-section">
            <h4>Additional Information</h4>
            <div className="detail-item">
              <span className="detail-label">Reason:</span>
              <span className="detail-value">{email.reason}</span>
            </div>
          </div>
        )}

        <div className="detail-section">
          <h4>Quick Actions</h4>
          <div className="action-buttons">
            <button 
              className="action-btn primary"
              onClick={() => {
                closeModal();
                setTimeout(() => {
                  setSelectedEmailId(email.messageId);
                  handleEmailIdAnalytics();
                }, 100);
              }}
            >
              <FontAwesomeIcon icon={faSearch} />
              Analyze This Email
            </button>
            <button 
              className="action-btn info"
              onClick={() => {
                closeModal();
                setTimeout(() => {
                  openModal('Email Deep Dive Analysis', generateEmailDeepDiveModal());
                }, 100);
              }}
            >
              <FontAwesomeIcon icon={faChartLine} />
              Deep Dive Analysis
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const generateEngagementRecordsModal = () => (
    <div className="engagement-records-modal">
      <div className="engagement-header">
        <h3>Engagement Table Records</h3>
        <p>Email records stored in Supabase engagement table</p>
        <div className="engagement-stats">
          <span className="stat-item">Total Records: {engagementRecords.length}</span>
          <span className="stat-item">
            Linked to Donors: {engagementRecords.filter(r => r.donor).length}
          </span>
          <span className="stat-item">
            Unlinked: {engagementRecords.filter(r => !r.donor).length}
          </span>
        </div>
      </div>
      
      <div className="engagement-content">
        {engagementRecords.length === 0 ? (
          <div className="no-engagement-data">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
            <h4>No Engagement Records Found</h4>
            <p>No email engagement records found in the Supabase database.</p>
            <p>Records will appear here once emails are tracked in the engagement table.</p>
            <button 
              className="refresh-btn"
              onClick={loadEngagementRecords}
              disabled={engagementLoading}
            >
              <FontAwesomeIcon icon={faRefresh} className={engagementLoading ? 'spinning' : ''} />
              {engagementLoading ? 'Loading...' : 'Refresh Records'}
            </button>
          </div>
        ) : (
          <div className="engagement-table-container">
            <div className="table-actions">
              <button 
                className="refresh-btn"
                onClick={loadEngagementRecords}
                disabled={engagementLoading}
              >
                <FontAwesomeIcon icon={faRefresh} className={engagementLoading ? 'spinning' : ''} />
                {engagementLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
            
            <table className="engagement-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Created At</th>
                  <th>Email ID (Brevo Message ID)</th>
                  <th>Donor</th>
                  <th>Donor Email</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {engagementRecords.slice(0, 100).map((record) => (
                  <tr key={record.id}>
                    <td className="record-id">{record.id}</td>
                    <td className="record-date">
                      {new Date(record.created_at).toLocaleDateString()} {' '}
                      {new Date(record.created_at).toLocaleTimeString()}
                    </td>
                    <td className="record-email-id">
                      <span className="email-id-short" title={record.email_id}>
                        {record.email_id.length > 30 ? 
                          `${record.email_id.substring(0, 30)}...` : 
                          record.email_id
                        }
                      </span>
                    </td>
                    <td className="record-donor-name">
                      {record.donor ? 
                        `${record.donor.firstname} ${record.donor.lastname}` : 
                        'N/A'
                      }
                    </td>
                    <td className="record-donor-email">
                      {record.donor?.email || 'N/A'}
                    </td>
                    <td className="record-status">
                      <span className={`status-badge ${record.donor ? 'linked' : 'unlinked'}`}>
                        <FontAwesomeIcon icon={record.donor ? faEnvelope : faExclamationTriangle} />
                        {record.donor ? 'Linked' : 'Unlinked'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {engagementRecords.length > 100 && (
              <p className="table-note">
                Showing first 100 records of {engagementRecords.length} total
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const generateEmailDeepDiveModal = () => {
    // Get unique messages with maximum information
    const uniqueMessages = new Map();
    
    data.individualEmails.forEach(email => {
      if (!uniqueMessages.has(email.messageId)) {
        uniqueMessages.set(email.messageId, {
          messageId: email.messageId,
          subject: email.subject,
          from: email.from,
          events: [],
          recipients: new Set(),
          templateId: email.templateId
        });
      }
      
      const message = uniqueMessages.get(email.messageId);
      message.events.push(email);
      message.recipients.add(email.to[0]);
    });
    
    const messages = Array.from(uniqueMessages.values()).slice(0, 10); // Show top 10 messages
    
    return (
      <div className="email-deep-dive-modal">
        <div className="deep-dive-summary">
          <h3>Email Deep Dive Analysis</h3>
          <p>Maximum information available for each email message</p>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="summary-label">Unique Messages:</span>
              <span className="summary-value">{uniqueMessages.size}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Total Events:</span>
              <span className="summary-value">{data.totalIndividualEmails}</span>
            </div>
          </div>
        </div>
        
        <div className="deep-dive-messages">
          <h4>Detailed Message Analysis (Top 10)</h4>
          {messages.map((message, index) => {
            const events = message.events;
            const recipients = Array.from(message.recipients) as string[];
            const deliveredEvents = events.filter((e: any) => e.event === 'delivered');
            const openedEvents = events.filter((e: any) => e.event === 'opened');
            const clickedEvents = events.filter((e: any) => e.event === 'clicked');
            const bouncedEvents = events.filter((e: any) => e.event.includes('Bounce'));
            
            return (
              <div key={message.messageId} className="deep-dive-message">
                <div className="message-header">
                  <div className="message-title">
                    <h5>Message #{index + 1}</h5>
                    <span className="message-subject">{message.subject}</span>
                  </div>
                  <div className="message-id">
                    <span className="id-label">Message ID:</span>
                    <span className="id-value">{message.messageId}</span>
                  </div>
                </div>
                
                <div className="message-overview">
                  <div className="overview-grid">
                    <div className="overview-item">
                      <span className="overview-label">From:</span>
                      <span className="overview-value">{message.from}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Recipients:</span>
                      <span className="overview-value">{recipients.length}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Total Events:</span>
                      <span className="overview-value">{events.length}</span>
                    </div>
                    {message.templateId && (
                      <div className="overview-item">
                        <span className="overview-label">Template ID:</span>
                        <span className="overview-value">{message.templateId}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="message-metrics">
                  <h6>Performance Metrics</h6>
                  <div className="metrics-grid-small">
                    <div className="metric-small">
                      <span className="metric-label">Delivered</span>
                      <span className="metric-value">{deliveredEvents.length}</span>
                      <span className="metric-rate">
                        {recipients.length > 0 ? ((deliveredEvents.length / recipients.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="metric-small">
                      <span className="metric-label">Opened</span>
                      <span className="metric-value">{openedEvents.length}</span>
                      <span className="metric-rate">
                        {deliveredEvents.length > 0 ? ((openedEvents.length / deliveredEvents.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="metric-small">
                      <span className="metric-label">Clicked</span>
                      <span className="metric-value">{clickedEvents.length}</span>
                      <span className="metric-rate">
                        {deliveredEvents.length > 0 ? ((clickedEvents.length / deliveredEvents.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                    <div className="metric-small">
                      <span className="metric-label">Bounced</span>
                      <span className="metric-value">{bouncedEvents.length}</span>
                      <span className="metric-rate">
                        {recipients.length > 0 ? ((bouncedEvents.length / recipients.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="message-timeline">
                  <h6>Event Timeline</h6>
                  <div className="timeline-events">
                    {events.slice(0, 5).map((event: any, eventIndex: number) => (
                      <div key={eventIndex} className="timeline-event">
                        <div className="timeline-time">{formatDate(event.date)}</div>
                        <div className="timeline-content">
                          <span className={`timeline-badge ${event.event}`}>{event.event}</span>
                          <span className="timeline-recipient">{event.to[0]}</span>
                          {event.reason && <span className="timeline-reason">{event.reason}</span>}
                        </div>
                      </div>
                    ))}
                    {events.length > 5 && (
                      <div className="timeline-more">
                        +{events.length - 5} more events
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="message-recipients">
                  <h6>Recipients ({recipients.length})</h6>
                  <div className="recipients-list">
                    {recipients.slice(0, 3).map((recipient: string, recipientIndex: number) => (
                      <span key={recipientIndex} className="recipient-email">{recipient}</span>
                    ))}
                    {recipients.length > 3 && (
                      <span className="recipients-more">+{recipients.length - 3} more</span>
                    )}
                  </div>
                </div>
                
                <div className="message-technical">
                  <h6>Technical Details</h6>
                  <div className="technical-grid">
                    <div className="technical-item">
                      <span className="technical-label">Event Types:</span>
                      <span className="technical-value">
                        {[...new Set(events.map((e: any) => e.event))].join(', ')}
                      </span>
                    </div>
                    <div className="technical-item">
                      <span className="technical-label">IP Addresses:</span>
                      <span className="technical-value">
                        {[...new Set(events.map((e: any) => e.from))].slice(0, 2).join(', ')}
                      </span>
                    </div>
                    <div className="technical-item">
                      <span className="technical-label">First Event:</span>
                      <span className="technical-value">{formatDate(events[0]?.date)}</span>
                    </div>
                    <div className="technical-item">
                      <span className="technical-label">Last Event:</span>
                      <span className="technical-value">{formatDate(events[events.length - 1]?.date)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="deep-dive-footer">
          <p><strong>Maximum Information Available:</strong></p>
          <ul>
            <li>✅ Complete event timeline for each message</li>
            <li>✅ Individual recipient tracking and status</li>
            <li>✅ Delivery, open, click, and bounce metrics</li>
            <li>✅ Technical details (IPs, timestamps, message IDs)</li>
            <li>✅ Template and campaign associations</li>
            <li>✅ Performance rate calculations</li>
            <li>✅ Event-level granularity (requests → delivered → opened → clicked)</li>
          </ul>
        </div>
      </div>
    );
  };

  const generateEmailIdSelectorModal = () => {
    
    // Check if we have individual emails data
    if (!data.individualEmails || data.individualEmails.length === 0) {
      return (
        <div className="email-id-selector-modal">
          <div className="email-selector-header">
            <h3>Email ID Analytics</h3>
            <p>No individual emails found in your account</p>
          </div>
          <div className="no-emails-message">
            <FontAwesomeIcon icon={faExclamationTriangle} size="3x" />
            <h4>No Email Data Available</h4>
            <p>We couldn't find any individual email events in your Brevo account.</p>
            <p>This could mean:</p>
            <ul>
              <li>No emails have been sent through Brevo yet</li>
              <li>All emails were sent more than 30 days ago</li>
              <li>The SMTP events endpoint returned no data</li>
            </ul>
            <p><strong>Try:</strong> Sending a test email through Brevo and refreshing the data.</p>
          </div>
        </div>
      );
    }

    // Get unique message IDs with their basic info
    const uniqueEmails = new Map();
    
    data.individualEmails.forEach((email: any) => {
      if (!uniqueEmails.has(email.messageId)) {
        uniqueEmails.set(email.messageId, {
          messageId: email.messageId,
          subject: email.subject,
          from: email.from,
          date: email.date,
          recipients: new Set([email.to[0]]),
          events: [email]
        });
      } else {
        const existing = uniqueEmails.get(email.messageId);
        existing.recipients.add(email.to[0]);
        existing.events.push(email);
      }
    });

    const emails = Array.from(uniqueEmails.values()).sort((a: any, b: any) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const handleEmailSelect = async (messageId: string) => {
      setSelectedEmailId(messageId);
      setLoadingDetails(true);
      setSelectedEmailDetails(null);
      
      try {
        const details = await getEmailDetails(messageId);
        setSelectedEmailDetails(details);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load email details';
        setSelectedEmailDetails({ 
          error: `Failed to load email details: ${errorMessage}`,
          messageId: messageId,
          debugInfo: {
            originalError: error,
            timestamp: new Date().toISOString()
          }
        });
      } finally {
        setLoadingDetails(false);
      }
    };

    return (
      <div className="email-id-selector-modal">
        <div className="email-selector-header">
          <h3>Email ID Analytics</h3>
          <p>Select a specific email to view its complete analytics</p>
        </div>

        <div className="email-selector-content">
          {/* Email List */}
          <div className="email-list-section">
            <h4>Available Emails ({emails.length})</h4>
            <div className="email-list">
              {emails.slice(0, 20).map((email: any, index: number) => (
                <div 
                  key={email.messageId} 
                  className={`email-list-item ${selectedEmailId === email.messageId ? 'selected' : ''}`}
                  onClick={() => {
                    handleEmailSelect(email.messageId);
                  }}
                >
                  <div className="email-list-header">
                    <div className="email-number">#{index + 1}</div>
                    <div className="email-info">
                      <div className="email-subject">{email.subject}</div>
                      <div className="email-meta">
                        <span className="email-from">From: {email.from}</span>
                        <span className="email-date">{formatDate(email.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="email-stats">
                    <span className="stat-item">
                      <strong>{Array.from(email.recipients).length}</strong> recipients
                    </span>
                    <span className="stat-item">
                      <strong>{email.events.length}</strong> events
                    </span>
                  </div>
                  <div className="email-id">
                    ID: {email.messageId.substring(0, 20)}...
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Email Details */}
          <div className="email-details-section">
            {!selectedEmailId ? (
              <div className="no-selection">
                <FontAwesomeIcon icon={faSearch} size="3x" />
                <h4>Select an Email</h4>
                <p>Choose an email from the list to view its detailed analytics</p>
              </div>
            ) : loadingDetails ? (
              <div className="loading-details">
                <FontAwesomeIcon icon={faRefresh} spin size="2x" />
                <h4>Loading Email Analytics...</h4>
                <p>Fetching detailed information for selected email</p>
              </div>
            ) : selectedEmailDetails?.error ? (
              <div className="error-details">
                <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                <h4>Error Loading Details</h4>
                <p>{selectedEmailDetails.error}</p>
                {selectedEmailDetails.messageId && (
                  <div className="error-debug-info">
                    <p><strong>Message ID:</strong> {selectedEmailDetails.messageId}</p>
                    <p><strong>Possible causes:</strong></p>
                    <ul>
                      <li>Message ID not found in Brevo's SMTP events</li>
                      <li>Email events may be older than Brevo's retention period</li>
                      <li>API rate limiting or temporary connection issue</li>
                      <li>Message ID format may be incorrect</li>
                    </ul>
                    <p><strong>Try:</strong> Selecting a different email or refreshing the page</p>
                  </div>
                )}
              </div>
            ) : selectedEmailDetails ? (
              <div className="email-analytics-details">
                <div className="details-header">
                  <h4>Email Analytics</h4>
                  <div className="email-id-display">
                    <strong>Message ID:</strong> {selectedEmailId}
                  </div>
                </div>

                {selectedEmailDetails.messageDetails ? (
                  <div className="analytics-grid">
                    <div className="analytics-section">
                      <h5>Basic Information</h5>
                      <div className="info-grid">
                        <div className="info-item">
                          <span className="label">Subject:</span>
                          <span className="value">{selectedEmailDetails.messageDetails.subject || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">From:</span>
                          <span className="value">{selectedEmailDetails.messageDetails.from || 'N/A'}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Recipients:</span>
                          <span className="value">{selectedEmailDetails.messageDetails.totalRecipients || 0}</span>
                        </div>
                        <div className="info-item">
                          <span className="label">Template ID:</span>
                          <span className="value">{selectedEmailDetails.messageDetails.templateId || 'N/A'}</span>
                        </div>
                      </div>
                    </div>

                  <div className="analytics-section">
                    <h5>Performance Metrics</h5>
                    <div className="metrics-grid">
                      <div className="metric-card">
                        <div className="metric-value">{selectedEmailDetails.messageDetails.deliveredCount}</div>
                        <div className="metric-label">Delivered</div>
                        <div className="metric-rate">{selectedEmailDetails.messageDetails.deliveryRate.toFixed(1)}%</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value">{selectedEmailDetails.messageDetails.openedCount}</div>
                        <div className="metric-label">Opened</div>
                        <div className="metric-rate">{selectedEmailDetails.messageDetails.openRate.toFixed(1)}%</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value">{selectedEmailDetails.messageDetails.clickedCount}</div>
                        <div className="metric-label">Clicked</div>
                        <div className="metric-rate">{selectedEmailDetails.messageDetails.clickRate.toFixed(1)}%</div>
                      </div>
                      <div className="metric-card">
                        <div className="metric-value">{selectedEmailDetails.messageDetails.bouncedCount}</div>
                        <div className="metric-label">Bounced</div>
                        <div className="metric-rate">{selectedEmailDetails.messageDetails.bounceRate.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>

                  <div className="analytics-section">
                    <h5>Event Timeline</h5>
                    <div className="timeline-container">
                      {selectedEmailDetails.messageDetails.timeline.slice(0, 10).map((event: any, index: number) => (
                        <div key={index} className="timeline-item">
                          <div className="timeline-time">{formatDate(event.timestamp)}</div>
                          <div className="timeline-event">
                            <span className={`event-badge ${event.event}`}>{event.event}</span>
                            <span className="event-recipient">{event.recipient}</span>
                          </div>
                          <div className="timeline-details">{event.details}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="analytics-section">
                    <h5>Recipients</h5>
                    <div className="recipients-container">
                      {selectedEmailDetails.messageDetails.recipients.slice(0, 10).map((recipient: string, index: number) => (
                        <div key={index} className="recipient-item">
                          <FontAwesomeIcon icon={faEnvelope} />
                          <span>{recipient}</span>
                        </div>
                      ))}
                      {selectedEmailDetails.messageDetails.recipients.length > 10 && (
                        <div className="recipients-more">
                          +{selectedEmailDetails.messageDetails.recipients.length - 10} more recipients
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                ) : (
                  <div className="no-message-details">
                    <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
                    <h4>No Detailed Data Available</h4>
                    <p>The email details were fetched but contain no message information.</p>
                    <div className="raw-data-display">
                      <h5>Raw Response:</h5>
                      <pre>{JSON.stringify(selectedEmailDetails, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // Removed unused modal generators

  return (
    <div className="email-analytics-container">
      {/* Header */}
      <div className="email-analytics-header">
        <div className="header-content">
          <h1>Email Analytics</h1>
          <p>Comprehensive email marketing insights powered by Brevo</p>
        </div>
        <div className="header-actions">
          <button className="refresh-button" onClick={refreshData} disabled={isLoading}>
            <FontAwesomeIcon icon={faRefresh} className={isLoading ? 'spinning' : ''} />
            Refresh Data
          </button>
          
          <button 
            className="test-connection-button" 
            onClick={handleTestConnection}
            disabled={testingConnection}
          >
            <FontAwesomeIcon icon={faCog} className={testingConnection ? 'spinning' : ''} />
            {testingConnection ? 'Testing...' : 'Test API'}
          </button>
        </div>
      </div>

      {/* Connection Test Result */}
      {connectionTestResult && (
        <div className="connection-test-result">
          <p>{connectionTestResult}</p>
        </div>
      )}

      {/* Account Info Banner */}
      {data.accountInfo && (
        <div className="account-info-banner">
          <div className="account-details">
            <h3>{data.accountInfo.companyName}</h3>
            <p>{data.accountInfo.email} • {data.accountInfo.plan} Plan</p>
          </div>
          <div className="account-credits">
            <span className="credits-used">{formatNumber(data.accountInfo.creditsUsed)} used</span>
            <span className="credits-remaining">{formatNumber(data.accountInfo.creditsRemaining)} remaining</span>
          </div>
        </div>
      )}

      {/* Performance Overview */}
      <div className="performance-overview">
        <h2>Performance Overview</h2>
        <div className="performance-grid">
          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faCheckCircle} className="performance-icon delivered" />
              <h3>Delivery Rate</h3>
            </div>
            <div className="performance-value">
              {(() => {
                const delivered = data.individualEmails.filter(e => e.event === 'delivered').length;
                const sent = data.individualEmails.filter(e => e.event === 'requests').length;
                const rate = sent > 0 ? ((delivered / sent) * 100).toFixed(1) : '0';
                return `${rate}%`;
              })()}
            </div>
            <div className="performance-details">
              {data.individualEmails.filter(e => e.event === 'delivered').length} delivered of {data.individualEmails.filter(e => e.event === 'requests').length} sent
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faEye} className="performance-icon opened" />
              <h3>Open Rate</h3>
            </div>
            <div className="performance-value">
              {(() => {
                const opened = data.individualEmails.filter(e => e.event === 'opened').length;
                const delivered = data.individualEmails.filter(e => e.event === 'delivered').length;
                const rate = delivered > 0 ? ((opened / delivered) * 100).toFixed(1) : '0';
                return `${rate}%`;
              })()}
            </div>
            <div className="performance-details">
              {data.individualEmails.filter(e => e.event === 'opened').length} opens from {data.individualEmails.filter(e => e.event === 'delivered').length} delivered
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faMousePointer} className="performance-icon clicked" />
              <h3>Click Rate</h3>
            </div>
            <div className="performance-value">
              {(() => {
                const clicked = data.individualEmails.filter(e => e.event === 'clicked').length;
                const delivered = data.individualEmails.filter(e => e.event === 'delivered').length;
                const rate = delivered > 0 ? ((clicked / delivered) * 100).toFixed(1) : '0';
                return `${rate}%`;
              })()}
            </div>
            <div className="performance-details">
              {data.individualEmails.filter(e => e.event === 'clicked').length} clicks from {data.individualEmails.filter(e => e.event === 'delivered').length} delivered
            </div>
          </div>

          <div className="performance-card">
            <div className="performance-header">
              <FontAwesomeIcon icon={faTimesCircle} className="performance-icon bounced" />
              <h3>Bounce Rate</h3>
            </div>
            <div className="performance-value">
              {(() => {
                const bounced = data.individualEmails.filter(e => e.event && (e.event.includes('Bounce') || e.event === 'blocked')).length;
                const sent = data.individualEmails.filter(e => e.event === 'requests').length;
                const rate = sent > 0 ? ((bounced / sent) * 100).toFixed(1) : '0';
                return `${rate}%`;
              })()}
            </div>
            <div className="performance-details">
              {data.individualEmails.filter(e => e.event && (e.event.includes('Bounce') || e.event === 'blocked')).length} bounces from {data.individualEmails.filter(e => e.event === 'requests').length} sent
            </div>
          </div>
        </div>
      </div>

      {/* Email Activity Timeline */}
      <div className="activity-timeline">
        <h2>Recent Email Activity</h2>
        <div className="timeline-container">
          {data.individualEmails.slice(0, 10).map((email, index) => (
            <div key={`${email.messageId}-${index}`} className="timeline-item">
              <div className="timeline-marker">
                <FontAwesomeIcon icon={
                  email.event === 'delivered' ? faCheckCircle :
                  email.event === 'opened' ? faEye :
                  email.event === 'clicked' ? faMousePointer :
                  email.event === 'requests' ? faBolt :
                  faEnvelope
                } className={`timeline-icon ${email.event}`} />
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-event">{email.event}</span>
                  <span className="timeline-time">{formatDate(email.date)}</span>
                </div>
                <div className="timeline-details">
                  <div className="timeline-subject">{email.subject || 'No Subject'}</div>
                  <div className="timeline-recipient">To: {email.to[0]}</div>
                  {email.reason && <div className="timeline-reason">Reason: {email.reason}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Core Email Analytics */}
      <div className="metrics-section">
        <h2>Detailed Analytics</h2>
        <div className="metrics-grid">
          <StatCard
            title="Individual Emails"
            value={formatNumber(data.totalIndividualEmails)}
            icon={faEnvelope}
            variant="primary"
            subtitle="Every single email tracked"
            onClick={() => openModal('Individual Email Events', generateIndividualEmailsModal())}
          />
          
          <StatCard
            title="Last Sent Email"
            value={(() => {
              // Filter for only "requests" events (actual sent emails)
              const sentEmails = data.individualEmails.filter(email => 
                email.event === 'requests' || email.status === 'sent' || email.type === 'transactional'
              );
              return sentEmails.length > 0 ? formatDate(sentEmails[0].date) : 'No emails sent';
            })()}
            icon={faClock}
            variant="success"
            subtitle={(() => {
              const sentEmails = data.individualEmails.filter(email => 
                email.event === 'requests' || email.status === 'sent' || email.type === 'transactional'
              );
              return sentEmails.length > 0 ? `To: ${sentEmails[0].to[0] || 'Unknown'}` : 'No sent emails found';
            })()}
            onClick={() => {
              const sentEmails = data.individualEmails.filter(email => 
                email.event === 'requests' || email.status === 'sent' || email.type === 'transactional'
              );
              if (sentEmails.length > 0) {
                const lastSentEmail = sentEmails[0];
                openModal('Last Sent Email Details', generateLastEmailModal(lastSentEmail));
              }
            }}
          />
          
          <StatCard
            title="Email Deep Dive"
            value={formatNumber(new Set(data.individualEmails.map(e => e.messageId)).size)}
            icon={faChartLine}
            variant="warning"
            subtitle="Maximum detail analysis"
            onClick={() => openModal('Email Deep Dive Analysis', generateEmailDeepDiveModal())}
          />
          
          <StatCard
            title="Email ID Analytics"
            value={formatNumber(new Set(data.individualEmails.map(e => e.messageId)).size)}
            icon={faSearch}
            variant="info"
            subtitle="Select & analyze specific emails"
            onClick={() => {
              handleEmailIdAnalytics();
            }}
          />
          
          <StatCard
            title="Engagement Records"
            value={engagementLoading ? 'Loading...' : formatNumber(engagementRecords.length)}
            icon={faDatabase}
            variant="secondary"
            subtitle={`${engagementRecords.filter(r => r.donor).length} linked to donors`}
            onClick={() => openModal('Engagement Table Records', generateEngagementRecordsModal())}
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
