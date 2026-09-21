import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getAllRestaurants,
  createRestaurant,
  updateRestaurant,
} from '../../api/restaurant';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Store, MapPin, Phone, Save, Loader2, ArrowLeft } from 'lucide-react';

export const RestaurantSettings = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    isOpen: true,
  });

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const res = await getAllRestaurants();
      if (res?.success) {
        const owned = res.data.find(
          (r) => (r.ownerId?._id || r.ownerId) === user?.id || (r.ownerId?._id || r.ownerId) === user?._id
        );
        if (owned) {
          setRestaurant(owned);
          setFormData({
            name: owned.name,
            description: owned.description || '',
            cuisine: Array.isArray(owned.cuisine) ? owned.cuisine.join(', ') : owned.cuisine,
            phone: owned.phone,
            street: owned.address?.street || '',
            city: owned.address?.city || '',
            state: owned.address?.state || '',
            postalCode: owned.address?.postalCode || '',
            isOpen: owned.isOpen !== false,
          });
        }
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurant();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        name: formData.name,
        description: formData.description,
        cuisine: formData.cuisine.split(',').map((c) => c.trim()).filter(Boolean),
        phone: formData.phone,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode,
        },
        isOpen: formData.isOpen,
      };

      if (restaurant) {
        const res = await updateRestaurant(restaurant._id, payload);
        if (res?.success) {
          showToast('Restaurant details updated successfully!', 'success');
          setRestaurant(res.data);
        }
      } else {
        const res = await createRestaurant(payload);
        if (res?.success) {
          showToast('Restaurant registered successfully!', 'success');
          setRestaurant(res.data);
        }
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to save restaurant details', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Loading restaurant profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 pb-20">
      <div className="flex items-center gap-2 mb-4">
        <Link
          to="/restaurant/dashboard"
          className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Kitchen Dashboard
        </Link>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Store className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">
              {restaurant ? 'Restaurant Settings' : 'Register Your Restaurant'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              {restaurant
                ? 'Update your cuisine specialties, address, contact and business hours'
                : 'Create your restaurant profile to start receiving customer orders'}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 text-xs">
          <div className="">
              <label className="block font-bold text-slate-700 mb-1">Restaurant Image</label>
               <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Restaurant Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Gusto Italian Bistro"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Our story, fresh local ingredients, award-winning pasta..."
              rows={2}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Cuisine Specialties 
              </label>
              <input
                type="text"
                required
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                placeholder="Italian, Pizza, Pasta"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

        
          <div className="pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-600" /> Physical Address
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="123 Food Street, Downtown"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Mumbai"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">State</label>
                  <input
                    type="text"
                    required
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="Maharashtra"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="400001"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-orange-200"
                  />
                </div>
              </div>
            </div>
          </div>
       






















          {/* <div className="pt-3 flex items-center gap-2">
            <input
              type="checkbox"
              id="isOpen"
              checked={formData.isOpen}
              onChange={(e) => setFormData({ ...formData, isOpen: e.target.checked })}
              className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
            />
            <label htmlFor="isOpen" className="font-bold text-slate-800">
              Restaurant is currently Open for taking orders
            </label>
          </div> */}

          <div className="pt-4">
            <button
              type="submit"
              disabled={saving}
              className="py-3 px-6 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{restaurant ? 'Save Settings' : 'Create Restaurant'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RestaurantSettings;
