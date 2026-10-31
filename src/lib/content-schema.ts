export type GalleryCategory =
  | "classroom"
  | "science"
  | "sports"
  | "creativity"
  | "events"
  | "campus";

export const GALLERY_CATEGORIES: { id: GalleryCategory | "all"; label: string }[] = [
  { id: "all", label: "All photos" },
  { id: "classroom", label: "Classroom learning" },
  { id: "science", label: "Science activities" },
  { id: "sports", label: "Sports" },
  { id: "creativity", label: "Creativity" },
  { id: "events", label: "School events" },
  { id: "campus", label: "Campus" },
];

export interface GalleryItem {
  id: string;
  title: string;
  category: GalleryCategory;
  /** Public path to a real photograph (e.g. "/gallery/j1.jpg"), or null when only an illustrated placeholder exists. */
  src: string | null;
  alt: string;
  caption: string;
  /** True when the tile is an illustrated placeholder rather than a real school photograph. */
  isPlaceholder: boolean;
  /** Must be true before publishing any photograph showing identifiable children. */
  consentConfirmed: boolean;
  published: boolean;
  sortOrder: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  active: boolean;
}

export interface SchoolContent {
  site: {
    name: string;
    tagline: string;
    /** Published telephone numbers (verified). */
    phones: string[];
    /** Published email address (verified). */
    email: string;
    /** Reported postal address — flagged for verification. */
    postalAddress: string;
    /** Official WhatsApp number. null = hidden (never guess). */
    whatsapp: string | null;
    /** Absolute site URL used for SEO metadata; set via NEXT_PUBLIC_SITE_URL. */
    url: string;
  };
  home: {
    headline: string;
    supporting: string;
  };
  about: {
    introduction: string;
    history: string;
    philosophy: string;
    vision: string;
    mission: string;
    values: { title: string; description: string }[];
    leadership: { name: string; role: string; bio: string }[];
  };
  academics: {
    curriculumStatement: string;
    gradesStatement: string;
    approach: string;
    learningAreas: { title: string; description: string }[];
    assessments: string;
    progression: string;
  };
  admissions: {
    intro: string;
    steps: { title: string; description: string }[];
    gradesOffered: string;
    documents: string[];
    visits: string;
    feesNote: string;
  };
  faqs: { question: string; answer: string }[];
  /** Co-curricular activities shown on the School Life page. */
  activities: { title: string; description: string }[];
  announcements: Announcement[];
  /** Empty until the school provides a verified fee structure. */
  fees: { label: string; value: string }[];
  gallery: GalleryItem[];
  lastUpdated: string;
}

