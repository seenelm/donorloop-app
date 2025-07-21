import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import './styles/DonorManager.css';
import Controls from '../components/controls/Controls';
import Stub from '../components/stub/Stub';
import donorManagerStubProps from '../models/DonationManagerStub';
import { fetchDonors } from '../utils/supabaseClient';

// Update Donor interface to match the actual database schema
interface Donor {
  donorid: string;
  firstname: string;
  lastname: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  tp_guid?: string;
  created_at?: string;
}

const DonorManager: React.FC = () => {
  const navigate = useNavigate();
  const [donors, setDonors] = useState<Donor[]>([]);
  const [filteredDonors, setFilteredDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState('All Donors');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadDonors = async () => {
      try {
        setLoading(true);
        // Use the new fetchAllDonors function instead of fetchDonors
        const { data, error } = await fetchDonors();
        
        if (error) {
          throw new Error(error);
        }
        
        if (data) {
          console.log('Setting donors data:', data.length, 'records');
          setDonors(data);
          setFilteredDonors(data);
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

  // Filter donors based on search term and active filter
  useEffect(() => {
    if (!donors.length) return;
    
    let result = [...donors];
    
    // Apply search filter if search term exists
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(donor => 
        donor.firstname?.toLowerCase().includes(lowerSearchTerm) ||
        donor.lastname?.toLowerCase().includes(lowerSearchTerm) ||
        donor.email?.toLowerCase().includes(lowerSearchTerm) ||
        donor.phone?.toLowerCase().includes(lowerSearchTerm) ||
        donor.city?.toLowerCase().includes(lowerSearchTerm) ||
        donor.state?.toLowerCase().includes(lowerSearchTerm) ||
        donor.donorid?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Apply category filter
    if (activeFilter !== 'All Donors') {
      // This is a placeholder for future filter implementation
      // You can implement specific filtering logic based on your requirements
      if (activeFilter === 'Recent') {
        // Example: Sort by creation date and take the 10 most recent
        result = [...result].sort((a, b) => {
          return new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime();
        }).slice(0, 10);
      } else if (activeFilter === 'Top Donors') {
        // This would require donation data to be implemented
        // For now, just return the same results
      } else if (activeFilter === 'Inactive') {
        // This would require activity data to be implemented
        // For now, just return the same results
      }
    }
    
    setFilteredDonors(result);
  }, [donors, searchTerm, activeFilter]);

  const handleViewDonor = (donorId: string) => {
    navigate(`/donor-profile/${donorId}`);
  };

  const handleEditDonor = (donorId: string) => {
    // For future implementation
    console.log('Edit donor:', donorId);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
  };

  const handleImportDonors = () => {
    // For future implementation
    console.log('Import donors');
  };

  const handleAddDonor = () => {
    // For future implementation
    console.log('Add new donor');
  };

  return (
    <div className="content-body donor-manager-container">
      <div className="manager-header">
        <h2>Donor Manager</h2>
        <p className="manager-description">
          Track and manage your donors, their contact information, and donation history.
        </p>
      </div>

      <Controls
        filterOptions={{
          defaultOption: 'All Donors',
          options: ['All Donors', 'Recent', 'Top Donors', 'Inactive']
        }}
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        onPrimaryAction={handleImportDonors}
        onSecondaryAction={handleAddDonor}
        primaryButtonLabel="Import"
        secondaryButtonLabel="Add Donor"
        searchPlaceholder="Search donors..."
      />

      <div className="donors-container">
        {loading ? (
          <div className="loading-state">Loading donors...</div>
        ) : error ? (
          <div className="error-state">
            <p>Error loading donors: {error}</p>
            <button onClick={() => window.location.reload()}>Retry</button>
          </div>
        ) : filteredDonors.length === 0 ? (
          searchTerm ? (
            <div className="no-results">
              <p>No donors found matching "{searchTerm}"</p>
              {activeFilter !== 'All Donors' && (
                <p>Try changing your filter or search term</p>
              )}
            </div>
          ) : (
            <Stub {...donorManagerStubProps} />
          )
        ) : (
          // Donor list
          <div className="donor-list">
            <div className="donor-list-header">
              <span className="donor-count">
                {filteredDonors.length} {filteredDonors.length === 1 ? 'donor' : 'donors'}
                {searchTerm && ` matching "${searchTerm}"`}
              </span>
            </div>
            <table className="donor-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Donor ID</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDonors.map(donor => (
                  <tr key={donor.donorid || Math.random().toString()}>
                    <td className="donor-name-cell">
                      <div className="donor-avatar-small">
                        {donor.firstname && donor.lastname ? 
                          `${donor.firstname.charAt(0)}${donor.lastname.charAt(0)}` : 
                          'DN'}
                      </div>
                      <div className="donor-name">
                        <span className="donor-full-name">{donor.firstname} {donor.lastname}</span>
                      </div>
                    </td>
                    <td>{donor.email}</td>
                    <td>{donor.phone || '-'}</td>
                    <td>{donor.city ? `${donor.city}, ${donor.state || ''}` : '-'}</td>
                    <td>{donor.donorid || '-'}</td>
                    <td className="donor-actions">
                      <button 
                        className="action-button"
                        onClick={() => handleViewDonor(donor.donorid)}
                      >
                        View
                      </button>
                      <button 
                        className="action-button"
                        onClick={() => handleEditDonor(donor.donorid)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DonorManager;
