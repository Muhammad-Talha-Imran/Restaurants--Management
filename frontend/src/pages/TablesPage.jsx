import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  UtensilsCrossed,
  Plus,
  Filter,
  Users,
  CheckCircle,
  Clock,
  AlertCircle,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function TablesPage() {
  const { isAdmin } = useAuth();
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  const [form, setForm] = useState({
    table_number: '',
    capacity: 4,
    status: 'available',
    location_notes: ''
  });

  const fetchTables = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (statusFilter) params += `status=${statusFilter}&`;
      if (capacityFilter) params += `minCapacity=${capacityFilter}&`;

      const res = await api.getTables(params);
      setTables(res.data);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch tables.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, [statusFilter, capacityFilter]);

  const handleOpenCreate = () => {
    setEditingTable(null);
    setForm({
      table_number: '',
      capacity: 4,
      status: 'available',
      location_notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTable(t);
    setForm({
      table_number: t.table_number,
      capacity: t.capacity,
      status: t.status,
      location_notes: t.location_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTable) {
        await api.updateTable(editingTable.table_id, form);
        setToast({ type: 'success', message: `Table ${form.table_number} updated successfully.` });
      } else {
        await api.createTable(form);
        setToast({ type: 'success', message: `Table ${form.table_number} created successfully.` });
      }
      setIsModalOpen(false);
      fetchTables();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save table.' });
    }
  };

  const handleQuickStatusChange = async (tableId, newStatus) => {
    try {
      await api.updateTableStatus(tableId, newStatus);
      fetchTables();
      setToast({ type: 'success', message: `Table status changed to ${newStatus}.` });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Status update failed.' });
    }
  };

  const handleDelete = async (tableId, tableNumber) => {
    if (!window.confirm(`Are you sure you want to remove or deactivate table ${tableNumber}?`)) return;
    try {
      const res = await api.deleteTable(tableId);
      setToast({ type: 'info', message: res.message });
      fetchTables();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete table.' });
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">Floor plan layout, seating capacity, and real-time occupancy status</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchTables} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
              <Plus size={16} /> Add Table
            </button>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            <Filter size={16} /> Filters:
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
            >
              <option value="">Any Capacity</option>
              <option value="2">2+ Guests</option>
              <option value="4">4+ Guests</option>
              <option value="6">6+ Guests</option>
              <option value="8">8+ Guests (VIP)</option>
            </select>
          </div>

          {(statusFilter || capacityFilter) && (
            <button
              onClick={() => {
                setStatusFilter('');
                setCapacityFilter('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset Filters
            </button>
          )}

          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }}></span>
              Available
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-rose)' }}></span>
              Occupied
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-primary)' }}></span>
              Reserved
            </span>
          </div>
        </div>
      </div>

      {/* Floor Plan Grid */}
      {tables.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <UtensilsCrossed size={42} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
          <h3>No Tables Found</h3>
          <p style={{ marginTop: '8px', fontSize: '0.88rem' }}>
            No tables match the current filters. Clear filters or add a new table.
          </p>
        </div>
      ) : (
        <div className="floor-grid">
          {tables.map((t) => {
            return (
              <div key={t.table_id} className={`table-tile status-${t.status}`}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-0.02em' }}>
                      {t.table_number}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <Users size={14} /> {t.capacity} Seats
                    </div>
                  </div>
                  <span className={`badge badge-${t.status}`}>{t.status}</span>
                </div>

                {t.location_notes && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {t.location_notes}
                  </div>
                )}

                {t.active_order_number && (
                  <div
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '6px 8px',
                      fontSize: '0.75rem',
                      color: 'var(--accent-rose)',
                      fontWeight: '600'
                    }}
                  >
                    Active: {t.active_order_number} ({t.active_order_status})
                  </div>
                )}

                {/* Quick Status Control */}
                <div style={{ marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: '600' }}>
                    Change Status:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                    <button
                      onClick={() => handleQuickStatusChange(t.table_id, 'available')}
                      disabled={t.status === 'available'}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 4px', fontSize: '0.68rem' }}
                      title="Mark Available"
                    >
                      Avail
                    </button>
                    <button
                      onClick={() => handleQuickStatusChange(t.table_id, 'occupied')}
                      disabled={t.status === 'occupied'}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 4px', fontSize: '0.68rem' }}
                      title="Mark Occupied"
                    >
                      Occ
                    </button>
                    <button
                      onClick={() => handleQuickStatusChange(t.table_id, 'reserved')}
                      disabled={t.status === 'reserved'}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '3px 4px', fontSize: '0.68rem' }}
                      title="Mark Reserved"
                    >
                      Res
                    </button>
                  </div>
                </div>

                {/* Admin Edit/Delete */}
                {isAdmin && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '6px' }}>
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      title="Edit Table Details"
                    >
                      <Edit2 size={12} /> Edit
                    </button>
                    <button
                      onClick={() => handleDelete(t.table_id, t.table_number)}
                      className="btn btn-danger btn-sm"
                      style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                      title="Delete / Deactivate Table"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Table Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingTable ? `Edit Table ${editingTable.table_number}` : 'Add New Restaurant Table'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Table Number / Label *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. T-11 or VIP-01"
              required
              value={form.table_number}
              onChange={(e) => setForm({ ...form, table_number: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Seating Capacity (Guests) *</label>
            <input
              type="number"
              min="1"
              max="50"
              className="form-control"
              required
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value, 10) || 1 })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Initial Status</label>
            <select
              className="form-control"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Location / Floor Notes</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Window Side, Outdoor Patio, Main Hall"
              value={form.location_notes}
              onChange={(e) => setForm({ ...form, location_notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingTable ? 'Save Changes' : 'Create Table'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
