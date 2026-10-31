/**
 * CBC (Competency-Based Curriculum) workspace data model.
 *
 * Reference curriculum data (grades, learning areas, strands, outcomes) is
 * seeded from `curriculum-seed.ts`. Operational data (classes, learners,
 * schemes, marks, attendance) is persisted per-collection in data/cbc/*.json.
 */

/* --------------------------- reference curriculum -------------------------- */

export type GradeId =
  | "pp1" | "pp2"
  | "g1" | "g2" | "g3"
  | "g4" | "g5" | "g6"
  | "g7" | "g8" | "g9"
  | "g10" | "g11" | "g12";

export type GradeBand =
  | "Pre-Primary"
  | "Lower Primary"
  | "Upper Primary"
  | "Junior School"
  | "Senior School";

export type SeniorPathway = "STEM" | "Arts & Sports Science" | "Social Sciences";

export interface CurriculumOutcome {
  /** e.g. "4.1.2" — learning outcome code within the strand/substrand. */
  code: string;
  outcome: string;
  /** Core competencies developed (Kenya's key competencies list). */
  competencies: string[];
}

export interface Substrand {
  id: string;
  name: string;
  outcomes: CurriculumOutcome[];
}

export interface Strand {
  id: string;
  name: string;
  substrands: Substrand[];
}

export interface LearningArea {
  id: string;
  name: string;
  /** Senior School only — which pathway offers this learning area. */
  pathway?: SeniorPathway;
  strands: Strand[];
}

export interface CurriculumGrade {
  id: GradeId;
  label: string;
  band: GradeBand;
  pathway?: SeniorPathway;
  learningAreas: LearningArea[];
}

/* ------------------------------ school records ----------------------------- */

export interface AcademicYear {
  id: string;
  label: string; // "2026"
  active: boolean;
}

export interface SchoolTerm {
  id: string;
  yearId: string;
  label: string; // "Term 1"
  number: 1 | 2 | 3;
  weeks: number;
  active: boolean;
}

export interface CbcClass {
  id: string;
  name: string; // "Grade 4 Blue"
  gradeId: GradeId;
  yearId: string;
  /** Staff username of the class teacher. */
  teacher: string;
  active: boolean;
}

export interface Learner {
  id: string;
  admissionNo: string;
  fullName: string;
  gradeId: GradeId;
  classId: string;
  yearId: string;
  active: boolean;
  /** Minimal guardian data — treat as confidential (children's data). */
  guardianName?: string;
  guardianPhone?: string;
}

/* ------------------------------ teaching tools ----------------------------- */

export interface SchemeWeek {
  week: number;
  strandId: string;
  substrandId: string;
  /** Outcome codes covered this week. */
  outcomes: string[];
  learningExperiences: string;
  resources: string;
  assessmentPlan: string;
}

export interface SchemeOfWork {
  id: string;
  classId: string;
  learningAreaId: string;
  termId: string;
  weeks: SchemeWeek[];
  createdBy: string;
  updatedAt: string;
}

export interface LessonPlan {
  id: string;
  classId: string;
  learningAreaId: string;
  termId: string;
  date: string; // ISO date
  week: number;
  topic: string;
  substrandId: string;
  outcomes: string[];
  learningObjectives: string;
  introduction: string;
  development: string;
  closure: string;
  resources: string;
  assessment: string;
  reflection: string;
  status: "draft" | "final";
  createdBy: string;
  updatedAt: string;
}

/* -------------------------------- assessment ------------------------------- */

export type CompetencyLevel = "beginning" | "emerging" | "expected" | "exceeding";

export const COMPETENCY_LEVELS: { id: CompetencyLevel; label: string; min: number }[] = [
  { id: "beginning", label: "Beginning", min: 0 },
  { id: "emerging", label: "Emerging", min: 25 },
  { id: "expected", label: "Expected", min: 50 },
  { id: "exceeding", label: "Exceeding Expectations", min: 75 },
];

export interface RubricLevel {
  level: CompetencyLevel;
  descriptor: string;
}

export interface Rubric {
  id: string;
  name: string;
  learningAreaId: string;
  levels: RubricLevel[];
  createdBy: string;
}

export interface Assessment {
  id: string;
  title: string;
  classId: string;
  learningAreaId: string;
  termId: string;
  type: "formative" | "summative";
  /** Outcome codes this assessment covers. */
  outcomes: string[];
  date: string;
  maxScore: number;
  rubricId?: string;
  status: "draft" | "published";
  createdBy: string;
  updatedAt: string;
}

export interface MarkEntry {
  id: string;
  assessmentId: string;
  learnerId: string;
  score: number | null;
  level: CompetencyLevel | null;
  feedback: string;
  draft: boolean;
  recordedBy: string;
  updatedAt: string;
}

