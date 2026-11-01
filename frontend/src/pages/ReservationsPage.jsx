import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  CalendarDays,
  Plus,
  Filter,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    table_id: '',
    customer_name: '',
    customer_phone: '',
    customer_email: '',
    reservation_time: '',
    party_size: 2,
    special_requests: ''
  });

  const fetchReservations = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (dateFilter) params += `date=${dateFilter}&`;
      if (statusFilter) params += `status=${statusFilter}&`;

      const [resRes, tablesRes] = await Promise.all([
        api.getReservations(params),
        api.getTables()
      ]);

      setReservations(resRes.reservations || []);
      setTables(tablesRes.data || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch reservations.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [dateFilter, statusFilter]);

  const handleOpenCreate = () => {
    // Default to tomorrow 19:00
    const tomorrow = new Date(Date.now() + 86400000);
    const dateStr = tomorrow.toISOString().slice(0, 10);

    setForm({
      table_id: tables.length > 0 ? tables[0].table_id : '',
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      reservation_time: `${dateStr}T19:00`,
      party_size: 2,
      special_requests: ''
    });
    setIsModalOpen(true);
  };

  const handleCreateReservation = async (e) => {
    e.preventDefault();
    try {
      // Format datetime to MySQL DATETIME format YYYY-MM-DD HH:MM:SS
      const formattedTime = form.reservation_time.replace('T', ' ') + ':00';

      await api.createReservation({
        table_id: parseInt(form.table_id, 10),
        customer_name: form.customer_name,
        customer_phone: form.customer_phone,
        customer_email: form.customer_email || null,
        reservation_time: formattedTime,
        party_size: parseInt(form.party_size, 10),
        special_requests: form.special_requests || null
      });

      setIsModalOpen(false);
      setToast({ type: 'success', message: 'Reservation confirmed! Conflict check passed.' });
      fetchReservations();
    } catch (err) {
      alert(`Reservation Failed:\n${err.message}`);
    }
  };

  const handleStatusChange = async (resId, newStatus) => {
    try {
      await api.updateReservationStatus(resId, newStatus);
      setToast({ type: 'success', message: `Reservation marked as '${newStatus}'.` });
      fetchReservations();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Status update failed.' });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Reservation Management</h1>
          <p className="page-subtitle">Customer table bookings with 2-hour scheduling conflict prevention</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchReservations} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <Plus size={16} /> Book Reservation
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Date:</span>
            <input
              type="date"
              className="form-control"
              style={{ width: '160px', padding: '8px 12px' }}
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="no_show">No Show</option>
            </select>
          </div>

          {(dateFilter || statusFilter) && (
            <button
              onClick={() => {
                setDateFilter('');
                setStatusFilter('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Reservations Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer Name</th>
                <th>Phone / Email</th>
                <th>Assigned Table</th>
                <th>Booking Time</th>
                <th>Party Size</th>
                <th>Special Requests</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reservations.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No reservations found. Click "Book Reservation" to schedule a table.
                  </td>
                </tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.reservation_id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{r.customer_name}</td>
                    <td>
                      <div>{r.customer_phone}</div>
                      {r.customer_email && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.customer_email}</div>
                      )}
                    </td>
                    <td>
                      <strong>{r.table_number}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                        (Max {r.table_capacity}p)
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600' }}>{r.reservation_time?.slice(0, 10)}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                        {r.reservation_time?.slice(11, 16)}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Users size={14} color="var(--text-muted)" /> {r.party_size} guests
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {r.special_requests || '—'}
                    </td>
                    <td>
                      <span className={`badge badge-${r.status}`}>{r.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {r.status === 'confirmed' && (
                          <>
                            <button
                              onClick={() => handleStatusChange(r.reservation_id, 'completed')}
                              className="btn btn-success btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              title="Mark Arrived & Completed"
                            >
                              Arrived
                            </button>
                            <button
                              onClick={() => handleStatusChange(r.reservation_id, 'cancelled')}
                              className="btn btn-danger btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                              title="Cancel Reservation"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Book Reservation Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Book Table Reservation">
        <form onSubmit={handleCreateReservation}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Customer Full Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Zainab Fatima"
                required
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="+92-300-..."
                required
                value={form.customer_phone}
                onChange={(e) => setForm({ ...form, customer_phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address (Optional)</label>
            <input
              type="email"
              className="form-control"
              placeholder="customer@example.com"
              value={form.customer_email}
              onChange={(e) => setForm({ ...form, customer_email: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Select Table *</label>
              <select
                className="form-control"
                required
                value={form.table_id}
                onChange={(e) => setForm({ ...form, table_id: e.target.value })}
              >
                {tables.map((t) => (
                  <option key={t.table_id} value={t.table_id}>
                    {t.table_number} ({t.capacity} Seats) - {t.location_notes || 'Dining Hall'}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Party Size (Guests) *</label>
              <input
                type="number"
                min="1"
                max="30"
                className="form-control"
                required
                value={form.party_size}
                onChange={(e) => setForm({ ...form, party_size: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reservation Date & Time *</label>
            <input
              type="datetime-local"
              className="form-control"
              required
              value={form.reservation_time}
              onChange={(e) => setForm({ ...form, reservation_time: e.target.value })}
            />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Database checks for existing bookings within ±2 hours of selected time slot.
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Special Requests & Notes</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Birthday celebration, window preference, high chair"
              value={form.special_requests}
              onChange={(e) => setForm({ ...form, special_requests: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Confirm Booking
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
