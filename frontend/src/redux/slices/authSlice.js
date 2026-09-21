import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser, getProfile, logoutUser } from '../../api/auth';

const getInitialUser = () => {
  try {
    const saved = localStorage.getItem('foodygo_user');
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const getInitialToken = () => {
  try {
    return localStorage.getItem('foodygo_token') || null;
  } catch {
    return null;
  }
};

export const initAuth = createAsyncThunk('auth/initAuth', async (_, { rejectWithValue }) => {
  const token = localStorage.getItem('foodygo_token');
  if (!token) return null;
  try {
    const res = await getProfile();
    if (res?.success && res?.user) {
      localStorage.setItem('foodygo_user', JSON.stringify(res.user));
      return res.user;
    }
    throw new Error('Failed to fetch profile');
  } catch (err) {
    localStorage.removeItem('foodygo_token');
    localStorage.removeItem('foodygo_user');
    return rejectWithValue(err.response?.data?.message || 'Session expired');
  }
});

export const loginThunk = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const data = await loginUser({ email, password });
    if (data.success) {
      localStorage.setItem('foodygo_token', data.token);
      localStorage.setItem('foodygo_user', JSON.stringify(data.user));
      return data;
    }
    return rejectWithValue('Login failed');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed.');
  }
});

export const registerThunk = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await registerUser(userData);
    if (data.success) {
      localStorage.setItem('foodygo_token', data.token);
      localStorage.setItem('foodygo_user', JSON.stringify(data.user));
      return data;
    }
    return rejectWithValue('Registration failed');
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed.');
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutUser();
  } catch {
  } finally {
    localStorage.removeItem('foodygo_token');
    localStorage.removeItem('foodygo_user');
  }
  return null;
});

const initialUser = getInitialUser();
const initialToken = getInitialToken();

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    token: initialToken,
    role: initialUser?.role || null,
    isAuthenticated: !!initialToken && !!initialUser,
    loading: !!initialToken,
    error: null,
  },
  reducers: {
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload };
      state.role = state.user.role || state.role;
      localStorage.setItem('foodygo_user', JSON.stringify(state.user));
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(initAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload;
          state.role = action.payload.role || null;
          state.isAuthenticated = true;
        } else {
          state.user = null;
          state.token = null;
          state.role = null;
          state.isAuthenticated = false;
        }
      })
      .addCase(initAuth.rejected, (state) => {
        state.loading = false;
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
      })
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user?.role || null;
        state.isAuthenticated = true;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(registerThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.token;
        state.user = action.payload.user;
        state.role = action.payload.user?.role || null;
        state.isAuthenticated = true;
      })
      .addCase(registerThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.role = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

export const { updateUser, clearError } = authSlice.actions;
export default authSlice.reducer;
