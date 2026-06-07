import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Resume {
  id: number;
  userId: number;
  title: string;
  originalFileName: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
  current_version?: number;
}

export interface ResumeVersionDetails {
  id: number;
  versionNumber: number;
  createdAt: string;
}

export interface ResumeDetailsResponse {
  resume: Resume;
  versionDetails: ResumeVersionDetails;
  versions: ResumeVersionDetails[];
  data: any; // The actual structured JSON of the resume
}

@Injectable({
  providedIn: 'root',
})
export class ResumeService {
  private readonly apiUrl = 'http://localhost:5000/api/resumes';

  constructor(private http: HttpClient) {}

  uploadResume(
    file: File,
  ): Observable<{ message: string; resumeId: number; title: string; parsedData: any }> {
    const formData = new FormData();
    formData.append('resume', file);
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  saveBuilderResume(
    title: string,
    resumeData: any,
  ): Observable<{ message: string; resumeId: number }> {
    return this.http.post<any>(`${this.apiUrl}/builder`, { title, resumeData });
  }

  getResumes(): Observable<{ resumes: Resume[] }> {
    return this.http.get<{ resumes: Resume[] }>(this.apiUrl);
  }

  getAllResumesForRecruiter(): Observable<{ resumes: any[] }> {
    return this.http.get<{ resumes: any[] }>(`${this.apiUrl}/all`);
  }

  getResume(id: number, version?: number): Observable<ResumeDetailsResponse> {
    let params = new HttpParams();
    if (version) {
      params = params.set('version', version.toString());
    }
    return this.http.get<ResumeDetailsResponse>(`${this.apiUrl}/${id}`, { params });
  }

  updateResume(id: number, data: any): Observable<{ message: string; versionNumber: number }> {
    return this.http.put<{ message: string; versionNumber: number }>(
      `${`${this.apiUrl}/${id}`}`,
      data,
    );
  }

  deleteResume(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }
}
