
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import Header from './Header';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="d-flex">
      <Sidebar isOpen={sidebarOpen} onToggleSidebar={toggleSidebar}/>
      <div className={`flex-grow-1 ${sidebarOpen ? 'ms-250' : 'ms-0'}`}>
        <Header onToggleSidebar={toggleSidebar} />
        <main className="p-4">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
