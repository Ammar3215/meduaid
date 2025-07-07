import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { subjectsStructure } from '../utils/subjectsStructure';
import ReactDOM from 'react-dom';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import Skeleton from '../components/Skeleton';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

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

const Dashboard: React.FC = () => {
  const { jwt, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const categories = Object.keys(subjectsStructure);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const subjects = selectedCategory === 'All'
    ? Array.from(new Set((stats?.recentSubmissions || []).map((q: any) => q.subject).filter(Boolean)))
    : (subjectsStructure && (subjectsStructure as Record<string, any>)[selectedCategory]
        ? Object.keys((subjectsStructure as Record<string, any>)[selectedCategory])
        : []);
  const topics = selectedSubject === 'All'
    ? Array.from(new Set((stats?.recentSubmissions || []).map((q: any) => q.topic).filter(Boolean)))
    : (
        subjectsStructure &&
        (subjectsStructure as Record<string, any>)[selectedCategory] &&
        ((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject]
      )
      ? Array.isArray(((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject])
        ? ((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject]
        : Object.keys(((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject] || {})
      : [];
  const [penalties, setPenalties] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [showAllPenalties, setShowAllPenalties] = useState(false);
  const [showAllRejected, setShowAllRejected] = useState(false);

  useEffect(() => {
    if (user && user.isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/writer/stats`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!response.ok) {
          setError('Failed to fetch stats');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setStats(data);
        // Do not set selectedSubject here; default is 'All'
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    const fetchPenalties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/writer/penalties`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPenalties(data.penalties || []);
        }
      } catch {}
    };
    if (jwt) {
      fetchStats();
      fetchPenalties();
    }
  }, [jwt, location]);

  // Prepare data for counter
  const filteredQuestions = (stats?.recentSubmissions || []).filter((q: any) =>
    (selectedCategory === 'All' || q.category === selectedCategory) &&
    (selectedSubject === 'All' || q.subject === selectedSubject) &&
    (selectedTopic === 'All' || q.topic === selectedTopic) &&
    (selectedStatus === 'All' || q.status === selectedStatus)
  );

  // Rejected questions
  const rejectedQuestions = (stats?.recentSubmissions || []).filter((q: any) => q.status === 'rejected');
  const isEmptyRejected = rejectedQuestions.length === 0;

  // Handle View button click
  const handleViewClick = async (id: string) => {
    setModalLoading(true);
    setModalError('');
    setSelectedSubmission(null);
    setModalOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
        headers: { Authorization: `Bearer ${jwt}` },
      });
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

  return (
    <>
      <div className="w-full max-w-full px-2 md:px-4">
        {/* Add spacing between menu and cards */}
        <div className="mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8 w-full max-w-full mx-auto" style={{gridAutoRows: '1fr'}}>
          {/* Card 1: Total Submitted Questions (Animated Counter, Dropdowns, Modern Card) */}
          <div className="relative rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 flex flex-col items-stretch justify-start h-full" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1.5px solid #e3e6f0', minHeight: '320px'}}>
            <div className="absolute left-0 top-0 h-full w-2 bg-[#4B47B6]" />
            <div className="absolute inset-0 backdrop-blur-lg bg-[#f5f6fa]/95" />
            <div className="relative z-10 p-8 flex flex-col items-center justify-start w-full h-full">
              {/* Card Header */}
              <div className="flex items-center mb-6 w-full justify-center">
                <span className="inline-block w-2 h-6 rounded-full mr-3" style={{background: '#4B47B6'}}></span>
                <h2 className="text-2xl font-bold text-[#2d3748] tracking-tight">Total Submitted Questions</h2>
              </div>
              <div className="flex flex-col items-center justify-center w-full">
                {/* Dropdown Filters (Category, Subject, Topic, Status) */}
                <div className="flex flex-wrap justify-center gap-4 mb-6 w-full max-w-2xl animate-fade-in">
                  <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                    <label className="text-xs text-gray-700 mb-1 self-start">Category</label>
                    <div className="relative w-full">
                      <select
                        className="appearance-none w-full px-4 py-2 rounded-lg border border-[#4B47B6] text-[#4B47B6] font-semibold focus:ring-2 focus:ring-[#4B47B6] focus:border-[#4B47B6] transition bg-white/90 shadow-sm hover:border-[#4B47B6] hover:shadow-md"
                        value={selectedCategory}
                        onChange={e => { setSelectedCategory(e.target.value); setSelectedSubject('All'); setSelectedTopic('All'); }}
                        style={{paddingRight: '2.5rem'}}
                      >
                        <option value="All">All</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B47B6]">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#4B47B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                    <label className="text-xs text-gray-700 mb-1 self-start">Subject</label>
                    <div className="relative w-full">
                      <select
                        className="appearance-none w-full px-4 py-2 rounded-lg border border-[#4B47B6] text-[#4B47B6] font-semibold focus:ring-2 focus:ring-[#4B47B6] focus:border-[#4B47B6] transition bg-white/90 shadow-sm hover:border-[#4B47B6] hover:shadow-md"
                        value={selectedSubject}
                        onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('All'); }}
                        style={{paddingRight: '2.5rem'}}
                      >
                        <option value="All">All</option>
                        {subjects.map((subject) => (
                          <option key={subject as string} value={subject as string}>{subject as string}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B47B6]">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#4B47B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                    <label className="text-xs text-gray-700 mb-1 self-start">Topic</label>
                    <div className="relative w-full">
                      <select
                        className="appearance-none w-full px-4 py-2 rounded-lg border border-[#4B47B6] text-[#4B47B6] font-semibold focus:ring-2 focus:ring-[#4B47B6] focus:border-[#4B47B6] transition bg-white/90 shadow-sm hover:border-[#4B47B6] hover:shadow-md"
                        value={selectedTopic}
                        onChange={e => setSelectedTopic(e.target.value)}
                        style={{paddingRight: '2.5rem'}}
                      >
                        <option value="All">All</option>
                        {topics.map((topic: string) => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B47B6]">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#4B47B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                    <label className="text-xs text-gray-700 mb-1 self-start">Status</label>
                    <div className="relative w-full">
                      <select
                        className="appearance-none w-full px-4 py-2 rounded-lg border border-[#4B47B6] text-[#4B47B6] font-semibold focus:ring-2 focus:ring-[#4B47B6] focus:border-[#4B47B6] transition bg-white/90 shadow-sm hover:border-[#4B47B6] hover:shadow-md"
                        value={selectedStatus}
                        onChange={e => setSelectedStatus(e.target.value)}
                        style={{paddingRight: '2.5rem'}}
                      >
                        <option value="All">All</option>
                        <option value="approved">Approved</option>
                        <option value="pending">Pending</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B47B6]">
                        <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#4B47B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </span>
                    </div>
                  </div>
                </div>
                {/* Animated Counter */}
                <div className="text-6xl font-extrabold text-[#4B47B6] mb-2 transition-all duration-500">
                  {filteredQuestions.length.toLocaleString()}
                </div>
              </div>
            </div>
          </div>
          {/* Card 2: Penalties */}
          <div className="relative rounded-2xl shadow-xl overflow-hidden group transition-all duration-300" style={{background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'}}>
            <div className="absolute inset-0 backdrop-blur-md bg-[#f5f6fa]/95" />
            <div className="relative z-10 p-8 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <span className="inline-block w-2 h-6 rounded-full mr-3" style={{background: '#FF5757'}}></span>
                <h2 className="text-2xl font-bold text-[#2d3748] tracking-tight">Penalties</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center">
                {penalties.length === 0 ? (
                  <div className="text-gray-400">No penalties.</div>
                ) : (
                  <>
                    <div className="w-full flex flex-col gap-3">
                      {penalties.slice(0, 3).map((penalty, idx) => (
                        <div
                          key={idx}
                          className="bg-white/90 rounded-xl shadow border border-red-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            {penalty.type === 'monetary' ? (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-lg font-bold">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v9" /></svg>
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-lg font-bold">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414A9 9 0 105.636 18.364l1.414 1.414A9 9 0 1018.364 5.636z" /></svg>
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{penalty.reason}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`inline-block text-xs font-semibold rounded-full px-2 py-0.5 ${penalty.type === 'monetary' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{penalty.type === 'monetary' ? 'Monetary' : 'Strike'}</span>
                              {penalty.type === 'monetary' && penalty.amount && (
                                <span className="inline-block text-xs font-bold rounded-full px-2 py-0.5 bg-yellow-200 text-yellow-800">${penalty.amount}</span>
                              )}
                              <span className="text-gray-500 text-xs ml-2">{penalty.createdAt ? new Date(penalty.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {penalties.length > 3 && (
                      <button
                        className="mt-3 text-primary font-semibold hover:underline text-sm"
                        onClick={() => setShowAllPenalties(true)}
                      >
                        View All Penalties
                      </button>
                    )}
                    {showAllPenalties && ReactDOM.createPortal(
                      <div className="modal modal-backdrop fixed inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="all-penalties-modal modal-dialog bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setShowAllPenalties(false)}
                          >
                            &times;
                          </button>
                          <h3 className="text-xl font-bold mb-4 text-primary">All Penalties</h3>
                          <div className="flex flex-col gap-3">
                            {penalties.map((penalty, idx) => (
                              <div
                                key={idx}
                                className="bg-white/90 rounded-xl shadow border border-red-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:shadow-lg transition-all duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  {penalty.type === 'monetary' ? (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-700 text-lg font-bold">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 1.343-3 3s1.343 3 3 3 3-1.343 3-3-1.343-3-3-3zm0 0V4m0 7v9" /></svg>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-lg font-bold">
                                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-1.414-1.414A9 9 0 105.636 18.364l1.414 1.414A9 9 0 1018.364 5.636z" /></svg>
                                    </span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{penalty.reason}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className={`inline-block text-xs font-semibold rounded-full px-2 py-0.5 ${penalty.type === 'monetary' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{penalty.type === 'monetary' ? 'Monetary' : 'Strike'}</span>
                                    {penalty.type === 'monetary' && penalty.amount && (
                                      <span className="inline-block text-xs font-bold rounded-full px-2 py-0.5 bg-yellow-200 text-yellow-800">${penalty.amount}</span>
                                    )}
                                    <span className="text-gray-500 text-xs ml-2">{penalty.createdAt ? new Date(penalty.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {/* Card 3: Rejected Questions */}
          <div className="relative rounded-2xl shadow-xl overflow-hidden group transition-all duration-300" style={{background: 'linear-gradient(135deg, #8bc34a 0%, #a5d682 100%)', boxShadow: '0 8px 32px rgba(0,0,0,0.1)'}}>
            <div className="absolute inset-0 backdrop-blur-md bg-[#f5f6fa]/95" />
            <div className="relative z-10 p-8 flex flex-col h-full">
              <div className="flex items-center mb-4">
                <span className="inline-block w-2 h-6 rounded-full mr-3" style={{background: '#8BC34A'}}></span>
                <h2 className="text-2xl font-bold text-[#2d3748] tracking-tight">Rejected Questions</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center w-full">
                {isEmptyRejected ? (
                  <div className="text-gray-400">No rejected questions.</div>
                ) : (
                  <>
                    <div className="w-full flex flex-col gap-3">
                      {rejectedQuestions.slice(0, 3).map((q: any) => (
                        <div
                          key={q._id}
                          className="bg-white/90 rounded-xl shadow border border-red-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:shadow-lg transition-all duration-200"
                        >
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-lg font-bold">
                              <ExclamationCircleIcon className="w-5 h-5" />
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-gray-900 truncate">{q.subject} - {q.topic}</div>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-700">Rejected</span>
                              <RejectionReasonCell reason={q.rejectionReason} />
                            </div>
                          </div>
                          <button
                            className="bg-primary text-white px-3 py-1 rounded font-semibold hover:bg-primary-dark ml-auto"
                            onClick={() => handleViewClick(q._id)}
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                    {rejectedQuestions.length > 3 && (
                      <button
                        className="mt-3 text-primary font-semibold hover:underline text-sm"
                        onClick={() => setShowAllRejected(true)}
                      >
                        View All Rejected
                      </button>
                    )}
                    {showAllRejected && ReactDOM.createPortal(
                      <div className="modal modal-backdrop fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-[9999]">
                        <div className="all-penalties-modal modal-dialog bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
                          <button
                            className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                            onClick={() => setShowAllRejected(false)}
                          >
                            &times;
                          </button>
                          <h3 className="text-xl font-bold mb-4 text-primary">All Rejected Questions</h3>
                          <div className="flex flex-col gap-3">
                            {rejectedQuestions.map((q: any) => (
                              <div
                                key={q._id}
                                className="bg-white/90 rounded-xl shadow border border-red-100 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 hover:shadow-lg transition-all duration-200"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700 text-lg font-bold">
                                    <ExclamationCircleIcon className="w-5 h-5" />
                                  </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold text-gray-900 truncate">{q.subject} - {q.topic}</div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="inline-block text-xs font-semibold rounded-full px-2 py-0.5 bg-red-100 text-red-700">Rejected</span>
                                    <RejectionReasonCell reason={q.rejectionReason} />
                                  </div>
                                </div>
                                <button
                                  className="bg-primary text-white px-3 py-1 rounded font-semibold hover:bg-primary-dark ml-auto"
                                  onClick={() => { setShowAllRejected(false); handleViewClick(q._id); }}
                                >
                                  View
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>,
                      document.body
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        {/* Recently Submitted Questions Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 w-full mt-8 px-4 md:px-8">
          <div className="text-lg font-bold mb-4 text-primary">Recently Submitted Questions</div>
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton height={40} />
              <Skeleton height={200} />
              <Skeleton height={40} width="60%" />
              <Skeleton height={40} width="80%" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
          ) : (stats?.recentSubmissions?.length === 0) ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <>
              <div className="overflow-x-auto max-h-[400px]">
                <table className="min-w-[600px] w-full text-left rounded-xl overflow-hidden bg-white text-sm md:text-base">
                  <thead>
                    <tr>
                      <th className="py-2">Timestamp</th>
                      <th>Subject</th>
                      <th>Topic</th>
                      <th>Status</th>
                      <th>Rejection Reason</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentSubmissions
                      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                      .slice(0, 5)
                      .map((q: any) => (
                        <tr key={q._id} className="border-t">
                          <td className="py-2">{new Date(q.createdAt).toLocaleString()}</td>
                          <td>{q.subject}</td>
                          <td>{q.topic}</td>
                          <td>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                              ${q.status === 'approved' ? 'bg-green-100 text-green-700' :
                                q.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'}`}
                            >
                              {q.status}
                            </span>
                          </td>
                          <td>
                            {q.status === 'rejected' ? <RejectionReasonCell reason={q.rejectionReason} /> : '-'}
                          </td>
                          <td>
                            <button
                              className="bg-primary text-white px-3 py-1 rounded font-semibold hover:bg-primary-dark"
                              onClick={() => handleViewClick(q._id)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center mt-4">
                <button
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                  onClick={() => navigate('/all-submissions')}
                >
                  View All Submissions
                </button>
              </div>
              {/* Modal for viewing submission */}
              {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                  <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
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
                            <div className="mb-2"><span className="font-semibold">Reference:</span> {selectedSubmission.reference}</div>
                          </div>
                          <div>
                            <div className="mb-2"><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                              ${selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-700' :
                                selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'}`}>{selectedSubmission.status}</span></div>
                            <div className="mb-2"><span className="font-semibold">Rejection Reason:</span> {selectedSubmission.rejectionReason || '-'}</div>
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
                    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setFullImage(null)}>
                      <img src={fullImage} alt="full" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
                      <button className="absolute top-8 right-8 text-white text-4xl font-bold" onClick={() => setFullImage(null)}>&times;</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard; 