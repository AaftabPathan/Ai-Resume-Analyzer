import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ResumeService } from '../../core/services/resume.service';
import { CareerService } from '../../core/services/career.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface RankedCandidate {
  id: number;
  name: string;
  email: string;
  title: string;
  matchScore: number;
  missingSkills: string[];
  weaknesses: string[];
}

@Component({
  selector: 'app-recruiter',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="space-y-6">
      <!-- Top banner -->
      <div
        class="p-6 rounded-2xl bg-gradient-to-r from-emerald-900/40 via-indigo-950/20 to-slate-900 border border-emerald-800/20 shadow-xl"
      >
        <h1 class="text-xl md:text-2xl font-extrabold tracking-tight">Recruiter Command Portal</h1>
        <p class="text-slate-400 text-xs mt-1">
          Audit, rank, and match all candidate profiles in the database against target job specs.
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Job Description Input Column -->
        <div>
          <mat-card
            class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md space-y-4"
          >
            <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4">
              Job Specification
            </h3>

            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Required Position Title</mat-label>
              <input matInput [(ngModel)]="jobTitle" placeholder="e.g. Senior DevOps Engineer" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Job Description Requirements</mat-label>
              <textarea
                matInput
                [(ngModel)]="jobDescription"
                placeholder="Paste full description text here to run keyword overlap analysis..."
                rows="8"
                required
              ></textarea>
            </mat-form-field>

            <button
              (click)="rankCandidates()"
              [disabled]="isRanking() || !jobDescription"
              mat-raised-button
              color="primary"
              class="!w-full !bg-gradient-to-r !from-emerald-600 !to-indigo-600 !text-white !py-3 !rounded-xl !font-bold !shadow-md"
            >
              Rank Candidates
            </button>
          </mat-card>
        </div>

        <!-- Ranking Results Column -->
        <div class="lg:col-span-2 space-y-6">
          <mat-card
            class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md min-h-[500px] flex flex-col justify-between relative"
          >
            <mat-progress-bar
              *ngIf="isRanking()"
              mode="indeterminate"
              class="absolute top-0 left-0 right-0 !h-1"
              color="accent"
            ></mat-progress-bar>

            <div>
              <div class="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
                <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider">
                  Candidate Rank List
                </h3>
                <span class="text-xs text-slate-500" *ngIf="rankedList().length > 0"
                  >{{ rankedList().length }} Candidates Ranked</span
                >
              </div>

              <!-- List of candidates -->
              <div class="space-y-4" *ngIf="rankedList().length > 0 && !isRanking()">
                <div
                  *ngFor="let cand of rankedList(); let idx = index"
                  class="p-5 border border-slate-800 bg-slate-950/40 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-700 transition"
                >
                  <div class="space-y-2">
                    <div class="flex items-center space-x-3">
                      <span
                        class="w-6 h-6 rounded-lg bg-slate-800 text-[10px] font-bold flex items-center justify-center border border-slate-700 text-slate-400"
                        >#{{ idx + 1 }}</span
                      >
                      <div>
                        <h4 class="text-xs font-bold text-slate-200">{{ cand.name }}</h4>
                        <span class="text-[9px] text-slate-500 block">{{ cand.email }}</span>
                      </div>
                    </div>

                    <div *ngIf="cand.missingSkills.length > 0" class="text-[10px]">
                      <span class="text-slate-500 font-bold block mb-1">Gaps Found:</span>
                      <div class="flex flex-wrap gap-1">
                        <span
                          *ngFor="let s of cand.missingSkills.slice(0, 3)"
                          class="px-1.5 py-0.5 rounded bg-violet-950/20 text-violet-400 border border-violet-900/40"
                          >{{ s }}</span
                        >
                        <span
                          *ngIf="cand.missingSkills.length > 3"
                          class="text-[9px] text-slate-500 self-center"
                          >+{{ cand.missingSkills.length - 3 }} more</span
                        >
                      </div>
                    </div>
                  </div>

                  <div class="flex items-center space-x-6 justify-between md:justify-end shrink-0">
                    <div class="text-right">
                      <span
                        [class]="
                          'text-3xl font-extrabold font-mono ' +
                          (cand.matchScore >= 85
                            ? 'text-emerald-400'
                            : cand.matchScore >= 70
                              ? 'text-indigo-400'
                              : 'text-amber-500')
                        "
                      >
                        {{ cand.matchScore }}%
                      </span>
                      <span
                        class="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mt-1"
                        >Match Index</span
                      >
                    </div>

                    <button
                      (click)="inspectCandidate(cand.id)"
                      mat-icon-button
                      class="text-slate-400 hover:text-white border border-slate-800 hover:bg-slate-900 rounded-lg"
                    >
                      <mat-icon class="!text-sm flex items-center justify-center"
                        >visibility</mat-icon
                      >
                    </button>
                  </div>
                </div>
              </div>

              <!-- Empty prompt -->
              <div
                *ngIf="rankedList().length === 0 && !isRanking()"
                class="flex flex-col items-center justify-center py-24 text-slate-500 text-sm"
              >
                <mat-icon class="!w-16 !h-16 !text-6xl mb-4 text-slate-700">badge</mat-icon>
                <p>
                  Paste the target position spec and click "Rank Candidates" to audit all records.
                </p>
              </div>

              <!-- Loading details -->
              <div
                *ngIf="isRanking()"
                class="flex flex-col items-center justify-center py-24 text-slate-400 text-sm"
              >
                <span>Calculating NLP semantic keyword overlap for all database profiles...</span>
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
        background-color: rgb(2 6 23 / 0.5) !important;
        border-radius: 0.75rem !important;
      }
      ::ng-deep
        .dark-form-field
        .mdc-text-field--outlined:not(.mdc-text-field--disabled)
        .mdc-notched-outline__leading,
      ::ng-deep
        .dark-form-field
        .mdc-text-field--outlined:not(.mdc-text-field--disabled)
        .mdc-notched-outline__notch,
      ::ng-deep
        .dark-form-field
        .mdc-text-field--outlined:not(.mdc-text-field--disabled)
        .mdc-notched-outline__trailing {
        border-color: rgb(30 41 59) !important;
      }
      ::ng-deep
        .dark-form-field
        .mdc-text-field--outlined:not(.mdc-text-field--focused)
        .mdc-text-field__input {
        color: #cbd5e1 !important;
      }
    `,
  ],
})
export class RecruiterComponent implements OnInit {
  jobTitle = '';
  jobDescription = '';
  readonly isRanking = signal(false);
  readonly rankedList = signal<RankedCandidate[]>([]);

  constructor(
    private resumeService: ResumeService,
    private careerService: CareerService,
  ) {}

  ngOnInit(): void {}

  rankCandidates(): void {
    if (!this.jobDescription.trim()) return;

    this.isRanking.set(true);
    this.rankedList.set([]);

    // Get all candidate resumes from the system
    this.resumeService.getAllResumesForRecruiter().subscribe({
      next: (res) => {
        if (res.resumes.length === 0) {
          this.isRanking.set(false);
          alert(
            'No resumes found in the database. Please register a candidate account and upload a resume first.',
          );
          return;
        }

        // ForkJoin match job calls for each candidate resume in parallel
        const matchRequests = res.resumes.map((cand) => {
          return this.careerService.matchJob(cand.id, this.jobDescription).pipe(
            catchError(() => of({ matchPercentage: 50, missingSkills: [], weaknesses: [] })), // Fallback if single call fails
          );
        });

        forkJoin(matchRequests).subscribe({
          next: (matchResults: any[]) => {
            const list: RankedCandidate[] = res.resumes.map((cand, idx) => {
              const match = matchResults[idx];
              return {
                id: cand.id,
                name: cand.user_name || 'Anonymous Candidate',
                email: cand.user_email || '',
                title: cand.title,
                matchScore: match.matchPercentage || 60,
                missingSkills: match.missingSkills || [],
                weaknesses: match.weaknesses || [],
              };
            });

            // Sort list from highest matching score to lowest
            list.sort((a, b) => b.matchScore - a.matchScore);

            this.isRanking.set(false);
            this.rankedList.set(list);
          },
          error: (err) => {
            this.isRanking.set(false);
            alert('Failed to evaluate match indexes: ' + err.message);
          },
        });
      },
      error: (err) => {
        this.isRanking.set(false);
        alert('Failed to fetch candidate resumes: ' + err.message);
      },
    });
  }

  inspectCandidate(resumeId: number): void {
    // Open candidate analysis page
    window.open(`/analyzer?resumeId=${resumeId}`, '_blank');
  }
}
