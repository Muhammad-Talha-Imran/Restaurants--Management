import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Contact2, Search, CalendarDays, ShoppingBag, RefreshCw } from 'lucide-react';
import Toast from '../components/Toast';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (search) params += `search=${encodeURIComponent(search)}&`;

      const res = await api.getCustomers(params);
      setCustomers(res.customers || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch customers.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Customer Directory</h1>
          <p className="page-subtitle">Unified dining history, contact records, and loyalty statistics</p>
        </div>
        <button onClick={fetchCustomers} className="btn btn-secondary btn-sm">
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Search Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchCustomers();
          }}
          style={{ display: 'flex', gap: '14px' }}
        >
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px' }}
              placeholder="Search customer by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button type="submit" className="btn btn-secondary">
            Search
          </button>
        </form>
      </div>

      {/* Customers Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Notes / Preferences</th>
                <th>Reservations</th>
                <th>Orders</th>
                <th>Registered Since</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No customer records found. Customers are automatically linked when booking reservations or placing orders.
                  </td>
                </tr>
              ) : (
                customers.map((c) => (
                  <tr key={c.customer_id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{c.full_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>ID: #{c.customer_id}</div>
                    </td>
                    <td>{c.phone}</td>
                    <td>{c.email || '—'}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {c.notes || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <CalendarDays size={14} color="var(--accent-primary)" />
                        <span>{c.total_reservations || 0}</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <ShoppingBag size={14} color="var(--accent-blue)" />
                        <span>{c.total_orders || 0}</span>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {c.created_at?.slice(0, 10)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
