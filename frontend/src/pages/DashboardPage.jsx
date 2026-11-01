import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Banknote,
  ShoppingBag,
  Flame,
  UtensilsCrossed,
  CalendarDays,
  ArrowUpRight,
  RefreshCw,
  Clock,
  Receipt
} from 'lucide-react';
import BillReceiptModal from '../components/BillReceiptModal';
import { formatCurrency } from '../utils/format';

export default function DashboardPage({ setActiveTab }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getDashboardMetrics();
      setData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const handleOpenReceipt = async (orderId) => {
    try {
      const res = await api.getOrder(orderId);
      setSelectedOrder(res.data);
      setIsReceiptOpen(true);
    } catch (err) {
      alert(`Could not load order details: ${err.message}`);
    }
  };

  if (loading && !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '60px 0' }}>
        <RefreshCw size={28} className="spin" color="var(--accent-primary)" />
        <p style={{ marginTop: '12px', color: 'var(--text-secondary)' }}>Loading live database metrics...</p>
      </div>
    );
  }

  const { metrics, tables, reservations, recent_orders = [] } = data || {};

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dashboard</h1>
          <p className="page-subtitle">Real-time relational database analytics and floor monitoring</p>
        </div>
        <button onClick={fetchMetrics} className="btn btn-secondary btn-sm" disabled={loading}>
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Data
        </button>
      </div>

      {error && (
        <div className="badge badge-occupied" style={{ padding: '10px 16px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Metrics Cards Grid */}
      <div className="metrics-grid">
        {/* Gross Revenue */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Revenue (Paid)</span>
            <div className="metric-icon-box" style={{ background: 'var(--accent-emerald-subtle)', color: 'var(--accent-emerald)' }}>
              <Banknote size={20} />
            </div>
          </div>
          <div className="metric-value">
            {formatCurrency(metrics?.total_revenue_all_time)}
          </div>
          <div className="metric-sub">
            Today: <strong>{formatCurrency(metrics?.revenue_today)}</strong>
          </div>
        </div>

        {/* Total Orders */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Total Orders</span>
            <div className="metric-icon-box" style={{ background: 'var(--accent-blue-subtle)', color: 'var(--accent-blue)' }}>
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="metric-value">{metrics?.total_orders_all_time || 0}</div>
          <div className="metric-sub">
            Orders placed today: <strong>{metrics?.orders_today || 0}</strong>
          </div>
        </div>

        {/* Active Orders */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Active Orders</span>
            <div className="metric-icon-box" style={{ background: 'var(--accent-primary-subtle)', color: 'var(--accent-primary)' }}>
              <Flame size={20} />
            </div>
          </div>
          <div className="metric-value" style={{ color: 'var(--accent-primary)' }}>
            {metrics?.active_orders_count || 0}
          </div>
          <div className="metric-sub">Currently in placed/preparing/served</div>
        </div>

        {/* Table Availability */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Floor Occupancy</span>
            <div className="metric-icon-box" style={{ background: 'var(--accent-cyan-subtle)', color: 'var(--accent-cyan)' }}>
              <UtensilsCrossed size={20} />
            </div>
          </div>
          <div className="metric-value">
            {tables?.occupied_tables || 0} / {tables?.total_tables || 0}
          </div>
          <div className="metric-sub">
            <span style={{ color: 'var(--accent-emerald)' }}>{tables?.available_tables || 0} available</span>,{' '}
            <span style={{ color: 'var(--accent-primary)' }}>{tables?.reserved_tables || 0} reserved</span>
          </div>
        </div>

        {/* Reservations Today */}
        <div className="metric-card">
          <div className="metric-header">
            <span className="metric-label">Reservations Today</span>
            <div className="metric-icon-box" style={{ background: 'var(--accent-purple-subtle)', color: 'var(--accent-purple)' }}>
              <CalendarDays size={20} />
            </div>
          </div>
          <div className="metric-value">{reservations?.reservations_today || 0}</div>
          <div className="metric-sub">
            Confirmed pending: <strong>{reservations?.pending_reservations_today || 0}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Floor Status & Recent Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))', gap: '24px' }}>
        {/* Recent Orders Card */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Recent Customer Orders</h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              View All <ArrowUpRight size={14} />
            </button>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Table</th>
                  <th>Staff</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recent_orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No orders placed yet. Place your first order in Order Management!
                    </td>
                  </tr>
                ) : (
                  recent_orders.map((o) => (
                    <tr key={o.order_id}>
                      <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{o.order_number}</td>
                      <td>{o.table_number || 'Takeaway'}</td>
                      <td>{o.staff_name || 'Staff'}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '600' }}>
                        {formatCurrency(o.final_amount)}
                      </td>
                      <td>
                        <span className={`badge badge-${o.order_status}`}>{o.order_status}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenReceipt(o.order_id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          title="View Bill / Receipt"
                        >
                          <Receipt size={13} /> Bill
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations & Table Status Summary */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: '700' }}>Floor Occupancy Summary</h3>
            <button
              onClick={() => setActiveTab('tables')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.78rem' }}
            >
              Manage Tables <ArrowUpRight size={14} />
            </button>
          </div>

          {/* Floor Capacity Bar */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px', color: 'var(--text-secondary)' }}>
              <span>Total Floor Capacity</span>
              <span>
                {tables?.total_tables > 0
                  ? Math.round(((tables?.occupied_tables || 0) / tables.total_tables) * 100)
                  : 0}
                % Occupied
              </span>
            </div>
            <div style={{ width: '100%', height: '10px', backgroundColor: 'var(--bg-input)', borderRadius: '999px', overflow: 'hidden', display: 'flex' }}>
              <div
                style={{
                  width: `${tables?.total_tables ? ((tables.occupied_tables || 0) / tables.total_tables) * 100 : 0}%`,
                  backgroundColor: 'var(--accent-rose)',
                  transition: 'width 0.3s'
                }}
                title="Occupied"
              ></div>
              <div
                style={{
                  width: `${tables?.total_tables ? ((tables.reserved_tables || 0) / tables.total_tables) * 100 : 0}%`,
                  backgroundColor: 'var(--accent-primary)',
                  transition: 'width 0.3s'
                }}
                title="Reserved"
              ></div>
              <div
                style={{
                  width: `${tables?.total_tables ? ((tables.available_tables || 0) / tables.total_tables) * 100 : 0}%`,
                  backgroundColor: 'var(--accent-emerald)',
                  transition: 'width 0.3s'
                }}
                title="Available"
              ></div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            <button
              onClick={() => setActiveTab('orders')}
              className="btn btn-primary"
              style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
            >
              <ShoppingBag size={22} />
              <span>New Order</span>
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className="btn btn-secondary"
              style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
            >
              <CalendarDays size={22} color="var(--accent-primary)" />
              <span>Book Table</span>
            </button>
            <button
              onClick={() => setActiveTab('kitchen')}
              className="btn btn-secondary"
              style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
            >
              <Flame size={22} color="var(--accent-purple)" />
              <span>Kitchen Display</span>
            </button>
            <button
              onClick={() => setActiveTab('billing')}
              className="btn btn-secondary"
              style={{ padding: '16px', flexDirection: 'column', gap: '8px' }}
            >
              <Receipt size={22} color="var(--accent-emerald)" />
              <span>Billing & Payments</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bill & Receipt Modal */}
      <BillReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={selectedOrder}
        onPaymentSuccess={fetchMetrics}
      />
    </div>
  );
}
