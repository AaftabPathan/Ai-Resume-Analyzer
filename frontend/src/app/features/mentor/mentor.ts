import {
  Component,
  OnInit,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewChecked,
} from '@angular/core';
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
  ChatbotService,
  ChatConversation,
  ChatMessage,
  ChatRoadmap,
} from '../../core/services/chatbot.service';
import { CareerService, SkillGapResponse } from '../../core/services/career.service';

@Component({
  selector: 'app-mentor',
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
            AI Career Mentor Chatbot
          </h1>
          <p class="text-slate-400 text-xs mt-1">
            Acquire resume-aware mentorship, custom transition roadmaps, and target certification
            pathways.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <mat-form-field
            appearance="outline"
            class="dark-form-field !text-xs shrink-0 w-full md:w-60"
          >
            <mat-label>Active Resume Context</mat-label>
            <mat-select [(ngModel)]="selectedResumeId" (selectionChange)="onContextResumeChanged()">
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

      <!-- Main Columns Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        <!-- Left Sidebar: Conversations Threads (1 Col) -->
        <div class="lg:col-span-1 space-y-6 animate-slide-in-left">
          <button
            (click)="startNewThread()"
            mat-raised-button
            color="primary"
            class="w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[48px] !text-xs !font-bold text-white shadow-lg shadow-violet-500/20 glowing-btn-hover"
          >
            <mat-icon class="!mr-1">add</mat-icon> New Mentorship Session
          </button>

          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-5 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-outfit">
              Conversation Sessions
            </h3>

            <div class="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              <div
                *ngFor="let chat of threads()"
                (click)="selectThread(chat.id)"
                [class.bg-violet-950/20]="activeThreadId() === chat.id"
                [class.border-violet-500/40]="activeThreadId() === chat.id"
                [class.bg-slate-800/20]="activeThreadId() !== chat.id"
                class="p-3.5 border border-slate-850 rounded-2xl hover:bg-slate-800/40 cursor-pointer transition-all flex items-center justify-between group overflow-hidden"
              >
                <div class="overflow-hidden shrink-0 flex-1 pr-2">
                  <h4
                    class="text-xs font-bold text-slate-200 group-hover:text-white truncate transition-colors"
                  >
                    {{ chat.title }}
                  </h4>
                  <span class="text-[9px] text-slate-500 font-medium">{{
                    chat.created_at | date: 'shortTime'
                  }}</span>
                </div>
                <mat-icon
                  class="text-slate-500 group-hover:text-slate-300 transition-colors !text-xs w-4 h-4 flex items-center justify-center"
                  >chevron_right</mat-icon
                >
              </div>

              <div
                *ngIf="threads().length === 0"
                class="text-center py-6 text-xs text-slate-600 italic"
              >
                No active conversations.
              </div>
            </div>
          </mat-card>

          <!-- Current ATS context indicator -->
          <mat-card
            *ngIf="skillsAudit()"
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-5 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 font-outfit">
              Resume Intelligence
            </h3>
            <div class="p-4 bg-slate-950/40 border border-slate-800/80 rounded-2xl space-y-2">
              <span class="text-[9px] font-bold uppercase tracking-wider text-slate-500 block"
                >Skills Match Score</span
              >
              <div class="flex items-center justify-between">
                <span class="text-xl font-extrabold text-emerald-450 font-mono"
                  >{{ skillsAudit()?.matchRate }}%</span
                >
                <span class="text-[10px] text-slate-400 font-semibold"
                  >{{ skillsAudit()?.currentSkillsCount }} /
                  {{ skillsAudit()?.benchmarkSkillsCount }} skills</span
                >
              </div>
            </div>
          </mat-card>
        </div>

        <!-- Center Column: ChatGPT style console (2 Cols) -->
        <div class="lg:col-span-2 space-y-4">
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl shadow-xl flex flex-col h-[600px] overflow-hidden relative glass-card"
          >
            <!-- Thread Title -->
            <div
              class="h-16 border-b border-slate-800/80 bg-slate-950/40 px-5 flex items-center justify-between shrink-0"
            >
              <div class="overflow-hidden">
                <span class="text-[9px] font-bold text-violet-400 uppercase tracking-widest block"
                  >Active Mentorship Session</span
                >
                <h3 class="text-xs font-bold text-slate-200 truncate font-outfit mt-0.5">
                  {{ activeThreadTitle() }}
                </h3>
              </div>
              <span
                class="px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-violet-950/30 border border-violet-900/60 text-violet-300 no-print"
              >
                Interactive Bot
              </span>
            </div>

            <!-- Message bubble area -->
            <div #scrollContainer class="flex-1 p-5 overflow-y-auto space-y-5">
              <!-- Greeting / Instructions if empty -->
              <div
                *ngIf="messages().length === 0"
                class="text-center py-16 max-w-sm mx-auto space-y-4"
              >
                <div
                  class="w-14 h-14 rounded-2xl bg-violet-600/10 flex items-center justify-center mx-auto border border-violet-900/30 text-violet-400 animate-float-slow"
                >
                  <mat-icon>psychology</mat-icon>
                </div>
                <h4 class="text-base font-bold text-slate-200 font-outfit">
                  How can I help you build your career?
                </h4>
                <p class="text-xs text-slate-500 leading-relaxed">
                  Ask me about custom technical roadmaps, target certificates, and projects based on
                  your current resume skills.
                </p>
              </div>

              <!-- Message bubbles -->
              <div
                *ngFor="let msg of messages()"
                [class.justify-end]="msg.sender === 'user'"
                class="flex w-full animate-fade-in"
              >
                <div
                  [class.bg-gradient-to-tr]="msg.sender === 'user'"
                  [class.from-violet-600]="msg.sender === 'user'"
                  [class.to-indigo-600]="msg.sender === 'user'"
                  [class.text-white]="msg.sender === 'user'"
                  [class.rounded-tr-none]="msg.sender === 'user'"
                  [class.bg-slate-900/65]="msg.sender !== 'user'"
                  [class.border]="msg.sender !== 'user'"
                  [class.border-slate-800]="msg.sender !== 'user'"
                  [class.text-slate-200]="msg.sender !== 'user'"
                  [class.rounded-tl-none]="msg.sender !== 'user'"
                  class="max-w-[85%] rounded-2xl px-4.5 py-3 text-xs leading-relaxed shadow-lg"
                >
                  <span
                    class="text-[9px] font-bold uppercase tracking-widest block mb-1.5 opacity-60"
                    [class.text-violet-300]="msg.sender === 'user'"
                    [class.text-slate-400]="msg.sender !== 'user'"
                  >
                    {{ msg.sender === 'user' ? 'You' : 'AI Career Mentor' }}
                  </span>

                  <div
                    [innerHTML]="formatMessageText(msg.message_text)"
                    class="prose prose-invert max-w-none text-xs leading-relaxed font-medium"
                  ></div>
                </div>
              </div>

              <!-- Typing Indicator -->
              <div *ngIf="isTyping()" class="flex w-full">
                <div
                  class="bg-slate-900 border border-slate-800 text-slate-400 rounded-2xl rounded-tl-none px-4.5 py-3 text-xs flex items-center space-x-1.5 shadow-md"
                >
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                    style="animation-delay: 0.1s"
                  ></span>
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                    style="animation-delay: 0.2s"
                  ></span>
                  <span
                    class="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce"
                    style="animation-delay: 0.3s"
                  ></span>
                </div>
              </div>
            </div>

            <!-- Quick Action Suggestion Chips -->
            <div
              class="px-5 py-3 border-t border-slate-900 bg-slate-950/20 flex items-center space-x-2.5 overflow-x-auto whitespace-nowrap shrink-0 scrollbar-none"
            >
              <button
                *ngFor="let chip of suggestionChips"
                (click)="sendSuggestedQuestion(chip)"
                [disabled]="isTyping()"
                class="px-3.5 py-2 rounded-full bg-slate-900/60 border border-slate-800 hover:bg-slate-800 hover:border-violet-500/30 text-[10px] text-slate-350 font-semibold transition-all hover:scale-105 cursor-pointer shrink-0"
              >
                {{ chip }}
              </button>
            </div>

            <!-- Chat input bar -->
            <div
              class="p-4 border-t border-slate-800/80 bg-slate-950/40 flex items-center space-x-3 shrink-0"
            >
              <input
                [(ngModel)]="userInputMessage"
                (keyup.enter)="sendMessage()"
                [disabled]="isTyping()"
                placeholder="Type a career query here..."
                class="flex-1 bg-slate-950 border border-slate-855 text-xs px-4.5 py-3.5 rounded-xl outline-none focus:border-violet-500 transition-colors h-[48px] text-slate-200"
              />

              <button
                (click)="sendMessage()"
                [disabled]="isTyping() || !userInputMessage.trim()"
                mat-mini-fab
                color="primary"
                class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 shrink-0 glowing-btn-hover"
              >
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </mat-card>
        </div>

        <!-- Right Column: Interactive Recommender Panel (1 Col) -->
        <div class="lg:col-span-1 space-y-6">
          <!-- AI learning roadmap generator widget -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-5 shadow-xl glass-card space-y-4"
          >
            <h3 class="text-xs font-bold text-slate-200 uppercase tracking-widest font-outfit">
              AI Roadmap Builder
            </h3>
            <p class="text-[10px] text-slate-400 mt-1 leading-relaxed">
              Formulate a customized plan to transition into your dream specialization.
            </p>

            <div class="space-y-4">
              <mat-form-field appearance="outline" class="dark-form-field !text-xs w-full">
                <mat-label>Target Role</mat-label>
                <mat-select [(ngModel)]="targetRoadmapRole">
                  <mat-option value="DevOps Engineer">DevOps Engineer</mat-option>
                  <mat-option value="Cloud Engineer">Cloud Engineer</mat-option>
                  <mat-option value="Full Stack Developer">Full Stack Developer</mat-option>
                  <mat-option value="Frontend Developer">Frontend Developer</mat-option>
                  <mat-option value="Backend Developer">Backend Developer</mat-option>
                  <mat-option value="Cyber Security Engineer">Cyber Security Engineer</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline" class="dark-form-field !text-xs w-full">
                <mat-label>Timeline Span</mat-label>
                <mat-select [(ngModel)]="roadmapSpan">
                  <mat-option [value]="30">30-Day Transition</mat-option>
                  <mat-option [value]="60">60-Day Transition</mat-option>
                  <mat-option [value]="90">90-Day Transition</mat-option>
                </mat-select>
              </mat-form-field>

              <button
                (click)="buildCustomRoadmap()"
                [disabled]="isBuildingRoadmap()"
                mat-raised-button
                color="primary"
                class="w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !h-[42px] !text-xs font-bold text-white shadow-lg shadow-violet-500/20 glowing-btn-hover"
              >
                <span *ngIf="!isBuildingRoadmap()">Build Roadmap Plan</span>
                <span *ngIf="isBuildingRoadmap()">Formulating plan...</span>
              </button>
            </div>

            <!-- Generated Roadmap Preview -->
            <div *ngIf="activeRoadmap()" class="border-t border-slate-800/80 pt-5 mt-2 space-y-4">
              <span
                class="text-[9px] font-bold text-violet-400 uppercase tracking-widest block font-outfit"
                >{{ activeRoadmap()?.span }}-Day Roadmap Plan</span
              >

              <div class="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                <div
                  *ngFor="let step of activeRoadmap()?.weeklySteps"
                  class="p-4 bg-slate-950/45 border border-slate-850 rounded-2xl space-y-2 relative overflow-hidden"
                >
                  <h4 class="text-[11px] font-bold text-slate-100 font-outfit">{{ step.week }}</h4>
                  <p class="text-[10px] text-slate-400 font-semibold leading-relaxed">
                    {{ step.objective }}
                  </p>

                  <div class="flex flex-wrap gap-1.5 pt-1">
                    <span
                      *ngFor="let t of step.topics"
                      class="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[8px] font-mono font-medium text-slate-350"
                      >{{ t }}</span
                    >
                  </div>

                  <div
                    *ngIf="step.projectSuggestion"
                    class="text-[9px] text-violet-400 pt-2 border-t border-slate-900/80"
                  >
                    <strong class="text-slate-400">Project:</strong>
                    {{ step.projectSuggestion }}
                  </div>
                </div>
              </div>
            </div>
          </mat-card>

          <!-- Certifications recommendations list -->
          <mat-card
            class="!bg-slate-900/40 !border !border-slate-800/80 !rounded-3xl !p-5 shadow-xl glass-card"
          >
            <h3 class="text-xs font-bold text-slate-200 uppercase tracking-widest mb-4 font-outfit">
              Certifications
            </h3>

            <div class="space-y-3">
              <div
                *ngFor="let cert of recommendedCerts"
                class="p-3.5 border border-slate-850 bg-slate-950/30 hover:border-slate-700 transition-colors rounded-2xl flex items-start space-x-3"
              >
                <mat-icon class="!text-xs !w-4 !h-4 text-emerald-450 shrink-0 mt-0.5"
                  >verified</mat-icon
                >
                <div class="overflow-hidden">
                  <h4 class="text-[10px] font-bold text-slate-200 truncate font-outfit">
                    {{ cert.name }}
                  </h4>
                  <span class="text-[8px] text-slate-500 font-semibold"
                    >{{ cert.provider }} • {{ cert.level }}</span
                  >
                </div>
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
      .scrollbar-none::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-none {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `,
  ],
})
export class MentorComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  readonly resumes = signal<Resume[]>([]);
  selectedResumeId?: number;

  // Chat signals
  readonly threads = signal<ChatConversation[]>([]);
  readonly messages = signal<ChatMessage[]>([]);
  activeThreadId = signal<number | null>(null);
  userInputMessage = '';
  isTyping = signal(false);

  // Suggestion chips
  readonly suggestionChips = [
    'How do I become a DevOps Engineer?',
    'What should I learn after Docker?',
    'Which AWS certification matches my skills?',
    'How do I improve my ATS score?',
    'Suggest high-impact backend projects.',
  ];

  // Roadmap signals
  targetRoadmapRole = 'DevOps Engineer';
  roadmapSpan = 30;
  isBuildingRoadmap = signal(false);
  activeRoadmap = signal<ChatRoadmap | null>(null);

  // Resume context scores
  readonly skillsAudit = signal<SkillGapResponse | null>(null);

  // Default recommendations
  readonly recommendedCerts = [
    {
      name: 'AWS Certified Solutions Architect',
      provider: 'Amazon Web Services',
      level: 'Intermediate',
    },
    { name: 'Certified Kubernetes Administrator (CKA)', provider: 'CNCF', level: 'Advanced' },
    { name: 'Google Cloud Associate Cloud Engineer', provider: 'Google Cloud', level: 'Beginner' },
    { name: 'HashiCorp Certified: Terraform Associate', provider: 'HashiCorp', level: 'Beginner' },
  ];

  constructor(
    private resumeService: ResumeService,
    private chatbotService: ChatbotService,
    private careerService: CareerService,
  ) {}

  ngOnInit(): void {
    this.loadResumes();
    this.loadChatThreads();
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  loadResumes(): void {
    this.resumeService.getResumes().subscribe({
      next: (res) => {
        this.resumes.set(res.resumes);
        if (res.resumes.length > 0) {
          this.selectedResumeId = res.resumes[0].id;
          this.onContextResumeChanged();
        }
      },
    });
  }

  onContextResumeChanged(): void {
    if (this.selectedResumeId) {
      this.careerService.getSkillGap(this.selectedResumeId, this.targetRoadmapRole).subscribe({
        next: (res) => {
          this.skillsAudit.set(res);
        },
      });
    }
  }

  loadChatThreads(): void {
    this.chatbotService.getConversations().subscribe({
      next: (res) => {
        this.threads.set(res.conversations);
        if (res.conversations.length > 0) {
          this.selectThread(res.conversations[0].id);
        } else {
          this.startNewThread();
        }
      },
    });
  }

  activeThreadTitle(): string {
    const activeId = this.activeThreadId();
    if (!activeId) return 'New Conversation';
    const match = this.threads().find((t) => t.id === activeId);
    return match ? match.title : 'Career Mentorship';
  }

  startNewThread(): void {
    const title = `Career Mentor - ${new Date().toLocaleDateString()}`;
    this.chatbotService.createConversation(title).subscribe({
      next: (res) => {
        this.loadChatThreads();
      },
    });
  }

  selectThread(id: number): void {
    this.activeThreadId.set(id);
    this.chatbotService.getMessages(id).subscribe({
      next: (res) => {
        this.messages.set(res.messages);
        this.scrollToBottom();
      },
    });
  }

  sendMessage(): void {
    const text = this.userInputMessage.trim();
    const activeId = this.activeThreadId();
    if (!text || !activeId) return;

    this.userInputMessage = '';

    // Add user message immediately
    const userMsg: ChatMessage = {
      id: Date.now(),
      conversation_id: activeId,
      sender: 'user',
      message_text: text,
      created_at: new Date().toISOString(),
    };
    this.messages.set([...this.messages(), userMsg]);
    this.isTyping.set(true);

    this.chatbotService.sendMessage(activeId, text, this.selectedResumeId).subscribe({
      next: (res) => {
        this.isTyping.set(false);
        const aiMsg: ChatMessage = {
          id: Date.now() + 1,
          conversation_id: activeId,
          sender: 'ai',
          message_text: res.messageText,
          created_at: new Date().toISOString(),
        };
        this.messages.set([...this.messages(), aiMsg]);
        this.scrollToBottom();
      },
      error: () => {
        this.isTyping.set(false);
        alert('Failed to obtain career mentor response.');
      },
    });
  }

  sendSuggestedQuestion(question: string): void {
    this.userInputMessage = question;
    this.sendMessage();
  }

  buildCustomRoadmap(): void {
    this.isBuildingRoadmap.set(true);
    this.chatbotService
      .generateRoadmap(this.targetRoadmapRole, this.roadmapSpan, this.selectedResumeId)
      .subscribe({
        next: (res) => {
          this.isBuildingRoadmap.set(false);
          this.activeRoadmap.set(res.roadmap);
        },
        error: () => {
          this.isBuildingRoadmap.set(false);
          alert('Failed to generate career learning roadmap.');
        },
      });
  }

  formatMessageText(text: string): string {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(
        /`([^`]+)`/g,
        '<code class="bg-slate-950 border border-slate-800 px-1.5 py-0.5 rounded text-pink-400 font-mono text-[10px]">$1</code>',
      )
      .replace(/\n/g, '<br/>');
  }

  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        this.scrollContainer.nativeElement.scrollTop =
          this.scrollContainer.nativeElement.scrollHeight;
      }, 50);
    } catch (err) {}
  }
}
