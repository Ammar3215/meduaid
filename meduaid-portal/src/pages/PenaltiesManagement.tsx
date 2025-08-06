import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiGet, apiPost, apiDelete } from '../utils/api';

interface Penalty {
  _id: string;
  writer: { _id: string; name: string; };
  reason: string;
  type: string;
  amount?: number;
  createdAt: string;
}

interface Writer {
  _id: string;
  name: string;
  email: string;
}

const PenaltiesManagement: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [writers, setWriters] = useState<Writer[]>([]);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  
  const [selectedWriter, setSelectedWriter] = useState('');
  const [reason, setReason] = useState('');
  const [penaltyType, setPenaltyType] = useState('strike');
  const [amount, setAmount] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filterWriter, setFilterWriter] = useState('All');
  const [filterType, setFilterType] = useState('All');

  const [writerError, setWriterError] = useState('');
  const [reasonError, setReasonError] = useState('');
  const [amountError, setAmountError] = useState('');


  useEffect(() => {
    if (user && !user.isAdmin) {
      navigate('/', { replace: true });
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch writers and penalties
        const writersData = await apiGet('/api/admin/writers');
        setWriters(writersData);
        
        const penaltiesData = await apiGet('/api/admin/penalties');
        setPenalties(penaltiesData.penalties || []);
        
      } catch (err: any) {
        setError(err.message || 'An error occurred.');
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchData();
    }
  }, [user, navigate, isAuthenticated]);

  const handleApplyPenalty = async () => {
    let hasError = false;
    setWriterError('');
    setReasonError('');
    setAmountError('');
    if (!selectedWriter) {
      setWriterError('Field missing');
      hasError = true;
    }
    if (!reason) {
      setReasonError('Field missing');
      hasError = true;
    }
    if (penaltyType === 'monetary' && (!amount || Number(amount) <= 0)) {
      setAmountError('Field missing');
      hasError = true;
    }
    if (hasError) return;
    setError('');
    try {
      const newPenalty = await apiPost('/api/admin/penalties', {
        writer: selectedWriter,
        reason,
        type: penaltyType,
        ...(penaltyType === 'monetary' ? { amount: Number(amount) } : {})
      });
      setPenalties([newPenalty, ...penalties]);
      // Reset form
      setSelectedWriter('');
      setReason('');
      setPenaltyType('strike');
      setAmount('');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRemovePenalty = async (id: string) => {
    try {
      await apiDelete(`/api/admin/penalties/${id}`);
      setPenalties(penalties.filter(p => p._id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filtered penalties for display
  const filteredPenalties = penalties.filter(p =>
    (filterWriter === 'All' || p.writer._id === filterWriter) &&
    (filterType === 'All' || p.type === filterType)
  );

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center p-8 text-red-500">{error}</div>;

  return (
    <>
      <div className="w-full max-w-full p-2 md:p-8">
        {/* Apply Penalty Card */}
        <div className="bg-white rounded-xl shadow p-2 md:p-6 mb-8 w-full max-w-4xl mx-auto">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Apply Penalty</h3>
          {error && <div className="mb-4 text-red-600 font-semibold text-center">{error}</div>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 items-start">
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Writer</label>
              <select
                value={selectedWriter}
                onChange={e => setSelectedWriter(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-all duration-150 ${writerError ? 'border-red-500 ring-1 ring-red-400' : ''} bg-white text-gray-900`}
              >
                <option value="">Select Writer</option>
                {writers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.email})</option>)}
              </select>
              {writerError && (
                <div className="flex items-center gap-1 text-red-600 text-xs mt-1 animate-fade-in">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                  <span className="font-semibold">{writerError}</span>
                </div>
              )}
            </div>
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select value={penaltyType} onChange={e => setPenaltyType(e.target.value)} className="w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary bg-white text-gray-900">
                <option value="strike">Strike</option>
                <option value="monetary">Monetary</option>
              </select>
            </div>
            {penaltyType === 'monetary' && (
              <div className="w-full">
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($)</label>
                <input
                  type="number"
                  placeholder="e.g., 50"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-all duration-150 ${amountError ? 'border-red-500 ring-1 ring-red-400' : ''} bg-white text-gray-900`}
                />
                {amountError && (
                  <div className="flex items-center gap-1 text-red-600 text-xs mt-1 animate-fade-in">
                    <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                    <span className="font-semibold">{amountError}</span>
                  </div>
                )}
              </div>
            )}
            <div className="w-full col-span-1 md:col-span-2 lg:col-span-4">
               <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
              <input
                type="text"
                placeholder="Reason for penalty"
                value={reason}
                onChange={e => setReason(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg shadow-sm focus:ring-primary focus:border-primary transition-all duration-150 ${reasonError ? 'border-red-500 ring-1 ring-red-400' : ''} bg-white text-gray-900`}
              />
              {reasonError && (
                <div className="flex items-center gap-1 text-red-600 text-xs mt-1 animate-fade-in">
                  <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                  <span className="font-semibold">{reasonError}</span>
                </div>
              )}
            </div>
            <div className="w-full col-span-1 md:col-span-2 lg:col-span-4">
              <button onClick={handleApplyPenalty} className="w-full bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors">Apply Penalty</button>
            </div>
          </div>
        </div>

        {/* Penalty History Card */}
        <div className="bg-white rounded-xl shadow p-2 md:p-6 w-full max-w-4xl mx-auto">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">Penalty History</h3>
          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row flex-wrap gap-2 md:gap-4 mb-4 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Writer</label>
              <select value={filterWriter} onChange={e => setFilterWriter(e.target.value)} className="px-2 py-1 border rounded bg-white text-gray-900">
                <option value="All">All</option>
                {writers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.email})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-2 py-1 border rounded bg-white text-gray-900">
                <option value="All">All</option>
                <option value="strike">Strike</option>
                <option value="monetary">Monetary</option>
              </select>
            </div>
            <div>
              <button onClick={() => { setFilterWriter('All'); setFilterType('All'); }} className="px-3 py-1 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition">Clear Filters</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-[600px] w-full divide-y divide-gray-200 text-sm md:text-base">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Writer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPenalties.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">No penalties recorded.</td>
                  </tr>
                ) : filteredPenalties.map((p) => (
                  <tr key={p._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.writer.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.reason}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.type === 'monetary' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {p.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.type === 'monetary' ? `$${p.amount}`: 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => handleRemovePenalty(p._id)} className="text-red-600 hover:text-red-900">Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default PenaltiesManagement; 