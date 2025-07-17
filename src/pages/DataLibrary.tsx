import React from 'react';
import './styles/DataLibrary.css';
import Grid from '../components/grid/Grid';

const DataLibrary: React.FC = () => {
  
  return (
    <div className="data-library-container">
      <div className="manager-header">
        <h2>Data Library</h2>
        <p className="manager-description">
          Explore your data sources and how they integrate with your database.
        </p>
        <div className="header-underline"></div>
      </div>
      <Grid/>
    </div>
  );
};

export default DataLibrary;
