import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { basicSciencesStructure } from '../utils/basicSciencesStructure';

const questionSchema = z.object({
  category: z.string().nonempty(),
  subject: z.string().nonempty(),
  topic: z.string().nonempty(),
  question: z.string().min(10),
  choices: z.array(z.string().min(1)).length(5),
  explanations: z.array(z.string().min(1)).length(5),
  reference: z.string().min(3),
  images: z.any(),
});

type QuestionFormInputs = z.infer<typeof questionSchema>;

const QuestionSubmission: React.FC = () => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
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
    },
  });

  const category = 'Basic Sciences';
  const subjects = Object.keys(basicSciencesStructure);
  const subject = watch('subject');
  const topics = subject ? basicSciencesStructure[subject as keyof typeof basicSciencesStructure] : [];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setValue('images', files);
      setImagePreviews(Array.from(files).map(file => URL.createObjectURL(file)));
    }
  };

  const onSubmit = async () => {
    // Mock submit
    alert('Question submitted!');
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      <h2 className="text-2xl font-bold mb-6 text-primary text-center">Submit a Question</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Category Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Category</label>
          <select {...register('category')} className="w-full px-4 py-2 border rounded-lg" disabled value={category}>
            <option value={category}>{category}</option>
          </select>
          {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>}
        </div>
        {/* Subject Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Subject</label>
          <select {...register('subject')} className="w-full px-4 py-2 border rounded-lg">
            <option value="">Select Subject</option>
            {subjects.map((subj) => (
              <option key={subj} value={subj}>{subj.replace(/([A-Z])/g, ' $1').trim()}</option>
            ))}
          </select>
          {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
        </div>
        {/* Topic Dropdown */}
        <div>
          <label className="block mb-1 font-medium">Topic</label>
          <select {...register('topic')} className="w-full px-4 py-2 border rounded-lg" disabled={!subject}>
            <option value="">Select Topic</option>
            {topics.map((topic) => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>
          {errors.topic && <p className="text-red-500 text-sm mt-1">{errors.topic.message}</p>}
        </div>
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
        <button
          type="submit"
          className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Question'}
        </button>
      </form>
    </div>
  );
};

export default QuestionSubmission; 