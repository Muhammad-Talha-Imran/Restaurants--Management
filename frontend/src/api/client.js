/**
 * Centralized API Client for GourmetOS
 */

const API_BASE = '/api';

export async function apiRequest(endpoint, { method = 'GET', body = null, headers = {} } = {}) {
  const token = localStorage.getItem('gourmet_token');

  const config = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };

  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        // Clear token on 401 and reload to login
        localStorage.removeItem('gourmet_token');
        localStorage.removeItem('gourmet_user');
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
      const error = new Error(data.message || data.error || `HTTP ${response.status}`);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const api = {
  // Auth
  login: (credentials) => apiRequest('/auth/login', { method: 'POST', body: credentials }),
  getMe: () => apiRequest('/auth/me'),
  changePassword: (data) => apiRequest('/auth/change-password', { method: 'POST', body: data }),

  // Tables
  getTables: (params = '') => apiRequest(`/tables${params}`),
  getTable: (id) => apiRequest(`/tables/${id}`),
  createTable: (data) => apiRequest('/tables', { method: 'POST', body: data }),
  updateTable: (id, data) => apiRequest(`/tables/${id}`, { method: 'PUT', body: data }),
  updateTableStatus: (id, status) => apiRequest(`/tables/${id}/status`, { method: 'PATCH', body: { status } }),
  deleteTable: (id) => apiRequest(`/tables/${id}`, { method: 'DELETE' }),

  // Categories
  getCategories: (params = '') => apiRequest(`/categories${params}`),
  createCategory: (data) => apiRequest('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => apiRequest(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => apiRequest(`/categories/${id}`, { method: 'DELETE' }),

  // Menu Items
  getMenuItems: (params = '') => apiRequest(`/menu${params}`),
  getMenuItem: (id) => apiRequest(`/menu/${id}`),
  createMenuItem: (data) => apiRequest('/menu', { method: 'POST', body: data }),
  updateMenuItem: (id, data) => apiRequest(`/menu/${id}`, { method: 'PUT', body: data }),
  toggleMenuAvailability: (id) => apiRequest(`/menu/${id}/toggle`, { method: 'PATCH' }),
  deleteMenuItem: (id) => apiRequest(`/menu/${id}`, { method: 'DELETE' }),

  // Customers
  getCustomers: (params = '') => apiRequest(`/customers${params}`),
  findOrCreateCustomer: (data) => apiRequest('/customers/find-or-create', { method: 'POST', body: data }),

  // Reservations
  getReservations: (params = '') => apiRequest(`/reservations${params}`),
  createReservation: (data) => apiRequest('/reservations', { method: 'POST', body: data }),
  updateReservation: (id, data) => apiRequest(`/reservations/${id}`, { method: 'PUT', body: data }),
  updateReservationStatus: (id, status) => apiRequest(`/reservations/${id}/status`, { method: 'PATCH', body: { status } }),

  // Orders
  getOrders: (params = '') => apiRequest(`/orders${params}`),
  getOrder: (id) => apiRequest(`/orders/${id}`),
  createOrder: (data) => apiRequest('/orders', { method: 'POST', body: data }),
  updateOrderStatus: (id, status) => apiRequest(`/orders/${id}/status`, { method: 'PATCH', body: { status } }),
  addOrderItem: (id, item) => apiRequest(`/orders/${id}/items`, { method: 'POST', body: item }),
  removeOrderItem: (id, itemId) => apiRequest(`/orders/${id}/items/${itemId}`, { method: 'DELETE' }),

  // Payments & Billing
  getPayments: (params = '') => apiRequest(`/payments${params}`),
  getPaymentByOrderId: (orderId) => apiRequest(`/payments/order/${orderId}`),
  processPayment: (data) => apiRequest('/payments', { method: 'POST', body: data }),

  // Staff
  getStaff: (params = '') => apiRequest(`/staff${params}`),
  createStaff: (data) => apiRequest('/staff', { method: 'POST', body: data }),
  updateStaff: (id, data) => apiRequest(`/staff/${id}`, { method: 'PUT', body: data }),
  deactivateStaff: (id) => apiRequest(`/staff/${id}/deactivate`, { method: 'PATCH' }),

  // Reports
  getDashboardMetrics: () => apiRequest('/reports/dashboard'),
  getSalesReport: (params = '') => apiRequest(`/reports/sales${params}`),
  getTopItems: (limit = 10) => apiRequest(`/reports/top-items?limit=${limit}`),
  getCategorySales: () => apiRequest('/reports/category-sales'),
  getStaffPerformance: () => apiRequest('/reports/staff-performance')
};
