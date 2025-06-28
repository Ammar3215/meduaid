import React, { useState } from 'react';
import { basicSciencesStructure } from '../utils/basicSciencesStructure';

const mockQuestions = [
  { id: 1, writer: 'Alice', subject: 'Hematology', topic: 'Anatomy', status: 'Accepted', question: 'Sample question 1', submittedAt: '2024-06-28T10:30:00Z' },
  { id: 2, writer: 'Bob', subject: 'Hematology', topic: 'Physiology', status: 'Rejected', question: 'Sample question 2', submittedAt: '2024-06-28T11:00:00Z', reason: 'Not enough detail' },
  { id: 3, writer: 'Charlie', subject: 'Cardiovascular', topic: 'Anatomy', status: 'Under Review', question: 'Sample question 3', submittedAt: '2024-06-28T12:00:00Z' },
];
const mockWriters = ['Alice', 'Bob', 'Charlie'];
const categories = ['Basic Sciences'];

const AllAdminSubmissions: React.FC = () => {
  const [category, setCategory] = useState('Basic Sciences');
  const subjects = Object.keys(basicSciencesStructure);
  const [subject, setSubject] = useState('All');
  const topics = subject !== 'All' ? basicSciencesStructure[subject as keyof typeof basicSciencesStructure] : [];
  const [topic, setTopic] = useState('All');
  const [writer, setWriter] = useState('All');
  const [date, setDate] = useState('');
  const [questions, setQuestions] = useState(mockQuestions);

  const handleStatusChange = (id: number, newStatus: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: newStatus, reason: newStatus === 'Rejected' ? q.reason : undefined } : q));
  };
  const handleReasonChange = (id: number, reason: string) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, reason } : q));
  };

  const filtered = questions.filter(q =>
    (category === 'All' || category === 'Basic Sciences') &&
    (subject === 'All' || q.subject === subject) &&
    (topic === 'All' || q.topic === topic) &&
    (writer === 'All' || q.writer === writer) &&
    (!date || q.submittedAt.startsWith(date))
  );

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">All Submissions</h2>
      <div className="flex flex-wrap gap-4 mb-6 justify-center">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select className="border rounded px-2 py-1" value={category} onChange={e => setCategory(e.target.value)}>
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
            {topics.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Writer</label>
          <select className="border rounded px-2 py-1" value={writer} onChange={e => setWriter(e.target.value)}>
            <option value="All">All</option>
            {mockWriters.map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Date</label>
          <input type="date" className="border rounded px-2 py-1" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      {filtered.length === 0 ? (
        <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
      ) : (
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Timestamp</th>
              <th>Writer</th>
              <th>Subject</th>
              <th>Topic</th>
              <th>Status</th>
              <th>Rejection Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered
              .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
              .map((q) => (
                <tr key={q.id} className="border-t align-top">
                  <td className="py-2">{new Date(q.submittedAt).toLocaleString()}</td>
                  <td>{q.writer}</td>
                  <td>{q.subject}</td>
                  <td>{q.topic}</td>
                  <td>
                    <select
                      className="border rounded px-2 py-1"
                      value={q.status}
                      onChange={e => handleStatusChange(q.id, e.target.value)}
                    >
                      <option value="Accepted">Accepted</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Under Review">Under Review</option>
                    </select>
                  </td>
                  <td>
                    {q.status === 'Rejected' ? (
                      <input
                        type="text"
                        className="border rounded px-2 py-1 w-full"
                        value={q.reason || ''}
                        onChange={e => handleReasonChange(q.id, e.target.value)}
                        placeholder="Enter reason"
                      />
                    ) : '-'}
                  </td>
                  <td>
                    {/* Placeholder for future actions */}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AllAdminSubmissions; 