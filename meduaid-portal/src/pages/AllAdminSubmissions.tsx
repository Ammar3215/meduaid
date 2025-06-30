import React, { useEffect, useState } from 'react';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';

const categories = Object.keys(subjectsStructure);

const AllAdminSubmissions: React.FC = () => {
  const { jwt } = useAuth();
  const [category, setCategory] = useState(categories[0]);
  const subjects = Object.keys((subjectsStructure as Record<string, any>)[category] || {});
  const [subject, setSubject] = useState('All');
  const topics = subject !== 'All'
    ? (Array.isArray(((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject])
        ? ((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject]
        : Object.keys(((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject] || {}))
    : [];
  const [topic, setTopic] = useState('All');
  const [writer, setWriter] = useState('All');
  const [date, setDate] = useState('');
  const [questions, setQuestions] = useState<any[]>([]);
  const [writers, setWriters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:5050/api/submissions', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!response.ok) {
          setError('Failed to fetch submissions');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setQuestions(data);
        // Extract unique writers
        const uniqueWriters: string[] = Array.from(new Set(data.map((q: any) => q.writer?.name).filter((n: any): n is string => Boolean(n))));
        setWriters(uniqueWriters);
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    if (jwt) fetchSubmissions();
  }, [jwt]);

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/submissions/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setQuestions(prev => prev.map(q => q._id === id ? { ...q, status: newStatus, rejectionReason: newStatus === 'rejected' ? q.rejectionReason : undefined } : q));
      }
    } catch {}
  };
  const handleReasonChange = (id: string, reason: string) => {
    setQuestions(prev => prev.map(q => q._id === id ? { ...q, rejectionReason: reason } : q));
  };
  const handleSaveReason = async (id: string, reason: string) => {
    try {
      const response = await fetch(`http://localhost:5050/api/submissions/${id}`, {
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
  const handleViewClick = async (id: string) => {
    setModalLoading(true);
    setModalError('');
    setSelectedSubmission(null);
    setModalOpen(true);
    try {
      const res = await fetch(`http://localhost:5050/api/submissions/${id}`, {
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

  const filtered = questions.filter(q =>
    (category === 'All' || category === 'Basic Sciences') &&
    (subject === 'All' || q.subject === subject) &&
    (topic === 'All' || q.topic === topic) &&
    (writer === 'All' || q.writer?.name === writer) &&
    (!date || q.createdAt.startsWith(date))
  );

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">All Submissions</h2>
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select className="border rounded px-2 py-1" value={category} onChange={e => { setCategory(e.target.value); setSubject('All'); setTopic('All'); }}>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Subject</label>
          <select className="border rounded px-2 py-1" value={subject} onChange={e => { setSubject(e.target.value); setTopic('All'); }}>
            <option value="All">All</option>
            {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Topic</label>
          <select className="border rounded px-2 py-1" value={topic} onChange={e => setTopic(e.target.value)}>
            <option value="All">All</option>
            {(topics as string[]).map((t: string) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Writer</label>
          <select className="border rounded px-2 py-1" value={writer} onChange={e => setWriter(e.target.value)}>
            <option value="All">All</option>
            {writers.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      {loading ? (
        <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">Loading...</div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full table-fixed text-left">
            <thead>
              <tr>
                <th className="py-2">Timestamp</th>
                <th>Writer</th>
                <th>Subject / Topic</th>
                <th>Status</th>
                <th>Rejection Reason</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((q) => (
                  <tr key={q._id} className="border-t align-top">
                    <td className="py-2">{new Date(q.createdAt).toLocaleString()}</td>
                    <td>{q.writer?.name || '-'}</td>
                    <td>{q.subject} / {q.topic}</td>
                    <td>
                      <select
                        className="border rounded px-2 py-1"
                        value={q.status}
                        onChange={e => handleStatusChange(q._id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </td>
                    <td>
                      {q.status === 'rejected' ? (
                        <>
                          <input
                            type="text"
                            className="border rounded px-2 py-1 w-full mb-1"
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
                    <td>
                      <button
                        className="bg-blue-500 text-white rounded px-3 py-1 hover:bg-blue-600"
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
      )}
      {/* Modal for viewing submission */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
              onClick={() => setModalOpen(false)}
            >
              &times;
            </button>
            <h3 className="text-xl font-bold mb-4 text-primary">Edit Question</h3>
            {modalLoading ? (
              <div className="text-center text-gray-500">Loading...</div>
            ) : modalError ? (
              <div className="text-center text-red-500">{modalError}</div>
            ) : selectedSubmission ? (
              <AdminEditQuestionForm
                submission={selectedSubmission}
                onClose={() => setModalOpen(false)}
                onSave={updated => {
                  setQuestions(prev => prev.map(q => q._id === updated._id ? updated : q));
                  setSelectedSubmission(updated);
                  setModalOpen(false);
                }}
                jwt={jwt || ''}
              />
            ) : null}
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
  const categories = Object.keys(subjectsStructure);
  const subjects = Object.keys((subjectsStructure as Record<string, any>)[form.category] || {});
  const topics = form.subject
    ? (Array.isArray(((subjectsStructure as Record<string, any>)[form.category] as Record<string, any>)[form.subject])
        ? ((subjectsStructure as Record<string, any>)[form.category] as Record<string, any>)[form.subject]
        : Object.keys(((subjectsStructure as Record<string, any>)[form.category] as Record<string, any>)[form.subject] || {}))
    : [];

  const handleChange = (field: string, value: any) => {
    setForm((f: any) => ({ ...f, [field]: value }));
  };
  const handleArrayChange = (field: string, idx: number, value: string) => {
    setForm((f: any) => ({ ...f, [field]: f[field].map((v: string, i: number) => i === idx ? value : v) }));
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        category: form.category,
        subject: form.subject,
        topic: form.topic,
        question: form.question,
        choices: form.choices,
        explanations: form.explanations,
        reference: form.reference,
        difficulty: form.difficulty,
      };
      const res = await fetch(`http://localhost:5050/api/submissions/${form._id}`, {
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
        <select value={form.category} onChange={e => handleChange('category', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
          {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Subject</label>
        <select value={form.subject} onChange={e => handleChange('subject', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
          <option value="">Select Subject</option>
          {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Topic</label>
        <select value={form.topic} onChange={e => handleChange('topic', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
          <option value="">Select Topic</option>
          {(topics as string[]).map(topic => <option key={topic} value={topic}>{topic}</option>)}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Question</label>
        <textarea value={form.question} onChange={e => handleChange('question', e.target.value)} className="w-full px-4 py-2 border rounded-lg min-h-[80px]" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Choices (A–E)</label>
        {Array.from({ length: 5 }).map((_, i) => (
          <input
            key={i}
            value={form.choices[i] || ''}
            onChange={e => handleArrayChange('choices', i, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-2"
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
            onChange={e => handleArrayChange('explanations', i, e.target.value)}
            className="w-full px-4 py-2 border rounded-lg mb-2"
            placeholder={`Explain Choice ${String.fromCharCode(65 + i)}`}
          />
        ))}
      </div>
      <div>
        <label className="block mb-1 font-medium">Reference</label>
        <input value={form.reference} onChange={e => handleChange('reference', e.target.value)} className="w-full px-4 py-2 border rounded-lg" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Difficulty</label>
        <select value={form.difficulty || 'normal'} onChange={e => handleChange('difficulty', e.target.value)} className="w-full px-4 py-2 border rounded-lg">
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
                src={`http://localhost:5050${img}`}
                alt={`submission-img-${idx}`}
                className="w-16 h-16 object-cover rounded border cursor-pointer"
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