import React, { useState } from 'react';

const mockQuestions = [
  {
    id: 1,
    writer: 'Alice',
    question: 'What is the function of the liver?',
    choices: ['A', 'B', 'C', 'D', 'E'],
    explanations: ['E1', 'E2', 'E3', 'E4', 'E5'],
    reference: 'Ref1',
    status: 'Under Review',
    reason: '',
  },
  {
    id: 2,
    writer: 'Bob',
    question: 'Describe the cardiac cycle.',
    choices: ['A', 'B', 'C', 'D', 'E'],
    explanations: ['E1', 'E2', 'E3', 'E4', 'E5'],
    reference: 'Ref2',
    status: 'Under Review',
    reason: '',
  },
];

const statusColors: Record<string, string> = {
  Accepted: 'bg-green-100 text-green-700',
  'Under Review': 'bg-yellow-100 text-yellow-700',
  Rejected: 'bg-red-100 text-red-700',
};

const QuestionReview: React.FC = () => {
  const [questions, setQuestions] = useState(mockQuestions);
  const [editReasonId, setEditReasonId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const setStatus = (id: number, status: string) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, status, reason: status === 'Rejected' ? q.reason : '' }
          : q
      )
    );
    if (status !== 'Rejected') setEditReasonId(null);
  };

  const saveRejectionReason = (id: number) => {
    setQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, status: 'Rejected', reason: rejectionReason } : q
      )
    );
    setEditReasonId(null);
    setRejectionReason('');
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Question Review</h2>
      <div className="bg-white rounded-xl shadow p-6 w-full">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th className="py-2">Writer</th>
              <th>Question</th>
              <th>Choices</th>
              <th>Explanations</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Actions</th>
              <th>Rejection Reason</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((q) => (
              <tr key={q.id} className="border-t align-top">
                <td className="py-2 font-semibold">{q.writer}</td>
                <td>{q.question}</td>
                <td>
                  <ul className="list-disc pl-4">
                    {q.choices.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </td>
                <td>
                  <ul className="list-disc pl-4">
                    {q.explanations.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </td>
                <td>{q.reference}</td>
                <td>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[q.status]}`}>{q.status}</span>
                </td>
                <td className="flex flex-col gap-2 min-w-[120px]">
                  <button onClick={() => setStatus(q.id, 'Accepted')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Accept</button>
                  <button onClick={() => { setEditReasonId(q.id); setRejectionReason(q.reason); }} className="bg-red-500 text-white px-2 py-1 rounded text-xs">Reject</button>
                  <button onClick={() => setStatus(q.id, 'Under Review')} className="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Under Review</button>
                </td>
                <td>
                  {q.status === 'Rejected' && editReasonId !== q.id && (
                    <span className="text-red-600 text-xs">{q.reason}</span>
                  )}
                  {editReasonId === q.id && (
                    <div className="flex flex-col gap-2">
                      <input
                        type="text"
                        value={rejectionReason}
                        onChange={e => setRejectionReason(e.target.value)}
                        className="px-2 py-1 border rounded"
                        placeholder="Enter rejection reason"
                      />
                      <button onClick={() => saveRejectionReason(q.id)} className="bg-primary text-white px-2 py-1 rounded text-xs">Save</button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default QuestionReview; 