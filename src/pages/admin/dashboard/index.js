'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Calendar, CheckCircle, 
  ShoppingBag, Loader2, DollarSign, PieChart as PieIcon,
  ArrowUpRight, ArrowDownRight, Smartphone, Banknote, Hash, CreditCard
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, Area, AreaChart
} from 'recharts';

import DashboardLayout from '@/layout';
import { api } from '@/libs/apiAgent';

// --- THEME COLORS ---
const THEME = {
  primary: '#0F2027',   // Satin Blue (Mobile Money)
  secondary: '#D4AF37', // Gold (Cash)
  accent: '#F3E5AB',    // Champagne
  merchant: '#06b6d4',  // Cyan (Merchant Pay)
  gray: '#9ca3af'
};

// Maps specific payment methods to colors for the Pie Chart
const getColorForMethod = (name) => {
  const n = name?.toLowerCase() || '';
  if (n.includes('mobile')) return THEME.primary;
  if (n.includes('cash')) return THEME.secondary;
  if (n.includes('merchant')) return THEME.merchant;
  return '#E5E7EB'; // Gray for unknown
};

// --- Helper Components ---

const StatCard = ({ title, value, prefix, suffix, icon: Icon, trend }) => (
  <div className="bg-white p-6 rounded-[2px] border border-gray-100 shadow-sm flex flex-col justify-between h-full relative overflow-hidden group hover:border-[#D4AF37] transition-all duration-300">
    {/* Decorative corner accent */}
    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-transparent to-gray-50 opacity-50 rounded-bl-full -mr-8 -mt-8 transition-all group-hover:from-[#D4AF37]/10"></div>
    
    <div className="flex justify-between items-start mb-4 relative z-10">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{title}</p>
        <div className="flex items-baseline mt-2 gap-1">
          {prefix && <span className="text-sm font-medium text-gray-500">{prefix}</span>}
          <h3 className="text-2xl font-serif font-bold text-[#0F2027]">{value}</h3>
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
      <div className="p-3 rounded-full bg-[#fcfbf7] text-[#0F2027] border border-gray-100 group-hover:border-[#D4AF37] group-hover:text-[#D4AF37] transition-colors shadow-sm">
        <Icon size={20} />
      </div>
    </div>
    
    {/* Trend Indicator */}
    {trend !== undefined && (
      <div className="flex items-center gap-2 mt-2">
        <div className={`flex items-center text-xs font-bold ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {trend >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(trend)}%</span>
        </div>
        <span className="text-[10px] text-gray-400 uppercase tracking-wider">vs last month</span>
      </div>
    )}
    
    {/* Bottom Border Accent */}
    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#0F2027] via-[#D4AF37] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
  </div>
);

// Payment Icon Helper
const PaymentIcon = ({ method }) => {
  const m = method?.toLowerCase() || '';
  if (m.includes('mobile')) return <Smartphone size={14} className="text-[#0F2027]" />;
  if (m.includes('cash')) return <Banknote size={14} className="text-[#D4AF37]" />;
  if (m.includes('merchant')) return <Hash size={14} className="text-[#06b6d4]" />;
  return <CreditCard size={14} className="text-gray-400" />;
};

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); 

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.dashboard.getStats(timeRange);
        
        setData({
          revenue: response.stats?.revenue || { total: 0, chart: [] },
          bookings: response.stats?.bookings || { active: 0, recent: [] },
          rooms: response.stats?.rooms || { available: 0, total: 0 },
          users: response.stats?.users || { total: 0 },
          payments: response.stats?.payments || { breakdown: [] }
        });
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange]);

  if (loading || !data) {
    return (
      <DashboardLayout>
        <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400">
          <Loader2 size={40} className="animate-spin text-[#D4AF37] mb-4" />
          <p className="font-serif text-[#0F2027]">Loading Empire Statistics...</p>
        </div>
      </DashboardLayout>
    );
  }

  const occupancyRate = data.rooms.total > 0 
    ? Math.round(((data.rooms.total - data.rooms.available) / data.rooms.total) * 100) 
    : 0;

  return (
    <DashboardLayout>
      <div className="p-6 md:p-12 font-sans text-gray-900">
        
        {/* Header */}
        <div className="mb-8 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">Empire Dashboard</h1>
            <p className="text-gray-500 text-sm">Real-time Overview of Performance.</p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest">{new Date().toDateString()}</p>
          </div>
        </div>

        {/* 1. KEY METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={data.revenue.total?.toLocaleString()} 
            prefix="UGX"
            icon={TrendingUp}
            trend={12} // Example trend
          />
          <StatCard 
            title="Active Bookings" 
            value={data.bookings.active} 
            icon={ShoppingBag}
            trend={-5} // Example trend
          />
          <StatCard 
            title="Occupancy Rate" 
            value={`${occupancyRate}%`}
            icon={CheckCircle}
            suffix={`(${data.rooms.available} Free)`}
          />
          <StatCard 
            title="Total Users" 
            value={data.users.total} 
            icon={Users}
            trend={8}
          />
        </div>

        {/* 2. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left: Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2px] border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#0F2027]">Revenue Trend</h3>
                <p className="text-xs text-gray-400">Income vs Bookings over time</p>
              </div>
              
              {/* Custom Segmented Control */}
              <div className="bg-gray-50 p-1 rounded-[2px] flex border border-gray-100">
                {[{ label: '7 Days', val: '7d' }, { label: '30 Days', val: '30d' }, { label: 'Year', val: '1y' }].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setTimeRange(opt.val)}
                    className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-[1px] transition-all ${
                      timeRange === opt.val 
                        ? 'bg-[#0F2027] text-[#D4AF37] shadow-sm' 
                        : 'text-gray-400 hover:text-[#0F2027]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenue.chart} margin={{ top: 20, right: 0, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={THEME.primary} stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={THEME.secondary} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={THEME.secondary} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#9ca3af', fontWeight: 600 }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tick={{ fontSize: 10, fill: '#9ca3af' }} 
                    axisLine={false} 
                    tickLine={false}
                    dx={-10}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '2px', border: '1px solid #f0f0f0', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    formatter={(value, name) => [
                      name === 'Revenue (UGX)' ? `UGX ${value.toLocaleString()}` : value, 
                      name
                    ]}
                  />
                  <Legend 
                    verticalAlign="top" 
                    height={36} 
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                  <Area 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue (UGX)"
                    stroke={THEME.primary} 
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                    strokeWidth={2}
                  />
                  <Area 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="bookings" 
                    name="Bookings"
                    stroke={THEME.secondary} 
                    fillOpacity={1} 
                    fill="url(#colorBookings)" 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Pie Chart */}
          <div className="bg-white p-6 rounded-[2px] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-serif text-lg font-bold text-[#0F2027] mb-2">Payment Methods</h3>
            <p className="text-xs text-gray-400 mb-6">Distribution of transactions</p>
            <div className="flex-1 min-h-[300px] flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.payments.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {data.payments.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getColorForMethod(entry.name)} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '2px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }} 
                    itemStyle={{ color: THEME.primary, fontWeight: 'bold' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    height={36} 
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Icon/Text for Donut */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <DollarSign className="text-gray-200" size={32} />
              </div>
            </div>
          </div>
        </div>

        {/* 3. RECENT BOOKINGS TABLE */}
        <div className="bg-white rounded-[2px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
             <h3 className="font-serif text-lg font-bold text-[#0F2027]">Recent Bookings</h3>
             <button className="text-xs font-bold text-[#D4AF37] uppercase tracking-widest hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.bookings.recent && data.bookings.recent.length > 0 ? (
                  data.bookings.recent.map((booking) => (
                    <tr key={booking.key || booking.id} className="hover:bg-[#fcfbf7] transition-colors group">
                      <td className="px-6 py-4 text-xs font-mono text-gray-500">
                        {booking.id ? booking.id.slice(0, 8) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0F2027] text-[#D4AF37] flex items-center justify-center font-bold text-xs">
                            {booking.guest ? booking.guest.charAt(0) : 'U'}
                          </div>
                          <span className="text-sm font-bold text-[#0F2027]">{booking.guest}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <PaymentIcon method={booking.paymentMethod} />
                          <span className="capitalize">{booking.paymentMethod || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${
                          booking.status === 'confirmed' ? 'bg-green-50 text-green-700 border-green-100' :
                          booking.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                          'bg-red-50 text-red-700 border-red-100'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#0F2027] text-sm">
                        UGX {(booking.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-400 text-sm">
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;