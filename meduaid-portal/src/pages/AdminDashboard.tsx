import React, { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { basicSciencesStructure } from '../utils/basicSciencesStructure';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#00bcd4', '#2196f3', '#8bc34a', '#ffc107', '#607d8b', '#ff9800', '#9c27b0'];

// Placeholder for clinical sciences structure
const clinicalSciencesStructure = {};

// Mock data
const mockQuestions = [
  { id: 1, writer: 'Alice', question: 'What is the function of the liver?', subject: 'Anatomy', topic: 'Bones', submittedAt: '2024-06-28T10:30:00Z', resubmitted: false },
  { id: 2, writer: 'Bob', question: 'Describe the cardiac cycle.', subject: 'Physiology', topic: 'Cardiac', submittedAt: '2024-06-28T11:00:00Z', resubmitted: true },
  { id: 3, writer: 'Charlie', question: 'Explain the role of mitochondria.', subject: 'Physiology', topic: 'Renal', submittedAt: '2024-06-28T12:00:00Z', resubmitted: false },
  { id: 4, writer: 'Alice', question: 'What is arthritis?', subject: 'Pathology', topic: 'Joints', submittedAt: '2024-06-28T13:00:00Z', resubmitted: true },
];

const mockPenalties = [
  { writer: 'Bob', reason: 'Late submission', severity: 'Medium', date: '2024-06-27' },
  { writer: 'Alice', reason: 'Incorrect format', severity: 'Low', date: '2024-06-26' },
];

// Aggregate statistics
const questionsPerSubject = mockQuestions.reduce((acc, q) => {
  acc[q.subject] = (acc[q.subject] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
const questionsPerTopic = mockQuestions.reduce((acc, q) => {
  if (!acc[q.subject]) acc[q.subject] = {};
  acc[q.subject][q.topic] = (acc[q.subject][q.topic] || 0) + 1;
  return acc;
}, {} as Record<string, Record<string, number>>);

const recentSubmissions = mockQuestions
  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
  .slice(0, 5);

const recentPenalties = mockPenalties.slice(0, 5);

const resubmittedQuestions = mockQuestions.filter(q => q.resubmitted);

const questionsPerWriter = mockQuestions.reduce((acc, q) => {
  acc[q.writer] = (acc[q.writer] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

const writers = Array.from(new Set(mockQuestions.map(q => q.writer)));

const categories = ['Basic Sciences', 'Clinical Sciences'];
const structures: Record<string, Record<string, string[]>> = {
  'Basic Sciences': basicSciencesStructure,
  'Clinical Sciences': clinicalSciencesStructure,
};

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  // Card 1: Filter by writer
  const [selectedWriter, setSelectedWriter] = useState('All');
  const writerData = writers.map((writer: string, idx: number) => ({
    name: writer,
    value: mockQuestions.filter(q => q.writer === writer).length,
    color: COLORS[idx % COLORS.length],
  }));
  const filteredWriterData = selectedWriter === 'All' ? writerData : writerData.filter(w => w.name === selectedWriter);

  const isEmptyWriterData = !Array.isArray(filteredWriterData) || filteredWriterData.length === 0 || filteredWriterData.every((d: any) => d.value === 0);

  // Card 2: Filter by category and subject (independent state)
  const [subjectCategory, setSubjectCategory] = useState('Basic Sciences');
  const subjectList = Object.keys(structures[subjectCategory] || {});
  const [subjectCardSubject, setSubjectCardSubject] = useState(subjectList[0] || '');
  const subjectData = subjectList.map((subject: string, idx: number) => ({
    name: subject,
    value: mockQuestions.filter(q => q.subject === subject).length,
    color: COLORS[idx % COLORS.length],
  }));
  const filteredSubjectData = subjectCardSubject === 'All' ? subjectData : subjectData.filter(s => s.name === subjectCardSubject);

  const isEmptySubjectData = !Array.isArray(filteredSubjectData) || filteredSubjectData.length === 0 || filteredSubjectData.every((d: any) => d.value === 0);

  // Card 3: Filter by category, subject, and topic (independent state)
  const [topicCategory, setTopicCategory] = useState('Basic Sciences');
  const topicSubjectList = Object.keys(structures[topicCategory] || {});
  const [topicCardSubject, setTopicCardSubject] = useState(topicSubjectList[0] || '');
  const topicList = topicCardSubject ? (structures[topicCategory][topicCardSubject] || []) : [];
  const [topicCardTopic, setTopicCardTopic] = useState('All');
  const topicData = topicList.map((topic: string, idx: number) => ({
    name: topic,
    value: mockQuestions.filter(q => q.subject === topicCardSubject && q.topic === topic).length,
    color: COLORS[idx % COLORS.length],
  }));
  const filteredTopicData = topicCardTopic === 'All' ? topicData : topicData.filter((t: { name: string }) => t.name === topicCardTopic);

  const isEmptyTopicData = !Array.isArray(filteredTopicData) || filteredTopicData.length === 0 || filteredTopicData.every((d: any) => d.value === 0);

  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold mb-6 text-primary text-center">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 w-full">
        {/* Card 1: Total questions by writer */}
        <div className="bg-gradient-to-tr from-primary to-accent rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2">Total Questions by Writer</div>
          <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
            <label className="font-medium text-sm mr-2">Filter Writer:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={selectedWriter}
              onChange={e => setSelectedWriter(e.target.value)}
            >
              <option value="All">All</option>
              {writers.map((writer: string) => (
                <option key={writer} value={writer}>{writer}</option>
              ))}
            </select>
          </div>
          {isEmptyWriterData ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
          ) : Array.isArray(filteredWriterData) && filteredWriterData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredWriterData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {filteredWriterData.map((entry: any, index: number) => (
                    <Cell key={`cell-writer-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>
        {/* Card 2: Total questions by subject */}
        <div className="bg-gradient-to-tr from-primary/80 to-accent/80 rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2">Total Questions by Subject</div>
          <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
            <label className="font-medium text-sm">Category:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={subjectCategory}
              onChange={e => {
                setSubjectCategory(e.target.value);
                setSubjectCardSubject(Object.keys(structures[e.target.value] || {})[0] || '');
              }}
            >
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label className="font-medium text-sm ml-2">Subject:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={subjectCardSubject}
              onChange={e => setSubjectCardSubject(e.target.value)}
            >
              <option value="All">All</option>
              {subjectList.map((subject: string) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
          </div>
          {isEmptySubjectData ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
          ) : Array.isArray(filteredSubjectData) && filteredSubjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredSubjectData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {filteredSubjectData.map((entry: any, index: number) => (
                    <Cell key={`cell-subject-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>
        {/* Card 3: Total questions by topic */}
        <div className="bg-gradient-to-tr from-accent to-primary rounded-xl p-6 text-white shadow-lg flex flex-col items-center w-full">
          <div className="text-lg font-medium mb-2">Total Questions by Topic</div>
          <div className="flex flex-row flex-wrap justify-center items-center gap-2 mb-4 w-full">
            <label className="font-medium text-sm">Category:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={topicCategory}
              onChange={e => {
                setTopicCategory(e.target.value);
                setTopicCardSubject(Object.keys(structures[e.target.value] || {})[0] || '');
                setTopicCardTopic('All');
              }}
            >
              {categories.map((cat: string) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <label className="font-medium text-sm ml-2">Subject:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={topicCardSubject}
              onChange={e => {
                setTopicCardSubject(e.target.value);
                setTopicCardTopic('All');
              }}
            >
              <option value="All">All</option>
              {topicSubjectList.map((subject: string) => (
                <option key={subject} value={subject}>{subject}</option>
              ))}
            </select>
            <label className="font-medium text-sm ml-2">Topic:</label>
            <select
              className="w-32 md:w-40 border rounded px-2 py-1 text-black"
              value={topicCardTopic}
              onChange={e => setTopicCardTopic(e.target.value)}
            >
              <option value="All">All</option>
              {topicList.map((topic: string) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
          </div>
          {isEmptyTopicData ? (
            <div className="flex justify-center items-center min-h-[200px] text-center text-gray-300">No data available for the selected filter.</div>
          ) : Array.isArray(filteredTopicData) && filteredTopicData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={filteredTopicData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {filteredTopicData.map((entry: any, index: number) => (
                    <Cell key={`cell-topic-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : null}
        </div>
      </div>
      {/* Recent Submissions Table */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 w-full">
        <div className="font-semibold mb-2">Recent Submissions</div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Writer</th>
              <th>Question</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {recentSubmissions.map((q) => (
              <tr key={q.id} className="border-t">
                <td>{q.writer}</td>
                <td>{q.question}</td>
                <td>{q.subject}</td>
                <td>{q.topic}</td>
                <td>{new Date(q.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center mt-4">
          <button
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
            onClick={() => navigate('/admin/all-submissions')}
          >
            View All Submissions
          </button>
        </div>
      </div>
      {/* Recent Penalties */}
      <div className="bg-white rounded-xl shadow p-6 mb-8 w-full">
        <div className="font-semibold mb-2">Recent Penalties</div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Writer</th>
              <th>Reason</th>
              <th>Severity</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {recentPenalties.map((p, i) => (
              <tr key={i} className="border-t">
                <td>{p.writer}</td>
                <td>{p.reason}</td>
                <td>{p.severity}</td>
                <td>{p.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Resubmitted Questions */}
      <div className="bg-white rounded-xl shadow p-6 w-full">
        <div className="font-semibold mb-2">Resubmitted Questions</div>
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Writer</th>
              <th>Question</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Date of Resubmission</th>
            </tr>
          </thead>
          <tbody>
            {resubmittedQuestions.length === 0 ? (
              <tr><td colSpan={5} className="text-gray-500">No resubmitted questions.</td></tr>
            ) : resubmittedQuestions.map((q) => (
              <tr key={q.id} className="border-t">
                <td>{q.writer}</td>
                <td>{q.question}</td>
                <td>{q.subject}</td>
                <td>{q.topic}</td>
                <td>{new Date(q.submittedAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard; 