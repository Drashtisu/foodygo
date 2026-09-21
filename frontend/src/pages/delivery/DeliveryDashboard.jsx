import React, { useState, useEffect } from 'react';
import {
  getAvailableOrders,
  getMyDeliveries,
  assignDeliveryBoy,
  acceptDelivery,
  goToRestaurant,
  takeFood,
  foodOutForDelivery,
  reachedCustomerLocation,
  reportDeliveryIssue,
  handover,
  markOrderDelivered,
} from '../../api/delivery';
import { useToast } from '../../context/ToastContext';
import {
  Bike,
  Navigation,
  MapPin,
  Store,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  Package,
  Check,
  Loader2,
  XCircle,
} from 'lucide-react';

export const DeliveryDashboard = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('available'); // 'available' or 'my-deliveries'
  const [availableOrders, setAvailableOrders] = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [availRes, myRes] = await Promise.all([
        getAvailableOrders(),
        getMyDeliveries(false),
      ]);
      if (availRes?.success) setAvailableOrders(availRes.data || []);
      if (myRes?.success) setMyDeliveries(myRes.data || []);
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimOrder = async (orderId) => {
    try {
      setActionId(orderId);
      const assignRes = await assignDeliveryBoy(orderId);
      if (assignRes?.success) {
        // Automatically accept delivery
        await acceptDelivery(orderId);
        showToast('Order assigned and accepted! You can now navigate to restaurant.', 'success');
        setActiveTab('my-deliveries');
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to claim order', 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleStepAction = async (orderId, actionFn, successMsg) => {
    try {
      setActionId(orderId);
      const res = await actionFn(orderId);
      if (res?.success) {
        showToast(successMsg, 'success');
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Action failed', 'error');
    } finally {
      setActionId(null);
    }
  };

  const handleReportIssue = async (orderId) => {
    const reason = prompt(
      'Enter reason for delivery issue (will alert Customer Support):',
      'Customer phone unreachable / Incomplete building address'
    );
    if (!reason) return;
    try {
      setActionId(orderId);
      const res = await reportDeliveryIssue(orderId, reason);
      if (res?.success) {
        showToast('Delivery issue reported and support ticket opened.', 'info');
        fetchAllData();
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to report issue', 'error');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <Bike className="w-6 h-6 text-orange-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Delivery Partner Portal
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Accept and deliver orders with Kafka event-driven coordination
          </p>
        </div>

        <button
          onClick={fetchAllData}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-4 h-4 text-orange-600" />
          <span>Refresh Pool</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'available'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Available Orders Pool ({availableOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('my-deliveries')}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'my-deliveries'
              ? 'bg-orange-600 text-white shadow-lg shadow-orange-500/20'
              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Bike className="w-4 h-4" />
          <span>My Deliveries ({myDeliveries.length})</span>
        </button>
      </div>

      {/* Available Orders Pool Tab */}
      {activeTab === 'available' && (
        <div>
          {loading ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
              <p className="text-xs text-slate-500">Checking delivery pool...</p>
            </div>
          ) : availableOrders.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No orders awaiting delivery</h3>
              <p className="text-xs text-slate-500 mt-1">
                When restaurants prepare food, ready orders will be published here in real time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {availableOrders.map((order) => {
                const isActing = actionId === order._id;

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          #{order.orderNumber}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {order.orderStatus}
                        </span>
                      </div>

                      {/* Pickup from */}
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-400 font-bold uppercase text-[10px]">
                          Pickup From:
                        </p>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <Store className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>{order.restaurantId?.name}</span>
                        </p>
                        <p className="text-slate-500 text-[11px] pl-5">
                          {order.restaurantId?.address?.street}, {order.restaurantId?.address?.city}
                        </p>
                      </div>

                      {/* Deliver to */}
                      <div className="space-y-1 text-xs">
                        <p className="text-slate-400 font-bold uppercase text-[10px]">
                          Deliver To:
                        </p>
                        <p className="font-bold text-slate-900 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>{order.deliveryAddress?.fullName || order.customerId?.name}</span>
                        </p>
                        <p className="text-slate-500 text-[11px] pl-5">
                          {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                        </p>
                      </div>

                      <div className="pt-2 flex justify-between font-bold text-xs border-t border-slate-100">
                        <span className="text-slate-500">Order Value:</span>
                        <span className="text-slate-900">₹{order.totalAmount}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => handleClaimOrder(order._id)}
                        disabled={isActing}
                        className="w-full py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-70"
                      >
                        {isActing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Bike className="w-4 h-4" />
                        )}
                        <span>Accept & Claim Delivery</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* My Active Deliveries Tab */}
      {activeTab === 'my-deliveries' && (
        <div>
          {myDeliveries.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
              <Bike className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-800">No active deliveries</h3>
              <p className="text-xs text-slate-500 mt-1">
                Switch to "Available Orders Pool" to pick up an order!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myDeliveries.map((order) => {
                const isActing = actionId === order._id;
                const status = order.orderStatus;

                return (
                  <div
                    key={order._id}
                    className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="font-mono font-bold text-xs text-slate-900">
                          #{order.orderNumber}
                        </span>
                        <p className="text-[10px] text-slate-400">
                          Accepted on {new Date(order.updatedAt).toLocaleTimeString()}
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          status === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : status === 'DELIVERY_ISSUE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {status.replace(/_/g, ' ')}
                      </span>
                    </div>

                    {/* Step by step action buttons based on current state */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                        Next Delivery Step:
                      </p>

                      {status === 'DELIVERY_ACCEPTED' && (
                        <button
                          onClick={() =>
                            handleStepAction(
                              order._id,
                              goToRestaurant,
                              'Status updated: Heading to restaurant'
                            )
                          }
                          disabled={isActing}
                          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Navigation className="w-4 h-4" />
                          )}
                          <span>1. Heading to Restaurant</span>
                        </button>
                      )}

                      {status === 'GOING_TO_RESTAURANT' && (
                        <button
                          onClick={() =>
                            handleStepAction(
                              order._id,
                              takeFood,
                              'Status updated: Food collected from kitchen'
                            )
                          }
                          disabled={isActing}
                          className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Package className="w-4 h-4" />
                          )}
                          <span>2. Pick Up Food from Restaurant</span>
                        </button>
                      )}

                      {status === 'PICKED_UP' && (
                        <button
                          onClick={() =>
                            handleStepAction(
                              order._id,
                              foodOutForDelivery,
                              'Status updated: Out for delivery to customer'
                            )
                          }
                          disabled={isActing}
                          className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Bike className="w-4 h-4" />
                          )}
                          <span>3. Set Out for Delivery</span>
                        </button>
                      )}

                      {(status === 'OUT_FOR_DELIVERY' || status === 'REACHED_CUSTOMER_LOCATION') && (
                        <div className="space-y-2">
                          {status === 'OUT_FOR_DELIVERY' && (
                            <button
                              onClick={() =>
                                handleStepAction(
                                  order._id,
                                  reachedCustomerLocation,
                                  'Status updated: Arrived at customer destination'
                                )
                              }
                              disabled={isActing}
                              className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                            >
                              {isActing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <MapPin className="w-4 h-4" />
                              )}
                              <span>4. Reached Customer Location</span>
                            </button>
                          )}

                          {status === 'REACHED_CUSTOMER_LOCATION' && (
                            <button
                              onClick={() =>
                                handleStepAction(
                                  order._id,
                                  handover,
                                  'Status updated: Food handed over to customer'
                                )
                              }
                              disabled={isActing}
                              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                            >
                              {isActing ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4" />
                              )}
                              <span>5. Handover Food to Customer</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleReportIssue(order._id)}
                            disabled={isActing}
                            className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 transition flex items-center justify-center gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Report Issue / Location Not Reachable</span>
                          </button>
                        </div>
                      )}

                      {status === 'HANDOVER' && (
                        <button
                          onClick={() =>
                            handleStepAction(
                              order._id,
                              markOrderDelivered,
                              'Order marked successfully DELIVERED!'
                            )
                          }
                          disabled={isActing}
                          className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                        >
                          {isActing ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          <span>6. Confirm & Mark Delivered</span>
                        </button>
                      )}

                      {status === 'DELIVERED' && (
                        <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 text-xs font-bold text-center">
                          Order Successfully Delivered!
                        </div>
                      )}

                      {status === 'DELIVERY_ISSUE' && (
                        <div className="p-3 rounded-xl bg-rose-100 text-rose-800 text-xs font-bold text-center">
                          Delivery Issue Logged • Escalated to Customer Support
                        </div>
                      )}
                    </div>

                    {/* Addresses summary */}
                    <div className="grid grid-cols-2 gap-3 text-xs pt-2">
                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <Store className="w-3.5 h-3.5 text-orange-600" /> Restaurant
                        </p>
                        <p className="text-slate-600 truncate">{order.restaurantId?.name}</p>
                        <p className="text-[11px] text-slate-500">{order.restaurantId?.phone}</p>
                      </div>

                      <div className="p-3 rounded-xl bg-slate-50">
                        <p className="font-bold text-slate-800 mb-1 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-blue-600" /> Customer
                        </p>
                        <p className="text-slate-600 truncate">
                          {order.deliveryAddress?.fullName || order.customerId?.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {order.deliveryAddress?.phone || order.customerId?.phone}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
