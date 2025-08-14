import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Dashboard from './pages/Dashboard';
import FundraisingManager from './pages/FundraisingManager';
import DonorManager from './pages/DonorManager';
import DonorProfile from './pages/DonorProfile';
import SidebarView from './components/sidebar';
import ResizableChatSidebar from './components/chat/ResizableChatSidebar';
import FloatingChatButton from './components/chat/FloatingChatButton';
import { ChatSidebarProvider } from './context/ChatSidebarContext';
import { SidebarProvider, useSidebar } from './context/SidebarContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import AuthAdmin from './pages/AuthAdmin';
import AuthCallback from './pages/AuthCallback';
import DataLibrary from './pages/DataLibrary';
import './App.css';
import './pages/styles/Dashboard.css';
import Metrics from './pages/Metrics';
import NewDashboard from './pages/NewDashBoard';

// AuthenticatedLayout component that includes sidebar and other app elements
const AuthenticatedLayout = () => {
  const { isCollapsed } = useSidebar();
  
  return (
    <div className="app-container">
      <SidebarView />
      <div className={`content-wrapper ${isCollapsed ? 'sidebar-collapsed' : ''}`}>
        <div className="main-content">
          <Routes>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/fundraising-manager" element={<FundraisingManager />} />
            <Route path="/donor-manager" element={<DonorManager />} />
            <Route path="/donor-profile/:donorId" element={<DonorProfile />} />
            <Route path="/data-library" element={<DataLibrary />} />
            <Route path="/auth-admin" element={<AuthAdmin />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/new-dashboard" element={<NewDashboard />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
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
              <ChatSidebarProvider>
                <SidebarProvider>
                  <AuthenticatedLayout />
                </SidebarProvider>
              </ChatSidebarProvider>
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
