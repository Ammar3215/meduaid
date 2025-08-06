import React, { useEffect, useState } from 'react';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';
import { FunnelIcon, UserGroupIcon, CalendarDaysIcon, BookOpenIcon, TagIcon, EyeIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ClockIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import QuestionViewModal from '../components/QuestionViewModal';
import OsceStationViewModal from '../components/OsceStationViewModal';
import AdminEditQuestionForm from '../components/AdminEditQuestionForm';
import { apiGet, apiPatch, apiDelete } from '../utils/api';

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

// Helper function to get initials from name
function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AllAdminSubmissions: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [type, setType] = useState<'All' | 'SBA' | 'OSCE'>('All');
  const [category, setCategory] = useState('All');
  const [subject, setSubject] = useState('All');
  const [topic, setTopic] = useState('All');
  const [writer, setWriter] = useState('All');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('All');
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
  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 12;

  // Filtering logic for SBA and OSCE
  const filteredQuestions = questions.filter(q =>
    (category === 'All' || q.category === category) &&
    (subject === 'All' || q.subject === subject) &&
    (topic === 'All' || q.topic === topic) &&
    (writer === 'All' || q.writer?.name === writer) &&
    (status === 'All' || q.status === status) &&
    (!date || q.createdAt.startsWith(date))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination logic
  const filteredAllQuestions = type === 'All' ? allQuestions.filter(q =>
    (category === 'All' || q.category === category) &&
    (subject === 'All' || q.subject === subject) &&
    (topic === 'All' || q.topic === topic) &&
    (writer === 'All' || q.writer?.name === writer) &&
    (status === 'All' || q.status === status) &&
    (!date || q.createdAt.startsWith(date))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) : [];
  
  const totalPages = type === 'All' 
    ? Math.ceil(filteredAllQuestions.length / questionsPerPage)
    : Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = type === 'All' 
    ? filteredAllQuestions.slice(startIndex, endIndex)
    : filteredQuestions.slice(startIndex, endIndex);

  // Fetch SBA or OSCE data based on type
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        if (type === 'OSCE') {
          const data = await apiGet('/api/osce-stations');
          // Add type field to OSCE questions and set them for display
          const osceWithType = data.map((q: any) => ({ ...q, type: 'OSCE' }));
          setQuestions(osceWithType);
          setAllQuestions(osceWithType);
          // Extract unique writers
          const uniqueWriters: string[] = Array.from(new Set(data.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
          setWriters(uniqueWriters);
        } else if (type === 'All') {
          const data = await apiGet('/api/admin/all-submissions');
          // Split into SBA and OSCE for filtering, but keep all for display
          setQuestions(data.submissions.filter((q: any) => q.type === 'SBA'));
          // setOsceStations(data.submissions.filter((q: any) => q.type === 'OSCE')); // This line was removed
          setAllQuestions(data.submissions);
          // Extract unique writers
          const uniqueWriters: string[] = Array.from(new Set(data.submissions.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
          setWriters(uniqueWriters);
        } else {
          const data = await apiGet('/api/submissions');
          const sbaWithType = (Array.isArray(data) ? data : data.submissions || []).map((q: any) => ({ ...q, type: 'SBA' }));
          setQuestions(sbaWithType);
          setAllQuestions(sbaWithType);
          // Extract unique writers
          const uniqueWriters: string[] = Array.from(new Set(data.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
          setWriters(uniqueWriters);
        }
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    if (isAuthenticated) fetchData();
  }, [isAuthenticated, type]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [category, subject, topic, writer, date, status]);

  const handleReasonChange = (id: string, reason: string) => {
    setQuestions(prev => prev.map(q => q._id === id ? { ...q, rejectionReason: reason } : q));
  };
  const handleSaveReason = async (id: string, reason: string) => {
    try {
      await apiPatch(`/api/submissions/${id}`, { status: 'rejected', rejectionReason: reason });
      setQuestions(prev => prev.map(q => q._id === id ? { ...q, status: 'rejected', rejectionReason: reason } : q));
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  // Handle View button click
  const handleViewClick = async (id: string, type?: string) => {
    setModalLoading(true);
    setModalError('');
    setSelectedSubmission(null);
    setModalOpen(true);
    setModalMode('view');
    try {
      const data = type === 'OSCE' 
        ? await apiGet(`/api/osce-stations/${id}`)
        : await apiGet(`/api/submissions/${id}`);
      setSelectedSubmission(data);
    } catch (err: any) {
      setModalError(err.message || 'Network error.');
    }
    setModalLoading(false);
  };

  // Delete handler for admin
  const handleDelete = async (id: string, type?: string) => {
    const itemType = type === 'OSCE' ? 'OSCE station' : 'question';
    if (!window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) return;
    setError('');
    try {
      const endpoint = type === 'OSCE' ? `/api/osce-stations/${id}` : `/api/submissions/${id}`;
      await apiDelete(endpoint);
      setQuestions(prev => prev.filter(q => q._id !== id));
      setModalOpen(false);
      setSuccessMessage(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
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
    const rows = filteredQuestions.map(q => ({
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
    <div className="w-full max-w-full max-w-6xl mx-auto px-2 sm:px-6 pt-8">
      {/* Main Content Section */}
      <div className="bg-white rounded-xl shadow-lg p-2 sm:p-8">
        {/* Enhanced Filters Section */}
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col gap-3 md:flex-row md:flex-wrap md:gap-4 items-stretch shadow-sm">
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <FunnelIcon className="w-3 h-3 text-primary" /> Type
              </label>
              <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={type} onChange={e => setType(e.target.value as 'All' | 'SBA' | 'OSCE')}>
                <option value="All">All</option>
                <option value="SBA">SBA</option>
                <option value="OSCE">OSCE</option>
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <CheckCircleIcon className="w-3 h-3 text-primary" /> Status
              </label>
              <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="All">All Status</option>
                <option value="approved">Approved</option>
                <option value="pending">Pending</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <TagIcon className="w-3 h-3 text-primary" /> Category
              </label>
              <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={category} onChange={e => { setCategory(e.target.value); setSubject('All'); setTopic('All'); }}>
                {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <BookOpenIcon className="w-3 h-3 text-primary" /> Subject
              </label>
              <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={subject} onChange={e => { setSubject(e.target.value); setTopic('All'); }}>
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
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <FunnelIcon className="w-3 h-3 text-primary" /> Topic
              </label>
              <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={topic} onChange={e => setTopic(e.target.value)}>
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
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <UserGroupIcon className="w-3 h-3 text-primary" /> Writer
              </label>
              <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={writer} onChange={e => setWriter(e.target.value)}>
                <option value="All">All</option>
                {writers.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[120px] w-full md:w-auto mb-2 md:mb-0">
              <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                <CalendarDaysIcon className="w-3 h-3 text-primary" /> Date
              </label>
              <input type="date" className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        {/* Stats Card */}
        <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {(() => {
            // Use the appropriate data source based on selected type
            const dataSource = type === 'All' ? allQuestions : questions;
            const total = dataSource.length;
            const approved = dataSource.filter(q => q.status === 'approved').length;
            const rejected = dataSource.filter(q => q.status === 'rejected').length;
            const pending = dataSource.filter(q => q.status === 'pending').length;
            return (
              <>
                <div className="flex flex-col items-center justify-center bg-blue-50 border-l-4 border-blue-500 rounded-lg shadow p-4">
                  <span className="text-3xl font-bold text-blue-700">{total}</span>
                  <span className="mt-1 text-sm font-medium text-blue-800 flex items-center gap-1"><BookOpenIcon className="w-5 h-5 text-blue-400" /> Total {type !== 'All' ? `(${type})` : ''}</span>
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
            disabled={filteredQuestions.length === 0}
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
                  {currentQuestions.map((q) => (
                      <tr key={q._id} className="border-t align-top hover:bg-blue-50 hover:shadow-md transition">
                        <td className="py-3 px-6">{new Date(q.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              q.type === 'SBA' 
                                ? 'bg-purple-100 text-purple-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {q.type === 'SBA' ? (
                                <BookOpenIcon className="w-4 h-4" />
                              ) : (
                                <DocumentTextIcon className="w-4 h-4" />
                              )}
                            </div>
                            <span>{q.type}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                              {q.writer?.name ? getInitials(q.writer.name) : '?'}
                            </div>
                            <span>{q.writer?.name || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          {(() => {
                            const text = q.type === 'SBA' ? q.question : q.title;
                            return text && text.length > 80 ? text.slice(0, 80) + '...' : text;
                          })()}
                        </td>
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
                          <Tooltip text="View Submission">
                            <button
                              className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-primary rounded-full p-2 hover:bg-primary hover:text-white hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                              aria-label="View submission"
                              type="button"
                              onClick={() => handleViewClick(q._id, q.type)}
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete Submission">
                            <button
                              className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-red-500 rounded-full p-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              aria-label="Delete submission"
                              type="button"
                              onClick={() => handleDelete(q._id, q.type)}
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
        ) : (
          filteredQuestions.length === 0 ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full text-left rounded-xl overflow-hidden bg-white text-sm sm:text-base">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-6 font-semibold">Timestamp</th>
                    <th className="py-3 px-6 font-semibold">Type</th>
                    <th className="py-3 px-6 font-semibold">Writer</th>
                    <th className="py-3 px-6 font-semibold">Subject / Topic</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Rejection Reason</th>
                    <th className="py-3 px-6 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {currentQuestions
                    .map((q) => (
                      <tr key={q._id} className="border-t align-top hover:bg-blue-50 hover:shadow-md transition">
                        <td className="py-3 px-6">{new Date(q.createdAt).toLocaleString()}</td>
                        <td className="py-3 px-6">{q.type}</td>
                        <td className="py-3 px-6">
                          {q.writer?.name || '-'}
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
                              onClick={() => handleViewClick(q._id, q.type)}
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                          </Tooltip>
                          <Tooltip text="Delete Submission">
                            <button
                              className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-red-500 rounded-full p-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                              aria-label="Delete submission"
                              type="button"
                              onClick={() => handleDelete(q._id, q.type)}
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
        
        {/* Modal for viewing submission */}
        {modalOpen && selectedSubmission && (
          selectedSubmission.type === 'OSCE' ? (
            <OsceStationViewModal
              open={modalOpen}
              onClose={() => setModalOpen(false)}
              station={selectedSubmission}
              loading={modalLoading}
              error={modalError}
              user={user}
              onSave={updated => {
                const updatedWithType = { ...updated, type: 'OSCE' };
                setQuestions(prev => prev.map(q => q._id === updatedWithType._id ? updatedWithType : q));
                setAllQuestions(prev => prev.map(q => q._id === updatedWithType._id ? updatedWithType : q));
                setSelectedSubmission(updatedWithType);
              }}
              onAction={(type, message, itemId) => {
                // onAction triggered
                if (type === 'delete' && itemId) {
                  // Remove deleted item from both questions arrays
                  setQuestions(prev => {
                    const filtered = prev.filter(q => q._id !== itemId);
                    // Delete operation on pending questions
                    return filtered;
                  });
                  setAllQuestions(prev => {
                    const filtered = prev.filter(q => q._id !== itemId);
                    // Delete operation on all questions
                    return filtered;
                  });
                  setModalOpen(false);
                  setSuccessMessage(message);
                  setTimeout(() => setSuccessMessage(''), 3000);
                } else if (type === 'approve' || type === 'reject' || type === 'pending') {
                  // Update item status and remove from pending if approved/rejected
                  if (itemId) {
                    const newStatus = type === 'approve' ? 'approved' : type === 'reject' ? 'rejected' : 'pending';
                    // Status update operation
                    
                    // Always update both lists regardless of status change
                    setQuestions(prev => prev.map(q => q._id === itemId ? { ...q, status: newStatus } : q));
                    setAllQuestions(prev => prev.map(q => q._id === itemId ? { ...q, status: newStatus } : q));
                    
                    setModalOpen(false);
                    setSuccessMessage(message);
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }
                } else {
                  const isErrorType = type === 'error';
                  if (isErrorType) {
                    setError(message);
                    setTimeout(() => setError(''), 3000);
                  } else {
                    setSuccessMessage(message);
                    setTimeout(() => setSuccessMessage(''), 3000);
                  }
                }
              }}
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
                        const updated = await apiPatch(`/api/submissions/${selectedSubmission._id}`, { status: newStatus });
                        setSelectedSubmission(updated);
                        setQuestions(prev => prev.map(q => q._id === updated._id ? updated : q));
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
                />
              )}
            </QuestionViewModal>
          )
        )}
      </div>
      
      {/* Pagination Controls */}
      {(type === 'All' ? filteredAllQuestions.length : filteredQuestions.length) > questionsPerPage && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-1">
            {(() => {
              const pages = [];
              const maxVisiblePages = 7; // Show max 7 page numbers
              
              if (totalPages <= maxVisiblePages) {
                // If total pages is small, show all pages
                for (let i = 1; i <= totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // If total pages is large, show smart pagination
                if (currentPage <= 4) {
                  // Near the beginning: show 1, 2, 3, 4, 5, ..., last
                  for (let i = 1; i <= 5; i++) {
                    pages.push(i);
                  }
                  pages.push('...');
                  pages.push(totalPages);
                } else if (currentPage >= totalPages - 3) {
                  // Near the end: show 1, ..., last-4, last-3, last-2, last-1, last
                  pages.push(1);
                  pages.push('...');
                  for (let i = totalPages - 4; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  // In the middle: show 1, ..., current-1, current, current+1, ..., last
                  pages.push(1);
                  pages.push('...');
                  pages.push(currentPage - 1);
                  pages.push(currentPage);
                  pages.push(currentPage + 1);
                  pages.push('...');
                  pages.push(totalPages);
                }
              }
              
              return pages.map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' ? setCurrentPage(page) : null}
                  disabled={typeof page !== 'number'}
                  className={`px-3 py-2 border rounded-lg ${
                    typeof page === 'number'
                      ? currentPage === page
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                      : 'bg-white text-gray-400 cursor-default'
                  }`}
                >
                  {page}
                </button>
              ));
            })()}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border rounded-lg bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
      
      {/* Page Info */}
      {(type === 'All' ? filteredAllQuestions.length : filteredQuestions.length) > 0 && (
        <div className="text-center text-gray-600 mt-4">
          Showing {startIndex + 1} to {Math.min(endIndex, type === 'All' ? filteredAllQuestions.length : filteredQuestions.length)} of {type === 'All' ? filteredAllQuestions.length : filteredQuestions.length} questions
        </div>
      )}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded shadow-lg z-50 text-center">
          {successMessage}
        </div>
      )}
    </div>
  );
};

export default AllAdminSubmissions;