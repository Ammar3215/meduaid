import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectsStructure } from '../utils/subjectsStructure';
import { useAuth } from '../context/AuthContext';

const questionSchema = z.object({
  category: z.string().nonempty(),
  subject: z.string().nonempty(),
  topic: z.string().nonempty(),
  subtopic: z.string().optional(),
  question: z.string().min(10),
  choices: z.array(z.string().min(1)).length(5),
  explanations: z.array(z.string().min(1)).length(5),
  reference: z.string().min(3),
  images: z.any(),
  difficulty: z.enum(['easy', 'normal', 'hard']),
});

type QuestionFormInputs = z.infer<typeof questionSchema>;

const QuestionSubmission: React.FC = () => {
  const { jwt } = useAuth();
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
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
    const res = await fetch('http://localhost:5050/api/submissions/upload', {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    const data = await res.json();
    return data.urls;
  };

  const onSubmit = async (data: QuestionFormInputs) => {
    setLoading(true);
    setError('');
    setSuccess(false);
    try {
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        imageUrls = await uploadImages(data.images);
      }
      // Prepare form data for backend
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
      };
      const response = await fetch('http://localhost:5050/api/submissions', {
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
      setTimeout(() => setSuccess(false), 2000);
      // Optionally reset form
      // reset();
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Submit a Question</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select {...register('category')} className="w-full px-4 py-2 border rounded-lg">
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
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
          {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
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
          {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>}
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
          {errors.question && <p className="text-red-500 text-sm mt-1">{errors.question.message}</p>}
        </div>
        {/* Choices */}
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
          {errors.choices && <p className="text-red-500 text-sm mt-1">All choices are required.</p>}
        </div>
        {/* Explanations */}
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
          {errors.explanations && <p className="text-red-500 text-sm mt-1">All explanations are required.</p>}
        </div>
        {/* Image Uploader */}
        <div>
          <label className="block mb-1 font-medium">Upload Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageChange} className="mb-2" />
          <div className="flex gap-2 flex-wrap">
            {imagePreviews.map((src, i) => (
              <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded border" />
            ))}
          </div>
        </div>
        {/* Reference */}
        <div>
          <label className="block mb-1 font-medium">Reference</label>
          <input {...register('reference')} className="w-full px-4 py-2 border rounded-lg" />
          {errors.reference && <p className="text-red-500 text-sm mt-1">{errors.reference.message}</p>}
        </div>
        {/* Difficulty Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Difficulty</label>
          <select {...register('difficulty')} className="w-full px-4 py-2 border rounded-lg">
            <option value="easy">Easy</option>
            <option value="normal">Normal</option>
            <option value="hard">Hard</option>
          </select>
          {errors.difficulty && <p className="text-red-500 text-sm mt-1">{errors.difficulty.message}</p>}
        </div>
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
          disabled={isSubmitting || loading}
        >
          {isSubmitting || loading ? 'Submitting...' : 'Submit Question'}
        </button>
        {success && <div className="text-green-600 text-center mt-2">Question submitted!</div>}
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
      </form>
    </div>
  );
};

export default QuestionSubmission; 