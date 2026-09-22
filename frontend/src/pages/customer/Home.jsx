import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchRestaurants, getAllRestaurants } from '../../api/restaurant';
import { StarRating } from '../../components/StarRating';
import {
  Search,
  MapPin,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Clock,
  Flame,
  Store,
  ChefHat,
  MapPinCheckInside,
} from 'lucide-react';

export const Home = () => {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [selectedCity, setSelectedCity] = useState('');

  const cuisines = [
    'All',
    'Italian',                      
    'Indian',
    'Chinese',
    'Mexican',
    'Burgers',
    'Pizza',
    'Desserts',
  ];

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const cuisineParam = selectedCuisine === 'All' ? '' : selectedCuisine;
      const res = await searchRestaurants({
        query: searchQuery,
        cuisine: cuisineParam,
        city: selectedCity,
      });
      if (res?.success) {
        setRestaurants(res.data || []);
      }
    } catch {

      try {
        const fallback = await getAllRestaurants({ hasMenu: 'true' });
        if (fallback?.success) setRestaurants(fallback.data || []);
      } catch {
      
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchRestaurants();
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCuisine, selectedCity]);

  return (
    <div className="min-h-screen pb-16">
      
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 to-transparent pt-12 pb-16 px-4 sm:px-6 lg:px-8 border-b border-orange-100/50">
        <div className="max-w-7xl mx-auto text-center relative z-10">
          
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-3xl mx-auto leading-tight sm:leading-none">
            Craving something delicious?{' '}
            <span className="bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              Delivered fast.
            </span>
          </h1>
      

          
          <div className="mt-8 max-w-3xl mx-auto bg-white p-2.5 rounded-2xl sm:rounded-full shadow-xl shadow-orange-500/10 border border-slate-200 flex flex-col sm:flex-row items-center gap-2">
            <div className="relative flex-1 w-full pl-3 flex items-center cursor-pointer">
              <Search className="w-5 h-5 text-orange-300 shrink-0" />
              <input
                type="text"
                placeholder="Search restaurants, cuisines, dishes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>
            

            <div className="h-6 w-px bg-slate-200 hidden sm:block" />

            <div className="relative w-full sm:w-48 pl-3 flex items-center cursor-pointer">
           <MapPinCheckInside className='text-orange-300' />
              <input
                type="text"
                placeholder="City (e.g. Mumbai)"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="w-full pl-2 pr-4 py-2 text-sm text-slate-900 placeholder-slate-400 bg-transparent focus:outline-none"
              />
            </div>

            <button
              onClick={fetchRestaurants}
              className="w-full sm:w-auto px-6 py-3 rounded-xl sm:rounded-full bg-orange-600 hover:bg-orange-700 text-white cursor-pointer font-bold text-sm shadow-md shadow-orange-500/25 transition shrink-0"
            >
              Find Food
            </button>
          </div>

        
          {/* <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {cuisines.map((cuisine) => {
              const isSelected =
                (selectedCuisine === '' && cuisine === 'All') ||
                selectedCuisine === cuisine;
              return (
                <button
                  key={cuisine}
                  onClick={() => setSelectedCuisine(cuisine === 'All' ? '' : cuisine)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition ${
                    isSelected
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-500/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  {cuisine}
                </button>
              );
            })}
          </div> */}
        </div>
      </section>


    
       <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              Featured Restaurants
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing {restaurants.length} {restaurants.length === 1 ? 'place' : 'places'} available
            </p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-3"
              >
                <div className="h-44 bg-slate-200 rounded-2xl" />
                <div className="h-4 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : restaurants.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-16 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-sm">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center mb-4">
              <ChefHat className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">No restaurants found</h3>
            <p className="text-sm text-slate-500 mt-1">
              Try changing your search keywords, city filter, or switch to the Restaurant Owner demo to create one!
            </p>
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCuisine('');
                  setSelectedCity('');
                }}
                className="px-4 py-2 text-xs font-bold text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-xl transition"
              >
                Reset Filters
              </button>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition"
              >
                Register as Restaurant Owner
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {restaurants.map((rest) => {  
              const cuisinesList = Array.isArray(rest.cuisine)
                ? rest.cuisine
                : [rest.cuisine].filter(Boolean);

              return (
                <Link
                  key={rest._id}
                  to={`/restaurant/${rest._id}`}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-orange-500/10 hover:border-orange-200 transition-all duration-300 flex flex-col"
                >


                
                
                  <div className="relative h-48 bg-slate-100 overflow-hidden">
                    <img
                      src={rest.imageUrl || 'https://images.unsplash.com/photo-1636405189493-181ecf851006?w=500&auto=format&fit=crop&q=60'}
                      alt={rest.name}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1636405189493-181ecf851006?w=500&auto=format&fit=crop&q=60';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          rest.isOpen
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-700 text-slate-200'
                        }`}
                      >
                        {rest.isOpen ? 'Open Now' : 'Closed'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                      <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-bold">
                        <StarRating rating={rest.rating || 4.5} size="sm" />
                        <span>{rest.rating ? rest.rating.toFixed(1) : '4.5'}</span>
                        <span className="text-white/60 font-normal">
                          ({rest.totalReviews || 0})
                        </span>
                      </div>
                      <span className="text-xs font-medium bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Clock className="w-3 h-3 text-orange-400" /> 25-35 min
                      </span>
                    </div>
                  </div>

              
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-orange-600 transition">
                        {rest.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {rest.description || 'Fresh ingredients, signature recipes, and fast delivery.'}  
                      </p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {cuisinesList.map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                      <div className="flex items-center gap-1 truncate max-w-[200px]">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {rest.address?.city || 'Local Area'}, {rest.address?.street || ''}
                        </span>
                      </div>
                      <span className="font-bold text-orange-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                        Menu <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section> 
    </div>
  );
};

export default Home;
