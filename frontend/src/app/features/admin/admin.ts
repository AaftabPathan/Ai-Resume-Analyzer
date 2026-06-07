import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import {
  AdminService,
  UserStats,
  AdminUser,
  LatestUpload,
} from '../../core/services/admin.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSelectModule,
  ],
  template: `
    <div class="space-y-6">
      <!-- Top Header -->
      <div
        class="p-6 rounded-2xl bg-gradient-to-r from-red-950/20 via-indigo-950/20 to-slate-900 border border-slate-800 shadow-xl"
      >
        <h1 class="text-xl md:text-2xl font-extrabold tracking-tight">System Control Panel</h1>
        <p class="text-slate-400 text-xs mt-1">
          Audit active user configurations, examine AI token usage telemetry, and manage role
          scopes.
        </p>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6" *ngIf="stats()">
        <!-- Total Users -->
        <mat-card class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md">
          <span class="text-xs text-slate-400 font-medium">Total Registered Candidates</span>
          <div class="mt-2 text-3xl font-extrabold">{{ stats()?.users }}</div>
        </mat-card>

        <!-- Recruiter Count -->
        <mat-card class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md">
          <span class="text-xs text-slate-400 font-medium">Total Recruiters / Employers</span>
          <div class="mt-2 text-3xl font-extrabold">{{ stats()?.recruiters }}</div>
        </mat-card>

        <!-- Resumes Processed -->
        <mat-card class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md">
          <span class="text-xs text-slate-400 font-medium">Total Resumes Parsed</span>
          <div class="mt-2 text-3xl font-extrabold">{{ stats()?.resumes }}</div>
        </mat-card>

        <!-- AI API Request Counters -->
        <mat-card class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md">
          <span class="text-xs text-slate-400 font-medium">AI API Requests Traces</span>
          <div class="mt-2 text-3xl font-extrabold text-violet-400">{{ stats()?.aiRequests }}</div>
        </mat-card>
      </div>

      <!-- Global Controls Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- User Directory list -->
        <mat-card
          class="lg:col-span-2 !bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md"
        >
          <h3 class="text-base font-bold text-slate-200 mb-6">User Database Directory</h3>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr
                  class="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider"
                >
                  <th class="py-3 px-3">Name</th>
                  <th class="py-3 px-3">Email Address</th>
                  <th class="py-3 px-3">Role Authority</th>
                  <th class="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-800 text-slate-300">
                <tr *ngFor="let usr of users()" class="hover:bg-slate-900/10">
                  <td class="py-3.5 px-3 font-semibold text-slate-200">{{ usr.name }}</td>
                  <td class="py-3.5 px-3 text-slate-450">{{ usr.email }}</td>
                  <td class="py-3.5 px-3">
                    <!-- Role change selector -->
                    <select
                      [ngModel]="usr.role"
                      (change)="changeRole(usr.id, $event)"
                      class="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-slate-300 outline-none focus:border-violet-500 font-mono text-[10px]"
                    >
                      <option value="user">User</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td class="py-3.5 px-3 text-right">
                    <button
                      (click)="pruneUser(usr.id)"
                      class="text-red-500 hover:text-red-400 font-bold hover:underline"
                    >
                      Prune Profile
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </mat-card>

        <!-- System Logs View / Telemetry -->
        <div class="space-y-6">
          <!-- Recent activity -->
          <mat-card
            class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md"
          >
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              Latest Upload logs
            </h3>
            <div class="space-y-3">
              <div
                *ngFor="let upload of latestUploads()"
                class="p-3 border border-slate-800 bg-slate-950/40 rounded-xl space-y-1"
              >
                <div class="flex justify-between items-center text-[10px]">
                  <strong class="text-slate-200 truncate max-w-[120px]">{{ upload.title }}</strong>
                  <span class="text-slate-500 font-mono">{{
                    upload.created_at | date: 'shortTime'
                  }}</span>
                </div>
                <div class="text-[9px] text-slate-500">
                  Uploaded by: {{ upload.user_name }} ({{ upload.user_email }})
                </div>
              </div>
            </div>
          </mat-card>

          <!-- API Request Telemetry -->
          <mat-card
            class="!bg-slate-900/30 !border !border-slate-800/80 !rounded-2xl !p-6 shadow-md"
          >
            <h3 class="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
              AI Service Logs
            </h3>
            <div
              class="p-4 bg-slate-950 text-slate-400 font-mono text-[10px] rounded-xl border border-slate-800 space-y-2 max-h-[160px] overflow-y-auto"
            >
              <div>[INFO] Gemini 1.5 Flash parser initialization complete.</div>
              <div>[DEBUG] Token budget validation: OK</div>
              <div>[STATS] Average processing latency: 1240ms</div>
              <div>[INFO] SQlite auto-backups cycle: ACTIVE</div>
            </div>
          </mat-card>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .mat-mdc-select-value {
        color: #cbd5e1 !important;
      }
    `,
  ],
})
export class AdminComponent implements OnInit {
  readonly stats = signal<UserStats | null>(null);
  readonly users = signal<AdminUser[]>([]);
  readonly latestUploads = signal<LatestUpload[]>([]);

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
  }

  loadStats(): void {
    this.adminService.getStats().subscribe({
      next: (res) => {
        this.stats.set(res.stats);
        this.latestUploads.set(res.latestUploads);
      },
    });
  }

  loadUsers(): void {
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.users.set(res.users);
      },
    });
  }

  changeRole(userId: number, event: any): void {
    const role = event.target.value;
    if (confirm(`Are you sure you want to change this user's role to ${role.toUpperCase()}?`)) {
      this.adminService.updateUserRole(userId, role).subscribe({
        next: () => {
          this.loadStats();
          this.loadUsers();
          alert('User role updated successfully.');
        },
        error: (err) => {
          alert('Failed to update role: ' + (err.error?.error || err.message));
          this.loadUsers(); // Reset view
        },
      });
    } else {
      this.loadUsers(); // Reset view
    }
  }

  pruneUser(userId: number): void {
    if (
      confirm(
        'CAUTION: Pruning will permanently delete this user profile and all their uploaded resumes and history! This action cannot be undone. Proceed?',
      )
    ) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.loadStats();
          this.loadUsers();
          alert('User profile and related records pruned.');
        },
        error: (err) => {
          alert('Failed to delete user: ' + (err.error?.error || err.message));
        },
      });
    }
  }
}
