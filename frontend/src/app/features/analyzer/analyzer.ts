import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ResumeService, ResumeDetailsResponse } from '../../core/services/resume.service';
import {
  CareerService,
  ATSEvalResponse,
  ImprovementSuggestions,
} from '../../core/services/career.service';

@Component({
  selector: 'app-analyzer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <div class="space-y-8 animate-fade-in">
      <!-- Upload Dashboard / Drag and drop (if no active resume loaded) -->
      <div
        *ngIf="!activeResumeId()"
        class="max-w-2xl mx-auto mt-16 p-12 glass-card glass-card-hover border-2 border-dashed border-slate-700/50 rounded-3xl text-center space-y-8 relative overflow-hidden animate-border-glow"
      >
        <!-- Top glowing ambient backdrop -->
        <div
          class="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none"
        ></div>

        <mat-progress-bar
          *ngIf="isUploading()"
          mode="indeterminate"
          class="absolute top-0 left-0 right-0 !h-1.5"
          color="primary"
        ></mat-progress-bar>

        <div
          class="w-20 h-20 rounded-2xl bg-slate-900/80 flex items-center justify-center text-4xl mx-auto shadow-lg border border-slate-800/80 text-violet-400 animate-float-slow"
        >
          📂
        </div>

        <div class="space-y-2">
          <h2 class="text-3xl font-extrabold tracking-tight text-white font-outfit">
            Upload Your Resume
          </h2>
          <p class="text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
            Upload your PDF, DOC, or DOCX resume. Our AI agent will audit structure, identify
            missing keywords, and grade ATS compatibility.
          </p>
        </div>

        <div class="flex flex-col items-center justify-center space-y-4">
          <label
            class="px-8 py-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl font-bold cursor-pointer hover:shadow-xl hover:shadow-violet-600/25 transition-all text-sm text-white glowing-btn-hover inline-flex items-center space-x-2"
          >
            <mat-icon class="text-sm">cloud_upload</mat-icon>
            <span>Browse Files</span>
            <input
              type="file"
              (change)="onFileSelected($event)"
              accept=".pdf,.doc,.docx"
              class="hidden"
            />
          </label>
          <span class="text-xs text-slate-500 font-medium"
            >Supported formats: PDF, DOC, DOCX up to 5MB</span
          >
        </div>

        <div
          *ngIf="uploadError()"
          class="p-4 bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-xl max-w-md mx-auto flex items-center space-x-2 justify-center"
        >
          <mat-icon class="text-red-400 text-sm">error_outline</mat-icon>
          <span>{{ uploadError() }}</span>
        </div>
      </div>

      <!-- Main Parser Workstation (if resume is loaded) -->
      <div *ngIf="activeResumeId()" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Sidebar controls (Upload new version, score ring, actions) -->
        <div class="space-y-6">
          <!-- ATS Circle Dashboard -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl relative overflow-hidden glass-card"
          >
            <!-- Glowing accent dots -->
            <div
              class="absolute -top-12 -right-12 w-24 h-24 bg-violet-600/10 rounded-full blur-2xl"
            ></div>
            <div
              class="absolute -bottom-12 -left-12 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl"
            ></div>

            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 font-outfit">
              ATS Compatibility Rating
            </h3>

            <!-- Dynamic Ring -->
            <div class="flex flex-col items-center justify-center space-y-6">
              <div class="relative w-44 h-44 flex items-center justify-center">
                <!-- SVG Circle Track -->
                <svg class="absolute w-full h-full transform -rotate-90">
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="rgba(255, 255, 255, 0.03)"
                    stroke-width="12"
                    fill="transparent"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="76"
                    stroke="url(#atsGlow)"
                    stroke-dasharray="478"
                    [attr.stroke-dashoffset]="478 - (478 * atsScore()) / 100"
                    stroke-linecap="round"
                    stroke-width="12"
                    fill="transparent"
                    class="transition-all duration-1000 ease-out"
                    style="filter: drop-shadow(0px 0px 8px rgba(139, 92, 246, 0.4));"
                  />
                  <defs>
                    <linearGradient id="atsGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="#a78bfa" />
                      <stop offset="60%" stop-color="#8b5cf6" />
                      <stop offset="100%" stop-color="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div class="text-center z-10">
                  <span class="text-5xl font-extrabold tracking-tight text-white font-outfit">{{
                    atsScore()
                  }}</span>
                  <span
                    class="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1"
                    >Overall Score</span
                  >
                </div>
              </div>

              <!-- Breakdown values with stylized visual meters -->
              <div class="w-full space-y-4 border-t border-slate-800/80 pt-6">
                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1.5">
                    <span class="text-slate-400">Formatting & Layout</span>
                    <span class="text-emerald-400 font-mono">{{ formatScore() }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-emerald-500 rounded-full"
                      [style.width.%]="formatScore()"
                    ></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1.5">
                    <span class="text-slate-400">Keyword Density</span>
                    <span class="text-violet-400 font-mono">{{ keywordScore() }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-violet-500 rounded-full"
                      [style.width.%]="keywordScore()"
                    ></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1.5">
                    <span class="text-slate-400">Experience Impact</span>
                    <span class="text-indigo-400 font-mono">{{ expScore() }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-indigo-500 rounded-full"
                      [style.width.%]="expScore()"
                    ></div>
                  </div>
                </div>

                <div>
                  <div class="flex justify-between text-xs font-semibold mb-1.5">
                    <span class="text-slate-400">Skills Alignment</span>
                    <span class="text-teal-400 font-mono">{{ skillScore() }}%</span>
                  </div>
                  <div class="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                    <div
                      class="h-full bg-teal-500 rounded-full"
                      [style.width.%]="skillScore()"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Version History -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-outfit">
              Version History
            </h3>
            <div class="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              <div
                *ngFor="let ver of versionsList()"
                (click)="switchVersion(ver.versionNumber)"
                [class.border-violet-500]="activeVersion() === ver.versionNumber"
                [class.bg-slate-800/20]="activeVersion() !== ver.versionNumber"
                [class.bg-violet-950/20]="activeVersion() === ver.versionNumber"
                class="p-3.5 border border-slate-800 rounded-2xl hover:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h4
                    class="text-xs font-bold text-slate-200 group-hover:text-white transition-colors"
                  >
                    Version {{ ver.versionNumber }}
                  </h4>
                  <span class="text-[10px] text-slate-500"
                    >{{ ver.createdAt | date: 'shortTime' }} on
                    {{ ver.createdAt | date: 'mediumDate' }}</span
                  >
                </div>
                <span
                  [class.bg-violet-900/60]="activeVersion() === ver.versionNumber"
                  [class.text-violet-300]="activeVersion() === ver.versionNumber"
                  [class.bg-slate-800]="activeVersion() !== ver.versionNumber"
                  [class.text-slate-400]="activeVersion() !== ver.versionNumber"
                  class="text-[10px] font-mono px-2.5 py-1 rounded-lg transition-colors"
                  >v{{ ver.versionNumber }}</span
                >
              </div>
            </div>

            <button
              (click)="resetView()"
              mat-stroked-button
              class="!border-slate-800 !rounded-xl !w-full hover:!bg-slate-800/60 mt-6 !py-6 !text-slate-300 !font-semibold hover:!text-white transition-all text-xs"
            >
              Upload Different Resume
            </button>
          </mat-card>
        </div>

        <!-- Main Workspace (Editor, breakdown, rewrites) -->
        <div class="lg:col-span-2 space-y-6">
          <mat-tab-group dynamicHeight class="dark-tabs">
            <!-- Tab 1: ATS evaluation detailed report -->
            <mat-tab label="ATS Diagnostics">
              <div class="py-6 space-y-6">
                <!-- Weakness & Keyword overlay -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <!-- Missing Keywords -->
                  <div
                    class="p-6 rounded-2xl bg-slate-900/35 border border-slate-800/80 glass-card"
                  >
                    <h4 class="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
                      <mat-icon class="text-violet-400 !w-5 !h-5 !text-[20px]"
                        >label_important</mat-icon
                      >
                      <span class="font-outfit">Missing Keywords</span>
                    </h4>
                    <div class="flex flex-wrap gap-2">
                      <span
                        *ngFor="let kw of missingKeywords()"
                        class="px-2.5 py-1 rounded-lg bg-violet-950/40 border border-violet-900/60 text-violet-300 text-xs font-mono font-semibold transition-all hover:scale-105 hover:bg-violet-900/40"
                      >
                        + {{ kw }}
                      </span>
                      <div
                        *ngIf="missingKeywords().length === 0"
                        class="text-xs text-slate-500 py-2"
                      >
                        All key role-aligned keywords are listed in your resume profile.
                      </div>
                    </div>
                  </div>

                  <!-- Resume Weaknesses -->
                  <div
                    class="p-6 rounded-2xl bg-slate-900/35 border border-slate-800/80 glass-card"
                  >
                    <h4 class="text-sm font-bold text-slate-200 mb-4 flex items-center space-x-2">
                      <mat-icon class="text-rose-400 !w-5 !h-5 !text-[20px]">warning</mat-icon>
                      <span class="font-outfit">Identified Weaknesses</span>
                    </h4>
                    <ul class="space-y-2.5 text-xs text-slate-300">
                      <li *ngFor="let wk of weaknesses()" class="flex items-start space-x-2">
                        <span class="text-rose-400 mt-0.5 font-bold shrink-0">•</span>
                        <span>{{ wk }}</span>
                      </li>
                      <li
                        *ngIf="weaknesses().length === 0"
                        class="text-slate-500 flex items-center space-x-2 py-2"
                      >
                        <mat-icon class="text-emerald-400 text-sm">check_circle</mat-icon>
                        <span>No critical formatting or structural issues found.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <!-- Section Diagnoses -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <h4 class="text-sm font-bold text-slate-200 mb-6 font-outfit">
                    Detailed Section Audit
                  </h4>

                  <div class="space-y-6">
                    <!-- Formatting feedback -->
                    <div class="border-b border-slate-800/60 pb-5">
                      <div class="flex items-center justify-between text-xs font-bold mb-2">
                        <span class="text-slate-300 flex items-center space-x-2">
                          <mat-icon class="text-emerald-400 !w-4 !h-4 !text-[16px]"
                            >text_fields</mat-icon
                          >
                          <span>Layout & Formatting</span>
                        </span>
                        <span class="text-slate-400">{{ formatScore() }}/100</span>
                      </div>
                      <p class="text-xs text-slate-400 leading-relaxed pl-6">
                        {{ breakdownFeedback().formatting }}
                      </p>
                    </div>

                    <!-- Keywords density feedback -->
                    <div class="border-b border-slate-800/60 pb-5">
                      <div class="flex items-center justify-between text-xs font-bold mb-2">
                        <span class="text-slate-300 flex items-center space-x-2">
                          <mat-icon class="text-violet-400 !w-4 !h-4 !text-[16px]"
                            >vpn_key</mat-icon
                          >
                          <span>Keyword Density</span>
                        </span>
                        <span class="text-slate-400">{{ keywordScore() }}/100</span>
                      </div>
                      <p class="text-xs text-slate-400 leading-relaxed pl-6">
                        {{ breakdownFeedback().keywords }}
                      </p>
                    </div>

                    <!-- Experience framing feedback -->
                    <div>
                      <div class="flex items-center justify-between text-xs font-bold mb-2">
                        <span class="text-slate-300 flex items-center space-x-2">
                          <mat-icon class="text-indigo-400 !w-4 !h-4 !text-[16px]"
                            >work_outline</mat-icon
                          >
                          <span>Experience Framing</span>
                        </span>
                        <span class="text-slate-400">{{ expScore() }}/100</span>
                      </div>
                      <p class="text-xs text-slate-400 leading-relaxed pl-6">
                        {{ breakdownFeedback().experience }}
                      </p>
                    </div>
                  </div>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab 2: Profile structure editor -->
            <mat-tab label="Resume Structure">
              <div class="py-6 space-y-6" *ngIf="resumeData()">
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-base font-bold text-slate-200 font-outfit">
                      Personal Information
                    </h3>
                    <button
                      (click)="saveResume()"
                      mat-raised-button
                      color="primary"
                      class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !px-5 !py-2.5 !text-white !font-bold glowing-btn-hover"
                    >
                      Save Changes
                    </button>
                  </div>

                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <mat-form-field appearance="outline" class="w-full dark-form-field">
                      <mat-label>Candidate Name</mat-label>
                      <input matInput [(ngModel)]="resumeData().personalInfo.name" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full dark-form-field">
                      <mat-label>Email Address</mat-label>
                      <input matInput [(ngModel)]="resumeData().personalInfo.email" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full dark-form-field">
                      <mat-label>Phone Number</mat-label>
                      <input matInput [(ngModel)]="resumeData().personalInfo.phone" />
                    </mat-form-field>

                    <mat-form-field appearance="outline" class="w-full dark-form-field">
                      <mat-label>LinkedIn Profile</mat-label>
                      <input matInput [(ngModel)]="resumeData().personalInfo.linkedin" />
                    </mat-form-field>
                  </div>
                </mat-card>

                <!-- Skills list -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                >
                  <h3 class="text-base font-bold text-slate-200 mb-6 font-outfit">
                    Technical Skills
                  </h3>
                  <div class="space-y-4">
                    <div class="p-5 rounded-2xl border border-slate-800 bg-slate-950/40">
                      <h4 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
                        Technical Stack
                      </h4>
                      <div class="flex flex-wrap gap-2">
                        <span
                          *ngFor="let s of resumeData().skills.technical; let idx = index"
                          class="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800/80 text-xs flex items-center space-x-2 text-slate-300 font-medium hover:border-violet-500/40 transition-colors"
                        >
                          <span>{{ s }}</span>
                          <button
                            (click)="removeSkill('technical', idx)"
                            class="hover:text-red-400 font-extrabold text-xs shrink-0 pl-1"
                          >
                            ×
                          </button>
                        </span>
                        <input
                          #techInput
                          (keyup.enter)="
                            addSkill('technical', techInput.value); techInput.value = ''
                          "
                          placeholder="Add skill + Enter..."
                          class="bg-slate-900/60 text-slate-200 text-xs px-3.5 py-1.5 border border-slate-800/80 rounded-lg outline-none focus:border-violet-500/80 transition-colors placeholder:text-slate-500 w-36"
                        />
                      </div>
                    </div>
                  </div>
                </mat-card>
              </div>
            </mat-tab>

            <!-- Tab 3: Before vs after AI improvements -->
            <mat-tab label="AI Suggestions">
              <div class="py-6 space-y-6">
                <!-- Summary rewrite -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                  *ngIf="suggestions()"
                >
                  <h4
                    class="text-sm font-bold text-slate-200 mb-6 font-outfit flex items-center space-x-2"
                  >
                    <mat-icon class="text-violet-400">auto_awesome</mat-icon>
                    <span>AI Professional Summary Optimization</span>
                  </h4>

                  <div class="space-y-5">
                    <div>
                      <span
                        class="text-[10px] font-bold text-rose-400 uppercase tracking-widest bg-rose-950/35 border border-rose-900/50 px-2 py-0.5 rounded"
                        >Original Summary</span
                      >
                      <div
                        class="p-4 border border-red-900/20 bg-red-950/5 rounded-2xl text-slate-400 text-xs mt-2 leading-relaxed"
                      >
                        {{ suggestions()?.summary?.before }}
                      </div>
                    </div>
                    <div>
                      <span
                        class="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-950/35 border border-emerald-900/50 px-2 py-0.5 rounded"
                        >Optimized Summary</span
                      >
                      <div
                        class="p-4 border border-emerald-900/20 bg-emerald-950/5 rounded-2xl text-slate-200 text-xs mt-2 leading-relaxed font-medium"
                      >
                        {{ suggestions()?.summary?.after }}
                      </div>
                    </div>
                  </div>
                </mat-card>

                <!-- Bullet improvements -->
                <mat-card
                  class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
                  *ngIf="suggestions()"
                >
                  <h4
                    class="text-sm font-bold text-slate-200 mb-6 font-outfit flex items-center space-x-2"
                  >
                    <mat-icon class="text-emerald-400">trending_up</mat-icon>
                    <span>AI Experience Phrasing (STAR Metric Upgrades)</span>
                  </h4>

                  <div class="space-y-6">
                    <div
                      *ngFor="let imp of suggestions()?.improvements"
                      class="border-b border-slate-800 pb-5 last:border-0 last:pb-0"
                    >
                      <span
                        class="text-[10px] px-2.5 py-1 rounded-lg bg-violet-950/30 border border-violet-900/60 text-violet-300 font-bold uppercase tracking-wider mb-3 inline-block"
                      >
                        Section: {{ imp.section }}
                      </span>
                      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-1">
                        <div
                          class="p-4 border border-slate-800 bg-slate-950/40 rounded-2xl text-slate-400 text-xs leading-relaxed"
                        >
                          <strong
                            class="block text-rose-400 mb-2 text-[10px] uppercase tracking-wider font-bold"
                            >Before:</strong
                          >
                          {{ imp.original }}
                        </div>
                        <div
                          class="p-4 border border-emerald-900/30 bg-emerald-950/5 rounded-2xl text-slate-200 text-xs leading-relaxed"
                        >
                          <strong
                            class="block text-emerald-400 mb-2 text-[10px] uppercase tracking-wider font-bold"
                            >Suggested Rewrite (Impact-driven):</strong
                          >
                          {{ imp.suggestion }}
                        </div>
                      </div>
                    </div>
                  </div>
                </mat-card>
              </div>
            </mat-tab>
          </mat-tab-group>
        </div>
      </div>
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
    `,
  ],
})
export class AnalyzerComponent implements OnInit {
  readonly activeResumeId = signal<number | null>(null);
  readonly isUploading = signal(false);
  readonly uploadError = signal<string | null>(null);

  // Scores signal
  readonly atsScore = signal(75);
  readonly formatScore = signal(80);
  readonly keywordScore = signal(72);
  readonly expScore = signal(74);
  readonly skillScore = signal(78);

  readonly missingKeywords = signal<string[]>([]);
  readonly weaknesses = signal<string[]>([]);
  readonly breakdownFeedback = signal<any>({
    formatting: 'Formatting review pending.',
    keywords: 'Keywords density audit pending.',
    experience: 'Bullet outcomes analysis pending.',
  });

  readonly resumeData = signal<any>(null);
  readonly suggestions = signal<ImprovementSuggestions | null>(null);
  readonly versionsList = signal<any[]>([]);
  readonly activeVersion = signal(1);

  constructor(
    private route: ActivatedRoute,
    private resumeService: ResumeService,
    private careerService: CareerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Check if redirect query param exists
    this.route.queryParams.subscribe((params) => {
      if (params['resumeId']) {
        const id = parseInt(params['resumeId'], 10);
        this.loadResumeData(id);
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (!file) return;

    this.isUploading.set(true);
    this.uploadError.set(null);

    this.resumeService.uploadResume(file).subscribe({
      next: (res) => {
        this.isUploading.set(false);
        this.loadResumeData(res.resumeId);
      },
      error: (err) => {
        this.isUploading.set(false);
        this.uploadError.set(err.error?.error || 'Failed to parse resume document.');
      },
    });
  }

  loadResumeData(id: number, targetVersion?: number): void {
    this.activeResumeId.set(id);

    // Get structured JSON structure
    this.resumeService.getResume(id, targetVersion).subscribe({
      next: (res) => {
        this.resumeData.set(res.data);
        this.versionsList.set(res.versions);
        this.activeVersion.set(res.versionDetails.versionNumber);

        // Run evaluation triggers
        this.careerService.evaluateATS(id).subscribe((evalRes) => {
          const evalDetails = evalRes.evaluation;
          this.atsScore.set(evalDetails.overallScore);
          this.formatScore.set(evalDetails.formattingScore);
          this.keywordScore.set(evalDetails.keywordScore);
          this.expScore.set(evalDetails.experienceScore);
          this.skillScore.set(evalDetails.skillScore);
          this.missingKeywords.set(evalDetails.missingKeywords || []);
          this.weaknesses.set(evalDetails.weaknesses || []);
          this.breakdownFeedback.set(evalDetails.breakdown);
        });

        // Run improvements recommendations
        this.careerService.getImprovements(id).subscribe((impRes) => {
          this.suggestions.set(impRes.suggestions);
        });
      },
    });
  }

  switchVersion(verNum: number): void {
    const id = this.activeResumeId();
    if (id) {
      this.loadResumeData(id, verNum);
    }
  }

  addSkill(category: string, skill: string): void {
    if (!skill.trim()) return;
    const current = { ...this.resumeData() };
    if (!current.skills[category]) current.skills[category] = [];
    current.skills[category].push(skill.trim());
    this.resumeData.set(current);
  }

  removeSkill(category: string, idx: number): void {
    const current = { ...this.resumeData() };
    current.skills[category].splice(idx, 1);
    this.resumeData.set(current);
  }

  saveResume(): void {
    const id = this.activeResumeId();
    if (id) {
      this.resumeService.updateResume(id, this.resumeData()).subscribe({
        next: () => {
          alert('Changes saved as a new version successfully!');
          this.loadResumeData(id);
        },
      });
    }
  }

  resetView(): void {
    this.activeResumeId.set(null);
    this.resumeData.set(null);
    this.suggestions.set(null);
    this.router.navigate(['/analyzer']);
  }
}
