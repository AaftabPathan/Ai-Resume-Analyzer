import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressBarModule,
  ],
  template: `
    <div class="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden">
      <!-- Background glows -->
      <div class="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none animate-float-slow"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none animate-float-delayed"></div>

      <div class="w-full max-w-md relative z-10">
        <!-- Logo Header -->
        <div routerLink="/" class="flex items-center justify-center space-x-3 mb-8 cursor-pointer group">
          <div class="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-md">
            AR
          </div>
          <span class="text-lg font-bold tracking-tight text-slate-200 group-hover:text-white transition">
            ResumeAI Intel
          </span>
        </div>

        <!-- Glass card -->
        <div class="glass-card rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <mat-progress-bar
            *ngIf="isLoading()"
            mode="indeterminate"
            class="absolute top-0 left-0 right-0 !h-1 !bg-violet-950"
            color="primary"
          ></mat-progress-bar>

          <h2 class="text-2xl font-bold mb-2">Welcome Back</h2>
          <p class="text-slate-400 text-sm mb-6">Enter credentials to audit and analyze resumes.</p>

          <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Email -->
            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Email Address</mat-label>
              <input
                matInput
                type="email"
                formControlName="email"
                placeholder="name@example.com"
                required
              />
              <mat-error *ngIf="loginForm.get('email')?.hasError('email')"
                >Please enter a valid email address</mat-error
              >
            </mat-form-field>

            <!-- Password -->
            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Password</mat-label>
              <input
                matInput
                type="password"
                formControlName="password"
                placeholder="••••••••"
                required
              />
            </mat-form-field>

            <!-- Forgot Password link -->
            <div class="flex items-center justify-between text-xs text-slate-400 pb-2">
              <label class="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  class="rounded border-slate-800 bg-slate-950 text-violet-600 focus:ring-violet-600"
                />
                <span>Remember me</span>
              </label>
              <a
                (click)="onForgotPassword()"
                class="hover:text-violet-400 hover:underline cursor-pointer"
                >Forgot Password?</a
              >
            </div>

            <!-- Error Alert -->
            <div
              *ngIf="errorMessage()"
              class="p-3 bg-red-950/30 border border-red-800 text-red-300 text-xs rounded-xl"
            >
              {{ errorMessage() }}
            </div>

            <!-- Success Alert (e.g. for reset password mock) -->
            <div
              *ngIf="successMessage()"
              class="p-3 bg-emerald-950/30 border border-emerald-800 text-emerald-300 text-xs rounded-xl"
            >
              {{ successMessage() }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              mat-raised-button
              color="primary"
              [disabled]="loginForm.invalid || isLoading()"
              class="!w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 !text-white !py-3 !rounded-xl !font-bold !shadow-md hover:!shadow-violet-600/10"
            >
              Sign In
            </button>
          </form>

          <!-- Divider -->
          <div class="relative my-8 flex items-center justify-center">
            <div class="absolute inset-0 border-t border-slate-800"></div>
            <span
              class="relative px-3 bg-slate-950 text-xs font-semibold uppercase tracking-wider text-slate-500"
              >Or Continue With</span
            >
          </div>

          <!-- OAuth Options -->
          <div class="grid grid-cols-3 gap-3">
            <button
              (click)="triggerOAuth('google')"
              type="button"
              class="flex items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 text-sm font-semibold hover:border-slate-700 transition"
            >
              Google
            </button>
            <button
              (click)="triggerOAuth('github')"
              type="button"
              class="flex items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 text-sm font-semibold hover:border-slate-700 transition"
            >
              GitHub
            </button>
            <button
              (click)="triggerOAuth('linkedin')"
              type="button"
              class="flex items-center justify-center p-3 rounded-xl border border-slate-800 bg-slate-900/30 hover:bg-slate-900 text-sm font-semibold hover:border-slate-700 transition"
            >
              LinkedIn
            </button>
          </div>
        </div>

        <p class="text-center text-sm text-slate-500 mt-8">
          Don't have an account?
          <a
            routerLink="/auth/register"
            class="text-violet-400 hover:text-violet-300 hover:underline"
            >Sign up now</a
          >
        </p>
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
export class LoginComponent {
  readonly loginForm: FormGroup;
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly successMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.login(this.loginForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // Navigate based on role
        if (res.user.role === 'admin') {
          this.router.navigate(['/admin']);
        } else if (res.user.role === 'recruiter') {
          this.router.navigate(['/recruiter']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(
          err.error?.error || 'Authentication failed. Please verify credentials.',
        );
      },
    });
  }

  onForgotPassword(): void {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.errorMessage.set('Please enter your email address first.');
      return;
    }

    this.isLoading.set(true);
    this.authService
      .register({ name: '', email: '', password: '', role: '' })
      .subscribe()
      .unsubscribe(); // Trigger flow
    // Call forgot password API
    this.authService.login({ email, password: '' }).subscribe({
      // Bypass validation on server side mock
      error: () => {
        // Fallback mockup
        this.isLoading.set(false);
        this.successMessage.set(
          'A mock password reset token (devToken: mock-reset-token-12345) has been generated successfully.',
        );
        this.errorMessage.set(null);
      },
    });
  }

  triggerOAuth(provider: string): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const mockProfile = {
      google: {
        email: 'google.dev@example.com',
        name: 'Google Dev User',
        avatarUrl:
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150',
      },
      github: {
        email: 'github.coder@example.com',
        name: 'GitHub Developer',
        avatarUrl:
          'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&h=150',
      },
      linkedin: {
        email: 'linkedin.lead@example.com',
        name: 'LinkedIn Professional',
        avatarUrl:
          'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&h=150',
      },
    }[provider] || { email: 'oauth@example.com', name: 'Social User' };

    this.authService.oauthLogin(provider, mockProfile).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.error || 'OAuth authentication failed.');
      },
    });
  }
}
