
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Header = ({ onToggleSidebar }) => {
  const { user, handleLogout } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      setNotifications(response.data.filter(n => !n.is_read).slice(0, 5));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`/notifications/${notificationId}/read`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  return (
    <header className="bg-white shadow-sm border-bottom px-4 py-3">
      <div className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <button 
            className="btn btn-link text-dark p-0 me-3"
            onClick={onToggleSidebar}
          >
            <i className="fas fa-bars"></i>
          </button>
          <h4 className="mb-0 text-primary">Smart Procurement Portal</h4>
        </div>

        <div className="d-flex align-items-center">
          {/* Notifications */}
          <div className="dropdown me-3">
            <button
              className="btn btn-link text-dark position-relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <i className="fas fa-bell"></i>
              {notifications.length > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="dropdown-menu dropdown-menu-end show" style={{ width: '300px' }}>
                <div className="dropdown-header">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="dropdown-item text-center text-muted">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className="dropdown-item cursor-pointer"
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="fw-bold">{notification.title}</div>
                      <div className="small text-muted">{notification.message}</div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="dropdown">
            <button
              className="btn btn-link text-dark d-flex align-items-center"
              data-bs-toggle="dropdown"
            >
              <div className="me-2">
                <div className="fw-bold">{user.first_name} {user.last_name}</div>
                <div className="small text-muted">{user.role}</div>
              </div>
              <i className="fas fa-user-circle fs-4"></i>
            </button>
            <ul className="dropdown-menu dropdown-menu-end">
              <li><a className="dropdown-item" href="#profile"><i className="fas fa-user me-2"></i>Profile</a></li>
              <li><a className="dropdown-item" href="#settings"><i className="fas fa-cog me-2"></i>Settings</a></li>
              <li><hr className="dropdown-divider" /></li>
              <li>
                <button 
                  className="dropdown-item text-danger"
                  onClick={handleLogout}
                >
                  <i className="fas fa-sign-out-alt me-2"></i>Logout
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
