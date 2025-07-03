import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

interface QuestionViewModalProps {
  open: boolean;
  onClose: () => void;
  question: any;
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const QuestionViewModal: React.FC<QuestionViewModalProps> = ({ open, onClose, question, loading, error, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-primary">Question Details</h3>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : question ? (
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div><span className="font-semibold">Writer:</span> {question.writer?.name || '-'}</div>
                <div><span className="font-semibold">Category:</span> {question.category}</div>
                <div><span className="font-semibold">Subject:</span> {question.subject}</div>
                <div><span className="font-semibold">Topic:</span> {question.topic}</div>
                {question.subtopic && (
                  <div><span className="font-semibold">Subtopic:</span> {question.subtopic}</div>
                )}
                <div><span className="font-semibold">Reference:</span> {question.reference}</div>
              </div>
              <div className="space-y-3">
                <div><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                  ${question.status === 'approved' ? 'bg-green-100 text-green-700' :
                    question.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'}`}>{question.status}</span></div>
                <div><span className="font-semibold">Rejection Reason:</span> {question.rejectionReason || '-'}</div>
                <div><span className="font-semibold">Submitted At:</span> {new Date(question.createdAt).toLocaleString()}</div>
                <div><span className="font-semibold">Last Updated:</span> {new Date(question.updatedAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Question:</span>
              <div className="mt-2 bg-gray-50 rounded p-4 border text-gray-800 text-base whitespace-pre-line">{question.question}</div>
            </div>
            <div>
              <span className="font-semibold">Choices & Explanations:</span>
              <table className="w-full mt-3 border rounded bg-gray-50">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Choice</th>
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Explanation</th>
                  </tr>
                </thead>
                <tbody>
                  {question.choices?.map((c: string, i: number) => {
                    const isCorrect = question.correctChoice === i;
                    return (
                      <tr key={i} className={`border-t ${isCorrect ? 'bg-green-50' : ''}`}>
                        <td className={`px-4 py-2 align-top text-base ${isCorrect ? 'text-green-700 font-bold' : ''}`}>
                          {isCorrect && <CheckCircleIcon className="inline w-5 h-5 mr-1 text-green-500 align-text-bottom" />} {c}
                        </td>
                        <td className={`px-4 py-2 align-top text-base ${isCorrect ? 'text-green-700 font-semibold' : ''}`}>{question.explanations?.[i]}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {question.images && question.images.length > 0 && (
              <div>
                <span className="font-semibold">Images:</span>
                <div className="flex gap-4 flex-wrap mt-3">
                  {question.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={`${API_BASE_URL}${img}`}
                      alt={`submission-img-${idx}`}
                      className="w-24 h-24 object-cover rounded border cursor-pointer"
                    />
                  ))}
                </div>
              </div>
            )}
            {children}
            <div className="flex justify-end mt-8">
              <button
                className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition text-lg"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default QuestionViewModal;