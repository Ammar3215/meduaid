import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const mockRejected = [
  { id: 1, question: 'Explain the role of mitochondria.', reason: 'Not enough detail', choices: ['A', 'B', 'C', 'D', 'E'], explanations: ['E1', 'E2', 'E3', 'E4', 'E5'], reference: 'Ref1' },
];

type EditFormInputs = {
  question: string;
  choices: string[];
  explanations: string[];
  reference: string;
};

const EditRejectedQuestions: React.FC = () => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<EditFormInputs>({
    defaultValues: {
      choices: ['', '', '', '', ''],
      explanations: ['', '', '', '', ''],
    },
  });

  const startEdit = (q: typeof mockRejected[0]) => {
    setEditingId(q.id);
    reset({
      question: q.question,
      choices: q.choices,
      explanations: q.explanations,
      reference: q.reference,
    });
  };

  const onSubmit = async (data: EditFormInputs) => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 1500);
    setEditingId(null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Edit Rejected Questions</h2>
      {mockRejected.length === 0 ? (
        <div className="text-gray-500">No rejected questions.</div>
      ) : (
        <ul className="mb-6">
          {mockRejected.map((q) => (
            <li key={q.id} className="mb-4 p-4 rounded bg-red-50 border border-red-200">
              <div className="font-semibold mb-1">{q.question}</div>
              <div className="text-sm text-red-600 mb-2">Reason: {q.reason}</div>
              <button
                className="bg-primary text-white px-3 py-1 rounded font-semibold hover:bg-primary-dark"
                onClick={() => startEdit(q)}
              >
                Edit & Resubmit
              </button>
            </li>
          ))}
        </ul>
      )}
      {editingId && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block mb-1 font-medium">Question</label>
            <textarea {...register('question')} className="w-full px-4 py-2 border rounded-lg min-h-[80px]" />
          </div>
          <div>
            <label className="block mb-1 font-medium">Choices (A–E)</label>
            {Array.from({ length: 5 }).map((_, i) => (
              <input
                key={i}
                {...register(`choices.${i}` as const)}
                className="w-full px-4 py-2 border rounded-lg mb-2"
                placeholder={`Choice ${String.fromCharCode(65 + i)}`}
              />
            ))}
          </div>
          <div>
            <label className="block mb-1 font-medium">Explanations (A–E)</label>
            {Array.from({ length: 5 }).map((_, i) => (
              <input
                key={i}
                {...register(`explanations.${i}` as const)}
                className="w-full px-4 py-2 border rounded-lg mb-2"
                placeholder={`Explain Choice ${String.fromCharCode(65 + i)}`}
              />
            ))}
          </div>
          <div>
            <label className="block mb-1 font-medium">Reference</label>
            <input {...register('reference')} className="w-full px-4 py-2 border rounded-lg" />
          </div>
          <button
            type="submit"
            className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resubmitting...' : 'Resubmit'}
          </button>
          {submitted && <div className="text-green-600 text-center mt-2">Resubmitted!</div>}
        </form>
      )}
    </div>
  );
};

export default EditRejectedQuestions; 