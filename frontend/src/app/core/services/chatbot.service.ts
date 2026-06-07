import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatConversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
}

export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender: 'user' | 'ai';
  message_text: string;
  created_at: string;
}

export interface ChatRoadmap {
  role: string;
  span: number;
  description: string;
  weeklySteps: Array<{
    week: string;
    objective: string;
    topics: string[];
    projectSuggestion: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class ChatbotService {
  private readonly apiUrl = 'http://localhost:5000/api/chat';

  constructor(private http: HttpClient) {}

  getConversations(): Observable<{ conversations: ChatConversation[] }> {
    return this.http.get<{ conversations: ChatConversation[] }>(`${this.apiUrl}/conversations`);
  }

  createConversation(
    title?: string,
  ): Observable<{ message: string; conversationId: number; title: string }> {
    return this.http.post<{ message: string; conversationId: number; title: string }>(
      `${this.apiUrl}/conversations`,
      { title },
    );
  }

  getMessages(conversationId: number): Observable<{ messages: ChatMessage[] }> {
    return this.http.get<{ messages: ChatMessage[] }>(`${this.apiUrl}/messages/${conversationId}`);
  }

  sendMessage(
    conversationId: number,
    message: string,
    resumeId?: number,
  ): Observable<{ sender: 'ai'; messageText: string }> {
    return this.http.post<{ sender: 'ai'; messageText: string }>(`${this.apiUrl}/message`, {
      conversationId,
      message,
      resumeId,
    });
  }

  generateRoadmap(
    targetRole: string,
    span: number,
    resumeId?: number,
  ): Observable<{ roadmap: ChatRoadmap }> {
    return this.http.post<{ roadmap: ChatRoadmap }>(`${this.apiUrl}/roadmap`, {
      targetRole,
      span,
      resumeId,
    });
  }
}
