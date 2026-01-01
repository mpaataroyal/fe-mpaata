'use client';

import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, Calendar, CheckCircle, 
  ShoppingBag, Loader2, DollarSign, PieChart as PieIcon
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';

import DashboardLayout from '@/layout';
import { api } from '@/libs/apiAgent';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

// --- Helper Components ---

const StatCard = ({ title, value, prefix, suffix, icon: Icon, trend, colorClass }) => (
  <div className="bg-white p-6 rounded-[2px] border border-gray-100 shadow-sm flex flex-col justify-between h-full">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{title}</p>
        <div className="flex items-baseline mt-1 gap-1">
          {prefix && <span className="text-sm font-medium text-gray-500">{prefix}</span>}
          <h3 className="text-2xl font-serif font-bold text-[#0F2027]">{value}</h3>
          {suffix && <span className="text-xs text-gray-400">{suffix}</span>}
        </div>
      </div>
      <div className={`p-2 rounded-full ${colorClass} bg-opacity-10`}>
        <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
      </div>
    </div>
    {trend && (
      <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
        <div 
          className={`h-1.5 rounded-full ${colorClass.replace('bg-', 'bg-')}`} 
          style={{ width: `${trend}%` }}
        ></div>
      </div>
    )}
  </div>
);

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d'); 

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const response = await api.dashboard.getStats(timeRange);
        // Ensure data structure matches what we expect, providing fallbacks
        setData({
          revenue: response.stats?.revenue || { total: 0, chart: [] },
          bookings: response.stats?.bookings || { active: 0, recent: [] },
          rooms: response.stats?.rooms || { available: 0, total: 0 },
          users: response.stats?.users || { total: 0 },
          payments: response.stats?.payments || { breakdown: [] }
        });
      } catch (error) {
        console.error(error);
        // In a real app, toast.error('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, [timeRange]);

  if (loading || !data) {
    return (
        <div className="h-[80vh] flex flex-col items-center justify-center text-gray-400">
          <Loader2 size={40} className="animate-spin text-[#D4AF37] mb-4" />
          <p className="font-serif text-[#0F2027]">Loading Empire Statistics...</p>
        </div>
      
    );
  }

  // Calculate percentage for progress bar
  const occupancyRate = data.rooms.total > 0 
    ? Math.round(((data.rooms.total - data.rooms.available) / data.rooms.total) * 100) 
    : 0;

  return (
      <div className="p-6 md:p-12 font-sans text-gray-900">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl text-[#0F2027] mb-1">Dashboard</h1>
          <p className="text-gray-500 text-sm">Real-time Overview of Empire Performance.</p>
        </div>

        {/* 1. KEY METRICS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Revenue" 
            value={data.revenue.total?.toLocaleString()} 
            prefix="UGX"
            icon={TrendingUp}
            colorClass="bg-green-600 text-green-600"
          />
          <StatCard 
            title="Active Bookings" 
            value={data.bookings.active} 
            icon={ShoppingBag}
            colorClass="bg-blue-600 text-blue-600"
          />
          <StatCard 
            title="Occupancy" 
            value={`${data.rooms.total - data.rooms.available} / ${data.rooms.total}`}
            icon={CheckCircle}
            trend={occupancyRate}
            colorClass="bg-[#D4AF37] text-[#D4AF37]"
          />
          <StatCard 
            title="Total Users" 
            value={data.users.total} 
            icon={Users}
            colorClass="bg-purple-600 text-purple-600"
          />
        </div>

        {/* 2. CHARTS SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          {/* Left: Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2px] border border-gray-100 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h3 className="font-serif text-lg font-bold text-[#0F2027]">Revenue Trend</h3>
              
              {/* Custom Segmented Control */}
              <div className="bg-gray-100 p-1 rounded-[2px] flex">
                {[{ label: '7 Days', val: '7d' }, { label: '30 Days', val: '30d' }, { label: 'Year', val: '1y' }].map((opt) => (
                  <button
                    key={opt.val}
                    onClick={() => setTimeRange(opt.val)}
                    className={`px-3 py-1 text-xs font-medium rounded-[1px] transition-all ${
                      timeRange === opt.val 
                        ? 'bg-white text-[#0F2027] shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenue.chart} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid stroke="#f0f0f0" strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={false} 
                    tickLine={false} 
                    dy={10}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    tick={{ fontSize: 12, fill: '#9ca3af' }} 
                    axisLine={false} 
                    tickLine={false}
                    dx={-10}
                  />
                  <YAxis yAxisId="right" orientation="right" hide />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '2px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value, name) => [
                      name === 'Revenue (UGX)' ? `UGX ${value.toLocaleString()}` : value, 
                      name
                    ]}
                  />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="revenue" 
                    name="Revenue (UGX)"
                    stroke="#0F2027" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#0F2027', strokeWidth: 0 }}
                    activeDot={{ r: 6 }} 
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="bookings" 
                    name="Bookings"
                    stroke="#D4AF37" 
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#D4AF37', strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right: Pie Chart */}
          <div className="bg-white p-6 rounded-[2px] border border-gray-100 shadow-sm flex flex-col">
            <h3 className="font-serif text-lg font-bold text-[#0F2027] mb-6">Payment Methods</h3>
            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.payments.breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.payments.breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '4px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 3. RECENT BOOKINGS TABLE */}
        <div className="bg-white rounded-[2px] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
             <h3 className="font-serif text-lg font-bold text-[#0F2027]">Recent Bookings</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Guest</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.bookings.recent && data.bookings.recent.length > 0 ? (
                  data.bookings.recent.map((booking) => (
                    <tr key={booking.key || booking.id} className="hover:bg-[#fcfbf7] transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {booking.id ? booking.id.slice(0, 8) : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#f0f0f0] flex items-center justify-center text-gray-500">
                            <Users size={12} />
                          </div>
                          <span className="text-sm font-medium text-gray-700">{booking.guest}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-red-100 text-red-700 border-red-200'
                        }`}>
                          {booking.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-gray-900 text-sm">
                        UGX {(booking.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="px-6 py-8 text-center text-gray-400 text-sm">
                      No recent bookings found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
  );
};

DashboardPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout>
      {page}
    </DashboardLayout>
  );
};


export default DashboardPage;