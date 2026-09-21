import React, { createContext, useContext, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  initAuth,
  loginThunk,
  registerThunk,
  logoutThunk,
  updateUser as updateUserAction,
} from '../redux/slices/authSlice';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, loading, isAuthenticated, role } = useSelector((state) => state.auth);
  const { showToast } = useToast();

  useEffect(() => {
    dispatch(initAuth());
  }, [dispatch]);

  const login = async (email, password) => {
    try {
      const resultAction = await dispatch(loginThunk({ email, password })).unwrap();
      showToast(`Welcome back, ${resultAction.user.name}!`, 'success');
      return resultAction.user;
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Login failed.';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const register = async (userData) => {
    try {
      const resultAction = await dispatch(registerThunk(userData)).unwrap();
      showToast('Registration successful! Welcome to FoodyGo.', 'success');
      return resultAction.user;
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Registration failed. Please try again.';
      showToast(msg, 'error');
      throw new Error(msg);
    }
  };

  const logout = async () => {
    await dispatch(logoutThunk());
    showToast('You have been logged out.', 'info');
  };

  const updateUser = (updatedFields) => {
    dispatch(updateUserAction(updatedFields));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated,
        role,
        login,
        register,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
