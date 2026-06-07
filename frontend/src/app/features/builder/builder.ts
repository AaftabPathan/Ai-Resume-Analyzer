import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ResumeService } from '../../core/services/resume.service';

interface BuilderData {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    summary: string;
  };
  education: Array<{ degree: string; college: string; duration: string; gpa: string }>;
  experience: Array<{
    company: string;
    position: string;
    duration: string;
    responsibilities: string[];
  }>;
  skills: string[];
}

@Component({
  selector: 'app-builder',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Top Actions Bar -->
      <div
        class="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 glass-card"
      >
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-outfit">
            WYSIWYG AI Resume Builder
          </h1>
          <p class="text-slate-400 text-xs mt-1">
            Design and customize professional resume drafts with real-time PDF generation.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <mat-form-field appearance="outline" class="dark-form-field !text-xs shrink-0 w-full sm:w-48">
            <mat-label>Template Style</mat-label>
            <mat-select [(ngModel)]="activeTemplate">
              <mat-option value="ats">ATS Friendly</mat-option>
              <mat-option value="modern">Modern Professional</mat-option>
              <mat-option value="corporate">Corporate Executive</mat-option>
              <mat-option value="minimalist">Minimalist Elegant</mat-option>
            </mat-select>
          </mat-form-field>

          <button
            (click)="exportPDF()"
            mat-raised-button
            color="primary"
            class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[48px] !font-bold text-white shadow-lg shadow-violet-500/25 glowing-btn-hover flex items-center space-x-2 w-full sm:w-auto px-6"
          >
            <mat-icon class="text-sm">picture_as_pdf</mat-icon>
            <span>Export PDF</span>
          </button>
          <button
            (click)="saveDraft()"
            mat-stroked-button
            class="!border-slate-800 !rounded-xl !h-[48px] !text-slate-300 hover:!bg-slate-800/60 hover:!text-white transition-all w-full sm:w-auto px-6 font-semibold"
          >
            Save Draft
          </button>
        </div>
      </div>

      <!-- Editor Panel Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <!-- Left Column: Inputs Form -->
        <div class="space-y-6 max-h-[82vh] overflow-y-auto pr-2">
          <!-- Contact Info -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <h3 class="text-sm font-bold text-slate-200 mb-6 font-outfit flex items-center space-x-2">
              <mat-icon class="text-violet-400">person_outline</mat-icon>
              <span>Contact & Summary Details</span>
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <mat-form-field appearance="outline" class="w-full dark-form-field">
                <mat-label>Full Name</mat-label>
                <input matInput [(ngModel)]="resume.personalInfo.name" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full dark-form-field">
                <mat-label>Email Address</mat-label>
                <input matInput [(ngModel)]="resume.personalInfo.email" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full dark-form-field">
                <mat-label>Phone Number</mat-label>
                <input matInput [(ngModel)]="resume.personalInfo.phone" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full dark-form-field">
                <mat-label>LinkedIn Profile</mat-label>
                <input matInput [(ngModel)]="resume.personalInfo.linkedin" />
              </mat-form-field>

              <mat-form-field appearance="outline" class="w-full dark-form-field md:col-span-2">
                <mat-label>Professional Summary</mat-label>
                <textarea matInput [(ngModel)]="resume.personalInfo.summary" rows="3"></textarea>
              </mat-form-field>
            </div>
          </mat-card>

          <!-- Education Section -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-sm font-bold text-slate-200 font-outfit flex items-center space-x-2">
                <mat-icon class="text-indigo-400">school</mat-icon>
                <span>Education History</span>
              </h3>
              <button
                (click)="addEducation()"
                class="text-xs text-violet-400 font-bold hover:text-violet-300 transition-colors flex items-center space-x-1"
              >
                <span>+ Add Education</span>
              </button>
            </div>

            <div class="space-y-6">
              <div
                *ngFor="let edu of resume.education; let idx = index"
                class="p-5 border border-slate-800/60 rounded-2xl bg-slate-950/40 space-y-4 relative"
              >
                <button
                  (click)="removeEducation(idx)"
                  class="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <mat-icon class="!text-lg">delete</mat-icon>
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field appearance="outline" class="w-full dark-form-field !text-xs">
                    <mat-label>Degree</mat-label>
                    <input matInput [(ngModel)]="edu.degree" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full dark-form-field !text-xs">
                    <mat-label>College / University</mat-label>
                    <input matInput [(ngModel)]="edu.college" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full dark-form-field !text-xs">
                    <mat-label>Duration</mat-label>
                    <input matInput [(ngModel)]="edu.duration" placeholder="e.g. 2018 - 2022" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full dark-form-field !text-xs">
                    <mat-label>GPA / Grade</mat-label>
                    <input matInput [(ngModel)]="edu.gpa" placeholder="e.g. 3.8/4.0" />
                  </mat-form-field>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Experience Section -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-sm font-bold text-slate-200 font-outfit flex items-center space-x-2">
                <mat-icon class="text-teal-400">work_outline</mat-icon>
                <span>Work Experience</span>
              </h3>
              <button
                (click)="addExperience()"
                class="text-xs text-violet-400 font-bold hover:text-violet-300 transition-colors flex items-center space-x-1"
              >
                <span>+ Add Experience</span>
              </button>
            </div>

            <div class="space-y-6">
              <div
                *ngFor="let exp of resume.experience; let idx = index"
                class="p-5 border border-slate-800/60 rounded-2xl bg-slate-950/40 space-y-4 relative"
              >
                <button
                  (click)="removeExperience(idx)"
                  class="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors"
                >
                  <mat-icon class="!text-lg">delete</mat-icon>
                </button>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <mat-form-field appearance="outline" class="w-full dark-form-field !text-xs">
                    <mat-label>Job Title</mat-label>
                    <input matInput [(ngModel)]="exp.position" />
                  </mat-form-field>
                  <mat-form-field appearance="outline" class="w-full dark-form-field !text-xs">
                    <mat-label>Company</mat-label>
                    <input matInput [(ngModel)]="exp.company" />
                  </mat-form-field>
                  <mat-form-field
                    appearance="outline"
                    class="w-full dark-form-field !text-xs md:col-span-2"
                  >
                    <mat-label>Duration</mat-label>
                    <input matInput [(ngModel)]="exp.duration" />
                  </mat-form-field>
                </div>

                <!-- Responsibilities bullets -->
                <div class="space-y-3">
                  <div
                    class="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                  >
                    <span>Bullet Achievements</span>
                    <button
                      (click)="addResponsibility(idx)"
                      class="text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      + Add bullet
                    </button>
                  </div>
                  <div
                    *ngFor="
                      let resp of exp.responsibilities;
                      let bulletIdx = index;
                      trackBy: trackByIndex
                    "
                    class="flex items-center space-x-2"
                  >
                    <input
                      [(ngModel)]="exp.responsibilities[bulletIdx]"
                      class="flex-1 bg-slate-900 border border-slate-800 text-xs p-2.5 rounded-xl outline-none focus:border-violet-500 text-slate-200 transition-colors placeholder:text-slate-500"
                    />
                    <button
                      (click)="removeResponsibility(idx, bulletIdx)"
                      class="text-slate-500 hover:text-red-450 font-bold shrink-0 text-lg px-1"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Right Column: Live rendering canvas -->
        <div
          class="sticky top-24 border border-slate-800 rounded-3xl p-6 bg-slate-950/40 shadow-2xl space-y-4 max-h-[82vh] overflow-y-auto glass-card"
        >
          <!-- MacOS style toolbar header -->
          <div class="flex items-center justify-between pb-2 border-b border-slate-900">
            <div class="flex items-center space-x-2">
              <span class="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span class="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest"
              >Live Preview Frame</span
            >
            <span class="w-12"></span>
          </div>

          <div
            id="resumeCanvas"
            [ngClass]="getTemplateClass()"
            class="p-8 bg-white text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.4)] border border-slate-200 aspect-[1/1.4] overflow-y-auto rounded-lg"
          >
            <!-- Header -->
            <div class="text-center space-y-1 pb-4 border-b border-slate-200">
              <h1 class="text-2xl font-bold tracking-tight text-slate-900">
                {{ resume.personalInfo.name || 'Your Full Name' }}
              </h1>
              <p class="text-[11px] text-slate-500">
                {{ resume.personalInfo.email || 'email@example.com' }} &bull;
                {{ resume.personalInfo.phone || '+1 555-555-5555' }} &bull;
                {{ resume.personalInfo.linkedin || 'linkedin/in' }}
              </p>
            </div>

            <!-- Summary -->
            <div class="mt-4 space-y-1.5" *ngIf="resume.personalInfo.summary">
              <h2
                class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-0.5"
              >
                Professional Summary
              </h2>
              <p class="text-[10px] text-slate-600 leading-relaxed">
                {{ resume.personalInfo.summary }}
              </p>
            </div>

            <!-- Experience -->
            <div class="mt-4 space-y-3" *ngIf="resume.experience.length > 0">
              <h2
                class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-0.5"
              >
                Work History
              </h2>
              <div *ngFor="let exp of resume.experience" class="space-y-1">
                <div class="flex items-center justify-between text-[11px] font-bold text-slate-800">
                  <span>{{ exp.position || 'Position' }} at {{ exp.company || 'Company' }}</span>
                  <span class="text-[9px] font-normal text-slate-500 font-mono">{{
                    exp.duration || 'Duration'
                  }}</span>
                </div>
                <ul class="list-disc list-inside text-[9.5px] text-slate-600 space-y-0.5 pl-2">
                  <li *ngFor="let resp of exp.responsibilities">{{ resp }}</li>
                </ul>
              </div>
            </div>

            <!-- Education -->
            <div class="mt-4 space-y-2" *ngIf="resume.education.length > 0">
              <h2
                class="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-0.5"
              >
                Education
              </h2>
              <div
                *ngFor="let edu of resume.education"
                class="flex items-start justify-between text-[10px]"
              >
                <div>
                  <strong class="text-slate-800">{{ edu.degree || 'Degree' }}</strong>
                  <span class="text-slate-500"> — {{ edu.college || 'Institution' }}</span>
                </div>
                <div class="text-right text-[9px] font-mono text-slate-500">
                  <span>{{ edu.duration }}</span>
                  <span *ngIf="edu.gpa" class="block">GPA: {{ edu.gpa }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .dark-form-field .mat-mdc-form-field-flex {
        background-color: rgba(2, 6, 23, 0.4) !important;
        border-radius: 0.75rem !important;
      }
      ::ng-deep .mat-mdc-select-value {
        color: #cbd5e1 !important;
      }

      /* Template stylesheets rules inside the preview container */
      .template-ats {
        font-family: 'Inter', sans-serif;
      }
      .template-modern {
        font-family: 'Outfit', sans-serif;
        border-top: 6px solid #8b5cf6 !important;
      }
      .template-corporate {
        font-family: 'Georgia', serif;
      }
      .template-minimalist {
        font-family: 'Courier New', monospace;
        padding: 1.5rem !important;
      }
    `,
  ],
})
export class BuilderComponent {
  activeTemplate = 'ats';

  readonly resume: BuilderData = {
    personalInfo: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1 (555) 123-4567',
      linkedin: 'linkedin.com/in/johndoe',
      github: 'github.com/johndoe',
      summary: 'Experienced Full Stack Developer with passion for system optimization.',
    },
    education: [
      {
        degree: 'BS in Computer Science',
        college: 'State Technical University',
        duration: '2019 - 2023',
        gpa: '3.8/4.0',
      },
    ],
    experience: [
      {
        company: 'Innovate Solutions',
        position: 'Software Developer Intern',
        duration: 'June 2022 - Sept 2022',
        responsibilities: [
          'Engineered responsive layouts and web dashboard modules.',
          'Assisted and paired with API backend development teams.',
          'Configured CI builds and resolved bug logs.',
        ],
      },
    ],
    skills: ['JavaScript', 'TypeScript', 'Angular', 'Node.js', 'SQL', 'Git'],
  };

  constructor(private resumeService: ResumeService) {}

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  getTemplateClass(): string {
    return (
      {
        ats: 'template-ats',
        modern: 'template-modern',
        corporate: 'template-corporate',
        minimalist: 'template-minimalist',
      }[this.activeTemplate] || 'template-ats'
    );
  }

  addEducation(): void {
    this.resume.education.push({ degree: '', college: '', duration: '', gpa: '' });
  }

  removeEducation(idx: number): void {
    this.resume.education.splice(idx, 1);
  }

  addExperience(): void {
    this.resume.experience.push({
      company: '',
      position: '',
      duration: '',
      responsibilities: ['New responsibility bullet'],
    });
  }

  removeExperience(idx: number): void {
    this.resume.experience.splice(idx, 1);
  }

  addResponsibility(expIdx: number): void {
    this.resume.experience[expIdx].responsibilities.push('New responsibility bullet');
  }

  removeResponsibility(expIdx: number, bulletIdx: number): void {
    this.resume.experience[expIdx].responsibilities.splice(bulletIdx, 1);
  }

  saveDraft(): void {
    const title = `${this.resume.personalInfo.name}'s Resume (Draft)`;
    this.resumeService.saveBuilderResume(title, this.resume).subscribe({
      next: () => {
        alert('Draft saved in system database successfully.');
      },
    });
  }

  exportPDF(): void {
    // Generate isolated styled window for print rendering
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to export your PDF.');
      return;
    }

    const canvasHtml = document.getElementById('resumeCanvas')?.innerHTML || '';

    // Choose font family
    let fontFamily = "'Inter', sans-serif";
    let borderTop = '';
    if (this.activeTemplate === 'corporate') fontFamily = "'Georgia', serif";
    if (this.activeTemplate === 'minimalist') fontFamily = "'Courier New', monospace";
    if (this.activeTemplate === 'modern') {
      fontFamily = "'Outfit', sans-serif";
      borderTop = 'border-top: 8px solid #8b5cf6;';
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Resume Export</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=Outfit:wght@300;400;600;700&display=swap');
            body {
              font-family: ${fontFamily};
              color: #1e293b;
              margin: 0;
              padding: 40px;
              background-color: white;
              line-height: 1.5;
            }
            .resume-container {
              max-width: 800px;
              margin: 0 auto;
              ${borderTop}
            }
            .text-center { text-align: center; }
            .space-y-1 > * + * { margin-top: 4px; }
            .pb-4 { padding-bottom: 16px; }
            .border-b { border-bottom: 1px solid #e2e8f0; }
            .border-slate-200 { border-color: #cbd5e1; }
            .text-2xl { font-size: 24px; font-weight: 700; color: #0f172a; }
            .text-[11px] { font-size: 11px; color: #64748b; }
            .mt-4 { margin-top: 16px; }
            .space-y-1.5 > * + * { margin-top: 6px; }
            .text-xs { font-size: 12px; font-weight: 700; color: #1e293b; text-transform: uppercase; letter-spacing: 0.05em; }
            .text-[10px] { font-size: 10px; color: #475569; }
            .text-[9.5px] { font-size: 10px; color: #475569; }
            .text-slate-800 { color: #1e293b; }
            .text-slate-600 { color: #475569; }
            .text-slate-500 { color: #64748b; }
            .font-mono { font-family: monospace; }
            .flex { display: flex; }
            .items-center { align-items: center; }
            .justify-between { justify-content: space-between; }
            .list-disc { list-style-type: disc; }
            .list-inside { list-style-position: inside; }
            .pl-2 { padding-left: 8px; }
            .space-y-3 > * + * { margin-top: 12px; }
            ul { margin: 4px 0 0 0; padding-left: 12px; }
            li { margin-bottom: 2px; }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          <div class="resume-container">
            ${canvasHtml}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
}
