import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Database, ShieldCheck, UserCheck } from 'lucide-react';

export default function Header({ activeTab }) {
  const { user, isAdmin } = useAuth();

  const titles = {
    dashboard: { title: 'Executive Dashboard', subtitle: 'Live relational metrics, sales KPIs, and floor status' },
    tables: { title: 'Table Management', subtitle: 'Real-time floor occupancy, capacity, and table assignments' },
    orders: { title: 'Order Management', subtitle: 'Take customer orders, track lifecycle, and manage order items' },
    kitchen: { title: 'Kitchen Display System', subtitle: 'Kitchen order dispatch, preparation queues, and service progression' },
    reservations: { title: 'Reservation Management', subtitle: 'Table booking calendar with 2-hour conflict prevention' },
    billing: { title: 'Billing & Payments', subtitle: 'Generate itemized bills, record payments, and print customer receipts' },
    menu: { title: 'Menu & Category Catalog', subtitle: 'Manage restaurant categories, prices, and item availability' },
    customers: { title: 'Customer Directory', subtitle: 'Customer contact history, orders, and reservation records' },
    staff: { title: 'Staff & Account Management', subtitle: 'Administrative staff provisioning and role permissions' },
    reports: { title: 'Reports & SQL Analytics', subtitle: 'Daily sales summaries, top-selling items, and staff performance' }
  };

  const current = titles[activeTab] || { title: 'Restaurant Management', subtitle: 'DBMS Final Project' };

  return (
    <header className="top-header">
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>{current.title}</h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{current.subtitle}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Live Database Engine Badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}
          title="Relational MySQL Engine Connected"
        >
          <Database size={15} color="#10b981" />
          <span>MySQL / MariaDB</span>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></span>
        </div>

        {/* User Role Tag */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            padding: '6px 14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.82rem'
          }}
        >
          {isAdmin ? <ShieldCheck size={16} color="#f59e0b" /> : <UserCheck size={16} color="#3b82f6" />}
          <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{user?.username}</span>
          <span
            className={`badge ${isAdmin ? 'badge-reserved' : 'badge-placed'}`}
            style={{ fontSize: '0.7rem', padding: '2px 8px' }}
          >
            {user?.role}
          </span>
        </div>
      </div>
    </header>
  );
}
