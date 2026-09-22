import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  fetchCartThunk,
  addItemThunk,
  updateQuantityThunk,
  removeItemThunk,
  clearCartThunk,
  resetCart,
} from '../redux/slices/cartSlice';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { UtensilsCrossed, Lock, Mail, Eye, EyeOff, Loader2, X, User } from 'lucide-react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated, role, login } = useAuth();
  const { showToast } = useToast();
  const { cart, items, restaurantId, cartCount, cartTotal, loading } = useSelector((state) => state.cart);
  const [conflictModal, setConflictModal] = useState(null);

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [pendingItem, setPendingItem] = useState(null);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [showAuthPassword, setShowAuthPassword] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated || role !== 'customer') {
      dispatch(resetCart());
      return;
    }
    dispatch(fetchCartThunk());
  }, [dispatch, isAuthenticated, role]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleModalLogin = async (e) => {
    e?.preventDefault();
    if (!authEmail || !authPassword) {
      showToast('Please enter your email and password', 'error');
      return;
    }
    try {
      setAuthLoading(true);
      await login(authEmail, authPassword);
      setShowAuthModal(false);
      setAuthEmail('');
      setAuthPassword('');
      if (pendingItem) {
        try {
          await dispatch(addItemThunk({ menuItemId: pendingItem.menuItemId, quantity: pendingItem.quantity })).unwrap();
          showToast('Item added to cart!', 'success');
        } catch {
          // slice handles error
        }
        setPendingItem(null);
      }
    } catch {
      // toast shown in login
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      setAuthLoading(true);
      await login('customer@foodygo.com', 'Password@123');
      setShowAuthModal(false);
      if (pendingItem) {
        try {
          await dispatch(addItemThunk({ menuItemId: pendingItem.menuItemId, quantity: pendingItem.quantity })).unwrap();
          showToast('Item added to cart!', 'success');
        } catch {
          // slice handles error
        }
        setPendingItem(null);
      }
    } catch {
      // toast shown in login
    } finally {
      setAuthLoading(false);
    }
  };

  const addItem = async (menuItemId, quantity = 1, currentRestaurant = null) => {
    if (!isAuthenticated) {
      setPendingItem({ menuItemId, quantity, currentRestaurant });
      setShowAuthModal(true);
      return { requiresAuth: true };
    }

    if (role !== 'customer') {
      showToast('Only customer accounts can place orders.', 'error');
      return { unauthorizedRole: true };
    }

    const cartRestId = cart?.restaurantId?._id || cart?.restaurantId;
    const targetRestId = currentRestaurant?._id || currentRestaurant;

    if (cartRestId && targetRestId && cartRestId.toString() !== targetRestId.toString() && (cart?.items?.length || 0) > 0) {
      return new Promise((resolve) => {
        setConflictModal({
          targetRestaurantName: currentRestaurant?.name || 'another restaurant',
          onConfirm: async () => {
            setConflictModal(null);
            try {
              await dispatch(clearCartThunk()).unwrap();
              await dispatch(addItemThunk({ menuItemId, quantity })).unwrap();
              showToast('Cart replaced and item added!', 'success');
              resolve(true);
            } catch (err) {
              const msg = typeof err === 'string' ? err : err?.message || 'Failed to add item';
              showToast(msg, 'error');
              resolve(false);
            }
          },
          onCancel: () => {
            setConflictModal(null);
            resolve(false);
          },
        });
      });
    }

    try {
      await dispatch(addItemThunk({ menuItemId, quantity })).unwrap();
      showToast('Item added to cart!', 'success');
      return { success: true };
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Could not add item to cart.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const updateQuantity = async (menuItemId, quantity) => {
    try {
      await dispatch(updateQuantityThunk({ menuItemId, quantity })).unwrap();
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to update quantity';
      showToast(msg, 'error');
    }
  };

  const removeItem = async (menuItemId) => {
    try {
      await dispatch(removeItemThunk(menuItemId)).unwrap();
      showToast('Item removed from cart', 'info');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to remove item';
      showToast(msg, 'error');
    }
  };

  const clear = async () => {
    try {
      await dispatch(clearCartThunk()).unwrap();
      showToast('Cart cleared', 'info');
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Failed to clear cart';
      showToast(msg, 'error');
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        items,
        restaurantId,
        loading,
        cartCount,
        cartTotal,
        addItem,
        updateQuantity,
        removeItem,
        clear,
        refreshCart: fetchCart,
      }}
    >
      {children}

      {conflictModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="text-lg font-bold text-slate-900">Replace cart items?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Your cart already contains items from another restaurant. Do you want to clear your current cart and add items from{' '}
              <span className="font-semibold text-orange-600">{conflictModal.targetRestaurantName}</span>?
            </p>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                onClick={conflictModal.onCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={conflictModal.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-md shadow-orange-500/20 cursor-pointer"
              >
                Clear Cart & Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => {
                setShowAuthModal(false);
                setPendingItem(null);
              }}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-600 text-white flex items-center justify-center shadow-lg shadow-orange-500/20 mb-3">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                Sign In Required
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Please sign in or create an account to add delicious dishes to your cart and complete your order.
              </p>
            </div>

            <form onSubmit={handleModalLogin} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="customer@foodygo.com"
                    className="w-full pl-10 pr-4 cursor-pointer py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showAuthPassword ? 'text' : 'password'}
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 cursor-pointer bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowAuthPassword(!showAuthPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showAuthPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-orange-600 cursor-pointer hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
              >
                {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                <span>Sign In & Add to Cart</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200"></div>
                
                <div className="flex-grow border-t border-slate-200"></div>
              </div>

          

              <div className="pt-2 text-center text-[11px] text-slate-500">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    navigate('/register');
                  }}
                  className="font-bold text-orange-600 hover:underline cursor-pointer"
                >
                  Create an account (Sign Up)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
