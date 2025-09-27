import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faEnvelope, 
  faPhone, 
  faMapMarkerAlt, 
  faIdCard,
  faEdit,
  faCalendarAlt,
  faDollarSign,
  faReceipt,
  faPaperPlane,
  faSave,
  faTrash,
  faInbox,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import { fetchDonorById, fetchGiftsByDonorId, fetchEngagementByDonorEmail, type DonorData, type GiftData, type EngagementData } from '../utils/supabaseClient';
import { getSMTPStatisticsEvents, getEmailMaximumDetails } from '../utils/brevoClient';
import axios from 'axios';
import './styles/DonorProfile.css';

const DonorProfile: React.FC = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const navigate = useNavigate();
  
  const [donor, setDonor] = useState<DonorData | null>(null);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gifts' | 'engagement' | 'email'>('overview');
  const [engagementRecords, setEngagementRecords] = useState<EngagementData[]>([]);
  const [engagementLoading, setEngagementLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadDonorData = async () => {
      if (!donorId) {
        setError('No donor ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch donor details
        const { data: donorData, error: donorError } = await fetchDonorById(donorId);
        
        if (donorError) {
          throw new Error(donorError);
        }
        
        if (donorData) {
          setDonor(donorData);
          
          // Fetch donor's gifts
          const { data: giftsData, error: giftsError } = await fetchGiftsByDonorId(donorId);
          
          if (giftsError) {
            throw new Error(giftsError);
          }
          
          if (giftsData) {
            setGifts(giftsData);
          }
          
          // Fetch donor's email engagement records
          if (donorData.email) {
            setEngagementLoading(true);
            const { data: engagementData, error: engagementError } = await fetchEngagementByDonorEmail(donorData.email);
            
            if (engagementError) {
              console.error('Error fetching engagement records:', engagementError);
            } else if (engagementData) {
              setEngagementRecords(engagementData);
            }
            setEngagementLoading(false);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadDonorData();
  }, [donorId]);

  // Calculate total donation amount
  const totalDonated = gifts.reduce((sum, gift) => sum + (gift.totalamount || 0), 0);
  
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency for display
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="donor-profile-container">
        <div className="loading-state">Loading donor information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="donor-profile-container">
        <div className="error-state">
          <h3>Error loading donor</h3>
          <p>{error}</p>
          <button onClick={() => navigate('/donor-manager')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Donor Manager
          </button>
        </div>
      </div>
    );
  }

  if (!donor) {
    return (
      <div className="donor-profile-container">
        <div className="error-state">
          <h3>Donor not found</h3>
          <p>The requested donor could not be found.</p>
          <button onClick={() => navigate('/donor-manager')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back to Donor Manager
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="donor-profile-container">
      {/* Back button */}
      <div className="back-navigation">
        <button onClick={() => navigate('/donor-manager')} className="back-button">
          <FontAwesomeIcon icon={faArrowLeft} /> Back to Donor Manager
        </button>
      </div>

      {/* Donor header */}
      <div className="donor-header">
        <div className="donor-avatar">
          {donor.firstname && donor.lastname ? 
            `${donor.firstname.charAt(0)}${donor.lastname.charAt(0)}` : 
            'DN'}
        </div>
        <div className="donor-header-info">
          <h1>{donor.firstname} {donor.lastname}</h1>
          <div className="donor-meta">
            <span className="donor-since">Donor since {formatDate(donor.created_at)}</span>
            <span className="donor-total">Total donated: {formatCurrency(totalDonated)}</span>
          </div>
        </div>
        <div className="donor-actions">
          <button className="edit-donor-button">
            <FontAwesomeIcon icon={faEdit} /> Edit Donor
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="donor-tabs">
        <button 
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-button ${activeTab === 'gifts' ? 'active' : ''}`}
          onClick={() => setActiveTab('gifts')}
        >
          Donation History ({gifts.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'engagement' ? 'active' : ''}`}
          onClick={() => setActiveTab('engagement')}
        >
          <FontAwesomeIcon icon={faInbox} /> Email Engagement ({engagementRecords.length})
        </button>
        <button 
          className={`tab-button ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <FontAwesomeIcon icon={faEnvelope} /> Email Donor
        </button>
      </div>

      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' ? (
          <div className="overview-tab">
            <div className="donor-details-card">
              <h2>Contact Information</h2>
              <div className="detail-item">
                <FontAwesomeIcon icon={faEnvelope} />
                <div>
                  <label>Email</label>
                  <p>{donor.email || 'No email provided'}</p>
                </div>
              </div>
              <div className="detail-item">
                <FontAwesomeIcon icon={faPhone} />
                <div>
                  <label>Phone</label>
                  <p>{donor.phone || 'No phone provided'}</p>
                </div>
              </div>
              <div className="detail-item">
                <FontAwesomeIcon icon={faMapMarkerAlt} />
                <div>
                  <label>Location</label>
                  <p>{donor.city && donor.state ? `${donor.city}, ${donor.state}` : 'No location provided'}</p>
                </div>
              </div>
              <div className="detail-item">
                <FontAwesomeIcon icon={faIdCard} />
                <div>
                  <label>Donor ID</label>
                  <p>{donor.donorid}</p>
                </div>
              </div>
            </div>

            <div className="donor-summary-card">
              <h2>Donation Summary</h2>
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-value">{gifts.length}</span>
                  <span className="stat-label">Total Donations</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{formatCurrency(totalDonated)}</span>
                  <span className="stat-label">Total Amount</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">
                    {gifts.length > 0 ? formatCurrency(totalDonated / gifts.length) : '$0.00'}
                  </span>
                  <span className="stat-label">Average Gift</span>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'gifts' ? (
          <div className="gifts-tab">
            <div className="gifts-list-card">
              <h2>Donation History</h2>
              {gifts.length === 0 ? (
                <div className="no-gifts">
                  <p>No donations found for this donor.</p>
                </div>
              ) : (
                <table className="gifts-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Campaign</th>
                      <th>Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gifts.map((gift) => (
                      <tr key={gift.giftid}>
                        <td>
                          <FontAwesomeIcon icon={faCalendarAlt} />
                          {formatDate(gift.giftdate)}
                        </td>
                        <td>
                          <FontAwesomeIcon icon={faDollarSign} />
                          {formatCurrency(gift.totalamount)}
                          {gift.isrecurring && <span className="recurring-badge">Recurring</span>}
                        </td>
                        <td>{gift.paymentmethod || 'N/A'}</td>
                        <td>{gift.campaign || 'General'}</td>
                        <td>
                          {gift.receiptnumber ? (
                            <button className="receipt-button">
                              <FontAwesomeIcon icon={faReceipt} /> View
                            </button>
                          ) : (
                            'N/A'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : activeTab === 'engagement' ? (
          <div className="engagement-tab">
            <EmailEngagement 
              donor={donor} 
              engagementRecords={engagementRecords} 
              loading={engagementLoading} 
            />
          </div>
        ) : (
          <div className="email-tab">
            <EmailDonor donor={donor} />
          </div>
        )}
      </div>
    </div>
  );
};

// EmailDonor component for sending emails to a specific donor
interface EmailDonorProps {
  donor: DonorData;
}

const EmailDonor: React.FC<EmailDonorProps> = ({ donor }) => {
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [sending, setSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{success: boolean, message: string} | null>(null);
  const [activeEmailTab, setActiveEmailTab] = useState<'compose' | 'templates'>('compose');
  
  // Sample templates for demonstration
  const [templates, setTemplates] = useState<{
    id: string;
    name: string;
    subject: string;
    body: string;
  }[]>([
    {
      id: '1',
      name: 'Monthly Newsletter',
      subject: 'Your Monthly Update from Tanwir Institute',
      body: `Dear ${donor.firstname},\n\nThank you for your continued support of Tanwir Institute. Here's your monthly update on our activities and impact.\n\nBest regards,\nTanwir Institute Team`
    },
    {
      id: '2',
      name: 'Donation Thank You',
      subject: 'Thank You for Your Generous Donation',
      body: `Dear ${donor.firstname},\n\nThank you for your generous donation. Your support helps us continue our important work.\n\nSincerely,\nTanwir Institute Team`
    }
  ]);

  // Get API endpoint from environment variable
  const apiBaseUrl = import.meta.env.VITE_TANWIR_EMAILER || 'http://localhost:3000/';
  
  // Handle template selection
  const handleTemplateSelect = (template: {id: string, name: string, subject: string, body: string}) => {
    setSubject(template.subject);
    setBody(template.body);
    setActiveEmailTab('compose');
  };

  // Convert HTML content from plain text with line breaks
  const convertToHtml = (text: string): string => {
    // Check if the text is already HTML (contains HTML tags)
    const isHtml = /<[a-z][\s\S]*>/i.test(text);
    
    let html = isHtml ? text : text.replace(/\n/g, '<br>');
    
    // Replace placeholders with actual values
    const firstName = donor.firstname || '';
    html = html.replace(/{{firstName}}/g, firstName);
    html = html.replace(/\|FNAME\|/g, firstName);
    
    return html;
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (!subject || !body) {
      return;
    }
    
    try {
      setSending(true);
      setSendResult(null);
      
      // Create recipient object for the donor
      const recipient = {
        email: donor.email,
        name: `${donor.firstname} ${donor.lastname}`
      };
      
      // Convert body text to HTML with personalization
      const personalizedHtmlContent = convertToHtml(body);
      
      // Construct the full API endpoint URL
      const apiEndpoint = `${apiBaseUrl}send-custom-email`;
      
      // Call the API endpoint
      const response = await axios.post(apiEndpoint, {
        recipients: [recipient],
        subject,
        htmlContent: personalizedHtmlContent,
        senderName: 'Tanwir Institute',
        senderEmail: 'noreply@tanwirinstitute.org'
      });
      
      if (response.data.success) {
        setSendResult({
          success: true,
          message: `Email successfully sent to ${donor.firstname} ${donor.lastname}`
        });
        
        // Reset form on success
        setSubject('');
        setBody('');
      } else {
        setSendResult({
          success: false,
          message: `Failed to send email: ${response.data.message}`
        });
      }
    } catch (err) {
      console.error('Error sending email:', err);
      
      // Handle error
      setSendResult({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred'
      });
    } finally {
      setSending(false);
    }
  };

  // Handle saving template
  const handleSaveTemplate = () => {
    if (!subject || !body) {
      alert('Please provide both subject and body for the template.');
      return;
    }
    
    const templateName = prompt('Enter a name for this template:');
    if (!templateName) return;
    
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject,
      body
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    alert('Template saved successfully!');
  };

  return (
    <div className="donor-email-container">
      {/* Email Tabs */}
      <div className="email-tabs">
        <button 
          className={`email-tab-button ${activeEmailTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveEmailTab('compose')}
        >
          Compose
        </button>
        <button 
          className={`email-tab-button ${activeEmailTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveEmailTab('templates')}
        >
          Templates
        </button>
      </div>

      {/* Compose Email Tab */}
      {activeEmailTab === 'compose' && (
        <div className="email-compose-container">
          <div className="email-form">
            {/* Send Result Message */}
            {sendResult && (
              <div className={`send-result ${sendResult.success ? 'success' : 'error'}`}>
                {sendResult.message}
              </div>
            )}
            
            <div className="form-group">
              <label>To:</label>
              <div className="recipient-display">
                <div className="recipient-chip">
                  <span>{donor.firstname} {donor.lastname}</span>
                  <span className="recipient-email">({donor.email})</span>
                </div>
              </div>
            </div>
            
            <div className="form-group">
              <label>Subject:</label>
              <input 
                type="text" 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="Email subject"
                className="email-subject-input"
              />
            </div>
            
            <div className="form-group">
              <label>Body:</label>
              <div className="email-body-container">
                <textarea 
                  value={body} 
                  onChange={(e) => setBody(e.target.value)} 
                  placeholder="Compose your email here..."
                  className="email-body-textarea"
                  rows={10}
                />
              </div>
            </div>
            
            <div className="email-actions">
              <button 
                className="action-button primary"
                onClick={handleSendEmail}
                disabled={!subject || !body || sending}
              >
                <FontAwesomeIcon icon={faPaperPlane} /> 
                {sending ? 'Sending...' : 'Send Email'}
              </button>
              <button 
                className="action-button"
                onClick={handleSaveTemplate}
                disabled={!subject || !body || sending}
              >
                <FontAwesomeIcon icon={faSave} /> Save as Template
              </button>
              <button 
                className="action-button"
                onClick={() => {
                  setSubject('');
                  setBody('');
                  setSendResult(null);
                }}
                disabled={sending}
              >
                <FontAwesomeIcon icon={faTrash} /> Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeEmailTab === 'templates' && (
        <div className="email-templates-container">
          <h3>Email Templates</h3>
          <div className="templates-list">
            {templates.map(template => (
              <div key={template.id} className="template-card">
                <h4>{template.name}</h4>
                <p className="template-subject">Subject: {template.subject}</p>
                <p className="template-preview">
                  {template.body.replace(/<[^>]*>?/gm, '').substring(0, 100)}...
                </p>
                <div className="template-actions">
                  <button 
                    className="action-button primary"
                    onClick={() => handleTemplateSelect(template)}
                  >
                    Use Template
                  </button>
                  <button 
                    className="action-button"
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this template?')) {
                        setTemplates(prev => prev.filter(t => t.id !== template.id));
                      }
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// EmailEngagement component for displaying email engagement history
interface EmailEngagementProps {
  donor: DonorData;
  engagementRecords: EngagementData[];
  loading: boolean;
}

interface EmailDetails {
  messageId: string;
  subject: string;
  from: string;
  date: string;
  event: string;
  status: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'sent' | 'unknown';
  // Extended details from Brevo API
  recipients?: string[];
  events?: Array<{
    event: string;
    date: string;
    email: string;
    ip?: string;
    userAgent?: string;
    url?: string;
    reason?: string;
  }>;
  timeline?: Array<{
    timestamp: string;
    event: string;
    recipient: string;
    details: string;
  }>;
  totalRecipients?: number;
  deliveredCount?: number;
  openedCount?: number;
  clickedCount?: number;
  bouncedCount?: number;
  deliveryRate?: number;
  openRate?: number;
  clickRate?: number;
  bounceRate?: number;
  templateId?: number;
}

const EmailEngagement: React.FC<EmailEngagementProps> = ({ donor, engagementRecords, loading }) => {
  const [emailDetails, setEmailDetails] = useState<EmailDetails[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailDetails | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge class
  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'status-badge delivered';
      case 'opened':
        return 'status-badge opened';
      case 'clicked':
        return 'status-badge clicked';
      case 'bounced':
      case 'hardbounces':
      case 'softbounces':
        return 'status-badge bounced';
      case 'sent':
      case 'requests':
        return 'status-badge sent';
      default:
        return 'status-badge unknown';
    }
  };

  // Load email details from Brevo
  useEffect(() => {
    const loadEmailDetails = async () => {
      if (engagementRecords.length === 0) return;
      
      // Loading email details from Brevo API
      const details: EmailDetails[] = [];

      try {
        // Get SMTP events for this donor's email
        const eventsResponse = await getSMTPStatisticsEvents({
          email: donor.email,
          limit: 100,
          sort: 'desc'
        });

        // Match events with engagement records
        for (const record of engagementRecords) {
          const matchingEvent = eventsResponse.events.find(event => event.messageId === record.email_id);
          
          if (matchingEvent) {
            details.push({
              messageId: record.email_id,
              subject: matchingEvent.subject || 'No Subject',
              from: matchingEvent.from || 'Unknown Sender',
              date: record.created_at,
              event: matchingEvent.event,
              status: matchingEvent.event as EmailDetails['status']
            });
          } else {
            // If no matching event found, create a basic record
            details.push({
              messageId: record.email_id,
              subject: 'Email Sent',
              from: 'System',
              date: record.created_at,
              event: 'sent',
              status: 'sent'
            });
          }
        }

        setEmailDetails(details);
      } catch (error) {
        console.error('Error loading email details:', error);
        // Create basic records if API fails
        const basicDetails = engagementRecords.map(record => ({
          messageId: record.email_id,
          subject: 'Email Sent',
          from: 'System',
          date: record.created_at,
          event: 'sent',
          status: 'sent' as EmailDetails['status']
        }));
        setEmailDetails(basicDetails);
      } finally {
        // Email details loading complete
      }
    };

    loadEmailDetails();
  }, [engagementRecords, donor.email]);

  // Handle viewing email details
  const handleViewDetails = async (email: EmailDetails) => {
    setModalLoading(true);
    setShowDetailsModal(true);
    
    try {
      const details = await getEmailMaximumDetails(email.messageId);
      setSelectedEmail({
        ...email,
        ...details.messageDetails
      });
    } catch (error) {
      console.error('Error getting email details:', error);
      setSelectedEmail(email);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="engagement-loading">
        <p>Loading email engagement history...</p>
      </div>
    );
  }

  return (
    <div className="engagement-container">
      <div className="engagement-header">
        <h2>Email Engagement History</h2>
        <p>All emails sent to {donor.firstname} {donor.lastname} ({donor.email})</p>
      </div>

      {emailDetails.length === 0 ? (
        <div className="no-engagement">
          <p>No email engagement records found for this donor.</p>
          <p>Emails sent to this donor will appear here once they are tracked in the system.</p>
        </div>
      ) : (
        <div className="engagement-list-card">
          <table className="engagement-table">
            <thead>
              <tr>
                <th>Date Sent</th>
                <th>Subject</th>
                <th>From</th>
                <th>Status</th>
                <th>Message ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {emailDetails.map((email, index) => (
                <tr key={`${email.messageId}-${index}`}>
                  <td>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    {formatDate(email.date)}
                  </td>
                  <td className="email-subject">{email.subject}</td>
                  <td>{email.from}</td>
                  <td>
                    <span className={getStatusBadge(email.status)}>
                      {email.status.charAt(0).toUpperCase() + email.status.slice(1)}
                    </span>
                  </td>
                  <td className="message-id">{email.messageId.substring(0, 20)}...</td>
                  <td>
                    <button 
                      className="view-details-button"
                      onClick={() => handleViewDetails(email)}
                    >
                      <FontAwesomeIcon icon={faEye} /> View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Analytics Modal */}
      {showDetailsModal && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content email-analytics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Email Analytics</h3>
              <button 
                className="modal-close-button"
                onClick={() => setShowDetailsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              {modalLoading ? (
                <div className="modal-loading">
                  <div className="loading-spinner"></div>
                  <p>Loading detailed analytics...</p>
                </div>
              ) : selectedEmail ? (
                <>
                  {/* Basic Information */}
                  <div className="analytics-section">
                    <h4>Basic Information</h4>
                    <div className="analytics-grid">
                      <div className="analytics-item">
                        <label>Subject</label>
                        <p>{selectedEmail.subject}</p>
                      </div>
                      <div className="analytics-item">
                        <label>From</label>
                        <p>{selectedEmail.from}</p>
                      </div>
                      <div className="analytics-item">
                        <label>To</label>
                        <p>{donor.email}</p>
                      </div>
                      <div className="analytics-item">
                        <label>Date Sent</label>
                        <p>{formatDate(selectedEmail.date)}</p>
                      </div>
                      <div className="analytics-item">
                        <label>Status</label>
                        <span className={getStatusBadge(selectedEmail.status)}>
                          {selectedEmail.status.charAt(0).toUpperCase() + selectedEmail.status.slice(1)}
                        </span>
                      </div>
                      {selectedEmail.templateId && (
                        <div className="analytics-item">
                          <label>Template ID</label>
                          <p>{selectedEmail.templateId}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Performance Metrics */}
                  {selectedEmail.totalRecipients && (
                    <div className="analytics-section">
                      <h4>Performance Metrics</h4>
                      <div className="metrics-grid">
                        <div className="metric-card">
                          <div className="metric-value">{selectedEmail.totalRecipients || 1}</div>
                          <div className="metric-label">Total Recipients</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value">{selectedEmail.deliveredCount || 0}</div>
                          <div className="metric-label">Delivered</div>
                          <div className="metric-percentage">{selectedEmail.deliveryRate?.toFixed(1) || '0'}%</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value">{selectedEmail.openedCount || 0}</div>
                          <div className="metric-label">Opened</div>
                          <div className="metric-percentage">{selectedEmail.openRate?.toFixed(1) || '0'}%</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value">{selectedEmail.clickedCount || 0}</div>
                          <div className="metric-label">Clicked</div>
                          <div className="metric-percentage">{selectedEmail.clickRate?.toFixed(1) || '0'}%</div>
                        </div>
                        <div className="metric-card">
                          <div className="metric-value">{selectedEmail.bouncedCount || 0}</div>
                          <div className="metric-label">Bounced</div>
                          <div className="metric-percentage">{selectedEmail.bounceRate?.toFixed(1) || '0'}%</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Event Timeline */}
                  {selectedEmail.timeline && selectedEmail.timeline.length > 0 && (
                    <div className="analytics-section">
                      <h4>Event Timeline</h4>
                      <div className="timeline-container">
                        {selectedEmail.timeline.map((event, index) => (
                          <div key={index} className="timeline-item">
                            <div className="timeline-marker">
                              <div className={`timeline-dot ${event.event.toLowerCase()}`}></div>
                            </div>
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span className={`timeline-event ${event.event.toLowerCase()}`}>
                                  {event.event.charAt(0).toUpperCase() + event.event.slice(1)}
                                </span>
                                <span className="timeline-time">
                                  {formatDate(event.timestamp)}
                                </span>
                              </div>
                              <div className="timeline-details">
                                <p><strong>Recipient:</strong> {event.recipient}</p>
                                <p><strong>Details:</strong> {event.details}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* All Events */}
                  {selectedEmail.events && selectedEmail.events.length > 0 && (
                    <div className="analytics-section">
                      <h4>All Events ({selectedEmail.events.length})</h4>
                      <div className="events-table-container">
                        <table className="events-table">
                          <thead>
                            <tr>
                              <th>Event</th>
                              <th>Date</th>
                              <th>Email</th>
                              <th>IP Address</th>
                              <th>Details</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedEmail.events.map((event, index) => (
                              <tr key={index}>
                                <td>
                                  <span className={`event-badge ${event.event.toLowerCase()}`}>
                                    {event.event}
                                  </span>
                                </td>
                                <td>{formatDate(event.date)}</td>
                                <td>{event.email}</td>
                                <td className="ip-address">{event.ip || 'N/A'}</td>
                                <td className="event-details">
                                  {event.url && <div><strong>URL:</strong> {event.url}</div>}
                                  {event.reason && <div><strong>Reason:</strong> {event.reason}</div>}
                                  {event.userAgent && <div><strong>User Agent:</strong> {event.userAgent}</div>}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Technical Details */}
                  <div className="analytics-section">
                    <h4>Technical Details</h4>
                    <div className="technical-details">
                      <div className="technical-item">
                        <label>Message ID</label>
                        <p className="message-id-full">{selectedEmail.messageId}</p>
                      </div>
                      {selectedEmail.recipients && (
                        <div className="technical-item">
                          <label>Recipients</label>
                          <div className="recipients-list">
                            {selectedEmail.recipients.map((recipient, index) => (
                              <span key={index} className="recipient-tag">{recipient}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="modal-error">
                  <p>Failed to load email details. Please try again.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorProfile;
