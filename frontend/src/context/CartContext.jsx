import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { isAuthenticated, role } = useAuth();
  const { showToast } = useToast();
  const { cart, items, restaurantId, cartCount, cartTotal, loading } = useSelector((state) => state.cart);
  const [conflictModal, setConflictModal] = useState(null);

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

  const addItem = async (menuItemId, quantity = 1, currentRestaurant = null) => {
    if (!isAuthenticated) {
      showToast('Please sign in to add items to your cart.', 'info');
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
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={conflictModal.onConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition shadow-md shadow-orange-500/20"
              >
                Clear Cart & Add
              </button>
            </div>
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
