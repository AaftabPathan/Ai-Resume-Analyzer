import { Component, signal, computed } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService, User } from '../../core/services/auth.service';

interface NavItem {
  label: string;
  route: string;
  icon: string;
  roles: string[];
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
  ],
  template: `
    <div [class.dark]="isDarkMode()" class="min-h-screen flex bg-slate-950 text-slate-100 transition-colors duration-200">
      
      <!-- Side Navigation Panel -->
      <aside [class.w-64]="isSidebarOpen()" [class.w-20]="!isSidebarOpen()" 
             class="fixed md:static inset-y-0 left-0 z-40 bg-slate-900/40 border-r border-slate-800/40 flex flex-col justify-between transition-all duration-300 backdrop-blur-md">
        
        <div>
          <!-- Sidebar Header Logo -->
          <div class="h-16 flex items-center px-4 border-b border-slate-800/30 justify-between">
            <div class="flex items-center space-x-3 overflow-hidden">
              <div class="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center font-bold text-xs shadow-md shrink-0">
                AR
              </div>
              <span *ngIf="isSidebarOpen()" class="font-bold tracking-tight text-sm text-slate-200 truncate">
                ResumeAI Panel
              </span>
            </div>
            <button (click)="toggleSidebar()" class="text-slate-400 hover:text-white hidden md:block">
              <mat-icon>{{ isSidebarOpen() ? 'menu_open' : 'menu' }}</mat-icon>
            </button>
          </div>

          <!-- Nav Items Links -->
          <nav class="p-3 space-y-1.5">
            <a *ngFor="let item of filteredNavItems()" 
               [routerLink]="item.route" 
               routerLinkActive="bg-violet-600/10 border-l-4 border-violet-500 text-white font-semibold shadow-md shadow-violet-950/20"
               [routerLinkActiveOptions]="{exact: item.route === '/dashboard'}"
               class="flex items-center p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/40 transition-all duration-200 group">
              <mat-icon class="shrink-0 text-xl group-hover:scale-110 transition-transform duration-200">{{ item.icon }}</mat-icon>
              <span *ngIf="isSidebarOpen()" class="ml-4 text-sm tracking-wide transition-opacity duration-300">{{ item.label }}</span>
            </a>
          </nav>
        </div>

        <!-- Sidebar Footer Profile -->
        <div class="p-3 border-t border-slate-800/30">
          <div class="flex items-center p-2 rounded-xl bg-slate-950/30 border border-slate-800/40 overflow-hidden">
            <img [src]="user()?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'" 
                 alt="User Profile" class="w-8 h-8 rounded-lg border border-slate-850 shrink-0">
            <div *ngIf="isSidebarOpen()" class="ml-3 overflow-hidden">
              <h4 class="text-xs font-semibold text-slate-200 truncate">{{ user()?.name }}</h4>
              <span class="text-[10px] text-slate-500 capitalize">{{ user()?.role }}</span>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Shell Area -->
      <div class="flex-1 flex flex-col min-w-0 relative">
        
        <!-- Header Bar -->
        <header class="h-16 border-b border-slate-800/30 bg-slate-950/45 backdrop-blur-md sticky top-0 z-30 px-6 flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <button (click)="toggleSidebar()" class="text-slate-400 hover:text-white md:hidden">
              <mat-icon>menu</mat-icon>
            </button>
            <h2 class="text-lg font-semibold capitalize tracking-tight text-slate-200">
              {{ currentRouteTitle() }}
            </h2>
          </div>

          <div class="flex items-center space-x-3">
            <!-- Theme Toggle -->
            <button (click)="toggleTheme()" mat-icon-button class="text-slate-400 hover:text-white">
              <mat-icon>{{ isDarkMode() ? 'light_mode' : 'dark_mode' }}</mat-icon>
            </button>

            <!-- Alerts trigger -->
            <button [matMenuTriggerFor]="notifMenu" mat-icon-button class="text-slate-400 hover:text-white relative">
              <mat-icon>notifications</mat-icon>
              <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
            </button>
            <mat-menu #notifMenu="matMenu" class="dark-menu">
              <div class="px-4 py-2 border-b border-slate-800 text-xs font-bold text-slate-400 uppercase tracking-wider">
                Notifications
              </div>
              <button mat-menu-item class="!text-sm text-slate-300">
                <span class="font-semibold text-white">System:</span> AI Gemini Engine Active.
              </button>
              <button mat-menu-item class="!text-sm text-slate-300">
                <span class="font-semibold text-white">Parser:</span> Sample resume compiled successfully.
              </button>
            </mat-menu>

            <!-- Profile Menu -->
            <button [matMenuTriggerFor]="profileMenu" class="flex items-center space-x-2 border border-slate-800/80 hover:border-slate-700 bg-slate-900/40 px-2 py-1 rounded-xl transition-all duration-200">
              <img [src]="user()?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&h=80'" 
                   alt="User Profile" class="w-6 h-6 rounded-md border border-slate-700">/>
              <mat-icon class="text-slate-400 !text-sm flex items-center justify-center shrink-0"
                >arrow_drop_down</mat-icon
              >
            </button>
            <mat-menu #profileMenu="matMenu" class="dark-menu">
              <div class="px-4 py-2 border-b border-slate-800">
                <div class="text-xs font-bold text-white">{{ user()?.name }}</div>
                <div class="text-[10px] text-slate-500">{{ user()?.email }}</div>
              </div>
              <button mat-menu-item routerLink="/dashboard" class="!text-sm !text-slate-300">
                <mat-icon class="!text-slate-400">dashboard</mat-icon>
                <span>Dashboard</span>
              </button>
              <button mat-menu-item (click)="logout()" class="!text-sm !text-slate-300">
                <mat-icon class="!text-slate-400 text-red-500">logout</mat-icon>
                <span class="text-red-400">Sign Out</span>
              </button>
            </mat-menu>
          </div>
        </header>

        <!-- Main Workspace Router Outlet -->
        <main class="flex-1 p-6 overflow-y-auto">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [
    `
      ::ng-deep .dark-menu.mat-mdc-menu-panel {
        background-color: #0f172a !important;
        border: 1px solid #1e293b !important;
        border-radius: 12px !important;
        min-width: 200px;
      }
      ::ng-deep .dark-menu .mat-mdc-menu-item .mat-mdc-menu-item-text {
        color: #94a3b8 !important;
      }
      ::ng-deep .dark-menu .mat-mdc-menu-item:hover {
        background-color: #1e293b !important;
      }
    `,
  ],
})
export class LayoutComponent {
  readonly isSidebarOpen = signal(true);
  readonly isDarkMode = signal(true);
  readonly currentRouteTitle = signal('dashboard');

  readonly user = computed(() => this.authService.currentUser());

  readonly navItems: NavItem[] = [
    {
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      roles: ['user', 'recruiter', 'admin'],
    },
    { label: 'Resume Analyzer', route: '/analyzer', icon: 'analytics', roles: ['user', 'admin'] },
    { label: 'Resume Builder', route: '/builder', icon: 'edit_note', roles: ['user', 'admin'] },
    { label: 'Career Coach', route: '/coach', icon: 'assistant', roles: ['user', 'admin'] },
    { label: 'Voice Simulator', route: '/voice', icon: 'mic', roles: ['user', 'admin'] },
    { label: 'Career Mentor', route: '/mentor', icon: 'psychology', roles: ['user', 'admin'] },
    { label: 'Cover Letter', route: '/cover-letter', icon: 'email', roles: ['user', 'admin'] },
    {
      label: 'Recruiter Portal',
      route: '/recruiter',
      icon: 'badge',
      roles: ['recruiter', 'admin'],
    },
    { label: 'System Admin', route: '/admin', icon: 'admin_panel_settings', roles: ['admin'] },
  ];

  readonly filteredNavItems = computed(() => {
    const role = this.user()?.role;
    if (!role) return [];
    return this.navItems.filter((item) => item.roles.includes(role));
  });

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    // Detect route changes to update header breadcrumb titles
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const url = event.urlAfterRedirects || event.url;
        const cleanPath = url.split('?')[0].split('/').pop() || 'dashboard';
        this.currentRouteTitle.set(cleanPath);
      });
  }

  toggleSidebar(): void {
    this.isSidebarOpen.set(!this.isSidebarOpen());
  }

  toggleTheme(): void {
    this.isDarkMode.set(!this.isDarkMode());
  }

  logout(): void {
    this.authService.logout();
  }
}
