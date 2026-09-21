import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllRestaurants,
  getMenuByRestaurant,
  addMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from '../../api/restaurant';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Plus,
  Edit2,
  Trash2,
  UtensilsCrossed,
  ArrowLeft,
  Check,
  X,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';

export const MenuManagement = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Mains',
    price: '',
    description: '',
    imageUrl: '',
    isAvailable: true,
  });
  const [submitting, setSubmitting] = useState(false);


  const fetchRestaurantAndMenu = async () => {
    try {
      setLoading(true);
      const allRes = await getAllRestaurants();
      if (allRes?.success) {
        const owned = allRes.data.find(
          (r) => (r.ownerId?._id || r.ownerId) === user?.id || (r.ownerId?._id || r.ownerId) === user?._id
        ) || allRes.data[0]; 

        if (owned) {
          setRestaurant(owned);
          const menuRes = await getMenuByRestaurant(owned._id);
          if (menuRes?.success) {
            setItems(menuRes.rawItems || []);
          }
        }
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurantAndMenu();
  }, [user]);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Mains',
      price: '',
      description: '',
      imageUrl: '',
      isAvailable: true,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'Mains',
      price: item.price,
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      isAvailable: item.isAvailable !== false,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!restaurant) return;
    try {
      setSubmitting(true);
      if (editingItem) {
        const res = await updateMenuItem(editingItem._id, formData);
        if (res?.success) {
          showToast('Menu item updated successfully!', 'success');
        }
      } else {
        const res = await addMenuItem({
          ...formData,
          restaurantId: restaurant._id,
          price: Number(formData.price),
        });
        if (res?.success) {
          showToast('New menu item created!', 'success');
        }
      }
      setShowModal(false);
      fetchRestaurantAndMenu();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save menu item', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (itemId) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    try {
      const res = await deleteMenuItem(itemId);
      if (res?.success) {
        showToast('Menu item deleted', 'info');
        setItems((prev) => prev.filter((i) => i._id !== itemId));
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete item', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading restaurant menu items...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/restaurant/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Kitchen Dashboard
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Menu Items Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Restaurant:{' '}
            <span className="font-bold text-slate-800">
              {restaurant?.name || 'My Restaurant'}
            </span>{' '}
            • {items.length} items on menu
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Menu Item
        </button>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No dishes on the menu yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Click "Add Menu Item" above to add your first delicious dish!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
            >
              <div>
                <div className="relative h-40 bg-slate-100">
                  <img
                    src={
                      item.imageUrl ||
                      'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
                    }
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 flex gap-1">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        item.isAvailable
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {item.isAvailable ? 'Available' : 'Sold Out'}
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white text-xs font-bold">
                      {item.category || 'Mains'}
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-bold text-slate-900 leading-tight">
                      {item.name}
                    </h3>
                    <span className="text-base font-black text-orange-600 shrink-0">
                      ₹{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                    {item.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(item)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5 text-slate-500" /> Edit
                </button>

                <button
                  onClick={() => handleDelete(item._id)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 text-xs font-bold hover:bg-rose-50 transition flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}


      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Margherita Pizza"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Mains, Appetizer, etc."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="299"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ingredients, flavors, allergies..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              {/* <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isAvailable"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                />
                <label htmlFor="isAvailable" className="font-bold text-slate-700">
                  Item is currently in stock & available
                </label>
              </div> */}

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-md"
                >
                  {submitting ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