export interface LearnerObservation {
  id: string;
  learnerId: string;
  classId: string;
  date: string;
  learningAreaId: string;
  outcomeCode: string;
  level: CompetencyLevel;
  note: string;
  recordedBy: string;
}

/* ------------------------------- attendance -------------------------------- */

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceDay {
  id: string;
  classId: string;
  date: string; // ISO date
  entries: { learnerId: string; status: AttendanceStatus; note?: string }[];
  recordedBy: string;
  updatedAt: string;
}

/* --------------------------------- reports --------------------------------- */

export interface ReportCard {
  id: string;
  learnerId: string;
  termId: string;
  status: "draft" | "approved";
  /** Free-text teacher comment per learning area. */
  comments: { learningAreaId: string; comment: string }[];
  classTeacherComment: string;
  headTeacherComment: string;
  approvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------- test papers ------------------------------- */

export type QuestionType = "mcq" | "truefalse" | "fill" | "short" | "structured" | "essay";

export const QUESTION_TYPES: { id: QuestionType; label: string; hint: string }[] = [
  { id: "mcq", label: "Multiple choice", hint: "4 options, one correct" },
  { id: "truefalse", label: "True / False", hint: "two statements" },
  { id: "fill", label: "Fill in the blank", hint: "complete the sentence" },
  { id: "short", label: "Short answer", hint: "one or two sentences" },
  { id: "structured", label: "Structured", hint: "calculation / worked steps" },
  { id: "essay", label: "Extended response", hint: "paragraph answer" },
];

export type PaperKind = "quiz" | "test" | "exam";

export const PAPER_KINDS: { id: PaperKind; label: string; defaultMins: number }[] = [
  { id: "quiz", label: "Quiz", defaultMins: 20 },
  { id: "test", label: "Class test", defaultMins: 40 },
  { id: "exam", label: "Exam", defaultMins: 90 },
];

export type PaperDifficulty = "foundational" | "balanced" | "challenging";

export const PAPER_DIFFICULTIES: { id: PaperDifficulty; label: string }[] = [
  { id: "foundational", label: "Foundational" },
  { id: "balanced", label: "Balanced" },
  { id: "challenging", label: "Challenging" },
];

export interface TestQuestion {
  /** 1-based position in the paper (assigned when the paper is built). */
  number: number;
  type: QuestionType;
  marks: number;
  text: string;
  /** Multiple choice only — the correct entry is spelled out in `answer`. */
  options?: string[];
  /** Marking guide: the correct option, or points to award. */
  answer: string;
}

export interface TestPaper {
  id: string;
  title: string;
  kind: PaperKind;
  gradeId: GradeId;
  /** "" when the paper is not tied to one class. */
  classId: string;
  learningAreaId: string;
  termId: string;
  durationMins: number;
  difficulty: PaperDifficulty;
  /** Instructions printed under the paper heading. */
  instructions: string;
  questions: TestQuestion[];
  /** Sum of question marks — always recomputed, never trusted from the client. */
  totalMarks: number;
  materialId?: string;
  materialTitle: string;
  /** AI model that drafted it ("" for a paper written by hand). */
  model: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/** A paper the API returns before the data store stamps id/owner/timestamps. */
export type NewTestPaper = Omit<TestPaper, "id" | "createdBy" | "createdAt" | "updatedAt">;

/** Teacher notes a paper is generated from (kept so it can be reused). */
export interface StudyMaterial {
  id: string;
  title: string;
  classId: string;
  gradeId: GradeId;
  learningAreaId: string;
  termId: string;
  notes: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------- API shapes -------------------------------- */

export interface CbcDataSnapshot {
  years: AcademicYear[];
  terms: SchoolTerm[];
  classes: CbcClass[];
  learners: Learner[];
  schemes: SchemeOfWork[];
  lessons: LessonPlan[];
  rubrics: Rubric[];
  assessments: Assessment[];
  marks: MarkEntry[];
  observations: LearnerObservation[];
  attendance: AttendanceDay[];
  reports: ReportCard[];
  materials: StudyMaterial[];
  papers: TestPaper[];
}

export type CbcCollection = keyof CbcDataSnapshot;

export const CBC_COLLECTIONS: CbcCollection[] = [
  "years", "terms", "classes", "learners", "schemes", "lessons",
  "rubrics", "assessments", "marks", "observations", "attendance", "reports",
  "materials", "papers",
];

/** Collections only cbc:manage holders may write (school-wide settings). */
export const ADMIN_ONLY_COLLECTIONS: CbcCollection[] = ["years", "terms"];
