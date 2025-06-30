import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';

const COLORS = ['#00bcd4', '#2196f3', '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#9c27b0'];

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
    if (jwt) {
      fetchStats();
      fetchPenalties();
    }
  }, [jwt]);

  // Prepare data for dropdowns
  const allSubmissions = stats?.recentSubmissions || [];
  // --- Card 1: Pie chart by writer ---
  const allWriters = Array.from(new Set(allSubmissions.map((q: any) => q.writer?.name).filter(Boolean)));
  const writerPieDataRaw = allWriters.map((writer, idx) => ({
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

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-6 text-primary text-center">Admin Dashboard</h2>
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">Loading...</div>
      ) : error ? (
        <div className="flex justify-center items-center min-h-[200px] text-center text-red-500">{error}</div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
            {/* Card 1: Pie chart by writer */}
            <div className="bg-gradient-to-tr from-primary to-accent rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
              <div className="text-lg font-medium mb-2">Total Questions by Writer</div>
              <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
                <label className="font-medium text-sm mr-2">Writer:</label>
                <select
                  className="w-32 md:w-40 border rounded px-2 py-1 text-black"
                  value={writerFilter}
                  onChange={e => setWriterFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {allWriters.map((writer) => (
                    <option key={String(writer)} value={String(writer)}>{String(writer)}</option>
                  ))}
                </select>
              </div>
              {isEmptyWriterPie ? (
                <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={filteredWriterPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {filteredWriterPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-writer-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Card 2: Pie chart by subject */}
            <div className="bg-gradient-to-tr from-primary/80 to-accent/80 rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
              <div className="text-lg font-medium mb-2">Questions by Subject</div>
              <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
                <label className="font-medium text-sm mr-2">Category:</label>
                <select
                  className="w-32 md:w-40 border rounded px-2 py-1 text-black"
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
                <label className="font-medium text-sm ml-2">Subject:</label>
                <select
                  className="w-32 md:w-40 border rounded px-2 py-1 text-black"
                  value={subjectFilter}
                  onChange={e => setSubjectFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {subjectsForSubjectCard.map((subject) => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
              {isEmptySubjectPie ? (
                <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={subjectPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {subjectPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-subject-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Card 3: Pie chart by topic */}
            <div className="bg-gradient-to-tr from-accent to-primary rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
              <div className="text-lg font-medium mb-2">Questions by Topic</div>
              <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
                <label className="font-medium text-sm mr-2">Category:</label>
                <select
                  className="w-32 md:w-40 border rounded px-2 py-1 text-black"
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
                <label className="font-medium text-sm ml-2">Subject:</label>
                <select
                  className="w-32 md:w-40 border rounded px-2 py-1 text-black"
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
                <label className="font-medium text-sm ml-2">Topic:</label>
                <select
                  className="w-32 md:w-40 border rounded px-2 py-1 text-black"
                  value={topicFilter}
                  onChange={e => setTopicFilter(e.target.value)}
                >
                  <option value="All">All</option>
                  {topicsWithQuestions.map((topic: string) => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>
              {isEmptyTopicPie ? (
                <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={topicPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                    >
                      {topicPieData.map((entry: any, index: number) => (
                        <Cell key={`cell-topic-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          {/* Recent Submissions Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-primary">Recent Submissions</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-2 w-[160px]">Timestamp</th>
                    <th className="px-4 py-2 w-[160px]">Writer</th>
                    <th className="px-4 py-2 w-[300px]">Question</th>
                    <th className="px-4 py-2 w-[160px]">Subject</th>
                    <th className="px-4 py-2 w-[160px]">Topic</th>
                    <th className="px-4 py-2 w-[100px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allSubmissions.slice(0, 5).map((q: any) => (
                    <tr key={q._id} className="border-t">
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{new Date(q.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{q.writer?.name || '-'}</td>
                      <td className="px-4 py-2 w-[300px] max-w-[300px] truncate overflow-hidden whitespace-nowrap" title={q.question}>{q.question}</td>
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{q.subject}</td>
                      <td className="px-4 py-2 w-[160px] whitespace-nowrap">{q.topic}</td>
                      <td className="px-4 py-2 w-[100px]">
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
                      <div><span className="font-semibold">Status:</span> {selectedSubmission.status}</div>
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
          </div>
          {/* Recent Penalties Table */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h3 className="text-xl font-bold mb-4 text-primary">Recent Penalties</h3>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Timestamp</th>
                  <th>Writer</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {penalties.length === 0 ? (
                  <tr><td colSpan={3} className="text-center text-gray-400">No recent penalties.</td></tr>
                ) : (
                  penalties.map((p: any) => (
                    <tr key={p._id} className="border-t">
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