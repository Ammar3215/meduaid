import React, { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../context/AuthContext';

type EditFormInputs = {
  question: string;
  choices: string[];
  explanations: string[];
  reference: string;
  images: FileList | null;
};

const EditQuestions: React.FC = () => {
  const { jwt } = useAuth();
  const [rejected, setRejected] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [formImages, setFormImages] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<EditFormInputs>({
    defaultValues: {
      choices: ['', '', '', '', ''],
      explanations: ['', '', '', '', ''],
      images: null,
    },
  });

  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

  useEffect(() => {
    const fetchRejected = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${API_BASE_URL}/api/submissions?status=rejected`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (!res.ok) throw new Error('Failed to fetch rejected questions');
        const data = await res.json();
        setRejected(Array.isArray(data) ? data : data.submissions || []);
      } catch (err: any) {
        setError(err.message || 'Network error');
      }
      setLoading(false);
    };
    if (jwt) fetchRejected();
  }, [jwt]);

  const startEdit = (q: any) => {
    if (editingId === q._id) {
      // Toggle close if already open
      setEditingId(null);
      setImagePreviews([]);
      setFormImages(null);
      return;
    }
    setEditingId(q._id);
    reset({
      question: q.question,
      choices: q.choices,
      explanations: q.explanations,
      reference: q.reference,
      images: null,
    });
    setImagePreviews((q.images || []).map((img: string) => `${API_BASE_URL}${img}`));
    setFormImages(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    setFormImages(files);
    setValue('images', files);
    if (files) {
      setImagePreviews(Array.from(files).map(file => URL.createObjectURL(file)));
    } else {
      setImagePreviews([]);
    }
  };

  const onSubmit = async (data: EditFormInputs) => {
    if (!editingId) return;
    setError('');
    try {
      if (formImages && formImages.length > 0) {
        // Upload images if changed
        const formData = new FormData();
        Array.from(formImages).forEach(file => formData.append('images', file));
        // Add other fields
        formData.append('question', data.question);
        data.choices.forEach((c, i) => formData.append(`choices[${i}]`, c));
        data.explanations.forEach((e, i) => formData.append(`explanations[${i}]`, e));
        formData.append('reference', data.reference);
        formData.append('status', 'pending');
        const res = await fetch(`${API_BASE_URL}/api/submissions/${editingId}`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${jwt}` },
          body: formData,
        });
        if (!res.ok) throw new Error('Failed to resubmit question');
      } else {
        // No image change
        const res = await fetch(`${API_BASE_URL}/api/submissions/${editingId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${jwt}`,
          },
          body: JSON.stringify({
            question: data.question,
            choices: data.choices,
            explanations: data.explanations,
            reference: data.reference,
            status: 'pending',
          }),
        });
        if (!res.ok) throw new Error('Failed to resubmit question');
      }
      setRejected(prev => prev.filter(q => q._id !== editingId));
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 1500);
      setEditingId(null);
      setImagePreviews([]);
      setFormImages(null);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-4 md:p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Edit Rejected Questions</h2>
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : rejected.length === 0 ? (
        <div className="text-gray-500">No rejected questions.</div>
      ) : (
        <div className="flex flex-col gap-6">
          {rejected.map((q) => (
            <div key={q._id} className="rounded-xl border border-red-200 bg-red-50 shadow p-4 md:p-6 flex flex-col gap-2">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div className="font-semibold text-base md:text-lg text-gray-900">{q.question}</div>
                <div className="text-xs md:text-sm px-3 py-1 rounded-full bg-red-100 text-red-700 font-semibold w-fit">Reason: {q.rejectionReason || '-'}</div>
              </div>
              {q.images && q.images.length > 0 && (
                <div className="flex gap-2 flex-wrap mt-2">
                  {q.images.map((img: string, idx: number) => (
                    <img
                      key={idx}
                      src={`${API_BASE_URL}${img}`}
                      alt={`submission-img-${idx}`}
                      className="w-16 h-16 object-cover rounded border"
                    />
                  ))}
                </div>
              )}
              <div className="flex justify-end mt-2">
                <button
                  className="bg-primary text-white px-4 py-1.5 rounded font-semibold hover:bg-primary-dark transition"
                  onClick={() => startEdit(q)}
                  disabled={!!editingId && editingId !== q._id}
                >
                  Edit & Resubmit
                </button>
              </div>
              {/* Inline edit form */}
              {editingId === q._id && (
                <form onSubmit={handleSubmit(onSubmit)} className="mt-4 bg-white rounded-xl shadow-inner p-4 flex flex-col gap-4">
                  <div>
                    <label className="block mb-1 font-medium">Question</label>
                    <textarea {...register('question', { required: 'Question is required', minLength: { value: 10, message: 'At least 10 characters' } })} className="w-full px-4 py-2 border rounded-lg min-h-[80px] bg-white text-gray-900" />
                    {errors.question && <div className="text-red-500 text-xs mt-1">{errors.question.message}</div>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Choices & Explanations</label>
                    <div className="overflow-x-auto">
                      <table className="w-full border rounded bg-gray-50">
                        <thead>
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold text-gray-700">Choice</th>
                            <th className="px-2 py-1 text-left font-semibold text-gray-700">Explanation</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="border-t">
                              <td className="px-2 py-1 align-top">
                                <input
                                  {...register(`choices.${i}` as const, { required: 'Required' })}
                                  className="w-full px-2 py-1 border rounded bg-white text-gray-900"
                                  placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                                />
                                {errors.choices?.[i] && <div className="text-red-500 text-xs mt-1">{(errors.choices[i] as any)?.message}</div>}
                              </td>
                              <td className="px-2 py-1 align-top">
                                <input
                                  {...register(`explanations.${i}` as const, { required: 'Required' })}
                                  className="w-full px-2 py-1 border rounded bg-white text-gray-900"
                                  placeholder={`Explain Choice ${String.fromCharCode(65 + i)}`}
                                />
                                {errors.explanations?.[i] && <div className="text-red-500 text-xs mt-1">{(errors.explanations[i] as any)?.message}</div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Reference</label>
                    <input {...register('reference', { required: 'Reference is required' })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" />
                    {errors.reference && <div className="text-red-500 text-xs mt-1">{errors.reference.message}</div>}
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Images</label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-dark"
                      onChange={handleImageChange}
                      ref={fileInputRef}
                    />
                    <div className="flex gap-2 flex-wrap mt-2">
                      {imagePreviews.map((src, idx) => (
                        <div key={idx} className="relative group">
                          <img src={src} alt={`preview-${idx}`} className="w-16 h-16 object-cover rounded border" />
                          <button
                            type="button"
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs opacity-80 group-hover:opacity-100"
                            onClick={() => {
                              const newPreviews = imagePreviews.filter((_, i) => i !== idx);
                              setImagePreviews(newPreviews);
                              if (formImages) {
                                const dt = new DataTransfer();
                                Array.from(formImages).forEach((file, i) => {
                                  if (i !== idx) dt.items.add(file);
                                });
                                setFormImages(dt.files);
                                setValue('images', dt.files);
                              }
                            }}
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 md:gap-4 justify-end sticky bottom-0 bg-white pt-2 z-10">
                    <button
                      type="button"
                      className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                      onClick={() => { setEditingId(null); setImagePreviews([]); setFormImages(null); }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Resubmitting...' : 'Resubmit'}
                    </button>
                  </div>
                  {submitted && <div className="text-green-600 text-center mt-2">Resubmitted!</div>}
                  {error && <div className="text-red-500 text-center mt-2">{error}</div>}
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EditQuestions; 