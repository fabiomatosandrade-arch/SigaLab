
export interface User {
  id: string;
  name: string;
  birthDate: string;
  email: string;
  username: string;
  password?: string;
  salt?: string;
  preExistingConditions: string;
}

export interface SigtapProcedure {
  code: string;
  name: string;
  referenceRange: string;
  unit: string;
}

export interface LabExam {
  id: string;
  userId: string;
  examName: string;
  sigtapCode: string;
  value: number;
  unit?: string;
  referenceRange: string;
  laboratory: string;
  requestingDoctor: string;
  date: string;
  notes?: string;
}

export interface Filters {
  examName: string;
  laboratory: string;
  requestingDoctor: string;
  startDate: string;
  endDate: string;
}
