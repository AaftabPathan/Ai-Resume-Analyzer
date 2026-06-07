import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface VoiceQuestion {
  id: number;
  question: string;
  category: string;
}

export interface VoiceSessionStartResponse {
  message: string;
  sessionId: number;
  role: string;
  questions: VoiceQuestion[];
}

export interface VoiceAnswerSubmitResponse {
  message: string;
  evaluation: {
    score: number;
    communicationScore: number;
    confidenceScore: number;
    technicalScore: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    sampleAnswer: string;
  };
}

export interface VoiceSessionReport {
  sessionId: number;
  role: string;
  overallScore: number;
  communicationScore: number;
  confidenceScore: number;
  technicalScore: number;
  summary: {
    overallDescription: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  answers: Array<{
    id: number;
    question: string;
    user_answer: string;
    suggested_answer: string;
    category: string;
    feedback: string;
    score: number;
    created_at: string;
  }>;
}

export interface VoiceStats {
  totalInterviews: number;
  avgScore: number;
  bestScore: number;
  progress: Array<{ score: number; date: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class VoiceService {
  private readonly apiUrl = 'http://localhost:5000/api/voice';

  constructor(private http: HttpClient) {}

  startSession(resumeId: number | null, role: string): Observable<VoiceSessionStartResponse> {
    return this.http.post<VoiceSessionStartResponse>(`${this.apiUrl}/session`, { resumeId, role });
  }

  submitAnswer(
    sessionId: number,
    questionId: number,
    answer: string,
  ): Observable<VoiceAnswerSubmitResponse> {
    return this.http.post<VoiceAnswerSubmitResponse>(`${this.apiUrl}/submit-answer`, {
      sessionId,
      questionId,
      answer,
    });
  }

  completeSession(sessionId: number): Observable<{ message: string; report: VoiceSessionReport }> {
    return this.http.post<any>(`${this.apiUrl}/session/${sessionId}/complete`, {});
  }

  getSessions(): Observable<{
    sessions: Array<{
      id: number;
      role: string;
      status: string;
      overall_score: number;
      created_at: string;
    }>;
  }> {
    return this.http.get<any>(`${this.apiUrl}/sessions`);
  }

  getSessionDetails(id: number): Observable<{ session: any; answers: any[] }> {
    return this.http.get<any>(`${this.apiUrl}/session/${id}/report`);
  }

  getStats(): Observable<{ stats: VoiceStats }> {
    return this.http.get<{ stats: VoiceStats }>(`${this.apiUrl}/stats`);
  }
}
