import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ResumeService, Resume } from '../../core/services/resume.service';
import { CareerService, CoverLetter } from '../../core/services/career.service';

@Component({
  selector: 'app-cover-letter',
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
    MatProgressBarModule,
  ],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Header Callout -->
      <div class="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl glass-card">
        <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-outfit">AI Cover Letter Generator</h1>
        <p class="text-slate-400 text-xs mt-1">
          Draft customized, high-impact cover letters matching target job specs and your resume capabilities.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Input parameters Form -->
        <div class="space-y-6 animate-slide-in-left">
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card space-y-4"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-outfit">
              Letter Configuration
            </h3>

            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Select Resume Source</mat-label>
              <mat-select [(ngModel)]="selectedResumeId" required>
                <mat-option *ngFor="let res of resumes()" [value]="res.id">{{
                  res.title
                }}</mat-option>
                <mat-option *ngIf="resumes().length === 0" [disabled]="true"
                  >No resumes uploaded</mat-option
                >
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Target Company</mat-label>
              <input matInput [(ngModel)]="companyName" placeholder="e.g. Google DeepMind" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Target Job Role</mat-label>
              <input matInput [(ngModel)]="jobTitle" placeholder="e.g. Senior Software Engineer" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Job Description / Keywords</mat-label>
              <textarea
                matInput
                [(ngModel)]="jobDescription"
                placeholder="Paste the key job description outcomes, requirements, or keywords here..."
                rows="4"
                required
              ></textarea>
            </mat-form-field>

            <button
              (click)="generateLetter()"
              [disabled]="isGenerating() || !selectedResumeId || !jobDescription"
              mat-raised-button
              color="primary"
              class="!w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 !text-white !py-3.5 !rounded-xl !font-bold !shadow-lg shadow-violet-500/20 glowing-btn-hover"
            >
              Generate AI Letter
            </button>
          </mat-card>

          <!-- History panel -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-outfit">
              Saved History
            </h3>

            <div class="space-y-3 max-h-[260px] overflow-y-auto pr-1">
              <div
                *ngFor="let letter of history()"
                (click)="
                  loadFromHistory(
                    letter.letter_text,
                    letter.recipient_company,
                    letter.recipient_role
                  )
                "
                class="p-4 border border-slate-850 bg-slate-950/30 hover:bg-slate-800/40 rounded-2xl cursor-pointer transition-all flex flex-col gap-1 group"
              >
                <h4 class="text-xs font-bold text-slate-200 group-hover:text-white transition-colors truncate">{{ letter.recipient_role }}</h4>
                <div class="flex justify-between items-center text-[9px] text-slate-500 font-semibold font-mono">
                  <span class="truncate pr-2">{{ letter.recipient_company }}</span>
                  <span class="shrink-0">{{ letter.created_at | date: 'shortDate' }}</span>
                </div>
              </div>
              <div *ngIf="history().length === 0" class="text-xs text-slate-500 text-center py-6 italic">
                No letters generated yet.
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Result Canvas Panel -->
        <div class="lg:col-span-2 space-y-6">
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card flex-1 min-h-[500px] flex flex-col justify-between relative overflow-hidden"
          >
            <mat-progress-bar
              *ngIf="isGenerating()"
              mode="indeterminate"
              class="absolute top-0 left-0 right-0 !h-1.5"
              color="primary"
            ></mat-progress-bar>

            <div>
              <div class="flex items-center justify-between border-b border-slate-850 pb-4 mb-6">
                <h3 class="text-xs font-bold text-slate-450 uppercase tracking-widest font-outfit">
                  AI Generated Document
                </h3>

                <div class="flex items-center space-x-3" *ngIf="letterText()">
                  <button
                    (click)="copyToClipboard()"
                    mat-stroked-button
                    class="!border-slate-850 !rounded-xl !text-xs hover:!bg-slate-800/60 !text-slate-350 hover:!text-white transition-all px-4 font-semibold"
                  >
                    Copy Text
                  </button>
                  <button
                    (click)="printDocument()"
                    mat-flat-button
                    color="primary"
                    class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !text-xs !font-bold text-white px-5 shadow-lg shadow-violet-500/20 glowing-btn-hover"
                  >
                    Print / Export
                  </button>
                </div>
              </div>

              <!-- Output Box -->
              <div
                *ngIf="letterText()"
                class="p-8 bg-white text-slate-800 rounded-2xl min-h-[440px] border border-slate-200 shadow-[0_12px_40px_rgba(0,0,0,0.4)] font-serif text-[13px] whitespace-pre-line leading-relaxed"
              >
                {{ letterText() }}
              </div>

              <div
                *ngIf="!letterText() && !isGenerating()"
                class="flex flex-col items-center justify-center py-32 text-slate-500 text-sm"
              >
                <div class="w-16 h-16 rounded-2xl bg-slate-900/60 flex items-center justify-center border border-slate-800/80 text-violet-400 text-3xl mb-4 animate-float-slow">
                  ✉️
                </div>
                <p class="text-xs text-slate-400 font-medium max-w-xs text-center leading-relaxed">
                  Configure configuration options and press "Generate AI Letter" to formulate your customized cover draft.
                </p>
              </div>

              <div *ngIf="isGenerating()" class="text-center py-32 text-slate-400 text-sm flex flex-col items-center justify-center space-y-4">
                <span class="w-2.5 h-2.5 rounded-full bg-violet-500 animate-ping"></span>
                <span class="text-xs text-slate-400 font-medium">Writing cover draft utilizing context specifications...</span>
              </div>
            </div>
          </mat-card>
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
    `,
  ],
})
export class CoverLetterComponent implements OnInit {
  readonly resumes = signal<Resume[]>([]);
  readonly history = signal<CoverLetter[]>([]);

  selectedResumeId?: number;
  companyName = '';
  jobTitle = '';
  jobDescription = '';

  readonly isGenerating = signal(false);
  readonly letterText = signal<string | null>(null);

  constructor(
    private resumeService: ResumeService,
    private careerService: CareerService,
  ) {}

  ngOnInit(): void {
    this.loadResumes();
    this.loadHistory();
  }

  loadResumes(): void {
    this.resumeService.getResumes().subscribe({
      next: (res) => {
        this.resumes.set(res.resumes);
        if (res.resumes.length > 0) {
          this.selectedResumeId = res.resumes[0].id;
        }
      },
    });
  }

  loadHistory(): void {
    this.careerService.getCoverLetters().subscribe({
      next: (res) => {
        this.history.set(res.letters);
      },
    });
  }

  generateLetter(): void {
    if (!this.selectedResumeId || !this.jobDescription) return;

    this.isGenerating.set(true);
    this.letterText.set(null);

    this.careerService
      .generateCoverLetter(
        this.selectedResumeId,
        this.jobDescription,
        this.companyName || 'Target Company',
        this.jobTitle || 'Target Role',
      )
      .subscribe({
        next: (res) => {
          this.isGenerating.set(false);
          this.letterText.set(res.letterText);
          this.loadHistory();
        },
        error: () => {
          this.isGenerating.set(false);
        },
      });
  }

  loadFromHistory(text: string, company: string, role: string): void {
    this.letterText.set(text);
    this.companyName = company;
    this.jobTitle = role;
  }

  copyToClipboard(): void {
    const text = this.letterText();
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
        alert('Cover letter text copied to clipboard!');
      });
    }
  }

  printDocument(): void {
    const text = this.letterText();
    if (!text) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Pop-up blocker active. Please allow popups to export PDFs.');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Cover Letter Export</title>
          <style>
            body {
              font-family: 'Georgia', serif;
              font-size: 14px;
              color: #1e293b;
              margin: 0;
              padding: 50px;
              line-height: 1.6;
              white-space: pre-line;
            }
            @media print {
              body { padding: 0; }
              @page { size: A4; margin: 20mm; }
            }
          </style>
        </head>
        <body>
          ${text}
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
