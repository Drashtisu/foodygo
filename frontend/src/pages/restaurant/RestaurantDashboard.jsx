import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getIncomingOrders,
  acceptOrder,
  rejectOrder,
  startPreparing,
  markFoodReady,
} from '../../api/restaurant';
import { useToast } from '../../context/ToastContext';
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  RefreshCw,
  Phone,
  User,
  MapPin,
  XCircle,
  Loader2,
  PackageCheck,
  AlertCircle,
} from 'lucide-react';

export const RestaurantDashboard = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [noRestaurant, setNoRestaurant] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getIncomingOrders(statusFilter);
      if (res?.success) {
        setOrders(res.data || []);
        setNoRestaurant(false);
      }
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data?.message?.includes('No restaurant')) {
        setNoRestaurant(true);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const handleAccept = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await acceptOrder(orderId);
      if (res?.success) {
        showToast('Order accepted! You can now start preparing.', 'success');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to accept order', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleReject = async (orderId) => {
    const reason = prompt('Please enter cancellation reason for the customer:', 'Kitchen at maximum capacity');
    if (!reason) return;
    try {
      setActionLoadingId(orderId);
      const res = await rejectOrder(orderId, reason);
      if (res?.success) {
        showToast('Order declined and refund processed.', 'info');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to reject order', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleStartPreparing = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await startPreparing(orderId);
      if (res?.success) {
        showToast('Kitchen started preparing food!', 'success');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to start preparing', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleMarkReady = async (orderId) => {
    try {
      setActionLoadingId(orderId);
      const res = await markFoodReady(orderId);
      if (res?.success) {
        showToast('Food marked READY for delivery pickup!', 'success');
        fetchOrders();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to mark food ready', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  if (noRestaurant) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center border border-slate-200 shadow-sm">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <ChefHat className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Restaurant Profile Required</h2>
        <p className="text-xs text-slate-500 mt-2 leading-relaxed">
          You are logged in as a Restaurant Partner, but you have not registered your restaurant profile yet.
        </p>
        <Link
          to="/restaurant/settings"
          className="mt-6 inline-block px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md"
        >
          Register Restaurant Now
        </Link>
      </div>
    );
  }

  const tabs = [
    { label: 'All Orders', value: '' },
    { label: 'Confirmed (New)', value: 'CONFIRMED' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Preparing', value: 'PREPARING' },
    { label: 'Food Ready', value: 'FOOD_READY' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Live Kitchen Manager
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time kitchen order board driven by Apache Kafka events
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchOrders}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4 text-orange-600" />
            <span>Refresh</span>
          </button>
          <Link
            to="/restaurant/menu"
            className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition"
          >
            Manage Menu Items
          </Link>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === tab.value
                ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Board */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          <p className="text-xs text-slate-500">Checking kitchen stream...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No active kitchen orders</h3>
          <p className="text-xs text-slate-500 mt-1">
            New orders confirmed by customers will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((order) => {
            const isActing = actionLoadingId === order._id;

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div>
                      <span className="font-mono font-bold text-xs text-slate-900">
                        #{order.orderNumber}
                      </span>
                      <p className="text-[10px] text-slate-400">
                        {new Date(order.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.orderStatus === 'CONFIRMED'
                          ? 'bg-amber-100 text-amber-800'
                          : order.orderStatus === 'ACCEPTED'
                          ? 'bg-blue-100 text-blue-800'
                          : order.orderStatus === 'PREPARING'
                          ? 'bg-orange-100 text-orange-800'
                          : order.orderStatus === 'FOOD_READY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Customer details */}
                  <div className="py-3 border-b border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerId?.name || 'Customer'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{order.customerId?.phone}</span>
                    </div>
                  </div>

                  {/* Items list */}
                  <div className="py-3 space-y-2 text-xs">
                    <p className="font-bold text-slate-700">Order Items:</p>
                    <div className="divide-y divide-slate-50">
                      {order.items?.map((item, idx) => (
                        <div key={idx} className="py-1 flex justify-between">
                          <span className="text-slate-800">
                            <span className="font-bold">{item.quantity}x</span> {item.name}
                          </span>
                          <span className="font-semibold text-slate-600">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 flex justify-between font-black text-slate-900 border-t border-slate-100">
                      <span>Total Paid:</span>
                      <span className="text-orange-600">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* Workflow Actions */}
                <div className="pt-4 border-t border-slate-100 space-y-2">
                  {order.orderStatus === 'CONFIRMED' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleReject(order._id)}
                        disabled={isActing}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Decline
                      </button>
                      <button
                        onClick={() => handleAccept(order._id)}
                        disabled={isActing}
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1"
                      >
                        {isActing ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Accept Order
                      </button>
                    </div>
                  )}

                  {order.orderStatus === 'ACCEPTED' && (
                    <button
                      onClick={() => handleStartPreparing(order._id)}
                      disabled={isActing}
                      className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      {isActing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Flame className="w-3.5 h-3.5" />
                      )}
                      Start Food Preparation
                    </button>
                  )}

                  {order.orderStatus === 'PREPARING' && (
                    <button
                      onClick={() => handleMarkReady(order._id)}
                      disabled={isActing}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                    >
                      {isActing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PackageCheck className="w-3.5 h-3.5" />
                      )}
                      Mark Food Ready for Pickup
                    </button>
                  )}

                  {order.orderStatus === 'FOOD_READY' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-bold text-emerald-800">
                      Food Ready • Awaiting Delivery Driver Pickup
                    </div>
                  )}

                  {order.orderStatus === 'DELIVERY_ASSIGNED' && (
                    <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-center text-xs font-bold text-blue-800">
                      Delivery Driver Assigned • Coming to kitchen
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RestaurantDashboard;
