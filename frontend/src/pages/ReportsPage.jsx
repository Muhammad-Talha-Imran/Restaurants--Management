import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  Banknote,
  Award,
  Users,
  Layers,
  Calendar,
  RefreshCw
} from 'lucide-react';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/format';

export default function ReportsPage() {
  const [sales, setSales] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [categorySales, setCategorySales] = useState([]);
  const [staffPerf, setStaffPerf] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [toast, setToast] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      let salesParams = '?';
      if (startDate) salesParams += `startDate=${startDate}&`;
      if (endDate) salesParams += `endDate=${endDate}&`;

      const [salesRes, topRes, catRes, staffRes] = await Promise.all([
        api.getSalesReport(salesParams),
        api.getTopItems(10),
        api.getCategorySales(),
        api.getStaffPerformance()
      ]);

      setSales(salesRes.data || []);
      setTopItems(topRes.data || []);
      setCategorySales(catRes.data || []);
      setStaffPerf(staffRes.data || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch analytics reports.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [startDate, endDate]);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports & SQL Analytics</h1>
          <p className="page-subtitle">Complex aggregation queries, views, and operational performance insights</p>
        </div>
        <button onClick={fetchReports} className="btn btn-secondary btn-sm">
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Reports
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Date Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Calendar size={16} /> Sales Period:
          </div>
          <input
            type="date"
            className="form-control"
            style={{ width: '160px', padding: '8px 12px' }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)' }}>to</span>
          <input
            type="date"
            className="form-control"
            style={{ width: '160px', padding: '8px 12px' }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Date Range
            </button>
          )}
        </div>
      </div>

      {/* Grid: Daily Sales & Top Selling Items */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        {/* 1. Daily Sales Report (from v_daily_sales_report) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <TrendingUp size={20} color="var(--accent-emerald)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Daily Revenue & Volume</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aggregated from view: <code>v_daily_sales_report</code>
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Orders</th>
                  <th>Revenue (PKR)</th>
                  <th>Tax Collected</th>
                  <th>Avg Ticket</th>
                </tr>
              </thead>
              <tbody>
                {sales.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No sales data recorded for the selected period.
                    </td>
                  </tr>
                ) : (
                  sales.map((s) => (
                    <tr key={s.sales_date}>
                      <td style={{ fontWeight: '600' }}>{s.sales_date}</td>
                      <td>{s.total_orders_count} orders ({s.billed_orders_count} paid)</td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                          {formatCurrency(s.total_revenue)}
                        </strong>
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {formatCurrency(s.total_tax_collected)}
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(s.average_order_value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. Top-Selling Menu Items (from v_item_sales_ranking) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Award size={20} color="var(--accent-primary)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Best-Selling Dishes & Drinks</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Aggregated from view: <code>v_item_sales_ranking</code>
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Rank & Dish</th>
                  <th>Category</th>
                  <th>Units Sold</th>
                  <th>Gross Sales</th>
                </tr>
              </thead>
              <tbody>
                {topItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No sales recorded yet. Once orders are billed, bestsellers will appear here.
                    </td>
                  </tr>
                ) : (
                  topItems.map((item, idx) => (
                    <tr key={item.item_id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '22px',
                              height: '22px',
                              borderRadius: '50%',
                              backgroundColor: idx === 0 ? 'var(--accent-primary)' : 'var(--bg-surface-elevated)',
                              color: idx === 0 ? '#0f172a' : 'var(--text-primary)',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {idx + 1}
                          </span>
                          <span style={{ fontWeight: '600' }}>{item.item_name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-placed" style={{ fontSize: '0.7rem' }}>
                          {item.category_name}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700' }}>{item.total_units_sold} units</td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                          {formatCurrency(item.total_gross_sales)}
                        </strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Grid: Category Sales & Staff Performance */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        {/* 3. Category Sales Distribution */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={20} color="var(--accent-cyan)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Sales by Menu Category</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Demonstrates SQL: <code>GROUP BY categories.category_id</code>
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Orders</th>
                  <th>Total Items Sold</th>
                  <th>Revenue (PKR)</th>
                </tr>
              </thead>
              <tbody>
                {categorySales.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No category sales data available.
                    </td>
                  </tr>
                ) : (
                  categorySales.map((c) => (
                    <tr key={c.category_id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.category_name}</td>
                      <td>{c.total_orders} orders</td>
                      <td>{c.total_quantity_sold} qty</td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-primary)' }}>
                          {formatCurrency(c.total_sales)}
                        </strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Staff Order Performance */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Users size={20} color="var(--accent-purple)" />
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: '800' }}>Staff Activity & Sales Handled</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Demonstrates SQL: <code>LEFT JOIN staff o GROUP BY staff.staff_id</code>
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Orders Handled</th>
                  <th>Revenue Generated</th>
                </tr>
              </thead>
              <tbody>
                {staffPerf.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      No staff activity data available.
                    </td>
                  </tr>
                ) : (
                  staffPerf.map((s) => (
                    <tr key={s.staff_id}>
                      <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.full_name}</td>
                      <td>
                        <span className={`badge ${s.role === 'admin' ? 'badge-reserved' : 'badge-placed'}`}>
                          {s.role}
                        </span>
                      </td>
                      <td>{s.total_orders} total ({s.billed_orders} completed)</td>
                      <td>
                        <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-emerald)' }}>
                          {formatCurrency(s.revenue_handled)}
                        </strong>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
