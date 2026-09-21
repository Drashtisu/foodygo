import React, { useState, useEffect } from 'react';
import { getAllOrders } from '../../api/order';
import api from '../../api/client';
import { useToast } from '../../context/ToastContext';
import {
  ShieldCheck,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  Store,
  User,
  Bike,
  Loader2,
} from 'lucide-react';

export const SupportDashboard = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [gatewayStatus, setGatewayStatus] = useState('CHECKING');

  const checkHealth = async () => {
    try {
      const res = await api.get('/health', { baseURL: '' });
      if (res.data?.status === 'UP') {
        setGatewayStatus('HEALTHY');
      } else {
        setGatewayStatus('UP');
      }
    } catch {
      setGatewayStatus('OFFLINE');
    }
  };

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getAllOrders(statusFilter);
      if (res?.success) {
        setOrders(res.data || []);
      }
    } catch {
      // error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
      checkHealth();
    }, 15000);
    return () => clearInterval(interval);
  }, [statusFilter]);

  const issuesCount = orders.filter(
    (o) => o.orderStatus === 'DELIVERY_ISSUE' || o.orderStatus === 'CANCELLED'
  ).length;

  const deliveredCount = orders.filter((o) => o.orderStatus === 'DELIVERED').length;
  const activeCount = orders.length - issuesCount - deliveredCount;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-purple-600" />
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Support & Operations Center
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Global view of all microservices events, active deliveries, and ticket escalations
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold transition flex items-center gap-1.5 self-start"
        >
          <RefreshCw className="w-4 h-4 text-purple-600" />
          <span>Refresh View</span>
        </button>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Orders
            </p>
            <p className="text-xl font-black text-slate-900">{orders.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              In Progress
            </p>
            <p className="text-xl font-black text-slate-900">{activeCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Delivered
            </p>
            <p className="text-xl font-black text-slate-900">{deliveredCount}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Issues / Flagged
            </p>
            <p className="text-xl font-black text-rose-600">{issuesCount}</p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
        {[
          { label: 'All Orders', value: '' },
          { label: 'Delivery Issue (Tickets)', value: 'DELIVERY_ISSUE' },
          { label: 'Confirmed', value: 'CONFIRMED' },
          { label: 'Food Preparing', value: 'PREPARING' },
          { label: 'Food Ready', value: 'FOOD_READY' },
          { label: 'Out for Delivery', value: 'OUT_FOR_DELIVERY' },
          { label: 'Delivered', value: 'DELIVERED' },
          { label: 'Cancelled', value: 'CANCELLED' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              statusFilter === f.value
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-purple-600 animate-spin" />
          <p className="text-xs text-slate-500">Querying platform orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800">No matching orders found</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try switching the filter tag or placing a new order as customer.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Order #</th>
                  <th className="p-4">Customer</th>
                  <th className="p-4">Restaurant</th>
                  <th className="p-4">Delivery Driver</th>
                  <th className="p-4">Total Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      #{order.orderNumber}
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">{order.customerId?.name || 'User'}</p>
                      <p className="text-slate-400 text-[10px]">{order.customerId?.phone}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {order.restaurantId?.name || 'Restaurant'}
                      </p>
                    </td>
                    <td className="p-4">
                      {order.deliveryBoyId ? (
                        <div>
                          <p className="font-bold text-slate-800">{order.deliveryBoyId.name}</p>
                          <p className="text-slate-400 text-[10px]">{order.deliveryBoyId.phone}</p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="p-4 font-black text-slate-900">
                      ₹{order.totalAmount}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.orderStatus === 'DELIVERED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : order.orderStatus === 'DELIVERY_ISSUE' ||
                              order.orderStatus === 'CANCELLED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {order.orderStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">
                      {new Date(order.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
