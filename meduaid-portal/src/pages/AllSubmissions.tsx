import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface Submission {
  _id: string;
  question: string;
  status: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  images?: string[];
}

const AllSubmissions: React.FC = () => {
  const { jwt } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [fullImage, setFullImage] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('http://localhost:5050/api/submissions', {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        });
        if (!res.ok) {
          throw new Error('Failed to fetch submissions');
        }
        const data = await res.json();
        setSubmissions(Array.isArray(data) ? data : data.submissions || []);
      } catch (err: any) {
        setError(err.message || 'Network error');
      }
      setLoading(false);
    };
    fetchSubmissions();
  }, [jwt]);

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
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">All My Submissions</h2>
      {loading ? (
        <div className="text-center">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : submissions.length === 0 ? (
        <div className="text-center text-gray-500">No submissions found.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-4 border">Question</th>
                <th className="py-2 px-4 border">Status</th>
                <th className="py-2 px-4 border">Rejection Reason</th>
                <th className="py-2 px-4 border">Submitted At</th>
                <th className="py-2 px-4 border">Last Updated</th>
                <th className="py-2 px-4 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map((sub) => (
                <tr key={sub._id} className="border-b">
                  <td className="py-2 px-4 border max-w-xs truncate" title={sub.question}>{sub.question}</td>
                  <td className="py-2 px-4 border capitalize">{sub.status}</td>
                  <td className="py-2 px-4 border text-red-600">{sub.status === 'rejected' ? sub.rejectionReason || '-' : '-'}</td>
                  <td className="py-2 px-4 border">{new Date(sub.createdAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border">{new Date(sub.updatedAt).toLocaleString()}</td>
                  <td className="py-2 px-4 border">
                    <button
                      className="bg-primary text-white px-3 py-1 rounded font-semibold hover:bg-primary-dark"
                      onClick={() => handleViewClick(sub._id)}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
    </div>
  );
};

export default AllSubmissions; 