import React, { useEffect, useState } from 'react';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';
import { FunnelIcon, UserGroupIcon, CalendarDaysIcon, BookOpenIcon, TagIcon, EyeIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import QuestionViewModal from '../components/QuestionViewModal';
import OsceStationViewModal from '../components/OsceStationViewModal';

const allCategories = ['All', ...Object.keys(subjectsStructure)];

// Utility to convert array of objects to CSV
function toCSV(rows: any[], columns: { label: string, key: string }[]) {
  const header = columns.map(col => `"${col.label}"`).join(',');
  const body = rows.map(row =>
    columns.map(col => `"${(row[col.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

// Tooltip component
function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)} tabIndex={0}>
      <span className="pointer-events-auto">{children}</span>
      {show && (
        <span className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap shadow-lg pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const AllAdminSubmissions: React.FC = () => {
  const { jwt } = useAuth();
  const [type, setType] = useState<'All' | 'SBA' | 'OSCE'>('All');
  const [category, setCategory] = useState('All');
  const [subject, setSubject] = useState('All');
  const [topic, setTopic] = useState('All');
  const [writer, setWriter] = useState('All');
  const [date, setDate] = useState('');
  const [questions, setQuestions] = useState<any[]>([]); // SBA
  const [writers, setWriters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [successMessage, setSuccessMessage] = useState('');
  const [allQuestions, setAllQuestions] = useState<any[]>([]); // for stats
  // Add state for bulk selection
  const [selectedOsceIds, setSelectedOsceIds] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Filtering logic for SBA and OSCE
  const filteredSBA = questions.filter(q =>
    (category === 'All' || q.category === category) &&
    (subject === 'All' || q.subject === subject) &&
    (topic === 'All' || q.topic === topic) &&
    (writer === 'All' || q.writer?.name === writer) &&
    (!date || q.createdAt.startsWith(date))
  );

  const handleBulkAction = async (status: 'approved' | 'rejected') => {
    setBulkActionLoading(true);
    try {
      await Promise.all(selectedOsceIds.map(async id => {
        await fetch(`${API_BASE_URL}/api/osce-stations/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({ status }),
        });
      }));
      // setOsceStations(prev => prev.map(s => selectedOsceIds.includes(s._id) ? { ...s, status } : s)); // This line was removed
      setSelectedOsceIds([]);
    } catch (err) {
      alert('Bulk action failed.');
    }
    setBulkActionLoading(false);
  };

  // Fetch SBA or OSCE data based on type
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (type === 'OSCE') {
          const res = await fetch(`${API_BASE_URL}/api/osce-stations`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (!res.ok) throw new Error('Failed to fetch OSCE stations');
          const data = await res.json();
          // setOsceStations(data); // This line was removed
          // Extract unique writers
          const uniqueWriters: string[] = Array.from(new Set(data.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
          setWriters(uniqueWriters);
        } else if (type === 'All') {
          const res = await fetch(`${API_BASE_URL}/api/admin/all-submissions`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (!res.ok) throw new Error('Failed to fetch all submissions');
          const data = await res.json();
          // Split into SBA and OSCE for filtering, but keep all for display
          setQuestions(data.submissions.filter((q: any) => q.type === 'SBA'));
          // setOsceStations(data.submissions.filter((q: any) => q.type === 'OSCE')); // This line was removed
          setAllQuestions(data.submissions);
          // Extract unique writers
          const uniqueWriters: string[] = Array.from(new Set(data.submissions.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
          setWriters(uniqueWriters);
        } else {
          const response = await fetch(`${API_BASE_URL}/api/submissions`, {
            headers: { Authorization: `Bearer ${jwt}` },
          });
          if (!response.ok) {
            setError('Failed to fetch submissions');
            setLoading(false);
            return;
          }
          const data = await response.json();
          setQuestions(Array.isArray(data) ? data : data.submissions || []);
          setAllQuestions(Array.isArray(data) ? data : data.submissions || []);
          // Extract unique writers
          const uniqueWriters: string[] = Array.from(new Set(data.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
          setWriters(uniqueWriters);
        }
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    if (jwt) fetchData();
  }, [jwt, type]);

  const handleReasonChange = (id: string, reason: string) => {
    setQuestions(prev => prev.map(q => q._id === id ? { ...q, rejectionReason: reason } : q));
  };
  const handleSaveReason = async (id: string, reason: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
      });
      if (response.ok) {
        setQuestions(prev => prev.map(q => q._id === id ? { ...q, status: 'rejected', rejectionReason: reason } : q));
      }
    } catch {}
  };

  // Handle View button click
  const handleViewClick = async (id: string, type?: string) => {
    setModalLoading(true);
    setModalError('');
    setSelectedSubmission(null);
    setModalOpen(true);
    setModalMode('view');
    try {
      let res;
      if (type === 'OSCE') {
        res = await fetch(`${API_BASE_URL}/api/osce-stations/${id}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
      }
      if (!res.ok) {
        setModalError('Failed to fetch submission.');
        setModalLoading(false);
        return;
      }
      const data = await res.json();
      setSelectedSubmission(data);
    } catch (err) {
      setModalError('Network error.');
    }
    setModalLoading(false);
  };

  // Delete handler for admin
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question? This action cannot be undone.')) return;
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${jwt}` },
      });
      if (!res.ok) throw new Error('Failed to delete question');
      setQuestions(prev => prev.filter(q => q._id !== id));
      setModalOpen(false);
      setSuccessMessage('Question deleted successfully');
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  // Export handler
  const handleExport = () => {
    const columns = [
      { label: 'Timestamp', key: 'createdAt' },
      { label: 'Writer', key: 'writerName' },
      { label: 'Subject', key: 'subject' },
      { label: 'Topic', key: 'topic' },
      { label: 'Status', key: 'status' },
      { label: 'Rejection Reason', key: 'rejectionReason' },
      { label: 'Question', key: 'question' },
    ];
    const rows = filteredSBA.map(q => ({
      createdAt: new Date(q.createdAt).toLocaleString(),
      writerName: q.writer?.name || '-',
      subject: q.subject,
      topic: q.topic,
      status: q.status,
      rejectionReason: q.rejectionReason || '',
      question: q.question,
    }));
    const csv = toCSV(rows, columns);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'submissions_export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-full max-w-6xl mx-auto px-2 sm:px-6">
      {/* Main Content Section */}
      <div className="bg-white rounded-xl shadow-lg p-2 sm:p-8">
        {/* Enhanced Filters Section */}
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 sm:p-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6 items-stretch shadow-sm">
            <div className="flex flex-col min-w-[160px] w-full sm:w-auto mb-2 sm:mb-0">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <FunnelIcon className="w-4 h-4 text-primary" /> Type
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={type} onChange={e => setType(e.target.value as 'All' | 'SBA' | 'OSCE')}>
                <option value="All">All</option>
                <option value="SBA">SBA</option>
                <option value="OSCE">OSCE</option>
              </select>
            </div>
            <div className="flex flex-col min-w-[160px] w-full sm:w-auto mb-2 sm:mb-0">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <TagIcon className="w-4 h-4 text-primary" /> Category
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={category} onChange={e => { setCategory(e.target.value); setSubject('All'); setTopic('All'); }}>
                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px] w-full sm:w-auto mb-2 sm:mb-0">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <BookOpenIcon className="w-4 h-4 text-primary" /> Subject
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={subject} onChange={e => { setSubject(e.target.value); setTopic('All'); }}>
                <option value="All">All</option>
                {(
                  category === 'All'
                    ? []
                    : Object.keys((subjectsStructure as Record<string, any>)[category] || {})
                ).map(subj => (
                  <option key={subj} value={subj}>{subj}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px] w-full sm:w-auto mb-2 sm:mb-0">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <FunnelIcon className="w-4 h-4 text-primary" /> Topic
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={topic} onChange={e => setTopic(e.target.value)}>
                <option value="All">All</option>
                {(
                  category === 'All' || subject === 'All'
                    ? []
                    : Array.isArray(((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject])
                      ? ((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject] as string[]
                      : Object.keys(((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject] || {})
                ).map((t: string) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px] w-full sm:w-auto mb-2 sm:mb-0">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <UserGroupIcon className="w-4 h-4 text-primary" /> Writer
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={writer} onChange={e => setWriter(e.target.value)}>
                <option value="All">All</option>
                {writers.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px] w-full sm:w-auto mb-2 sm:mb-0">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <CalendarDaysIcon className="w-4 h-4 text-primary" /> Date
              </label>
              <input type="date" className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        {/* Stats Card */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            const total = allQuestions.length;
            const approved = allQuestions.filter(q => q.status === 'approved').length;
            const rejected = allQuestions.filter(q => q.status === 'rejected').length;
            const pending = allQuestions.filter(q => q.status === 'pending').length;
            return (
              <>
                <div className="flex flex-col items-center justify-center bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow p-4">
                  <span className="text-3xl font-bold text-blue-700">{total}</span>
                  <span className="mt-1 text-sm font-medium text-blue-800 flex items-center gap-1"><BookOpenIcon className="w-5 h-5 text-blue-400" /> Total</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-green-50 border-l-4 border-green-500 rounded-lg shadow p-4">
                  <span className="text-3xl font-bold text-green-700">{approved}</span>
                  <span className="mt-1 text-sm font-medium text-green-800 flex items-center gap-1"><CheckCircleIcon className="w-5 h-5 text-green-400" /> Approved</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-red-50 border-l-4 border-red-500 rounded-lg shadow p-4">
                  <span className="text-3xl font-bold text-red-700">{rejected}</span>
                  <span className="mt-1 text-sm font-medium text-red-800 flex items-center gap-1"><XCircleIcon className="w-5 h-5 text-red-400" /> Rejected</span>
                </div>
                <div className="flex flex-col items-center justify-center bg-yellow-50 border-l-4 border-yellow-500 rounded-lg shadow p-4">
                  <span className="text-3xl font-bold text-yellow-700">{pending}</span>
                  <span className="mt-1 text-sm font-medium text-yellow-800 flex items-center gap-1"><ClockIcon className="w-5 h-5 text-yellow-400" /> Pending</span>
                </div>
              </>
            );
          })()}
        </div>
        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <button
            className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
            onClick={handleExport}
            disabled={filteredSBA.length === 0}
          >
            Export Filtered as CSV
          </button>
        </div>
        {/* Table Section */}
        {loading ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
        ) : type === 'All' ? (
          (allQuestions.length === 0) ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-left rounded-xl overflow-hidden bg-white text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-6 font-semibold">Timestamp</th>
                    <th className="py-3 px-6 font-semibold">Type</th>
                    <th className="py-3 px-6 font-semibold">Writer</th>
                    <th className="py-3 px-6">Title / Question</th>
                    <th className="py-3 px-6">Subject / Topic</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {allQuestions
                    .filter(q =>
                      (category === 'All' || q.category === category) &&
                      (subject === 'All' || q.subject === subject) &&
                      (topic === 'All' || q.topic === topic) &&
                      (writer === 'All' || q.writer?.name === writer) &&
                      (!date || q.createdAt.startsWith(date))
                    )
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((q) => (
                      <tr key={q._id} className="border-t align-top hover:bg-blue-50 hover:shadow-md transition">
                        <td className="py-3 px-6">{new Date(q.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-6">{q.type}</td>
                        <td className="py-3 px-6">{q.writer?.name || '-'}</td>
                        <td className="py-3 px-6">{q.type === 'SBA' ? q.question : q.title}</td>
                        <td className="py-3 px-6">{(q.subject || '-') + ' / ' + (q.topic || '-')}</td>
                        <td className="py-3 px-6">
                          <span
                            className={
                              q.status === 'approved'
                                ? 'inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs'
                                : q.status === 'pending'
                                ? 'inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-xs'
                                : 'inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs'
                            }
                          >
                            {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-right flex gap-2 justify-end items-center">
                          <button
                            className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-primary rounded-full p-2 hover:bg-primary hover:text-white hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                            aria-label="View submission"
                            type="button"
                            onClick={() => handleViewClick(q._id, q.type)}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          filteredSBA.length === 0 ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-left rounded-xl overflow-hidden bg-white text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-6 font-semibold">Timestamp</th>
                    <th className="py-3 px-6 font-semibold">Writer</th>
                    <th className="py-3 px-6 font-semibold">Subject / Topic</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Rejection Reason</th>
                    <th className="py-3 px-6 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSBA
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((q) => (
                      <tr key={q._id} className="border-t align-top hover:bg-blue-50 hover:shadow-md transition">
                        <td className="py-3 px-6">{new Date(q.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <img src="/meduaid-logo.svg" alt="avatar" className="w-8 h-8 rounded-full bg-blue-200 object-cover" />
                            <span>{q.writer?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">{(q.subject || '-') + ' / ' + (q.topic || '-')}</td>
                        <td className="py-3 px-6">
                          <Tooltip text={
                            q.status === 'approved' ? 'This question is approved.' :
                            q.status === 'pending' ? 'This question is pending review.' :
                            'This question was rejected.'
                          }>
                            <span
                              className={
                                q.status === 'approved'
                                  ? 'inline-block px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold text-xs'
                                  : q.status === 'pending'
                                  ? 'inline-block px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 font-semibold text-xs'
                                  : 'inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold text-xs'
                              }
                            >
                              {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="py-3 px-6">
                          {q.status === 'rejected' ? (
                            <>
                              <input
                                type="text"
                                className="border rounded px-2 py-1 w-full mb-1 bg-white text-gray-900"
                                value={q.rejectionReason || ''}
                                onChange={e => handleReasonChange(q._id, e.target.value)}
                                placeholder="Enter reason"
                              />
                              <button
                                className="bg-primary text-white px-2 py-1 rounded text-xs"
                                onClick={() => handleSaveReason(q._id, q.rejectionReason || '')}
                              >
                                Save
                              </button>
                            </>
                          ) : '-'}
                        </td>
                        <td className="py-3 px-6 text-right flex gap-2 justify-end items-center">
                          <Tooltip text="View Submission">
                            <button
                              className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-primary rounded-full p-2 hover:bg-primary hover:text-white hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              aria-label="View submission"
                              type="button"
                              onClick={() => handleViewClick(q._id, 'SBA')}
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete Submission">
                            <button
                              className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-red-500 rounded-full p-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              aria-label="Delete submission"
                              type="button"
                              onClick={() => handleDelete(q._id)}
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )
        )}
        {successMessage && (
          <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded shadow-lg z-50 text-center">
            {successMessage}
          </div>
        )}
        {/* Modal for viewing submission */}
        {modalOpen && selectedSubmission && (
          selectedSubmission.type === 'OSCE' ? (
            <OsceStationViewModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              station={selectedSubmission}
              loading={modalLoading}
              error={modalError}
            />
          ) : (
            <QuestionViewModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              question={selectedSubmission}
              loading={modalLoading}
              error={modalError}
            >
              {modalMode === 'view' && selectedSubmission && (
                <div className="flex flex-col gap-2">
                  <label className="font-semibold">Update Status:</label>
                  <select
                    className="border rounded px-2 py-1 text-gray-900"
                    value={selectedSubmission.status}
                    disabled={modalLoading}
                    onChange={async e => {
                      const newStatus = e.target.value;
                      setModalLoading(true);
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/submissions/${selectedSubmission._id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${jwt}`,
                          },
                          body: JSON.stringify({ status: newStatus }),
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setSelectedSubmission(updated);
                          setQuestions(prev => prev.map(q => q._id === updated._id ? updated : q));
                        }
                      } finally {
                        setModalLoading(false);
                      }
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary-dark transition mt-2"
                    onClick={() => setModalMode('edit')}
                  >
                    Edit
                  </button>
                  <button
                    className="bg-red-500 text-white px-4 py-2 rounded font-semibold hover:bg-red-600 transition mt-2"
                    onClick={() => handleDelete(selectedSubmission._id)}
                    disabled={modalLoading}
                  >
                    Delete
                  </button>
                </div>
              )}
              {modalMode === 'edit' && selectedSubmission && (
                <AdminEditQuestionForm
                  submission={selectedSubmission}
                  onClose={() => setModalMode('view')}
                  onSave={updated => {
                    setQuestions(prev => prev.map(q => q._id === updated._id ? updated : q));
                    setSelectedSubmission(updated);
                    setModalMode('view');
                  }}
                  jwt={jwt || ''}
                />
              )}
            </QuestionViewModal>
          )
        )}
        {/* OSCE Modal */}
        {type === 'OSCE' && (
          <div className="flex gap-2 mb-2">
            <button
              className="bg-green-600 text-white px-3 py-1 rounded font-semibold disabled:opacity-50"
              disabled={selectedOsceIds.length === 0 || bulkActionLoading}
              onClick={() => handleBulkAction('approved')}
            >
              Approve Selected
            </button>
            <button
              className="bg-red-600 text-white px-3 py-1 rounded font-semibold disabled:opacity-50"
              disabled={selectedOsceIds.length === 0 || bulkActionLoading}
              onClick={() => handleBulkAction('rejected')}
            >
              Reject Selected
            </button>
            <span className="text-sm text-gray-500 ml-2">{selectedOsceIds.length} selected</span>
          </div>
        )}
      </div>
    </div>
  );
};

function AdminEditQuestionForm({ submission, onClose, onSave, jwt }: { submission: any, onClose: () => void, onSave: (updated: any) => void, jwt: string }) {
  const [form, setForm] = React.useState<any>({
    ...submission,
    difficulty: typeof submission.difficulty === 'string' ? submission.difficulty : 'normal',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  // In AdminEditQuestionForm, add state for category, subject, topic, subtopic
  const [editCategory, setEditCategory] = React.useState(form.category || '');
  const [editSubject, setEditSubject] = React.useState(form.subject || '');
  const [editTopic, setEditTopic] = React.useState(form.topic || '');
  const [editSubtopic, setEditSubtopic] = React.useState(form.subtopic || '');

  const handleChange = (field: string, value: any) => {
    setForm((f: any) => ({ ...f, [field]: value }));
  };
  const handleCategoryChange = (value: string) => {
    setEditCategory(value);
    setEditSubject('');
    setEditTopic('');
    setEditSubtopic('');
    setForm((f: any) => ({ ...f, category: value, subject: '', topic: '', subtopic: '' }));
  };
  const handleSubjectChange = (value: string) => {
    setEditSubject(value);
    setEditTopic('');
    setEditSubtopic('');
    setForm((f: any) => ({ ...f, subject: value, topic: '', subtopic: '' }));
  };
  const handleTopicChange = (value: string) => {
    setEditTopic(value);
    setEditSubtopic('');
    setForm((f: any) => ({ ...f, topic: value, subtopic: '' }));
  };
  const handleSubtopicChange = (value: string) => {
    setEditSubtopic(value);
    setForm((f: any) => ({ ...f, subtopic: value }));
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        category: editCategory,
        subject: editSubject,
        topic: editTopic,
        subtopic: editSubtopic,
        question: form.question,
        choices: form.choices,
        explanations: form.explanations,
        reference: form.reference,
        difficulty: form.difficulty,
      };
      const res = await fetch(`${API_BASE_URL}/api/submissions/${form._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        setError('Failed to save changes');
        setSaving(false);
        return;
      }
      const updated = await res.json();
      onSave(updated);
    } catch {
      setError('Network error');
    }
    setSaving(false);
  };
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
      <div>
        <label className="block mb-1 font-medium">Category</label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          value={editCategory}
          onChange={e => handleCategoryChange(e.target.value)}
        >
          <option value="">Select Category</option>
          {Object.keys(subjectsStructure).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Subject</label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          value={editSubject}
          onChange={e => handleSubjectChange(e.target.value)}
          disabled={!editCategory}
        >
          <option value="">Select Subject</option>
          {editCategory && Object.keys((subjectsStructure as Record<string, any>)[editCategory] || {}).map(subj => (
            <option key={subj} value={subj}>{subj}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Topic</label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          value={editTopic}
          onChange={e => handleTopicChange(e.target.value)}
          disabled={!editSubject}
        >
          <option value="">Select Topic</option>
          {editCategory && editSubject && (
            Array.isArray(((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject])
              ? ((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject].map((topic: string) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))
              : Object.keys(((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject] || {}).map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))
          )}
        </select>
      </div>
      {editCategory && editSubject && editTopic && Array.isArray((((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject] as Record<string, any>)[editTopic]) && (
        <div>
          <label className="block mb-1 font-medium">Subtopic</label>
          <select
            className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
            value={editSubtopic}
            onChange={e => handleSubtopicChange(e.target.value)}
          >
            <option value="">Select Subtopic</option>
            {(((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject] as Record<string, any>)[editTopic].map((sub: string) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block mb-1 font-medium">Question</label>
        <textarea value={form.question} onChange={e => handleChange('question', e.target.value)} className="w-full px-4 py-2 border rounded-lg min-h-[80px] bg-white text-gray-900" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Choices (A–E)</label>
        {Array.from({ length: 5 }).map((_, i) => (
          <input
            key={i}
            value={form.choices[i] || ''}
            onChange={e => handleChange('choices', form.choices.map((v: string, idx: number) => idx === i ? e.target.value : v))}
            className="w-full px-4 py-2 border rounded-lg mb-2 bg-white text-gray-900"
            placeholder={`Choice ${String.fromCharCode(65 + i)}`}
          />
        ))}
      </div>
      <div>
        <label className="block mb-1 font-medium">Explanations (A–E)</label>
        {Array.from({ length: 5 }).map((_, i) => (
          <input
            key={i}
            value={form.explanations[i] || ''}
            onChange={e => handleChange('explanations', form.explanations.map((v: string, idx: number) => idx === i ? e.target.value : v))}
            className="w-full px-4 py-2 border rounded-lg mb-2 bg-white text-gray-900"
            placeholder={`Explain Choice ${String.fromCharCode(65 + i)}`}
          />
        ))}
      </div>
      <div>
        <label className="block mb-1 font-medium">Reference</label>
        <input value={form.reference} onChange={e => handleChange('reference', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Difficulty</label>
        <select value={form.difficulty || 'normal'} onChange={e => handleChange('difficulty', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Images</label>
        {form.images && form.images.length > 0 ? (
          <div className="flex gap-2 flex-wrap mt-2">
            {form.images.map((img: string, idx: number) => (
              <img
                key={idx}
                src={`${API_BASE_URL}${img}`}
                alt={`submission-img-${idx}`}
              />
            ))}
          </div>
        ) : <div className="text-gray-400">No images</div>}
      </div>
      {error && <div className="text-red-500 text-center">{error}</div>}
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default AllAdminSubmissions;
export { AdminEditQuestionForm };