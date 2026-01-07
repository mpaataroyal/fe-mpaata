'use client';

import React, { useState, useEffect } from 'react';
import { 
  Search, RefreshCw, Edit2, Zap, X, 
  User, Phone, CreditCard, Banknote, Smartphone, 
  CheckCircle, AlertCircle, Clock, Loader2, ChevronDown 
} from 'lucide-react';
import dayjs from 'dayjs';

// FIXED: Changed path from '../libs/apiAgent' to '../utils/apiAgent' based on initial project structure
import { api } from '@/libs/apiAgent';
// Note: Ensure src/layout.jsx exists for this import to work
import DashboardLayout from '@/layout';

const PAYMENT_STATUSES = ['success', 'pending', 'failed'];

const PaymentsPage = () => {
  // 1. Data States
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [retryLoadingId, setRetryLoadingId] = useState(null); // Track specific row loading
  
  // 2. UI States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [searchText, setSearchText] = useState('');

  // 3. Initial Load
  useEffect(() => {
    fetchPayments();
  }, []);

  // -- API Actions --

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await api.payments.getAll();
      const data = response.payments || [];
      
      const formatted = data.map(item => ({
        key: item.id,
        id: item.customer_reference || item.id,
        bookingRef: item.bookingId,
        guest: item.guest || 'Unknown',
        email: item.email || 'N/A',
        phone: item.phone,
        amount: item.amount,
        method: item.provider || 'Unknown',
        date: item.date,
        status: item.status,
        raw: item 
      }));
      
      setPayments(formatted);
    } catch (error) {
      console.error('Fetch Error:', error);
      // alert('Failed to load payments'); 
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (record) => {
    setEditingPayment(record);
    setNewStatus(record.status);
    setIsModalOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!editingPayment) return;

    try {
      await api.payments.update(editingPayment.key, { status: newStatus });
      setIsModalOpen(false);
      fetchPayments(); // Refresh table
    } catch (error) {
      console.error('Update Error:', error);
      alert('Failed to update status');
    }
  };

  const handleRetryPayment = async (record) => {
    if (!confirm("Are you sure you want to resend the payment prompt to the customer?")) return;

    setRetryLoadingId(record.key);
    try {
      await api.payments.initiate({
        bookingId: record.bookingRef,
        phoneNumber: record.phone,
        amount: record.amount
      });
      alert('Payment prompt re-sent successfully');
      fetchPayments();
    } catch (error) {
      console.error('Retry Error:', error);
      alert('Failed to initiate payment');
    } finally {
      setRetryLoadingId(null);
    }
  };

  // -- Render Helpers --

  const MethodIcon = ({ method }) => {
    if (!method) return <Banknote size={14} className="text-gray-500" />;
    const m = method.toLowerCase();
    if (m.includes('mobile')) return <Smartphone size={14} className="text-purple-500" />;
    return <Banknote size={14} className="text-green-500" />;
  };

  const StatusBadge = ({ status }) => {
    const styles = {
      success: 'bg-green-100 text-green-700 border-green-200',
      paid: 'bg-green-100 text-green-700 border-green-200',
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
    };
    
    const icons = {
      success: <CheckCircle size={10} />,
      paid: <CheckCircle size={10} />,
      pending: <Clock size={10} />,
      failed: <AlertCircle size={10} />
    };

    const normStatus = status?.toLowerCase() || 'unknown';

    return (
      <span className={`px-2 py-1 rounded-[2px] text-[10px] font-bold uppercase tracking-wider border flex items-center gap-1 w-fit ${styles[normStatus] || 'bg-gray-100 text-gray-500'}`}>
        {icons[normStatus]} {status}
      </span>
    );
  };

  // -- Filtering Logic --
  const filteredPayments = payments.filter(
    (item) =>
      (item.id && item.id.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.guest && item.guest.toLowerCase().includes(searchText.toLowerCase())) ||
      (item.phone && item.phone.includes(searchText))
  );

  return (
      <div className="p-6 md:p-12 font-sans text-gray-900">
        
        {/* Header with Inline Search */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="font-serif text-3xl text-[#0F2027] mb-1">Payments</h1>
            <p className="text-gray-500 text-sm">View and manage transactions.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input Moved Here */}
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text"
                placeholder="Search Ref ID, Name..."
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-[2px] text-sm focus:outline-none focus:border-[#D4AF37] bg-white transition-colors"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <button 
              onClick={fetchPayments} 
              disabled={loading}
              className="px-4 py-2 border border-gray-200 bg-white hover:border-[#D4AF37] text-gray-600 rounded-[2px] text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-[2px] shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Ref ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Booking</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Method</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="flex justify-center"><Loader2 className="animate-spin text-[#D4AF37]" size={24}/></div>
                    </td>
                  </tr>
                ) : filteredPayments.length > 0 ? (
                  filteredPayments.map((item) => (
                    <tr key={item.key} className="hover:bg-[#fcfbf7] transition-colors">
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {item.id ? item.id.slice(0, 12) + '...' : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                           {item.bookingRef ? item.bookingRef.slice(0, 8) : 'N/A'}
                         </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center">
                            <User size={14} />
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-[#0F2027] text-sm">{item.guest}</span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone size={10} /> {item.phone}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800 text-sm">
                        UGX {Number(item.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-gray-600 capitalize">
                          <MethodIcon method={item.method} />
                          {item.method}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {dayjs(item.date).format('MMM D, HH:mm')}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(item)}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Update Status"
                          >
                            <Edit2 size={16} />
                          </button>

                          {(item.method?.toLowerCase().includes('mobile') || item.method === 'Mobile Money') && 
                           (item.status === 'pending' || item.status === 'failed') && (
                            <button
                              onClick={() => handleRetryPayment(item)}
                              disabled={retryLoadingId === item.key}
                              className="p-1.5 text-amber-500 hover:bg-amber-50 rounded transition-colors"
                              title="Retry Payment Prompt"
                            >
                              {retryLoadingId === item.key ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center text-gray-400">
                      No payments found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL --- */}
        {isModalOpen && editingPayment && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F2027]/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-[2px] shadow-2xl overflow-hidden animate-scale-in">
              
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-[#fcfbf7]">
                <h3 className="font-serif text-lg text-[#0F2027] font-bold">Update Status</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                {/* Info Card */}
                <div className="bg-gray-50 p-4 rounded-[2px] border border-gray-100 mb-6 space-y-2 text-sm">
                   <div className="flex justify-between">
                      <span className="text-gray-500">ID:</span>
                      <span className="font-mono font-medium text-[#0F2027]">{editingPayment.id.slice(0,16)}...</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span className="font-bold text-[#0F2027]">UGX {Number(editingPayment.amount).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between">
                      <span className="text-gray-500">Phone:</span>
                      <span className="text-[#0F2027]">{editingPayment.phone}</span>
                   </div>
                </div>

                {/* Form */}
                <div className="space-y-2">
                  <label className="text-xs uppercase font-bold text-gray-500 tracking-wider">New Status</label>
                  <div className="relative">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full appearance-none bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-[2px] leading-tight focus:outline-none focus:border-[#D4AF37]"
                    >
                      {PAYMENT_STATUSES.map(status => (
                        <option key={status} value={status}>{status.toUpperCase()}</option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                      <ChevronDown size={14} />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-sm text-gray-500 hover:text-[#0F2027] transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleUpdateStatus}
                    className="px-6 py-2 bg-[#0F2027] text-[#D4AF37] text-sm font-medium rounded-[2px] hover:brightness-110"
                  >
                    Save Update
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
  );
};

PaymentsPage.getLayout = function getLayout(page) {
  return (
    <DashboardLayout>
      {page}
    </DashboardLayout>
  );
};

export default PaymentsPage;