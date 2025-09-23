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
  faTrash
} from '@fortawesome/free-solid-svg-icons';
import { fetchDonorById, fetchGiftsByDonorId, type DonorData, type GiftData } from '../utils/supabaseClient';
import axios from 'axios';
import './styles/DonorProfile.css';

const DonorProfile: React.FC = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const navigate = useNavigate();
  
  const [donor, setDonor] = useState<DonorData | null>(null);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gifts' | 'email'>('overview');

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

export default DonorProfile;
