import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  BookOpen,
  ShoppingBag,
  Flame,
  CalendarDays,
  Receipt,
  Users,
  Contact2,
  BarChart3,
  LogOut,
  ShieldCheck,
  UserCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const { user, logout, isAdmin } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Admin Dashboard', icon: LayoutDashboard, adminOnly: true },
    { id: 'tables', label: 'Table Management', icon: UtensilsCrossed },
    { id: 'orders', label: 'Order Management', icon: ShoppingBag },
    { id: 'kitchen', label: 'Kitchen / Status', icon: Flame },
    { id: 'reservations', label: 'Reservations', icon: CalendarDays },
    { id: 'billing', label: 'Billing & Payments', icon: Receipt },
    { id: 'menu', label: 'Menu & Categories', icon: BookOpen },
    { id: 'customers', label: 'Customers', icon: Contact2 },
    { id: 'staff', label: 'Staff Management', icon: Users, adminOnly: true },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3, adminOnly: true }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <UtensilsCrossed size={22} />
        </div>
        <div className="brand-text">
          <h1>GourmetOS</h1>
          <span>DBMS RESTAURANT</span>
        </div>
      </div>

      {/* Nav List */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Operations</div>
        {navItems
          .filter((item) => !item.adminOnly)
          .map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ textAlign: 'left', background: isActive ? undefined : 'transparent' }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}

        {isAdmin && (
          <>
            <div className="nav-section-label" style={{ marginTop: '12px' }}>
              Administration
            </div>
            {navItems
              .filter((item) => item.adminOnly)
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    style={{ textAlign: 'left', background: isActive ? undefined : 'transparent' }}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
          </>
        )}
      </nav>

      {/* Footer Profile & Logout */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-primary)',
                border: '1px solid var(--border-strong)',
                flexShrink: 0
              }}
            >
              {isAdmin ? <ShieldCheck size={18} /> : <UserCheck size={18} />}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden'
                }}
              >
                {user?.full_name || user?.username}
              </div>
              <div
                style={{
                  fontSize: '0.72rem',
                  color: 'var(--accent-primary)',
                  textTransform: 'uppercase',
                  fontWeight: '600'
                }}
              >
                {user?.role}
              </div>
            </div>
          </div>
          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            style={{ padding: '8px', borderRadius: 'var(--radius-sm)' }}
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
