import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Receipt,
  CreditCard,
  Banknote,
  Globe,
  Printer,
  CheckCircle,
  Filter,
  RefreshCw,
  Search
} from 'lucide-react';
import BillReceiptModal from '../components/BillReceiptModal';
import { formatCurrency } from '../utils/format';
import Toast from '../components/Toast';

export default function BillingPage() {
  const [payments, setPayments] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [methodFilter, setMethodFilter] = useState('');
  const [toast, setToast] = useState(null);

  // Selected Order for Receipt Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let paymentParams = '?';
      if (methodFilter) paymentParams += `method=${methodFilter}&`;

      const [paymentsRes, pendingRes] = await Promise.all([
        api.getPayments(paymentParams),
        api.getOrders('?status=served')
      ]);

      setPayments(paymentsRes.payments || []);
      setPendingOrders(pendingRes.orders || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch billing data.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [methodFilter]);

  const handleOpenBill = async (orderId) => {
    try {
      const res = await api.getOrder(orderId);
      setSelectedOrder(res.data);
      setIsReceiptOpen(true);
    } catch (err) {
      setToast({ type: 'error', message: 'Could not load order bill.' });
    }
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Billing & Payment Management</h1>
          <p className="page-subtitle">Itemized receipts, payment settlements, and transaction history</p>
        </div>
        <button onClick={fetchData} className="btn btn-secondary btn-sm">
          <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
        </button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Section 1: Orders Ready for Billing */}
      <div className="card" style={{ marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Orders Ready for Bill Settlement</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Orders currently served to tables awaiting customer payment
            </p>
          </div>
          <span className="badge badge-preparing">{pendingOrders.length} Pending Bills</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Table</th>
                <th>Server</th>
                <th>Customer</th>
                <th>Bill Amount</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    No pending orders waiting for bill payment.
                  </td>
                </tr>
              ) : (
                pendingOrders.map((o) => (
                  <tr key={o.order_id}>
                    <td style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{o.order_number}</td>
                    <td><strong>{o.table_number || 'Takeaway'}</strong></td>
                    <td>{o.staff_name}</td>
                    <td>{o.customer_name || 'Walk-in'}</td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '800', color: 'var(--accent-primary)', fontSize: '1rem' }}>
                        {formatCurrency(o.final_amount)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenBill(o.order_id)}
                        className="btn btn-primary btn-sm"
                        style={{ padding: '6px 14px' }}
                      >
                        <Receipt size={14} /> Settle Bill
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section 2: Historical Payments Ledger */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800' }}>Completed Payments Ledger</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Permanent 1-to-1 relational records of settled customer payments
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Payment Method:</span>
            <select
              className="form-control"
              style={{ width: '150px', padding: '6px 12px', fontSize: '0.82rem' }}
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="card">Card</option>
              <option value="online">Online</option>
            </select>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payment ID</th>
                <th>Order #</th>
                <th>Method</th>
                <th>Amount Paid</th>
                <th>Reference</th>
                <th>Processed By</th>
                <th>Timestamp</th>
                <th style={{ textAlign: 'right' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {payments.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No payment records found. Settle a bill to record transactions.
                  </td>
                </tr>
              ) : (
                payments.map((p) => (
                  <tr key={p.payment_id}>
                    <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                      #{p.payment_id}
                    </td>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{p.order_number}</td>
                    <td>
                      <span className="badge badge-billed" style={{ textTransform: 'uppercase' }}>
                        {p.payment_method}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', color: 'var(--accent-emerald)' }}>
                        {formatCurrency(p.amount_paid)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                      {p.transaction_reference || '—'}
                    </td>
                    <td>{p.staff_name || 'Staff'}</td>
                    <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.payment_time}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenBill(p.order_id)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                        title="Print Receipt"
                      >
                        <Printer size={13} /> View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Receipt Modal */}
      <BillReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        order={selectedOrder}
        onPaymentSuccess={fetchData}
      />
    </div>
  );
}
