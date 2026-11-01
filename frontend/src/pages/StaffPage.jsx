import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  UserX,
  Edit2,
  Lock,
  RefreshCw
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';

export default function StaffPage() {
  const { user } = useAuth();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [form, setForm] = useState({
    full_name: '',
    role: 'waiter',
    phone: '',
    email: '',
    username: '',
    password: ''
  });

  const fetchStaff = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (roleFilter) params += `role=${roleFilter}&`;
      if (search) params += `search=${encodeURIComponent(search)}&`;

      const res = await api.getStaff(params);
      setStaffList(res.data || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch staff members.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, [roleFilter]);

  const handleOpenCreate = () => {
    setEditingStaff(null);
    setForm({
      full_name: '',
      role: 'waiter',
      phone: '',
      email: '',
      username: '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s) => {
    setEditingStaff(s);
    setForm({
      full_name: s.full_name,
      role: s.role,
      phone: s.phone,
      email: s.email,
      username: s.username || '',
      password: ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await api.updateStaff(editingStaff.staff_id, {
          full_name: form.full_name,
          role: form.role,
          phone: form.phone,
          email: form.email
        });
        setToast({ type: 'success', message: `Staff member '${form.full_name}' updated.` });
      } else {
        await api.createStaff(form);
        setToast({ type: 'success', message: `Staff member '${form.full_name}' registered.` });
      }
      setIsModalOpen(false);
      fetchStaff();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save staff record.' });
    }
  };

  const handleDeactivate = async (s) => {
    if (s.staff_id === user.staff_id) {
      alert('You cannot deactivate your own currently active account.');
      return;
    }
    if (!window.confirm(`Deactivate staff member '${s.full_name}' and disable login?`)) return;

    try {
      await api.deactivateStaff(s.staff_id);
      setToast({ type: 'info', message: `'${s.full_name}' deactivated.` });
      fetchStaff();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Deactivation failed.' });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-subtitle">Provision employee roles, access credentials, and track order performance</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchStaff} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={handleOpenCreate} className="btn btn-primary btn-sm">
            <Plus size={16} /> Add Staff Member
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filter Toolbar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="manager">Manager</option>
              <option value="waiter">Waiter</option>
              <option value="cashier">Cashier</option>
              <option value="kitchen">Kitchen Chef</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ padding: '8px 12px' }}
              placeholder="Search by name, phone, or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchStaff()}
            />
          </div>

          <button onClick={fetchStaff} className="btn btn-secondary btn-sm">
            Search
          </button>
        </div>
      </div>

      {/* Staff Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Username</th>
                <th>Orders Handled</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No staff members found.
                  </td>
                </tr>
              ) : (
                staffList.map((s) => (
                  <tr key={s.staff_id}>
                    <td>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{s.full_name}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Staff ID: #{s.staff_id}</div>
                    </td>
                    <td>
                      <span className={`badge ${s.role === 'admin' ? 'badge-reserved' : 'badge-placed'}`}>
                        {s.role}
                      </span>
                    </td>
                    <td>{s.phone}</td>
                    <td>{s.email}</td>
                    <td>
                      {s.username ? (
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--accent-primary)' }}>
                          @{s.username}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>No login account</span>
                      )}
                    </td>
                    <td>{s.total_orders_handled || 0}</td>
                    <td>
                      <span className={`badge ${s.is_active ? 'badge-available' : 'badge-occupied'}`}>
                        {s.is_active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '5px 8px' }}
                          title="Edit Details"
                        >
                          <Edit2 size={13} />
                        </button>
                        {s.is_active && (
                          <button
                            onClick={() => handleDeactivate(s)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Deactivate Staff Member"
                          >
                            <UserX size={13} />
                          </button>
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

      {/* Add / Edit Staff Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingStaff ? `Edit Staff Member: ${editingStaff.full_name}` : 'Register New Staff Member'}
      >
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Muhammad Hammad"
              required
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Role *</label>
              <select
                className="form-control"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="waiter">Waiter / Floor Staff</option>
                <option value="cashier">Cashier</option>
                <option value="kitchen">Kitchen Chef</option>
                <option value="manager">Restaurant Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Phone Number *</label>
              <input
                type="text"
                className="form-control"
                placeholder="+92-300-..."
                required
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="form-control"
              placeholder="staff@restaurant.local"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          {!editingStaff && (
            <div style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
              <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '10px', color: 'var(--accent-primary)' }}>
                System Login Credentials (Optional)
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. hammad"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingStaff ? 'Save Changes' : 'Register Employee'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
