import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { subjectsStructure } from '../utils/subjectsStructure';
import { ClipboardDocumentListIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { apiPost, apiUpload } from '../utils/api';

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
  guidelinesConfirmed: z.boolean().refine((val) => val, {
    message: 'You must confirm you have read and followed the guidelines.',
  }),
});

type QuestionFormInputs = z.infer<typeof questionSchema>;


const osceStationTypes = [
  { value: 'history', label: 'History Taking' },
  { value: 'examination', label: 'Clinical Examination' },
];

const QuestionSubmission: React.FC = () => {
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [draftSuccess, setDraftSuccess] = useState(false);
  // New: state for submission type
  const [submissionType, setSubmissionType] = useState<'SBA' | 'OSCE'>('SBA');
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
      guidelinesConfirmed: false,
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

  // OSCE form state
  const [osceType, setOsceType] = useState<'history' | 'examination'>('history');
  const [osceTitle, setOsceTitle] = useState('');
  const [osceCase, setOsceCase] = useState('');
  const [osceCategory, setOsceCategory] = useState(categories[0] || '');
  const [osceSubject, setOsceSubject] = useState('');
  const [osceTopic, setOsceTopic] = useState('');
  const [osceSubtopic, setOsceSubtopic] = useState('');
  const [osceCustomActorSections, setOsceCustomActorSections] = useState<string[]>([]);
  const [osceSectionMarks, setOsceSectionMarks] = useState<{ [section: string]: { sectionMark: number; requiredSubSections: number } }>({});
  const [osceMarkItems, setOsceMarkItems] = useState<{ [section: string]: { desc: string; score: string }[] }>({});
  // Update follow-ups to include multiple answers
  const [osceFollowUps, setOsceFollowUps] = useState<{ question: string; answers: string[]; score: string }[]>([
    { question: '', answers: [''], score: '' },
    { question: '', answers: [''], score: '' },
    { question: '', answers: [''], score: '' },
  ]);
  const [osceImagePreviews, setOsceImagePreviews] = useState<string[]>([]);
  const [osceGuidelinesConfirmed, setOsceGuidelinesConfirmed] = useState(false);
  const [osceErrors, setOsceErrors] = useState<any>({});

  // Marking scheme template sections
  const historySections = [
    'Introduction',
    'Presenting Complaint',
    'Past Medical and Surgical History',
    'Social History',
    'ICE (Ideas, Concerns, Expectations)',
    'Summary and Closure',
  ];
  const examSections = [
    'Introduction and Consent',
    'Inspection and Observation',
    'Palpation / Percussion / Auscultation',
    'Functional Assessment / Special Tests',
    'Summary of Findings and Explanation to Patient',
  ];

  // For OSCE history sections
  const historySectionKeys = [
    'Introduction',
    'Presenting Complaint',
    'Past Medical and Surgical History',
    'Social History',
    'ICE (Ideas, Concerns, Expectations)',
    'Summary and Closure',
  ];
  const [osceHistorySections, setOsceHistorySections] = useState<{ [key: string]: string }>(
    Object.fromEntries(historySectionKeys.map(k => [k, '']))
  );

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
    const data = await apiUpload('/api/submissions/upload', formData);
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
      await apiPost('/api/submissions', payload);
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
      await apiPost('/api/submissions', payload);
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 1500);
    } catch {
      setError('Network error');
    }
    setLoading(false);
  };

  // Handle OSCE image upload
  const handleOsceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setOsceImagePreviews(Array.from(files).map(file => URL.createObjectURL(file)));
    }
  };

  // Add/Remove follow-up questions
  const addFollowUp = () => setOsceFollowUps([...osceFollowUps, { question: '', answers: [''], score: '' }]);
  const removeFollowUp = (idx: number) => {
    if (osceFollowUps.length > 3) setOsceFollowUps(osceFollowUps.filter((_, i) => i !== idx));
  };
  const updateFollowUp = (idx: number, field: 'question' | 'answers' | 'score', val: string | string[]) => {
    setOsceFollowUps(osceFollowUps.map((q, i) => i === idx ? { ...q, [field]: val } : q));
  };
  
  // Add/Remove answers for a specific question
  const addAnswer = (questionIdx: number) => {
    setOsceFollowUps(osceFollowUps.map((q, i) => 
      i === questionIdx ? { ...q, answers: [...q.answers, ''] } : q
    ));
  };
  const removeAnswer = (questionIdx: number, answerIdx: number) => {
    setOsceFollowUps(osceFollowUps.map((q, i) => 
      i === questionIdx ? { ...q, answers: q.answers.filter((_, ai) => ai !== answerIdx) } : q
    ));
  };

  // Add/Remove marking scheme sections
  const getDefaultSections = () => (osceType === 'history' ? historySections : examSections);
  const [osceCustomSections, setOsceCustomSections] = useState<string[]>([]);
  // Add handlers for custom actor sections and section marks
  const addCustomActorSection = () => setOsceCustomActorSections([...osceCustomActorSections, '']);
  const updateCustomActorSection = (idx: number, val: string) => setOsceCustomActorSections(sections => sections.map((s, i) => i === idx ? val : s));
  const removeCustomActorSection = (idx: number) => setOsceCustomActorSections(sections => sections.filter((_, i) => i !== idx));
  const updateSectionMark = (section: string, field: 'sectionMark' | 'requiredSubSections', val: number) => setOsceSectionMarks(marks => ({ ...marks, [section]: { ...marks[section], [field]: val } }));
  const addCustomSection = () => setOsceCustomSections([...osceCustomSections, '']);
  const updateCustomSection = (idx: number, val: string) => {
    setOsceCustomSections(osceCustomSections.map((s, i) => (i === idx ? val : s)));
  };
  const removeCustomSection = (idx: number) => {
    setOsceCustomSections(osceCustomSections.filter((_, i) => i !== idx));
  };

  // Marking scheme items per section
  const addMarkItem = (section: string) => {
    setOsceMarkItems({
      ...osceMarkItems,
      [section]: [...(osceMarkItems[section] || []), { desc: '', score: '' }],
    });
  };
  const updateMarkItem = (section: string, idx: number, field: 'desc' | 'score', val: string) => {
    setOsceMarkItems({
      ...osceMarkItems,
      [section]: (osceMarkItems[section] || []).map((item, i) =>
        i === idx ? { ...item, [field]: val } : item
      ),
    });
  };
  const removeMarkItem = (section: string, idx: number) => {
    setOsceMarkItems({
      ...osceMarkItems,
      [section]: (osceMarkItems[section] || []).filter((_, i) => i !== idx),
    });
  };

  // Real-time validation functions
  const calculateIndividualTotal = (section: string): number => {
    const items = osceMarkItems[section] || [];
    return items.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
  };

  const getSectionMarkValidationClass = (section: string): string => {
    const sectionMarkData = osceSectionMarks[section];
    if (!sectionMarkData || !sectionMarkData.sectionMark) {
      return 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300'; // Default
    }
    
    const sectionMark = sectionMarkData.sectionMark;
    const individualTotal = calculateIndividualTotal(section);
    
    // Invalid section mark range (1-5)
    if (sectionMark < 1 || sectionMark > 5) {
      return 'w-full px-3 py-2 border-2 border-red-500 rounded-lg focus:ring-2 focus:ring-red-300 bg-red-50';
    }
    
    // Individual points exceed section mark
    if (individualTotal > sectionMark) {
      return 'w-full px-3 py-2 border-2 border-yellow-500 rounded-lg focus:ring-2 focus:ring-yellow-300 bg-yellow-50';
    }
    
    // Valid
    return 'w-full px-3 py-2 border-2 border-green-500 rounded-lg focus:ring-2 focus:ring-green-300 bg-green-50';
  };

  const getRealTimeIndicator = (section: string): { text: string; color: string; icon: string } => {
    const sectionMarkData = osceSectionMarks[section];
    if (!sectionMarkData || !sectionMarkData.sectionMark) {
      return { text: '', color: 'text-gray-500', icon: '' };
    }
    
    const sectionMark = sectionMarkData.sectionMark;
    const individualTotal = calculateIndividualTotal(section);
    
    if (sectionMark < 1 || sectionMark > 5) {
      return { text: 'Mark must be 1-5', color: 'text-red-600', icon: '❌' };
    }
    
    if (individualTotal > sectionMark) {
      return { text: `Individual: ${individualTotal}/${sectionMark}`, color: 'text-yellow-600', icon: '⚠️' };
    }
    
    return { text: `Individual: ${individualTotal}/${sectionMark}`, color: 'text-green-600', icon: '✅' };
  };

  // OSCE form validation (basic, for now)
  const validateOsce = () => {
    const errs: any = {};
    if (!osceTitle.trim()) errs.title = 'Station title is required.';
    if (!osceCase.trim()) errs.case = 'Candidate is required.';
    if (!osceCategory) errs.category = 'Category is required.';
    if (!osceSubject) errs.subject = 'Subject is required.';
    if (!osceTopic) errs.topic = 'Topic is required.';
    if (osceType === 'history') {
      for (const key of historySectionKeys) {
        if (!osceHistorySections[key] || !osceHistorySections[key].trim()) {
          errs[`history_${key}`] = `${key} is required.`;
        }
      }
    }
    if (osceFollowUps.filter(q => q.question.trim() && q.answers.some(ans => ans.trim())).length < 3) errs.followUps = 'At least 3 follow-up questions and answers are required.';
    osceFollowUps.forEach((q, idx) => {
      if (q.question.trim() && !q.answers.some(ans => ans.trim())) errs[`followup_answer_${idx}`] = 'Answer is required.';
      if (!q.question.trim() && q.answers.some(ans => ans.trim())) errs[`followup_question_${idx}`] = 'Question is required.';
      if (q.question.trim() && q.answers.some(ans => ans.trim()) && (!q.score || !q.score.trim())) errs[`followup_score_${idx}`] = 'Score is required.';
    });
    if (!osceGuidelinesConfirmed) errs.guidelines = 'You must confirm you have read and followed the guidelines.';
    
    // Validate section marks and individual points
    const allSections = [...getDefaultSections(), ...osceCustomActorSections.filter(Boolean)];
    allSections.forEach(section => {
      const sectionMarkData = osceSectionMarks[section];
      if (sectionMarkData && sectionMarkData.sectionMark > 0) {
        const sectionMark = sectionMarkData.sectionMark;
        
        // Check section mark is between 1-5
        if (sectionMark < 1 || sectionMark > 5) {
          errs[`section_mark_${section}`] = `Section "${section}" mark must be between 1-5 points.`;
        }
        
        // Check individual points don't exceed section mark
        const individualItems = osceMarkItems[section] || [];
        const individualTotal = individualItems.reduce((sum, item) => sum + (Number(item.score) || 0), 0);
        if (individualTotal > sectionMark) {
          errs[`section_points_${section}`] = `Section "${section}" individual points (${individualTotal}) exceed section mark (${sectionMark}).`;
        }
        
        // Check required sub-sections is provided when section mark is set
        if (!sectionMarkData.requiredSubSections || sectionMarkData.requiredSubSections < 1) {
          errs[`required_subsections_${section}`] = `Section "${section}" requires sub-sections count for full mark.`;
        }
      }
    });
    
    setOsceErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // OSCE form submit handler (now with backend integration)
  const handleOsceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    if (!validateOsce()) return;
    setLoading(true);
    try {
      const payload: any = {
        category: osceCategory,
        subject: osceSubject,
        topic: osceTopic,
        subtopic: osceSubtopic,
        title: osceTitle,
        type: osceType,
        caseDescription: osceCase,
        historySections: osceType === 'history' ? osceHistorySections : undefined,
        customActorSections: osceCustomActorSections.filter(Boolean),
        markingScheme: [
          ...getDefaultSections().map(section => ({
            section,
            sectionMark: Number((osceSectionMarks[section] && osceSectionMarks[section].sectionMark) || 0),
            requiredSubSections: Number((osceSectionMarks[section] && osceSectionMarks[section].requiredSubSections) || 0),
            items: (osceMarkItems[section] || []).map(i => ({ desc: i.desc, score: Number(i.score) }))
          })),
          ...osceCustomSections.filter(Boolean).map(section => ({
            section,
            sectionMark: Number((osceSectionMarks[section] && osceSectionMarks[section].sectionMark) || 0),
            requiredSubSections: Number((osceSectionMarks[section] && osceSectionMarks[section].requiredSubSections) || 0),
            items: (osceMarkItems[section] || []).map(i => ({ desc: i.desc, score: Number(i.score) }))
          }))
        ],
        followUps: osceFollowUps.filter(q => q.question.trim() && q.answers.some(ans => ans.trim())).map(q => ({
          question: q.question,
          answers: q.answers,
          score: Number(q.score)
        })),
        totalMarks: calculateTotalMarks(),
        images: osceImagePreviews, // (handle upload if needed)
        status: 'pending',
      };
      await apiPost('/api/osce-stations', payload);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
      // Reset form
      setOsceTitle('');
      setOsceCase('');
      setOsceCategory(categories[0] || '');
      setOsceSubject('');
      setOsceTopic('');
      setOsceSubtopic('');
      setOsceMarkItems({});
      setOsceCustomSections([]);
      setOsceFollowUps([{ question: '', answers: [''], score: '' }, { question: '', answers: [''], score: '' }, { question: '', answers: [''], score: '' }]);
      setOsceImagePreviews([]);
      setOsceGuidelinesConfirmed(false);
      setOsceErrors({});
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  // OSCE draft save handler
  const handleOsceSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setDraftSuccess(false);
    if (!validateOsce()) return;
    setLoading(true);
    try {
      const payload: any = {
        category: osceCategory,
        subject: osceSubject,
        topic: osceTopic,
        subtopic: osceSubtopic,
        title: osceTitle,
        type: osceType,
        caseDescription: osceCase,
        historySections: osceType === 'history' ? osceHistorySections : undefined,
        customActorSections: osceCustomActorSections.filter(Boolean),
        markingScheme: [
          ...getDefaultSections().map(section => ({
            section,
            sectionMark: Number((osceSectionMarks[section] && osceSectionMarks[section].sectionMark) || 0),
            requiredSubSections: Number((osceSectionMarks[section] && osceSectionMarks[section].requiredSubSections) || 0),
            items: (osceMarkItems[section] || []).map(i => ({ desc: i.desc, score: Number(i.score) }))
          })),
          ...osceCustomSections.filter(Boolean).map(section => ({
            section,
            sectionMark: Number((osceSectionMarks[section] && osceSectionMarks[section].sectionMark) || 0),
            requiredSubSections: Number((osceSectionMarks[section] && osceSectionMarks[section].requiredSubSections) || 0),
            items: (osceMarkItems[section] || []).map(i => ({ desc: i.desc, score: Number(i.score) }))
          }))
        ],
        followUps: osceFollowUps.filter(q => q.question.trim() && q.answers.some(ans => ans.trim())).map(q => ({
          question: q.question,
          answers: q.answers,
          score: Number(q.score)
        })),
        totalMarks: calculateTotalMarks(),
        images: osceImagePreviews, // (handle upload if needed)
        status: 'draft',
      };
      await apiPost('/api/osce-stations', payload);
      setDraftSuccess(true);
      setTimeout(() => setDraftSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
    setLoading(false);
  };

  // Calculate total marks from marking scheme
  const calculateTotalMarks = () => {
    let total = 0;
    // Sum marks from default sections
    getDefaultSections().forEach(section => {
      // Add section mark
      const sectionData = osceSectionMarks[section];
      if (sectionData && sectionData.sectionMark) {
        total += parseFloat(sectionData.sectionMark.toString()) || 0;
      }
      // Add marking point scores
      const items = osceMarkItems[section] || [];
      items.forEach(item => {
        const score = parseFloat(item.score) || 0;
        total += score;
      });
    });
    // Sum marks from custom sections
    osceCustomSections.forEach(section => {
      // Add section mark
      const sectionData = osceSectionMarks[section];
      if (sectionData && sectionData.sectionMark) {
        total += parseFloat(sectionData.sectionMark.toString()) || 0;
      }
      // Add marking point scores
      const items = osceMarkItems[section] || [];
      items.forEach(item => {
        const score = parseFloat(item.score) || 0;
        total += score;
      });
    });
    // Sum marks from follow-up questions
    osceFollowUps.forEach(q => {
      const score = parseFloat(q.score) || 0;
      total += score;
    });
    return total;
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8 mt-8">
      {/* Submission Type Dropdown */}
      <div className="mb-6 flex justify-center">
        <div className="flex gap-4" role="radiogroup" aria-label="Submission Type">
          <button
            type="button"
            role="radio"
            aria-checked={submissionType === 'SBA'}
            tabIndex={0}
            className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary cursor-pointer
              ${submissionType === 'SBA' ? 'border-primary bg-blue-50 text-primary shadow-lg' : 'border-gray-200 bg-white text-gray-700 hover:border-primary'}`}
            onClick={() => setSubmissionType('SBA')}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSubmissionType('SBA'); }}
          >
            <ClipboardDocumentListIcon className="w-8 h-8 mb-2" />
            <span className="font-bold text-lg">SBA</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={submissionType === 'OSCE'}
            tabIndex={0}
            className={`flex flex-col items-center px-6 py-4 rounded-xl border-2 transition-all duration-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 cursor-pointer
              ${submissionType === 'OSCE' ? 'border-green-600 bg-green-50 text-green-700 shadow-lg' : 'border-gray-200 bg-white text-gray-700 hover:border-green-600'}`}
            onClick={() => setSubmissionType('OSCE')}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setSubmissionType('OSCE'); }}
          >
            <UserGroupIcon className="w-8 h-8 mb-2" />
            <span className="font-bold text-lg">OSCE</span>
          </button>
        </div>
      </div>
      {/* Conditional rendering based on submissionType */}
      {submissionType === 'SBA' ? (
        <>
          {/* Guidelines Box */}
          <div className="mb-8 p-4 rounded-lg border-l-4 border-blue-500 bg-blue-50 text-blue-900 shadow-sm">
            <div className="font-semibold mb-2 text-blue-800 text-base">Please follow these guidelines when submitting a question:</div>
            <ul className="list-decimal list-inside space-y-1 text-sm sm:text-base">
              <li>No abbreviations like <span className="italic">don't</span>, <span className="italic">won't</span> or medical abbreviations.</li>
              <li>Presenting complaint as well as brief history is mentioned.</li>
              <li>Explain why the answer is wrong.</li>
              <li>Explain briefly when would the incorrect answer be correct.</li>
              <li>Add normal ranges for any labs / investigations with values .</li>
            </ul>
          </div>
          {/* SBA Form (existing) */}
          <form onSubmit={handleSubmit(onSubmitAndAddAnother)} className="space-y-4">
            {/* Category Dropdown */}
            <div>
              <label className="block mb-1 font-medium">Category</label>
              <select {...register('category')} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
                <option value="">Select Category</option>
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
            {/* Guidelines Confirmation Checkbox */}
            <div className="mb-6 flex items-start">
              <input
                type="checkbox"
                id="guidelinesConfirmed"
                {...register('guidelinesConfirmed', { required: 'You must confirm you have read and followed the guidelines.' })}
                className="mt-1 mr-2 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="guidelinesConfirmed" className="text-gray-800 text-sm font-medium select-none">
                I have read and followed all the question submission guidelines.
              </label>
            </div>
            {errors.guidelinesConfirmed && (
              <p className="text-red-500 text-xs mb-4">{errors.guidelinesConfirmed.message}</p>
            )}
            <div className="flex flex-col md:flex-row justify-end gap-2 md:gap-4 mt-8">
              <button
                type="button"
                className="w-full md:w-auto bg-gray-300 text-gray-700 text-xs py-1.5 md:text-sm md:py-2 px-4 md:px-6 rounded-lg font-semibold hover:bg-gray-400 transition"
                disabled={isSubmitting || loading}
                onClick={handleSubmit(onSaveDraft)}
              >
                {loading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="button"
                className="w-full md:w-auto bg-blue-500 text-white text-xs py-1.5 md:text-sm md:py-2 px-4 md:px-6 rounded-lg font-semibold hover:bg-blue-600 transition"
                disabled={isSubmitting || loading}
                onClick={handleSubmit(onSubmitAndAddAnother)}
              >
                {loading ? 'Submitting...' : 'Submit & Add Another'}
              </button>
              <button
                type="submit"
                className="w-full md:w-auto bg-primary text-white text-xs py-1.5 md:text-sm md:py-2 px-4 md:px-6 rounded-lg font-semibold hover:bg-primary-dark transition"
                disabled={isSubmitting || loading}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
            {success && <div className="text-green-600 text-center mt-2">Question submitted successfully!</div>}
            {error && <div className="text-red-500 text-center mt-2">{error}</div>}
            {draftSuccess && <div className="text-green-600 text-center mt-2">Draft saved!</div>}
          </form>
        </>
      ) : (
        <form onSubmit={handleOsceSubmit} className="space-y-6">
          {/* Basic Info Section */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">Basic Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-medium">Station Title</label>
                <input type="text" value={osceTitle} onChange={e => setOsceTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" />
                {osceErrors.title && <p className="text-red-500 text-sm mt-1">{osceErrors.title}</p>}
              </div>
              <div>
                <label className="block mb-1 font-medium">Station Type</label>
                <select value={osceType} onChange={e => { setOsceType(e.target.value as 'history' | 'examination'); setOsceMarkItems({}); setOsceCustomSections([]); }} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
                  {osceStationTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1 font-medium">Category</label>
                <select value={osceCategory} onChange={e => { setOsceCategory(e.target.value); setOsceSubject(''); setOsceTopic(''); setOsceSubtopic(''); }} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
                  <option value="">Select Category</option>
                  {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                {osceErrors.category && <p className="text-red-500 text-sm mt-1">{osceErrors.category}</p>}
              </div>
              <div>
                <label className="block mb-1 font-medium">Subject</label>
                <select value={osceSubject} onChange={e => { setOsceSubject(e.target.value); setOsceTopic(''); setOsceSubtopic(''); }} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" disabled={!osceCategory}>
                  <option value="">Select Subject</option>
                  {Object.keys((subjectsStructure as Record<string, any>)[osceCategory] || {}).map(subj => <option key={subj} value={subj}>{subj}</option>)}
                </select>
                {osceErrors.subject && <p className="text-red-500 text-sm mt-1">{osceErrors.subject}</p>}
              </div>
              <div>
                <label className="block mb-1 font-medium">Topic</label>
                <select value={osceTopic} onChange={e => { setOsceTopic(e.target.value); setOsceSubtopic(''); }} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" disabled={!osceSubject}>
                  <option value="">Select Topic</option>
                  {osceSubject && (Array.isArray(((subjectsStructure as Record<string, any>)[osceCategory] as Record<string, any>)[osceSubject])
                    ? ((subjectsStructure as Record<string, any>)[osceCategory] as Record<string, any>)[osceSubject].map((topic: string) => <option key={topic} value={topic}>{topic}</option>)
                    : Object.keys(((subjectsStructure as Record<string, any>)[osceCategory] as Record<string, any>)[osceSubject] || {}).map((topic: string) => <option key={topic} value={topic}>{topic}</option>))}
                </select>
                {osceErrors.topic && <p className="text-red-500 text-sm mt-1">{osceErrors.topic}</p>}
              </div>
              {osceSubject && osceTopic && Array.isArray((((subjectsStructure as Record<string, any>)[osceCategory] as Record<string, any>)[osceSubject] as Record<string, any>)[osceTopic]) && (
                <div>
                  <label className="block mb-1 font-medium">Subtopic</label>
                  <select value={osceSubtopic} onChange={e => setOsceSubtopic(e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
                    <option value="">Select Subtopic</option>
                    {(((subjectsStructure as Record<string, any>)[osceCategory] as Record<string, any>)[osceSubject] as Record<string, any>)[osceTopic].map((sub: string) => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>
              )}
            </div>
          </div>
          {/* Case Description Section */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">Candidate</h3>
            <textarea value={osceCase} onChange={e => setOsceCase(e.target.value)} className="w-full px-4 py-2 border rounded-lg min-h-[80px] bg-white text-gray-900" />
            {osceErrors.case && <p className="text-red-500 text-sm mt-1">{osceErrors.case}</p>}
          </div>
          {/* History Sections */}
          {osceType === 'history' && (
            <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
              <h3 className="text-lg font-bold mb-4 text-green-700">History Sections (Actor)</h3>
              <div className="space-y-4">
                {historySectionKeys.map((key, idx) => (
                  <div key={key} className="border-l-4 border-blue-400 bg-blue-50 rounded-lg p-4 shadow-sm mb-2">
                    <div className="flex items-center mb-2">
                      <span className="inline-block w-6 h-6 rounded-full bg-blue-400 text-white flex items-center justify-center font-bold mr-3">{idx + 1}</span>
                      <label className="block text-base font-semibold text-blue-900">{key}</label>
                    </div>
                    <textarea
                      value={osceHistorySections[key]}
                      onChange={e => setOsceHistorySections(s => ({ ...s, [key]: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg min-h-[60px] bg-white text-gray-900 focus:ring-2 focus:ring-blue-300"
                    />
                    {osceErrors[`history_${key}`] && <p className="text-red-500 text-sm mt-1">{osceErrors[`history_${key}`]}</p>}
                  </div>
                ))}
                
                {/* Custom Actor Sections */}
                {osceCustomActorSections.map((sectionTitle, idx) => (
                  <div key={`custom-${idx}`} className="border-l-4 border-purple-400 bg-purple-50 rounded-lg p-4 shadow-sm mb-2">
                    <div className="flex items-center mb-2">
                      <span className="inline-block w-6 h-6 rounded-full bg-purple-400 text-white flex items-center justify-center font-bold mr-3">{historySectionKeys.length + idx + 1}</span>
                      <input
                        type="text"
                        value={sectionTitle}
                        onChange={e => updateCustomActorSection(idx, e.target.value)}
                        className="flex-1 px-3 py-1 border rounded-lg bg-white text-gray-900 font-semibold"
                        placeholder="Custom Section Title"
                      />
                      <button
                        type="button"
                        onClick={() => removeCustomActorSection(idx)}
                        className="ml-2 text-red-500 hover:text-red-700 px-2 py-1 text-sm"
                      >
                        Remove
                      </button>
                    </div>
                    <textarea
                      value={osceHistorySections[sectionTitle] || ''}
                      onChange={e => setOsceHistorySections(s => ({ ...s, [sectionTitle]: e.target.value }))}
                      className="w-full px-4 py-2 border rounded-lg min-h-[60px] bg-white text-gray-900 focus:ring-2 focus:ring-purple-300"
                      placeholder="Enter content for this custom section..."
                    />
                  </div>
                ))}
                
                <button
                  type="button"
                  onClick={addCustomActorSection}
                  className="mt-3 text-purple-600 font-semibold hover:text-purple-800 flex items-center gap-1"
                >
                  <span className="text-lg">+</span> Add Extra Section
                </button>
              </div>
            </div>
          )}
          {/* Marking Scheme Section */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">Marking Scheme</h3>
            <div className="space-y-4">
              {/* Fixed sections */}
              {getDefaultSections().map(section => (
                <div key={section} className="border rounded-lg p-4 bg-white">
                  <div className="font-semibold mb-4 text-blue-700 bg-blue-50 px-3 py-2 rounded border-l-4 border-blue-400">
                    Section: {section}
                  </div>
                  
                  {/* Section-level settings */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section Mark</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1-5"
                        value={(osceSectionMarks[section] && osceSectionMarks[section].sectionMark) || ''}
                        onChange={e => updateSectionMark(section, 'sectionMark', Number(e.target.value))}
                        className={getSectionMarkValidationClass(section)}
                      />
                      {(() => {
                        const indicator = getRealTimeIndicator(section);
                        return indicator.text ? (
                          <div className={`text-xs mt-1 flex items-center gap-1 ${indicator.color}`}>
                            <span>{indicator.icon}</span>
                            <span>{indicator.text}</span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Sub-sections for Full Mark <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Required (min 1)"
                        value={(osceSectionMarks[section] && osceSectionMarks[section].requiredSubSections) || ''}
                        onChange={e => updateSectionMark(section, 'requiredSubSections', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      />
                      {osceErrors[`required_subsections_${section}`] && (
                        <p className="text-red-500 text-xs mt-1">{osceErrors[`required_subsections_${section}`]}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Individual marking points */}
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-700 mb-2">Individual Marking Points:</h4>
                  {(osceMarkItems[section] || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Component description"
                        value={item.desc}
                        onChange={e => updateMarkItem(section, idx, 'desc', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Score"
                        value={item.score}
                        onChange={e => updateMarkItem(section, idx, 'score', e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <button type="button" onClick={() => removeMarkItem(section, idx)} className="text-red-500">Remove</button>
                    </div>
                  ))}
                    <button type="button" onClick={() => addMarkItem(section)} className="text-blue-600 text-sm">+ Add Marking Point</button>
                  </div>
                </div>
              ))}
              {/* Custom sections */}
              {osceCustomSections.map((section, sidx) => (
                <div key={sidx} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center mb-2">
                    <input
                      type="text"
                      placeholder="Custom Section Title"
                      value={section}
                      onChange={e => updateCustomSection(sidx, e.target.value)}
                      className="flex-1 px-2 py-1 border rounded mr-2"
                    />
                    <button type="button" onClick={() => removeCustomSection(sidx)} className="text-red-500">Remove Section</button>
                  </div>
                  
                  {/* Section-level settings for custom sections */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg border">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Section Mark</label>
                      <input
                        type="number"
                        min="1"
                        max="5"
                        placeholder="1-5"
                        value={(osceSectionMarks[section] && osceSectionMarks[section].sectionMark) || ''}
                        onChange={e => updateSectionMark(section, 'sectionMark', Number(e.target.value))}
                        className={getSectionMarkValidationClass(section)}
                      />
                      {(() => {
                        const indicator = getRealTimeIndicator(section);
                        return indicator.text ? (
                          <div className={`text-xs mt-1 flex items-center gap-1 ${indicator.color}`}>
                            <span>{indicator.icon}</span>
                            <span>{indicator.text}</span>
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Required Sub-sections for Full Mark <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Required (min 1)"
                        value={(osceSectionMarks[section] && osceSectionMarks[section].requiredSubSections) || ''}
                        onChange={e => updateSectionMark(section, 'requiredSubSections', Number(e.target.value))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-300"
                        required
                      />
                      {osceErrors[`required_subsections_${section}`] && (
                        <p className="text-red-500 text-xs mt-1">{osceErrors[`required_subsections_${section}`]}</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Individual marking points for custom sections */}
                  <div className="border-t pt-3">
                    <h4 className="font-medium text-gray-700 mb-2">Individual Marking Points:</h4>
                  {(osceMarkItems[section] || []).map((item, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Component description"
                        value={item.desc}
                        onChange={e => updateMarkItem(section, idx, 'desc', e.target.value)}
                        className="flex-1 px-2 py-1 border rounded"
                      />
                      <input
                        type="number"
                        placeholder="Score"
                        value={item.score}
                        onChange={e => updateMarkItem(section, idx, 'score', e.target.value)}
                        className="w-20 px-2 py-1 border rounded"
                      />
                      <button type="button" onClick={() => removeMarkItem(section, idx)} className="text-red-500">Remove</button>
                    </div>
                  ))}
                    <button type="button" onClick={() => addMarkItem(section)} className="text-blue-600 text-sm">+ Add Marking Point</button>
                  </div>
                </div>
              ))}
              <button type="button" onClick={addCustomSection} className="text-green-700 font-semibold">+ Add Custom Section</button>
            </div>
          </div>
          {/* Follow-up Questions Section */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">Follow-up Questions (min 3)</h3>
            {osceFollowUps.map((q, idx) => (
              <div key={idx} className="mb-4 bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={q.question}
                      onChange={e => updateFollowUp(idx, 'question', e.target.value)}
                      className="w-full px-2 py-1 border rounded mb-1"
                      placeholder={`Follow-up Question ${idx + 1}`}
                    />
                    {osceErrors[`followup_question_${idx}`] && <p className="text-red-500 text-xs mt-1">{osceErrors[`followup_question_${idx}`]}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={q.score}
                      onChange={e => updateFollowUp(idx, 'score', e.target.value)}
                      className="w-20 px-2 py-1 border rounded"
                      placeholder="Score"
                    />
                    <span className="text-sm text-gray-600">marks</span>
                    {osceFollowUps.length > 3 && (
                      <button type="button" onClick={() => removeFollowUp(idx)} className="text-red-500 self-center px-2 py-1 text-sm">Remove Question</button>
                    )}
                  </div>
                </div>
                {osceErrors[`followup_score_${idx}`] && <p className="text-red-500 text-xs mt-1">{osceErrors[`followup_score_${idx}`]}</p>}
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Answers:</div>
                  {q.answers.map((ans, aidx) => (
                    <div key={aidx} className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={ans}
                        onChange={e => updateFollowUp(idx, 'answers', q.answers.map((a, i) => (i === aidx ? e.target.value : a)))}
                        className="flex-1 px-2 py-1 border rounded"
                        placeholder={`Answer ${idx + 1} (Option ${aidx + 1})`}
                      />
                      {q.answers.length > 1 && (
                        <button 
                          type="button" 
                          onClick={() => removeAnswer(idx, aidx)} 
                          className="text-red-500 px-2 py-1 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  {q.answers.length < 5 && (
                    <button type="button" onClick={() => addAnswer(idx)} className="text-blue-600 text-sm">+ Add Answer</button>
                  )}
                </div>
                {osceErrors[`followup_answer_${idx}`] && <p className="text-red-500 text-xs mt-1">{osceErrors[`followup_answer_${idx}`]}</p>}
              </div>
            ))}
            <button type="button" onClick={addFollowUp} className="text-blue-600 text-sm">+ Add Follow-up/out of scope Question</button>
            {osceErrors.followUps && <p className="text-red-500 text-sm mt-1">{osceErrors.followUps}</p>}
          </div>
          {/* Images Section */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">Images (optional)</h3>
            <input type="file" multiple accept="image/*" onChange={handleOsceImageChange} className="mb-2 bg-white text-gray-900" />
            <div className="flex gap-2 flex-wrap">
              {osceImagePreviews.map((src, i) => (
                <img key={i} src={src} alt="preview" className="w-16 h-16 object-cover rounded border bg-white text-gray-900" />
              ))}
            </div>
          </div>
          {/* Confirmation Section */}
          <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
            <h3 className="text-lg font-bold mb-4 text-green-700">Confirmation</h3>
            <div className="mb-6 flex items-start">
              <input
                type="checkbox"
                id="osceGuidelinesConfirmed"
                checked={osceGuidelinesConfirmed}
                onChange={e => setOsceGuidelinesConfirmed(e.target.checked)}
                className="mt-1 mr-2 w-5 h-5 text-primary border-gray-300 rounded focus:ring-primary"
              />
              <label htmlFor="osceGuidelinesConfirmed" className="text-gray-800 text-sm font-medium select-none">
                I have read and followed all the OSCE station submission guidelines.
              </label>
            </div>
            {osceErrors.guidelines && (
              <p className="text-red-500 text-xs mb-4">{osceErrors.guidelines}</p>
            )}
          </div>
          {/* Total Marks Display */}
          <div className="bg-green-50 rounded-xl p-6 shadow-sm mb-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-green-700">Total Marks</h3>
              <div className="text-2xl font-bold text-green-600 bg-white px-4 py-2 rounded-lg border-2 border-green-300">
                {calculateTotalMarks()}
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">
              This is the sum of all marks from your marking scheme sections.
            </p>
          </div>
          {/* Submit Bar */}
          <div className="bg-white py-4 px-2 flex flex-col md:flex-row justify-end gap-2 md:gap-4 border-t rounded-b-xl shadow-lg">
            <button
              type="button"
              className="w-full md:w-auto bg-gray-300 text-gray-700 text-xs py-1.5 md:text-sm md:py-2 px-4 md:px-6 rounded-lg font-semibold hover:bg-gray-400 transition"
              disabled={isSubmitting || loading}
              onClick={handleOsceSaveDraft}
            >
              {loading ? 'Saving...' : 'Save as Draft'}
            </button>
            <button
              type="submit"
              className="w-full md:w-auto bg-primary text-white text-xs py-1.5 md:text-sm md:py-2 px-4 md:px-6 rounded-lg font-semibold hover:bg-primary-dark transition"
              disabled={isSubmitting || loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </button>
          </div>
          {success && <div className="text-green-600 text-center mt-2">OSCE station submitted successfully!</div>}
          {draftSuccess && <div className="text-green-600 text-center mt-2">Draft saved!</div>}
          {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        </form>
      )}
    </div>
  );
};

export default QuestionSubmission; 