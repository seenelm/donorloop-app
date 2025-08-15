import { useNavigate, useLocation } from 'react-router';

/**
 * A custom hook to manage navigation logic for the header.
 * It provides the `navigate` function and the `currentPath` from React Router.
 */
export const useSidebarLogic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return { navigate, currentPath };
};