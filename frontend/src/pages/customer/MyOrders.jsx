import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCustomerOrders } from '../../api/order';
import { Clock, ArrowRight, Store, FileText, ShoppingBag, Loader2 } from 'lucide-react';

export const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await getCustomerOrders();
        if (res?.success) {
          setOrders(res.data || []);
        }
      } catch {
        // error
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DELIVERED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED':
      case 'DELIVERY_ISSUE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'FOOD_READY':
      case 'OUT_FOR_DELIVERY':
      case 'PICKED_UP':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading your orders...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20">
      <div className="mb-8 pb-4 border-b border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          My Past Orders
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your order history and track active orders in real time
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-3xl text-center border border-slate-200">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">No orders placed yet</h2>
          <p className="text-xs text-slate-500 mt-1">
            Order delicious food from top restaurants to see them here!
          </p>
          <Link
            to="/"
            className="mt-6 inline-block px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const itemCount = order.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

            return (
              <div
                key={order._id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row sm:items-center justify-between gap-6"
              >
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">
                      #{order.orderNumber}
                    </span>
                    <span
                      className={`px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusBadge(
                        order.orderStatus
                      )}`}
                    >
                      {order.orderStatus.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <Store className="w-3.5 h-3.5 text-orange-600" />
                    <span>{order.restaurantId?.name || 'Restaurant'}</span>
                  </div>

                  <p className="text-xs text-slate-400">
                    {new Date(order.createdAt).toLocaleDateString()} at{' '}
                    {new Date(order.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>

                  <p className="text-xs text-slate-600">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'} •{' '}
                    <span className="font-bold text-slate-900">₹{order.totalAmount}</span> (
                    {order.paymentOption})
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/order/${order._id}/track`}
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md shadow-orange-500/20 transition flex items-center gap-1.5"
                  >
                    <span> Order Review</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div> 
  );
};

export default MyOrders;
