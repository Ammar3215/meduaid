import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';

const COLORS = [
  '#4B47B6', // deep purple
  '#00bcd4', // cyan
  '#8bc34a', // light green
  '#ffc107', // amber
  '#ff7043', // orange
  '#607d8b', // blue grey
  '#f44336', // red
  '#3F51B5', // blue
  '#009688', // teal
  '#FFD600', // yellow
];

// Add Writer type
interface Writer {
  _id: string;
  name: string;
  email: string;
}

const AdminDashboard: React.FC = () => {
  const { jwt } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [penalties, setPenalties] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);

  // --- Independent filter state for each card ---
  // Card 1: Writer
  const [writerFilter, setWriterFilter] = useState('All');
  // Card 2: Subject
  const categories = Object.keys(subjectsStructure);
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState(categories[0]);
  const subjectsForSubjectCard = Object.keys((subjectsStructure as Record<string, any>)[subjectCategoryFilter] || {});
  const [subjectFilter, setSubjectFilter] = useState('All');
  // Card 3: Topic
  const [topicCategoryFilter, setTopicCategoryFilter] = useState(categories[0]);
  const subjectsForTopicCard = Object.keys((subjectsStructure as Record<string, any>)[topicCategoryFilter] || {});
  const [topicSubjectFilter, setTopicSubjectFilter] = useState('All');
  // Topics for topic card are computed below
  const [topicFilter, setTopicFilter] = useState('All');

  // Add state for editing and saving
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  const [allWritersList, setAllWritersList] = useState<Writer[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:5050/api/admin/stats', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!response.ok) {
          setError('Failed to fetch stats');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setStats(data);
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    const fetchPenalties = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/admin/penalties', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPenalties(data.penalties || []);
        }
      } catch {}
    };
    // Fetch all writers for the filter
    const fetchWriters = async () => {
      try {
        const res = await fetch('http://localhost:5050/api/admin/writers', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          const data = await res.json();
          setAllWritersList(data);
        }
      } catch {}
    };
    if (jwt) {
      fetchStats();
      fetchPenalties();
      fetchWriters();
    }
  }, [jwt]);

  // Prepare data for dropdowns
  const allSubmissions = stats?.recentSubmissions || [];
  // --- Card 1: Pie chart by writer ---
  // Only show writers who have submissions in the current data for the chart
  const writersWithSubmissions = Array.from(new Set(allSubmissions.map((q: any) => q.writer?.name).filter(Boolean)));
  const writerPieDataRaw = writersWithSubmissions.map((writer, idx) => ({
    name: writer,
    value: allSubmissions.filter((q: any) => q.writer?.name === writer).length,
    color: COLORS[idx % COLORS.length],
  }));
  const filteredWriterPieData = writerFilter === 'All'
    ? writerPieDataRaw
    : writerPieDataRaw.filter((d) => d.name === writerFilter);
  const isEmptyWriterPie = !Array.isArray(filteredWriterPieData) || filteredWriterPieData.length === 0 || filteredWriterPieData.every((d: any) => d.value === 0);

  // --- Card 2: Pie chart by subject ---
  const filteredBySubjectCategory = subjectCategoryFilter === 'All' ? allSubmissions : allSubmissions.filter((q: any) => q.category === subjectCategoryFilter);
  const subjectsForSubjectPie = Array.from(new Set(filteredBySubjectCategory.map((q: any) => q.subject).filter(Boolean)));
  const subjectPieDataRaw = subjectsForSubjectPie.map((subject, idx) => ({
    name: subject,
    value: filteredBySubjectCategory.filter((q: any) => q.subject === subject).length,
    color: COLORS[idx % COLORS.length],
  }));
  const subjectPieData = subjectFilter === 'All'
    ? subjectPieDataRaw
    : subjectPieDataRaw.filter((d) => d.name === subjectFilter);
  const isEmptySubjectPie = !Array.isArray(subjectPieData) || subjectPieData.length === 0 || subjectPieData.every((d: any) => d.value === 0);

  // --- Card 3: Pie chart by topic ---
  const filteredByTopicCategory = topicCategoryFilter === 'All' ? allSubmissions : allSubmissions.filter((q: any) => q.category === topicCategoryFilter);
  const filteredByTopicSubject = topicSubjectFilter === 'All' ? filteredByTopicCategory : filteredByTopicCategory.filter((q: any) => q.subject === topicSubjectFilter);
  const topicCounts = filteredByTopicSubject.reduce((acc: Record<string, number>, q: any) => {
    acc[q.topic] = (acc[q.topic] || 0) + 1;
    return acc;
  }, {});
  const topicsWithQuestions = Object.keys(topicCounts);
  let topicPieData = topicsWithQuestions.map((topic, idx) => ({
    name: topic,
    value: topicCounts[topic],
    color: COLORS[idx % COLORS.length],
  }));
  if (topicFilter !== 'All') {
    topicPieData = topicPieData.filter((d) => d.name === topicFilter);
  }
  const isEmptyTopicPie = !Array.isArray(topicPieData) || topicPieData.length === 0;

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

  // Handler for starting edit
  const handleEditClick = () => {
    setEditData({ ...selectedSubmission });
    setIsEditing(true);
    setEditError('');
  };

  // Handler for canceling edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setEditError('');
  };

  // Handler for saving edit
  const handleSaveEdit = async () => {
    setEditLoading(true);
    setEditError('');
    try {
      const res = await fetch(`http://localhost:5050/api/submissions/${selectedSubmission._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(editData),
      });
      if (!res.ok) {
        setEditError('Failed to save changes.');
        setEditLoading(false);
        return;
      }
      const updated = await res.json();
      setSelectedSubmission(updated);
      setIsEditing(false);
      setEditData(null);
      // Update the dashboard table immediately
      setStats((prev: any) => {
        if (!prev) return prev;
        const updatedSubmissions = prev.recentSubmissions.map((q: any) =>
          q._id === updated._id ? { ...q, ...updated } : q
        );
        return { ...prev, recentSubmissions: updatedSubmissions };
      });
    } catch (err) {
      setEditError('Network error.');
    }
    setEditLoading(false);
  };

  return (
    <div className="w-full">
      {/* Add spacing between menu and cards */}
      <div className="mb-6" />
      {loading ? (
        // Skeleton loader for cards
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full animate-pulse">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-lg flex flex-col items-center w-full min-h-[400px] p-8">
              <div className="h-8 w-2/3 bg-gray-200 rounded mb-6"></div>
              <div className="h-48 w-full bg-gray-100 rounded mb-4"></div>
              <div className="h-6 w-1/2 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[200px] text-center text-red-500">{error}</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full min-h-[420px]">
            {/* Card 1: Pie chart by writer */}
            <div className="bg-white rounded-xl shadow-lg flex flex-col items-stretch w-full min-h-[400px] transition hover:shadow-xl border-t-8 border-primary group">
              <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                <div className="text-xl font-bold text-primary mb-1 tracking-tight">Total Questions by Writer</div>
              </div>
              <div className="flex flex-row flex-wrap justify-center items-center gap-2 mt-4 mb-4 px-6">
                <label className="font-semibold text-sm text-gray-700">Writer:</label>
                <select
                  className="w-32 md:w-40 border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={writerFilter}
                  onChange={e => setWriterFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {allWritersList.map((writer) => (
                    <option key={writer._id} value={writer.name}>{writer.name} ({writer.email})</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center px-6 pb-6">
                {isEmptyWriterPie ? (
                  <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={filteredWriterPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ percent = 0 }) => (
                          <span className="text-xs font-bold text-gray-700">{`${(percent * 100).toFixed(0)}%`}</span>
                        )}
                      >
                        {filteredWriterPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-writer-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 14, fontWeight: 500 }} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 14, marginTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            {/* Card 2: Pie chart by subject */}
            <div className="bg-white rounded-xl shadow-lg flex flex-col items-stretch w-full min-h-[400px] transition hover:shadow-xl border-t-8 border-accent group">
              <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                <div className="text-xl font-bold text-accent mb-1 tracking-tight">Questions by Subject</div>
              </div>
              <div className="flex flex-row flex-wrap justify-center items-center gap-2 mt-4 mb-4 px-6">
                <label className="font-semibold text-sm text-gray-700">Category:</label>
                <select
                  className="w-32 md:w-40 border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-accent focus:border-accent transition"
                  value={subjectCategoryFilter}
                  onChange={e => {
                    setSubjectCategoryFilter(e.target.value);
                    setSubjectFilter('All');
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <label className="font-semibold text-sm text-gray-700 ml-2">Subject:</label>
                <select
                  className="w-32 md:w-40 border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-accent focus:border-accent transition"
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {subjectsForSubjectCard.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center px-6 pb-6">
                {isEmptySubjectPie ? (
                  <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={subjectPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ percent = 0 }) => (
                          <span className="text-xs font-bold text-gray-700">{`${(percent * 100).toFixed(0)}%`}</span>
                        )}
                      >
                        {subjectPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-subject-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 14, fontWeight: 500 }} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 14, marginTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            {/* Card 3: Pie chart by topic */}
            <div className="bg-white rounded-xl shadow-lg flex flex-col items-stretch w-full min-h-[400px] transition hover:shadow-xl border-t-8 border-primary group">
              <div className="px-6 pt-6 pb-2 border-b border-gray-100">
                <div className="text-xl font-bold text-primary mb-1 tracking-tight">Questions by Topic</div>
              </div>
              <div className="flex flex-row flex-wrap justify-center items-center gap-2 mt-4 mb-4 px-6">
                <label className="font-semibold text-sm text-gray-700">Category:</label>
                <select
                  className="w-32 md:w-40 border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={topicCategoryFilter}
                  onChange={e => {
                    setTopicCategoryFilter(e.target.value);
                    setTopicSubjectFilter('All');
                    setTopicFilter('All');
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <label className="font-semibold text-sm text-gray-700 ml-2">Subject:</label>
                <select
                  className="w-32 md:w-40 border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={topicSubjectFilter}
                  onChange={e => {
                    setTopicSubjectFilter(e.target.value);
                    setTopicFilter('All');
                  }}
                >
                  <option value="All">All</option>
                  {subjectsForTopicCard.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
                <label className="font-semibold text-sm text-gray-700 ml-2">Topic:</label>
                <select
                  className="w-32 md:w-40 border border-gray-300 rounded px-2 py-1 text-gray-800 focus:ring-2 focus:ring-primary focus:border-primary transition"
                  value={topicFilter}
                  onChange={e => setTopicFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {topicsWithQuestions.map((topic: string) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              <div className="flex-1 flex flex-col justify-center items-center px-6 pb-6">
                {isEmptyTopicPie ? (
                  <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={topicPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ percent = 0 }) => (
                          <span className="text-xs font-bold text-gray-700">{`${(percent * 100).toFixed(0)}%`}</span>
                        )}
                      >
                        {topicPieData.map((entry: any, index: number) => (
                          <Cell key={`cell-topic-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ fontSize: 14, fontWeight: 500 }} />
                      <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 14, marginTop: 16 }} />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
          {/* Recent Submissions Table */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 transition hover:shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-primary text-left">Recent Submissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left text-base">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2 w-[160px] font-semibold text-gray-700">Timestamp</th>
                    <th className="px-4 py-2 w-[160px] font-semibold text-gray-700">Writer</th>
                    <th className="px-4 py-2 w-[300px] font-semibold text-gray-700">Question</th>
                    <th className="px-4 py-2 w-[160px] font-semibold text-gray-700">Subject</th>
                    <th className="px-4 py-2 w-[160px] font-semibold text-gray-700">Topic</th>
                    <th className="px-4 py-2 w-[100px] font-semibold text-gray-700">Status</th>
                    <th className="px-4 py-2 w-[100px] font-semibold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubmissions.slice(0, 5).map((q: any) => (
                    <tr key={q._id} className="border-t hover:bg-gray-50 transition">
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{new Date(q.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{q.writer?.name || '-'}</td>
                      <td className="px-4 py-2 w-[300px] max-w-[300px] truncate overflow-hidden whitespace-nowrap" title={q.question}>{q.question}</td>
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{q.subject}</td>
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{q.topic}</td>
                      <td className="px-4 py-2 w-[100px]">
                        {/* Status badge */}
                        <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                          ${q.status === 'approved' ? 'bg-green-100 text-green-700' :
                            q.status === 'rejected' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}
                        >
                          {q.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 w-[100px]">
                        <button
                          className="bg-primary text-white rounded px-3 py-1 hover:bg-primary-dark transition font-semibold"
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
            {/* Modal for viewing submission */}
            {modalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-lg relative max-h-[90vh] flex flex-col">
                  <button
                    className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
                    onClick={() => { setModalOpen(false); setIsEditing(false); setEditData(null); }}
                  >
                    &times;
                  </button>
                  <h3 className="text-2xl font-bold mb-4 text-primary">Question Details</h3>
                  <div className="overflow-y-auto flex-1 pr-2" style={{ maxHeight: '60vh' }}>
                    {modalLoading ? (
                      <div className="text-center text-gray-500">Loading...</div>
                    ) : modalError ? (
                      <div className="text-center text-red-500">{modalError}</div>
                    ) : selectedSubmission ? (
                      isEditing ? (
                        <form className="space-y-4 text-left" onSubmit={e => { e.preventDefault(); handleSaveEdit(); }}>
                          <div>
                            <label className="font-semibold block mb-1">Subject:</label>
                            <input type="text" className="w-full border rounded px-2 py-1" value={editData.subject} onChange={e => setEditData({ ...editData, subject: e.target.value })} required />
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Topic:</label>
                            <input type="text" className="w-full border rounded px-2 py-1" value={editData.topic} onChange={e => setEditData({ ...editData, topic: e.target.value })} required />
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Question:</label>
                            <textarea className="w-full border rounded px-2 py-1" value={editData.question} onChange={e => setEditData({ ...editData, question: e.target.value })} required rows={3} />
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Choices:</label>
                            {editData.choices?.map((c: string, i: number) => (
                              <div key={i} className="flex gap-2 mb-1">
                                <input type="text" className="flex-1 border rounded px-2 py-1" value={c} onChange={e => {
                                  const newChoices = [...editData.choices];
                                  newChoices[i] = e.target.value;
                                  setEditData({ ...editData, choices: newChoices });
                                }} required />
                                <button type="button" className="text-red-500 font-bold" onClick={() => {
                                  const newChoices = editData.choices.filter((_: any, idx: number) => idx !== i);
                                  setEditData({ ...editData, choices: newChoices });
                                }}>×</button>
                              </div>
                            ))}
                            <button type="button" className="text-primary font-semibold mt-1" onClick={() => setEditData({ ...editData, choices: [...(editData.choices || []), ''] })}>+ Add Choice</button>
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Explanations:</label>
                            {editData.explanations?.map((e: string, i: number) => (
                              <div key={i} className="flex gap-2 mb-1">
                                <input type="text" className="flex-1 border rounded px-2 py-1" value={e} onChange={ev => {
                                  const newExps = [...editData.explanations];
                                  newExps[i] = ev.target.value;
                                  setEditData({ ...editData, explanations: newExps });
                                }} required />
                                <button type="button" className="text-red-500 font-bold" onClick={() => {
                                  const newExps = editData.explanations.filter((_: any, idx: number) => idx !== i);
                                  setEditData({ ...editData, explanations: newExps });
                                }}>×</button>
                              </div>
                            ))}
                            <button type="button" className="text-primary font-semibold mt-1" onClick={() => setEditData({ ...editData, explanations: [...(editData.explanations || []), ''] })}>+ Add Explanation</button>
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Reference:</label>
                            <input type="text" className="w-full border rounded px-2 py-1" value={editData.reference} onChange={e => setEditData({ ...editData, reference: e.target.value })} />
                          </div>
                          <div>
                            <label className="font-semibold block mb-1">Rejection Reason:</label>
                            <input type="text" className="w-full border rounded px-2 py-1" value={editData.rejectionReason || ''} onChange={e => setEditData({ ...editData, rejectionReason: e.target.value })} />
                          </div>
                          {editError && <div className="text-red-500 text-sm">{editError}</div>}
                          <div className="flex justify-end gap-2 mt-4">
                            <button type="button" className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition" onClick={handleCancelEdit} disabled={editLoading}>Cancel</button>
                            <button type="submit" className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary-dark transition disabled:opacity-60" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
                          </div>
                        </form>
                      ) : (
                        <div className="space-y-2 text-left">
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
                          <div><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                            ${selectedSubmission.status === 'approved' ? 'bg-green-100 text-green-700' :
                              selectedSubmission.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'}`}>{selectedSubmission.status}</span></div>
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
                                    className="w-16 h-16 object-cover rounded border cursor-pointer hover:scale-110 transition"
                                    onClick={() => setFullImage(`http://localhost:5050${img}`)}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    ) : null}
                  </div>
                  <div className="flex justify-end gap-2 mt-6">
                    {!isEditing && (
                      <button
                        className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary-dark transition"
                        onClick={handleEditClick}
                      >
                        Edit
                      </button>
                    )}
                    {isEditing && (
                      <button
                        type="button"
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition"
                        onClick={handleCancelEdit}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                      onClick={() => { setModalOpen(false); setIsEditing(false); setEditData(null); }}
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
          </div>
          {/* Recent Penalties Table */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-8 transition hover:shadow-xl">
            <h3 className="text-2xl font-bold mb-6 text-accent text-left">Recent Penalties</h3>
            <table className="w-full text-left text-base">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-2 font-semibold text-gray-700">Timestamp</th>
                  <th className="py-2 font-semibold text-gray-700">Writer</th>
                  <th className="py-2 font-semibold text-gray-700">Reason</th>
                </tr>
              </thead>
              <tbody>
                {penalties.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400">No recent penalties.</td></tr>
                ) : (
                  penalties.map((p: any) => (
                    <tr key={p._id} className="border-t hover:bg-gray-50 transition">
                      <td className="py-2">{new Date(p.createdAt).toLocaleString()}</td>
                      <td>{p.writer?.name || '-'}</td>
                      <td>{p.reason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AdminDashboard; 