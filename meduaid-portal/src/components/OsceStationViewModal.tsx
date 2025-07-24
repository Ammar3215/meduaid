import React from 'react';

interface OsceStationViewModalProps {
  open: boolean;
  onClose: () => void;
  station: any;
  loading?: boolean;
  error?: string;
  children?: React.ReactNode;
}

const OsceStationViewModal: React.FC<OsceStationViewModalProps> = ({ open, onClose, station, loading, error, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40" style={{ colorScheme: 'light' }}>
      <div className="bg-white rounded-xl shadow-lg p-10 w-full max-w-4xl relative max-h-[90vh] overflow-y-auto text-gray-900">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold"
          onClick={onClose}
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-primary">OSCE Station Details</h3>
        {loading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : error ? (
          <div className="text-center text-red-500">{error}</div>
        ) : station ? (
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div><span className="font-semibold">Writer:</span> {station.writer?.name || '-'}</div>
                <div><span className="font-semibold">Category:</span> {station.category}</div>
                <div><span className="font-semibold">Subject:</span> {station.subject}</div>
                <div><span className="font-semibold">Topic:</span> {station.topic}</div>
                {station.subtopic && (
                  <div><span className="font-semibold">Subtopic:</span> {station.subtopic}</div>
                )}
                <div><span className="font-semibold">Type:</span> {station.type}</div>
              </div>
              <div className="space-y-3">
                <div><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                  ${station.status === 'approved' ? 'bg-green-100 text-green-700' :
                    station.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'}`}>{station.status}</span></div>
                <div><span className="font-semibold">Submitted At:</span> {new Date(station.createdAt).toLocaleString()}</div>
                <div><span className="font-semibold">Last Updated:</span> {new Date(station.updatedAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Title:</span>
              <div className="mt-2 bg-gray-50 rounded p-4 border text-gray-800 text-base whitespace-pre-line">{station.title}</div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Case Description:</span>
              <div className="mt-2 bg-gray-50 rounded p-4 border text-gray-800 text-base whitespace-pre-line">{station.caseDescription}</div>
            </div>
            {station.historySections && (
              <div>
                <span className="font-semibold">History Sections:</span>
                <ul className="list-disc ml-6">
                  {Object.entries(station.historySections).map(([k, v]: any) => (
                    <li key={k}><b>{k}:</b> {v}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="font-semibold">Marking Scheme:</span>
              <ul className="list-disc ml-6">
                {station.markingScheme?.map((section: any, idx: number) => (
                  <li key={idx}><b>{section.section}:</b>
                    <ul className="list-decimal ml-4">
                      {section.items.map((item: any, i: number) => (
                        <li key={i}>{item.desc} ({item.score} mark{item.score !== 1 ? 's' : ''})</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <span className="font-semibold">Follow-up Questions:</span>
              <ul className="list-decimal ml-6">
                {station.followUps?.map((fq: any, idx: number) => (
                  <li key={idx}><b>Q:</b> {fq.question}<br /><b>A:</b> {fq.answer}</li>
                ))}
              </ul>
            </div>
            {station.images && station.images.length > 0 && (
              <div>
                <span className="font-semibold">Images:</span>
                <div className="flex gap-4 flex-wrap mt-3">
                  {station.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`osce-img-${idx}`}
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

export default OsceStationViewModal; 