import React, { useState } from 'react';
import Modal from './Modal';
import { api } from '../api/client';
import { Printer, CheckCircle, CreditCard, Banknote, Globe, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/format';

export default function BillReceiptModal({ isOpen, onClose, order, onPaymentSuccess }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [txnRef, setTxnRef] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!order) return null;

  const isPaid = order.payment_status === 'paid' || order.order_status === 'billed';

  const handleSettlePayment = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.processPayment({
        order_id: order.order_id,
        amount_paid: order.final_amount,
        payment_method: paymentMethod,
        transaction_reference: txnRef || `TXN-${Date.now().toString().slice(-6)}`
      });

      if (onPaymentSuccess) onPaymentSuccess();
      onClose();
    } catch (err) {
      setError(err.message || 'Payment settlement failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Itemized Invoice & Payment Settlement" maxWidth="600px">
      <div className="receipt-container" style={{ fontFamily: 'var(--font-sans)' }}>
        {/* Restaurant Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '1px dashed var(--border-strong)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            GOURMET BISTRO
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fine Dining & Artisan Grill</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Tax ID: PK-DBMS-2026-GROUP4</p>
        </div>

        {/* Invoice Meta */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.82rem', marginBottom: '16px', color: 'var(--text-secondary)' }}>
          <div><strong>Order #:</strong> {order.order_number}</div>
          <div><strong>Table:</strong> {order.table_number || 'Takeaway'}</div>
          <div><strong>Server:</strong> {order.staff_name || 'Staff'}</div>
          <div><strong>Date:</strong> {order.created_at}</div>
          {order.customer_name && (
            <div style={{ gridColumn: 'span 2' }}>
              <strong>Customer:</strong> {order.customer_name} ({order.customer_phone || ''})
            </div>
          )}
        </div>

        {/* Itemized Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '16px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-strong)', color: 'var(--text-muted)', textAlign: 'left' }}>
              <th style={{ padding: '8px 4px' }}>Item</th>
              <th style={{ padding: '8px 4px', textAlign: 'center' }}>Qty</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Price</th>
              <th style={{ padding: '8px 4px', textAlign: 'right' }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item) => (
              <tr key={item.order_item_id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <td style={{ padding: '8px 4px', color: 'var(--text-primary)' }}>
                  <div>{item.item_name}</div>
                  {item.special_instructions && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--accent-primary)' }}>{item.special_instructions}</div>
                  )}
                </td>
                <td style={{ padding: '8px 4px', textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right' }}>{formatCurrency(item.unit_price)}</td>
                <td style={{ padding: '8px 4px', textAlign: 'right', fontWeight: '600' }}>
                  {formatCurrency(item.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals Breakdown */}
        <div style={{ borderTop: '1px dashed var(--border-strong)', paddingTop: '12px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Sales Tax (5%)</span>
            <span>{formatCurrency(order.tax_amount)}</span>
          </div>
          {parseFloat(order.discount_amount || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '0.85rem', color: 'var(--accent-emerald)' }}>
              <span>Discount</span>
              <span>-{formatCurrency(order.discount_amount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 4px', fontSize: '1.2rem', fontWeight: '800', borderTop: '1px solid var(--border-strong)', marginTop: '8px', color: 'var(--accent-primary)' }}>
            <span>Total Payable</span>
            <span style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(order.final_amount)}</span>
          </div>
        </div>

        {/* Payment Status or Settlement Form */}
        {isPaid ? (
          <div
            style={{
              backgroundColor: 'var(--accent-emerald-subtle)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              borderRadius: 'var(--radius-md)',
              padding: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-emerald)' }}>
              <CheckCircle size={22} />
              <div>
                <div style={{ fontWeight: '700', fontSize: '0.9rem' }}>PAYMENT SETTLED</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>
                  Method: {order.payment_method?.toUpperCase()} | Paid: {formatCurrency(order.amount_paid || order.final_amount)}
                </div>
              </div>
            </div>
            {order.payment_time && (
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.payment_time}</div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSettlePayment} className="no-print" style={{ backgroundColor: 'var(--bg-surface-elevated)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.92rem', marginBottom: '12px', fontWeight: '700' }}>Settle Payment & Release Table</h4>
            
            {error && (
              <div style={{ color: 'var(--accent-rose)', fontSize: '0.82rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <div className="form-group" style={{ marginBottom: '12px' }}>
              <label className="form-label">Payment Method</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                {[
                  { id: 'cash', label: 'Cash', icon: Banknote },
                  { id: 'card', label: 'Card', icon: CreditCard },
                  { id: 'online', label: 'Online', icon: Globe }
                ].map((m) => {
                  const Icon = m.icon;
                  const isSelected = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id)}
                      className="btn"
                      style={{
                        backgroundColor: isSelected ? 'var(--accent-primary-subtle)' : 'var(--bg-input)',
                        borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)',
                        color: isSelected ? 'var(--accent-primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <Icon size={16} /> {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Transaction Reference (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. CARD-AUTH-7890 or CASH-RCPT"
                value={txnRef}
                onChange={(e) => setTxnRef(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', padding: '12px' }}
            >
              {submitting ? 'Processing Payment...' : `Complete Payment of ${formatCurrency(order.final_amount)}`}
            </button>
          </form>
        )}

        {/* Print & Close Action Buttons */}
        <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button onClick={handlePrint} className="btn btn-secondary">
            <Printer size={16} /> Print Receipt
          </button>
          <button onClick={onClose} className="btn btn-secondary">
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
