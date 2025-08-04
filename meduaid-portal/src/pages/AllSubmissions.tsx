import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Skeleton from '../components/Skeleton';
import { subjectsStructure } from '../utils/subjectsStructure';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import OsceStationViewModal from '../components/OsceStationViewModal';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config/api';

interface Submission {
  _id: string;
  question: string;
  title?: string; // For OSCE stations
  status: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
  subject: string;
  topic: string;
  subtopic?: string;
  reference: string;
  category: string;
  type?: string; // Added type for OSCEs
}


const statusOptions = ['All', 'approved', 'pending', 'rejected', 'draft'];

function getAllSubjects() {
  const basic = Object.keys(subjectsStructure['Basic Sciences']);
  const clinical = Object.keys(subjectsStructure['Clinical Sciences']);
  return [...basic, ...clinical];
}

function getTopicsForSubject(subject: string) {
  if ((subjectsStructure['Basic Sciences'] as Record<string, string[]>)[subject]) {
    return (subjectsStructure['Basic Sciences'] as Record<string, string[]>)[subject];
  }
  if ((subjectsStructure['Clinical Sciences'] as Record<string, any>)[subject]) {
    return Object.keys((subjectsStructure['Clinical Sciences'] as Record<string, any>)[subject]);
  }
  return [];
}

