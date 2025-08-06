import React from 'react';
import { subjectsStructure } from '../utils/subjectsStructure';
import { API_BASE_URL } from '../config/api';
import { apiPatch } from '../utils/api';


function AdminEditQuestionForm({ submission, onClose, onSave }: { submission: any, onClose: () => void, onSave: (updated: any) => void }) {
  const [form, setForm] = React.useState<any>({
    ...submission,
    difficulty: typeof submission.difficulty === 'string' ? submission.difficulty : 'normal',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');
  const [editCategory, setEditCategory] = React.useState(form.category || '');
  const [editSubject, setEditSubject] = React.useState(form.subject || '');
  const [editTopic, setEditTopic] = React.useState(form.topic || '');
  const [editSubtopic, setEditSubtopic] = React.useState(form.subtopic || '');

  const handleChange = (field: string, value: any) => {
    setForm((f: any) => ({ ...f, [field]: value }));
  };
  const handleCategoryChange = (value: string) => {
    setEditCategory(value);
    setEditSubject('');
    setEditTopic('');
    setEditSubtopic('');
    setForm((f: any) => ({ ...f, category: value, subject: '', topic: '', subtopic: '' }));
  };
  const handleSubjectChange = (value: string) => {
    setEditSubject(value);
    setEditTopic('');
    setEditSubtopic('');
    setForm((f: any) => ({ ...f, subject: value, topic: '', subtopic: '' }));
  };
  const handleTopicChange = (value: string) => {
    setEditTopic(value);
    setEditSubtopic('');
    setForm((f: any) => ({ ...f, topic: value, subtopic: '' }));
  };
  const handleSubtopicChange = (value: string) => {
    setEditSubtopic(value);
    setForm((f: any) => ({ ...f, subtopic: value }));
  };
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        category: editCategory,
        subject: editSubject,
        topic: editTopic,
        subtopic: editSubtopic,
        question: form.question,
        choices: form.choices,
        explanations: form.explanations,
        reference: form.reference,
        difficulty: form.difficulty,
      };
      const updated = await apiPatch(`/api/submissions/${form._id}`, payload);
      onSave(updated);
    } catch (err: any) {
      setError(err.message || 'Network error');
    }
    setSaving(false);
  };
  return (
    <form className="space-y-4" onSubmit={e => { e.preventDefault(); handleSave(); }}>
      <div>
        <label className="block mb-1 font-medium">Category</label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          value={editCategory}
          onChange={e => handleCategoryChange(e.target.value)}
        >
          <option value="">Select Category</option>
          {Object.keys(subjectsStructure).map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Subject</label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          value={editSubject}
          onChange={e => handleSubjectChange(e.target.value)}
          disabled={!editCategory}
        >
          <option value="">Select Subject</option>
          {editCategory && Object.keys((subjectsStructure as Record<string, any>)[editCategory] || {}).map(subj => (
            <option key={subj} value={subj}>{subj}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Topic</label>
        <select
          className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
          value={editTopic}
          onChange={e => handleTopicChange(e.target.value)}
          disabled={!editSubject}
        >
          <option value="">Select Topic</option>
          {editCategory && editSubject && (
            Array.isArray(((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject])
              ? ((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject].map((topic: string) => (
                  <option key={topic} value={topic}>{topic}</option>
                ))
              : Object.keys(((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject] || {}).map(topic => (
                  <option key={topic} value={topic}>{topic}</option>
                ))
          )}
        </select>
      </div>
      {editCategory && editSubject && editTopic && Array.isArray((((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject] as Record<string, any>)[editTopic]) && (
        <div>
          <label className="block mb-1 font-medium">Subtopic</label>
          <select
            className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900"
            value={editSubtopic}
            onChange={e => handleSubtopicChange(e.target.value)}
          >
            <option value="">Select Subtopic</option>
            {(((subjectsStructure as Record<string, any>)[editCategory] as Record<string, any>)[editSubject] as Record<string, any>)[editTopic].map((sub: string) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="block mb-1 font-medium">Question</label>
        <textarea value={form.question} onChange={e => handleChange('question', e.target.value)} className="w-full px-4 py-2 border rounded-lg min-h-[80px] bg-white text-gray-900" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Choices (A–E)</label>
        {Array.from({ length: 5 }).map((_, i) => (
          <input
            key={i}
            value={form.choices[i] || ''}
            onChange={e => handleChange('choices', form.choices.map((v: string, idx: number) => idx === i ? e.target.value : v))}
            className="w-full px-4 py-2 border rounded-lg mb-2 bg-white text-gray-900"
            placeholder={`Choice ${String.fromCharCode(65 + i)}`}
          />
        ))}
      </div>
      <div>
        <label className="block mb-1 font-medium">Explanations (A–E)</label>
        {Array.from({ length: 5 }).map((_, i) => (
          <input
            key={i}
            value={form.explanations[i] || ''}
            onChange={e => handleChange('explanations', form.explanations.map((v: string, idx: number) => idx === i ? e.target.value : v))}
            className="w-full px-4 py-2 border rounded-lg mb-2 bg-white text-gray-900"
            placeholder={`Explain Choice ${String.fromCharCode(65 + i)}`}
          />
        ))}
      </div>
      <div>
        <label className="block mb-1 font-medium">Reference</label>
        <input value={form.reference} onChange={e => handleChange('reference', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900" />
      </div>
      <div>
        <label className="block mb-1 font-medium">Difficulty</label>
        <select value={form.difficulty || 'normal'} onChange={e => handleChange('difficulty', e.target.value)} className="w-full px-4 py-2 border rounded-lg bg-white text-gray-900">
          <option value="easy">Easy</option>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <div>
        <label className="block mb-1 font-medium">Images</label>
        {form.images && form.images.length > 0 ? (
          <div className="flex gap-2 flex-wrap mt-2">
            {form.images.map((img: string, idx: number) => (
              <img
                key={idx}
                src={`${API_BASE_URL}${img}`}
                alt={`submission-img-${idx}`}
              />
            ))}
          </div>
        ) : <div className="text-gray-400">No images</div>}
      </div>
      {error && <div className="text-red-500 text-center">{error}</div>}
      <div className="flex justify-end gap-2 mt-6">
        <button type="button" className="bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold" onClick={onClose} disabled={saving}>Cancel</button>
        <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-dark transition" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      </div>
    </form>
  );
}

export default AdminEditQuestionForm; 