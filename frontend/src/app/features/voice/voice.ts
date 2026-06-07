import { Component, OnInit, signal, computed, OnDestroy } from '@angular/core';
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
  VoiceService,
  VoiceQuestion,
  VoiceSessionReport,
  VoiceStats,
} from '../../core/services/voice.service';

@Component({
  selector: 'app-voice',
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
      <!-- Upper Panel Header -->
      <div
        class="p-6 rounded-3xl bg-slate-900/40 border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 glass-card"
      >
        <div>
          <h1
            class="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent font-outfit"
          >
            AI Voice Interview Simulator
          </h1>
          <p class="text-slate-400 text-xs mt-1">
            Simulate realistic, role-specific job interviews with real-time speech evaluation and multi-dimensional analytics.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <mat-form-field appearance="outline" class="dark-form-field !text-xs shrink-0 w-full md:w-60">
            <mat-label>Context Resume Profile</mat-label>
            <mat-select [(ngModel)]="selectedResumeId">
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

      <!-- Main Layout: Simulator Console and Statistics -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left 2 Cols: Main Simulator Console -->
        <div class="lg:col-span-2 space-y-6">
          <!-- State 1: Configuration & Start Selection -->
          <mat-card
            *ngIf="sessionState() === 'setup'"
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-8 shadow-xl glass-card relative overflow-hidden"
          >
            <div class="absolute -top-16 -right-16 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <h3 class="text-lg font-bold text-slate-200 mb-2 font-outfit">Select Your Specialize Track</h3>
            <p class="text-xs text-slate-400 mb-8 max-w-xl leading-relaxed">
              Choose your target engineering specialization. The AI will customize Technical, Behavioral, and Scenario questions based on your profile resume details.
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div
                *ngFor="let role of roles"
                (click)="selectedRole.set(role)"
                [class.border-violet-500]="selectedRole() === role"
                [class.bg-violet-950\/10]="selectedRole() === role"
                class="p-4 rounded-2xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-900/40 hover:border-slate-700 cursor-pointer transition-all flex items-center space-x-4 group"
              >
                <div
                  class="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors"
                  [class.text-violet-400]="selectedRole() === role"
                  [class.border-violet-500\/40]="selectedRole() === role"
                >
                  <mat-icon>{{ getRoleIcon(role) }}</mat-icon>
                </div>
                <div>
                  <h4 class="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{{ role }}</h4>
                  <span class="text-[9px] text-slate-500 uppercase font-semibold tracking-wider font-mono">4 core questions</span>
                </div>
              </div>
            </div>

            <div class="flex justify-end">
              <button
                (click)="startInterview()"
                [disabled]="isStarting()"
                mat-raised-button
                color="primary"
                class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[50px] !px-8 text-xs font-bold text-white shadow-lg shadow-violet-500/25 glowing-btn-hover"
              >
                <span *ngIf="!isStarting()">Initialize Interview Session</span>
                <span *ngIf="isStarting()">Generating AI Questions...</span>
              </button>
            </div>
          </mat-card>

          <!-- State 2: Active Interview Loop -->
          <mat-card
            *ngIf="sessionState() === 'interview'"
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-8 shadow-xl relative overflow-hidden glass-card"
          >
            <!-- Background Glow -->
            <div class="absolute -top-16 -right-16 w-32 h-32 bg-violet-600/10 rounded-full blur-3xl pointer-events-none"></div>

            <div class="flex items-center justify-between border-b border-slate-800/80 pb-5 mb-6">
              <div>
                <span class="text-[10px] font-bold text-violet-400 uppercase tracking-widest"
                  >Question {{ currentQuestionIndex() + 1 }} of {{ questions().length }}</span
                >
                <h3 class="text-xs font-semibold text-slate-400 mt-1">Role: {{ selectedRole() }}</h3>
              </div>
              <span
                class="px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-violet-950/30 border border-violet-900/60 text-violet-300"
              >
                {{ questions()[currentQuestionIndex()]?.category }}
              </span>
            </div>

            <!-- Question Screen -->
            <div class="py-6 text-center space-y-4">
              <span class="text-4xl text-violet-500 block">"</span>
              <p class="text-lg font-extrabold text-slate-100 max-w-xl mx-auto leading-relaxed font-outfit">
                {{ questions()[currentQuestionIndex()]?.question }}
              </p>
              <span class="text-4xl text-violet-500 block mt-2">"</span>
            </div>

            <!-- Waveform Animation when Recording -->
            <div class="h-20 flex items-center justify-center space-x-2 py-3 mb-4">
              <ng-container *ngIf="isRecording()">
                <div
                  *ngFor="let delay of [0.1, 0.2, 0.4, 0.6, 0.8, 0.5, 0.3, 0.1, 0.2, 0.4, 0.7]"
                  class="w-1 bg-violet-500 rounded-full animate-waveform-bar h-12"
                  [style.animation-delay.s]="delay"
                  [style.height.px]="30 + delay * 40"
                ></div>
              </ng-container>
              <div
                *ngIf="!isRecording()"
                class="w-full text-center text-xs text-slate-500 italic flex items-center justify-center space-x-2"
              >
                <span class="w-2 h-2 rounded-full bg-slate-700 animate-pulse"></span>
                <span>Click microphone to record your response. Make sure to allow mic permissions.</span>
              </div>
            </div>

            <!-- Live Speech-to-Text Transcription Box -->
            <div
              class="p-5 rounded-2xl border border-slate-800/80 bg-slate-950/50 min-h-[120px] max-h-36 overflow-y-auto text-xs leading-relaxed text-slate-300"
            >
              <strong
                class="text-[9px] uppercase tracking-widest text-slate-500 block mb-2 font-bold"
                >Transcription Preview</strong
              >
              <span *ngIf="transcription()">{{ transcription() }}</span>
              <span *ngIf="interimTranscription()" class="text-slate-400">{{
                interimTranscription()
              }}</span>
              <span
                *ngIf="!transcription() && !interimTranscription()"
                class="text-slate-600 italic"
                >Listening for voice input...</span
              >
            </div>

            <!-- Action Controls -->
            <div class="flex items-center justify-between border-t border-slate-800/80 pt-6 mt-6">
              <button
                (click)="quitInterview()"
                mat-stroked-button
                class="!border-slate-800 !rounded-xl !text-xs !px-5 !py-2.5 hover:!bg-slate-800/60 !text-slate-400 hover:!text-slate-300"
              >
                Quit Session
              </button>

              <div class="flex items-center space-x-4">
                <button
                  (click)="toggleRecording()"
                  [class.!bg-rose-600]="isRecording()"
                  [class.animate-pulse-ring]="isRecording()"
                  [class.!text-white]="isRecording()"
                  [class.!bg-slate-900]="!isRecording()"
                  [class.!border-slate-800]="!isRecording()"
                  mat-fab
                  class="shadow-xl transition-all"
                >
                  <mat-icon>{{ isRecording() ? 'mic_off' : 'mic' }}</mat-icon>
                </button>

                <button
                  (click)="submitAnswer()"
                  [disabled]="isSubmitting() || (!transcription() && !interimTranscription())"
                  mat-raised-button
                  color="primary"
                  class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[48px] !px-6 text-xs font-bold text-white shadow-lg shadow-violet-500/25 glowing-btn-hover"
                >
                  <span *ngIf="!isSubmitting()">{{
                    isLastQuestion() ? 'Complete Interview' : 'Submit & Next'
                  }}</span>
                  <span *ngIf="isSubmitting()">Evaluating answer...</span>
                </button>
              </div>
            </div>

            <mat-progress-bar
              *ngIf="isSubmitting()"
              mode="query"
              class="absolute bottom-0 left-0 right-0 !h-1.5"
              color="primary"
            ></mat-progress-bar>
          </mat-card>

          <!-- State 3: Session Summary & Report Card -->
          <mat-card
            *ngIf="sessionState() === 'report' && activeReport()"
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-8 shadow-xl glass-card printable-section"
          >
            <div
              class="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-6 mb-8 gap-4"
            >
              <div>
                <span class="text-[10px] font-bold text-violet-400 uppercase tracking-widest"
                  >Interview session report</span
                >
                <h2 class="text-xl font-bold text-slate-100 mt-1 font-outfit">
                  Role: {{ activeReport()?.role }}
                </h2>
              </div>
              <div class="flex items-center space-x-2 shrink-0 no-print">
                <button
                  (click)="printPDF()"
                  mat-raised-button
                  color="primary"
                  class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[42px] !text-xs !font-bold text-white px-5 shadow-lg shadow-violet-500/20 glowing-btn-hover"
                >
                  <mat-icon class="!mr-1.5 !text-sm">download</mat-icon> PDF Report
                </button>
                <button
                  (click)="resetSession()"
                  mat-stroked-button
                  class="!border-slate-800 !rounded-xl !h-[42px] !text-xs hover:!bg-slate-800/60 !text-slate-300 hover:!text-white transition-all px-5 font-semibold"
                >
                  Simulate New
                </button>
              </div>
            </div>

            <!-- Score Circular Rings Grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <!-- Overall Score -->
              <div
                class="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 flex flex-col items-center text-center shadow-lg relative overflow-hidden"
              >
                <div class="relative w-24 h-24 mb-3 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.03)"
                      stroke-width="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#8b5cf6"
                      stroke-width="7"
                      fill="transparent"
                      [attr.stroke-dasharray]="2 * 3.14159 * 40"
                      [attr.stroke-dashoffset]="
                        2 * 3.14159 * 40 * (1 - (activeReport()?.overallScore || 0) / 100)
                      "
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="absolute text-base font-extrabold text-white font-mono"
                    >{{ activeReport()?.overallScore }}%</span
                  >
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >Overall score</span
                >
              </div>

              <!-- Communication Score -->
              <div
                class="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 flex flex-col items-center text-center shadow-lg relative overflow-hidden"
              >
                <div class="relative w-24 h-24 mb-3 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.03)"
                      stroke-width="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#06b6d4"
                      stroke-width="7"
                      fill="transparent"
                      [attr.stroke-dasharray]="2 * 3.14159 * 40"
                      [attr.stroke-dashoffset]="
                        2 * 3.14159 * 40 * (1 - (activeReport()?.communicationScore || 0) / 100)
                      "
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="absolute text-base font-extrabold text-white font-mono"
                    >{{ activeReport()?.communicationScore }}%</span
                  >
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >Communication</span
                >
              </div>

              <!-- Confidence Score -->
              <div
                class="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 flex flex-col items-center text-center shadow-lg relative overflow-hidden"
              >
                <div class="relative w-24 h-24 mb-3 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.03)"
                      stroke-width="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#ec4899"
                      stroke-width="7"
                      fill="transparent"
                      [attr.stroke-dasharray]="2 * 3.14159 * 40"
                      [attr.stroke-dashoffset]="
                        2 * 3.14159 * 40 * (1 - (activeReport()?.confidenceScore || 0) / 100)
                      "
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="absolute text-base font-extrabold text-white font-mono"
                    >{{ activeReport()?.confidenceScore }}%</span
                  >
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >Confidence</span
                >
              </div>

              <!-- Technical Relevance -->
              <div
                class="p-5 rounded-2xl border border-slate-800 bg-slate-950/30 flex flex-col items-center text-center shadow-lg relative overflow-hidden"
              >
                <div class="relative w-24 h-24 mb-3 flex items-center justify-center">
                  <svg class="w-full h-full transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255, 255, 255, 0.03)"
                      stroke-width="7"
                      fill="transparent"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="#10b981"
                      stroke-width="7"
                      fill="transparent"
                      [attr.stroke-dasharray]="2 * 3.14159 * 40"
                      [attr.stroke-dashoffset]="
                        2 * 3.14159 * 40 * (1 - (activeReport()?.technicalScore || 0) / 100)
                      "
                      stroke-linecap="round"
                    />
                  </svg>
                  <span class="absolute text-base font-extrabold text-white font-mono"
                    >{{ activeReport()?.technicalScore }}%</span
                  >
                </div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-slate-400"
                  >Technical Relevance</span
                >
              </div>
            </div>

            <!-- Feedback Summary Card -->
            <div class="p-6 rounded-2xl border border-slate-800 bg-slate-950/40 space-y-6 mb-8">
              <div>
                <h4 class="text-xs font-extrabold text-violet-400 uppercase tracking-widest mb-2 font-outfit">
                  Executive Evaluation
                </h4>
                <p class="text-xs text-slate-300 leading-relaxed pl-1">
                  {{ activeReport()?.summary?.overallDescription }}
                </p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 pt-5 border-t border-slate-800/80">
                <div>
                  <h4
                    class="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider mb-3 font-outfit"
                  >
                    Strengths Identified
                  </h4>
                  <ul class="space-y-2.5">
                    <li
                      *ngFor="let strength of activeReport()?.summary?.strengths"
                      class="text-xs text-slate-300 flex items-start space-x-2.5"
                    >
                      <mat-icon class="!text-xs !w-4 !h-4 text-emerald-400 shrink-0 mt-0.5"
                        >check_circle</mat-icon
                      >
                      <span>{{ strength }}</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4
                    class="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider mb-3 font-outfit"
                  >
                    Development Areas
                  </h4>
                  <ul class="space-y-2.5">
                    <li
                      *ngFor="let weakness of activeReport()?.summary?.weaknesses"
                      class="text-xs text-slate-300 flex items-start space-x-2.5"
                    >
                      <mat-icon class="!text-xs !w-4 !h-4 text-pink-500 shrink-0 mt-0.5"
                        >error</mat-icon
                      >
                      <span>{{ weakness }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="pt-5 border-t border-slate-800/80">
                <h4
                  class="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider mb-3 font-outfit"
                >
                  Strategic Action Steps
                </h4>
                <ul class="space-y-2.5 text-xs text-slate-300">
                  <li
                    *ngFor="let rec of activeReport()?.summary?.recommendations"
                    class="flex items-start space-x-2.5"
                  >
                    <mat-icon class="!text-xs !w-4 !h-4 text-indigo-400 shrink-0 mt-0.5"
                      >trending_up</mat-icon
                    >
                    <span>{{ rec }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <!-- Q&A Logs Section -->
            <div class="space-y-6">
              <h3 class="text-sm font-bold text-slate-200 uppercase tracking-wider mb-4 font-outfit">
                Question & Answer Performance Log
              </h3>

              <div
                *ngFor="let ans of activeReport()?.answers; let i = index"
                class="p-6 rounded-2xl border border-slate-800 bg-slate-950/20 space-y-4"
              >
                <div class="flex items-center justify-between border-b border-slate-900 pb-3">
                  <span class="text-xs font-bold text-slate-200"
                    >Q{{ i + 1 }}. {{ ans.question }}</span
                  >
                  <span
                    class="text-[10px] font-mono font-bold text-violet-400 bg-violet-950/30 border border-violet-900/50 px-2.5 py-1 rounded-lg"
                    >Score: {{ ans.score }}%</span
                  >
                </div>

                <div class="space-y-3.5 text-xs">
                  <div>
                    <strong class="text-[9px] uppercase tracking-wider text-slate-500 block mb-1.5"
                      >Your Answer:</strong
                    >
                    <p class="text-slate-300 italic pl-1 leading-relaxed">
                      "{{ ans.user_answer || 'No answer recorded.' }}"
                    </p>
                  </div>

                  <div
                    *ngIf="ans.feedback"
                    class="p-4 rounded-xl bg-slate-950/70 border border-slate-900 text-slate-450 leading-relaxed"
                  >
                    <strong class="text-[9px] uppercase tracking-wider text-violet-450 block mb-1.5 font-bold"
                      >AI Evaluation:</strong
                    >
                    {{ ans.feedback }}
                  </div>

                  <div
                    *ngIf="ans.suggested_answer"
                    class="p-4 rounded-xl bg-slate-900/35 border border-slate-900 text-slate-300 leading-relaxed"
                  >
                    <strong class="text-[9px] uppercase tracking-wider text-indigo-400 block mb-1.5 font-bold"
                      >Suggested Premium Model Answer:</strong
                    >
                    {{ ans.suggested_answer }}
                  </div>
                </div>
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Right 1 Col: Dashboard and Metrics Timeline -->
        <div class="space-y-6">
          <!-- Quick stats summary card -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 font-outfit">
              Sim Performance Dashboard
            </h3>

            <div class="space-y-4">
              <div
                class="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60"
              >
                <span class="text-xs text-slate-400">Total Interviews</span>
                <span class="text-lg font-bold text-white font-outfit">{{
                  stats()?.totalInterviews || 0
                }}</span>
              </div>

              <div
                class="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60"
              >
                <span class="text-xs text-slate-400">Average Score</span>
                <span class="text-lg font-bold text-violet-400 font-mono"
                  >{{ stats()?.avgScore || 0 }}%</span
                >
              </div>

              <div
                class="flex items-center justify-between p-4 rounded-2xl bg-slate-950/40 border border-slate-800/60"
              >
                <span class="text-xs text-slate-400">Best Score</span>
                <span class="text-lg font-bold text-emerald-400 font-mono"
                  >{{ stats()?.bestScore || 0 }}%</span
                >
              </div>
            </div>
          </mat-card>

          <!-- History Timeline log cards -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-6 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-5 font-outfit">
              Past Sessions History
            </h3>

            <div class="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <div
                *ngFor="let s of pastSessions()"
                (click)="loadReportDetails(s.id)"
                class="p-4 border border-slate-800/60 bg-slate-950/30 hover:bg-slate-800/40 rounded-2xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div>
                  <h4 class="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">{{ s.role }}</h4>
                  <span class="text-[9px] text-slate-500">{{
                    s.created_at | date: 'mediumDate'
                  }}</span>
                </div>
                <div class="text-right">
                  <span class="text-xs font-bold text-violet-400 group-hover:text-violet-300 font-mono"
                    >{{ s.overall_score }}%</span
                  >
                  <span class="block text-[8px] text-slate-500 uppercase tracking-wider mt-1"
                    >View report</span
                  >
                </div>
              </div>

              <div
                *ngIf="pastSessions().length === 0"
                class="text-center py-8 text-xs text-slate-500 italic"
              >
                No simulated interviews completed yet.
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
      @media print {
        body * {
          visibility: hidden;
        }
        .printable-section,
        .printable-section * {
          visibility: visible;
        }
        .printable-section {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          background: white !important;
          color: black !important;
        }
        .no-print {
          display: none !important;
        }
      }
    `,
  ],
})
export class VoiceComponent implements OnInit, OnDestroy {
  readonly resumes = signal<Resume[]>([]);
  selectedResumeId: number | null = null;

  // Configuration
  readonly roles = [
    'DevOps Engineer',
    'Cloud Engineer',
    'Full Stack Developer',
    'Frontend Developer',
    'Backend Developer',
    'Data Analyst',
    'Data Scientist',
    'Cyber Security Engineer',
  ];

  selectedRole = signal('Full Stack Developer');
  sessionState = signal<'setup' | 'interview' | 'report'>('setup');

  // Active state
  readonly isStarting = signal(false);
  isSubmitting = signal(false);
  activeSessionId: number | null = null;
  readonly questions = signal<VoiceQuestion[]>([]);
  currentQuestionIndex = signal(0);
  activeReport = signal<VoiceSessionReport | null>(null);

  // Voice recording properties
  isRecording = signal(false);
  transcription = signal('');
  interimTranscription = signal('');
  private recognition: any = null;

  // History & dashboard
  readonly pastSessions = signal<any[]>([]);
  readonly stats = signal<VoiceStats | null>(null);

  constructor(
    private resumeService: ResumeService,
    private voiceService: VoiceService,
  ) {}

  ngOnInit(): void {
    this.loadResumes();
    this.loadDashboardStats();
    this.initSpeechRecognition();
  }

  ngOnDestroy(): void {
    this.stopSpeechRecognition();
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

  loadDashboardStats(): void {
    this.voiceService.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.stats);
      },
    });
    this.voiceService.getSessions().subscribe({
      next: (res) => {
        this.pastSessions.set(res.sessions);
      },
    });
  }

  getRoleIcon(role: string): string {
    switch (role) {
      case 'DevOps Engineer':
        return 'settings_suggest';
      case 'Cloud Engineer':
        return 'cloud_queue';
      case 'Full Stack Developer':
        return 'layers';
      case 'Frontend Developer':
        return 'dns';
      case 'Backend Developer':
        return 'storage';
      case 'Data Analyst':
        return 'bar_chart';
      case 'Data Scientist':
        return 'science';
      case 'Cyber Security Engineer':
        return 'admin_panel_settings';
      default:
        return 'badge';
    }
  }

  // ==========================================
  // Simulation Control Lifecycle
  // ==========================================
  startInterview(): void {
    this.isStarting.set(true);
    this.voiceService.startSession(this.selectedResumeId, this.selectedRole()).subscribe({
      next: (res) => {
        this.isStarting.set(false);
        this.activeSessionId = res.sessionId;
        this.questions.set(res.questions);
        this.currentQuestionIndex.set(0);
        this.transcription.set('');
        this.interimTranscription.set('');
        this.sessionState.set('interview');
      },
      error: (err) => {
        this.isStarting.set(false);
        alert(err.error?.error || 'Failed to initialize session. Please check connection.');
      },
    });
  }

  toggleRecording(): void {
    if (this.isRecording()) {
      this.stopSpeechRecognition();
    } else {
      this.startSpeechRecognition();
    }
  }

  isLastQuestion(): boolean {
    return this.currentQuestionIndex() === this.questions().length - 1;
  }

  submitAnswer(): void {
    if (!this.activeSessionId) return;
    const finalAnswer = this.transcription() + ' ' + this.interimTranscription();
    const cleanAnswer = finalAnswer.trim();

    if (!cleanAnswer) {
      alert('Answer text transcript is empty. Please speak into the mic.');
      return;
    }

    this.stopSpeechRecognition();
    this.isSubmitting.set(true);

    const questionId = this.questions()[this.currentQuestionIndex()].id;

    this.voiceService.submitAnswer(this.activeSessionId, questionId, cleanAnswer).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.transcription.set('');
        this.interimTranscription.set('');

        if (this.isLastQuestion()) {
          this.completeInterview();
        } else {
          this.currentQuestionIndex.set(this.currentQuestionIndex() + 1);
        }
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err.error?.error || 'Failed to submit answer. Please try again.');
      },
    });
  }

  completeInterview(): void {
    if (!this.activeSessionId) return;
    this.isSubmitting.set(true);

    this.voiceService.completeSession(this.activeSessionId).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.activeReport.set(res.report);
        this.sessionState.set('report');
        this.loadDashboardStats();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert('Failed to complete interview grading report.');
      },
    });
  }

  loadReportDetails(sessionId: number): void {
    this.voiceService.getSessionDetails(sessionId).subscribe({
      next: (res) => {
        const reportMapped: VoiceSessionReport = {
          sessionId: res.session.id,
          role: res.session.role,
          overallScore: res.session.overallScore,
          communicationScore: res.session.communicationScore,
          confidenceScore: res.session.confidenceScore,
          technicalScore: res.session.technicalScore,
          summary: res.session.feedback,
          answers: res.answers,
        };
        this.activeReport.set(reportMapped);
        this.sessionState.set('report');
      },
    });
  }

  resetSession(): void {
    this.sessionState.set('setup');
    this.activeSessionId = null;
    this.activeReport.set(null);
    this.questions.set([]);
    this.currentQuestionIndex.set(0);
    this.transcription.set('');
  }

  quitInterview(): void {
    if (
      confirm('Are you sure you want to quit this interview simulator? Progress will not be saved.')
    ) {
      this.resetSession();
    }
  }

  printPDF(): void {
    window.print();
  }

  // ==========================================
  // Browser Speech Recognition Engine
  // ==========================================
  private initSpeechRecognition(): void {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onstart = () => {
        this.isRecording.set(true);
      };

      this.recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied. Please verify your browser permissions.');
        }
        this.isRecording.set(false);
      };

      this.recognition.onend = () => {
        this.isRecording.set(false);
      };

      this.recognition.onresult = (event: any) => {
        let interimText = '';
        let finalizedText = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const trans = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalizedText += trans + ' ';
          } else {
            interimText += trans;
          }
        }

        if (finalizedText) {
          this.transcription.set(this.transcription() + finalizedText);
        }
        this.interimTranscription.set(interimText);
      };
    } else {
      console.warn('Web Speech API is not fully compatible in this browser.');
    }
  }

  private startSpeechRecognition(): void {
    if (this.recognition) {
      try {
        this.recognition.start();
      } catch (e) {
        console.warn('Speech recognition was already started or failed to initialize.', e);
      }
    } else {
      alert('Speech-to-Text API is not supported in this browser. Please type or use Chrome/Edge.');
    }
  }

  private stopSpeechRecognition(): void {
    if (this.recognition && this.isRecording()) {
      try {
        this.recognition.stop();
      } catch (e) {
        console.warn('Error stopping speech engine.', e);
      }
      this.isRecording.set(false);
    }
  }
}
