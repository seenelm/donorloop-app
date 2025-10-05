import React, { useState } from 'react';
import { useSidebarLogic } from './SidebarLogic';

// These are the real imports your project needs
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog, faSearch, faBars, faTimes } from '@fortawesome/free-solid-svg-icons';
import donorLoopLogo from '../../assets/images/donor-loop-logo.png';
import '../styles/UnifiedHeader.css';

const navItems = [
  { path: '/dashboard', label: 'Overview' },
  { path: '/donor-manager', label: 'Donors' },
  { path: '/fundraising-manager', label: 'Fundraising' },
  { path: '/metrics', label: 'Analytics' },
  { path: '/email-analytics', label: 'Email Analytics' },
  { path: '/data-library', label: 'Data Library' },
];

const UnifiedHeader: React.FC = () => {
  const { navigate, currentPath } = useSidebarLogic();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMobileNavigation = (path: string) => {
    navigate(path);
    closeMobileMenu();
  };

  return (
    <header className="unified-header">
      <div className="header-section left">
        <img src={donorLoopLogo} alt="Logo" className="header-logo" />
        <span className="header-title">Tanwir Institute</span>
      </div>
      <nav className="header-section center">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`nav-button ${currentPath === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {item.label}
          </button>
        ))}
      </nav>
      <div className="header-section right">
        <div className="header-search">
          <FontAwesomeIcon icon={faSearch} className="header-search-icon" />
          <input 
            type="text" 
            placeholder="Search" 
            className="header-search-input"
          />
        </div>
        <button className="header-icon-button">
          <FontAwesomeIcon icon={faBell} />
        </button>
        <button className="header-icon-button">
          <FontAwesomeIcon icon={faCog} />
        </button>
        <div className="user-profile-section">
          <div className="user-profile-avatar">
            <span>AS</span>
          </div>
          <div className="user-profile-info">
            <div className="user-profile-name">Abraham Smith</div>
            <div className="user-profile-role">Transport</div>
          </div>
        </div>
        
        {/* Mobile menu button */}
        <button className="mobile-menu-button" onClick={toggleMobileMenu}>
          <FontAwesomeIcon icon={faBars} />
        </button>
      </div>

      {/* Mobile Navigation Overlay */}
      <div className={`mobile-nav-overlay ${isMobileMenuOpen ? 'open' : ''}`} onClick={closeMobileMenu} />
      
      {/* Mobile Navigation Menu */}
      <nav className={`mobile-nav-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* Mobile menu header */}
        <div className="mobile-nav-header">
          <div className="mobile-nav-title">
            <img src={donorLoopLogo} alt="Logo" className="mobile-nav-logo" />
            <span className="mobile-nav-brand">Tanwir Institute</span>
          </div>
          <button className="mobile-close-button" onClick={closeMobileMenu}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Mobile navigation items */}
        <div className="mobile-nav-items">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`mobile-nav-button ${currentPath === item.path ? 'active' : ''}`}
              onClick={() => handleMobileNavigation(item.path)}
            >
              {item.label}
            </button>
          ))}
        </div>
        
        {/* Mobile user profile */}
        <div className="mobile-user-profile">
          <div className="mobile-user-info">
            <div className="mobile-user-avatar">
              <span>AS</span>
            </div>
            <div className="mobile-user-details">
              <div className="mobile-user-name">Abraham Smith</div>
              <div className="mobile-user-role">Transport</div>
            </div>
          </div>
          <div className="mobile-user-actions">
            <button className="mobile-action-button">
              <FontAwesomeIcon icon={faBell} />
              Alerts
            </button>
            <button className="mobile-action-button">
              <FontAwesomeIcon icon={faCog} />
              Settings
            </button>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default UnifiedHeader;