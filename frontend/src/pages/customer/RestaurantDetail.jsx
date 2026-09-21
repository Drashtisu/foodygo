import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getRestaurantById, getMenuByRestaurant } from '../../api/restaurant';
import { useCart } from '../../context/CartContext';
import { StarRating } from '../../components/StarRating';
import {
  MapPin,
  Phone,
  Clock,
  Plus,
  Minus,
  ShoppingCart,
  ArrowLeft,
  Check,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';

export const RestaurantDetail = () => {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [menuCategories, setMenuCategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState(null);
  const { cart, items, addItem, updateQuantity, cartCount, cartTotal } = useCart();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [restRes, menuRes] = await Promise.all([
          getRestaurantById(id),
          getMenuByRestaurant(id),
        ]);

        if (restRes?.success) {
          setRestaurant(restRes.data);
        }
        if (menuRes?.success) {
          setMenuCategories(menuRes.data || {});
          const categories = Object.keys(menuRes.data || {});
          if (categories.length > 0) setActiveCategory(categories[0]);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const getItemQuantityInCart = (menuItemId) => {
    const item = items.find((i) => (i.menuItemId?._id || i.menuItemId) === menuItemId);
    return item ? item.quantity : 0;
  };

  const handleAdd = (item) => {
    addItem(item._id, 1, restaurant);
  };

  const handleIncrement = (item) => {
    const currentQty = getItemQuantityInCart(item._id);
    updateQuantity(item._id, currentQty + 1);
  };

  const handleDecrement = (item) => {
    const currentQty = getItemQuantityInCart(item._id);
    updateQuantity(item._id, currentQty - 1);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-orange-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading delicious menu...</p>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900">Restaurant Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">
          This restaurant might have closed or been removed.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block px-5 py-2.5 bg-orange-600 text-white font-bold rounded-xl text-sm"
        >
          Back to Restaurants
        </Link>
      </div>
    );
  }

  const categoryNames = Object.keys(menuCategories);

  return (
    <div className="min-h-screen pb-24">
      {/* Back button banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> All Restaurants
        </Link>
      </div>

      {/* Restaurant Header Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-slate-900 text-white shadow-xl">
          <div className="absolute inset-0 opacity-40">
            <img
              src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80"
              alt={restaurant.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          <div className="relative p-6 sm:p-10 z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                    restaurant.isOpen
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-700 text-slate-300'
                  }`}
                >
                  {restaurant.isOpen ? 'Open Now' : 'Currently Closed'}
                </span>
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-xs font-bold text-white">
                  {Array.isArray(restaurant.cuisine)
                    ? restaurant.cuisine.join(' • ')
                    : restaurant.cuisine}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                {restaurant.name}
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed">
                {restaurant.description || 'Welcome to our kitchen! Freshly made to order.'}
              </p>

              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>
                    {restaurant.address?.street}, {restaurant.address?.city}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>{restaurant.phone}</span>
                </div>
              </div>
            </div>

            {/* Rating box */}
            <div className="shrink-0 bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center md:flex-col justify-between md:justify-center gap-3 text-center">
              <div className="flex items-center gap-1.5">
                <StarRating rating={restaurant.rating || 4.5} size="md" />
                <span className="text-xl font-black text-white">
                  {restaurant.rating ? restaurant.rating.toFixed(1) : '4.5'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Based on {restaurant.totalReviews || 0} customer reviews
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Navigation Pills */}
      {categoryNames.length > 0 && (
        <div className="sticky top-16 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {categoryNames.map((cat) => (
              <a
                key={cat}
                href={`#cat-${cat}`}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeCategory === cat
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat} ({menuCategories[cat].length})
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Menu Categories List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-12">
        {categoryNames.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8">
            <Info className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <h3 className="text-base font-bold text-slate-800">No dishes on the menu yet</h3>
            <p className="text-xs text-slate-500 mt-1">
              Check back shortly or contact the restaurant owner!
            </p>
          </div>
        ) : (
          categoryNames.map((category) => {
            const itemsInCategory = menuCategories[category] || [];
            return (
              <section key={category} id={`cat-${category}`} className="scroll-mt-32">
                <div className="flex items-center gap-3 mb-6 pb-2 border-b border-slate-200">
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    {category}
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    {itemsInCategory.length} items
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {itemsInCategory.map((item) => {
                    const quantityInCart = getItemQuantityInCart(item._id);

                    return (
                      <div
                        key={item._id}
                        className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex items-start justify-between gap-4"
                      >
                        <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shrink-0" />
                              <h3 className="text-base font-bold text-slate-900 truncate">
                                {item.name}
                              </h3>
                            </div>
                            <p className="text-base font-black text-orange-600 mt-1">
                              ₹{item.price}
                            </p>
                            <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {item.description || 'Deliciously prepared with fresh seasonal ingredients.'}
                            </p>
                          </div>

                          {/* Action Button */}
                          <div className="mt-4 pt-2">
                            {quantityInCart === 0 ? (
                              <button
                                onClick={() => handleAdd(item)}
                                disabled={!item.isAvailable}
                                className="px-5 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 transition shadow-sm flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                {item.isAvailable ? 'Add to Cart' : 'Unavailable'}
                              </button>
                            ) : (
                              <div className="inline-flex items-center gap-3 bg-orange-600 text-white rounded-xl px-2 py-1 shadow-md shadow-orange-500/20">
                                <button
                                  onClick={() => handleDecrement(item)}
                                  className="p-1 hover:bg-orange-700 rounded-lg transition"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="text-xs font-black px-1">{quantityInCart}</span>
                                <button
                                  onClick={() => handleIncrement(item)}
                                  className="p-1 hover:bg-orange-700 rounded-lg transition"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Dish image */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-slate-100 overflow-hidden shrink-0">
                          <img
                            src={
                              item.imageUrl ||
                              'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&auto=format&fit=crop&q=80'
                            }
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center text-[11px] font-bold text-white text-center p-1">
                              Sold Out
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && (
        <div className="fixed bottom-6 inset-x-4 sm:inset-x-auto sm:right-6 sm:left-auto z-40">
          <Link
            to="/cart"
            className="flex items-center justify-between gap-6 bg-slate-950 text-white px-6 py-4 rounded-2xl shadow-2xl hover:bg-slate-900 transition group border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-bold text-sm">
                {cartCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-slate-400">Total in Cart</p>
                <p className="text-base font-black text-white">₹{cartTotal}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 font-bold text-sm text-orange-400 group-hover:translate-x-1 transition-transform">
              <span>View Cart & Checkout</span>
              <ShoppingCart className="w-4 h-4" />
            </div>
          </Link>
        </div>
      )}
    </div>
  );
};

export default RestaurantDetail;
