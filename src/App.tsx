import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Dashboard from './pages/Dashboard';
import FundraisingManager from './pages/FundraisingManager';
import DonorManager from './pages/DonorManager';
import DonorProfile from './pages/DonorProfile';
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
import NewDashboard from './pages/NewDashBoard';
import NewDashboard2 from './pages/NewDashboard2';
import UnifiedHeader from './components/navigation/UnifiedHeader';
import PageTransitionWrapper from './components/transitions/PageTransitionWrapper';

// AuthenticatedLayout component that includes sidebar and other app elements
const AuthenticatedLayout = () => {
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
            <Route path="/new-dashboard" element={<NewDashboard />} />
            <Route path="/new-dashboard2" element={<NewDashboard2 />} />
            <Route path="*" element={<Navigate to="/new-dashboard" replace />} />
          </Routes>
        </PageTransitionWrapper>
        <ResizableChatSidebar />
        <FloatingChatButton />
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
