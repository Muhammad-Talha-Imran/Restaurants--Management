import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Check,
  X,
  Layers,
  RefreshCw,
  FolderPlus
} from 'lucide-react';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import { formatCurrency } from '../utils/format';

export default function MenuPage() {
  const { isAdmin } = useAuth();
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [toast, setToast] = useState(null);

  // Item Modal
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    category_id: '',
    name: '',
    description: '',
    price: '',
    is_available: true
  });

  // Category Modal
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDesc, setCategoryDesc] = useState('');

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.data);
      if (!selectedCategory && res.data.length > 0) {
        // keep empty for all
      }
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const fetchMenuItems = async () => {
    setLoading(true);
    try {
      let params = '?';
      if (selectedCategory) params += `category_id=${selectedCategory}&`;
      if (search) params += `search=${encodeURIComponent(search)}&`;
      if (minPrice) params += `minPrice=${minPrice}&`;
      if (maxPrice) params += `maxPrice=${maxPrice}&`;

      const res = await api.getMenuItems(params);
      setItems(res.items || []);
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to fetch menu items.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, [selectedCategory, minPrice, maxPrice]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchMenuItems();
  };

  const handleOpenCreateItem = () => {
    setEditingItem(null);
    setItemForm({
      category_id: selectedCategory || (categories[0] ? categories[0].category_id : ''),
      name: '',
      description: '',
      price: '',
      is_available: true
    });
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      is_available: item.is_available
    });
    setIsItemModalOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.item_id, itemForm);
        setToast({ type: 'success', message: `Item '${itemForm.name}' updated.` });
      } else {
        await api.createMenuItem(itemForm);
        setToast({ type: 'success', message: `Item '${itemForm.name}' created.` });
      }
      setIsItemModalOpen(false);
      fetchMenuItems();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to save menu item.' });
    }
  };

  const handleToggleAvailability = async (item) => {
    try {
      await api.toggleMenuAvailability(item.item_id);
      fetchMenuItems();
      setToast({
        type: 'info',
        message: `'${item.name}' set to ${!item.is_available ? 'Available' : 'Unavailable'}.`
      });
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Toggle failed.' });
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete or deactivate '${item.name}'?`)) return;
    try {
      const res = await api.deleteMenuItem(item.item_id);
      setToast({ type: 'info', message: res.message });
      fetchMenuItems();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to delete item.' });
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    try {
      await api.createCategory({ name: categoryName, description: categoryDesc });
      setCategoryName('');
      setCategoryDesc('');
      setIsCategoryModalOpen(false);
      setToast({ type: 'success', message: 'New menu category created.' });
      fetchCategories();
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Failed to create category.' });
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category '${catName}'?`)) return;
    try {
      await api.deleteCategory(catId);
      setToast({ type: 'success', message: `Category '${catName}' deleted.` });
      fetchCategories();
      if (selectedCategory === String(catId)) setSelectedCategory('');
    } catch (err) {
      setToast({ type: 'error', message: err.message || 'Cannot delete category.' });
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu & Category Management</h1>
          <p className="page-subtitle">Classify dishes, adjust prices, and control real-time ordering availability</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchMenuItems} className="btn btn-secondary btn-sm">
            <RefreshCw size={15} className={loading ? 'spin' : ''} /> Refresh
          </button>
          {isAdmin && (
            <>
              <button onClick={() => setIsCategoryModalOpen(true)} className="btn btn-secondary btn-sm">
                <FolderPlus size={16} /> Manage Categories
              </button>
              <button onClick={handleOpenCreateItem} className="btn btn-primary btn-sm">
                <Plus size={16} /> Add Menu Item
              </button>
            </>
          )}
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Category Tabs */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-subtle)'
        }}
      >
        <button
          onClick={() => setSelectedCategory('')}
          className={`btn btn-sm ${selectedCategory === '' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '999px', padding: '6px 16px' }}
        >
          All Items
        </button>
        {categories.map((c) => (
          <button
            key={c.category_id}
            onClick={() => setSelectedCategory(String(c.category_id))}
            className={`btn btn-sm ${selectedCategory === String(c.category_id) ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderRadius: '999px', padding: '6px 16px', whiteSpace: 'nowrap' }}
          >
            {c.name} ({c.total_items})
          </button>
        ))}
      </div>

      {/* Search and Filters Bar */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', alignItems: 'center' }}>
          <div style={{ flex: '1 1 240px', position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="form-control"
              style={{ paddingLeft: '38px', paddingRight: '12px', paddingBlock: '8px' }}
              placeholder="Search dishes by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Price:</span>
            <input
              type="number"
              placeholder="Min Rs"
              className="form-control"
              style={{ width: '90px', padding: '8px 10px' }}
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
            />
            <span style={{ color: 'var(--text-muted)' }}>-</span>
            <input
              type="number"
              placeholder="Max Rs"
              className="form-control"
              style={{ width: '90px', padding: '8px 10px' }}
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-secondary btn-sm">
            Apply Search
          </button>

          {(search || minPrice || maxPrice) && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setMinPrice('');
                setMaxPrice('');
              }}
              className="btn btn-secondary btn-sm"
            >
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Menu Items List / Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dish / Beverage</th>
                <th>Category</th>
                <th>Price</th>
                <th>Availability</th>
                {isAdmin && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    No menu items match your criteria.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.item_id}>
                    <td>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        {item.name}
                      </div>
                      {item.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '450px' }}>
                          {item.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-placed">{item.category_name}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: '700', fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
                        {formatCurrency(item.price)}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        className={`badge ${item.is_available ? 'badge-available' : 'badge-occupied'}`}
                        style={{ cursor: 'pointer', border: 'none' }}
                        title="Click to toggle availability"
                      >
                        {item.is_available ? <Check size={12} /> : <X size={12} />}
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </button>
                    </td>
                    {isAdmin && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <button
                            onClick={() => handleOpenEditItem(item)}
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Edit Item"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            className="btn btn-danger btn-sm"
                            style={{ padding: '5px 8px' }}
                            title="Delete Item"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Menu Item Modal */}
      <Modal
        isOpen={isItemModalOpen}
        onClose={() => setIsItemModalOpen(false)}
        title={editingItem ? `Edit Menu Item: ${editingItem.name}` : 'Create New Menu Item'}
      >
        <form onSubmit={handleSaveItem}>
          <div className="form-group">
            <label className="form-label">Category *</label>
            <select
              className="form-control"
              required
              value={itemForm.category_id}
              onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
            >
              <option value="">Select Category</option>
              {categories.map((c) => (
                <option key={c.category_id} value={c.category_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Dish Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Chicken Handi"
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price (Rs) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="form-control"
              placeholder="0.00"
              required
              value={itemForm.price}
              onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description & Ingredients</label>
            <textarea
              className="form-control"
              rows="3"
              placeholder="Ingredients, preparation details, allergen information..."
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
            ></textarea>
          </div>

          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
              <input
                type="checkbox"
                checked={itemForm.is_available}
                onChange={(e) => setItemForm({ ...itemForm, is_available: e.target.checked })}
              />
              <span>Currently Available for Ordering</span>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button type="button" onClick={() => setIsItemModalOpen(false)} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editingItem ? 'Save Item' : 'Add Item'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Category Management Dialog */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Menu Categories Management"
        maxWidth="540px"
      >
        <div>
          <form onSubmit={handleCreateCategory} style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)' }}>
            <h4 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '12px' }}>Create New Category</h4>
            <div className="form-group">
              <label className="form-label">Category Name *</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. BBQ & Grill"
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="Short description..."
                value={categoryDesc}
                onChange={(e) => setCategoryDesc(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ width: '100%' }}>
              <Plus size={15} /> Add Category
            </button>
          </form>

          <div>
            <h4 style={{ fontSize: '0.92rem', fontWeight: '700', marginBottom: '12px' }}>Existing Categories</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {categories.map((cat) => (
                <div
                  key={cat.category_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{cat.name}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '8px' }}>
                      ({cat.total_items} items)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteCategory(cat.category_id, cat.name)}
                    className="btn btn-danger btn-sm"
                    style={{ padding: '4px 8px' }}
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
