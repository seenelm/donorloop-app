import React from 'react';
import { useSidebarLogic } from './SidebarLogic';

// These are the real imports your project needs
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faCog } from '@fortawesome/free-solid-svg-icons';
import donorLoopLogo from '../../assets/images/donor-loop-logo.png';
import '../styles/UnifiedHeader.css';

const navItems = [
  { path: '/new-Dashboard', label: 'Overview' },
  { path: '/donor-manager', label: 'Donors' },
  { path: '/fundraising-manager', label: 'Fundraising' },
  { path: '/metrics', label: 'Analytics' },
  { path: '/data-library', label: 'Data Library' },
  { path: '/emails', label: 'Email' },
];

const UnifiedHeader: React.FC = () => {
  const { navigate, currentPath } = useSidebarLogic();

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
        <button className="header-icon-button">
          <FontAwesomeIcon icon={faBell} />
        </button>
        <button className="header-icon-button">
          <FontAwesomeIcon icon={faCog} />
        </button>
        <div className="user-profile-avatar">
          <span>JD</span>
        </div>
      </div>
    </header>
  );
};

export default UnifiedHeader;