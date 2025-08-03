import React, { useState, useEffect } from 'react';
import { subjectsStructure } from '../utils/subjectsStructure';

interface OsceStationFormProps {
  mode: 'create' | 'edit';
  initialData?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string;
  saveLabel?: string;
}

const osceStationTypes = [
  { value: 'history', label: 'History Taking' },
  { value: 'examination', label: 'Clinical Examination' },
];

const historySectionKeys = [
  'Presenting Complaint',
  'History of Presenting Complaint',
  'Past Medical History',
  'Drug History',
  'Family History',
  'Social History',
  'Systemic Enquiry',
];

const getDefaultSections = (type: string) =>
  type === 'history'
    ? historySectionKeys
    : ['General Examination', 'Specific Examination'];

const OsceStationForm: React.FC<OsceStationFormProps> = ({ mode, initialData, onSubmit, onCancel, loading, error, saveLabel }) => {
  // State setup
  const [osceTitle, setOsceTitle] = useState(initialData?.title || '');
  const [osceType, setOsceType] = useState(initialData?.type || 'history');
  const [osceCategory, setOsceCategory] = useState(initialData?.category || Object.keys(subjectsStructure)[0] || '');
  const [osceSubject, setOsceSubject] = useState(initialData?.subject || '');
  const [osceTopic, setOsceTopic] = useState(initialData?.topic || '');
  const [osceSubtopic, setOsceSubtopic] = useState(initialData?.subtopic || '');
  const [osceCase, setOsceCase] = useState(initialData?.caseDescription || '');
  const [osceHistorySections, setOsceHistorySections] = useState<any>(initialData?.historySections || {});
  const [osceMarkItems, setOsceMarkItems] = useState<any>(() => {
    if (initialData?.markingScheme) {
      const items: any = {};
      initialData.markingScheme.forEach((section: any) => {
        items[section.section] = section.items;
      });
      return items;
    }
    return {};
  });
  const [osceCustomSections, setOsceCustomSections] = useState<string[]>(() => {
    if (initialData?.markingScheme) {
      return initialData.markingScheme
        .filter((section: any) => !getDefaultSections(initialData.type || 'history').includes(section.section))
        .map((section: any) => section.section);
    }
    return [];
  });
  const [osceFollowUps, setOsceFollowUps] = useState<{ question: string; answers: string[] }[]>(() => {
    if (initialData?.followUps) {
      // Handle migration from old format to new format
      return initialData.followUps.map((fu: any) => {
        if (fu.answers) {
          return fu; // Already in new format
        } else if (fu.answer) {
          return { question: fu.question, answers: [fu.answer] }; // Migrate from old format
        } else {
          return { question: fu.question, answers: [''] };
        }
      });
    }
    return [{ question: '', answers: [''] }, { question: '', answers: [''] }, { question: '', answers: [''] }];
  });
  const [osceImagePreviews, setOsceImagePreviews] = useState<string[]>(initialData?.images || []);
  const [osceErrors, setOsceErrors] = useState<any>({});

  // Update state if initialData changes (for modal re-open)
  useEffect(() => {
    if (initialData) {
      setOsceTitle(initialData.title || '');
      setOsceType(initialData.type || 'history');
      setOsceCategory(initialData.category || Object.keys(subjectsStructure)[0] || '');
      setOsceSubject(initialData.subject || '');
      setOsceTopic(initialData.topic || '');
      setOsceSubtopic(initialData.subtopic || '');
      setOsceCase(initialData.caseDescription || '');
      setOsceHistorySections(initialData.historySections || {});
      setOsceMarkItems(() => {
        if (initialData.markingScheme) {
          const items: any = {};
          initialData.markingScheme.forEach((section: any) => {
            items[section.section] = section.items;
          });
          return items;
        }
        return {};
      });
      setOsceCustomSections(() => {
        if (initialData.markingScheme) {
          return initialData.markingScheme
            .filter((section: any) => !getDefaultSections(initialData.type || 'history').includes(section.section))
            .map((section: any) => section.section);
        }
        return [];
      });
      setOsceFollowUps(() => {
        if (initialData.followUps) {
          return initialData.followUps.map((fu: any) => {
            if (fu.answers) {
              return fu;
            } else if (fu.answer) {
              return { question: fu.question, answers: [fu.answer] };
            } else {
              return { question: fu.question, answers: [''] };
            }
          });
        }
        return [{ question: '', answers: [''] }, { question: '', answers: [''] }, { question: '', answers: [''] }];
      });
      setOsceImagePreviews(initialData.images || []);
    }
  }, [initialData]);

  // Add all handlers for marking scheme, follow-ups, images
  const addCustomSection = () => setOsceCustomSections([...osceCustomSections, '']);
  const updateCustomSection = (idx: number, val: string) => setOsceCustomSections((cs: string[]) => cs.map((s: string, i: number) => i === idx ? val : s));
  const removeCustomSection = (idx: number) => {
    const section = osceCustomSections[idx];
    setOsceCustomSections(cs => cs.filter((_, i) => i !== idx));
    setOsceMarkItems((items: any) => {
      const newItems = { ...items };
      delete newItems[section];
      return newItems;
    });
  };
  const addMarkItem = (section: string) => setOsceMarkItems((items: any) => ({ ...items, [section]: [...(items[section] || []), { desc: '', score: '' }] }));
  const updateMarkItem = (section: string, idx: number, field: 'desc' | 'score', val: string) => setOsceMarkItems((items: any) => ({ ...items, [section]: items[section].map((item: any, i: number) => i === idx ? { ...item, [field]: val } : item) }));
  const removeMarkItem = (section: string, idx: number) => setOsceMarkItems((items: any) => ({ ...items, [section]: items[section].filter((_: any, i: number) => i !== idx) }));
  const addFollowUp = () => setOsceFollowUps([...osceFollowUps, { question: '', answers: [''] }]);
  const removeFollowUp = (idx: number) => setOsceFollowUps(fqs => fqs.filter((_, i) => i !== idx));
  const updateFollowUp = (idx: number, field: 'question' | 'answers', val: string | string[]) => setOsceFollowUps(fqs => fqs.map((fq, i) => i === idx ? { ...fq, [field]: val } : fq));
  
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
  const handleOsceImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newPreviews: string[] = [];
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => {
        if (ev.target?.result) setOsceImagePreviews(prev => [...prev, ev.target!.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Validation and submit logic
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
    if (osceFollowUps.filter(q => q.question.trim() && q.answers.some(a => a.trim())).length < 3) errs.followUps = 'At least 3 follow-up questions and answers are required.';
    osceFollowUps.forEach((q, idx) => {
      if (q.question.trim() && !q.answers.some(a => a.trim())) errs[`followup_answer_${idx}`] = 'Answer is required.';
      if (!q.question.trim() && q.answers.some(a => a.trim())) errs[`followup_question_${idx}`] = 'Question is required.';
    });
    setOsceErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateOsce()) return;
    const payload: any = {
      category: osceCategory,
      subject: osceSubject,
      topic: osceTopic,
      subtopic: osceSubtopic,
      title: osceTitle,
      type: osceType,
      caseDescription: osceCase,
      historySections: osceType === 'history' ? osceHistorySections : undefined,
      markingScheme: [
        ...getDefaultSections(osceType).map(section => ({
          section,
          items: (osceMarkItems[section] || []).map((i: any) => ({ desc: i.desc, score: Number(i.score) }))
        })),
        ...osceCustomSections.filter(Boolean).map(section => ({
          section,
          items: (osceMarkItems[section] || []).map((i: any) => ({ desc: i.desc, score: Number(i.score) }))
        }))
      ],
      followUps: osceFollowUps.filter(q => q.question.trim() && q.answers.some(a => a.trim())),
      images: osceImagePreviews,
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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
              {Object.keys(subjectsStructure).map(cat => <option key={cat} value={cat}>{cat}</option>)}
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
                  onChange={e => setOsceHistorySections((s: any) => ({ ...s, [key]: e.target.value }))}
                  className="w-full px-4 py-2 border rounded-lg min-h-[60px] bg-white text-gray-900 focus:ring-2 focus:ring-blue-300"
                />
                {osceErrors[`history_${key}`] && <p className="text-red-500 text-sm mt-1">{osceErrors[`history_${key}`]}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
      {/* Marking Scheme Section */}
      <div className="bg-gray-50 rounded-xl p-6 shadow-sm mb-4">
        <h3 className="text-lg font-bold mb-4 text-green-700">Marking Scheme</h3>
        <div className="space-y-4">
          {/* Fixed sections */}
          {getDefaultSections(osceType).map(section => (
            <div key={section} className="border rounded-lg p-4 bg-white">
              <div className="font-semibold mb-2">Section: {section}</div>
              {(osceMarkItems[section] || []).map((item: any, idx: number) => (
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
              {(osceMarkItems[section] || []).map((item: any, idx: number) => (
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
              {osceFollowUps.length > 3 && (
                <button type="button" onClick={() => removeFollowUp(idx)} className="text-red-500 self-center px-2 py-1 text-sm">Remove Question</button>
              )}
            </div>
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
        <button type="button" onClick={addFollowUp} className="text-blue-600 text-sm">+ Add Follow-up Question</button>
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
      <div className="flex justify-end gap-4 mt-8">
        <button type="button" className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition text-lg" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="bg-primary text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-dark transition text-lg" disabled={loading}>{loading ? 'Saving...' : saveLabel || (mode === 'edit' ? 'Save' : 'Submit')}</button>
      </div>
      {error && <div className="text-red-500 text-center mt-2">{error}</div>}
    </form>
  );
};

export default OsceStationForm; 