export const defaultContent: SchoolContent = {
  site: {
    name: "Mainflow School",
    tagline: "Private school in Ngong, Kajiado County, Kenya",
    phones: ["0725 958 589", "0722 751 770"],
    email: "mainflowp@yahoo.com",
    postalAddress: "P.O. Box 1199, Ngong Hills, 00208",
    whatsapp: null,
    url: "https://mainflow-school.vercel.app",
  },
  home: {
    headline: "Building Bright Futures Through Learning",
    supporting:
      "Mainflow School in Ngong, Kajiado County, is dedicated to nurturing learners from early years through Grade 9 in a safe, caring and stimulating environment where every child is known, valued and encouraged to grow.",
  },
  about: {
    introduction:
      "Mainflow School is a private school located in Ngong, Kajiado County, Kenya. The school serves learners from the local community, from early years through Grade 9, and is committed to providing a strong academic foundation together with character development in a supportive, family-like environment.",
    history:
      "Mainflow School was established in Ngong, Kajiado County. Full details of the school's founding year, history and growth are being confirmed with the school administration and will be published here once verified.",
    philosophy:
      "We believe every child learns differently and thrives when teaching is patient, practical and personal. Our educational philosophy centres on strong foundations in literacy and numeracy, learning through doing, and partnering closely with families so that progress continues beyond the classroom.",
    vision: "To be a leading private school in Kajiado County, known for academic excellence, strong values and confident, well-rounded learners.",
    mission: "To provide quality, affordable and nurturing education that builds strong academic foundations, good character and a lifelong love of learning in every child.",
    values: [
      { title: "Integrity", description: "We help children grow into honest, responsible and dependable young people." },
      { title: "Excellence", description: "We set high expectations and support every learner to reach their personal best." },
      { title: "Discipline", description: "Self-discipline, respect and good manners are woven into daily school life." },
      { title: "Care", description: "Every child is known by name and treated with kindness and dignity." },
      { title: "Partnership", description: "We work hand in hand with parents and guardians as one team around each child." },
      { title: "Creativity", description: "Through art, music, play and problem solving, children learn to think for themselves." },
    ],
    leadership: [
      {
        name: "[Name to be confirmed]",
        role: "Head Teacher",
        bio: "A message from our Head Teacher will be published here once confirmed by the school administration. Please contact the school directly using the numbers on this site for any leadership enquiries.",
      },
    ],
  },
  academics: {
    curriculumStatement:
      "Mainflow School follows the Competency-Based Education (CBE) curriculum, focused on strong foundations in literacy, numeracy and environmental knowledge, with classes from early years through Grade 9. Parents are welcome to contact the school to learn more about how CBE is taught at each level.",
    gradesStatement:
      "Mainflow School offers classes from early years through Grade 9. Parents are invited to contact the school to confirm the specific classes currently open for admission this term.",
    approach:
      "Teaching at Mainflow combines clear, structured lessons with practical activities, group work and regular practice. Classes are kept manageable so that teachers can give personal attention, and constant assessment helps us identify learners who need extra support early.",
    learningAreas: [
      { title: "Mathematics", description: "Number work, measurement, geometry and problem solving taught through structured practice and real-life examples." },
      { title: "Languages", description: "English language reading, writing, listening and speaking skills, with Kiswahili support for young learners." },
      { title: "Science & Environment", description: "Hands-on exploration of living things, matter, forces and the environment through observation and simple experiments." },
      { title: "Creative Arts", description: "Art, craft, music and movement that build imagination, confidence and fine motor skills." },
      { title: "ICT & Digital Skills", description: "Age-appropriate introduction to computers and digital literacy to prepare learners for a modern world." },
      { title: "Physical Development", description: "Games, sport and outdoor play that build coordination, teamwork and healthy habits." },
    ],
    assessments:
      "Continuous assessment through classwork, homework, projects and terminal examinations keeps parents informed of progress. Reports are issued regularly and parents are invited to discuss their child's progress with teachers.",
    progression:
      "Learners who complete their studies at Mainflow — including Grade 9 — progress confidently to the next level of education with strong foundations in reading, writing, mathematics and study habits. The school advises families on the transition to secondary school.",
  },
  admissions: {
    intro:
      "We welcome enquiries from families seeking a caring, disciplined and academically strong school for their child. Admissions are handled directly by the school office — start by sending an enquiry and we will guide you through the next steps.",
    steps: [
      { title: "1. Send an enquiry", description: "Fill in the enquiry form on this page or call the school office on the numbers provided." },
      { title: "2. Visit the school", description: "Book a visit to see the school, meet the teachers and ask any questions you may have." },
      { title: "3. Collect the application form", description: "Obtain and complete the school's admission application form from the office." },
      { title: "4. Submit required documents", description: "Return the completed form together with the required documents listed below." },
      { title: "5. Confirmation & joining", description: "The school confirms placement, shares the fee structure and joining details with you." },
    ],
    gradesOffered:
      "Mainflow School admits learners from early years through Grade 9. Contact the school to confirm the specific classes currently open for admission.",
    documents: [
      "Birth certificate (copy)",
      "Previous school report card or transfer letter (where applicable)",
      "Immunization card (copy)",
      "Two passport-size photographs of the learner",
      "Parent/guardian national ID or passport (copy)",
      "Guardian's contact and emergency information",
    ],
    visits:
      "You are welcome to visit the school during working hours. Please call ahead so that a member of staff can receive you and show you around. Use the contact numbers on this page to arrange your visit.",
    feesNote:
      "The current fee structure is available from the school office. Please contact the school directly for the most up-to-date information on school fees, uniform costs and other requirements.",
  },
  faqs: [
    {
      question: "How do I apply for my child to join the school?",
      answer:
        "Send an enquiry through the admissions page of this website or call the school office. The school will guide you through the application steps, required documents and placement.",
    },
    {
      question: "What grades does the school offer?",
      answer:
        "Mainflow School offers classes from early years through Grade 9. Please contact the school office to confirm the classes currently open for admission.",
    },
    {
      question: "How much are the school fees?",
      answer:
        "The current fee structure is available from the school office. Please call or visit the school for the most up-to-date fee information.",
    },
    {
      question: "Can I visit the school before applying?",
      answer:
        "Yes. Parents and guardians are welcome to visit during working hours. Please call ahead so that a member of staff can receive you.",
    },
  ],
  activities: [
    { title: "Sports & Games", description: "Football, netball, athletics, ball games and team activities that build fitness, teamwork and the spirit of fair play." },
    { title: "Music & Dance", description: "Singing, rhythm and performance that build confidence, creativity and an appreciation of our cultural heritage." },
    { title: "Drama & Speech", description: "School plays, recitation and public speaking opportunities that help every learner find their voice." },
    { title: "Art & Craft", description: "Drawing, painting, modelling and handwork that nurture imagination, patience and fine motor skills." },
    { title: "ICT & Coding Club", description: "Age-appropriate computer practice and simple coding exercises that build digital confidence for the modern world." },
    { title: "Environmental Club", description: "Tree planting, cleanliness drives and nature projects that teach responsibility for our surroundings." },
    { title: "Reading & Debating Club", description: "Reading challenges, book clubs and friendly debates that sharpen comprehension, reasoning and confidence." },
    { title: "Innovation & Farming Club", description: "Simple gardening and hands-on projects that connect classroom learning with everyday life." },
  ],
  announcements: [
    {
      id: "welcome-2025",
      title: "Admissions enquiries welcome",
      body: "The school office is receiving enquiries from parents and guardians. Call 0725 958 589 or send an enquiry online.",
      active: true,
    },
  ],
  fees: [],
  gallery: [
    { id: "ph-classroom", title: "Classroom learning", category: "classroom", src: null, alt: "Illustrated placeholder for classroom learning photographs", caption: "Photograph to be added — classroom learning", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 1 },
    { id: "ph-reading", title: "Reading corner", category: "classroom", src: null, alt: "Illustrated placeholder for reading and literacy photographs", caption: "Photograph to be added — reading and literacy", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 2 },
    { id: "ph-science", title: "Science activities", category: "science", src: null, alt: "Illustrated placeholder for science activity photographs", caption: "Photograph to be added — science activities", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 3 },
    { id: "ph-sports", title: "Sports and games", category: "sports", src: null, alt: "Illustrated placeholder for sports photographs", caption: "Photograph to be added — sports and games", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 4 },
    { id: "ph-art", title: "Art and creativity", category: "creativity", src: null, alt: "Illustrated placeholder for art and creativity photographs", caption: "Photograph to be added — art and creativity", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 5 },
    { id: "ph-event", title: "School events", category: "events", src: null, alt: "Illustrated placeholder for school event photographs", caption: "Photograph to be added — school events", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 6 },
    { id: "ph-campus", title: "Our campus", category: "campus", src: null, alt: "Illustrated placeholder for campus photographs", caption: "Photograph to be added — school campus", isPlaceholder: true, consentConfirmed: false, published: true, sortOrder: 7 },
  ],
  lastUpdated: "2026-10-14T00:00:00.000Z",
};
