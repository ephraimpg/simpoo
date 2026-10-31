import type { CurriculumGrade, LearningArea } from "./types";

/**
 * Seed curriculum reference data.
 *
 * Mirrors the publicly documented structure of Kenya's Competency-Based
 * Curriculum (KICD curriculum designs): learning areas, strands, substrands
 * and outcome codes per band. It is a working reference for planning schemes
 * and lessons — always confirm exact wording against the official KICD
 * curriculum designs / teacher's manuals before classroom use. School
 * administrators can extend it via the CBC workspace.
 */

/* ------------------------------- Pre-Primary ------------------------------- */

const PP_LEARNING_AREAS: LearningArea[] = [
  {
    id: "pp-math",
    name: "Mathematical Activities",
    strands: [
      {
        id: "pp-numbers",
        name: "Numbers",
        substrands: [
          {
            id: "pp-counting",
            name: "Counting",
            outcomes: [
              { code: "PP.1.1", outcome: "Count numbers 1–10 in daily life situations", competencies: ["Critical Thinking and Problem Solving"] },
              { code: "PP.1.2", outcome: "Count numbers 11–20 in daily life situations", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "pp-measurement",
        name: "Measurement",
        substrands: [
          {
            id: "pp-compare",
            name: "Comparison",
            outcomes: [
              { code: "PP.2.1", outcome: "Compare objects according to length, mass and capacity", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pp-language",
    name: "Language Activities",
    strands: [
      {
        id: "pp-listening",
        name: "Listening and Speaking",
        substrands: [
          {
            id: "pp-sound-awareness",
            name: "Sound Awareness",
            outcomes: [
              { code: "PP.3.1", outcome: "Produce and discriminate speech sounds in words", competencies: ["Communication and Collaboration"] },
            ],
          },
        ],
      },
      {
        id: "pp-pre-writing",
        name: "Pre-writing and Pre-reading",
        substrands: [
          {
            id: "pp-motor-skills",
            name: "Motor Skills for Writing",
            outcomes: [
              { code: "PP.4.1", outcome: "Draw patterns and shapes in different directions preparing for writing", competencies: ["Imagination and Creativity"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pp-environmental",
    name: "Environmental Activities",
    strands: [
      {
        id: "pp-home-school",
        name: "Home and School Environment",
        substrands: [
          {
            id: "pp-familiar",
            name: "Familiar Objects and Animals",
            outcomes: [
              { code: "PP.5.1", outcome: "Identify and care for objects, plants and animals at home and school", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "pp-psychomotor",
    name: "Psychomotor and Creative Activities",
    strands: [
      {
        id: "pp-movement",
        name: "Movement Activities",
        substrands: [
          {
            id: "pp-game-skills",
            name: "Simple Game Skills",
            outcomes: [
              { code: "PP.6.1", outcome: "Perform locomotor movements safely in play", competencies: ["Self-efficacy"] },
            ],
          },
        ],
      },
    ],
  },
];

/* ------------------------------ Lower Primary ------------------------------ */

const LOWER_PRIMARY_AREAS: LearningArea[] = [
  {
    id: "lp-literacy",
    name: "Literacy Activities",
    strands: [
      {
        id: "lp-listening-speaking",
        name: "Listening and Speaking",
        substrands: [
          {
            id: "lp-vocabulary",
            name: "Vocabulary Development",
            outcomes: [
              { code: "1.1.1", outcome: "Use new vocabulary learned in different contexts", competencies: ["Communication and Collaboration"] },
            ],
          },
        ],
      },
      {
        id: "lp-reading",
        name: "Reading",
        substrands: [
          {
            id: "lp-pre-reading",
            name: "Pre-reading Skills",
            outcomes: [
              { code: "1.2.1", outcome: "Identify print in the environment during pre-reading activities", competencies: ["Learning to Learn"] },
            ],
          },
          {
            id: "lp-phonics",
            name: "Phonics",
            outcomes: [
              { code: "1.2.2", outcome: "Blend sounds to read words correctly", competencies: ["Learning to Learn"] },
            ],
          },
        ],
      },
      {
        id: "lp-writing",
        name: "Writing",
        substrands: [
          {
            id: "lp-handwriting",
            name: "Handwriting",
            outcomes: [
              { code: "1.3.1", outcome: "Write letters legibly in correct formation and size", competencies: ["Self-efficacy"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "lp-math",
    name: "Mathematical Activities",
    strands: [
      {
        id: "lp-numbers",
        name: "Numbers",
        substrands: [
          {
            id: "lp-natural-numbers",
            name: "Natural Numbers",
            outcomes: [
              { code: "1.4.1", outcome: "Count, read and write numbers up to 1000", competencies: ["Critical Thinking and Problem Solving"] },
              { code: "1.4.2", outcome: "Compare and order numbers up to 1000", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "lp-measurement",
        name: "Measurement",
        substrands: [
          {
            id: "lp-length",
            name: "Length",
            outcomes: [
              { code: "1.5.1", outcome: "Measure length using non-standard units", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
          {
            id: "lp-money",
            name: "Money",
            outcomes: [
              { code: "1.5.2", outcome: "Identify and use Kenyan currency notes and coins in daily life", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
      {
        id: "lp-geometry",
        name: "Geometry",
        substrands: [
          {
            id: "lp-plane-figures",
            name: "Plane Figures",
            outcomes: [
              { code: "1.6.1", outcome: "Identify, name and draw circles, squares, rectangles and triangles", competencies: ["Imagination and Creativity"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "lp-environmental",
    name: "Environmental Activities",
    strands: [
      {
        id: "lp-natural-environment",
        name: "Natural Environment",
        substrands: [
          {
            id: "lp-plants-animals",
            name: "Plants and Animals",
            outcomes: [
              { code: "1.7.1", outcome: "Identify common plants and animals in the local environment and describe their growth", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "lp-religious",
    name: "Religious Education Activities",
    strands: [
      {
        id: "lp-cre-family",
        name: "Family and Community",
        substrands: [
          {
            id: "lp-family-values",
            name: "Family Values",
            outcomes: [
              { code: "1.8.1", outcome: "Practise honesty, sharing and respect within the family", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
];

/* ------------------------------ Upper Primary ------------------------------ */

const UPPER_PRIMARY_AREAS: LearningArea[] = [
  {
    id: "up-english",
    name: "English",
    strands: [
      {
        id: "up-oral",
        name: "Oral Language",
        substrands: [
          {
            id: "up-listening-speaking",
            name: "Listening and Speaking",
            outcomes: [
              { code: "4.1.1", outcome: "Listen to and give oral reports on familiar topics confidently", competencies: ["Communication and Collaboration"] },
            ],
          },
        ],
      },
      {
        id: "up-reading",
        name: "Reading",
        substrands: [
          {
            id: "up-comprehension",
            name: "Comprehension",
            outcomes: [
              { code: "4.2.1", outcome: "Read and answer questions on graded passages", competencies: ["Learning to Learn"] },
            ],
          },
        ],
      },
      {
        id: "up-writing",
        name: "Writing",
        substrands: [
          {
            id: "up-grammar",
            name: "Grammar in Use",
            outcomes: [
              { code: "4.3.1", outcome: "Use tenses, punctuation and sentence structure correctly in writing", competencies: ["Communication and Collaboration"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "up-kiswahili",
    name: "Kiswahili",
    strands: [
      {
        id: "up-kis-mazungumzo",
        name: "Mazungumzo",
        substrands: [
          {
            id: "up-kis-kusikiliza",
            name: "Kusikiliza na Kuzungumza",
            outcomes: [
              { code: "4.4.1", outcome: "Wasilisha mada kwa kiswahili sanifu kwa ufasaha", competencies: ["Communication and Collaboration"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "up-math",
    name: "Mathematics",
    strands: [
      {
        id: "up-numbers",
        name: "Numbers",
        substrands: [
          {
            id: "up-natural-numbers",
            name: "Natural Numbers",
            outcomes: [
              { code: "4.5.1", outcome: "Work with place value of whole numbers up to 1,000,000", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
          {
            id: "up-fractions",
            name: "Fractions",
            outcomes: [
              { code: "4.5.2", outcome: "Compare, order and operate on fractions", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "up-measurement",
        name: "Measurement",
        substrands: [
          {
            id: "up-time-distance",
            name: "Time, Distance and Speed",
            outcomes: [
              { code: "4.6.1", outcome: "Calculate distance, speed and time in real-life problems", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "up-data",
        name: "Statistics",
        substrands: [
          {
            id: "up-data-handling",
            name: "Data Handling",
            outcomes: [
              { code: "4.7.1", outcome: "Collect, organise and present data in tables, bar graphs and pie charts", competencies: ["Digital Literacy"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "up-science",
    name: "Science and Technology",
    strands: [
      {
        id: "up-living-things",
        name: "Living Things",
        substrands: [
          {
            id: "up-classification",
            name: "Classification of Living Things",
            outcomes: [
              { code: "4.8.1", outcome: "Classify living things using observable characteristics", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "up-force",
        name: "Force and Energy",
        substrands: [
          {
            id: "up-simple-machines",
            name: "Simple Machines",
            outcomes: [
              { code: "4.9.1", outcome: "Identify and apply simple machines in daily life", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "up-social",
    name: "Social Studies",
    strands: [
      {
        id: "up-nation",
        name: "The Nation",
        substrands: [
          {
            id: "up-governance",
            name: "Governance",
            outcomes: [
              { code: "4.10.1", outcome: "Explain the systems of county and national government", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "up-agriculture",
    name: "Agriculture and Nutrition",
    strands: [
      {
        id: "up-crops",
        name: "Crop Production",
        substrands: [
          {
            id: "up-crop-care",
            name: "Crop Care",
            outcomes: [
              { code: "4.11.1", outcome: "Practise soil and crop care methods suitable for the local area", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
];

/* ------------------------------- Junior School ------------------------------ */

const JUNIOR_SCHOOL_AREAS: LearningArea[] = [
  {
    id: "js-integrated-science",
    name: "Integrated Science",
    strands: [
      {
        id: "js-matter",
        name: "Matter and Its Interactions",
        substrands: [
          {
            id: "js-properties-matter",
            name: "Properties of Matter",
            outcomes: [
              { code: "7.1.1", outcome: "Investigate properties and changes of matter using scientific inquiry skills", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "js-living",
        name: "Living Things and Their Environment",
        substrands: [
          {
            id: "js-cell",
            name: "Cell Structure and Function",
            outcomes: [
              { code: "7.2.1", outcome: "Observe and describe cell structures using a microscope", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "js-math",
    name: "Mathematics",
    strands: [
      {
        id: "js-numbers",
        name: "Numbers",
        substrands: [
          {
            id: "js-integers",
            name: "Integers and Rational Numbers",
            outcomes: [
              { code: "7.3.1", outcome: "Operate on integers and rational numbers in real-life contexts", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "js-algebra",
        name: "Algebra",
        substrands: [
          {
            id: "js-linear-expressions",
            name: "Linear Expressions and Equations",
            outcomes: [
              { code: "7.4.1", outcome: "Form and solve linear equations in two variables", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
      {
        id: "js-geometry",
        name: "Geometry",
        substrands: [
          {
            id: "js-angles-lines",
            name: "Angles and Straight Lines",
            outcomes: [
              { code: "7.5.1", outcome: "Apply properties of angles and lines to solve problems", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "js-pretechnical",
    name: "Pre-Technical Studies",
    strands: [
      {
        id: "js-technical-drawing",
        name: "Technical Drawing",
        substrands: [
          {
            id: "js-projection",
            name: "Orthographic Projection",
            outcomes: [
              { code: "7.6.1", outcome: "Draw orthographic projections of simple objects", competencies: ["Imagination and Creativity"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "js-social",
    name: "Social Studies",
    strands: [
      {
        id: "js-history",
        name: "History",
        substrands: [
          {
            id: "js-community-history",
            name: "Community History",
            outcomes: [
              { code: "7.7.1", outcome: "Trace the history of the local community using oral and written sources", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "js-business",
    name: "Business Studies",
    strands: [
      {
        id: "js-intro-business",
        name: "Introduction to Business",
        substrands: [
          {
            id: "js-business-activities",
            name: "Business Activities",
            outcomes: [
              { code: "7.8.1", outcome: "Distinguish between goods and services and classify business activities", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
];

/* ------------------------------- Senior School ------------------------------ */

const SENIOR_STEM: LearningArea[] = [
  {
    id: "ss-math",
    name: "Mathematics",
    pathway: "STEM",
    strands: [
      {
        id: "ss-pure-math",
        name: "Pure Mathematics",
        substrands: [
          {
            id: "ss-functions",
            name: "Functions",
            outcomes: [
              { code: "10.1.1", outcome: "Analyse and apply quadratic, exponential and trigonometric functions", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ss-physics",
    name: "Physics",
    pathway: "STEM",
    strands: [
      {
        id: "ss-mechanics",
        name: "Mechanics",
        substrands: [
          {
            id: "ss-linear-motion",
            name: "Linear Motion",
            outcomes: [
              { code: "10.2.1", outcome: "Solve problems involving linear motion using equations of motion", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ss-chemistry",
    name: "Chemistry",
    pathway: "STEM",
    strands: [
      {
        id: "ss-organic",
        name: "Organic Chemistry",
        substrands: [
          {
            id: "ss-hydrocarbons",
            name: "Hydrocarbons",
            outcomes: [
              { code: "10.3.1", outcome: "Describe the structure, preparation and properties of hydrocarbons", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ss-biology",
    name: "Biology",
    pathway: "STEM",
    strands: [
      {
        id: "ss-genetics",
        name: "Genetics",
        substrands: [
          {
            id: "ss-inheritance",
            name: "Inheritance",
            outcomes: [
              { code: "10.4.1", outcome: "Explain Mendelian inheritance and variation in organisms", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
];

const SENIOR_ARTS_SPORTS: LearningArea[] = [
  {
    id: "ss-sports",
    name: "Sports and Recreation",
    pathway: "Arts & Sports Science",
    strands: [
      {
        id: "ss-sports-science",
        name: "Sports Science",
        substrands: [
          {
            id: "ss-physiology",
            name: "Exercise Physiology",
            outcomes: [
              { code: "10.5.1", outcome: "Apply principles of exercise physiology to training programmes", competencies: ["Self-efficacy"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ss-performing-arts",
    name: "Performing Arts",
    pathway: "Arts & Sports Science",
    strands: [
      {
        id: "ss-theatre",
        name: "Theatre and Film",
        substrands: [
          {
            id: "ss-acting",
            name: "Acting Techniques",
            outcomes: [
              { code: "10.6.1", outcome: "Demonstrate acting techniques in theatrical productions", competencies: ["Imagination and Creativity"] },
            ],
          },
        ],
      },
    ],
  },
];

const SENIOR_SOCIAL_SCIENCES: LearningArea[] = [
  {
    id: "ss-history-citizenship",
    name: "History and Citizenship",
    pathway: "Social Sciences",
    strands: [
      {
        id: "ss-modern-history",
        name: "Modern History",
        substrands: [
          {
            id: "ss-decolonisation",
            name: "Decolonisation in Africa",
            outcomes: [
              { code: "10.7.1", outcome: "Analyse factors that led to decolonisation in Africa", competencies: ["Citizenship"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ss-geography",
    name: "Geography",
    pathway: "Social Sciences",
    strands: [
      {
        id: "ss-population",
        name: "Population and Settlement",
        substrands: [
          {
            id: "ss-population-trends",
            name: "Population Trends",
            outcomes: [
              { code: "10.8.1", outcome: "Interpret population data and explain migration trends", competencies: ["Digital Literacy"] },
            ],
          },
        ],
      },
    ],
  },
  {
    id: "ss-business",
    name: "Business Studies",
    pathway: "Social Sciences",
    strands: [
      {
        id: "ss-financial-accounts",
        name: "Financial Accounting",
        substrands: [
          {
            id: "ss-books-of-account",
            name: "Books of Prime Entry",
            outcomes: [
              { code: "10.9.1", outcome: "Prepare and post entries from books of prime entry", competencies: ["Critical Thinking and Problem Solving"] },
            ],
          },
        ],
      },
    ],
  },
];

export const CURRICULUM_SEED: CurriculumGrade[] = [
  { id: "pp1", label: "Pre-Primary 1", band: "Pre-Primary", learningAreas: PP_LEARNING_AREAS },
  { id: "pp2", label: "Pre-Primary 2", band: "Pre-Primary", learningAreas: PP_LEARNING_AREAS },
  { id: "g1", label: "Grade 1", band: "Lower Primary", learningAreas: LOWER_PRIMARY_AREAS },
  { id: "g2", label: "Grade 2", band: "Lower Primary", learningAreas: LOWER_PRIMARY_AREAS },
  { id: "g3", label: "Grade 3", band: "Lower Primary", learningAreas: LOWER_PRIMARY_AREAS },
  { id: "g4", label: "Grade 4", band: "Upper Primary", learningAreas: UPPER_PRIMARY_AREAS },
  { id: "g5", label: "Grade 5", band: "Upper Primary", learningAreas: UPPER_PRIMARY_AREAS },
  { id: "g6", label: "Grade 6", band: "Upper Primary", learningAreas: UPPER_PRIMARY_AREAS },
  { id: "g7", label: "Grade 7", band: "Junior School", learningAreas: JUNIOR_SCHOOL_AREAS },
  { id: "g8", label: "Grade 8", band: "Junior School", learningAreas: JUNIOR_SCHOOL_AREAS },
  { id: "g9", label: "Grade 9", band: "Junior School", learningAreas: JUNIOR_SCHOOL_AREAS },
  { id: "g10", label: "Grade 10", band: "Senior School", pathway: "STEM", learningAreas: [...SENIOR_STEM, ...SENIOR_ARTS_SPORTS, ...SENIOR_SOCIAL_SCIENCES] },
  { id: "g11", label: "Grade 11", band: "Senior School", pathway: "STEM", learningAreas: [...SENIOR_STEM, ...SENIOR_ARTS_SPORTS, ...SENIOR_SOCIAL_SCIENCES] },
  { id: "g12", label: "Grade 12", band: "Senior School", pathway: "STEM", learningAreas: [...SENIOR_STEM, ...SENIOR_ARTS_SPORTS, ...SENIOR_SOCIAL_SCIENCES] },
];

/** Kenya's key competencies (KICD) — used in rubrics and reports. */
export const KEY_COMPETENCIES = [
  "Communication and Collaboration",
  "Critical Thinking and Problem Solving",
  "Imagination and Creativity",
  "Citizenship",
  "Digital Literacy",
  "Learning to Learn",
  "Self-efficacy",
];

export function gradeById(id: string): CurriculumGrade | undefined {
  return CURRICULUM_SEED.find((g) => g.id === id);
}

export function learningAreaById(gradeId: string, areaId: string): LearningArea | undefined {
  return gradeById(gradeId)?.learningAreas.find((a) => a.id === areaId);
}

/** Flattened outcome lookup across a learning area. */
export function outcomeByCode(gradeId: string, areaId: string, code: string) {
  for (const area of learningAreaById(gradeId, areaId)?.strands ?? []) {
    for (const sub of area.substrands) {
      const found = sub.outcomes.find((o) => o.code === code);
      if (found) return { strand: area, substrand: sub, outcome: found };
    }
  }
  return null;
}
