// Authentication Registration Page Component
import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressBarModule,
  ],
  template: `
    <div
      class="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6 relative overflow-hidden"
    >
      <!-- Background glows -->
      <div
        class="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-900/15 blur-[120px] pointer-events-none animate-float-slow"
      ></div>
      <div
        class="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-cyan-950/15 blur-[120px] pointer-events-none animate-float-delayed"
      ></div>

      <div class="w-full max-w-md relative z-10">
        <!-- Logo Header -->
        <div
          routerLink="/"
          class="flex items-center justify-center space-x-3 mb-8 cursor-pointer group"
        >
          <div
            class="w-9 h-9 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-md"
          >
            AR
          </div>
          <span
            class="text-lg font-bold tracking-tight text-slate-200 group-hover:text-white transition"
          >
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

          <h2 class="text-2xl font-bold mb-2">Create Account</h2>
          <p class="text-slate-400 text-sm mb-6">
            Gain access to the full AI parser and optimization dashboard.
          </p>

          <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="space-y-4">
            <!-- Full Name -->
            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Full Name</mat-label>
              <input matInput type="text" formControlName="name" placeholder="John Doe" required />
              <mat-error *ngIf="registerForm.get('name')?.hasError('required')"
                >Name is required</mat-error
              >
            </mat-form-field>

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
              <mat-error *ngIf="registerForm.get('email')?.hasError('email')"
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
              <mat-error *ngIf="registerForm.get('password')?.hasError('minlength')"
                >Password must be at least 4 characters</mat-error
              >
            </mat-form-field>

            <!-- Role Selection -->
            <mat-form-field appearance="outline" class="w-full dark-form-field">
              <mat-label>Register As</mat-label>
              <mat-select formControlName="role" required>
                <mat-option value="user">Candidate / Job Seeker</mat-option>
                <mat-option value="recruiter">Recruiter / Talent Acquisition</mat-option>
                <mat-option value="admin">System Administrator</mat-option>
              </mat-select>
            </mat-form-field>

            <!-- Error Alert -->
            <div
              *ngIf="errorMessage()"
              class="p-3 bg-red-950/30 border border-red-800 text-red-300 text-xs rounded-xl"
            >
              {{ errorMessage() }}
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              mat-raised-button
              color="primary"
              [disabled]="registerForm.invalid || isLoading()"
              class="!w-full !bg-gradient-to-r !from-violet-600 !to-indigo-600 !text-white !py-3 !rounded-xl !font-bold !shadow-md hover:!shadow-violet-600/10"
            >
              Create Account
            </button>
          </form>
        </div>

        <p class="text-center text-sm text-slate-500 mt-8">
          Already have an account?
          <a routerLink="/auth/login" class="text-violet-400 hover:text-violet-300 hover:underline"
            >Sign in instead</a
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
      ::ng-deep .mat-mdc-select-value {
        color: #cbd5e1 !important;
      }
    `,
  ],
})
export class RegisterComponent {
  readonly registerForm: FormGroup;
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      role: ['user', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register(this.registerForm.value).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        // Route according to chosen role
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
        this.errorMessage.set(err.error?.error || 'Registration failed. Try a different email.');
      },
    });
  }
}