function RejectionReasonCell({ reason = '-' }) {
  const [expanded, setExpanded] = useState(false);
  const limit = 60;
  if (!reason) return '-';
  const isLong = reason.length > limit;
  return (
    <div style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: 220 }}>
      {expanded || !isLong ? reason : reason.slice(0, limit) + '...'}
      {isLong && (
        <button
          className="text-primary ml-2 text-xs underline"
          onClick={() => setExpanded(e => !e)}
          type="button"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

const categoryOptions = ['All', ...Object.keys(subjectsStructure)];

function getSubjectsForCategory(category: string) {
  if (category === 'All') {
    return getAllSubjects();
  }
  return Object.keys((subjectsStructure as Record<string, any>)[category] || {});
}

// Tooltip component for consistent UX
function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
  const [show, setShow] = useState(false);
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

const AllSubmissions: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fullImage, setFullImage] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  // Redirect admins to the admin version of this page
  useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/all-submissions', { replace: true });
    }
  }, [user, navigate]);

  const subjects = getSubjectsForCategory(categoryFilter);
  const topics = subjectFilter !== 'All' ? getTopicsForSubject(subjectFilter) : [];

  // Filtered submissions
  const filteredSubmissions = submissions.filter(sub => {
    const typeMatch = typeFilter === 'All' || sub.type === typeFilter;
    const statusMatch = statusFilter === 'All' || sub.status === statusFilter;
    const categoryMatch = categoryFilter === 'All' || sub.category === categoryFilter;
    const subjectMatch = subjectFilter === 'All' || sub.subject === subjectFilter;
    const topicMatch = topicFilter === 'All' || sub.topic === topicFilter;
    const dateFromMatch = !dateFrom || new Date(sub.createdAt) >= new Date(dateFrom);
    const dateToMatch = !dateTo || new Date(sub.createdAt) <= new Date(dateTo + 'T23:59:59');
    return typeMatch && statusMatch && categoryMatch && subjectMatch && topicMatch && dateFromMatch && dateToMatch;
  });

  // Calculate summary counts
  const summary = {
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  };

  // Update data fetching to get both SBA and OSCE submissions
  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError('');
      try {
        const sbaRes = await fetch(`${API_BASE_URL}/api/submissions`, {
          credentials: 'include',
        });
        const osceRes = await fetch(`${API_BASE_URL}/api/osce-stations`, {
          credentials: 'include',
        });
        if (!sbaRes.ok || !osceRes.ok) throw new Error('Failed to fetch submissions');
        const sba = (await sbaRes.json()).map((q: any) => ({ ...q, type: 'SBA' }));
        const osce = (await osceRes.json()).map((q: any) => ({ ...q, type: 'OSCE' }));
        const allSubmissions = [...sba, ...osce].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setSubmissions(allSubmissions);
      } catch (err: any) {
        setError(err.message || 'Network error');
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, [isAuthenticated, user]);

  // Handle View button click
  const handleViewClick = async (id: string, type?: string) => {
    setModalLoading(true);
    setModalError('');
    setSelectedSubmission(null);
    setModalOpen(true);
    
    try {
      let res;
      if (type === 'OSCE') {
        res = await fetch(`${API_BASE_URL}/api/osce-stations/${id}`, {
          credentials: 'include',
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
          credentials: 'include',
        });
      }
      
      if (!res.ok) {
        if (res.status === 403) {
          setModalError('You do not have permission to view this submission. This may be because it belongs to another user.');
        } else if (res.status === 404) {
          setModalError('Submission not found.');
        } else {
          setModalError('Failed to fetch submission.');
        }
        setModalLoading(false);
        return;
      }
      const data = await res.json();
      setSelectedSubmission({ ...data, type });
    } catch (err) {
      setModalError('Network error.');
    }
    setModalLoading(false);
  };

  const handleDelete = async (id: string, type?: string) => {
    const itemType = type === 'OSCE' ? 'OSCE station' : 'question';
    if (!window.confirm(`Are you sure you want to delete this ${itemType}? This action cannot be undone.`)) return;
    setError('');
    try {
      let endpoint;
      if (type === 'OSCE') {
        endpoint = `${API_BASE_URL}/api/osce-stations/${id}`;
      } else {
        endpoint = `${API_BASE_URL}/api/submissions/${id}`;
      }
      
      const res = await fetch(endpoint, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok) throw new Error(`Failed to delete ${itemType}`);
      setSubmissions(prev => prev.filter(q => q._id !== id));
      setSuccessMessage(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} deleted successfully`);
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      {/* Summary Counter Card */}
      <div className="flex flex-wrap gap-6 mb-8 justify-center">
        <div className="flex-1 min-w-[160px] bg-yellow-50 border border-yellow-200 rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-yellow-500 text-3xl font-bold mb-1">{summary.pending}</span>
          <span className="text-yellow-700 font-semibold">Pending</span>
        </div>
        <div className="flex-1 min-w-[160px] bg-green-50 border border-green-200 rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-green-500 text-3xl font-bold mb-1">{summary.approved}</span>
          <span className="text-green-700 font-semibold">Approved</span>
        </div>
        <div className="flex-1 min-w-[160px] bg-red-50 border border-red-200 rounded-xl shadow p-4 flex flex-col items-center">
          <span className="text-red-500 text-3xl font-bold mb-1">{summary.rejected}</span>
          <span className="text-red-700 font-semibold">Rejected</span>
        </div>
      </div>
      {/* Filter Bar */}
      <div className="mb-8 p-4 bg-gray-50 rounded-xl shadow flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-xs font-semibold mb-1">Status</label>
          <select
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Category</label>
          <select
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value);
              setSubjectFilter('All');
              setTopicFilter('All');
            }}
          >
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Subject</label>
          <select
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={subjectFilter}
            onChange={e => {
              setSubjectFilter(e.target.value);
              setTopicFilter('All');
            }}
            disabled={categoryFilter === 'All'}
          >
            <option value="All">All</option>
            {subjects.map(subj => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Topic</label>
          <select
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={topicFilter}
            onChange={e => setTopicFilter(e.target.value)}
            disabled={subjectFilter === 'All'}
          >
            <option value="All">All</option>
            {topics.map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Date From</label>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Date To</label>
          <input
            type="date"
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Type</label>
          <select
            className="px-3 py-2 border rounded-lg bg-white text-gray-900"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="SBA">SBA</option>
            <option value="OSCE">OSCE</option>
          </select>
        </div>
        <div className="flex items-end h-full">
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold border hover:bg-gray-300 transition"
            onClick={() => { setDateFrom(''); setDateTo(''); }}
            disabled={!dateFrom && !dateTo}
          >
            Clear
          </button>
        </div>
      </div>
      {loading ? (
        <div className="flex flex-col gap-4">
          <Skeleton height={40} />
          <Skeleton height={200} />
          <Skeleton height={40} width="60%" />
          <Skeleton height={40} width="80%" />
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : filteredSubmissions.length === 0 ? (
        <div className="text-center text-gray-500">No submissions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border table-fixed">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Question</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Rejection Reason</th>
                <th className="py-2 px-4 border">Submitted At</th>
                <th className="py-2 px-4 border">Last Updated</th>
                <th className="py-2 px-4 border">Type</th>
                <th className="py-2 px-4 border">Total Marks</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((sub) => (
                <tr key={sub._id} className="border-b">
                  <td className="py-2 px-4 border max-w-xs truncate" title={sub.type === 'OSCE' ? sub.title : sub.question}>
                    {sub.type === 'OSCE' ? sub.title : sub.question}
                  </td>
                  <td className="py-2 px-4 border">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                      ${sub.status === 'approved' ? 'bg-green-100 text-green-700' :
                        sub.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'}`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="py-2 px-4 border text-red-600">
                    {sub.status === 'rejected' ? <RejectionReasonCell reason={sub.rejectionReason} /> : '-'}
                  </td>
                  <td className="py-2 px-4 border">{new Date(sub.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border">{new Date(sub.updatedAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border">
                    <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${sub.type === 'OSCE' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{sub.type}</span>
                  </td>
                  <td className="py-2 px-4 border text-center">
                    {sub.type === 'OSCE' ? (
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                        {(sub as any).totalMarks || 0} pts
                      </span>
                    ) : '-'}
                  </td>
                  <td className="py-2 px-4 border flex gap-2 justify-end items-center">
                    <Tooltip text="View Submission">
                      <button
                        className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-primary rounded-full p-2 hover:bg-primary hover:text-white hover:border-primary transition focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        aria-label="View submission"
                        type="button"
                        onClick={() => handleViewClick(sub._id, sub.type)}
                      >
                        <EyeIcon className="w-5 h-5" />
                      </button>
                    </Tooltip>
                    {(sub.status === 'draft' || sub.status === 'rejected' || sub.status === 'pending') && (
                      <Tooltip text="Delete Submission">
                        <button
                          className="inline-flex items-center justify-center bg-gray-100 border border-gray-300 text-red-500 rounded-full p-2 hover:bg-red-500 hover:text-white hover:border-red-500 transition focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                          aria-label="Delete submission"
                          type="button"
                          onClick={() => handleDelete(sub._id, sub.type)}
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </Tooltip>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {successMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-2 rounded shadow-lg z-50 text-center">
          {successMessage}
        </div>
      )}
      {/* Modal for viewing submission */}
      {modalOpen && (
        selectedSubmission?.type === 'OSCE' ? (
          <OsceStationViewModal
            open={modalOpen}
            onClose={() => setModalOpen(false)}
            station={selectedSubmission}
            loading={modalLoading}
            error={modalError}
            user={user}
            onAction={(type, message, itemId) => {
              if (type === 'delete' && itemId) {
                // Remove deleted item from submissions list
                setSubmissions(prev => prev.filter(q => q._id !== itemId));
                setModalOpen(false);
                setSuccessMessage(message);
                setTimeout(() => setSuccessMessage(''), 3000);
              } else if (type === 'error') {
                setError(message);
                setTimeout(() => setError(''), 3000);
              }
            }}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-3xl relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
              <h3 className="text-xl font-bold mb-4 text-primary">Question Details</h3>
              {modalLoading ? (
                <div className="text-center text-gray-500">Loading...</div>
              ) : modalError ? (
                <div className="text-center text-red-500">{modalError}</div>
              ) : selectedSubmission ? (
                <div className="space-y-4 text-left overflow-y-auto max-h-[70vh] pr-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2"><span className="font-semibold">Subject:</span> {selectedSubmission.subject}</div>
                      <div className="mb-2"><span className="font-semibold">Topic:</span> {selectedSubmission.topic}</div>
                      {selectedSubmission.subtopic && (
                        <div className="mb-2"><span className="font-semibold">Subtopic:</span> {selectedSubmission.subtopic}</div>
                      )}
                      <div className="mb-2"><span className="font-semibold">Reference:</span> {selectedSubmission.reference}</div>
                    </div>
                    <div>
                      <div className="mb-2"><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                        ${selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-700' :
                          selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'}`}>{selectedSubmission.status}</span></div>
                      <div className="mb-2"><span className="font-semibold">Rejection Reason:</span> <RejectionReasonCell reason={selectedSubmission.rejectionReason} /></div>
                      <div className="mb-2"><span className="font-semibold">Submitted At:</span> {new Date(selectedSubmission.createdAt).toLocaleString()}</div>
                      <div className="mb-2"><span className="font-semibold">Last Updated:</span> {new Date(selectedSubmission.updatedAt).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Question:</span>
                    <div className="mt-1 bg-gray-50 rounded p-3 border text-gray-800">{selectedSubmission.question}</div>
                  </div>
                  <div>
                    <span className="font-semibold">Choices & Explanations:</span>
                    <table className="w-full mt-2 border rounded bg-gray-50">
                      <thead>
                        <tr>
                          <th className="px-2 py-1 text-left font-semibold text-gray-700">Choice</th>
                          <th className="px-2 py-1 text-left font-semibold text-gray-700">Explanation</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSubmission.choices?.map((c: string, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1 align-top">{c}</td>
                            <td className="px-2 py-1 align-top">{selectedSubmission.explanations?.[i]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {selectedSubmission.images && selectedSubmission.images.length > 0 && (
                    <div>
                      <span className="font-semibold">Images:</span>
                      <div className="flex gap-2 flex-wrap mt-2">
                        {selectedSubmission.images.map((img: string, idx: number) => (
                          <img
                            key={idx}
                            src={`${API_BASE_URL}${img}`}
                            alt={`submission-img-${idx}`}
                            className="w-16 h-16 object-cover rounded border cursor-pointer"
                            onClick={() => setFullImage(`${API_BASE_URL}${img}`)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : null}
              <div className="flex justify-end mt-6">
                <button
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                  onClick={() => setModalOpen(false)}
                >
                  Close
                </button>
              </div>
            </div>
            {/* Fullscreen image overlay */}
            {fullImage && (
              <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setFullImage(undefined)}>
                <img src={fullImage} alt="full" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
                <button className="absolute top-8 right-8 text-white text-4xl font-bold" onClick={() => setFullImage(undefined)}>&times;</button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default AllSubmissions; 