import React, { useState } from 'react';
import OsceStationEditModal from './OsceStationEditModal';
import { useAuth } from '../context/AuthContext';
import { CheckCircleIcon, XCircleIcon, ClockIcon, TrashIcon } from '@heroicons/react/24/outline';
import { apiPatch, apiDelete } from '../utils/api';

interface OsceStationViewModalProps {
  open: boolean;
  onClose: () => void;
  station: any;
  loading?: boolean;
  error?: string;
  user?: any; // allow user prop
  onSave?: (updated: any) => void;
  onAction?: (type: 'success' | 'error' | 'info' | 'delete' | 'approve' | 'reject' | 'pending', message: string, itemId?: string) => void;
  children?: React.ReactNode;
}

const OsceStationViewModal: React.FC<OsceStationViewModalProps> = (props) => {
  const { open, onClose, station, loading, error, user: userProp, onSave, onAction, children } = props;
  const { user: contextUser } = useAuth();
  const user = userProp || contextUser;
  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');
  const [currentStation, setCurrentStation] = useState<any>(station);
  const [showRejectionReason, setShowRejectionReason] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionLoading] = useState(false);

  React.useEffect(() => {
    setCurrentStation(station);
  }, [station]);

  const handleEditSave = async (data: any) => {
    setEditLoading(true);
    setEditError('');
    try {
      let updated = await apiPatch(`/api/osce-stations/${station._id}`, data);
      setCurrentStation(updated);
      setEditOpen(false);
      if (onSave) onSave(updated);
    } catch (err: any) {
      setEditError(err.message || 'Network error');
    }
    setEditLoading(false);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this OSCE station? This action cannot be undone.')) {
      return;
    }
    // Starting delete operation
    setEditLoading(true);
    setEditError('');
    try {
      await apiDelete(`/api/osce-stations/${station._id}`);
      // Delete operation successful
      if (onAction) {
        onAction('delete', 'OSCE station deleted successfully', station._id);
      }
      onClose();
    } catch (err: any) {
      // Delete operation failed
      setEditError(err.message || 'Network error');
    }
    setEditLoading(false);
  };

  const handleStatusChange = async (newStatus: 'approved' | 'rejected' | 'pending', reason?: string) => {
    if (newStatus === 'rejected' && !showRejectionReason) {
      setShowRejectionReason(true);
      return;
    }
    setEditLoading(true);
    setEditError('');
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'rejected') body.rejectionReason = reason || rejectionReason;
      let updated = await apiPatch(`/api/osce-stations/${station._id}`, body);
      setCurrentStation(updated);
      if (onSave) onSave(updated);
      if (onAction) {
        // Status change operation successful
        if (newStatus === 'approved') onAction('approve', 'OSCE station approved successfully', station._id);
        else if (newStatus === 'rejected') onAction('reject', 'OSCE station rejected successfully', station._id);
        else onAction('pending', 'OSCE station set to pending', station._id);
      }
      onClose();
    } catch (err: any) {
      setEditError(err.message || 'Network error');
    }
    setEditLoading(false);
    setShowRejectionReason(false);
    setRejectionReason('');
  };

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
        ) : currentStation ? (
          <div className="space-y-6 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <div><span className="font-semibold">Writer:</span> {currentStation.writer?.name || '-'}</div>
                <div><span className="font-semibold">Category:</span> {currentStation.category}</div>
                <div><span className="font-semibold">Subject:</span> {currentStation.subject}</div>
                <div><span className="font-semibold">Topic:</span> {currentStation.topic}</div>
                {currentStation.subtopic && (
                  <div><span className="font-semibold">Subtopic:</span> {currentStation.subtopic}</div>
                )}
                <div><span className="font-semibold">Type:</span> {currentStation.type}</div>
              </div>
              <div className="space-y-3">
                <div><span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-bold
                  ${currentStation.status === 'approved' ? 'bg-green-100 text-green-700' :
                    currentStation.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'}`}>{currentStation.status}</span></div>
                <div><span className="font-semibold">Total Marks:</span> <span className="inline-block px-3 py-1 rounded text-sm font-bold bg-blue-100 text-blue-700">{currentStation.totalMarks || 0} points</span></div>
                <div><span className="font-semibold">Submitted At:</span> {new Date(currentStation.createdAt).toLocaleString()}</div>
                <div><span className="font-semibold">Last Updated:</span> {new Date(currentStation.updatedAt).toLocaleString()}</div>
              </div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Title:</span>
              <div className="mt-2 bg-gray-50 rounded p-4 border text-gray-800 text-base whitespace-pre-line">{currentStation.title}</div>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Case Description:</span>
              <div className="mt-2 bg-gray-50 rounded p-4 border text-gray-800 text-base whitespace-pre-line">{currentStation.caseDescription}</div>
            </div>
            {currentStation.historySections && (
              <div>
                <span className="font-semibold">History Sections:</span>
                <ul className="list-disc ml-6">
                  {Object.entries(currentStation.historySections).map(([k, v]: any) => (
                    <li key={k}><b>{k}:</b> {v}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <span className="font-semibold">Marking Scheme:</span>
              <div className="mt-2 space-y-4">
                {currentStation.markingScheme?.map((section: any, idx: number) => {
                  const sectionTotal = section.items?.reduce((sum: number, item: any) => sum + (item.score || 0), 0) || 0;
                  return (
                    <div key={idx} className="bg-gray-50 rounded p-4 border">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold text-gray-800">{section.section}</h4>
                        <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-blue-100 text-blue-700">
                          {sectionTotal} point{sectionTotal !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <ul className="space-y-1">
                        {section.items?.map((item: any, i: number) => (
                          <li key={i} className="flex justify-between items-center text-sm">
                            <span className="text-gray-700">{item.desc}</span>
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-200 text-gray-700">
                              {item.score} pt{item.score !== 1 ? 's' : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <span className="font-semibold">Follow-up Questions:</span>
              <div className="mt-2 space-y-3">
                {currentStation.followUps?.map((fq: any, idx: number) => (
                  <div key={idx} className="bg-gray-50 rounded p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <div className="mb-2">
                          <span className="font-medium text-gray-800">Q{idx + 1}:</span>
                          <span className="ml-2 text-gray-700">{fq.question}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-800">Answer:</span>
                          <span className="ml-2 text-gray-700">{fq.answers ? fq.answers.join(', ') : fq.answer}</span>
                        </div>
                      </div>
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-700 ml-3">
                        {fq.score || 0} pt{(fq.score || 0) !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {currentStation.images && currentStation.images.length > 0 && (
              <div>
                <span className="font-semibold">Images:</span>
                <div className="flex gap-4 flex-wrap mt-3">
                  {currentStation.images.map((img: string, idx: number) => (
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
            {user?.role === 'admin' && (
              <div className="flex flex-wrap gap-2 mb-8">
                <button
                  className="bg-green-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-green-600 transition flex items-center gap-1"
                  onClick={() => handleStatusChange('approved')}
                  disabled={editLoading || currentStation.status === 'approved'}
                >
                  <CheckCircleIcon className="w-4 h-4" /> Approve
                </button>
                <button
                  className="bg-red-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-red-600 transition flex items-center gap-1"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={editLoading || currentStation.status === 'rejected'}
                >
                  <XCircleIcon className="w-4 h-4" /> Reject
                </button>
                <button
                  className="bg-yellow-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-yellow-600 transition flex items-center gap-1"
                  onClick={() => handleStatusChange('pending')}
                  disabled={editLoading || currentStation.status === 'pending'}
                >
                  <ClockIcon className="w-4 h-4" /> Pending
                </button>
                <button
                  className="bg-red-600 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-red-700 transition flex items-center gap-1"
                  onClick={handleDelete}
                  disabled={editLoading}
                >
                  <TrashIcon className="w-4 h-4" /> Delete
                </button>
              </div>
            )}
            {showRejectionReason && (
              <div className="flex flex-col gap-2 mb-4">
                <input
                  type="text"
                  className="px-2 py-1 border rounded bg-white text-gray-900"
                  placeholder="Enter rejection reason"
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  disabled={rejectionLoading}
                />
                <div className="flex gap-2">
                  <button
                    className="bg-primary text-white px-3 py-1 rounded text-xs font-semibold hover:bg-primary-dark transition"
                    onClick={() => handleStatusChange('rejected', rejectionReason)}
                    disabled={rejectionLoading || !rejectionReason.trim()}
                  >
                    Save
                  </button>
                  <button
                    className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs font-semibold hover:bg-gray-300 transition"
                    onClick={() => { setShowRejectionReason(false); setRejectionReason(''); }}
                    disabled={rejectionLoading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            {children}
            <div className="flex flex-col items-end gap-4 mt-8">
              {user?.role === 'admin' && (
                <button
                  className="bg-blue-500 text-white px-4 py-1.5 rounded font-semibold text-xs hover:bg-blue-600 transition flex items-center gap-1 mb-2"
                  onClick={() => setEditOpen(true)}
                >
                  Edit
                </button>
              )}
              <button
                className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        ) : null}
        <OsceStationEditModal
          open={editOpen}
          onClose={() => setEditOpen(false)}
          station={currentStation}
          onSave={handleEditSave}
          loading={editLoading}
        />
        {editError && <div className="text-red-500 text-center mt-2">{editError}</div>}
      </div>
    </div>
  );
};

export default OsceStationViewModal; 