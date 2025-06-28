import React from 'react';
// You may want to import mockQuestions from a shared location in a real app
const mockQuestions = [
  { id: 1, subject: 'Hematology', topic: 'Anatomy', status: 'Accepted', question: 'Sample question 1', submittedAt: '2024-06-28T10:30:00Z' },
  { id: 2, subject: 'Hematology', topic: 'Physiology', status: 'Rejected', question: 'Sample question 2', submittedAt: '2024-06-28T11:00:00Z', reason: 'Not enough detail' },
  { id: 3, subject: 'Cardiovascular', topic: 'Anatomy', status: 'Accepted', question: 'Sample question 3', submittedAt: '2024-06-28T12:00:00Z' },
];

const AllSubmissions: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">All Submissions</h2>
      {mockQuestions.length === 0 ? (
        <div className="flex justify-center items-center min-h-[120px] text-center text-gray-300">No data to be displayed.</div>
      ) : (
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
      )}
    </div>
  );
};

export default AllSubmissions; 