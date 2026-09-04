/* =========================================================
   content.js — 모든 텍스트 콘텐츠 (단일 소스: 영문 CV)
   레이아웃/애니메이션 코드와 분리되어 있으므로
   문구 수정은 이 파일만 고치면 됩니다.
   ========================================================= */

window.CONTENT = {
  profile: {
    name_en: "Yewon Kim",
    name_ko: "김예원",
    department: "Department of Management Information Systems",
    university: "Hannam University, Daejeon, Republic of Korea",
    university_short: "Hannam University",
    degree: "B.S. (candidate) in Management Information Systems, Expected Feb. 2028",
    double_major: "Double major in Big Data Applications, since March 2026",
    gpa: "4.45 / 4.5",
    email: "yewon_050104@naver.com",
    phone: "+82 10 8379 7041",
    phone_href: "tel:+821083797041",
    address: "70 Hannam-ro, Daedeok-gu, Daejeon, 34430, Republic of Korea",
    tagline: "데이터로 서비스를 설계하고, 사람의 목소리를 듣는 사람",
    subtitle: "Management Information Systems · Hannam University",
    cv_pdf: "assets/cv.pdf",
  },

  researchInterests: [
    "Data-driven service planning & business analytics",
    "Database design & modeling",
    "Deep learning (image & behavior analysis)",
    "Mixed reality & 3D scene reconstruction",
  ],

  researchExperience: [
    {
      period: "Jul – Aug 2026",
      role: "Visiting Undergraduate Researcher",
      org: "ETRI (Electronics and Telecommunications Research Institute)",
      unit: "Spatial Media Research Laboratory · Spatial Content Research Division · Spatial Intelligence Research Section",
      location: "Daejeon, Korea",
    },
  ],

  /* Scene 3 — 3개의 섬 */
  islands: [
    {
      id: "awards",
      label: "Awards & Competitions",
      label_ko: "수상 · 공모전",
      count: 11,
      items: [
        {
          title: "Social Contribution Idea Competition",
          meta: "Korea Airports Corporation · 2026",
          background: "Proposed converting idle airport spaces into local pop-up stores, youth startup booths, and art performance venues",
          role: "Idea planning & proposal",
          result: "Grand Prize",
        },
        {
          title: "Service Discovery Competition",
          meta: "Ministry of Land, Infrastructure and Transport · 2026",
          background: "Planned MoveValue, a personalized property matching and recommendation service with a model weighted by furniture type",
          role: "Service planning & recommendation logic design",
          result: "Excellence Prize",
        },
        {
          title: "ERP Student Idea Competition",
          meta: "Korea Society of Management Information Systems · 2026",
          background: "Presented at the 2025 Spring Conference; proposed a security app detecting abnormal behavior in real time during remote meetings using AI pose estimation",
          role: "Idea proposal & conference presentation",
          result: "Encouragement Prize",
        },
        {
          title: "Yuseong-gu Citizen Idea Competition",
          meta: "Yuseong-gu · 2026",
          background: "Planned a personalized tourist course recommendation service based on Tashu, Daejeon's public bicycle system",
          role: "Service planning",
          result: "Gold Prize",
        },
        {
          title: "Yeongju City Proposal Competition",
          meta: "Yeongju City · 2026",
          background: "Proposed a community-oriented service improvement plan utilizing local resources",
          role: "Proposal planning",
          result: "Encouragement Prize",
        },
        {
          title: "Living Lab Project",
          meta: "Hannam University & Daejeon Job and Economy Promotion Agency · 2026",
          background: "Four-month field marketing project for a local bakery; proposed consumer-oriented solutions and produced branded goods",
          role: "Field marketing & branded goods production",
          result: "Grand Prize",
        },
        {
          title: "Creative Idea Competition",
          meta: "Hannam University & Campus Innovation Park · 2026",
          background: "Proposed strategies for student talent development, recruitment, and business initiatives within the Campus Innovation Park",
          role: "Strategy proposal",
          result: "Encouragement Prize",
        },
        {
          title: "My AI Idea Competition",
          meta: "Hannam University · 2026",
          background: "Designed a beacon-based campus facility issue reporting and management module with 3D digital twin monitoring",
          role: "System design",
          result: "First Prize",
        },
        {
          title: "Social Impact Long-term Project",
          meta: "Hannam University · 2026",
          background: "Planned a mobile app recommending courses built on the stories of local merchants in Daeheung-dong and Seonhwa-dong",
          role: "Service planning",
          result: "Top Excellence Prize",
        },
        {
          title: "CTL Presentation Competition",
          meta: "Hannam University · 2026",
          background: "University-wide presentation competition evaluating the structure and delivery of project outcomes",
          role: "Presenter",
          result: "Top Excellence Prize",
        },
        {
          title: "Academic Festival, Dept. of MIS",
          meta: "Hannam University · 2026",
          background: "Presented the design and implementation of the beacon-based campus facility issue reporting and management system",
          role: "Design & implementation, presentation",
          result: "Excellence Prize",
        },
      ],
    },
    {
      id: "projects",
      label: "Projects",
      label_ko: "프로젝트",
      count: 3,
      items: [
        {
          title: "Mixed Reality Pipeline for Indoor Space Scanning and Texture Painting",
          meta: "ETRI · 2026",
          background: "Indoor scene reconstruction and object detection pipeline based on Meta Quest 3 scans",
          role: "Comparative experiments and optimization of 3D texture painting models; design and validation of floor plane removal logic for mesh quality improvement",
          result: "Research Project",
        },
        {
          title: "MoveValue — Personalized Property Matching & Recommendation Service",
          meta: "Service Discovery Competition, MOLIT · 2026",
          background: "Personalized property matching service for movers, recommending listings that fit the furniture they already own",
          role: "Design of a listing recommendation logic weighted by furniture type; market research on competing services and organization of presentation materials",
          result: "Excellence Prize",
        },
        {
          title: "Mobile Application Recommending Local Merchant Courses",
          meta: "Social Impact Long-term Project, Hannam University · 2026",
          background: "Service planning based on the stories of merchants in Daeheung-dong and Seonhwa-dong",
          role: "Proposal for balanced regional development to reduce the commercial gap in the old city center",
          result: "Top Excellence Prize",
        },
      ],
    },
    {
      id: "activities",
      label: "Activities",
      label_ko: "활동",
      count: 2,
      items: [
        {
          title: "University Innovation Support Program Monitoring Group",
          meta: "Hannam University · 2026",
          background: "Monitoring of departmental programs for one semester from a student perspective",
          role: "Identification of inconveniences and improvement proposals",
          result: "Student Monitor",
        },
        {
          title: "Campus System Monitoring Group",
          meta: "Hannam University · 2025",
          background: "Monitoring of campus information systems for one semester from a student perspective",
          role: "Identification of usability issues and improvement proposals",
          result: "Student Monitor",
        },
      ],
    },
  ],

  skills: {
    Programming: ["Python", "R"],
    Databases: ["MySQL", "Oracle"],
    OS: ["Windows"],
    Languages: ["Korean (native)", "English (conversational)"],
  },

  /* Scene 4 — 비전 (초안, 수정 가능) */
  vision: {
    headline: "What I want to do",
    lines: [
      "데이터로 서비스의 방향을 설계하는 사람이 되기",
      "데이터베이스와 딥러닝, 혼합현실까지 — 배운 기술을 실제 문제 해결에 연결하기",
      "공간과 사람을 잇는 기술로 세상과 소통하기",
    ],
  },

  /* Scene 5 — 엔딩 */
  ending: {
    line_ko: "다음 목적지는 아직 정해지지 않았습니다.",
    line_en: "Where to next?",
    credit: "© 2026 Yewon Kim",
  },

  nav: [
    { label: "Profile", target: "scene2" },
    { label: "Experience", target: "scene3" },
    { label: "Vision", target: "scene4" },
    { label: "Contact", target: "scene5" },
  ],
};
