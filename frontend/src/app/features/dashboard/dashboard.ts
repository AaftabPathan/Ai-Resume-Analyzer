import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { ResumeService, Resume } from '../../core/services/resume.service';
import { CareerService } from '../../core/services/career.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="space-y-6">
      <!-- Welcome Callout -->
      <div class="p-8 rounded-3xl bg-gradient-to-r from-violet-950/45 via-indigo-950/25 to-slate-900/40 border border-violet-500/20 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between relative overflow-hidden">
        <div class="absolute top-[-50px] right-[-50px] w-48 h-48 rounded-full bg-violet-600/10 blur-3xl pointer-events-none"></div>
        <div>
          <h1 class="text-2xl md:text-3xl font-extrabold tracking-tight mb-2 text-gradient-premium">
            Welcome to Career Intel Dashboard
          </h1>
          <p class="text-slate-400 text-sm max-w-xl leading-relaxed">
            Audit your resumes, evaluate your alignment with target job descriptions, and prepare for interviews using AI insights.
          </p>
        </div>
        <button routerLink="/analyzer" mat-raised-button 
                class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !text-white !px-6 !py-3 !rounded-xl !font-bold !shadow-md hover:!shadow-violet-600/20 glowing-btn-hover mt-4 md:mt-0 relative z-10">
          Upload New Resume
        </button>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- ATS Score -->
        <mat-card class="glass-card glass-card-hover !rounded-2xl !p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-450 font-bold uppercase tracking-wider">Avg ATS Score</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 font-bold font-mono">+4%</span>
          </div>
          <div class="mt-4 flex items-baseline space-x-2">
            <span class="text-4xl font-extrabold tracking-tight text-white font-mono">{{ avgAtsScore() }}</span>
            <span class="text-slate-500 text-sm font-semibold">/ 100</span>
          </div>
          <div class="mt-4">
            <mat-progress-bar mode="determinate" [value]="avgAtsScore()" color="primary" class="!h-1.5 !rounded-full"></mat-progress-bar>
          </div>
        </mat-card>

        <!-- Skill Coverage -->
        <mat-card class="glass-card glass-card-hover !rounded-2xl !p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-455 font-bold uppercase tracking-wider">Core Skills Tracked</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-bold font-mono">Profile</span>
          </div>
          <div class="mt-4 flex items-baseline space-x-2">
            <span class="text-4xl font-extrabold tracking-tight text-white font-mono">{{ totalSkills() }}</span>
            <span class="text-slate-500 text-sm font-semibold">Listed</span>
          </div>
          <div class="mt-4 text-xs text-slate-500 flex items-center space-x-1">
            <mat-icon class="!text-xs !w-3.5 !h-3.5 !flex !items-center !justify-center text-indigo-400">check_circle</mat-icon>
            <span>Linked to resume data</span>
          </div>
        </mat-card>

        <!-- Interview Prep -->
        <mat-card class="glass-card glass-card-hover !rounded-2xl !p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-455 font-bold uppercase tracking-wider">Interview Questions</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 border border-violet-500/25 font-bold font-mono">Q&A</span>
          </div>
          <div class="mt-4 flex items-baseline space-x-2">
            <span class="text-4xl font-extrabold tracking-tight text-white font-mono">{{ interviewQuestionsCount() }}</span>
            <span class="text-slate-500 text-sm font-semibold">Generated</span>
          </div>
          <div class="mt-4 text-xs text-slate-500 flex items-center space-x-1">
            <mat-icon class="!text-xs !w-3.5 !h-3.5 !flex !items-center !justify-center text-violet-400">help_outline</mat-icon>
            <span>Ready for review</span>
          </div>
        </mat-card>

        <!-- Cover Letters -->
        <mat-card class="glass-card glass-card-hover !rounded-2xl !p-6 shadow-lg">
          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-455 font-bold uppercase tracking-wider">Cover Letters</span>
            <span class="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-450 border border-emerald-500/25 font-bold font-mono">Docs</span>
          </div>
          <div class="mt-4 flex items-baseline space-x-2">
            <span class="text-4xl font-extrabold tracking-tight text-white font-mono">{{ coverLetterCount() }}</span>
            <span class="text-slate-500 text-sm font-semibold">Generated</span>
          </div>
          <div class="mt-4 text-xs text-slate-500 flex items-center space-x-1">
            <mat-icon class="!text-xs !w-3.5 !h-3.5 !flex !items-center !justify-center text-emerald-400">insert_drive_file</mat-icon>
            <span>Custom tailored templates</span>
          </div>
        </mat-card>
      </div>

      <!-- Analytics Charts Section -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- ATS Score trends -->
        <mat-card class="lg:col-span-2 glass-card !rounded-2xl !p-6 shadow-lg">
          <h3 class="text-base font-bold mb-6 text-slate-200">ATS Score Trends</h3>
          <div class="relative h-[250px] w-full">
            <canvas #trendsChartCanvas></canvas>
          </div>
        </mat-card>

        <!-- Skill Distribution -->
        <mat-card class="glass-card !rounded-2xl !p-6 shadow-lg">
          <h3 class="text-base font-bold mb-6 text-slate-200">Skill Distribution</h3>
          <div class="relative h-[250px] w-full flex items-center justify-center">
            <canvas #skillsChartCanvas></canvas>
          </div>
        </mat-card>
      </div>

      <!-- Resume Table Listing -->
      <mat-card class="glass-card !rounded-2xl !p-6 shadow-lg">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-base font-bold text-slate-200">My Resumes</h3>
          <span class="text-xs text-slate-500 font-semibold">{{ resumesList().length }} Resumes total</span>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr
                class="border-b border-slate-800 text-slate-400 text-xs font-semibold uppercase tracking-wider"
              >
                <th class="py-4 px-4">Resume Title</th>
                <th class="py-4 px-4">Filename</th>
                <th class="py-4 px-4">Version</th>
                <th class="py-4 px-4">Uploaded Date</th>
                <th class="py-4 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-800 text-sm">
              <tr *ngFor="let res of resumesList()" class="hover:bg-slate-900/20 transition group">
                <td class="py-4 px-4 font-medium text-slate-200 flex items-center space-x-2">
                  <mat-icon class="text-slate-400 group-hover:text-violet-400 transition-colors"
                    >description</mat-icon
                  >
                  <span>{{ res.title }}</span>
                </td>
                <td class="py-4 px-4 text-slate-400">{{ res.originalFileName }}</td>
                <td class="py-4 px-4 font-mono text-xs">
                  <span
                    class="px-2.5 py-0.5 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300"
                    >v{{ res.current_version || 1 }}</span
                  >
                </td>
                <td class="py-4 px-4 text-slate-400">{{ res.createdAt | date: 'mediumDate' }}</td>
                <td class="py-4 px-4 text-right space-x-2">
                  <button
                    (click)="viewResume(res.id)"
                    mat-icon-button
                    class="text-slate-400 hover:text-white"
                    title="Analyze & Evaluate"
                  >
                    <mat-icon>analytics</mat-icon>
                  </button>
                  <button
                    (click)="deleteResume(res.id)"
                    mat-icon-button
                    class="text-slate-400 hover:text-red-400"
                    title="Delete"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </td>
              </tr>
              <tr *ngIf="resumesList().length === 0">
                <td colspan="5" class="py-8 text-center text-slate-500 text-sm">
                  <mat-icon class="!w-12 !h-12 !text-5xl mb-4 text-slate-700">folder_open</mat-icon>
                  <p>No resumes uploaded yet. Click "Upload New Resume" to begin.</p>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </mat-card>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('trendsChartCanvas') trendsChartCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('skillsChartCanvas') skillsChartCanvas!: ElementRef<HTMLCanvasElement>;

  readonly avgAtsScore = signal(78);
  readonly totalSkills = signal(14);
  readonly interviewQuestionsCount = signal(4);
  readonly coverLetterCount = signal(2);
  readonly resumesList = signal<Resume[]>([]);

  private trendsChart?: Chart;
  private skillsChart?: Chart;

  constructor(
    private resumeService: ResumeService,
    private careerService: CareerService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {
    this.initCharts();
  }

  loadData(): void {
    this.resumeService.getResumes().subscribe({
      next: (res) => {
        this.resumesList.set(res.resumes);
        if (res.resumes.length > 0) {
          const firstResumeId = res.resumes[0].id;

          // Load ATS score history
          this.careerService.getATSReports(firstResumeId).subscribe((repRes) => {
            if (repRes.reports && repRes.reports.length > 0) {
              const scores = repRes.reports.map((r) => r.overallScore).reverse();
              const dates = repRes.reports
                .map((r) => new Date(r.createdAt).toLocaleDateString())
                .reverse();

              const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
              this.avgAtsScore.set(avg);

              this.updateTrendsChart(dates, scores);
            }
          });

          // Fetch career details to count mock data
          this.resumeService.getResume(firstResumeId).subscribe((det) => {
            const tech = det.data?.skills?.technical?.length || 0;
            const soft = det.data?.skills?.soft?.length || 0;
            const tools = det.data?.skills?.tools?.length || 0;
            this.totalSkills.set(tech + soft + tools);
            this.updateSkillsChart([tech, soft, tools]);
          });
        }
      },
    });

    // Get Interview prep questions count
    this.careerService.getSavedQuestions().subscribe({
      next: (res) => {
        this.interviewQuestionsCount.set(res.questions.length || 4);
      },
    });

    // Get cover letter count
    this.careerService.getCoverLetters().subscribe({
      next: (res) => {
        this.coverLetterCount.set(res.letters.length || 2);
      },
    });
  }

  initCharts(): void {
    // Trends Line Chart
    const ctxTrends = this.trendsChartCanvas.nativeElement.getContext('2d');
    if (ctxTrends) {
      this.trendsChart = new Chart(ctxTrends, {
        type: 'line',
        data: {
          labels: ['Draft 1', 'Version 2', 'Version 3'],
          datasets: [
            {
              label: 'ATS Score',
              data: [68, 75, 82],
              borderColor: '#8b5cf6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              tension: 0.4,
              fill: true,
              borderWidth: 2,
              pointRadius: 4,
              pointBackgroundColor: '#8b5cf6',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#94a3b8' },
              min: 0,
              max: 100,
            },
            x: {
              grid: { display: false },
              ticks: { color: '#94a3b8' },
            },
          },
        },
      });
    }

    // Skills Radar Chart
    const ctxSkills = this.skillsChartCanvas.nativeElement.getContext('2d');
    if (ctxSkills) {
      this.skillsChart = new Chart(ctxSkills, {
        type: 'radar',
        data: {
          labels: ['Technical', 'Soft', 'Tools'],
          datasets: [
            {
              label: 'Skills Count',
              data: [6, 4, 4],
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              borderColor: '#10b981',
              borderWidth: 1.5,
              pointBackgroundColor: '#10b981',
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
          },
          scales: {
            r: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              angleLines: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { display: false },
              pointLabels: { color: '#94a3b8', font: { size: 10 } },
            },
          },
        },
      });
    }
  }

  updateTrendsChart(labels: string[], data: number[]): void {
    if (this.trendsChart) {
      this.trendsChart.data.labels = labels;
      this.trendsChart.data.datasets[0].data = data;
      this.trendsChart.update();
    }
  }

  updateSkillsChart(data: number[]): void {
    if (this.skillsChart) {
      this.skillsChart.data.datasets[0].data = data;
      this.skillsChart.update();
    }
  }

  viewResume(id: number): void {
    // Route to analyzer page with query param
    this.router.navigate(['/analyzer'], { queryParams: { resumeId: id } });
  }

  deleteResume(id: number): void {
    if (confirm('Are you sure you want to delete this resume and all related data?')) {
      this.resumeService.deleteResume(id).subscribe({
        next: () => {
          this.loadData();
        },
      });
    }
  }
}
