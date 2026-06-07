const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Initialize Gemini API if available
let genAI = null;
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  } catch (err) {
    console.error('Error initializing Gemini API:', err.message);
  }
}

// Helper: safe JSON parsing
function safeJsonParse(text, fallback) {
  try {
    // Clean markdown wrappers if any
    const cleaned = text
      .replace(/^```json/i, '')
      .replace(/```$/, '')
      .trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('AI response was not valid JSON, using regex extraction or fallback.', e.message);
    return fallback;
  }
}

/**
 * AI Core Service
 */
const AIService = {
  /**
   * Parse resume raw text into a structured JSON model
   */
  async parseResume(rawText) {
    const prompt = `
      You are an expert ATS (Applicant Tracking System) parser. Analyze the following resume raw text and extract structured information.
      Return the result strictly as a valid JSON object matching this schema:
      {
        "personalInfo": {
          "name": "Full Name",
          "email": "Email Address",
          "phone": "Phone Number",
          "linkedin": "LinkedIn profile URL or username",
          "github": "GitHub profile URL",
          "portfolio": "Portfolio URL"
        },
        "education": [
          {
            "degree": "Degree Title",
            "college": "College/University Name",
            "gpa": "GPA/CGPA",
            "duration": "Duration (e.g. 2018 - 2022)"
          }
        ],
        "experience": [
          {
            "company": "Company Name",
            "position": "Job Title",
            "duration": "Duration",
            "responsibilities": ["Bullet point of achievements"]
          }
        ],
        "skills": {
          "technical": ["Skill 1", "Skill 2"],
          "soft": ["Skill 1", "Skill 2"],
          "tools": ["Tool 1", "Tool 2"]
        },
        "certifications": ["Cert 1", "Cert 2"],
        "languages": ["Language 1", "Language 2"],
        "achievements": ["Achievement 1", "Achievement 2"]
      }

      Do not include any pre-text or post-text. Return only the JSON object.
      Resume Raw Text:
      ${rawText}
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        return safeJsonParse(text, getMockParsedResume(rawText));
      } catch (err) {
        console.warn('Gemini parser failed, falling back to mock parsing:', err.message);
      }
    }

    return getMockParsedResume(rawText);
  },

  /**
   * Calculate ATS scores and identify weaknesses & missing keywords
   */
  async evaluateATS(resumeJson, jobDescriptionText = '') {
    const prompt = `
      You are a professional ATS Analyzer. Evaluate the following resume JSON and compare it with the job description (if provided).
      Return the output as a valid JSON object matching this schema:
      {
        "overallScore": 85, // 0 to 100
        "formattingScore": 90, // 0 to 100
        "skillScore": 80, // 0 to 100
        "keywordScore": 85, // 0 to 100
        "experienceScore": 85, // 0 to 100
        "educationScore": 90, // 0 to 100
        "projectScore": 80, // 0 to 100
        "breakdown": {
          "formatting": "Detailed review of styling and layout formatting",
          "skills": "Review of the skills matches and levels",
          "keywords": "Review of keyword density and alignment",
          "experience": "Review of work history depth and action-oriented framing",
          "projects": "Review of projects and technologies used"
        },
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "missingKeywords": ["Keyword 1", "Keyword 2"],
        "missingSkills": ["Skill 1", "Skill 2"]
      }

      Resume JSON:
      ${JSON.stringify(resumeJson, null, 2)}

      Job Description:
      ${jobDescriptionText || 'None provided. Evaluate resume against standard software engineering/industry expectations.'}
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(
          result.response.text(),
          getMockATSReport(resumeJson, jobDescriptionText)
        );
      } catch (err) {
        console.warn('Gemini ATS evaluation failed:', err.message);
      }
    }

    return getMockATSReport(resumeJson, jobDescriptionText);
  },

  /**
   * Suggest modifications to make the resume strong
   */
  async suggestImprovements(resumeJson) {
    const prompt = `
      You are an expert Resume Writer. Suggest improvements for the sections in this resume.
      Return the result as a valid JSON object matching this schema:
      {
        "summary": {
          "before": "Original summary",
          "after": "Improved professional summary with strong keywords and action verbs"
        },
        "improvements": [
          {
            "section": "Experience / Projects / Skills",
            "original": "Original bullet or description",
            "suggestion": "Improved version of the bullet with metrics and outcomes (STAR method)"
          }
        ]
      }

      Resume JSON:
      ${JSON.stringify(resumeJson)}
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), getMockImprovements(resumeJson));
      } catch (err) {
        console.warn('Gemini improvements suggestion failed:', err.message);
      }
    }

    return getMockImprovements(resumeJson);
  },

  /**
   * AI Career Coach & Roadmap Generator
   */
  async generateCareerRoadmap(roleName) {
    const prompt = `
      Create a comprehensive career guide and learning roadmap for a "${roleName}".
      Return the response as a JSON object matching this schema:
      {
        "role": "${roleName}",
        "description": "Brief overview of what this role does.",
        "skills": {
          "essential": ["Skill 1", "Skill 2"],
          "intermediate": ["Skill 3", "Skill 4"],
          "advanced": ["Skill 5", "Skill 6"]
        },
        "certifications": ["Cert 1", "Cert 2"],
        "roadmapSteps": [
          {
            "phase": "Phase Name (e.g. Month 1-3: Foundations)",
            "topics": ["Topic A", "Topic B"],
            "projects": ["Build X project to apply this knowledge"]
          }
        ],
        "interviewPreparation": {
          "keyConcepts": ["Concept A", "Concept B"],
          "commonPitfalls": ["Pitfall A", "Pitfall B"]
        }
      }
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), getMockRoadmap(roleName));
      } catch (err) {
        console.warn('Gemini roadmap generation failed:', err.message);
      }
    }

    return getMockRoadmap(roleName);
  },

  /**
   * AI Mock Interview Prep Questions
   */
  async generateInterviewPrep(resumeJson, role = 'Software Engineer') {
    const prompt = `
      Based on the following resume and candidate profile, generate a list of target interview questions (HR, Technical, Behavioral).
      Return the output as a valid JSON array of questions matching this schema:
      [
        {
          "question": "What is ...?",
          "type": "Technical / Behavioral / HR",
          "suggestedAnswer": "Suggested professional answer structure...",
          "difficulty": "Easy / Medium / Hard"
        }
      ]

      Candidate Profile:
      ${JSON.stringify(resumeJson)}

      Target Role:
      ${role}
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), getMockInterviewQuestions(resumeJson, role));
      } catch (err) {
        console.warn('Gemini interview prep failed:', err.message);
      }
    }

    return getMockInterviewQuestions(resumeJson, role);
  },

  /**
   * Generate customized Cover Letters
   */
  async generateCoverLetter(
    resumeJson,
    jobDescriptionText,
    companyName = 'Target Company',
    roleName = 'Target Role'
  ) {
    const prompt = `
      You are a professional cover letter writer. Create an outstanding, tailored cover letter for:
      Role: ${roleName}
      Company: ${companyName}

      Candidate Resume:
      ${JSON.stringify(resumeJson)}

      Job Description:
      ${jobDescriptionText}

      Write a high-converting cover letter. Start with contact, followed by professional greeting, dynamic introduction, body paragraphs describing achievements matching the job, and a call-to-action closing.
      Return the response as a JSON object matching this schema:
      {
        "letterText": "Dear hiring manager, ... \\n\\nSincerely, \\n..."
      }
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), {
          letterText: getMockCoverLetter(resumeJson, companyName, roleName)
        });
      } catch (err) {
        console.warn('Gemini cover letter failed:', err.message);
      }
    }

    return { letterText: getMockCoverLetter(resumeJson, companyName, roleName) };
  },

  /**
   * AI Voice Simulator Question Generator
   */
  async generateVoiceQuestions(resumeJson, role) {
    const prompt = `
      You are an elite Tech Interviewer. Generate exactly 4 interview questions (one from each category: HR, Technical, Scenario-Based, Behavioral) for the role of "${role}".
      Customize the questions based on the candidate's resume:
      ${JSON.stringify(resumeJson)}

      Return the response strictly as a valid JSON array matching this format:
      [
        {
          "question": "The question text...",
          "category": "HR / Technical / Scenario-Based / Behavioral",
          "suggestedAnswer": "Strategic answer bullet points..."
        }
      ]
      No other text.
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), getMockVoiceQuestions(role));
      } catch (err) {
        console.warn('Gemini voice questions failed:', err.message);
      }
    }
    return getMockVoiceQuestions(role);
  },

  /**
   * AI Voice Simulator Answer Evaluator
   */
  async evaluateVoiceAnswer(question, answer, role) {
    const prompt = `
      Evaluate the candidate's voice answer to the following interview question for a "${role}" position.
      Question: "${question}"
      Candidate Answer: "${answer}"

      Analyze their communication skills, confidence, fluency, clarity, and technical relevance.
      Return the evaluation strictly as a valid JSON object matching this schema:
      {
        "score": 85, // 0 to 100
        "communicationScore": 80, // 0 to 100
        "confidenceScore": 90, // 0 to 100
        "technicalScore": 85, // 0 to 100
        "feedback": "Paragraph of analytical feedback on delivery and content.",
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "sampleAnswer": "A premium mock answer demonstrating how they should have structured the response."
      }
      No other text.
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(
          result.response.text(),
          getMockVoiceAnswerEvaluation(question, answer)
        );
      } catch (err) {
        console.warn('Gemini voice answer evaluation failed:', err.message);
      }
    }
    return getMockVoiceAnswerEvaluation(question, answer);
  },

  /**
   * AI Career Mentor Chatbot Response
   */
  async generateChatResponse(history, query, resumeJson, atsReport) {
    const prompt = `
      You are a wise and supportive Career Mentor. Answer the user's career query.
      Candidate Profile Context:
      Resume: ${JSON.stringify(resumeJson || {})}
      ATS Performance: ${JSON.stringify(atsReport || {})}

      Previous Conversation logs:
      ${JSON.stringify(history || [])}

      User Query: "${query}"

      Provide personalized recommendations, referencing their active skills or experience gaps where applicable. Be encouraging, action-oriented, and structured.
      Return the output as a valid JSON object matching this schema:
      {
        "replyText": "Your markdown formatted mentor advice..."
      }
      No other text.
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), {
          replyText: getMockChatResponse(query, resumeJson)
        });
      } catch (err) {
        console.warn('Gemini chat response failed:', err.message);
      }
    }
    return { replyText: getMockChatResponse(query, resumeJson) };
  },

  /**
   * AI Custom Learning Roadmap Generator (30/60/90 day maps)
   */
  async generateCustomRoadmap(resumeJson, targetRole, span) {
    const prompt = `
      Generate a detailed learning roadmap for a candidate transitioning to "${targetRole}" over a ${span}-day period.
      Candidate profile details:
      ${JSON.stringify(resumeJson || {})}

      Identify their skill gaps and target this timeline explicitly to acquire missing technologies.
      Return the response strictly as a valid JSON object matching this format:
      {
        "role": "${targetRole}",
        "span": ${span},
        "description": "Overview of transition milestones.",
        "weeklySteps": [
          {
            "week": "Week 1-2",
            "objective": "Core learning objective",
            "topics": ["Topic A", "Topic B"],
            "projectSuggestion": "Short hands-on project to build"
          }
        ]
      }
      No other text.
    `;

    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(prompt);
        return safeJsonParse(result.response.text(), getMockCustomRoadmap(targetRole, span));
      } catch (err) {
        console.warn('Gemini custom roadmap failed:', err.message);
      }
    }
    return getMockCustomRoadmap(targetRole, span);
  }
};

// ==========================================
// MOCK FALLBACK ENGINES
// ==========================================

function getMockParsedResume(rawText) {
  // Simple heuristic parser for mock mode
  const text = rawText || '';
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = text.match(/(?:\+?\d{1,3}[ -]?)?\(?\d{3}\)?[ -]?\d{3}[ -]?\d{4}/);

  // Extract name (guess first line if reasonable length)
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  let guessedName = 'John Doe';
  if (
    lines.length > 0 &&
    lines[0].length < 40 &&
    !lines[0].includes('@') &&
    !lines[0].includes('http')
  ) {
    guessedName = lines[0];
  }

  // Find tech stack words
  const techCatalog = [
    'javascript',
    'typescript',
    'angular',
    'react',
    'vue',
    'node.js',
    'express',
    'python',
    'java',
    'c++',
    'sql',
    'mysql',
    'sqlite',
    'aws',
    'docker',
    'kubernetes',
    'html',
    'css',
    'tailwind',
    'git'
  ];
  const foundSkills = [];
  techCatalog.forEach((skill) => {
    if (text.toLowerCase().includes(skill)) {
      foundSkills.push(skill.charAt(0).toUpperCase() + skill.slice(1));
    }
  });

  return {
    personalInfo: {
      name: guessedName,
      email: emailMatch ? emailMatch[0] : 'candidate@example.com',
      phone: phoneMatch ? phoneMatch[0] : '+1 (555) 123-4567',
      linkedin: 'linkedin.com/in/candidate',
      github: 'github.com/candidate',
      portfolio: 'candidate-portfolio.dev'
    },
    education: [
      {
        degree: text.toLowerCase().includes('bachelor')
          ? 'Bachelor of Science in Computer Science'
          : 'Bachelor of Engineering',
        college: 'State Technical University',
        gpa: '3.8/4.0',
        duration: '2020 - 2024'
      }
    ],
    experience: [
      {
        company: 'Innovate Tech Solutions',
        position: 'Software Developer Intern',
        duration: 'June 2023 - Present',
        responsibilities: [
          'Developed responsive frontend pages using HTML, CSS, and modern framework principles.',
          'Assisted backend engineering teams in deploying REST API modules.',
          'Identified and resolved bug tickets, improving general application stability.'
        ]
      }
    ],
    skills: {
      technical:
        foundSkills.length > 0 ? foundSkills : ['JavaScript', 'HTML5', 'CSS3', 'Git', 'SQL'],
      soft: ['Problem Solving', 'Teamwork', 'Communication', 'Adaptability'],
      tools: ['VS Code', 'GitLab', 'Postman', 'Docker']
    },
    certifications: ['AWS Certified Cloud Practitioner', 'Google UX Certificate'],
    languages: ['English (Fluent)', 'Spanish (Conversational)'],
    achievements: [
      'Won 1st Place at local University Hackathon 2023',
      "Dean's Honor List for 4 consecutive semesters"
    ]
  };
}

function getMockATSReport(resumeJson, jobDescriptionText) {
  const jd = (jobDescriptionText || '').toLowerCase();
  const skills = [...(resumeJson.skills?.technical || []), ...(resumeJson.skills?.tools || [])].map(
    (s) => s.toLowerCase()
  );

  let keywordScore = 75;
  const missingKeywords = [];
  const missingSkills = [];

  const commonKeywords = [
    'kubernetes',
    'docker',
    'aws',
    'ci/cd',
    'typescript',
    'microservices',
    'redis',
    'graphql',
    'jest',
    'mongodb',
    'agile'
  ];

  if (jd) {
    commonKeywords.forEach((kw) => {
      if (jd.includes(kw)) {
        if (!skills.includes(kw)) {
          missingKeywords.push(kw.toUpperCase());
          missingSkills.push(kw.charAt(0).toUpperCase() + kw.slice(1));
          keywordScore -= 6;
        } else {
          keywordScore += 4;
        }
      }
    });
  } else {
    // Standard mock list
    missingKeywords.push('DOCKER', 'KUBERNETES', 'CI/CD', 'AWS');
    missingSkills.push('Docker', 'Kubernetes', 'CI/CD Pipelines', 'AWS Cloud Services');
  }

  keywordScore = Math.max(50, Math.min(100, keywordScore));
  const formattingScore =
    resumeJson.personalInfo?.phone && resumeJson.personalInfo?.email ? 92 : 60;
  const experienceScore = resumeJson.experience?.length > 0 ? 85 : 50;
  const projectScore = 80;
  const skillScore = Math.min(100, 70 + (resumeJson.skills?.technical?.length || 0) * 3);

  const overallScore = Math.round(
    (keywordScore + formattingScore + experienceScore + projectScore + skillScore) / 5
  );

  return {
    overallScore,
    formattingScore,
    skillScore,
    keywordScore,
    experienceScore,
    educationScore: 90,
    projectScore,
    breakdown: {
      formatting:
        'The layout and contact details are properly placed. Section divisions are distinguishable. File has consistent fonts and headers.',
      skills:
        'Excellent technical skills listed, but some advanced tools requested in the industry profile are currently missing.',
      keywords: `Keyword coverage score is ${keywordScore}%. Recommended adding missing keywords related to cloud systems and containerization.`,
      experience:
        'Responsibilities demonstrate task completion. Add concrete metrics and measurable outcomes to make bullets stronger.',
      projects:
        'Projects represent basic application concepts. Enhance with scalable technologies and system diagrams.'
    },
    weaknesses: [
      'Lacks concrete metrics/performance figures in work history bullets (e.g. % improvement, hours saved).',
      'Missing deep cloud architecture and pipeline keywords.',
      'Summary could be more tailored to targeted career profiles.'
    ],
    missingKeywords,
    missingSkills
  };
}

function getMockImprovements(resumeJson) {
  const origSummary = resumeJson.personalInfo?.name
    ? `Junior developer with skills in web engineering.`
    : 'Entry level candidate seeking opportunities.';

  const improvedSummary = `Highly motivated Full Stack Engineer with expertise in building scalable, responsive web architectures. Proficient in modern frontend paradigms, REST APIs, and database structures. Proven track record of improving site loading speeds and resolving bug backlogs under Agile workflows.`;

  const improvements = [];

  if (resumeJson.experience && resumeJson.experience.length > 0) {
    resumeJson.experience.forEach((exp) => {
      if (exp.responsibilities && exp.responsibilities.length > 0) {
        exp.responsibilities.forEach((resp) => {
          improvements.push({
            section: 'Experience',
            original: resp,
            suggestion: `Boosted application efficiency and delivery rates by introducing optimized rendering paths, reducing page load latency by 24% while resolving unresolved bug backlogs.`
          });
        });
      }
    });
  }

  if (improvements.length === 0) {
    improvements.push({
      section: 'Projects',
      original: 'Built a web application with user registration.',
      suggestion:
        'Engineered a highly responsive web application featuring secure JWT authentication and state-management, resulting in a 40% reduction in user onboarding churn.'
    });
  }

  return {
    summary: {
      before: origSummary,
      after: improvedSummary
    },
    improvements
  };
}

function getMockRoadmap(roleName) {
  const role = roleName.toLowerCase();

  const roadmaps = {
    'devops engineer': {
      description:
        'DevOps Engineers bridge the gap between development and operations teams, automating releases, infrastructure scaling, and system reliability.',
      skills: {
        essential: ['Linux Commands', 'Bash Scripting', 'Git', 'Networking & Security'],
        intermediate: [
          'Docker',
          'CI/CD Pipelines (GitHub Actions/Jenkins)',
          'AWS / GCP Basics',
          'Nginx'
        ],
        advanced: ['Kubernetes', 'Terraform (IaC)', 'Prometheus & Grafana', 'Ansible']
      },
      certifications: [
        'AWS Certified SysOps Administrator',
        'Certified Kubernetes Administrator (CKA)'
      ],
      roadmapSteps: [
        {
          phase: 'Phase 1: Foundations',
          topics: [
            'Linux Administration',
            'Networking fundamentals',
            'Git and source control workflows'
          ],
          projects: [
            'Build and deploy a local server configured with Nginx, SSH, and custom bash scripts'
          ]
        },
        {
          phase: 'Phase 2: Containerization & Pipelines',
          topics: [
            'Dockerizing static and dynamic applications',
            'Building secure container images',
            'Setting up CI pipelines'
          ],
          projects: [
            'Create a multi-container app on Docker Compose with automated GitHub Actions testing'
          ]
        },
        {
          phase: 'Phase 3: Orchestration & Cloud IaC',
          topics: [
            'Kubernetes deployments and services',
            'Terraform infrastructure provisioning',
            'Cloud networks'
          ],
          projects: [
            'Provision an AWS VPC and EC2 nodes using Terraform, then launch a Kubernetes app replica'
          ]
        }
      ],
      interviewPreparation: {
        keyConcepts: [
          'Blue-Green vs Canary Deployments',
          'Twelve-Factor App Methodology',
          'Infrastructure as Code principles'
        ],
        commonPitfalls: [
          'Ignoring log management',
          'Overcomplicating local cluster environments prematurely'
        ]
      }
    },
    'full stack developer': {
      description:
        'Full Stack Developers build both front-end user interfaces and back-end logic, orchestrating database transactions and responsive designs.',
      skills: {
        essential: ['HTML5 & CSS3', 'JavaScript / TypeScript', 'Git', 'Responsive Design'],
        intermediate: [
          'Angular or React Framework',
          'Node.js & Express.js',
          'Relational Databases (SQL)',
          'REST API Design'
        ],
        advanced: [
          'Next.js / Angular SSR',
          'System Design & Caching',
          'Cloud Deployments (AWS/Vercel)',
          'NoSQL Databases'
        ]
      },
      certifications: [
        'AWS Certified Developer - Associate',
        'Meta Full-Stack Engineer Certificate'
      ],
      roadmapSteps: [
        {
          phase: 'Phase 1: Web Foundations',
          topics: ['HTML, Tailwind CSS, TypeScript basics', 'DOM manipulation', 'Git branches'],
          projects: [
            'Build a highly interactive dashboard mockup using Tailwind CSS and Vanilla TS'
          ]
        },
        {
          phase: 'Phase 2: App Core & APIs',
          topics: [
            'Angular component lifecycles',
            'Node.js routing',
            'Relational Database schemas'
          ],
          projects: [
            'Construct a task manager app connecting an Angular SPA to an Express.js MySQL backend'
          ]
        },
        {
          phase: 'Phase 3: Scaling & Cloud',
          topics: [
            'Redis Caching',
            'JWT OAuth token cycles',
            'Docker configurations',
            'CI/CD builds'
          ],
          projects: [
            'Deploy the full stack application to a cloud hosting environment (Render/Vercel) with active CI/CD'
          ]
        }
      ],
      interviewPreparation: {
        keyConcepts: [
          'Event Loop in Node.js',
          'State Management vs Prop Drilling',
          'Database Indexing & N+1 Queries'
        ],
        commonPitfalls: [
          'Ignoring error handling in async functions',
          'Hardcoding secrets in repository config files'
        ]
      }
    }
  };

  // Default fallback if role is not pre-mapped
  const defaultRoadmap = {
    description: `A career track focused on engineering, scaling, and optimizing applications for ${roleName} environments.`,
    skills: {
      essential: ['Core Programming', 'Version Control (Git)', 'Problem Solving', 'CLI Utilities'],
      intermediate: ['Frameworks & libraries', 'API Integrations', 'Databases', 'Testing Suites'],
      advanced: [
        'Architecture & Design Patterns',
        'Cloud Infrastructure',
        'Security Audits',
        'Performance Optimization'
      ]
    },
    certifications: [`Professional ${roleName} Certification`, 'AWS Cloud Practitioner'],
    roadmapSteps: [
      {
        phase: 'Phase 1: Core Fundamentals',
        topics: [
          'Basic syntax and data structures',
          'Environment configuration',
          'Git branching models'
        ],
        projects: ['Build a command line utility tool that automates basic local setups']
      },
      {
        phase: 'Phase 2: Deep Component Integration',
        topics: [
          'Standard libraries & framework tools',
          'Database modeling and API operations',
          'Testing schemas'
        ],
        projects: ['Develop a functional RESTful API matching industrial schemas']
      },
      {
        phase: 'Phase 3: Production & Performance',
        topics: [
          'System design structures',
          'Deployment strategies',
          'Analytics tracking & profiling'
        ],
        projects: ['Launch a performance-monitored version of the tool in production']
      }
    ],
    interviewPreparation: {
      keyConcepts: [
        'Clean Code Principles',
        'Object-Oriented & Functional programming patterns',
        'Scalability criteria'
      ],
      commonPitfalls: ['Ignoring performance constraints', 'Inadequate testing coverage']
    }
  };

  return roadmaps[role] || defaultRoadmap;
}

function getMockInterviewQuestions(resumeJson, role) {
  return [
    {
      question:
        'Can you walk us through a challenging project listed on your resume, explaining your tech stack choices?',
      type: 'Technical',
      suggestedAnswer:
        'Start with the project goal (STAR method). Explain the specific problem, detail the tech stack selection (e.g., why Angular for robust component patterns, Node.js for event-driven asynchronous API performance), describe your personal impact, and highlight the successful outcome/metrics.',
      difficulty: 'Medium'
    },
    {
      question:
        'Describe a time you had a technical disagreement with a team member. How did you resolve it?',
      type: 'Behavioral',
      suggestedAnswer:
        'Describe a real situation focusing on professional dialogue rather than personal conflict. Emphasize how you gathered data (e.g., ran quick benchmarks or read official documentation), listened to their perspective, evaluated tradeoffs collaboratively, and reached an agreement that benefited the product.',
      difficulty: 'Medium'
    },
    {
      question:
        'Where do you see your career heading in the next 3 to 5 years, and how does this role fit that roadmap?',
      type: 'HR',
      suggestedAnswer:
        'Affirm your passion for full-stack engineering and development. Explain that you want to master technical architecture and team mentorship, and explain how this role provides the exact hands-on growth opportunities to apply and expand your system skills.',
      difficulty: 'Easy'
    },
    {
      question: 'How do you handle application security and authorization in modern web APIs?',
      type: 'Technical',
      suggestedAnswer:
        'Mention JWT token-based authentication, storing tokens securely (e.g., HttpOnly cookies or protected store layers), handling token expiration with Refresh tokens, using role-based routing guards on the frontend, and implementing schema validations and rate limits on the backend API.',
      difficulty: 'Hard'
    }
  ];
}

function getMockCoverLetter(resumeJson, companyName, roleName) {
  const name = resumeJson.personalInfo?.name || 'Candidate Name';
  const email = resumeJson.personalInfo?.email || 'email@example.com';
  const phone = resumeJson.personalInfo?.phone || '+1 555-555-5555';
  const skillsList = (resumeJson.skills?.technical || []).slice(0, 5).join(', ');

  return `
[Candidate Contact Details]
${name}
${email}
${phone}

June 7, 2026

Hiring Manager
${companyName}

Subject: Application for the ${roleName} Position

Dear Hiring Manager,

I am writing to express my strong interest in the ${roleName} position at ${companyName}. As a dedicated developer with hands-on experience in building performant and responsive systems, I am excited about the opportunity to contribute to your engineering efforts.

From my attached resume, you will find that I have built solid capabilities in modern web development paradigms, particularly utilizing tools like ${skillsList || 'JavaScript, SQL, and Git'}. In my previous roles and independent projects, I have consistently focused on creating high-quality, clean codebases, optimizing database schemas, and building user interfaces that are both aesthetically pleasing and intuitive.

What attracts me most to ${companyName} is your commitment to engineering excellence and innovation. I am confident that my backend development skills, combined with my attention to detail in testing and UI design, align perfectly with the goals of your team. I thrive in collaborative environments and am eager to bring my problem-solving capabilities to this role.

Thank you for your time and consideration. I welcome the opportunity to discuss how my background and technical skills make me a strong fit for your team.

Sincerely,

${name}
  `.trim();
}

function getMockVoiceQuestions(role) {
  return [
    {
      question: `Why are you interested in pursuing a career as a ${role}, and what makes you a strong candidate?`,
      category: 'HR',
      suggestedAnswer:
        'Summarize your career motivations, highlight active technical competencies, and link your passion to the growth of this specific role.'
    },
    {
      question: `Explain how you handle configuration drift or state synchronization in cloud-scale systems relative to a ${role}.`,
      category: 'Technical',
      suggestedAnswer:
        'Describe IaC tools like Terraform, system checks, automated reconciliation loops, and version control check triggers.'
    },
    {
      question:
        'Imagine production traffic surges by 10x suddenly. Describe your step-by-step triage sequence.',
      category: 'Scenario-Based',
      suggestedAnswer:
        'Isolate network channels, check logging monitors, enable auto-scaling thresholds, spin up caching mechanisms, and review database load limits.'
    },
    {
      question:
        'Describe a time you worked on a project with vague requirements. How did you align expectations?',
      category: 'Behavioral',
      suggestedAnswer:
        'Use the STAR method. Describe how you proactively met stakeholders, drew mock wireframes, scheduled brief daily check-ins, and verified small integrations frequently.'
    }
  ];
}

function getMockVoiceAnswerEvaluation(question, answer) {
  const ansLength = (answer || '').length;
  const confidenceScore = ansLength > 80 ? 88 : ansLength > 30 ? 75 : 50;
  const communicationScore = ansLength > 120 ? 90 : ansLength > 50 ? 78 : 55;
  const technicalScore =
    (answer || '').toLowerCase().includes('database') ||
    (answer || '').toLowerCase().includes('pipeline') ||
    (answer || '').toLowerCase().includes('cloud')
      ? 85
      : 70;

  const score = Math.round((confidenceScore + communicationScore + technicalScore) / 3);

  return {
    score,
    communicationScore,
    confidenceScore,
    technicalScore,
    feedback: `The candidate provided a response of ${ansLength} characters. Delivery demonstrated moderate confidence. The response could be structured more cleanly using direct outcomes or technical vocabulary.`,
    strengths: [
      'Addressed the core interview question directly.',
      'Demonstrated basic conceptual familiarity with target role processes.'
    ],
    weaknesses: [
      'Lacked detailed metrics or architecture names.',
      'Phrasing could be more structured and action-oriented.'
    ],
    sampleAnswer:
      "An excellent response would follow the STAR structure: 'In my previous deployment, I resolved vague configurations by hosting an alignment session. This resulted in a 30% increase in integration speeds...'"
  };
}

function getMockChatResponse(query, resumeJson) {
  const q = query.toLowerCase();
  const name = resumeJson?.personalInfo?.name || 'there';

  if (q.includes('devops')) {
    return `Hello ${name}! Transitioning to **DevOps** is a fantastic choice. Based on your profile, here is what you should focus on:
1. **Linux & Scripting**: Master Bash or Python.
2. **Containerization**: Deep dive into Docker and Kubernetes.
3. **CI/CD**: Build GitHub Actions or GitLab pipelines.
4. **Cloud Infrastructure**: Get certified in AWS (Associate) and learn Terraform.

*Tip: Add a CI/CD pipeline automation project to your resume immediately!*`;
  }

  if (q.includes('docker') || q.includes('kubernetes')) {
    return `Great follow-up. After learning **Docker**, the logical next step is **Container Orchestration**:
- Learn **Kubernetes (k8s)** fundamentals (Pods, Services, Deployments).
- Configure a local cluster using **Minikube** or **Kind**.
- Practice deploying multi-container services with active monitoring (Prometheus & Grafana).
- Check out the **Certified Kubernetes Administrator (CKA)** certification roadmap.`;
  }

  if (q.includes('project') || q.includes('build')) {
    return `Here are some high-impact projects tailored to boost your portfolio:
1. **CI/CD Pipeline Automation**: Automate building, testing, and deploying a web app to AWS EC2 using GitHub Actions.
2. **Kubernetes Monitoring Dashboard**: Deploy a Prometheus and Grafana stack to monitor Node resources on a cluster.
3. **Infrastructure as Code**: Provision a secure multi-region VPC network with Terraform.`;
  }

  if (q.includes('ats') || q.includes('score')) {
    return `To improve your ATS (Applicant Tracking System) Score:
1. **Formatting**: Avoid multi-column layouts, images, and tables inside your resume file. Use standard headers.
2. **Keywords**: Align your skills exactly with targeted Job Descriptions.
3. **Metrics**: Rewrite experience bullets using the formula: *Accomplished [X] as measured by [Y], by doing [Z]*.`;
  }

  return `Hello ${name}! As your Career Mentor, I am here to guide you. You can ask me about:
- Career transitions (e.g., how to become a Cloud Engineer).
- What projects to build to bridge your skill gaps.
- Which industry certifications (AWS, Kubernetes, GCP) match your profile.
- Tailoring roadmaps or reviewing mock interview responses.

How can I help you take the next step in your career today?`;
}

function getMockCustomRoadmap(role, span) {
  return {
    role,
    span,
    description: `A fast-track ${span}-day learning roadmap configured to build industry competencies for the role of ${role}.`,
    weeklySteps: [
      {
        week: 'Week 1-2: Foundations',
        objective: 'Master core operating concepts and environments.',
        topics: ['CLI Utilities', 'Git branching workflows', 'Scripting bases'],
        projectSuggestion: 'Build and deploy a local terminal shell script utility.'
      },
      {
        week: 'Week 3-4: Core Stack Integration',
        objective: 'Integrate container packages and cloud modules.',
        topics: ['Docker container configurations', 'Virtual networking', 'REST integrations'],
        projectSuggestion: 'Dockerize a multi-tier client application.'
      },
      {
        week: 'Week 5-6: Orchestration & Scaling',
        objective: 'Automate releases and infrastructure pipelines.',
        topics: ['Kubernetes deployments', 'CI/CD automated triggers', 'Monitoring stack'],
        projectSuggestion: 'Set up a complete automated GitHub Actions build and push pipeline.'
      }
    ]
  };
}

module.exports = AIService;
