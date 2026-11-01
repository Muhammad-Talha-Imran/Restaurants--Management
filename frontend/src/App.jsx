import React, { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Page Components
import DashboardPage from './pages/DashboardPage';
import TablesPage from './pages/TablesPage';
import OrdersPage from './pages/OrdersPage';
import KitchenPage from './pages/KitchenPage';
import ReservationsPage from './pages/ReservationsPage';
import BillingPage from './pages/BillingPage';
import MenuPage from './pages/MenuPage';
import CustomersPage from './pages/CustomersPage';
import StaffPage from './pages/StaffPage';
import ReportsPage from './pages/ReportsPage';

export default function App() {
  const { user, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('tables');

  useEffect(() => {
    if (user) {
      // Direct Admin to Dashboard by default, Waiter to Floor/Tables
      if (isAdmin) {
        setActiveTab('dashboard');
      } else {
        setActiveTab('tables');
      }
    }
  }, [user?.account_id, isAdmin]);

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-main)',
          color: 'var(--text-secondary)'
        }}
      >
        Initializing GourmetOS...
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderActiveModule = () => {
    switch (activeTab) {
      case 'dashboard':
        return isAdmin ? <DashboardPage setActiveTab={setActiveTab} /> : <TablesPage />;
      case 'tables':
        return <TablesPage />;
      case 'orders':
        return <OrdersPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'reservations':
        return <ReservationsPage />;
      case 'billing':
        return <BillingPage />;
      case 'menu':
        return <MenuPage />;
      case 'customers':
        return <CustomersPage />;
      case 'staff':
        return isAdmin ? <StaffPage /> : <TablesPage />;
      case 'reports':
        return isAdmin ? <ReportsPage /> : <TablesPage />;
      default:
        return <TablesPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="main-content">
        <Header activeTab={activeTab} />
        <main>{renderActiveModule()}</main>
      </div>
    </div>
  );
}
