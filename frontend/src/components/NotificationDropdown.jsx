import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, Clock, Info, Wifi } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export const NotificationDropdown = () => {
  const { isAuthenticated } = useAuth();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isConnected,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside any where
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    await markAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllAsRead();
  };

  if (!isAuthenticated) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition focus:outline-none cursor-pointer"
        title="Notifications (Real-Time)"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-sm">Notifications</h3>
              {isConnected ? (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  <Wifi className="w-2.5 h-2.5" />
                  Connecting
                </span>
              )}
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-700 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  className={`p-4 transition hover:bg-slate-50 flex items-start justify-between gap-3 ${
                    !n.isRead ? 'bg-orange-50/40' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4
                        className={`text-xs truncate ${
                          !n.isRead
                            ? 'text-slate-900 font-bold'
                            : 'text-slate-700 font-semibold'
                        }`}
                      >
                        {n.title}
                      </h4>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed line-clamp-2">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2">
                      <Clock className="w-3 h-3" />
                      {new Date(n.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}{' '}
                      • {new Date(n.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {!n.isRead && (
                    <button
                      onClick={(e) => handleMarkRead(n._id, e)}
                      title="Mark as read"
                      className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
