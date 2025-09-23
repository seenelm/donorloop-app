import React, { createContext, useContext, useState, useCallback } from 'react';

interface PageTransitionContextType {
  isTransitioning: boolean;
  transitionPhase: 'idle' | 'fade-out' | 'fade-in';
  startTransition: (callback: () => void) => void;
}

const PageTransitionContext = createContext<PageTransitionContextType | undefined>(undefined);

export const PageTransitionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionPhase, setTransitionPhase] = useState<'idle' | 'fade-out' | 'fade-in'>('idle');

  const startTransition = useCallback((callback: () => void) => {
    if (isTransitioning) return; // Prevent overlapping transitions

    setIsTransitioning(true);
    setTransitionPhase('fade-out');

    // Fade to black (300ms)
    setTimeout(() => {
      callback(); // Execute navigation
      setTransitionPhase('fade-in');
      
      // Fade in new content (300ms)
      setTimeout(() => {
        setIsTransitioning(false);
        setTransitionPhase('idle');
      }, 300);
    }, 300);
  }, [isTransitioning]);

  return (
    <PageTransitionContext.Provider value={{
      isTransitioning,
      transitionPhase,
      startTransition
    }}>
      {children}
    </PageTransitionContext.Provider>
  );
};

export const usePageTransition = () => {
  const context = useContext(PageTransitionContext);
  if (context === undefined) {
    throw new Error('usePageTransition must be used within a PageTransitionProvider');
  }
  return context;
};
