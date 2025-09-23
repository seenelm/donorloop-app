import React, { useState, useEffect } from 'react';
import './styles/Email.css';
import Controls from '../components/controls/Controls';
import { fetchDonors } from '../utils/supabaseClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTrash, faSave, faEnvelope } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';

// Email interface
interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
}

interface EmailHistory {
  id: string;
  to: string;
  subject: string;
  sentAt: string;
  status: 'sent' | 'failed' | 'draft';
}

interface Donor {
  donorid: string;
  firstname: string;
  lastname: string;
  email: string;
}

interface EmailRecipient {
  email: string;
  name: string;
}

interface SendEmailResponse {
  success: boolean;
  message: string;
  recipientCount?: number;
  brevoResponse?: any;
  error?: any;
}

const Email: React.FC = () => {
  // State for email composition
  const [subject, setSubject] = useState<string>('');
  const [body, setBody] = useState<string>('');
  const [selectedDonors, setSelectedDonors] = useState<string[]>([]);
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'compose' | 'templates' | 'history'>('compose');
  const [sending, setSending] = useState<boolean>(false);
  const [sendResult, setSendResult] = useState<{success: boolean, message: string} | null>(null);
  
  // Get API endpoint from environment variable
  const apiBaseUrl = import.meta.env.VITE_TANWIR_EMAILER || 'http://localhost:3000/';
  
  // Sample templates and history for demonstration
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      id: '1',
      name: 'Monthly Newsletter',
      subject: 'Your Monthly Update from Tanwir Institute',
      body: 'Dear {{firstName}},\n\nThank you for your continued support of Tanwir Institute. Here\'s your monthly update on our activities and impact.\n\nBest regards,\nTanwir Institute Team'
    },
    {
      id: '2',
      name: 'Donation Thank You',
      subject: 'Thank You for Your Generous Donation',
      body: 'Dear {{firstName}},\n\nThank you for your generous donation of {{amount}}. Your support helps us continue our important work.\n\nSincerely,\nTanwir Institute Team'
    },
    {
      id: '3',
      name: 'Donor Update - Gift in Action',
      subject: 'Your Gift in Action – A Letter from Ust. Omar Popal',
      body: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
  <div style="text-align: center; margin-bottom: 20px;">
    <img src="https://images.squarespace-cdn.com/content/66a00d45db79b1271d17284d/f596f1b5-33ae-4fde-b6e1-3a6c9beb0deb/tanwir-horizontal.png" alt="Tanwir Institute Logo" style="max-width: 300px; height: auto;">
  </div>

  <h2 style="color: #2c3e50; text-align: center;">Your Gift in Action – A Letter from Ust. Omar Popal</h2>

  <p>Assalamu Alaikum {{firstName}},</p>
  <p>Because of your generosity, Tanwir Institute is entering a new season of growth, impact, and service to our community.</p>

  <h3 style="color: #0078d4;">A FULL-TIME EXECUTIVE DIRECTOR — MADE POSSIBLE BY YOU</h3>
  <p>I'm humbled to share that I've stepped into the role of full-time Executive Director. Your support provided the stability needed for me to dedicate myself completely to guiding Tanwir's mission. I am grateful to Allah (swt) for this opportunity and to all of you who continue to support Tanwir.</p>

  <h3 style="color: #0078d4;">INVESTING IN HIGH-IMPACT LEARNING</h3>
  <ul style="line-height: 1.6;">
    <li><strong>Prophetic Guidance</strong> – Enhanced curriculum and student experience for our over 100+ students who study the foundations of the sacred sciences on a weekly basis. We are also launching "The Journey", a postgraduate course for our students who wish to pursue further studies.</li>
    <li><strong>Associates Program in Arabic and Islamic Studies</strong> – Formerly the "Arabic and Islamic Studies Diploma", we revised the curriculum, made it more user-friendly, and added new supplementary materials to deepen the understanding of Allah's words and the tradition of Islamic Scholarship.</li>
    <li><strong>Community Programs</strong> – Expanded series of sisters-only programming with guest scholars, suhba-focused brothers hangouts, and weekly education series during the Summer.</li>
    <li><strong>The TLP – The Tanwir Learning Portal</strong> was designed to provide students with a single resource for all their classes and educational needs.</li>
  </ul>

  <h3 style="color: #0078d4;">COMING SOON: YOUTH PROGRAM LAUNCH</h3>
  <p>With input from parents and educators, we're designing a youth initiative that blends mentorship and practical spiritual practice. Your continued partnership will help us open registration this year.</p>

  <p>From every student learning the foundations to each family finding a sense of belonging in our programs, your impact is tangible. Thank you for choosing to invest in people, not just programs.</p>

  <p>If you have questions or stories to share about how Tanwir has touched your life, simply reply to this email.</p>

  <div style="text-align: center; margin: 30px 0;">
    <img src="https://images.squarespace-cdn.com/content/66a00d45db79b1271d17284d/88b9daca-c405-4b6c-9698-91edffc2119c/AD_4nXcckvqKQKCqc3iV2ciB-OHmJp_AElLHexhyhd20CC8QyibAIoPW14JlEFqElu6UF1qlBsqYfpgopsPVp_NvDaPrj-wk1k7eJCFmjgAJ2fxbK00MGClisrbD0HbrFMgwJG25RrLcGw.jpg?content-type=image%2Fjpeg" alt="Tanwir Institute Community" style="max-width: 100%; height: auto; border-radius: 5px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
  </div>

  <p>With heartfelt gratitude,</p>
  <p><strong>Omar Popal</strong><br>Executive Director, Tanwir Institute</p>

  <p><em>P.S. Keep an eye out for our fall calendar of events—we'd love to see you in person!</em></p>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
  <p style="font-size: 12px; color: #6c757d; text-align: center;">
    This is an automated email to all Tanwir Institute donors. Please direct any questions to <a href="mailto:programs@tanwirinstitute.org">programs@tanwirinstitute.org</a>.
  </p>
</div>`
    }
  ]);
  
  const [emailHistory, setEmailHistory] = useState<EmailHistory[]>([
    {
      id: '1',
      to: 'john.doe@example.com',
      subject: 'Thank You for Your Donation',
      sentAt: '2025-08-10T14:30:00',
      status: 'sent'
    },
    {
      id: '2',
      to: 'jane.smith@example.com',
      subject: 'Monthly Newsletter - August 2025',
      sentAt: '2025-08-05T10:15:00',
      status: 'sent'
    }
  ]);

  // Load donors on component mount
  useEffect(() => {
    const loadDonors = async () => {
      try {
        setLoading(true);
        const { data, error } = await fetchDonors();
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          setDonors(data);
        }
      } catch (err) {
        console.error('Failed to load donors:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    loadDonors();
  }, []);

  // Handle donor selection
  const handleDonorSelection = (donorId: string) => {
    setSelectedDonors(prev => 
      prev.includes(donorId) 
        ? prev.filter(id => id !== donorId) 
        : [...prev, donorId]
    );
  };

  // Handle template selection
  const handleTemplateSelect = (template: EmailTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setActiveTab('compose');
  };

  // Convert HTML content from plain text with line breaks
  const convertToHtml = (text: string, recipient?: EmailRecipient): string => {
    // Check if the text is already HTML (contains HTML tags)
    const isHtml = /<[a-z][\s\S]*>/i.test(text);
    
    let html = isHtml ? text : text.replace(/\n/g, '<br>');
    
    // Replace placeholders with actual values if recipient is provided
    if (recipient) {
      // Replace {{firstName}} with recipient's first name
      const firstName = recipient.name.split(' ')[0];
      html = html.replace(/{{firstName}}/g, firstName);
      
      // Replace |FNAME| with recipient's first name (alternative format)
      html = html.replace(/\|FNAME\|/g, firstName);
    }
    
    return html;
  };

  // Handle email sending
  const handleSendEmail = async () => {
    if (!subject || !body || selectedDonors.length === 0) {
      return;
    }
    
    try {
      setSending(true);
      setSendResult(null);
      
      // Get selected donor details
      const selectedDonorDetails = donors.filter(donor => 
        selectedDonors.includes(donor.donorid)
      );
      
      // Track successful and failed sends
      let successCount = 0;
      let failedCount = 0;
      const errors: string[] = [];
      
      // Send emails individually to each recipient
      for (const donor of selectedDonorDetails) {
        try {
          // Create recipient object for current donor
          const recipient: EmailRecipient = {
            email: donor.email,
            name: `${donor.firstname} ${donor.lastname}`
          };
          
          // Convert body text to HTML with personalization for this specific recipient
          const personalizedHtmlContent = convertToHtml(body, recipient);
          
          // Construct the full API endpoint URL
          const apiEndpoint = `${apiBaseUrl}send-custom-email`;
          
          // Call the API endpoint for this single recipient
          const response = await axios.post<SendEmailResponse>(apiEndpoint, {
            recipients: [recipient], // Send to just this one recipient
            subject,
            htmlContent: personalizedHtmlContent,
            senderName: 'Tanwir Institute',
            senderEmail: 'noreply@tanwirinstitute.org'
          });
          
          if (response.data.success) {
            successCount++;
            
            // Add individual email to history
            const newHistoryItem: EmailHistory = {
              id: Date.now().toString() + donor.donorid,
              to: recipient.email,
              subject,
              sentAt: new Date().toISOString(),
              status: 'sent'
            };
            
            setEmailHistory(prev => [newHistoryItem, ...prev]);
          } else {
            failedCount++;
            errors.push(`Failed to send to ${recipient.email}: ${response.data.message}`);
          }
        } catch (err) {
          failedCount++;
          const errorMessage = axios.isAxiosError(err) 
            ? err.response?.data?.message || `Error sending to ${donor.email}`
            : err instanceof Error ? err.message : 'An unknown error occurred';
          errors.push(errorMessage);
        }
      }
      
      // Show final results
      if (successCount > 0 && failedCount === 0) {
        // All emails sent successfully
        setSendResult({
          success: true,
          message: `Successfully sent ${successCount} individual email${successCount !== 1 ? 's' : ''}`
        });
        
        // Reset form on complete success
        setSubject('');
        setBody('');
        setSelectedDonors([]);
      } else if (successCount > 0 && failedCount > 0) {
        // Some emails sent, some failed
        setSendResult({
          success: true,
          message: `Sent ${successCount} email${successCount !== 1 ? 's' : ''} successfully, but ${failedCount} failed. See console for details.`
        });
        console.error('Email sending errors:', errors);
      } else {
        // All emails failed
        setSendResult({
          success: false,
          message: `Failed to send all ${failedCount} emails. See console for details.`
        });
        console.error('Email sending errors:', errors);
      }
    } catch (err) {
      console.error('Error in email sending process:', err);
      
      // Handle overall process error
      setSendResult({
        success: false,
        message: err instanceof Error ? err.message : 'An unknown error occurred during the email sending process'
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
    
    const newTemplate: EmailTemplate = {
      id: Date.now().toString(),
      name: templateName,
      subject,
      body
    };
    
    setTemplates(prev => [...prev, newTemplate]);
    alert('Template saved successfully!');
  };

  // Handle filter change
  const handleFilterChange = (filter: string) => {
    // This would filter emails in a real implementation
    console.log('Filter changed to:', filter);
  };

  // Handle search
  const handleSearch = (term: string) => {
    // This would search emails in a real implementation
    console.log('Search term:', term);
  };

  return (
    <div className="content-body email-manager-container">
      <div className="manager-header">
        <h2>Email Manager</h2>
        <p className="manager-description">
          Compose and send emails to your donors, manage templates, and view email history.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="email-tabs">
        <button 
          className={`email-tab ${activeTab === 'compose' ? 'active' : ''}`}
          onClick={() => setActiveTab('compose')}
        >
          Compose
        </button>
        <button 
          className={`email-tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
        <button 
          className={`email-tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Compose Email Tab */}
      {activeTab === 'compose' && (
        <div className="email-compose-container">
          <div className="email-form">
            <div className="email-logo-container">
              <img 
                src="https://images.squarespace-cdn.com/content/66a00d45db79b1271d17284d/f596f1b5-33ae-4fde-b6e1-3a6c9beb0deb/tanwir-horizontal.png" 
                alt="Tanwir Institute Logo" 
                className="email-logo"
              />
            </div>
            
            {/* Send Result Message */}
            {sendResult && (
              <div className={`send-result ${sendResult.success ? 'success' : 'error'}`}>
                {sendResult.message}
              </div>
            )}
            
            <div className="form-group">
              <label>To:</label>
              <div className="recipient-selector">
                {loading ? (
                  <p>Loading donors...</p>
                ) : error ? (
                  <p className="error-message">Error loading donors: {error}</p>
                ) : (
                  <div className="donor-list-container">
                    {donors.map(donor => (
                      <div 
                        key={donor.donorid} 
                        className={`donor-checkbox ${selectedDonors.includes(donor.donorid) ? 'selected' : ''}`}
                        onClick={() => handleDonorSelection(donor.donorid)}
                      >
                        <div className="donor-checkbox-input">
                          <input 
                            type="checkbox" 
                            checked={selectedDonors.includes(donor.donorid)} 
                            onChange={() => {}} // Handled by onClick on the div
                          />
                        </div>
                        <div className="donor-info">
                          <span>{donor.firstname} {donor.lastname}</span>
                          <span className="donor-email">({donor.email})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="selected-count">
                {selectedDonors.length} recipient(s) selected
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
                disabled={!subject || !body || selectedDonors.length === 0 || sending}
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
                  setSelectedDonors([]);
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
      {activeTab === 'templates' && (
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

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="email-history-container">
          <Controls
            filterOptions={{
              defaultOption: 'All Emails',
              options: ['All Emails', 'Sent', 'Failed', 'Drafts']
            }}
            onFilterChange={handleFilterChange}
            onSearch={handleSearch}
            searchPlaceholder="Search emails..."
          />
          
          <div className="email-history-list">
            <table className="email-history-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>To</th>
                  <th>Subject</th>
                  <th>Sent At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {emailHistory.map(email => (
                  <tr key={email.id}>
                    <td>
                      <span className={`status-indicator ${email.status}`}>
                        {email.status}
                      </span>
                    </td>
                    <td>{email.to}</td>
                    <td>{email.subject}</td>
                    <td>{new Date(email.sentAt).toLocaleString()}</td>
                    <td>
                      <button 
                        className="action-button small"
                        onClick={() => {
                          // View email details
                          alert('View email details functionality will be implemented in the future.');
                        }}
                      >
                        View
                      </button>
                      <button 
                        className="action-button small"
                        onClick={() => {
                          // Resend email
                          alert('Resend email functionality will be implemented in the future.');
                        }}
                      >
                        Resend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Email;
