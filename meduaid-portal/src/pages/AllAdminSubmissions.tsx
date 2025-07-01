import React, { useEffect, useState } from 'react';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';
import { FunnelIcon, UserGroupIcon, CalendarDaysIcon, BookOpenIcon, TagIcon } from '@heroicons/react/24/outline';

const categories = Object.keys(subjectsStructure);

// Utility to convert array of objects to CSV
function toCSV(rows: any[], columns: { label: string, key: string }[]) {
  const header = columns.map(col => `"${col.label}"`).join(',');
  const body = rows.map(row =>
    columns.map(col => `"${(row[col.key] ?? '').toString().replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  return `${header}\n${body}`;
}

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

// Add helper for avatar
function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Tooltip component
function Tooltip({ children, text }: { children: React.ReactNode, text: string }) {
  const [show, setShow] = React.useState(false);
  return (
    <span className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} onFocus={() => setShow(true)} onBlur={() => setShow(false)} tabIndex={0}>
      {children}
      {show && (
        <span className="absolute z-20 left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap shadow-lg">
          {text}
        </span>
      )}
    </span>
  );
}

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
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const statusCounts = getStatusCounts(questions);

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
    setModalMode('view');
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

  // Add status change handler
  const handleModalStatusChange = async (newStatus: string) => {
    if (!selectedSubmission) return;
    try {
      const response = await fetch(`http://localhost:5050/api/submissions/${selectedSubmission._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (response.ok) {
        setQuestions(prev => prev.map(q => q._id === selectedSubmission._id ? { ...q, status: newStatus } : q));
        setSelectedSubmission({ ...selectedSubmission, status: newStatus });
      }
    } catch {}
  };

  const filtered = questions.filter(q =>
    (category === 'All' || q.category === category) &&
    (subject === 'All' || q.subject === subject) &&
    (topic === 'All' || q.topic === topic) &&
    (writer === 'All' || q.writer?.name === writer) &&
    (!date || q.createdAt.startsWith(date))
  );

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
    const rows = filtered.map(q => ({
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
    <div className="max-w-6xl mx-auto">
      {/* Header Section */}
      <div className="w-full bg-blue-50 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between px-8 py-8 mt-8 mb-8 shadow-none border border-blue-100">
        <div className="mb-6 md:mb-0">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">All Submissions</h1>
          <p className="text-lg md:text-xl font-medium text-gray-500">Manage and review all question submissions</p>
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
      {/* Main Content Section */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        {/* Enhanced Filters Section */}
        <div className="mb-8">
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 flex flex-wrap gap-6 items-end shadow-sm">
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <TagIcon className="w-4 h-4 text-primary" /> Category
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={category} onChange={e => { setCategory(e.target.value); setSubject('All'); setTopic('All'); }}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <BookOpenIcon className="w-4 h-4 text-primary" /> Subject
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={subject} onChange={e => { setSubject(e.target.value); setTopic('All'); }}>
                <option value="All">All</option>
                {subjects.map(subj => <option key={subj} value={subj}>{subj}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <FunnelIcon className="w-4 h-4 text-primary" /> Topic
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={topic} onChange={e => setTopic(e.target.value)}>
                <option value="All">All</option>
                {(topics as string[]).map((t: string) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <UserGroupIcon className="w-4 h-4 text-primary" /> Writer
              </label>
              <select className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={writer} onChange={e => setWriter(e.target.value)}>
                <option value="All">All</option>
                {writers.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex flex-col min-w-[160px]">
              <label className="flex items-center gap-1 text-sm font-semibold mb-1 text-gray-700">
                <CalendarDaysIcon className="w-4 h-4 text-primary" /> Date
              </label>
              <input type="date" className="border rounded-lg px-3 py-2 focus:ring-primary focus:border-primary" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>
        </div>
        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <button
            className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
            onClick={handleExport}
            disabled={filtered.length === 0}
          >
            Export Filtered as CSV
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
        ) : filtered.length === 0 ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left rounded-xl overflow-hidden bg-white">
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
                {filtered
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
                      <td className="py-3 px-6">{q.subject} / {q.topic}</td>
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
                              className="border rounded px-2 py-1 w-full mb-1"
                              value={q.rejectionReason || ''}
                              onChange={e => handleReasonChange(q._id, q.rejectionReason || '')}
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
                      <td className="py-3 px-6 text-right">
                        <button
                          className="bg-primary text-white px-4 py-2 rounded font-semibold hover:bg-primary-dark transition"
                          aria-label="View submission"
                          type="button"
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
            <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
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
                modalMode === 'edit' ? (
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
                ) : (
                  <>
                    <div className="space-y-2 text-left">
                      <div><span className="font-semibold">Category:</span> {selectedSubmission.category}</div>
                      <div><span className="font-semibold">Subject:</span> {selectedSubmission.subject}</div>
                      <div><span className="font-semibold">Topic:</span> {selectedSubmission.topic}</div>
                      <div><span className="font-semibold">Question:</span> {selectedSubmission.question}</div>
                      <div><span className="font-semibold">Choices:</span>
                        <ul className="list-disc pl-6">
                          {selectedSubmission.choices?.map((c: string, i: number) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                      <div><span className="font-semibold">Explanations:</span>
                        <ul className="list-disc pl-6">
                          {selectedSubmission.explanations?.map((e: string, i: number) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      </div>
                      <div><span className="font-semibold">Reference:</span> {selectedSubmission.reference}</div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">Status:</span>
                        <select
                          className="border rounded px-2 py-1 text-sm"
                          value={selectedSubmission.status}
                          onChange={e => handleModalStatusChange(e.target.value)}
                        >
                          <option value="approved">Approved</option>
                          <option value="pending">Pending</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                      <div><span className="font-semibold">Rejection Reason:</span> {selectedSubmission.rejectionReason || '-'}</div>
                      <div><span className="font-semibold">Submitted At:</span> {new Date(selectedSubmission.createdAt).toLocaleString()}</div>
                      <div><span className="font-semibold">Last Updated:</span> {new Date(selectedSubmission.updatedAt).toLocaleString()}</div>
                      {selectedSubmission.images && selectedSubmission.images.length > 0 && (
                        <div>
                          <span className="font-semibold">Images:</span>
                          <div className="flex gap-2 flex-wrap mt-2">
                            {selectedSubmission.images.map((img: string, idx: number) => (
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
                    <div className="flex justify-end gap-2 mt-6">
                      <button
                        className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                        onClick={() => setModalMode('edit')}
                      >
                        Edit
                      </button>
                      <button
                        className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
                        onClick={() => setModalOpen(false)}
                      >
                        Close
                      </button>
                    </div>
                  </>
                )
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