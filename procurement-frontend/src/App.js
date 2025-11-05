
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Components
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Requisitions from './components/Requisitions';
import Vendors from './components/Vendors';
import Tenders from './components/Tenders';
import Bids from './components/Bids';
import PurchaseOrders from './components/PurchaseOrders';
import Invoices from './components/Invoices';
import Analytics from './components/Analytics';
import Layout from './components/Layout';

// Context
import { AuthProvider } from './context/AuthContext';

// Axios default config
axios.defaults.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles, userRole }) => {
  if (!allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in (check for token in localStorage)
    const token = localStorage.getItem('token');
    if (token) {
      // Set default authorization header
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Get user profile
      axios.get('/auth/profile')
        .then(response => {
          setUser(response.data);
        })
        .catch(error => {
          console.error('Token validation failed:', error);
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData, token) => {
    localStorage.setItem('token', token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <AuthProvider value={{ user, handleLogout }}>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />

            <Route 
              path="/requisitions" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager', 'Employee']} 
                  userRole={user.role}
                >
                  <Requisitions />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/vendors" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager']} 
                  userRole={user.role}
                >
                  <Vendors />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/tenders" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager', 'Vendor']} 
                  userRole={user.role}
                >
                  <Tenders />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/bids" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager', 'Vendor']} 
                  userRole={user.role}
                >
                  <Bids />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/purchase-orders" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager', 'Employee', 'Vendor']} 
                  userRole={user.role}
                >
                  <PurchaseOrders />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/invoices" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager', 'Vendor']} 
                  userRole={user.role}
                >
                  <Invoices />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute 
                  allowedRoles={['Admin', 'Procurement Manager']} 
                  userRole={user.role}
                >
                  <Analytics />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Layout>
      </Router>
    </AuthProvider>
  );
}

export default App;
