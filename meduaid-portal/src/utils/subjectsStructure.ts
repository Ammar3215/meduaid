import { basicSciencesStructure } from './basicSciencesStructure';
import { clinicalSciencesStructure } from './clinicalSciencesStructure';

function convertClinicalStructureToObject() {
  const result: Record<string, any> = {};
  for (const subject of clinicalSciencesStructure[0].children) {
    const subjectName = subject.subject;
    result[subjectName] = {};
    for (const topic of subject.children) {
      if (topic.children && topic.children.length > 0) {
        result[subjectName][topic.topic] = topic.children.map((sub: any) => sub.subtopic || sub.detail);
      } else {
        result[subjectName][topic.topic] = [];
      }
    }
  }
  return result;
}

export const subjectsStructure = {
  'Basic Sciences': basicSciencesStructure,
  'Clinical Sciences': convertClinicalStructureToObject(),
};

export type SubjectsStructureType = typeof subjectsStructure; 