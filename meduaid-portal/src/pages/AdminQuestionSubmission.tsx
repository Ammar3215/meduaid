import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';

const questionSchema = z.object({
  category: z.string().nonempty('Required field'),
  subject: z.string().nonempty('Required field'),
  topic: z.string().nonempty('Required field'),
  subtopic: z.string().optional(),
  question: z.string().min(1, 'Required field'),
  choices: z.array(z.string().min(1, 'Required field')).length(5, 'Required field'),
  explanations: z.array(z.string().min(1, 'Required field')).length(5, 'Required field'),
  reference: z.string().min(1, 'Required field'),
  images: z.any(),
  difficulty: z.enum(['easy', 'normal', 'hard'], { errorMap: () => ({ message: 'Required field' }) }),
  writer: z.string().nonempty('Required field'),
  correctChoice: z.number().min(0, 'Required field').max(4, 'Required field'),
});

type AdminQuestionFormInputs = z.infer<typeof questionSchema>;

type Writer = { _id: string; name: string; email: string };

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const AdminQuestionSubmission: React.FC = () => {
  const { jwt } = useAuth();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);
  const [writers, setWriters] = useState<Writer[]>([]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AdminQuestionFormInputs>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      choices: ['', '', '', '', ''],
      explanations: ['', '', '', '', ''],
      difficulty: 'normal',
      writer: '',
      correctChoice: 0,
    },
    mode: 'onSubmit',
  });

  useEffect(() => {
    const fetchWriters = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/admin/writers`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (res.ok) {
          const data = await res.json();
          setWriters(data);
        }
      } catch {}
    };
    if (jwt) fetchWriters();
  }, [jwt]);

  const categories = Object.keys(subjectsStructure);
  const category = watch('category') || categories[0];
  const subjects = Object.keys((subjectsStructure as Record<string, any>)[category] || {});
  const subject = watch('subject');
  const topics = subject
    ? (Array.isArray(((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject])
        ? ((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject]
        : Object.keys(((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject] || {}))
    : [];
  const topic = watch('topic');
  const subtopics = subject && topic && Array.isArray((((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject] as Record<string, any>)[topic])
    ? (((subjectsStructure as Record<string, any>)[category] as Record<string, any>)[subject] as Record<string, any>)[topic]
    : [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setValue('images', files);
      setImagePreviews(Array.from(files).map(file => URL.createObjectURL(file)));
    }
  };

  const uploadImages = async (files: FileList): Promise<string[]> => {
    const formData = new FormData();
    Array.from(files).forEach(file => formData.append('images', file));
    const res = await fetch(`${API_BASE_URL}/api/submissions/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.urls;
  };

  const onSubmit = async (data: AdminQuestionFormInputs) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadImages(data.images);
      }
      const payload = {
        category: data.category,
        subject: data.subject,
        topic: data.topic,
        question: data.question,
        choices: data.choices,
        explanations: data.explanations,
        reference: data.reference,
        difficulty: data.difficulty,
        images: imageUrls,
        writer: data.writer,
        correctChoice: data.correctChoice,
      };
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError('Failed to submit question');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        window.location.reload();
      }, 1500);
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  const onSaveDraft = async (data: AdminQuestionFormInputs) => {
    setLoading(true);
    setError('');
    setDraftSuccess(false);
    try {
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadImages(data.images);
      }
      const payload = {
        category: data.category,
        subject: data.subject,
        topic: data.topic,
        question: data.question,
        choices: data.choices,
        explanations: data.explanations,
        reference: data.reference,
        difficulty: data.difficulty,
        images: imageUrls,
        status: 'draft',
        writer: data.writer,
        correctChoice: data.correctChoice,
      };
      const response = await fetch(`${API_BASE_URL}/api/submissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        setError('Failed to save draft');
        setLoading(false);
        return;
      }
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 1500);
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="w-full max-w-full max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-8 mt-4 sm:mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Submit a Question (Admin)</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-sm sm:text-base">
        <div className="flex flex-col gap-2 sm:gap-4">
          {/* Writer Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Assign Writer</label>
            <select {...register('writer')} className="w-full px-4 py-2 border rounded-lg">
              <option value="">Select Writer</option>
              {writers.map((w) => (
                <option key={w._id} value={w._id}>{w.name} ({w.email})</option>
              ))}
            </select>
            {errors.writer && <p className="text-red-500 text-sm mt-1">{errors.writer.message as string}</p>}
          </div>
          {/* Category Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Category</label>
            <select {...register('category')} className="w-full px-4 py-2 border rounded-lg">
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
          {/* Subject Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Subject</label>
            <select {...register('subject')} className="w-full px-4 py-2 border rounded-lg" disabled={!category}>
              <option value="">Select Subject</option>
              {subjects.map((subj) => (
                <option key={subj} value={subj}>{subj}</option>
              ))}
            </select>
            {errors.subject && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
          {/* Topic Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Topic</label>
            <select {...register('topic')} className="w-full px-4 py-2 border rounded-lg" disabled={!subject}>
              <option value="">Select Topic</option>
              {(topics as string[]).map((topic: string) => (
                <option key={topic} value={topic}>{topic}</option>
              ))}
            </select>
            {errors.topic && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
          {/* Subtopic Dropdown (if available) */}
          {subtopics && subtopics.length > 0 && (
            <div>
              <label className="block mb-1 font-medium">Subtopic</label>
              <select {...register('subtopic' as const)} className="w-full px-4 py-2 border rounded-lg">
                <option value="">Select Subtopic</option>
                {subtopics.map((sub: string) => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          )}
          {/* Question Textarea */}
          <div>
            <label className="block mb-1 font-medium">Question</label>
            <textarea {...register('question')} className="w-full px-4 py-2 border rounded-lg min-h-[80px]" />
            {errors.question && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
          {/* Choices & Explanations (A–E) */}
          <div>
            <label className="block mb-1 font-medium">Choices & Explanations (A–E)</label>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="mb-4">
                <input
                  {...register(`choices.${i}` as const)}
                  className="w-full px-4 py-2 border rounded-lg mb-1"
                  placeholder={`Choice ${String.fromCharCode(65 + i)}`}
                />
                {errors.choices && Array.isArray(errors.choices) && errors.choices[i] && (
                  <p className="text-red-500 text-sm mt-1">Required field</p>
                )}
                <input
                  {...register(`explanations.${i}` as const)}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder={`Explanation for Choice ${String.fromCharCode(65 + i)}`}
                />
                {errors.explanations && Array.isArray(errors.explanations) && errors.explanations[i] && (
                  <p className="text-red-500 text-sm mt-1">Required field</p>
                )}
              </div>
            ))}
          </div>
          {/* Correct Answer Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Select Correct Answer</label>
            <select
              {...register('correctChoice', { valueAsNumber: true })}
              className="w-full px-4 py-2 border rounded-lg"
              value={watch('correctChoice')}
              onChange={e => setValue('correctChoice', Number(e.target.value))}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <option key={i} value={i}>{`Choice ${String.fromCharCode(65 + i)}`}</option>
              ))}
            </select>
            {errors.correctChoice && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
          {/* Image Uploader */}
          <div>
            <label className="block mb-1 font-medium">Upload Images</label>
            <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mb-2" />
          </div>
          {/* Reference */}
          <div>
            <label className="block mb-1 font-medium">Reference</label>
            <input {...register('reference')} className="w-full px-4 py-2 border rounded-lg" />
            {errors.reference && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
          {/* Difficulty Dropdown */}
          <div>
            <label className="block mb-1 font-medium">Difficulty</label>
            <select {...register('difficulty')} className="w-full px-4 py-2 border rounded-lg">
              <option value="easy">Easy</option>
              <option value="normal">Normal</option>
              <option value="hard">Hard</option>
            </select>
            {errors.difficulty && <p className="text-red-500 text-sm mt-1">Required field</p>}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 mt-8 w-full">
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
            disabled={isSubmitting || loading}
            onClick={handleSubmit(onSaveDraft)}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
            disabled={isSubmitting || loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        <div className="flex gap-2 flex-wrap mt-2">
          {imagePreviews.map((src, i) => (
            <img key={i} src={src} alt="preview" className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded border" />
          ))}
        </div>
        {success && <div className="text-green-600 text-center mt-2">Question submitted successfully!</div>}
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        {draftSuccess && <div className="text-green-600 text-center mt-2">Draft saved!</div>}
      </form>
    </div>
  );
};

export default AdminQuestionSubmission; 