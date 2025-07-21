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
  faReceipt
} from '@fortawesome/free-solid-svg-icons';
import { fetchDonorById, fetchGiftsByDonorId, type DonorData, type GiftData } from '../utils/supabaseClient';
import './styles/DonorProfile.css';

const DonorProfile: React.FC = () => {
  const { donorId } = useParams<{ donorId: string }>();
  const navigate = useNavigate();
  
  const [donor, setDonor] = useState<DonorData | null>(null);
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'gifts'>('overview');

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
        ) : (
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
        )}
      </div>
    </div>
  );
};

export default DonorProfile;
