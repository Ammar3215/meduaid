import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { basicSciencesStructure } from '../utils/basicSciencesStructure';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#00bcd4', '#2196f3', '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#9c27b0'];

// Mock data for demonstration
const mockQuestions = [
  { id: 1, subject: 'Hematology', topic: 'Anatomy', status: 'Accepted', question: 'Sample question 1', submittedAt: '2024-06-28T10:30:00Z' },
  { id: 2, subject: 'Hematology', topic: 'Physiology', status: 'Rejected', question: 'Sample question 2', submittedAt: '2024-06-28T11:00:00Z', reason: 'Not enough detail' },
  { id: 3, subject: 'Cardiovascular', topic: 'Anatomy', status: 'Accepted', question: 'Sample question 3', submittedAt: '2024-06-28T12:00:00Z' },
];
const mockPenalties = [
  { reason: 'Late submission', date: '2024-06-01', severity: 'Medium' },
];

const subjects = Object.keys(basicSciencesStructure);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  // Card 1: Pie chart for submitted questions filtered by subject/topic
  const [selectedSubject, setSelectedSubject] = useState(subjects[0] || '');
  const topics = selectedSubject ? basicSciencesStructure[selectedSubject as keyof typeof basicSciencesStructure] : [];
  const [selectedTopic, setSelectedTopic] = useState('All');
  const filteredQuestions = mockQuestions.filter(q => q.subject === selectedSubject && (selectedTopic === 'All' || q.topic === selectedTopic));
  const pieData = topics.map((topic: string, idx: number) => ({
    name: topic,
    value: mockQuestions.filter(q => q.subject === selectedSubject && q.topic === topic).length,
    color: COLORS[idx % COLORS.length],
  }));
  const isEmptyPie = !Array.isArray(pieData) || pieData.length === 0 || pieData.every((d: any) => d.value === 0);

  // Card 2: Rejected questions by admin
  const rejectedQuestions = mockQuestions.filter(q => q.status === 'Rejected');
  const isEmptyRejected = rejectedQuestions.length === 0;

  // Card 3: Penalties applied on the writer
  const isEmptyPenalties = mockPenalties.length === 0;

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full mt-8">
        {/* Card 1: Pie chart for submitted questions */}
        <div className="bg-gradient-to-tr from-primary to-accent rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2">Total Submitted Questions</div>
          <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
            <label className="font-medium text-sm">Subject:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={selectedSubject}
              onChange={e => {
                setSelectedSubject(e.target.value);
                setSelectedTopic('All');
              }}
            >
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
              {topics.map((topic: string) => (
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
              {rejectedQuestions.map(q => (
                <li key={q.id} className="border-b py-2 text-center">{q.subject} - {q.topic}: {q.question}</li>
              ))}
            </ul>
          )}
        </div>
        {/* Card 3: Penalties applied on the writer */}
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2 text-primary">Penalties</div>
          {isEmptyPenalties ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data to be displayed.</div>
          ) : (
            <ul className="w-full">
              {mockPenalties.map((p, i) => (
                <li key={i} className="border-b py-2 text-center">{p.reason} ({p.severity}) - {p.date}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6 w-full mt-8">
        <div className="text-lg font-medium mb-4 text-primary">Recently Submitted Questions</div>
        {mockQuestions.length === 0 ? (
          <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
        ) : (
          <>
            <table className="w-full text-left">
              <thead>
                <tr>
                  <th className="py-2">Timestamp</th>
                  <th>Subject</th>
                  <th>Topic</th>
                  <th>Status</th>
                  <th>Rejection Reason</th>
                </tr>
              </thead>
              <tbody>
                {mockQuestions
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .slice(0, 5)
                  .map((q) => (
                    <tr key={q.id} className="border-t">
                      <td className="py-2">{new Date(q.submittedAt).toLocaleString()}</td>
                      <td>{q.subject}</td>
                      <td>{q.topic}</td>
                      <td>{q.status}</td>
                      <td>{q.status === 'Rejected' ? q.reason || '-' : '-'}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
            <div className="flex justify-center mt-4">
              <button
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                onClick={() => navigate('/all-submissions')}
              >
                View All Submissions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard; 