import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface UserStats {
  users: number;
  recruiters: number;
  admins: number;
  resumes: number;
  reports: number;
  averageAtsScore: number;
  aiRequests: number;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'recruiter' | 'admin';
  is_verified: number;
  created_at: string;
  avatar_url?: string;
}

export interface LatestUpload {
  id: number;
  title: string;
  created_at: string;
  user_name: string;
  user_email: string;
}

@Injectable({
  providedIn: 'root',
})
export class AdminService {
  private readonly apiUrl = 'http://localhost:5000/api/admin';

  constructor(private http: HttpClient) {}

  getStats(): Observable<{ stats: UserStats; latestUploads: LatestUpload[] }> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  getUsers(): Observable<{ users: AdminUser[] }> {
    return this.http.get<{ users: AdminUser[] }>(`${this.apiUrl}/users`);
  }

  updateUserRole(userId: number, role: string): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.apiUrl}/users/${userId}/role`, { role });
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${userId}`);
  }
}
