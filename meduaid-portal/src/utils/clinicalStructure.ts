export const clinicalStructure = {
  'Basic Sciences': {
    Anatomy: {
      Bones: ['Skull', 'Femur', 'Vertebrae'],
      Muscles: ['Biceps', 'Triceps'],
    },
    Physiology: {
      Cardiac: ['Heart Cycle', 'ECG'],
      Renal: ['Nephron', 'Filtration'],
    },
  },
  'Clinical Sciences': {
    Medicine: {
      Cardiology: ['Arrhythmia', 'Heart Failure'],
      Neurology: ['Stroke', 'Epilepsy'],
    },
    Surgery: {
      Orthopedics: ['Fractures', 'Arthritis'],
      Neurosurgery: ['Tumors', 'Trauma'],
    },
  },
};

export type ClinicalStructureType = typeof clinicalStructure; 