
import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Sidebar = ( {isOpen ,onToggleSidebar}) => {
  const { user } = useAuth();

  const menuItems = [
    {
      path: '/dashboard',
      icon: 'fas fa-tachometer-alt',
      label: 'Dashboard',
      roles: ['Admin', 'Procurement Manager', 'Employee', 'Vendor']
    },
    {
      path: '/requisitions',
      icon: 'fas fa-file-alt',
      label: 'Requisitions',
      roles: ['Admin', 'Procurement Manager', 'Employee']
    },
    {
      path: '/vendors',
      icon: 'fas fa-building',
      label: 'Vendors',
      roles: ['Admin', 'Procurement Manager']
    },
    {
      path: '/tenders',
      icon: 'fas fa-gavel',
      label: 'Tenders',
      roles: ['Admin', 'Procurement Manager', 'Vendor']
    },
    {
      path: '/bids',
      icon: 'fas fa-hand-paper',
      label: 'Bids',
      roles: ['Admin', 'Procurement Manager', 'Vendor']
    },
    {
      path: '/purchase-orders',
      icon: 'fas fa-shopping-cart',
      label: 'Purchase Orders',
      roles: ['Admin', 'Procurement Manager', 'Employee', 'Vendor']
    },
    {
      path: '/invoices',
      icon: 'fas fa-file-invoice',
      label: 'Invoices',
      roles: ['Admin', 'Procurement Manager', 'Vendor']
    },
    {
      path: '/analytics',
      icon: 'fas fa-chart-line',
      label: 'Analytics',
      roles: ['Admin', 'Procurement Manager']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user.role)
  );

  return (
    <div 
      className={`bg-dark text-white position-fixed h-100 ${isOpen ? 'd-block' : 'd-none'}`}
      style={{ width: '250px', zIndex: 1050 }}
    >
      <div className="p-3 border-bottom border-secondary" onClick={onToggleSidebar}>
        <h5 className="mb-0">
          <i className="fas fa-store me-2"></i>
          Procurement Portal
        </h5>
      </div>

      <nav className="p-3">
        <ul className="nav flex-column">
          {filteredMenuItems.map(item => (
            <li key={item.path} className="nav-item mb-2">
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `nav-link text-white d-flex align-items-center py-2 px-3 rounded ${
                    isActive ? 'bg-primary' : ''
                  }`
                }
                style={{ textDecoration: 'none' }}
              >
                <i className={`${item.icon} me-3`}></i>
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default Sidebar;
