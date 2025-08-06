import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';
import { FunnelIcon, BookOpenIcon, TagIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ChevronDownIcon, UserIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import ReactDOM from 'react-dom';
import Skeleton from '../components/Skeleton';
import OsceStationViewModal from '../components/OsceStationViewModal';
import AdminEditQuestionForm from '../components/AdminEditQuestionForm';
import { API_BASE_URL } from '../config/api';
import { apiGet, apiPatch } from '../utils/api';

const QuestionReview: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]); // pending only
  const [allQuestions, setAllQuestions] = useState<any[]>([]); // all-time stats
  const [editReasonId, setEditReasonId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [detailsModal, setDetailsModal] = useState<{ open: boolean, question: any | null }>({ open: false, question: null });
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  // Category/Subject/Topic filters
  const categories = ['All', ...Object.keys(subjectsStructure)];
  const [selectedCategory, setSelectedCategory] = useState('All');
  const subjects = Object.keys((subjectsStructure as Record<string, any>)[selectedCategory] || {});
  const [selectedSubject, setSelectedSubject] = useState('All');
  const topics = selectedSubject !== 'All'
    ? (Array.isArray(((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject])
        ? ((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject]
        : Object.keys(((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject] || {}))
    : [];
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [selectedWriter, setSelectedWriter] = useState('All');
  const [selectedType, setSelectedType] = useState('All');

  // Add pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const questionsPerPage = 12;

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch pending and all questions
        const pendingSba = await apiGet('/api/submissions?status=pending');
        const pendingOsce = (await apiGet('/api/osce-stations?status=pending')).map((q: any) => ({ ...q, type: 'OSCE' }));
        const allSba = await apiGet('/api/submissions');
        const allOsce = (await apiGet('/api/osce-stations')).map((q: any) => ({ ...q, type: 'OSCE' }));
        setQuestions([...pendingSba.map((q: any) => ({ ...q, type: 'SBA' })), ...pendingOsce]);
        setAllQuestions([...allSba.map((q: any) => ({ ...q, type: 'SBA' })), ...allOsce]);
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    if (isAuthenticated) fetchQuestions();
  }, [isAuthenticated]);

  // Extract unique writers from allQuestions
  const writers = Array.from(new Set(allQuestions.map((q: any) => q.writer?.name).filter(Boolean)));

  const setStatus = async (id: string, status: string) => {
    try {
      await apiPatch(`/api/submissions/${id}`, { status });
      // Remove from pending questions if approved or rejected
      if (status === 'approved' || status === 'rejected') {
        setQuestions((prev) => prev.filter((q) => q._id !== id));
      } else {
        // Update status in pending questions if set back to pending
        setQuestions((prev) => prev.map((q) => q._id === id ? { ...q, status } : q));
      }
      
      // Update status in all questions
      setAllQuestions((prev) => prev.map((q) => q._id === id ? { ...q, status } : q));
      
      setEditReasonId(null);
      if (detailsModal.open) setDetailsModal({ open: false, question: null });
      setToast({
        message:
          status === 'approved'
            ? 'Question accepted successfully'
            : status === 'rejected'
            ? 'Question rejected successfully'
            : 'Question set to pending',
        type:
          status === 'approved'
            ? 'success'
            : status === 'rejected'
            ? 'error'
            : 'info',
      });
      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Network error');
  };

  const saveRejectionReason = async (id: string) => {
    try {
      await apiPatch(`/api/submissions/${id}`, { status: 'rejected', rejectionReason });
      // Remove from pending questions since it's rejected
      setQuestions((prev) => prev.filter((q) => q._id !== id));
      
      // Update status in all questions
      setAllQuestions((prev) => prev.map((q) => q._id === id ? { ...q, status: 'rejected', rejectionReason } : q));
      
      setEditReasonId(null);
      setRejectionReason('');
      if (detailsModal.open) setDetailsModal({ open: false, question: null });
      setToast({ message: 'Question rejected successfully', type: 'error' });
      setTimeout(() => setToast(null), 2000);
    } catch (err: any) {
      setError(err.message || 'Network error');
  };

  // Filter questions by selected category/subject/topic/writer
  const filteredQuestions = questions.filter(q =>
    (selectedType === 'All' || q.type === selectedType) &&
    (selectedCategory === 'All' || q.category === selectedCategory) &&
    (selectedSubject === 'All' || q.subject === selectedSubject) &&
    (selectedTopic === 'All' || q.topic === selectedTopic) &&
    (selectedWriter === 'All' || q.writer?.name === selectedWriter)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Pagination logic
  const totalPages = Math.ceil(filteredQuestions.length / questionsPerPage);
  const startIndex = (currentPage - 1) * questionsPerPage;
  const endIndex = startIndex + questionsPerPage;
  const currentQuestions = filteredQuestions.slice(startIndex, endIndex);

  // Restore getInitials helper function
  function getInitials(name: string) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Reset writer filter when category/subject/topic changes
  useEffect(() => {
    setSelectedWriter('All');
  }, [selectedCategory, selectedSubject, selectedTopic]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, selectedSubject, selectedTopic, selectedWriter, selectedType]);

  return (
    <>
      <div className="w-full max-w-full max-w-6xl mx-auto md:px-6">
        {toast && (
          <div className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300
            ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            {toast.message}
          </div>
        )}
        {/* Removed Question Review header and subtext as requested */}
        {/* Enhanced Filters Section with Pending Counter */}
        <div className="mb-8 relative pt-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 md:p-4 flex flex-col md:flex-row flex-wrap gap-3 md:gap-4 items-center shadow-sm">
            {/* Compact Filters */}
            <div className="flex flex-col md:flex-row gap-3 md:gap-4 flex-1">
              <div className="flex flex-col min-w-[120px]">
                <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                  <TagIcon className="w-3 h-3 text-primary" /> Category
                </label>
                <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedSubject('All'); setSelectedTopic('All'); }}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[120px]">
                <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                  <BookOpenIcon className="w-3 h-3 text-primary" /> Subject
                </label>
                <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('All'); }}>
                  <option value="All">All</option>
                  {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[120px]">
                <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                  <FunnelIcon className="w-3 h-3 text-primary" /> Topic
                </label>
                <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                  <option value="All">All</option>
                  {(topics as string[]).map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[120px]">
                <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                  <UserIcon className="w-3 h-3 text-primary" /> Writer
                </label>
                <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={selectedWriter} onChange={e => setSelectedWriter(e.target.value)}>
                  <option value="All">All</option>
                  {writers.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[100px]">
                <label className="flex items-center gap-1 text-xs font-semibold mb-1 text-gray-700">
                  <DocumentTextIcon className="w-3 h-3 text-primary" /> Type
                </label>
                <select className="border rounded-lg px-2 py-1.5 focus:ring-primary focus:border-primary bg-white text-gray-900 text-sm" value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                  <option value="All">All</option>
                  <option value="SBA">SBA</option>
                  <option value="OSCE">OSCE</option>
                </select>
              </div>
            </div>
            
            {/* Pending Counter - moved beside filters */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-medium text-xs whitespace-nowrap">
              <ClockIcon className="w-4 h-4 text-blue-500" />
              <span className="text-lg font-bold">{filteredQuestions.length}</span>
              <span>Pending{selectedWriter !== 'All' ? ` (${selectedWriter})` : ''}</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow p-2 md:p-6 w-full">
          {loading ? (
            <div className="flex flex-col gap-4">
              <Skeleton height={40} />
              <Skeleton height={200} />
              <Skeleton height={40} width="60%" />
              <Skeleton height={40} width="80%" />
            </div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[180px] text-center text-gray-300 gap-2">
              <XCircleIcon className="w-12 h-12 text-gray-200 mx-auto" />
              <div>No questions to review.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentQuestions.map((q) => {
                return (
                  <div key={q._id} className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all duration-300 overflow-hidden">
                    {/* Header with writer info and status */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                              {getInitials(q.writer?.name || '-')}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-white shadow-sm flex items-center justify-center">
                              <div className={`w-2.5 h-2.5 rounded-full ${
                                q.type === 'SBA' ? 'bg-purple-500' : 'bg-orange-500'
                              }`}></div>
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{q.writer?.name || '-'}</h3>
                            <p className="text-xs text-gray-500 mt-0.5">{q.subject} • {q.topic}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            q.type === 'SBA' 
                              ? 'bg-purple-50 text-purple-700 border border-purple-200' 
                              : 'bg-orange-50 text-orange-700 border border-orange-200'
                          }`}>
                            <div className={`w-2 h-2 rounded-full ${
                              q.type === 'SBA' ? 'bg-purple-500' : 'bg-orange-500'
                            }`}></div>
                            {q.type}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            q.status === 'approved' 
                              ? 'bg-green-50 text-green-700 border border-green-200' 
                              : q.status === 'rejected' 
                              ? 'bg-red-50 text-red-700 border border-red-200' 
                              : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                          }`}>
                            {q.status === 'approved' ? (
                              <CheckCircleIcon className="w-3 h-3" />
                            ) : q.status === 'rejected' ? (
                              <XCircleIcon className="w-3 h-3" />
                            ) : (
                              <ClockIcon className="w-3 h-3" />
                            )}
                            {q.status.charAt(0).toUpperCase() + q.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      
                      {/* Question content */}
                      <div className="space-y-3">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                          <h4 className="font-medium text-gray-900 text-sm leading-relaxed line-clamp-3" title={q.type === 'OSCE' ? (q.title || '') : (q.question || '')}>
                            {q.type === 'OSCE'
                              ? (q.title ? (q.title.length > 150 ? q.title.slice(0, 150) + '...' : q.title) : '')
                              : (q.question ? (q.question.length > 150 ? q.question.slice(0, 150) + '...' : q.question) : '')}
                          </h4>
                        </div>
                        
                        {/* Rejection reason if applicable */}
                        {q.status === 'rejected' && q.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                            <div className="flex items-start gap-2">
                              <XCircleIcon className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-red-700">
                                <span className="font-medium">Rejection Reason:</span>
                                <p className="mt-1 leading-relaxed">{q.rejectionReason}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Footer with action button */}
                    <div className="px-6 pb-6">
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-gray-400">
                          {new Date(q.createdAt).toLocaleDateString()}
                        </div>
                        <button 
                          onClick={() => setDetailsModal({ open: true, question: q })} 
                          className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-xl font-medium text-sm hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-sm hover:shadow-md group-hover:scale-105"
                        >
                          <BookOpenIcon className="w-4 h-4" />
                          Review
                        </button>
                      </div>
                    </div>
                    
                    {/* Hover overlay effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-2xl"></div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Pagination Controls */}
        {filteredQuestions.length > questionsPerPage && (
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
        {filteredQuestions.length > 0 && (
          <div className="text-center text-gray-600 mt-4">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredQuestions.length)} of {filteredQuestions.length} questions
          </div>
        )}
      </div>
      {fullImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setFullImage(null)}>
          <img src={fullImage} alt="full" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
          <button className="absolute top-8 right-8 text-white text-4xl font-bold" onClick={() => setFullImage(null)}>&times;</button>
        </div>
      )}
      {detailsModal.open && detailsModal.question && ReactDOM.createPortal(
        detailsModal.question.type === 'OSCE' ? (
          <OsceStationViewModal
            open={detailsModal.open}
            onClose={() => { setDetailsModal({ open: false, question: null }); setEditReasonId(null); setIsEditing(false); setEditData(null); }}
            station={detailsModal.question}
            loading={false}
            error={''}
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
                setDetailsModal({ open: false, question: null });
                setToast({ type: 'success', message });
                setTimeout(() => setToast(null), 2000);
              } else if (type === 'approve' || type === 'reject' || type === 'pending') {
                // Update item status and remove from pending if approved/rejected
                if (itemId) {
                  const newStatus = type === 'approve' ? 'approved' : type === 'reject' ? 'rejected' : 'pending';
                  // Status update operation
                  
                  // Remove from pending questions if approved or rejected
                  if (newStatus === 'approved' || newStatus === 'rejected') {
                    setQuestions(prev => {
                      const filtered = prev.filter(q => q._id !== itemId);
                      // Status update on pending questions
                      return filtered;
                    });
                  } else {
                    // Update status in pending questions if set back to pending
                    setQuestions(prev => prev.map(q => q._id === itemId ? { ...q, status: newStatus } : q));
                  }
                  
                  // Update status in all questions
                  setAllQuestions(prev => prev.map(q => q._id === itemId ? { ...q, status: newStatus } : q));
                  
                  setDetailsModal({ open: false, question: null });
                  const toastType = type === 'approve' ? 'success' : type === 'reject' ? 'error' : 'info';
                  setToast({ type: toastType, message });
                  setTimeout(() => setToast(null), 2000);
                }
              } else {
                const toastType = type === 'error' ? 'error' : type === 'info' ? 'info' : 'success';
                setToast({ type: toastType, message });
                setTimeout(() => setToast(null), 2000);
              }
            }}
          />
        ) : (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
            <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                onClick={() => { setDetailsModal({ open: false, question: null }); setEditReasonId(null); setIsEditing(false); setEditData(null); }}
              >
                &times;
              </button>
              <h3 className="text-2xl font-bold mb-6 text-primary">Question Details</h3>
              {!isEditing ? (
                <>
                  <div className="space-y-6 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <div><span className="font-semibold">Writer:</span> {detailsModal.question.writer?.name || '-'}</div>
                        <div><span className="font-semibold">Subject:</span> {detailsModal.question.subject}</div>
                        <div><span className="font-semibold">Topic:</span> {detailsModal.question.topic}</div>
                        {detailsModal.question.subtopic && (
                          <div><span className="font-semibold">Subtopic:</span> {detailsModal.question.subtopic}</div>
                        )}
                        <div><span className="font-semibold">Reference:</span> {detailsModal.question.reference}</div>
                      </div>
                      <div className="space-y-3">
                        <div><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                          ${detailsModal.question.status === 'approved' ? 'bg-green-100 text-green-700' :
                            detailsModal.question.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}>{detailsModal.question.status}</span></div>
                        <div><span className="font-semibold">Rejection Reason:</span> {detailsModal.question.rejectionReason || '-'}</div>
                        <div><span className="font-semibold">Submitted At:</span> {new Date(detailsModal.question.createdAt).toLocaleString()}</div>
                        <div><span className="font-semibold">Last Updated:</span> {new Date(detailsModal.question.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mb-2">
                      <span className="font-semibold">Question:</span>
                      <div className="mt-2 bg-gray-50 rounded p-4 border text-gray-800 text-base whitespace-pre-line">{detailsModal.question.question}</div>
                    </div>
                    <div>
                      <span className="font-semibold">Choices & Explanations:</span>
                      <table className="w-full mt-3 border rounded bg-gray-50">
                        <thead>
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Choice</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-700">Explanation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailsModal.question.choices?.map((_: string, i: number) => {
                            const isCorrect = detailsModal.question.correctChoice === i;
                            return (
                              <tr key={i} className={`border-t ${isCorrect ? 'bg-green-50' : ''}`}>
                                <td className={`px-4 py-2 align-top text-base ${isCorrect ? 'text-green-700 font-bold' : ''}`}>
                                  {isCorrect && <CheckCircleIcon className="inline w-5 h-5 mr-1 text-green-500 align-text-bottom" />} {detailsModal.question.choices[i]}
                                </td>
                                <td className={`px-4 py-2 align-top text-base ${isCorrect ? 'text-green-700 font-semibold' : ''}`}>{detailsModal.question.explanations?.[i]}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    {detailsModal.question.images && detailsModal.question.images.length > 0 && (
                      <div>
                        <span className="font-semibold">Images:</span>
                        <div className="flex gap-4 flex-wrap mt-3">
                          {detailsModal.question.images.map((img: string, idx: number) => (
                            <img
                              key={idx}
                              src={`${API_BASE_URL}${img}`}
                              alt={`submission-img-${idx}`}
                              className="w-24 h-24 object-cover rounded border cursor-pointer"
                              onClick={() => setFullImage(`${API_BASE_URL}${img}`)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 mt-8">
                      <button onClick={() => { setStatus(detailsModal.question._id, 'approved'); setDetailsModal({ ...detailsModal, open: false }); }} className="bg-green-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-green-600 transition flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Approve</button>
                      <button onClick={() => { setEditReasonId(detailsModal.question._id); }} className="bg-red-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-red-600 transition flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Reject</button>
                      <button onClick={() => { setStatus(detailsModal.question._id, 'pending'); setDetailsModal({ ...detailsModal, open: false }); }} className="bg-yellow-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-yellow-600 transition flex items-center gap-1"><ClockIcon className="w-4 h-4" /> Pending</button>
                      <button onClick={() => { setIsEditing(true); setEditData({ ...detailsModal.question }); }} className="bg-blue-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-blue-600 transition flex items-center gap-1 ml-auto"><ChevronDownIcon className="w-4 h-4" /> Edit</button>
                    </div>
                    {editReasonId === detailsModal.question._id && (
                      <div className="flex flex-col gap-2 mt-2">
                        <input
                          type="text"
                          value={rejectionReason}
                          onChange={e => setRejectionReason(e.target.value)}
                          className="px-2 py-1 border rounded bg-white text-gray-900"
                          placeholder="Enter rejection reason"
                        />
                        <button onClick={() => { saveRejectionReason(detailsModal.question._id); setEditReasonId(null); setDetailsModal({ ...detailsModal, open: false }); }} className="bg-primary text-white px-2 py-1 rounded text-xs self-start">Save</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <AdminEditQuestionForm
                  submission={editData}
                  onClose={() => { setIsEditing(false); setEditData(null); }}
                  onSave={updated => {
                    setQuestions(prev => prev.map(q => q._id === updated._id ? updated : q));
                    setAllQuestions(prev => prev.map(q => q._id === updated._id ? updated : q));
                    setIsEditing(false);
                    setEditData(null);
                    setDetailsModal({ open: false, question: null });
                  }}
                />
              )}
              <div className="flex justify-end mt-6">
                <button
                  className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                  onClick={() => { setDetailsModal({ open: false, question: null }); setEditReasonId(null); setIsEditing(false); setEditData(null); }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        ),
        document.body
      )}
    </>
  );
};

export default QuestionReview; 