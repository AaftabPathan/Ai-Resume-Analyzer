import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule],
  template: `
    <div class="min-h-screen bg-slate-950 text-white font-sans overflow-x-hidden relative">
      <!-- Background Ambient Floating Lights -->
      <div class="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-violet-900/15 blur-[130px] pointer-events-none animate-float-slow"></div>
      <div class="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-950/15 blur-[130px] pointer-events-none animate-float-delayed"></div>
      <div class="absolute top-[40%] left-[70%] w-[30vw] h-[30vw] rounded-full bg-fuchsia-950/10 blur-[120px] pointer-events-none animate-float-slow"></div>

      <!-- Navigation Header -->
      <header class="sticky top-0 z-50 backdrop-blur-md bg-slate-950/70 border-b border-slate-900/60 px-6 py-4 flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-lg shadow-lg shadow-violet-500/20 shrink-0">
            AR
          </div>
          <span class="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
            ResumeAI Intel
          </span>
        </div>
        
        <nav class="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
          <a href="#features" class="hover:text-white transition-colors">Features</a>
          <a href="#pricing" class="hover:text-white transition-colors">Pricing</a>
          <a href="#about" class="hover:text-white transition-colors">About</a>
        </nav>

        <div class="flex items-center space-x-4">
          <a routerLink="/auth/login" class="text-sm font-medium hover:text-white transition text-slate-350">Sign In</a>
          <button routerLink="/auth/register" mat-flat-button color="primary" 
                  class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !px-5 !py-2 !font-semibold shadow-lg shadow-violet-500/20 glowing-btn-hover">
            Get Started Free
          </button>
        </div>
      </header>

      <!-- Hero Section -->
      <section class="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
        <!-- Floating Tag -->
        <div class="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-violet-950/40 border border-violet-900/60 text-xs text-violet-300 font-semibold mb-8 animate-glow-pulse">
          <span class="w-2 h-2 rounded-full bg-violet-400 animate-ping"></span>
          <span>Next-Gen Career Optimization Platform</span>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-tight">
          Supercharge Your Career with<br>
          <span class="text-gradient-premium">
            Enterprise-Grade AI
          </span>
        </h1>
        
        <p class="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Analyze resumes instantly, audit formatting against applicant tracking systems (ATS), generate mock interview panels, bridge skill gaps, and auto-compose high-converting cover letters.
        </p>

        <div class="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
          <button routerLink="/auth/register" mat-raised-button 
                  class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !text-white !rounded-xl !px-8 !py-4 !text-base !font-semibold !shadow-xl !shadow-violet-600/30 glowing-btn-hover">
            Upload Your Resume
          </button>
          <a href="#features" class="text-slate-300 hover:text-white font-medium flex items-center space-x-2 group">
            <span>Explore Features</span>
            <span class="group-hover:translate-x-1.5 transition-transform duration-200">→</span>
          </a>
        </div>

        <!-- Dashboard Preview Box (SaaS Dashboard Mockup) -->
        <div class="mt-20 relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/30 p-2 shadow-2xl max-w-4xl mx-auto animate-float-slow">
          <div class="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/20 to-slate-950 z-10 pointer-events-none"></div>
          <div class="rounded-2xl overflow-hidden bg-slate-950/70 border border-slate-900 p-6 md:p-8">
            <!-- Mock Header -->
            <div class="flex items-center justify-between border-b border-slate-900 pb-4 mb-6">
              <div class="flex items-center space-x-2">
                <span class="w-3 h-3 rounded-full bg-red-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-yellow-500/80"></span>
                <span class="w-3 h-3 rounded-full bg-green-500/80"></span>
              </div>
              <span class="text-[10px] font-mono text-slate-500">candidate_telemetry_analyzer.json</span>
            </div>
            
            <!-- Mock Dashboard Body -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              <!-- Left side metrics -->
              <div class="space-y-4">
                <div class="p-4 rounded-xl border border-slate-900 bg-slate-900/20">
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Average ATS Match</span>
                  <div class="flex items-baseline space-x-2 mt-1">
                    <span class="text-3xl font-extrabold text-emerald-400 font-mono">87%</span>
                    <span class="text-[10px] text-slate-500">/ 100</span>
                  </div>
                </div>
                <div class="p-4 rounded-xl border border-slate-900 bg-slate-900/20">
                  <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">AI Suggestions Applied</span>
                  <div class="text-2xl font-bold text-violet-400 mt-1">14 Bullets</div>
                </div>
              </div>
              <!-- Center chart mockup -->
              <div class="p-5 rounded-xl border border-slate-900 bg-slate-900/10 md:col-span-2 flex flex-col justify-between">
                <div>
                  <div class="flex items-center justify-between text-xs font-semibold text-slate-300 mb-4">
                    <span>Keyword Match Analysis</span>
                    <span class="text-emerald-400 text-[10px] font-mono">Completed</span>
                  </div>
                  <div class="space-y-3">
                    <div>
                      <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>TypeScript & Angular</span>
                        <span>92%</span>
                      </div>
                      <div class="w-full bg-slate-900 rounded-full h-1.5">
                        <div class="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full" style="width: 92%"></div>
                      </div>
                    </div>
                    <div>
                      <div class="flex justify-between text-[10px] text-slate-400 mb-1">
                        <span>System Architecture</span>
                        <span>78%</span>
                      </div>
                      <div class="w-full bg-slate-900 rounded-full h-1.5">
                        <div class="bg-gradient-to-r from-violet-500 to-indigo-500 h-1.5 rounded-full" style="width: 78%"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="text-center pt-4">
                  <button routerLink="/auth/register" class="px-4 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 font-semibold hover:bg-violet-600/20 transition-all">
                    Unlock Live Analysis Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Features Section -->
      <section id="features" class="max-w-6xl mx-auto px-6 py-24 border-t border-slate-900/60 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-4xl font-bold mb-4">Complete Suite of AI Career Tools</h2>
          <p class="text-slate-400 max-w-xl mx-auto">Twelve powerful modules designed to bring full visibility, optimization, and automation to your career journey.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Card 1 -->
          <div class="p-8 rounded-2xl glass-card glass-card-hover group">
            <div class="w-12 h-12 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform duration-200">
              📝
            </div>
            <h3 class="text-xl font-bold mb-3 text-slate-100">AI Resume Parser</h3>
            <p class="text-slate-450 text-sm leading-relaxed">Upload PDF or DOCX files and automatically extract personal details, work histories, skills, and certifications into structured data.</p>
          </div>

          <!-- Card 2 -->
          <div class="p-8 rounded-2xl glass-card glass-card-hover group">
            <div class="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform duration-200">
              🎯
            </div>
            <h3 class="text-xl font-bold mb-3 text-slate-100">ATS Score Analyzer</h3>
            <p class="text-slate-450 text-sm leading-relaxed">Review your resume against strict standard parsing formats. Get detailed scoring, missing keywords checklists, and layout feedback.</p>
          </div>

          <!-- Card 3 -->
          <div class="p-8 rounded-2xl glass-card glass-card-hover group">
            <div class="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform duration-200">
              🛣️
            </div>
            <h3 class="text-xl font-bold mb-3 text-slate-100">AI Career Coaching</h3>
            <p class="text-slate-450 text-sm leading-relaxed">Pick a role (Full Stack, DevOps, AI Engineer) and generate a custom learning path, required courses, certifications, and target project lists.</p>
          </div>

          <!-- Card 4 -->
          <div class="p-8 rounded-2xl glass-card glass-card-hover group">
            <div class="w-12 h-12 rounded-xl bg-violet-600/10 text-violet-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform duration-200">
              🎤
            </div>
            <h3 class="text-xl font-bold mb-3 text-slate-100">AI Mock Interview Panel</h3>
            <p class="text-slate-450 text-sm leading-relaxed">Receive personalized technical, behavioral, and HR questions based on your resume, with comprehensive guides and custom answer trackers.</p>
          </div>

          <!-- Card 5 -->
          <div class="p-8 rounded-2xl glass-card glass-card-hover group">
            <div class="w-12 h-12 rounded-xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform duration-200">
              🛠️
            </div>
            <h3 class="text-xl font-bold mb-3 text-slate-100">AI Resume Builder</h3>
            <p class="text-slate-450 text-sm leading-relaxed">Create dynamic resumes using premium professional templates, live rendering previews, and direct PDF downloads.</p>
          </div>

          <!-- Card 6 -->
          <div class="p-8 rounded-2xl glass-card glass-card-hover group">
            <div class="w-12 h-12 rounded-xl bg-emerald-600/10 text-emerald-400 flex items-center justify-center text-xl font-bold mb-6 group-hover:scale-110 transition-transform duration-200">
              ✉️
            </div>
            <h3 class="text-xl font-bold mb-3 text-slate-100">Cover Letter Generator</h3>
            <p class="text-slate-450 text-sm leading-relaxed">Instantly generate high-quality, targeted cover letters mapping your experience specifically to targeted job details.</p>
          </div>
        </div>
      </section>

      <!-- Pricing Section -->
      <section id="pricing" class="max-w-6xl mx-auto px-6 py-24 border-t border-slate-900/60 relative z-10">
        <div class="text-center mb-16">
          <h2 class="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p class="text-slate-400">Everything you need to accelerate your applications. Start free and scale up.</p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <!-- Free Tier -->
          <div class="p-8 rounded-2xl glass-card flex flex-col justify-between border-slate-800">
            <div>
              <span class="text-sm font-semibold uppercase tracking-wider text-slate-400">Free Tier</span>
              <h3 class="text-4xl font-extrabold mt-4 mb-2 text-slate-100">$0</h3>
              <p class="text-slate-455 text-sm">Perfect for entry-level resume optimization</p>
              
              <ul class="space-y-3 text-sm text-slate-300 mt-8">
                <li class="flex items-center space-x-2"><span class="text-violet-500">✓</span> <span>Analyze up to 3 resumes</span></li>
                <li class="flex items-center space-x-2"><span class="text-violet-500">✓</span> <span>Detailed ATS Score report</span></li>
                <li class="flex items-center space-x-2"><span class="text-violet-500">✓</span> <span>Limited AI Career Roadmap</span></li>
                <li class="flex items-center space-x-2"><span class="text-violet-500">✓</span> <span>Mock interview bank access</span></li>
              </ul>
            </div>
            <button routerLink="/auth/register" mat-stroked-button class="!border-slate-800 !rounded-xl !w-full !py-2.5 !text-slate-300 hover:!bg-slate-900/60 mt-8 glowing-btn-hover">
              Sign Up Free
            </button>
          </div>

          <!-- Enterprise Tier -->
          <div class="p-8 rounded-2xl bg-gradient-to-b from-slate-900 to-indigo-950/30 border border-indigo-500/40 flex flex-col justify-between relative shadow-2xl shadow-indigo-900/10">
            <div class="absolute top-0 right-8 -translate-y-1/2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Popular
            </div>
            <div>
              <span class="text-sm font-semibold uppercase tracking-wider text-indigo-400">Professional</span>
              <h3 class="text-4xl font-extrabold mt-4 mb-2 text-slate-100">$15<span class="text-lg text-slate-400 font-normal">/mo</span></h3>
              <p class="text-slate-455 text-sm">Everything you need for job-searching campaigns</p>
              
              <ul class="space-y-3 text-sm text-slate-300 mt-8">
                <li class="flex items-center space-x-2 text-indigo-400"><span>✓</span> <span class="text-slate-300">Unlimited uploads and parses</span></li>
                <li class="flex items-center space-x-2 text-indigo-400"><span>✓</span> <span class="text-slate-300">Advanced AI rewrite recommendations</span></li>
                <li class="flex items-center space-x-2 text-indigo-400"><span>✓</span> <span class="text-slate-300">Unlimited Cover Letter exports (PDF/DOCX)</span></li>
                <li class="flex items-center space-x-2 text-indigo-400"><span>✓</span> <span class="text-slate-300">Personalized Mock Interview generations</span></li>
                <li class="flex items-center space-x-2 text-indigo-400"><span>✓</span> <span class="text-slate-300">Recruiter search optimization options</span></li>
              </ul>
            </div>
            <button routerLink="/auth/register" mat-flat-button color="primary" 
                    class="!bg-gradient-to-r !from-violet-600 !to-indigo-600 !rounded-xl !w-full !py-2.5 !font-semibold !shadow-lg !shadow-violet-600/20 mt-8 glowing-btn-hover">
              Upgrade to Pro
            </button>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="border-t border-slate-900 bg-slate-950 py-12 px-6 relative z-10">
        <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <div class="flex items-center space-x-3 mb-4 md:mb-0">
            <div class="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-xs text-white">
              AR
            </div>
            <span class="text-slate-400 font-bold">ResumeAI Platform</span>
          </div>
          <div>© 2026 ResumeAI Intel, Inc. All rights reserved. Portfolio Showcase Project.</div>
        </div>
      </footer>
    </div>
  `,
})
export class LandingComponent {}
