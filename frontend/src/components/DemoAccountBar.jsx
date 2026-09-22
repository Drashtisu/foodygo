import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { User, Store, Bike, Headset, Sparkles, Loader2 } from 'lucide-react';

export const DemoAccountBar = () => {
  const { user, login, register, logout, role } = useAuth();
  const { showToast } = useToast();
  const [loadingRole, setLoadingRole] = useState(null);

  const demoAccounts = [
    {
      role: 'customer',
      label: 'Customer',
      email: 'customer@foodygo.com',
      name: 'Sarah Customer',
      phone: '9876543210',
      icon: User,
      color: 'bg-emerald-500 hover:bg-emerald-600 text-white',
      badge: 'Order food',
    },
    {
      role: 'restaurant',
      label: 'Restaurant Owner',
      email: 'restaurant@foodygo.com',
      name: 'Marco Bistro Owner',
      phone: '9876543211',
      icon: Store,
      color: 'bg-amber-500 hover:bg-amber-600 text-white',
      badge: 'Manage Kitchen',
    },
    {
      role: 'delivery',
      label: 'Delivery Partner',
      email: 'delivery@foodygo.com',
      name: 'Alex Rider',
      phone: '9876543212',
      icon: Bike,
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      badge: 'Deliver Food',
    },
    {
      role: 'support',
      label: 'Support / Admin',
      email: 'support@foodygo.com',
      name: 'Elena Support',
      phone: '9876543213',
      icon: Headset,
      color: 'bg-purple-500 hover:bg-purple-600 text-white',
      badge: 'Monitor All',
    },
  ];

  const handleQuickLogin = async (acc) => {
    setLoadingRole(acc.role);
    const password = 'Password@123';
    try {
     
      try {
        await login(acc.email, password);
      } catch {
      
        await register({
          name: acc.name,
          email: acc.email,
          password: password,
          phone: acc.phone,
          role: acc.role,
        });
      }
    } catch {
      showToast(`Could not switch to demo ${acc.label}`, 'error');
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <div className="bg-slate-900 text-white py-2 px-4 text-xs">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-slate-300">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="font-semibold text-white">Quick Demo Switcher:</span>
          <span className="hidden md:inline text-slate-400">
            Click any role to test its full end-to-end flow
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {demoAccounts.map((acc) => {
            const Icon = acc.icon;
            const isCurrent = user?.email === acc.email;
            const isLoading = loadingRole === acc.role;

            return (
              <button
                key={acc.role}
                onClick={() => handleQuickLogin(acc)}
                disabled={isCurrent || !!loadingRole}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition disabled:opacity-75 ${
                  isCurrent
                    ? 'ring-2 ring-white/80 bg-white/20 text-white cursor-default'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
                title={`Switch to ${acc.label}`}
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                ) : (
                  <Icon className="w-3 h-3" />
                )}
                <span>{acc.label}</span>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DemoAccountBar;
