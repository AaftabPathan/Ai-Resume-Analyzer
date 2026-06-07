import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ATSEvalResponse {
  message: string;
  reportId: number;
  evaluation: {
    overallScore: number;
    formattingScore: number;
    skillScore: number;
    keywordScore: number;
    experienceScore: number;
    educationScore: number;
    projectScore: number;
    breakdown: {
      formatting: string;
      skills: string;
      keywords: string;
      experience: string;
      projects: string;
    };
    weaknesses: string[];
    missingKeywords: string[];
    missingSkills: string[];
  };
}

export interface ATSReport {
  id: number;
  resumeId: number;
  overallScore: number;
  formattingScore: number;
  skillScore: number;
  keywordScore: number;
  experienceScore: number;
  educationScore: number;
  projectScore: number;
  breakdown: any;
  weaknesses: string[];
  missingKeywords: string[];
  createdAt: string;
}

export interface ImprovementSuggestions {
  summary: {
    before: string;
    after: string;
  };
  improvements: Array<{
    section: string;
    original: string;
    suggestion: string;
  }>;
}

export interface CareerRoadmap {
  role: string;
  description: string;
  skills: {
    essential: string[];
    intermediate: string[];
    advanced: string[];
  };
  certifications: string[];
  roadmapSteps: Array<{
    phase: string;
    topics: string[];
    projects: string[];
  }>;
  interviewPreparation: {
    keyConcepts: string[];
    commonPitfalls: string[];
  };
}

export interface InterviewQuestion {
  id: number;
  resumeId?: number;
  role: string;
  type: 'Technical' | 'Behavioral' | 'HR';
  question: string;
  suggestedAnswer: string;
  userNotes: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface SkillGapResponse {
  targetRole: string;
  matchRate: number;
  currentSkillsCount: number;
  benchmarkSkillsCount: number;
  essential: string[];
  missing: string[];
  courses: Array<{ title: string; platform: string; duration: string; difficulty: string }>;
  projects: Array<{ title: string; description: string; difficulty: string }>;
}

export interface JobMatchResponse {
  matchPercentage: number;
  breakdown: any;
  missingKeywords: string[];
  missingSkills: string[];
  weaknesses: string[];
  improvementPlan: string[];
}

export interface CoverLetter {
  id: number;
  resume_id?: number;
  recipient_company: string;
  recipient_role: string;
  letter_text: string;
  created_at: string;
}

export interface RecommendationResponse {
  jobs: Array<{
    id: number;
    title: string;
    company: string;
    location: string;
    salary: string;
    matchPercentage: number;
    skillsRequired: string[];
    type: string;
  }>;
  certifications: Array<{ name: string; provider: string; difficulty: string }>;
  courses: Array<{ name: string; platform: string; rating: number }>;
}

@Injectable({
  providedIn: 'root',
})
export class CareerService {
  private readonly atsUrl = 'http://localhost:5000/api/ats';
  private readonly coachUrl = 'http://localhost:5000/api/coach';

  constructor(private http: HttpClient) {}

  // ==========================================
  // ATS Score Analyzer
  // ==========================================
  evaluateATS(resumeId: number, jobDescriptionText?: string): Observable<ATSEvalResponse> {
    return this.http.post<ATSEvalResponse>(`${this.atsUrl}/evaluate`, {
      resumeId,
      jobDescriptionText,
    });
  }

  getATSReports(resumeId: number): Observable<{ reports: ATSReport[] }> {
    return this.http.get<{ reports: ATSReport[] }>(`${this.atsUrl}/resume/${resumeId}`);
  }

  getImprovements(resumeId: number): Observable<{ suggestions: ImprovementSuggestions }> {
    return this.http.get<{ suggestions: ImprovementSuggestions }>(
      `${this.atsUrl}/suggestions/${resumeId}`,
    );
  }

  // ==========================================
  // AI Career Coach
  // ==========================================
  getRoadmap(role: string): Observable<{ roadmap: CareerRoadmap }> {
    return this.http.get<{ roadmap: CareerRoadmap }>(`${this.coachUrl}/roadmap`, {
      params: { role },
    });
  }

  // ==========================================
  // AI Interview Prep
  // ==========================================
  generateInterviewQuestions(
    resumeId: number,
    role: string,
  ): Observable<{ questions: InterviewQuestion[] }> {
    return this.http.post<{ questions: InterviewQuestion[] }>(`${this.coachUrl}/interview-prep`, {
      resumeId,
      role,
    });
  }

  getSavedQuestions(): Observable<{ questions: InterviewQuestion[] }> {
    return this.http.get<{ questions: InterviewQuestion[] }>(
      `${this.coachUrl}/interview-prep/saved`,
    );
  }

  updateQuestionNotes(id: number, userNotes: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.coachUrl}/interview-prep/${id}/notes`, {
      userNotes,
    });
  }

  // ==========================================
  // AI Skill Gap & Job Matching
  // ==========================================
  getSkillGap(resumeId: number, targetRole: string): Observable<SkillGapResponse> {
    return this.http.post<SkillGapResponse>(`${this.coachUrl}/skill-gap`, { resumeId, targetRole });
  }

  matchJob(resumeId: number, jobDescription: string): Observable<JobMatchResponse> {
    return this.http.post<JobMatchResponse>(`${this.coachUrl}/match-jd`, {
      resumeId,
      jobDescription,
    });
  }

  // ==========================================
  // AI Cover Letter Generator
  // ==========================================
  generateCoverLetter(
    resumeId: number,
    jobDescription: string,
    companyName?: string,
    role?: string,
  ): Observable<{ message: string; letterId: number; letterText: string }> {
    return this.http.post<any>(`${this.coachUrl}/cover-letter`, {
      resumeId,
      jobDescription,
      companyName,
      role,
    });
  }

  getCoverLetters(): Observable<{ letters: CoverLetter[] }> {
    return this.http.get<{ letters: CoverLetter[] }>(`${this.coachUrl}/cover-letters`);
  }

  // ==========================================
  // Job Recommendation Engine
  // ==========================================
  getRecommendations(resumeId: number): Observable<RecommendationResponse> {
    return this.http.get<RecommendationResponse>(`${this.coachUrl}/recommendations`, {
      params: { resumeId: resumeId.toString() },
    });
  }
}
