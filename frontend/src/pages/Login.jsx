import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, Eye, EyeOff, Loader2, User, Store, Bike, Headset, KeyRound } from 'lucide-react';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return;
    try {
      setLoading(true);
      const loggedInUser = await login(email, password);
  
      if (from === '/') {
        if (loggedInUser.role === 'restaurant') navigate('/restaurant/dashboard');
        else if (loggedInUser.role === 'delivery') navigate('/delivery/dashboard');
        else if (loggedInUser.role === 'support') navigate('/support/dashboard');
        else navigate('/');
      } else {
        navigate(from, { replace: true });
      }
    } catch {
   
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (roleName, demoEmail, demoName, demoPhone) => {
    const demoPass = 'Password@123';
    setEmail(demoEmail);
    setPassword(demoPass);
    try {
      setLoading(true);
      let user;
      try {
        user = await login(demoEmail, demoPass);
      } catch {
        user = await register({
          name: demoName,
          email: demoEmail,
          password: demoPass,
          phone: demoPhone,
          role: roleName,
        });
      }
      if (roleName === 'restaurant') navigate('/restaurant/dashboard');
      else if (roleName === 'delivery') navigate('/delivery/dashboard');
      else if (roleName === 'support') navigate('/support/dashboard');
      else navigate('/');
    } catch {
      // Error handled
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100">
        <div className="text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/20 mb-4">
            <UtensilsCrossed className="w-7 h-7" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your FoodyGo account
          </p>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
               
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition flex items-center justify-center gap-2 disabled:opacity-75"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Sign In
          </button>
        </form>

        {/* Demo Accounts Quick Login */}
        {/* <div className="pt-4 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 text-center mb-3">
            Or test with 1-click Demo Accounts:
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin('customer', 'customer@foodygo.com', 'Sarah Customer', '9876543210')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-left transition flex items-center gap-2 text-xs text-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold truncate">Customer</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('restaurant', 'restaurant@foodygo.com', 'Marco Bistro Owner', '9876543211')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-300 text-left transition flex items-center gap-2 text-xs text-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold truncate">Restaurant</span>
            </button>

            <button
              type="button"
              onClick={() => handleDemoLogin('delivery', 'delivery@foodygo.com', 'Alex Rider', '9876543212')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-left transition flex items-center gap-2 text-xs text-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <Bike className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold truncate">Delivery</span>
            </button>


            <button
              type="button"
              onClick={() => handleDemoLogin('support', 'support@foodygo.com', 'Elena Support', '9876543213')}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 text-left transition flex items-center gap-2 text-xs text-slate-700"
            >
              <div className="w-6 h-6 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                <Headset className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold truncate">Support</span>
            </button>
          </div>
        </div> */}

        <p className="text-center text-xs text-slate-500">
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-orange-600 hover:text-orange-700">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
