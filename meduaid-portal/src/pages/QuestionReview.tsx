import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';

const statusColors: Record<string, string> = {
  approved: 'bg-green-100 text-green-700',
  pending: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-700',
};

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
  const categories = Object.keys(subjectsStructure);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
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
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Question Review</h2>
      <div className="bg-white rounded-xl shadow p-6 w-full">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <select className="border rounded px-2 py-1" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setSelectedSubject('All'); setSelectedTopic('All'); }}>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Subject</label>
            <select className="border rounded px-2 py-1" value={selectedSubject} onChange={e => { setSelectedSubject(e.target.value); setSelectedTopic('All'); }}>
              <option value="All">All</option>
              {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Topic</label>
            <select className="border rounded px-2 py-1" value={selectedTopic} onChange={e => setSelectedTopic(e.target.value)}>
              <option value="All">All</option>
              {(topics as string[]).map((t: string) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
        ) : filteredQuestions.length === 0 ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            <table className="min-w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Writer</th>
                  <th>Subject / Topic</th>
                  <th>Question</th>
                  <th>Choices</th>
                  <th>Explanations</th>
                  <th>Reference</th>
                  <th>Images</th>
                  <th>Status</th>
                  <th>Actions</th>
                  <th>Rejection Reason</th>
                  <th>View</th>
                </tr>
              </thead>
              <tbody>
                {filteredQuestions.map((q) => (
                  <tr key={q._id} className="border-t align-top">
                    <td className="py-2 font-semibold">{q.writer?.name || '-'}</td>
                    <td>{q.subject} / {q.topic}</td>
                    <td>{q.question}</td>
                    <td>
                      <ul className="list-disc pl-4">
                        {(q.choices || []).map((c: string, i: number) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </td>
                    <td>
                      <ul className="list-disc pl-4">
                        {(q.explanations || []).map((e: string, i: number) => (
                          <li key={i}>{e}</li>
                        ))}
                      </ul>
                    </td>
                    <td>{q.reference}</td>
                    <td>
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
                    <td>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[q.status]}`}>{q.status}</span>
                    </td>
                    <td className="flex flex-col gap-2 min-w-[120px]">
                      <button onClick={() => setStatus(q._id, 'approved')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Accept</button>
                      <button onClick={() => { setEditReasonId(q._id); setRejectionReason(q.rejectionReason || ''); }} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                      <button onClick={() => setStatus(q._id, 'pending')} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Pending</button>
                    </td>
                    <td>
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
                    <td>
                      <button
                        className="bg-primary text-white px-2 py-1 rounded text-xs hover:bg-primary-dark"
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