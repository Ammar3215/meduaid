import React, { useState } from 'react';
import OsceStationForm from './OsceStationForm';

interface OsceStationEditModalProps {
  open: boolean;
  onClose: () => void;
  station: any;
  onSave: (data: any) => Promise<void> | void;
  loading?: boolean;
  error?: string;
}

const OsceStationEditModal: React.FC<OsceStationEditModalProps> = ({ open, onClose, station, onSave, error }) => {
  const [localError, setLocalError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (data: any) => {
    setSaving(true);
    setLocalError('');
    try {
      await onSave(data);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1000);
    } catch (err: any) {
      setLocalError(err?.message || 'Failed to save changes');
    }
    setSaving(false);
  };

  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
        <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 text-2xl font-bold" onClick={onClose}>&times;</button>
        <h3 className="text-xl font-bold mb-4 text-primary">Edit OSCE Station</h3>
        <OsceStationForm
          mode="edit"
          initialData={station}
          onSubmit={handleSave}
          onCancel={onClose}
          loading={saving}
          error={localError || error}
        />
        {success && <div className="text-green-600 text-center mt-2">Saved successfully!</div>}
      </div>
    </div>
  );
};

export default OsceStationEditModal; 