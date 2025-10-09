import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Dashboard from './pages/Dashboard';
import FundraisingManager from './pages/FundraisingManager';
import DonorManager from './pages/DonorManager';
import DonorProfile from './pages/DonorProfile';
import EmailAnalytics from './pages/EmailAnalytics';
import ResizableChatSidebar from './components/chat/ResizableChatSidebar';
import FloatingChatButton from './components/chat/FloatingChatButton';
import { ChatSidebarProvider } from './context/ChatSidebarContext';
import { SidebarProvider } from './context/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import { PageTransitionProvider } from './context/PageTransitionContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import AuthAdmin from './pages/AuthAdmin';
import AuthCallback from './pages/AuthCallback';
import DataLibrary from './pages/DataLibrary';
import './App.css';
import './pages/styles/Dashboard.css';
import Metrics from './pages/Metrics';
import UnifiedHeader from './components/navigation/UnifiedHeader';
import PageTransitionWrapper from './components/transitions/PageTransitionWrapper';

// AuthenticatedLayout component that includes sidebar and other app elements
const AuthenticatedLayout = () => {
  const ENABLE_GIVING_ASSISTANT = import.meta.env.VITE_ENABLE_GIVING_ASSISTANT === 'true';
  return (
    <div className="app-container">
      <UnifiedHeader />
      <div className="content-wrapper">
        <PageTransitionWrapper>
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fundraising-manager" element={<FundraisingManager />} />
            <Route path="/donor-manager" element={<DonorManager />} />
            <Route path="/donor-profile/:donorId" element={<DonorProfile />} />
            <Route path="/data-library" element={<DataLibrary />} />
            <Route path="/auth-admin" element={<AuthAdmin />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/email-analytics" element={<EmailAnalytics />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </PageTransitionWrapper>
        {ENABLE_GIVING_ASSISTANT && (
          <>
            <ResizableChatSidebar />
            <FloatingChatButton />
          </>
        )}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          
          {/* Protected routes with authenticated layout */}
          <Route path="/*" element={
            <ProtectedRoute>
              <PageTransitionProvider>
                <ChatSidebarProvider>
                  <SidebarProvider>
                    <AuthenticatedLayout />
                  </SidebarProvider>
                </ChatSidebarProvider>
              </PageTransitionProvider>
            </ProtectedRoute>
          } />
          
          {/* Default route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
