import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';
import { FunnelIcon, BookOpenIcon, TagIcon } from '@heroicons/react/24/outline';

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

// Utility to get status counts
function getStatusCounts(questions: any[]) {
  let approved = 0, pending = 0, rejected = 0;
  for (const q of questions) {
    if (q.status === 'approved') approved++;
    else if (q.status === 'pending') pending++;
    else if (q.status === 'rejected') rejected++;
  }
  return { approved, pending, rejected };
}

// Helper for avatar initials
function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const QuestionReview: React.FC = () => {
  const { jwt } = useAuth();
  const [questions, setQuestions] = useState<any[]>([]);
  const [editReasonId, setEditReasonId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<{ open: boolean, question: any | null }>({ open: false, question: null });

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

  const statusCounts = getStatusCounts(questions);

  useEffect(() => {
    const fetchQuestions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:5050/api/submissions?status=pending', {
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
      const response = await fetch(`http://localhost:5050/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === id
              ? { ...q, status, rejectionReason: status === 'rejected' ? q.rejectionReason : '' }
              : q
          )
        );
        if (status !== 'rejected') setEditReasonId(null);
      }
    } catch {}
  };

  const saveRejectionReason = async (id: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: 'rejected', rejectionReason }),
      });
      if (response.ok) {
        setQuestions((prev) =>
          prev.map((q) =>
            q._id === id ? { ...q, status: 'rejected', rejectionReason } : q
          )
        );
        setEditReasonId(null);
        setRejectionReason('');
      }
    } catch {}
  };

  // Filter questions by selected category/subject/topic
  const filteredQuestions = questions.filter(q =>
    (selectedCategory === 'All' || q.category === selectedCategory) &&
    (selectedSubject === 'All' || q.subject === selectedSubject) &&
    (selectedTopic === 'All' || q.topic === selectedTopic)
  );

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="w-full bg-blue-50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-8 mt-8 mb-8 shadow-none border border-blue-100">
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">Question Review</h1>
          <p className="text-lg md:text-xl font-medium text-gray-500">Review and manage pending questions</p>
        </div>
        <div className="flex flex-row gap-8 w-full md:w-auto justify-between md:justify-end">
          <div className="flex flex-col items-end">
            <span className="text-3xl font-extrabold text-[#10B981] leading-none">{statusCounts.approved}</span>
            <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">Approved</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-extrabold text-[#F59E0B] leading-none">{statusCounts.pending}</span>
            <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">Pending</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-3xl font-extrabold text-[#EF4444] leading-none">{statusCounts.rejected}</span>
            <span className="text-xs uppercase tracking-widest text-gray-400 font-semibold mt-1">Rejected</span>
          </div>
        </div>
      </div>
      <div className="w-full">
        {/* Enhanced Filters Section */}
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-wrap gap-6 items-end shadow-sm">
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <TagIcon className="w-4 h-4 text-primary" /> Category
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedSubject('All'); setSelectedTopic('All'); }}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <BookOpenIcon className="w-4 h-4 text-primary" /> Subject
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('All'); }}>
                <option value="All">All</option>
                {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <FunnelIcon className="w-4 h-4 text-primary" /> Topic
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
                <option value="All">All</option>
                {(topics as string[]).map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow p-6 w-full">
          {loading ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">Loading...</div>
          ) : error ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <div className="overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              <table className="min-w-full text-left rounded-xl overflow-hidden bg-white">
                <thead>
                  <tr className="bg-gray-100 text-gray-700">
                    <th className="py-3 px-6 font-semibold">Writer</th>
                    <th className="py-3 px-6 font-semibold">Subject / Topic</th>
                    <th className="py-3 px-6 font-semibold">Question</th>
                    <th className="py-3 px-6 font-semibold">Choices</th>
                    <th className="py-3 px-6 font-semibold">Explanations</th>
                    <th className="py-3 px-6 font-semibold">Reference</th>
                    <th className="py-3 px-6 font-semibold">Images</th>
                    <th className="py-3 px-6 font-semibold">Status</th>
                    <th className="py-3 px-6 font-semibold">Actions</th>
                    <th className="py-3 px-6 font-semibold">Rejection Reason</th>
                    <th className="py-3 px-6 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredQuestions.map((q) => (
                    <tr key={q._id} className="border-t align-top hover:bg-blue-50 hover:shadow-md transition">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-200 text-blue-700 font-bold text-sm">
                            {getInitials(q.writer?.name || '-')}
                          </span>
                          <span>{q.writer?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6">{q.subject} / {q.topic}</td>
                      <td className="py-3 px-6 max-w-xs truncate" title={q.question}>{q.question}</td>
                      <td className="py-3 px-6">
                        <ul className="list-disc pl-4">
                          {(q.choices || []).map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-6">
                        <ul className="list-disc pl-4">
                          {(q.explanations || []).map((e: string, i: number) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </td>
                      <td className="py-3 px-6">{q.reference}</td>
                      <td className="py-3 px-6">
                        {q.images && q.images.length > 0 && (
                          <div className="flex gap-2 flex-wrap mt-1">
                            {q.images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={`http://localhost:5050${img}`}
                                alt={`submission-img-${idx}`}
                                className="w-12 h-12 object-cover rounded border cursor-pointer"
                                onClick={() => setFullImage(`http://localhost:5050${img}`)}
                              />
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[q.status]}`}>{q.status}</span>
                      </td>
                      <td className="py-3 px-6 min-w-[140px] flex flex-col gap-2">
                        <button onClick={() => setStatus(q._id, 'approved')} className="bg-green-500 text-white px-3 py-1 rounded font-semibold text-xs hover:bg-green-600 transition">Accept</button>
                        <button onClick={() => { setEditReasonId(q._id); setRejectionReason(q.rejectionReason || ''); }} className="bg-red-500 text-white px-3 py-1 rounded font-semibold text-xs hover:bg-red-600 transition">Reject</button>
                        <button onClick={() => setStatus(q._id, 'pending')} className="bg-yellow-500 text-white px-3 py-1 rounded font-semibold text-xs hover:bg-yellow-600 transition">Pending</button>
                      </td>
                      <td className="py-3 px-6">
                        {q.status === 'rejected' && editReasonId !== q._id && (
                          <span className="text-red-600 text-xs">{q.rejectionReason}</span>
                        )}
                        {editReasonId === q._id && (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              value={rejectionReason}
                              onChange={e => setRejectionReason(e.target.value)}
                              className="px-2 py-1 border rounded"
                              placeholder="Enter rejection reason"
                            />
                            <button onClick={() => saveRejectionReason(q._id)} className="bg-primary text-white px-2 py-1 rounded text-xs">Save</button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
                          onClick={() => setViewModal({ open: true, question: q })}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
      {viewModal.open && viewModal.question && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setViewModal({ open: false, question: null })}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-primary">Question Details</h3>
            <div className="space-y-2 text-left">
              <div><span className="font-semibold">Subject:</span> {viewModal.question.subject}</div>
              <div><span className="font-semibold">Topic:</span> {viewModal.question.topic}</div>
              <div><span className="font-semibold">Question:</span> {viewModal.question.question}</div>
              <div><span className="font-semibold">Choices:</span>
                <ul className="list-disc pl-6">
                  {viewModal.question.choices?.map((c: string, i: number) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold">Explanations:</span>
                <ul className="list-disc pl-6">
                  {viewModal.question.explanations?.map((e: string, i: number) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
              <div><span className="font-semibold">Reference:</span> {viewModal.question.reference}</div>
              <div><span className="font-semibold">Status:</span> {viewModal.question.status}</div>
              <div><span className="font-semibold">Rejection Reason:</span> {viewModal.question.rejectionReason || '-'}</div>
              <div><span className="font-semibold">Submitted At:</span> {new Date(viewModal.question.createdAt).toLocaleString()}</div>
              <div><span className="font-semibold">Last Updated:</span> {new Date(viewModal.question.updatedAt).toLocaleString()}</div>
              {viewModal.question.images && viewModal.question.images.length > 0 && (
                <div>
                  <span className="font-semibold">Images:</span>
                  <div className="flex gap-2 flex-wrap mt-2">
                    {viewModal.question.images.map((img: string, idx: number) => (
                      <img
                        key={idx}
                        src={`http://localhost:5050${img}`}
                        alt={`submission-img-${idx}`}
                        className="w-16 h-16 object-cover rounded border cursor-pointer"
                        onClick={() => setFullImage(`http://localhost:5050${img}`)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <button
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                onClick={() => setViewModal({ open: false, question: null })}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionReview; 