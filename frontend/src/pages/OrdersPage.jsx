import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { formatCurrency } from '../utils/format';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  Plus,
  Filter,
  Search,
  CheckCircle,
  Clock,
  Receipt,
  Eye,
  Trash2,
  RefreshCw,
  PlusCircle,
  MinusCircle,
  AlertCircle
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import BillReceiptModal from '../components/BillReceiptModal';

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);

  // New Order Wizard State
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [tables, setTables] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeMenuCat, setActiveMenuCat] = useState('');

  const [orderForm, setOrderForm] = useState({
    table_id: '',
    order_type: 'dine_in',
    customer_name: '',
    customer_phone: '',
    notes: '',
    items: [] // { item_id, name, price, quantity, special_instructions }
  });

  // View Order Details Modal
  const [viewOrder, setViewOrder] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Bill Receipt Modal
  const [billingOrder, setBillingOrder] = useState(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (statusFilter) params += `status=${statusFilter}&`;
      if (search) params += `search=${encodeURIComponent(search)}&`;

      const res = await api.getOrders(params);
      setOrders(res.orders || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleOpenNewOrder = async () => {
    try {
      const [tablesRes, menuRes, catRes] = await Promise.all([
        api.getTables(),
        api.getMenuItems('?is_available=true&limit=100'),
        api.getCategories()
      ]);
      setTables(tablesRes.data || []);
      setMenuItems(menuRes.items || []);
      setCategories(catRes.data || []);
      setOrderForm({
        table_id: tablesRes.data.length > 0 ? tablesRes.data[0].table_id : '',
        order_type: 'dine_in',
        customer_name: '',
        customer_phone: '',
        notes: '',
        items: []
      });
      setIsNewOrderOpen(true);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to load order wizard dependencies.' });
    }
  };

  const handleAddItemToCart = (item) => {
    const existingIndex = orderForm.items.findIndex((i) => i.item_id === item.item_id);
    if (existingIndex > -1) {
      const updated = [...orderForm.items];
      updated[existingIndex].quantity += 1;
      setOrderForm({ ...orderForm, items: updated });
    } else {
      setOrderForm({
        ...orderForm,
        items: [
          ...orderForm.items,
          {
            item_id: item.item_id,
            name: item.name,
            price: parseFloat(item.price),
            quantity: 1,
            special_instructions: ''
          }
        ]
      });
    }
  };

  const handleUpdateCartQty = (itemId, delta) => {
    const updated = orderForm.items
      .map((item) => {
        if (item.item_id === itemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean);
    setOrderForm({ ...orderForm, items: updated });
  };

  const handleUpdateCartInstructions = (itemId, text) => {
    const updated = orderForm.items.map((i) =>
      i.item_id === itemId ? { ...i, special_instructions: text } : i
    );
    setOrderForm({ ...orderForm, items: updated });
  };

  const computeCartSubtotal = () => {
    return orderForm.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (orderForm.items.length === 0) {
      alert('Please add at least one menu item to the order.');
      return;
    }

    try {
      await api.createOrder({
        table_id: orderForm.order_type === 'dine_in' ? orderForm.table_id : null,
        order_type: orderForm.order_type,
        customer_name: orderForm.customer_name,
        customer_phone: orderForm.customer_phone,
        notes: orderForm.notes,
        items: orderForm.items.map((i) => ({
          item_id: i.item_id,
          quantity: i.quantity,
          special_instructions: i.special_instructions
        }))
      });

      setIsNewOrderOpen(false);
      setToast({ type: 'success', message: 'Order placed successfully! Floor table synchronized.' });
      fetchOrders();
    } catch (err) {
      alert(`Order placement failed: ${err.message}`);
    }
  };

  const handleOpenOrderDetails = async (orderId) => {
    try {
      const res = await api.getOrder(orderId);
      setViewOrder(res.data);
      setIsViewModalOpen(true);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load order details.' });
    }
  };

  const handleOpenBilling = async (orderId) => {
    try {
      const res = await api.getOrder(orderId);
      setBillingOrder(res.data);
      setIsReceiptModalOpen(true);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to load bill.' });
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setToast({ type: 'success', message: `Order transitioned to '${newStatus}'.` });
      fetchOrders();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Status transition failed.' });
    }
  };

  const cartSubtotal = computeCartSubtotal();
  const cartTax = cartSubtotal * 0.05;
  const cartTotal = cartSubtotal + cartTax;

  const filteredMenuItems = activeMenuCat
    ? menuItems.filter((i) => i.category_id === parseInt(activeMenuCat, 10))
    : menuItems;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Order Management</h1>
          <p className="page-subtitle">Track dining room orders, itemizations, and lifecycle status</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchOrders} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          <button onClick={handleOpenNewOrder} className="btn btn-primary btn-sm">
            <Plus size={16} /> Take New Order
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Filter Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ minWidth: '160px' }}>
            <select
              className="form-control"
              style={{ padding: '8px 12px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="placed">Placed (New)</option>
              <option value="preparing">Preparing (Kitchen)</option>
              <option value="served">Served (At Table)</option>
              <option value="billed">Billed (Completed)</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ flex: '1 1 200px', position: 'relative' }}>
            <input
              type="text"
              className="form-control"
              style={{ padding: '8px 12px' }}
              placeholder="Search by order # or customer name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchOrders()}
            />
          </div>

          <button onClick={fetchOrders} className="btn btn-secondary btn-sm">
            Search
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Type / Table</th>
                <th>Staff</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No orders found. Click "Take New Order" to create one.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.order_id}>
                    <td>
                      <button
                        onClick={() => handleOpenOrderDetails(o.order_id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--accent-primary)',
                          fontWeight: '700',
                          cursor: 'pointer',
                          fontFamily: 'inherit'
                        }}
                      >
                        {o.order_number}
                      </button>
                    </td>
                    <td>
                      <div><strong>{o.table_number || 'Takeaway'}</strong></div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {o.order_type.replace('_', ' ')}
                      </div>
                    </td>
                    <td>{o.staff_name}</td>
                    <td>
                      {o.customer_name ? (
                        <div>
                          <div>{o.customer_name}</div>
                          {o.customer_phone && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{o.customer_phone}</div>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>Walk-in</span>
                      )}
                    </td>
                    <td>{o.total_items_count} item(s)</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700' }}>
                        {formatCurrency(o.final_amount)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${o.order_status}`}>{o.order_status}</span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {o.created_at?.slice(11, 16) || ''}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        {/* Status Progression Shortcuts */}
                        {o.order_status === 'placed' && (
                          <button
                            onClick={() => handleStatusChange(o.order_id, 'preparing')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            title="Start Preparing"
                          >
                            Prepare
                          </button>
                        )}
                        {o.order_status === 'preparing' && (
                          <button
                            onClick={() => handleStatusChange(o.order_id, 'served')}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                            title="Mark Served"
                          >
                            Serve
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenBilling(o.order_id)}
                          className={`btn btn-sm ${o.order_status === 'served' ? 'btn-primary' : 'btn-secondary'}`}
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          title="View Bill / Settle Payment"
                        >
                          <Receipt size={13} /> {o.order_status === 'billed' ? 'Receipt' : 'Bill'}
                        </button>

                        <button
                          onClick={() => handleOpenOrderDetails(o.order_id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="View Items"
                        >
                          <Eye size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* NEW ORDER WIZARD MODAL */}
      <Modal
        isOpen={isNewOrderOpen}
        onClose={() => setIsNewOrderOpen(false)}
        title="Take New Customer Order"
        maxWidth="900px"
      >
        <form onSubmit={handleSubmitOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
            {/* Left Column: Menu Picker */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
                1. Select Menu Items
              </h4>

              {/* Category tabs inside modal */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', marginBottom: '12px', paddingBottom: '4px' }}>
                <button
                  type="button"
                  onClick={() => setActiveMenuCat('')}
                  className={`btn btn-sm ${activeMenuCat === '' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                >
                  All
                </button>
                {categories.map((c) => (
                  <button
                    key={c.category_id}
                    type="button"
                    onClick={() => setActiveMenuCat(String(c.category_id))}
                    className={`btn btn-sm ${activeMenuCat === String(c.category_id) ? 'btn-primary' : 'btn-secondary'}`}
                    style={{ fontSize: '0.75rem', padding: '4px 10px', whiteSpace: 'nowrap' }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* Menu items list */}
              <div
                style={{
                  maxHeight: '340px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}
              >
                {filteredMenuItems.map((item) => (
                  <div
                    key={item.item_id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--border-subtle)'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.85rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(item.price)}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddItemToCart(item)}
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                    >
                      <Plus size={13} /> Add
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: Order Details & Cart */}
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: '700', marginBottom: '12px' }}>
                2. Order & Table Details
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Order Type</label>
                  <select
                    className="form-control"
                    value={orderForm.order_type}
                    onChange={(e) => setOrderForm({ ...orderForm, order_type: e.target.value })}
                  >
                    <option value="dine_in">Dine In</option>
                    <option value="takeaway">Takeaway</option>
                  </select>
                </div>

                {orderForm.order_type === 'dine_in' && (
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Table *</label>
                    <select
                      className="form-control"
                      value={orderForm.table_id}
                      onChange={(e) => setOrderForm({ ...orderForm, table_id: e.target.value })}
                      required
                    >
                      {tables.map((t) => (
                        <option key={t.table_id} value={t.table_id}>
                          {t.table_number} ({t.status}) - {t.capacity}p
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ahmed Khan"
                    value={orderForm.customer_name}
                    onChange={(e) => setOrderForm({ ...orderForm, customer_name: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Phone</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="+92-..."
                    value={orderForm.customer_phone}
                    onChange={(e) => setOrderForm({ ...orderForm, customer_phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Cart Table */}
              <h5 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px' }}>
                Order Summary ({orderForm.items.length} items)
              </h5>

              <div
                style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px',
                  backgroundColor: 'var(--bg-input)',
                  marginBottom: '12px'
                }}
              >
                {orderForm.items.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                    Cart is empty. Add dishes from the menu catalog on the left.
                  </div>
                ) : (
                  orderForm.items.map((i) => (
                    <div
                      key={i.item_id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: '1px solid var(--border-subtle)',
                        fontSize: '0.82rem'
                      }}
                    >
                      <div style={{ flex: 1, paddingRight: '8px' }}>
                        <div>{i.name}</div>
                        <input
                          type="text"
                          placeholder="Special instructions..."
                          style={{
                            width: '100%',
                            background: 'transparent',
                            border: 'none',
                            borderBottom: '1px dotted var(--border-strong)',
                            color: 'var(--text-muted)',
                            fontSize: '0.72rem',
                            outline: 'none',
                            marginTop: '2px'
                          }}
                          value={i.special_instructions}
                          onChange={(e) => handleUpdateCartInstructions(i.item_id, e.target.value)}
                        />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(i.item_id, -1)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                        >
                          <MinusCircle size={15} />
                        </button>
                        <span style={{ fontWeight: '600' }}>{i.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateCartQty(i.item_id, 1)}
                          style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer' }}
                        >
                          <PlusCircle size={15} />
                        </button>
                        <span style={{ fontFamily: 'var(--font-mono)', minWidth: '55px', textAlign: 'right' }}>
                          {formatCurrency(i.price * i.quantity)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Running Totals */}
              <div style={{ fontSize: '0.82rem', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                  <span>Tax (5%)</span>
                  <span>{formatCurrency(cartTax)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.05rem', color: 'var(--accent-primary)', marginTop: '4px', borderTop: '1px solid var(--border-strong)', paddingTop: '4px' }}>
                  <span>Total</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(cartTotal)}</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" onClick={() => setIsNewOrderOpen(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={orderForm.items.length === 0}
                  className="btn btn-primary"
                  style={{ padding: '10px 20px' }}
                >
                  Place Order
                </button>
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* VIEW ORDER DETAILS MODAL */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={viewOrder ? `Order Details: ${viewOrder.order_number}` : 'Order Details'}
        maxWidth="650px"
      >
        {viewOrder && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.85rem', marginBottom: '16px', backgroundColor: 'var(--bg-surface-elevated)', padding: '14px', borderRadius: 'var(--radius-md)' }}>
              <div><strong>Table:</strong> {viewOrder.table_number || 'Takeaway'}</div>
              <div><strong>Status:</strong> <span className={`badge badge-${viewOrder.order_status}`}>{viewOrder.order_status}</span></div>
              <div><strong>Staff:</strong> {viewOrder.staff_name}</div>
              <div><strong>Customer:</strong> {viewOrder.customer_name || 'Walk-in'}</div>
              <div><strong>Placed At:</strong> {viewOrder.created_at}</div>
              <div><strong>Total Amount:</strong> {formatCurrency(viewOrder.final_amount)}</div>
            </div>

            <h4 style={{ fontSize: '0.9rem', fontWeight: '700', marginBottom: '10px' }}>Order Item Lines</h4>
            <table className="data-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style={{ textAlign: 'center' }}>Qty</th>
                  <th style={{ textAlign: 'right' }}>Price</th>
                  <th style={{ textAlign: 'right' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {(viewOrder.items || []).map((item) => (
                  <tr key={item.order_item_id}>
                    <td>
                      <div>{item.item_name}</div>
                      {item.special_instructions && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)' }}>{item.special_instructions}</div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                    <td style={{ textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                    <td style={{ textAlign: 'right', fontWeight: '600' }}>{formatCurrency(item.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Audit Trail */}
            {viewOrder.status_history && viewOrder.status_history.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', fontWeight: '700', marginBottom: '8px', color: 'var(--text-muted)' }}>
                  Status Audit History (Database Trigger)
                </h4>
                <div style={{ fontSize: '0.78rem', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {viewOrder.status_history.map((h) => (
                    <div key={h.history_id} style={{ display: 'flex', gap: '10px', color: 'var(--text-secondary)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>{h.changed_at}</span>
                      <span>{h.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Itemized Bill / Receipt Settlement Modal */}
      <BillReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        order={billingOrder}
        onPaymentSuccess={fetchOrders}
      />
    </div>
  );
}
