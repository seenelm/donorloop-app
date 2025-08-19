import { useNavigate, useLocation } from 'react-router';
import { usePageTransition } from '../../context/PageTransitionContext';

/**
 * A custom hook to manage navigation logic for the header.
 * It provides the `navigate` function with page transitions and the `currentPath` from React Router.
 */
export const useSidebarLogic = () => {
  const routerNavigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const { startTransition } = usePageTransition();

  const navigate = (path: string) => {
    if (path === currentPath) return; // Don't transition to same page
    
    startTransition(() => {
      routerNavigate(path);
    });
  };

  return { navigate, currentPath };
};