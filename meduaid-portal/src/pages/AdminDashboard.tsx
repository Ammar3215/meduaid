import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { subjectsStructure } from '../utils/subjectsStructure';
import QuestionViewModal from '../components/QuestionViewModal';
import Skeleton from '../components/Skeleton';
import AdminEditQuestionForm from '../components/AdminEditQuestionForm';
import OsceStationViewModal from '../components/OsceStationViewModal';

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

const AnimatedCounter = ({ value, className = '' }: { value: number, className?: string }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);
  useEffect(() => {
    let start = ref.current;
    let startTime: number | null = null;
    const duration = 800;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setDisplay(Math.floor(start + (value - start) * progress));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplay(value);
        ref.current = value;
      }
    };
    requestAnimationFrame(step);
    // eslint-disable-next-line
  }, [value]);
  return <div className={className}>{display.toLocaleString()}</div>;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const AdminDashboard: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [penalties, setPenalties] = useState<any[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  // Prepare data for dropdowns
  const allSubmissions = stats?.allSubmissions || [];

  // Card 1: Writer
  const [writerFilter, setWriterFilter] = useState('All');

  // Card 2: Subject
  const categories = Object.keys(subjectsStructure);
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const subjectsForSubjectCard = subjectCategoryFilter === 'All'
    ? Array.from(new Set(allSubmissions.map((q: any) => q.subject).filter(Boolean)))
    : Object.keys((subjectsStructure as Record<string, any>)[subjectCategoryFilter] || {});

  // Card 3: Topic
  const [topicCategoryFilter, setTopicCategoryFilter] = useState('All');
  const [topicSubjectFilter, setTopicSubjectFilter] = useState('All');
  const [topicFilter, setTopicFilter] = useState('All');
  const subjectsForTopicCard = topicCategoryFilter === 'All'
    ? Array.from(new Set(allSubmissions.map((q: any) => q.subject).filter(Boolean)))
    : Object.keys((subjectsStructure as Record<string, any>)[topicCategoryFilter] || {});
  // Topics for topic card are computed below
  const topicsWithQuestionsArr = (topicSubjectFilter === 'All'
    ? (topicCategoryFilter === 'All'
        ? allSubmissions
        : allSubmissions.filter((q: any) => q.category === topicCategoryFilter))
    : (topicCategoryFilter === 'All'
        ? allSubmissions.filter((q: any) => q.subject === topicSubjectFilter)
        : allSubmissions.filter((q: any) => q.category === topicCategoryFilter && q.subject === topicSubjectFilter)))
    .map((q: any) => q.topic)
    .filter(Boolean);
  const uniqueTopics = Array.from(new Set(topicsWithQuestionsArr));

  // Add state for editing and saving
  const [isEditing, setIsEditing] = useState(false);
  const [, setEditData] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/stats`, {
          credentials: 'include',
        });
        if (!response.ok) {
          return;
        }
        const data = await response.json();
        setStats(data);
      } catch {}
    };
    const fetchPenalties = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/penalties`, {
          credentials: 'include',
        });
        if (response.ok) {
          const data = await response.json();
          setPenalties(data.penalties || []);
        }
      } catch {}
    };
    if (isAuthenticated) {
      fetchStats();
      fetchPenalties();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (stats) {
      setLoading(false);
    }
  }, [stats]);

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

  // --- Card 2: Pie chart by subject ---
  const filteredBySubjectCategory = subjectCategoryFilter === 'All' ? allSubmissions : allSubmissions.filter((q: any) => q.category === subjectCategoryFilter);

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

  // Handle View button click
  const handleViewClick = async (id: string, type?: string) => {
    setModalLoading(true);
    setModalError('');
    setSelectedSubmission(null);
    setModalOpen(true);
    try {
      let res;
      if (type === 'OSCE') {
        res = await fetch(`${API_BASE_URL}/api/osce-stations/${id}`, {
          credentials: 'include',
        });
      } else {
        res = await fetch(`${API_BASE_URL}/api/submissions/${id}`, {
          credentials: 'include',
        });
      }
      if (!res.ok) {
        setModalError('Failed to fetch submission.');
        setModalLoading(false);
        return;
      }
      const data = await res.json();
      setSelectedSubmission({ ...data, type });
    } catch (err) {
      setModalError('Network error.');
    }
    setModalLoading(false);
  };

  // Handler for starting edit
  const handleEditClick = () => {
    setEditData({ ...selectedSubmission });
    setIsEditing(true);
  };

  return (
    <div className="w-full max-w-full px-2 sm:px-4">
      {/* Add spacing between menu and cards */}
      <div className="mb-6" />
      {/* Responsive grid for cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-8 w-full max-w-full mx-auto" style={{gridAutoRows: '1fr'}}>
        {/* Card 1: Total Questions by Writer (Dropdowns Above Counter, Compact Height, No Details) */}
        <div className="relative rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 flex flex-col items-stretch justify-start h-full" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1.5px solid #e3e6f0', minHeight: '320px'}}>
          <div className="absolute left-0 top-0 h-full w-2 bg-[#4B47B6]" />
          <div className="absolute inset-0 backdrop-blur-lg bg-[#f5f6fa]/95" />
          <div className="relative z-10 p-8 flex flex-col items-center justify-start w-full h-full">
            {/* Card Header */}
            <div className="flex items-center mb-6 w-full justify-center">
              <span className="inline-block w-2 h-6 rounded-full mr-3" style={{background: '#4B47B6'}}></span>
              <h2 className="text-2xl font-bold text-[#2d3748] tracking-tight">Total Questions by Writer</h2>
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              {/* Dropdown Filter (Writer) */}
              <div className="flex flex-col items-center mb-6 w-full max-w-xs animate-fade-in">
                <label className="text-xs text-gray-700 mb-1 self-start">Writer</label>
                <div className="relative w-full">
                  <select
                    className="appearance-none w-full px-4 py-2 rounded-lg border border-[#4B47B6] text-[#4B47B6] font-semibold focus:ring-2 focus:ring-[#4B47B6] focus:border-[#4B47B6] transition bg-white/90 shadow-sm hover:border-[#4B47B6] hover:shadow-md"
                    value={writerFilter}
                    onChange={e => setWriterFilter(e.target.value)}
                    style={{paddingRight: '2.5rem'}}
                  >
                    <option value="All">All</option>
                    {Array.from(new Set(allSubmissions.map((q: any) => q.writer?.name).filter(Boolean))).map((name) => (
                      <option key={name as string} value={name as string}>{name as string}</option>
                    ))}
                  </select>
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#4B47B6]">
                    <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#4B47B6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </span>
                </div>
              </div>
              {/* Animated Counter */}
              {loading ? (
                <Skeleton height={60} width="100%" />
              ) : (
                <AnimatedCounter value={filteredWriterPieData.reduce((sum: number, item: any) => sum + item.value, 0)} className="text-6xl font-extrabold text-[#4B47B6] mb-2 transition-all duration-500" />
              )}
              <span className="mt-1 mb-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center animate-fade-in">
                ↑ 5% this week
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Questions by Subject (Dropdowns Above Counter, Compact Height, No Details) */}
        <div className="relative rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 flex flex-col items-stretch justify-start h-full" style={{background: 'linear-gradient(135deg, #06d6a0 0%, #90ee90 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1.5px solid #e3e6f0', minHeight: '320px'}}>
          <div className="absolute left-0 top-0 h-full w-2 bg-[#06d6a0]" />
          <div className="absolute inset-0 backdrop-blur-lg bg-[#f5f6fa]/95" />
          <div className="relative z-10 p-8 flex flex-col items-center justify-start w-full h-full">
            {/* Card Header */}
            <div className="flex items-center mb-6 w-full justify-center">
              <span className="inline-block w-2 h-6 rounded-full mr-3" style={{background: '#06d6a0'}}></span>
              <h2 className="text-2xl font-bold text-[#2d3748] tracking-tight">Questions by Subject</h2>
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              {/* Dropdown Filters (Category, Subject) */}
              <div className="flex flex-wrap justify-center gap-4 mb-6 w-full max-w-2xl animate-fade-in">
                <div className="flex flex-col items-center w-1/2 min-w-[160px]">
                  <label className="text-xs text-gray-700 mb-1 self-start">Category</label>
                  <div className="relative w-full">
                    <select
                      className="appearance-none w-full px-4 py-2 rounded-lg border border-[#06d6a0] text-[#06d6a0] font-semibold focus:ring-2 focus:ring-[#06d6a0] focus:border-[#06d6a0] transition bg-white/90 shadow-sm hover:border-[#06d6a0] hover:shadow-md"
                      value={subjectCategoryFilter}
                      onChange={e => { setSubjectCategoryFilter(e.target.value); setSubjectFilter('All'); }}
                      style={{paddingRight: '2.5rem'}}
                    >
                      <option value="All">All</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#06d6a0]">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#06d6a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center w-1/2 min-w-[160px]">
                  <label className="text-xs text-gray-700 mb-1 self-start">Subject</label>
                  <div className="relative w-full">
                    <select
                      className="appearance-none w-full px-4 py-2 rounded-lg border border-[#06d6a0] text-[#06d6a0] font-semibold focus:ring-2 focus:ring-[#06d6a0] focus:border-[#06d6a0] transition bg-white/90 shadow-sm hover:border-[#06d6a0] hover:shadow-md"
                      value={subjectFilter}
                      onChange={e => setSubjectFilter(e.target.value)}
                      style={{paddingRight: '2.5rem'}}
                    >
                      <option value="All">All</option>
                      {subjectsForSubjectCard.map((subject) => (
                        <option key={subject as string} value={subject as string}>{subject as string}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#06d6a0]">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#06d6a0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
              </div>
              {/* Animated Counter */}
              {loading ? (
                <Skeleton height={60} width="100%" />
              ) : (
                <AnimatedCounter value={filteredBySubjectCategory.length} className="text-6xl font-extrabold text-[#06d6a0] mb-2 transition-all duration-500" />
              )}
              <span className="mt-1 mb-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold flex items-center animate-fade-in">
                ↑ 3% this week
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Questions by Topic (Dropdowns Above Counter, Compact Height, No Details) */}
        <div className="relative rounded-2xl shadow-2xl overflow-hidden group transition-all duration-300 flex flex-col items-stretch justify-start h-full" style={{background: 'linear-gradient(135deg, #ffd60a 0%, #ffef8a 100%)', boxShadow: '0 12px 40px rgba(0,0,0,0.12)', border: '1.5px solid #e3e6f0', minHeight: '320px'}}>
          <div className="absolute left-0 top-0 h-full w-2 bg-[#ffd60a]" />
          <div className="absolute inset-0 backdrop-blur-lg bg-[#f5f6fa]/95" />
          <div className="relative z-10 p-8 flex flex-col items-center justify-start w-full h-full">
            {/* Card Header */}
            <div className="flex items-center mb-6 w-full justify-center">
              <span className="inline-block w-2 h-6 rounded-full mr-3" style={{background: '#ffd60a'}}></span>
              <h2 className="text-2xl font-bold text-[#2d3748] tracking-tight">Questions by Topic</h2>
            </div>
            <div className="flex flex-col items-center justify-center w-full">
              {/* Dropdown Filters (Category, Subject, Topic) */}
              <div className="flex flex-wrap justify-center gap-4 mb-6 w-full max-w-3xl animate-fade-in">
                <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                  <label className="text-xs text-gray-700 mb-1 self-start">Category</label>
                  <div className="relative w-full">
                    <select
                      className="appearance-none w-full px-4 py-2 rounded-lg border border-[#ffd60a] text-[#ffd60a] font-semibold focus:ring-2 focus:ring-[#ffd60a] focus:border-[#ffd60a] transition bg-white/90 shadow-sm hover:border-[#ffd60a] hover:shadow-md"
                      value={topicCategoryFilter}
                      onChange={e => { setTopicCategoryFilter(e.target.value); setTopicSubjectFilter('All'); setTopicFilter('All'); }}
                      style={{paddingRight: '2.5rem'}}
                    >
                      <option value="All">All</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ffd60a]">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#ffd60a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                  <label className="text-xs text-gray-700 mb-1 self-start">Subject</label>
                  <div className="relative w-full">
                    <select
                      className="appearance-none w-full px-4 py-2 rounded-lg border border-[#ffd60a] text-[#ffd60a] font-semibold focus:ring-2 focus:ring-[#ffd60a] focus:border-[#ffd60a] transition bg-white/90 shadow-sm hover:border-[#ffd60a] hover:shadow-md"
                      value={topicSubjectFilter}
                      onChange={e => { setTopicSubjectFilter(e.target.value); setTopicFilter('All'); }}
                      style={{paddingRight: '2.5rem'}}
                    >
                      <option value="All">All</option>
                      {subjectsForTopicCard.map((subject) => (
                        <option key={subject as string} value={subject as string}>{subject as string}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ffd60a]">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#ffd60a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center w-1/3 min-w-[160px]">
                  <label className="text-xs text-gray-700 mb-1 self-start">Topic</label>
                  <div className="relative w-full">
                    <select
                      className="appearance-none w-full px-4 py-2 rounded-lg border border-[#ffd60a] text-[#ffd60a] font-semibold focus:ring-2 focus:ring-[#ffd60a] focus:border-[#ffd60a] transition bg-white/90 shadow-sm hover:border-[#ffd60a] hover:shadow-md"
                      value={topicFilter}
                      onChange={e => setTopicFilter(e.target.value)}
                      style={{paddingRight: '2.5rem'}}
                    >
                      <option value="All">All</option>
                      {uniqueTopics.map((topic) => (
                        <option key={topic as string} value={topic as string}>{topic as string}</option>
                      ))}
                    </select>
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#ffd60a]">
                      <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path d="M7 10l5 5 5-5" stroke="#ffd60a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </span>
                  </div>
                </div>
              </div>
              {/* Animated Counter */}
              {loading ? (
                <Skeleton height={60} width="100%" />
              ) : (
                <AnimatedCounter value={topicPieData.reduce((sum: number, item: any) => sum + item.value, 0)} className="text-6xl font-extrabold text-[#ffd60a] mb-2 transition-all duration-500" />
              )}
              <span className="mt-1 mb-2 px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold flex items-center animate-fade-in">
                ↑ 2% this week
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Submissions Table */}
      <div className="bg-white rounded-xl shadow-lg p-8 mb-8 transition hover:shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-primary text-left">Recent Submissions</h3>
        <div className="overflow-x-auto">
          {loading ? (
            <Skeleton height={200} />
          ) : (
            <table className="min-w-[600px] w-full text-left rounded-xl overflow-hidden bg-white text-sm sm:text-base">
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
                    <td className="px-4 py-2 w-[300px] max-w-[300px] truncate overflow-hidden whitespace-nowrap" title={q.type === 'OSCE' ? q.title : q.question}>{q.type === 'OSCE' ? q.title : q.question}</td>
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
                        onClick={() => handleViewClick(q._id, q.type)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal for viewing submission */}
        {modalOpen && selectedSubmission && (
          selectedSubmission.type === 'OSCE' ? (
            <OsceStationViewModal
              open={modalOpen}
              onClose={() => { setModalOpen(false); setIsEditing(false); setEditData(null); }}
              station={selectedSubmission}
              loading={modalLoading}
              error={modalError}
            />
          ) : (
            <QuestionViewModal
              open={modalOpen}
              onClose={() => { setModalOpen(false); setIsEditing(false); setEditData(null); }}
              question={selectedSubmission}
              loading={modalLoading}
              error={modalError}
            >
              {!isEditing && selectedSubmission && (
                <div className="flex flex-col gap-2">
                  <label className="font-semibold">Update Status:</label>
                  <select
                    className="border rounded px-2 py-1 text-gray-900"
                    value={selectedSubmission.status}
                    disabled={editLoading}
                    onChange={async e => {
                      const newStatus = e.target.value;
                      setEditLoading(true);
                      try {
                        const res = await fetch(`${API_BASE_URL}/api/submissions/${selectedSubmission._id}`, {
                          method: 'PATCH',
                          headers: {
                            'Content-Type': 'application/json',
                          },
                          credentials: 'include',
                          body: JSON.stringify({ status: newStatus }),
                        });
                        if (res.ok) {
                          const updated = await res.json();
                          setSelectedSubmission(updated);
                          setStats((prev: any) => {
                            if (!prev) return prev;
                            const updatedSubmissions = prev.allSubmissions.map((q: any) =>
                              q._id === updated._id ? { ...q, ...updated } : q
                            );
                            return { ...prev, allSubmissions: updatedSubmissions };
                          });
                        }
                      } finally {
                        setEditLoading(false);
                      }
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    className="px-4 py-2 rounded bg-primary text-white font-semibold hover:bg-primary-dark transition mt-2"
                    onClick={handleEditClick}
                  >
                    Edit
                  </button>
                </div>
              )}
              {isEditing && selectedSubmission && (
                <AdminEditQuestionForm
                  submission={selectedSubmission}
                  onClose={() => { setIsEditing(false); setEditData(null); }}
                  onSave={updated => {
                    setStats((prev: any) => {
                      if (!prev) return prev;
                      const updatedSubmissions = prev.allSubmissions.map((q: any) =>
                        q._id === updated._id ? { ...q, ...updated } : q
                      );
                      return { ...prev, allSubmissions: updatedSubmissions };
                    });
                    setSelectedSubmission(updated);
                    setIsEditing(false);
                    setEditData(null);
                  }}
                />
              )}
            </QuestionViewModal>
          )
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
    </div>
  );
};

export default AdminDashboard;