import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subjectsStructure } from '../utils/subjectsStructure';

const COLORS = ['#00bcd4', '#2196f3', '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#9c27b0'];

const Dashboard: React.FC = () => {
  const { jwt } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const categories = Object.keys(subjectsStructure);
  const [selectedCategory, setSelectedCategory] = useState(categories[0]);
  const subjects = Object.keys((subjectsStructure as Record<string, any>)[selectedCategory] || {});
  const [selectedSubject, setSelectedSubject] = useState('');
  const topics = selectedSubject
    ? (Array.isArray(((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject])
        ? ((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject]
        : Object.keys(((subjectsStructure as Record<string, any>)[selectedCategory] as Record<string, any>)[selectedSubject] || {}))
    : [];
  const [selectedTopic, setSelectedTopic] = useState('All');
  const [penalties, setPenalties] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch('http://localhost:5050/api/writer/stats', {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!response.ok) {
          setError('Failed to fetch stats');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setStats(data);
        // Set default subject for filtering
        if (data.recentSubmissions && data.recentSubmissions.length > 0) {
          setSelectedSubject(data.recentSubmissions[0].subject || '');
        }
      } catch {
        setError('Network error');
      }
      setLoading(false);
    };
    const fetchPenalties = async () => {
      try {
        const response = await fetch('http://localhost:5050/api/writer/penalties', {
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

  // Prepare data for charts
  const pieData = topics.map((topic: string, idx: number) => ({
    name: topic,
    value: (stats?.recentSubmissions || []).filter((q: any) => q.subject === selectedSubject && q.topic === topic).length,
    color: COLORS[idx % COLORS.length],
  }));
  const isEmptyPie = !Array.isArray(pieData) || pieData.length === 0 || pieData.every((d: any) => d.value === 0);

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full mt-8">
        {/* Card 1: Pie chart for submitted questions */}
        <div className="bg-gradient-to-tr from-primary to-accent rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2">Total Submitted Questions</div>
          <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
            <label className="font-medium text-sm">Category:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={selectedCategory}
              onChange={e => {
                setSelectedCategory(e.target.value);
                setSelectedSubject('');
                setSelectedTopic('All');
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label className="font-medium text-sm ml-2">Subject:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('All');
              }}
            >
              <option value="">Select Subject</option>
              {subjects.map((subject: string) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <label className="font-medium text-sm ml-2">Topic:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={selectedTopic}
              onChange={e => setSelectedTopic(e.target.value)}
            >
              <option value="All">All</option>
              {(topics as string[]).map((topic: string) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          {isEmptyPie ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry: any, index: number) => (
                    <Cell key={`cell-topic-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend wrapperStyle={{ marginTop: 32 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
        {/* Card 2: Rejected questions by admin */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2 text-primary">Rejected Questions</div>
          {isEmptyRejected ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <ul className="w-full">
              {rejectedQuestions.map((q: any) => (
                <li key={q._id} className="border-b py-2 text-center">{q.subject} - {q.topic}: {q.question || ''}</li>
              ))}
            </ul>
          )}
        </div>
        {/* Card 3: Penalties applied on the writer */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2 text-primary">Penalties</div>
          {penalties.length === 0 ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <ul className="w-full">
              {penalties.map((p: any) => (
                <li key={p._id} className="border-b py-2 text-center">
                  <span className="font-semibold">{p.reason}</span> - <span className="text-red-600">{p.points} points</span> <span className="text-gray-500">({new Date(p.createdAt).toLocaleString()})</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 w-full mt-8">
        <div className="text-lg font-medium mb-4 text-primary">Recently Submitted Questions</div>
        {loading ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">Loading...</div>
        ) : error ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-red-500">{error}</div>
        ) : (stats?.recentSubmissions?.length === 0) ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
        ) : (
          <>
            <div className="overflow-x-auto max-h-[400px]">
              <table className="min-w-full text-left">
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
                        <td>{q.status}</td>
                        <td>{q.status === 'rejected' ? q.rejectionReason || '-' : '-'}</td>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 