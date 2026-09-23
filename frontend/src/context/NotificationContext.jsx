import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { getMyNotifications, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead } from '../api/notification';
import { connectSocket, disconnectSocket } from '../socket/socketClient';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated, token } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  const socketRef = useRef(null);


  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getMyNotifications();
      if (res?.success) {
        setNotifications(res.data || []);
        setUnreadCount(res.unreadCount || 0);
      }
    } catch (err) {
      console.warn('[NotificationContext] Failed to load initial notifications:', err?.message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Connect to Socket.io when authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      socketRef.current = null;
      setNotifications([]);
      setUnreadCount(0);
      setIsConnected(false);
      return;
    }

  
    fetchNotifications();

    
    const currentToken = token || localStorage.getItem('foodygo_token');
    const socket = connectSocket(currentToken);
    socketRef.current = socket;

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

   
    const handleNewNotification = (newNotif) => {
      console.log('[NotificationContext] Real-time notification received:', newNotif);

      setNotifications((prev) => {
      
        if (prev.some((n) => n._id === newNotif._id)) {
          return prev;
        }
        return [newNotif, ...prev];
      });

      setUnreadCount((prev) => prev + 1);

      // Trigger instantaneous toast alert anywhere on the screen
      if (showToast && newNotif.title) {
        showToast(`${newNotif.title} - ${newNotif.message}`, 'info');
      }
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('notification', handleNewNotification);

    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('notification', handleNewNotification);
    };
  }, [isAuthenticated, token, fetchNotifications, showToast]);

  const markAsRead = useCallback(async (id) => {
    try {
      await apiMarkAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[NotificationContext] Failed to mark as read:', err?.message);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiMarkAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('[NotificationContext] Failed to mark all as read:', err?.message);
    }
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        isConnected,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        socket: socketRef.current,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
