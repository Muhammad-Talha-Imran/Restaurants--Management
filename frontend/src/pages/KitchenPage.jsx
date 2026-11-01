import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Flame, CheckCircle, Clock, RefreshCw, ChefHat, AlertCircle } from 'lucide-react';
import Toast from '../components/Toast';

export default function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const fetchKitchenOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders currently placed or preparing
      const [placedRes, prepRes] = await Promise.all([
        api.getOrders('?status=placed'),
        api.getOrders('?status=preparing')
      ]);

      const activeList = [...(placedRes.orders || []), ...(prepRes.orders || [])];

      // Fetch line items for each order
      const fullOrders = await Promise.all(
        activeList.map(async (o) => {
          const detail = await api.getOrder(o.order_id);
          return detail.data;
        })
      );

      setOrders(fullOrders);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch kitchen orders.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKitchenOrders();
    const interval = setInterval(fetchKitchenOrders, 15000); // Poll every 15s for live kitchen display
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      setToast({ type: 'success', message: `Order status set to '${newStatus}'.` });
      fetchKitchenOrders();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Update failed.' });
    }
  };

  const placedOrders = orders.filter((o) => o.order_status === 'placed');
  const preparingOrders = orders.filter((o) => o.order_status === 'preparing');

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Kitchen Display System (KDS)</h1>
          <p className="page-subtitle">Real-time order preparation queue and service dispatch</p>
        </div>
        <button onClick={fetchKitchenOrders} className="btn btn-secondary btn-sm">
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh Display
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Kanban Style Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Column 1: Placed (Incoming) */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              border: '1px solid var(--border-subtle)',
              borderBottom: '2px solid var(--accent-blue)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <Clock size={18} color="var(--accent-blue)" /> Incoming Orders
            </div>
            <span className="badge badge-placed">{placedOrders.length} New</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'rgba(17, 24, 39, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderTop: 'none',
              padding: '16px',
              minHeight: '400px',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
            }}
          >
            {placedOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                No new incoming tickets.
              </div>
            ) : (
              placedOrders.map((o) => (
                <div key={o.order_id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-blue)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{o.order_number}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                        Table {o.table_number || 'Takeaway'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {o.created_at?.slice(11, 16)}
                    </span>
                  </div>

                  {/* Items list */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '14px' }}>
                    {(o.items || []).map((i) => (
                      <div key={i.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '3px 0' }}>
                        <div>
                          <span style={{ fontWeight: '700', color: 'var(--accent-primary)', marginRight: '8px' }}>
                            {i.quantity}x
                          </span>
                          <span>{i.item_name}</span>
                          {i.special_instructions && (
                            <div style={{ fontSize: '0.74rem', color: '#f87171', fontStyle: 'italic', paddingLeft: '24px' }}>
                              ⚠️ {i.special_instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(o.order_id, 'preparing')}
                    className="btn btn-primary btn-sm"
                    style={{ width: '100%', padding: '9px', fontSize: '0.82rem' }}
                  >
                    <ChefHat size={16} /> Start Cooking
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: Preparing (In Cooking) */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
              border: '1px solid var(--border-subtle)',
              borderBottom: '2px solid var(--accent-purple)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700' }}>
              <Flame size={18} color="var(--accent-purple)" /> In Preparation
            </div>
            <span className="badge badge-preparing">{preparingOrders.length} Cooking</span>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              backgroundColor: 'rgba(17, 24, 39, 0.4)',
              border: '1px solid var(--border-subtle)',
              borderTop: 'none',
              padding: '16px',
              minHeight: '400px',
              borderRadius: '0 0 var(--radius-lg) var(--radius-lg)'
            }}
          >
            {preparingOrders.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
                Kitchen queue is clear.
              </div>
            ) : (
              preparingOrders.map((o) => (
                <div key={o.order_id} className="card" style={{ padding: '16px', borderLeft: '4px solid var(--accent-purple)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>{o.order_number}</h3>
                      <div style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', fontWeight: '600' }}>
                        Table {o.table_number || 'Takeaway'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-purple)', fontWeight: '600' }}>
                      Cooking...
                    </span>
                  </div>

                  {/* Items list */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginBottom: '14px' }}>
                    {(o.items || []).map((i) => (
                      <div key={i.order_item_id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', padding: '3px 0' }}>
                        <div>
                          <span style={{ fontWeight: '700', color: 'var(--accent-purple)', marginRight: '8px' }}>
                            {i.quantity}x
                          </span>
                          <span>{i.item_name}</span>
                          {i.special_instructions && (
                            <div style={{ fontSize: '0.74rem', color: '#f87171', fontStyle: 'italic', paddingLeft: '24px' }}>
                              ⚠️ {i.special_instructions}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => handleUpdateStatus(o.order_id, 'served')}
                    className="btn btn-success btn-sm"
                    style={{ width: '100%', padding: '9px', fontSize: '0.82rem' }}
                  >
                    <CheckCircle size={16} /> Ready & Serve to Table
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
