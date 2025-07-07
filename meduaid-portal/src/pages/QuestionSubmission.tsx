import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';

const questionSchema = z.object({
  category: z.string().nonempty('Please select a category.'),
  subject: z.string().nonempty('Please select a subject.'),
  topic: z.string().nonempty('Please select a topic.'),
  subtopic: z.string().optional(),
  question: z.string().min(10, 'Please enter your question (at least 10 characters).'),
  choices: z.array(z.string().min(1, 'Each choice is required.')).length(5, 'All 5 choices are required.'),
  explanations: z.array(z.string().min(1, 'Each explanation is required.')).length(5, 'All 5 explanations are required.'),
  reference: z.string().min(3, 'Please provide a reference (at least 3 characters).'),
  images: z.any(),
  difficulty: z.enum(['easy', 'normal', 'hard'], { errorMap: () => ({ message: 'Please select a difficulty.' }) }),
  correctChoice: z.number().min(0, 'Please select which choice is correct.').max(4, 'Please select which choice is correct.'),
});

type QuestionFormInputs = z.infer<typeof questionSchema>;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';

const QuestionSubmission: React.FC = () => {
  const { jwt } = useAuth();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormInputs>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      choices: ['', '', '', '', ''],
      explanations: ['', '', '', '', ''],
      difficulty: 'normal',
      correctChoice: 0,
    },
  });

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

  // Add this helper to reset only question-specific fields
  const resetQuestionFields = () => {
    setValue('question', '');
    setValue('choices', ['', '', '', '', '']);
    setValue('explanations', ['', '', '', '', '']);
    setValue('reference', '');
    setValue('images', undefined);
    setValue('correctChoice', 0);
    setImagePreviews([]);
  };

  // Handler for Submit & Add Another
  const onSubmitAndAddAnother = async (data: QuestionFormInputs) => {
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
        subtopic: data.subtopic,
        question: data.question,
        choices: data.choices,
        explanations: data.explanations,
        reference: data.reference,
        difficulty: data.difficulty,
        images: imageUrls,
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
      resetQuestionFields();
      setTimeout(() => setSuccess(false), 1500);
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  // Save as Draft handler
  const onSaveDraft = async (data: QuestionFormInputs) => {
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
        subtopic: data.subtopic,
        question: data.question,
        choices: data.choices,
        explanations: data.explanations,
        reference: data.reference,
        difficulty: data.difficulty,
        images: imageUrls,
        status: 'draft',
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
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Submit a Question</h2>
      <form onSubmit={handleSubmit(onSubmitAndAddAnother)} className="space-y-4">
        {/* Category Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select {...register('category')} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </div>
        {/* Subject Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Subject</label>
          <select {...register('subject')} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" disabled={!category}>
            <option value="">Select Subject</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>{subj}</option>
            ))}
          </select>
          {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
        </div>
        {/* Topic Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Topic</label>
          <select {...register('topic')} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" disabled={!subject}>
            <option value="">Select Topic</option>
            {(topics as string[]).map((topic: string) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>}
        </div>
        {/* Subtopic Dropdown (if available) */}
        {subtopics && subtopics.length > 0 && (
          <div>
            <label className="block mb-1 font-medium">Subtopic</label>
            <select {...register('subtopic' as const)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
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
          <textarea {...register('question')} className="w-full px-4 py-2 border rounded-lg min-h-[80px] bg-white text-gray-900" />
          {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question.message}</p>}
        </div>
        {/* Choices & Explanations (A–E) */}
        <div>
          <label className="block mb-1 font-medium">Choices & Explanations (A–E)</label>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="mb-4">
              <input
                {...register(`choices.${i}` as const)}
                className="w-full px-4 py-2 border rounded-lg mb-1 bg-white text-gray-900"
                placeholder={`Choice ${String.fromCharCode(65 + i)}`}
              />
              {errors.choices?.[i] && <p className="text-red-500 text-sm mt-1">Choice {String.fromCharCode(65 + i)} is required.</p>}
              <input
                {...register(`explanations.${i}` as const)}
                className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
                placeholder={`Explanation for Choice ${String.fromCharCode(65 + i)}`}
              />
              {errors.explanations?.[i] && <p className="text-red-500 text-sm mt-1">Explanation for Choice {String.fromCharCode(65 + i)} is required.</p>}
            </div>
          ))}
        </div>
        {/* Correct Choice Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Correct Choice</label>
          <select {...register('correctChoice', { valueAsNumber: true })} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
            {['A', 'B', 'C', 'D', 'E'].map((label, idx) => (
              <option key={idx} value={idx}>{label}</option>
            ))}
          </select>
          {errors.correctChoice && <p className="text-red-500 text-sm mt-1">Please select which choice is correct (A–E).</p>}
        </div>
        {/* Image Uploader */}
        <div>
          <label className="block mb-1 font-medium">Upload Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mb-2 bg-white text-gray-900" />
          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((src, i) => (
              <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded border bg-white text-gray-900" />
            ))}
          </div>
        </div>
        {/* Reference */}
        <div>
          <label className="block mb-1 font-medium">Reference</label>
          <input {...register('reference')} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" />
          {errors.reference && <p className="text-red-500 text-sm mt-1">{errors.reference.message}</p>}
        </div>
        {/* Difficulty Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Difficulty</label>
          <select {...register('difficulty')} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
          {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>}
        </div>
        <div className="flex justify-end gap-4 mt-8">
          <button
            type="button"
            className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-400 transition"
            disabled={isSubmitting || loading}
            onClick={handleSubmit(onSaveDraft)}
          >
            {loading ? 'Saving...' : 'Save as Draft'}
          </button>
          <button
            type="button"
            className="bg-blue-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            disabled={isSubmitting || loading}
            onClick={handleSubmit(onSubmitAndAddAnother)}
          >
            {loading ? 'Submitting...' : 'Submit & Add Another'}
          </button>
          <button
            type="submit"
            className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
            disabled={isSubmitting || loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </div>
        {success && <div className="text-green-600 text-center mt-2">Question submitted successfully!</div>}
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        {draftSuccess && <div className="text-green-600 text-center mt-2">Draft saved!</div>}
      </form>
    </div>
  );
};

export default QuestionSubmission; 