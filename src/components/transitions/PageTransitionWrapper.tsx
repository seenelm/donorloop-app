import React from 'react';
import { usePageTransition } from '../../context/PageTransitionContext';

interface PageTransitionWrapperProps {
  children: React.ReactNode;
}

const PageTransitionWrapper: React.FC<PageTransitionWrapperProps> = ({ children }) => {
  const { transitionPhase } = usePageTransition();

  return (
    <>
      {/* Black overlay for fade transitions */}
      <div className={`page-transition-overlay ${transitionPhase}`} />
      
      {/* Main content with transition classes */}
      <div className={`main-content ${transitionPhase === 'fade-out' ? 'transitioning' : ''}`}>
        {children}
      </div>
    </>
  );
};

export default PageTransitionWrapper;
