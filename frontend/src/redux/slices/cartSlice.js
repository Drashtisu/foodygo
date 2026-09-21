import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart as apiClearCart } from '../../api/order';

export const fetchCartThunk = createAsyncThunk('cart/fetchCart', async (_, { rejectWithValue }) => {
  try {
    const res = await getCart();
    if (res?.success) {
      return res.data;
    }
    return null;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to fetch cart');
  }
});

export const addItemThunk = createAsyncThunk('cart/addItem', async ({ menuItemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await addToCart(menuItemId, quantity);
    if (res.success) {
      return res.data;
    }
    return rejectWithValue('Failed to add item');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Could not add item to cart.');
  }
});

export const updateQuantityThunk = createAsyncThunk('cart/updateQuantity', async ({ menuItemId, quantity }, { rejectWithValue }) => {
  try {
    const res = await updateCartItem(menuItemId, quantity);
    if (res.success) {
      return res.data;
    }
    return rejectWithValue('Failed to update quantity');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to update quantity');
  }
});

export const removeItemThunk = createAsyncThunk('cart/removeItem', async (menuItemId, { rejectWithValue }) => {
  try {
    const res = await removeFromCart(menuItemId);
    if (res.success) {
      return res.data;
    }
    return rejectWithValue('Failed to remove item');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to remove item');
  }
});

export const clearCartThunk = createAsyncThunk('cart/clearCart', async (_, { rejectWithValue }) => {
  try {
    const res = await apiClearCart();
    if (res.success) {
      return res.data;
    }
    return rejectWithValue('Failed to clear cart');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Failed to clear cart');
  }
});

const calculateCount = (cart) => {
  return cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
};

const calculateTotal = (cart) => {
  return cart?.totalAmount || cart?.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    cart: null,
    items: [],
    restaurantId: null,
    cartCount: 0,
    cartTotal: 0,
    loading: false,
    error: null,
  },
  reducers: {
    resetCart: (state) => {
      state.cart = null;
      state.items = [];
      state.restaurantId = null;
      state.cartCount = 0;
      state.cartTotal = 0;
      state.loading = false;
      state.error = null;
    },
    setCartData: (state, action) => {
      state.cart = action.payload;
      state.items = action.payload?.items || [];
      state.restaurantId = action.payload?.restaurantId || null;
      state.cartCount = calculateCount(action.payload);
      state.cartTotal = calculateTotal(action.payload);
    },
  },
  extraReducers: (builder) => {
    const handleCartFulfilled = (state, action) => {
      state.loading = false;
      if (action.payload) {
        state.cart = action.payload;
        state.items = action.payload.items || [];
        state.restaurantId = action.payload.restaurantId || null;
        state.cartCount = calculateCount(action.payload);
        state.cartTotal = calculateTotal(action.payload);
      } else {
        state.cart = null;
        state.items = [];
        state.restaurantId = null;
        state.cartCount = 0;
        state.cartTotal = 0;
      }
    };

    builder
      .addCase(fetchCartThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartThunk.fulfilled, handleCartFulfilled)
      .addCase(fetchCartThunk.rejected, (state) => {
        state.loading = false;
      })
      .addCase(addItemThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(addItemThunk.fulfilled, handleCartFulfilled)
      .addCase(addItemThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateQuantityThunk.fulfilled, handleCartFulfilled)
      .addCase(removeItemThunk.fulfilled, handleCartFulfilled)
      .addCase(clearCartThunk.fulfilled, handleCartFulfilled);
  },
});

export const { resetCart, setCartData } = cartSlice.actions;
export default cartSlice.reducer;
