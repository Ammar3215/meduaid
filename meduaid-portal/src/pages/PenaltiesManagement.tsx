import React, { useState } from 'react';

const mockWriters = [
  { id: 1, name: 'Alice' },
  { id: 2, name: 'Bob' },
  { id: 3, name: 'Charlie' },
];

interface Penalty {
  writer: string;
  reason: string;
  severity: string;
  date: string;
}

const PenaltiesManagement: React.FC = () => {
  const [penaltyWriter, setPenaltyWriter] = useState('');
  const [penaltyReason, setPenaltyReason] = useState('');
  const [penaltySeverity, setPenaltySeverity] = useState('Low');
  const [penaltyHistory, setPenaltyHistory] = useState<Penalty[]>([]);

  const handlePenalty = () => {
    if (penaltyWriter && penaltyReason) {
      setPenaltyHistory((prev) => [
        ...prev,
        { writer: penaltyWriter, reason: penaltyReason, severity: penaltySeverity, date: new Date().toISOString().slice(0, 10) },
      ]);
      setPenaltyWriter('');
      setPenaltyReason('');
      setPenaltySeverity('Low');
    }
  };

  const removePenalty = (index: number) => {
    setPenaltyHistory((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Penalties Management</h2>
      <div className="bg-white rounded-xl shadow p-6 mb-8 w-full">
        <div className="font-semibold mb-2">Apply Penalty</div>
        <div className="flex flex-wrap gap-4 mb-4">
          <select value={penaltyWriter} onChange={e => setPenaltyWriter(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="">Select Writer</option>
            {mockWriters.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
          </select>
          <input
            type="text"
            placeholder="Reason"
            value={penaltyReason}
            onChange={e => setPenaltyReason(e.target.value)}
            className="px-3 py-2 border rounded-lg"
          />
          <select value={penaltySeverity} onChange={e => setPenaltySeverity(e.target.value)} className="px-3 py-2 border rounded-lg">
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>
          <button onClick={handlePenalty} className="bg-primary text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-dark">Apply</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6 w-full">
        <div className="font-semibold mb-2">Penalty History</div>
        <ul className="divide-y">
          {penaltyHistory.length === 0 ? <li className="text-gray-500">No penalties yet.</li> : penaltyHistory.map((p, i) => (
            <li key={i} className="py-2 flex flex-wrap justify-between items-center">
              <span>{p.writer}</span>
              <span className="text-sm text-gray-500">{p.date}</span>
              <span className="ml-2 px-2 py-1 rounded bg-primary/10 text-primary text-xs font-semibold">{p.severity}</span>
              <span className="ml-2 text-red-600 text-xs">{p.reason}</span>
              <button onClick={() => removePenalty(i)} className="ml-4 bg-red-500 text-white px-2 py-1 rounded text-xs">Remove</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PenaltiesManagement; 