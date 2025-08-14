import React, {useState} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronDown, 
  faPlus, 
  faFileImport,
  faSearch
} from '@fortawesome/free-solid-svg-icons';
import '../styles/controls.css';
import DonationTypeToggle from '../donationtoggle/DonationsTypeToggle';

interface ControlsProps {
  filterOptions?: {
    defaultOption: string;
    options: string[];
  };
  onFilterChange?: (option: string) => void;
  onSearch?: (searchTerm: string) => void;
  onPrimaryAction?: () => void;
  onSecondaryAction?: () => void;
  primaryButtonLabel?: string;
  secondaryButtonLabel?: string;
  showSecondaryButton?: boolean;
  searchPlaceholder?: string;
  onDonationTypeChange?: (type: 'monthly' | 'one-time') => void;
}

const Controls: React.FC<ControlsProps> = ({ 
  filterOptions = {
    defaultOption: 'All Items',
    options: ['All Items', 'Recent', 'Favorites']
  },
  onFilterChange = () => {},
  onSearch = () => {},
  onPrimaryAction = () => {},
  onSecondaryAction = () => {},
  primaryButtonLabel = 'Import',
  secondaryButtonLabel = 'Add New',
  showSecondaryButton = true,
  searchPlaceholder = 'Search...',
  onDonationTypeChange,
}) => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [currentFilter, setCurrentFilter] = useState(filterOptions.defaultOption);
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleFilterSelect = (option: string) => {
    setCurrentFilter(option);
    setFilterOpen(false);
    onFilterChange(option);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  return (
    <div className="controls">
      <div className="controls-left">
        <div className="filter-dropdown1">
            <button 
              className="filter-button1" 
              onClick={() => {setFilterOpen(!filterOpen)}}
            >
              {currentFilter} <FontAwesomeIcon icon={faChevronDown} />
            </button>
            {filterOpen && (
              <div className="filter-menu1">
                {filterOptions.options.map((option) => (
                  <button 
                    key={option}
                    onClick={() => handleFilterSelect(option)}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
        </div>
      </div>
      
      <div className="controls-right">
        {onDonationTypeChange && (
          <DonationTypeToggle onChange={onDonationTypeChange} />
        )}
        <form className="search-form" onSubmit={handleSearchSubmit}>
          <div className="search-container">
            <FontAwesomeIcon icon={faSearch} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </form>
        
        <div className="action-buttons1">
          {primaryButtonLabel && (
            <button className="import-button1" onClick={onPrimaryAction}>
              <FontAwesomeIcon icon={faFileImport} /> {primaryButtonLabel}
            </button>
          )}
          {showSecondaryButton && (
            <button className="add-button1" onClick={onSecondaryAction}>
              <FontAwesomeIcon icon={faPlus} /> {secondaryButtonLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Controls;
