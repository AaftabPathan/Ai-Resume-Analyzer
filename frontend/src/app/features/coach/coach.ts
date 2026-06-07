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
import { MatTabsModule } from '@angular/material/tabs';
import { ResumeService, Resume } from '../../core/services/resume.service';
import {
  CareerService,
  CareerRoadmap,
  InterviewQuestion,
  SkillGapResponse,
} from '../../core/services/career.service';

@Component({
  selector: 'app-coach',
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
    MatTabsModule,
  ],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Top selectors -->
      <div
        class="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card"
      >
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight text-white font-outfit">
            AI Career Coach Workstation
          </h1>
          <p class="text-slate-400 text-xs mt-1">
            Build custom transition timelines, analyze skills alignment, and master mock interview
            preparations.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <mat-form-field
            appearance="outline"
            class="dark-form-field !text-xs shrink-0 w-full md:w-60"
          >
            <mat-label>Active Resume Profile</mat-label>
            <mat-select [(ngModel)]="selectedResumeId" (selectionChange)="onResumeSelected()">
              <mat-option *ngFor="let res of resumes()" [value]="res.id">{{
                res.title
              }}</mat-option>
              <mat-option *ngIf="resumes().length === 0" [disabled]="true"
                >No resumes uploaded</mat-option
              >
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <!-- Main Navigation Tabs -->
      <mat-tab-group class="dark-tabs">
        <!-- Tab 1: Career Roadmaps -->
        <mat-tab label="Interactive Roadmaps">
          <div class="py-6 space-y-6">
            <div class="flex flex-wrap items-center gap-4">
              <mat-form-field appearance="outline" class="dark-form-field w-64 !text-xs">
                <mat-label>Choose Career Track</mat-label>
                <mat-select [(ngModel)]="targetRoadmapRole" (selectionChange)="loadRoadmap()">
                  <mat-option value="DevOps Engineer">DevOps Engineer</mat-option>
                  <mat-option value="Cloud Engineer">Cloud Engineer</mat-option>
                  <mat-option value="Full Stack Developer">Full Stack Developer</mat-option>
                  <mat-option value="AI Engineer">AI Engineer</mat-option>
                  <mat-option value="Cyber Security Engineer">Cyber Security Engineer</mat-option>
                </mat-select>
              </mat-form-field>

              <button
                (click)="loadRoadmap()"
                mat-raised-button
                color="primary"
                class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[48px] !px-6 !font-bold text-white shadow-lg shadow-violet-500/25 glowing-btn-hover"
              >
                Generate Path
              </button>
            </div>

            <!-- Roadmap results -->
            <div *ngIf="roadmap()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Timeline Details -->
              <div class="lg:col-span-2 space-y-6">
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card relative"
                >
                  <h3 class="text-base font-bold text-slate-250 mb-6 font-outfit">
                    Learning Pathway: {{ roadmap()?.role }}
                  </h3>

                  <!-- Timeline -->
                  <div class="relative pl-8 border-l border-slate-800 space-y-8 ml-3">
                    <div
                      *ngFor="let step of roadmap()?.roadmapSteps; let idx = index"
                      class="relative group"
                    >
                      <!-- Dot -->
                      <div
                        class="absolute -left-[39px] top-1 w-3 h-3 rounded-full bg-violet-600 border-2 border-slate-950 flex items-center justify-center transition-all group-hover:scale-125"
                        style="box-shadow: 0 0 10px rgba(139, 92, 246, 0.6);"
                      ></div>

                      <div class="space-y-3">
                        <h4 class="text-sm font-bold text-violet-400 font-outfit">
                          {{ step.phase }}
                        </h4>
                        <div class="flex flex-wrap gap-2">
                          <span
                            *ngFor="let topic of step.topics"
                            class="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-350"
                          >
                            {{ topic }}
                          </span>
                        </div>
                        <div
                          class="p-4 bg-slate-950/40 border border-slate-850 rounded-2xl text-xs text-slate-400 mt-2 leading-relaxed"
                        >
                          <strong class="text-slate-300 block mb-1 font-outfit"
                            >Recommended Project:</strong
                          >
                          <span *ngFor="let proj of step.projects" class="font-medium">{{
                            proj
                          }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card>
              </div>

              <!-- Sidebar Checklist -->
              <div class="space-y-6">
                <!-- Skills Required -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <h3
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 font-outfit"
                  >
                    Required Skills
                  </h3>
                  <div class="space-y-5">
                    <div>
                      <h4
                        class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2"
                      >
                        Essential
                      </h4>
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          *ngFor="let s of roadmap()?.skills?.essential"
                          class="px-2.5 py-1 rounded-lg bg-violet-950/30 border border-violet-900/50 text-[10px] text-violet-300 font-medium"
                          >{{ s }}</span
                        >
                      </div>
                    </div>
                    <div>
                      <h4
                        class="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2"
                      >
                        Secondary / Intermediate
                      </h4>
                      <div class="flex flex-wrap gap-1.5">
                        <span
                          *ngFor="let s of roadmap()?.skills?.intermediate"
                          class="px-2.5 py-1 rounded-lg bg-indigo-950/30 border border-indigo-900/50 text-[10px] text-indigo-300 font-medium"
                          >{{ s }}</span
                        >
                      </div>
                    </div>
                  </div>
                </mat-card>

                <!-- Certifications -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <h3
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-outfit"
                  >
                    Target Certifications
                  </h3>
                  <ul class="space-y-3 text-xs text-slate-300">
                    <li
                      *ngFor="let c of roadmap()?.certifications"
                      class="flex items-center space-x-3 p-1 rounded-lg hover:bg-slate-850/30 transition-colors"
                    >
                      <mat-icon
                        class="!text-xs !w-4 !h-4 !flex !items-center !justify-center text-emerald-400 shrink-0"
                        >verified</mat-icon
                      >
                      <span class="font-medium">{{ c }}</span>
                    </li>
                  </ul>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 2: Interview Prep Q&A -->
        <mat-tab label="AI Mock Interview Prep">
          <div class="py-6 space-y-6">
            <div
              class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-6 rounded-3xl border border-slate-850 bg-slate-900/40 glass-card"
            >
              <div class="space-y-1">
                <span class="font-bold block text-slate-200 font-outfit text-sm"
                  >Personalized Interview Q&A Cards</span
                >
                <span class="text-slate-400 text-xs leading-relaxed block max-w-lg"
                  >Generate dynamic, highly role-aligned behavioral and technical questions based on
                  your resume stack.</span
                >
              </div>
              <div class="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <input
                  #interviewRoleInput
                  placeholder="Target Job Title..."
                  class="bg-slate-950 border border-slate-800 text-xs px-4 py-3 rounded-xl outline-none focus:border-violet-500 h-[44px] text-slate-200 flex-1 lg:flex-initial lg:w-60"
                />
                <button
                  (click)="generateInterviewQuestions(interviewRoleInput.value)"
                  mat-raised-button
                  color="primary"
                  class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[44px] text-xs font-bold text-white shadow-lg shadow-violet-500/20 glowing-btn-hover shrink-0 px-6"
                >
                  Generate Cards
                </button>
              </div>
            </div>

            <!-- Loading Spinner -->
            <div *ngIf="isGeneratingQuestions()" class="text-center py-16 text-slate-400 text-sm">
              <mat-progress-bar
                mode="indeterminate"
                class="max-w-xs mx-auto !h-1.5 mb-5"
                color="primary"
              ></mat-progress-bar>
              <span>Formulating custom AI interview dashboard tailored to your resume...</span>
            </div>

            <!-- Questions accordion -->
            <div *ngIf="!isGeneratingQuestions() && questions().length > 0" class="space-y-4">
              <div
                *ngFor="let q of questions(); let qIdx = index"
                class="border border-slate-800/80 rounded-2xl bg-slate-900/20 overflow-hidden glass-card transition-all"
              >
                <!-- Header trigger -->
                <div
                  (click)="toggleQuestion(qIdx)"
                  class="p-4.5 cursor-pointer hover:bg-slate-800/35 transition-colors flex items-center justify-between gap-4"
                >
                  <div class="flex items-center space-x-3 min-w-0">
                    <span
                      [class]="
                        'px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider shrink-0 ' +
                        (q.type === 'Technical'
                          ? 'bg-indigo-950/40 border border-indigo-900/60 text-indigo-300'
                          : q.type === 'Behavioral'
                            ? 'bg-violet-950/40 border border-violet-900/60 text-violet-300'
                            : 'bg-emerald-950/40 border border-emerald-900/60 text-emerald-300')
                      "
                    >
                      {{ q.type }}
                    </span>
                    <h4 class="text-xs font-bold text-slate-200 truncate pr-4 font-outfit">
                      {{ q.question }}
                    </h4>
                  </div>
                  <div class="flex items-center space-x-3 shrink-0">
                    <span
                      class="text-[10px] font-mono font-bold text-slate-500 bg-slate-950 border border-slate-850 px-2 py-0.5 rounded-lg"
                      >Diff: {{ q.difficulty }}</span
                    >
                    <mat-icon
                      class="text-slate-500 transition-transform duration-200"
                      [class.rotate-180]="expandedQuestion() === qIdx"
                      >expand_more</mat-icon
                    >
                  </div>
                </div>

                <!-- Expanded notes area -->
                <div
                  *ngIf="expandedQuestion() === qIdx"
                  class="p-6 bg-slate-950/45 border-t border-slate-900/80 space-y-5"
                >
                  <!-- AI suggested answer structure -->
                  <div
                    class="p-4 rounded-2xl border border-indigo-900/30 bg-indigo-950/5 text-slate-350 text-xs leading-relaxed"
                  >
                    <strong
                      class="block text-indigo-400 mb-1.5 text-[9px] uppercase tracking-wider font-bold"
                      >Suggested Answer Matrix</strong
                    >
                    {{ q.suggestedAnswer }}
                  </div>

                  <!-- Candidate Answer Box -->
                  <div class="space-y-3.5">
                    <label
                      class="block text-[9px] font-bold text-slate-400 uppercase tracking-widest"
                      >My Draft Answer & Notes</label
                    >
                    <textarea
                      [(ngModel)]="q.userNotes"
                      placeholder="Draft your thoughts, key talking points, or draft response here..."
                      class="w-full h-28 p-3.5 bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-2xl outline-none focus:border-violet-500/80 transition-colors resize-y leading-relaxed"
                    ></textarea>

                    <div class="flex items-center justify-between pt-1">
                      <span class="text-[10px] text-slate-500 italic"
                        >Draft answers auto-saved locally in workspace session.</span
                      >
                      <button
                        (click)="saveQuestionNotes(q.id, q.userNotes)"
                        mat-stroked-button
                        class="!border-slate-800 !rounded-xl !text-xs hover:!bg-slate-800/60 !text-slate-300 font-semibold px-4"
                      >
                        Save Draft Answer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </mat-tab>

        <!-- Tab 3: Skill Gap Analyzer -->
        <mat-tab label="Skill Gap Analysis">
          <div class="py-6 space-y-6">
            <div class="flex flex-wrap items-center gap-4">
              <mat-form-field appearance="outline" class="dark-form-field w-64 !text-xs">
                <mat-label>Target Career Role</mat-label>
                <mat-select [(ngModel)]="targetGapRole" (selectionChange)="analyzeSkillGap()">
                  <mat-option value="DevOps Engineer">DevOps Engineer</mat-option>
                  <mat-option value="Cloud Engineer">Cloud Engineer</mat-option>
                  <mat-option value="Full Stack Developer">Full Stack Developer</mat-option>
                  <mat-option value="AI Engineer">AI Engineer</mat-option>
                  <mat-option value="Cyber Security Engineer">Cyber Security Engineer</mat-option>
                </mat-select>
              </mat-form-field>

              <button
                (click)="analyzeSkillGap()"
                mat-raised-button
                color="primary"
                class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[48px] !px-6 !font-bold text-white shadow-lg shadow-violet-500/25 glowing-btn-hover"
              >
                Audit Skills Gap
              </button>
            </div>

            <!-- Gap Analyzer Result -->
            <div *ngIf="gapResult()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <!-- Metrics & Missing Lists -->
              <div class="lg:col-span-2 space-y-6">
                <!-- Score Card -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card flex items-center justify-between relative overflow-hidden"
                >
                  <div class="space-y-1.5">
                    <h3 class="text-base font-bold text-slate-200 font-outfit">
                      Alignment index: {{ gapResult()?.targetRole }}
                    </h3>
                    <p class="text-slate-400 text-xs leading-relaxed max-w-sm">
                      Resume contains {{ gapResult()?.currentSkillsCount }} out of
                      {{ gapResult()?.benchmarkSkillsCount }} core benchmark skills.
                    </p>
                  </div>
                  <div class="text-right z-10 shrink-0">
                    <span class="text-4xl font-extrabold text-emerald-450 font-mono"
                      >{{ gapResult()?.matchRate }}%</span
                    >
                    <span
                      class="block text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1"
                      >Match Index</span
                    >
                  </div>
                </mat-card>

                <!-- Skill checklists -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Match check -->
                  <div
                    class="p-6 rounded-3xl bg-slate-900/35 border border-slate-800/80 glass-card"
                  >
                    <h4 class="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
                      <mat-icon class="text-emerald-400">check_circle</mat-icon>
                      <span class="font-outfit">Acquired Skills</span>
                    </h4>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        *ngFor="let s of gapResult()?.essential"
                        class="px-2.5 py-1.5 rounded-lg bg-emerald-950/30 border border-emerald-900/40 text-[10px] text-emerald-350 font-medium"
                        >{{ s }}</span
                      >
                    </div>
                  </div>

                  <!-- Missing check -->
                  <div
                    class="p-6 rounded-3xl bg-slate-900/35 border border-slate-800/80 glass-card"
                  >
                    <h4 class="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
                      <mat-icon class="text-violet-400">remove_circle</mat-icon>
                      <span class="font-outfit">Missing Skills</span>
                    </h4>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        *ngFor="let s of gapResult()?.missing"
                        class="px-2.5 py-1.5 rounded-lg bg-violet-950/30 border border-violet-900/40 text-[10px] text-violet-350 font-medium"
                        >{{ s }}</span
                      >
                    </div>
                  </div>
                </div>
              </div>

              <!-- Recommendations Courses & Projects -->
              <div class="space-y-6">
                <!-- Courses -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <h3
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 font-outfit"
                  >
                    Recommended Pathways
                  </h3>
                  <div class="space-y-3">
                    <div
                      *ngFor="let crs of gapResult()?.courses"
                      class="p-3.5 border border-slate-850 bg-slate-950/40 rounded-2xl hover:border-slate-750 transition-colors"
                    >
                      <h4 class="text-xs font-bold text-slate-200 font-outfit">{{ crs.title }}</h4>
                      <span class="text-[9px] text-slate-500 font-semibold block mt-1"
                        >{{ crs.platform }} • {{ crs.duration }}</span
                      >
                    </div>
                  </div>
                </mat-card>

                <!-- Project options -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <h3
                    class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-outfit"
                  >
                    Capstone Project Suggestion
                  </h3>
                  <div *ngFor="let prj of gapResult()?.projects" class="space-y-2">
                    <h4 class="text-xs font-bold text-violet-400 font-outfit">{{ prj.title }}</h4>
                    <p class="text-[11px] text-slate-400 leading-relaxed font-semibold">
                      {{ prj.description }}
                    </p>
                  </div>
                </mat-card>
              </div>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [
    `
      ::ng-deep .dark-tabs .mat-mdc-tab-header {
        background-color: transparent !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05) !important;
      }
      ::ng-deep .dark-tabs .mat-mdc-tab-label {
        color: #94a3b8 !important;
        font-weight: 700 !important;
        font-size: 0.825rem !important;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        font-family: 'Outfit', sans-serif;
      }
      ::ng-deep .dark-tabs .mat-mdc-tab-label-active {
        color: #ffffff !important;
      }
      ::ng-deep .dark-tabs .mat-mdc-tab-body {
        background-color: transparent !important;
      }
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
export class CoachComponent implements OnInit {
  readonly resumes = signal<Resume[]>([]);
  selectedResumeId?: number;

  // Roadmap signals
  targetRoadmapRole = 'Full Stack Developer';
  readonly roadmap = signal<CareerRoadmap | null>(null);

  // Interview signals
  readonly isGeneratingQuestions = signal(false);
  readonly questions = signal<InterviewQuestion[]>([]);
  readonly expandedQuestion = signal<number | null>(null);

  // Skill gap signals
  targetGapRole = 'Full Stack Developer';
  readonly gapResult = signal<SkillGapResponse | null>(null);

  constructor(
    private resumeService: ResumeService,
    private careerService: CareerService,
  ) {}

  ngOnInit(): void {
    this.loadResumes();
    this.loadRoadmap();
  }

  loadResumes(): void {
    this.resumeService.getResumes().subscribe({
      next: (res) => {
        this.resumes.set(res.resumes);
        if (res.resumes.length > 0) {
          this.selectedResumeId = res.resumes[0].id;
          this.onResumeSelected();
        }
      },
    });
  }

  onResumeSelected(): void {
    if (this.selectedResumeId) {
      this.loadSavedQuestions();
      this.analyzeSkillGap();
    }
  }

  // ==========================================
  // Roadmap Methods
  // ==========================================
  loadRoadmap(): void {
    this.careerService.getRoadmap(this.targetRoadmapRole).subscribe({
      next: (res) => {
        this.roadmap.set(res.roadmap);
      },
    });
  }

  // ==========================================
  // Interview Q&A Methods
  // ==========================================
  loadSavedQuestions(): void {
    this.careerService.getSavedQuestions().subscribe({
      next: (res) => {
        // filter or load
        this.questions.set(res.questions);
      },
    });
  }

  generateInterviewQuestions(roleInput: string): void {
    if (!this.selectedResumeId) {
      alert('Please upload a resume before generating mock questions.');
      return;
    }
    const role = roleInput.trim() || 'Software Engineer';

    this.isGeneratingQuestions.set(true);
    this.careerService.generateInterviewQuestions(this.selectedResumeId, role).subscribe({
      next: (res) => {
        this.isGeneratingQuestions.set(false);
        this.questions.set(res.questions);
      },
      error: () => {
        this.isGeneratingQuestions.set(false);
      },
    });
  }

  toggleQuestion(idx: number): void {
    if (this.expandedQuestion() === idx) {
      this.expandedQuestion.set(null);
    } else {
      this.expandedQuestion.set(idx);
    }
  }

  saveQuestionNotes(id: number, notes: string): void {
    this.careerService.updateQuestionNotes(id, notes).subscribe({
      next: () => {
        alert('Answer draft saved successfully.');
      },
    });
  }

  // ==========================================
  // Skill Gap Methods
  // ==========================================
  analyzeSkillGap(): void {
    if (!this.selectedResumeId) return;
    this.careerService.getSkillGap(this.selectedResumeId, this.targetGapRole).subscribe({
      next: (res) => {
        this.gapResult.set(res);
      },
    });
  }
}
