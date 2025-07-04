import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';
import { FunnelIcon, BookOpenIcon, TagIcon, CheckCircleIcon, XCircleIcon, ClockIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import ReactDOM from 'react-dom';
import Skeleton from '../components/Skeleton';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const QuestionReview: React.FC = () => {
  const { jwt } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${API_BASE_URL}/api/submissions?status=pending`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!response.ok) {
          setError('Failed to fetch questions');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setQuestions(data);
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    if (jwt) fetchQuestions();
  }, [jwt]);

  const setStatus = async (id: string, status: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q._id !== id));
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
      }
    } catch {}
  };

  const saveRejectionReason = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: 'rejected', rejectionReason }),
      });
      if (response.ok) {
        setQuestions((prev) => prev.filter((q) => q._id !== id));
        setEditReasonId(null);
        setRejectionReason('');
        if (detailsModal.open) setDetailsModal({ open: false, question: null });
        setToast({ message: 'Question rejected successfully', type: 'error' });
        setTimeout(() => setToast(null), 2000);
      }
    } catch {}
  };

  // Filter questions by selected category/subject/topic
  const filteredQuestions = questions.filter(q =>
    (selectedCategory === 'All' || q.category === selectedCategory) &&
    (selectedSubject === 'All' || q.subject === selectedSubject) &&
    (selectedTopic === 'All' || q.topic === selectedTopic)
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Restore getInitials helper function
  function getInitials(name: string) {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return (
    <>
      <div className="w-full max-w-full max-w-6xl mx-auto px-2 md:px-6">
        {toast && (
          <div className={`fixed top-6 right-6 z-[9999] px-6 py-3 rounded-lg shadow-lg text-white font-semibold transition-all duration-300
            ${toast.type === 'success' ? 'bg-green-500' : toast.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}
          >
            {toast.message}
          </div>
        )}
        {/* Removed Question Review header and subtext as requested */}
        <div className="w-full">
          {/* Enhanced Filters Section */}
          <div className="mb-8">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-2 md:p-6 flex flex-col md:flex-row flex-wrap gap-2 md:gap-6 items-end shadow-sm">
              <div className="flex flex-col min-w-[160px]">
                <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                  <TagIcon className="w-4 h-4 text-primary" /> Category
                </label>
                <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedSubject('All'); setSelectedTopic('All'); }}>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[160px]">
                <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                  <BookOpenIcon className="w-4 h-4 text-primary" /> Subject
                </label>
                <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('All'); }}>
                  <option value="All">All</option>
                  {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
                </select>
              </div>
              <div className="flex flex-col min-w-[160px]">
                <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                  <FunnelIcon className="w-4 h-4 text-primary" /> Topic
                </label>
                <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary bg-white text-gray-900" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                  <option value="All">All</option>
                  {(topics as string[]).map((t: string) => <option key={t} value={t}>{t}</option>)}
                </select>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredQuestions.map((q) => {
                  const truncated = q.question.length > 120;
                  return (
                    <div key={q._id} className="bg-white/90 rounded-2xl shadow-xl border border-gray-100 p-6 flex flex-col gap-2 transition-all duration-200 hover:shadow-2xl min-h-[180px] max-h-[240px] justify-between">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-200 text-blue-700 font-bold text-lg">
                          {getInitials(q.writer?.name || '-')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate">{q.writer?.name || '-'}</div>
                          <div className="text-xs text-gray-500 truncate">{q.subject} / {q.topic}</div>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${q.status === 'approved' ? 'bg-green-100 text-green-700' : q.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.status === 'approved' ? <CheckCircleIcon className="w-4 h-4" /> : q.status === 'rejected' ? <XCircleIcon className="w-4 h-4" /> : <ClockIcon className="w-4 h-4" />} {q.status}</span>
                      </div>
                      <div className="font-medium text-gray-800 truncate" title={q.question}>{truncated ? q.question.slice(0, 120) + '...' : q.question}</div>
                      {q.status === 'rejected' && (
                        <div className="text-xs text-red-600 mt-1">Reason: {q.rejectionReason || '-'}</div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        <button onClick={() => setStatus(q._id, 'approved')} className="bg-green-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-green-600 transition flex items-center gap-1"><CheckCircleIcon className="w-4 h-4" /> Approve</button>
                        <button onClick={() => { setEditReasonId(q._id); setRejectionReason(q.rejectionReason || ''); setDetailsModal({ open: true, question: q }); }} className="bg-red-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-red-600 transition flex items-center gap-1"><XCircleIcon className="w-4 h-4" /> Reject</button>
                        <button onClick={() => setStatus(q._id, 'pending')} className="bg-yellow-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-yellow-600 transition flex items-center gap-1"><ClockIcon className="w-4 h-4" /> Pending</button>
                        <button onClick={() => setDetailsModal({ open: true, question: q })} className="bg-primary text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-primary-dark transition flex items-center gap-1 ml-auto"><BookOpenIcon className="w-4 h-4" /> View Details</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        {fullImage && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-90" onClick={() => setFullImage(null)}>
            <img src={fullImage} alt="full" className="max-h-[90vh] max-w-[90vw] rounded shadow-lg" />
            <button className="absolute top-8 right-8 text-white text-4xl font-bold" onClick={() => setFullImage(null)}>&times;</button>
          </div>
        )}
        {detailsModal.open && detailsModal.question && ReactDOM.createPortal(
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
                <form className="space-y-4 text-left" onSubmit={async (e) => {
                  e.preventDefault();
                  // PATCH updated fields
                  const res = await fetch(`${API_BASE_URL}/api/submissions/${editData._id}`, {
                    method: 'PATCH',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${jwt}`,
                    },
                    body: JSON.stringify({
                      question: editData.question,
                      choices: editData.choices,
                      explanations: editData.explanations,
                      reference: editData.reference,
                    }),
                  });
                  if (res.ok) {
                    setToast({ message: 'Question updated successfully', type: 'success' });
                    setTimeout(() => setToast(null), 2000);
                    setIsEditing(false);
                    setEditData(null);
                    setDetailsModal({ open: false, question: null });
                  }
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2"><span className="font-semibold">Writer:</span> {detailsModal.question.writer?.name || '-'}</div>
                      <div className="mb-2"><span className="font-semibold">Subject:</span> {detailsModal.question.subject}</div>
                      <div className="mb-2"><span className="font-semibold">Topic:</span> {detailsModal.question.topic}</div>
                      <div className="mb-2"><span className="font-semibold">Reference:</span>
                        <input className="w-full px-2 py-1 border rounded bg-white text-gray-900" value={editData.reference} onChange={e => setEditData((d: any) => ({ ...d, reference: e.target.value }))} />
                      </div>
                    </div>
                  </div>
                  <div className="mb-2">
                    <span className="font-semibold">Question:</span>
                    <textarea className="w-full mt-1 bg-gray-50 rounded p-3 border text-gray-800" value={editData.question} onChange={e => setEditData((d: any) => ({ ...d, question: e.target.value }))} />
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
                        {editData.choices?.map((_: string, i: number) => (
                          <tr key={i} className="border-t">
                            <td className="px-2 py-1 align-top">
                              <input className="w-full px-2 py-1 border rounded bg-white text-gray-900" value={editData.choices[i]} onChange={e => setEditData((d: any) => { const arr = [...d.choices]; arr[i] = e.target.value; return { ...d, choices: arr }; })} />
                            </td>
                            <td className="px-2 py-1 align-top">
                              <input className="w-full px-2 py-1 border rounded bg-white text-gray-900" value={editData.explanations[i]} onChange={e => setEditData((d: any) => { const arr = [...d.explanations]; arr[i] = e.target.value; return { ...d, explanations: arr }; })} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-4 justify-end">
                    <button type="button" onClick={() => { setIsEditing(false); setEditData(null); }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
                    <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition">Save</button>
                  </div>
                </form>
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
          </div>,
          document.body
        )}
      </div>
    </>
  );
};

export default QuestionReview; 