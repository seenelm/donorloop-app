import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faUsers, 
  faHome,
  faBook,
  faSignOut,
  faChevronLeft,
  faChevronRight,
  faHomeAlt,
  faEnvelope,
} from '@fortawesome/free-solid-svg-icons';
import donorLoopLogo from '../../assets/images/donor-loop-logo.png';
import '../../assets/styles/sidebar.css';
import { type SidebarProps, useSidebarLogic } from './SidebarLogic';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';

export const SidebarView: React.FC<SidebarProps> = (props) => {
  const {
    navigate,
    currentPath,
    isMobile,
  } = useSidebarLogic(props);
  
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  // Mobile tab bar
  if (isMobile) {
    return (
      <div className="mobile-tab-bar">
        <button 
          className={`tab-button ${currentPath === '/dashboard' ? 'active' : ''}`}
          onClick={() => navigate('/dashboard')}
        >
          <FontAwesomeIcon icon={faHome} />
          <span>Dashboard</span>
        </button>
        
        <button 
          className={`tab-button ${currentPath === '/fundraising-manager' ? 'active' : ''}`}
          onClick={() => navigate('/fundraising-manager')}
        >
          <FontAwesomeIcon icon={faChartLine} />
          <span>Fundraising</span>
        </button>
        
        <button 
          className={`tab-button ${currentPath === '/donor-manager' ? 'active' : ''}`}
          onClick={() => navigate('/donor-manager')}
        >
          <FontAwesomeIcon icon={faUsers} />
          <span>Donors</span>
        </button>
        
        <button 
          className={`tab-button ${currentPath === '/data-library' ? 'active' : ''}`}
          onClick={() => navigate('/data-library')}
        >
          <FontAwesomeIcon icon={faBook} />
          <span>Data</span>
        </button>
      </div>
    );
  }

  // Desktop sidebar
  return (
    <>
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-header">
          <img src={donorLoopLogo} alt="Tanwir Institute Logo" className="sidebar-logo" />
          {!isCollapsed && <h2>Tanwir Institute</h2>}
        </div>
        
        <div className="sidebar-section">
          <h3 className={`section-title ${isCollapsed ? 'hidden' : ''}`}>Tools</h3>
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/fundraising-manager' ? 'active' : ''}`}
                onClick={() => navigate('/fundraising-manager')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faChartLine} />
                </span>
                {!isCollapsed && <span className="button-text">Fundraising Manager</span>}
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/donor-manager' ? 'active' : ''}`}
                onClick={() => navigate('/donor-manager')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faUsers} />
                </span>
                {!isCollapsed && <span className="button-text">Donor Manager</span>}
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/data-library' ? 'active' : ''}`}
                onClick={() => navigate('/data-library')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faBook} />
                </span>
                {!isCollapsed && <span className="button-text">Data Library</span>}
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/metrics' ? 'active' : ''}`}
                onClick={() => navigate('/metrics')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faBook} />
                </span>
                {!isCollapsed && <span className="button-text">Metrics</span>}
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/email' ? 'active' : ''}`}
                onClick={() => navigate('/email')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faEnvelope} />
                </span>
                {!isCollapsed && <span className="button-text">Email</span>}
              </button>
            </li>
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/new-dashboard' ? 'active' : ''}`}
                onClick={() => navigate('/New-DashBoard')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faHomeAlt} />
                </span>
                {!isCollapsed && <span className="button-text">New Dashboard</span>}
              </button>
            </li>
          </ul>
        </div>
        
        {/* Dashboard link at the bottom */}
        <div className="sidebar-section">
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <button 
                className={`sidebar-button ${currentPath === '/dashboard' ? 'active' : ''}`}
                onClick={() => navigate('/dashboard')}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faHome} />
                </span>
                {!isCollapsed && <span className="button-text">Dashboard</span>}
              </button>
            </li>
          </ul>
        </div>

        {/* Logout button at the bottom */}
        <div className="sidebar-section">
          <ul className="sidebar-menu">
            <li className="sidebar-menu-item">
              <button 
                className="sidebar-button"
                onClick={handleLogout}
              >
                <span className="icon">
                  <FontAwesomeIcon icon={faSignOut} />
                </span>
                {!isCollapsed && <span className="button-text">Logout</span>}
              </button>
            </li>
          </ul>
        </div>

        {/* Toggle button at the bottom of sidebar */}
        <div className="sidebar-toggle-container">
          <button 
            className="sidebar-toggle-button"
            onClick={toggleSidebar}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
          </button>
        </div>
      </div>
    </>
  );
};
