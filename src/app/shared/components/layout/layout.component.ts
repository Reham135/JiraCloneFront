import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { SignalRService } from '../../../core/services/signalr.service';
import { User, Notification } from '../../models';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="app-layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <svg width="32" height="32" viewBox="0 0 40 40">
              <rect width="40" height="40" rx="8" fill="#0052CC"/>
              <path d="M20 10 L30 20 L20 30 L10 20 Z" fill="white"/>
            </svg>
          </div>
          <span class="logo-text">JiraClone</span>
        </div>

        <nav class="sidebar-nav">
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="14" y="14" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
            </svg>
            <span>Dashboard</span>
          </a>

          <a routerLink="/projects" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Projects</span>
          </a>

          <a routerLink="/backlog" routerLinkActive="active" class="nav-item">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M3 3h18v18H3z"/>
              <path d="M3 9h18"/>
              <path d="M3 15h18"/>
              <path d="M9 3v18"/>
            </svg>
            <span>Backlog</span>
          </a>

          <div class="nav-divider"></div>

          @if (currentProject) {
            <div class="nav-section">
              <div class="section-title">{{ currentProject }}</div>
              <a [routerLink]="['/projects', projectId, 'board']" routerLinkActive="active" class="nav-item nav-sub-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="3" width="7" height="18" rx="1"/>
                  <rect x="14" y="3" width="7" height="10" rx="1"/>
                </svg>
                <span>Board</span>
              </a>

              <a [routerLink]="['/projects', projectId, 'sprints']" routerLinkActive="active" class="nav-item nav-sub-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                <span>Sprints</span>
              </a>

              <a [routerLink]="['/projects', projectId, 'backlog']" routerLinkActive="active" class="nav-item nav-sub-item">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 3h18v18H3z"/>
                  <path d="M3 9h18"/>
                  <path d="M3 15h18"/>
                  <path d="M9 3v18"/>
                </svg>
                <span>Backlog</span>
              </a>
            </div>
          }
        </nav>
      </aside>

      <!-- Main Content -->
      <div class="main-content">
        <!-- Header -->
        <header class="header">
          <div class="header-right">
            <div class="notification-menu">
              <button class="icon-button" (click)="toggleNotifications()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                @if (unreadCount > 0) {
                  <span class="notification-badge">{{ unreadCount }}</span>
                }
              </button>

              @if (showNotifications) {
                <div class="notification-dropdown">
                  <div class="notification-header">
                    <span>Notifications</span>
                  </div>

                  @if (notifications.length === 0) {
                    <div class="notification-empty">No notifications</div>
                  } @else {
                    <div class="notification-list">
                      @for (notification of notifications; track notification.id) {
                        <div
                          class="notification-item"
                          [class.unread]="!notification.isRead"
                          (click)="handleNotificationClick(notification)">
                          <div class="notification-message">{{ notification.message }}</div>
                          <div class="notification-time">{{ getTimeAgo(notification.createdAt) }}</div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <button class="icon-button">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="1"/>
                <circle cx="19" cy="12" r="1"/>
                <circle cx="5" cy="12" r="1"/>
              </svg>
            </button>

            <div class="user-menu">
              <button class="user-avatar" (click)="toggleUserMenu()">
                @if (currentUser?.avatarUrl) {
                  <img [src]="currentUser!.avatarUrl!" [alt]="currentUser!.firstName" />
                } @else {
                  <div class="avatar-placeholder">
                    {{ getInitials(currentUser) }}
                  </div>
                }
              </button>

              @if (showUserMenu) {
                <div class="user-dropdown">
                  <div class="user-info">
                    <div class="user-name">{{ currentUser?.firstName }} {{ currentUser?.lastName }}</div>
                    <div class="user-email">{{ currentUser?.email }}</div>
                  </div>
                  <div class="dropdown-divider"></div>
                  <button class="dropdown-item" (click)="logout()">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Log out
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="page-content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .app-layout {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* Sidebar Styles */
    .sidebar {
      width: 260px;
      background: #0747a6;
      color: white;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
    }

    .sidebar-header {
      padding: 20px;
      display: flex;
      align-items: center;
      gap: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo svg {
      display: block;
    }

    .logo-text {
      font-size: 20px;
      font-weight: 700;
    }

    .sidebar-nav {
      flex: 1;
      padding: 16px 0;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 20px;
      color: rgba(255, 255, 255, 0.8);
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }

    .nav-item:hover {
      background: rgba(255, 255, 255, 0.1);
      color: white;
    }

    .nav-item.active {
      background: rgba(255, 255, 255, 0.15);
      color: white;
      border-right: 3px solid white;
    }

    .nav-sub-item {
      padding-left: 40px;
      font-size: 14px;
    }

    .nav-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.1);
      margin: 16px 20px;
    }

    .nav-section {
      margin-top: 16px;
    }

    .section-title {
      padding: 8px 20px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      opacity: 0.6;
      letter-spacing: 0.5px;
    }

    /* Main Content Styles */
    .main-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      background: #f4f5f7;
    }

    /* Header Styles */
    .header {
      height: 64px;
      background: white;
      border-bottom: 1px solid #dfe1e6;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      z-index: 100;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .search-box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f4f5f7;
      border-radius: 6px;
      width: 300px;
    }

    .search-box svg {
      color: #5e6c84;
    }

    .search-box input {
      flex: 1;
      border: none;
      background: none;
      outline: none;
      font-size: 14px;
      color: #172b4d;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .icon-button {
      width: 36px;
      height: 36px;
      border: none;
      background: none;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5e6c84;
      transition: all 0.2s;
    }

    .icon-button:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .notification-menu {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      background: #e34935;
      color: white;
      border-radius: 10px;
      padding: 2px 6px;
      font-size: 11px;
      font-weight: 600;
      min-width: 18px;
      text-align: center;
    }

    .notification-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      width: 320px;
      max-height: 400px;
      overflow-y: auto;
      z-index: 1000;
    }

    .notification-header {
      padding: 16px;
      border-bottom: 1px solid #dfe1e6;
      font-weight: 600;
      color: #172b4d;
      font-size: 14px;
    }

    .notification-empty {
      padding: 32px;
      text-align: center;
      color: #5e6c84;
      font-size: 14px;
    }

    .notification-list {
      max-height: 320px;
      overflow-y: auto;
    }

    .notification-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f4f5f7;
      cursor: pointer;
      transition: background 0.2s;
    }

    .notification-item:hover {
      background: #f4f5f7;
    }

    .notification-item.unread {
      background: #e9f2ff;
    }

    .notification-item.unread:hover {
      background: #deebff;
    }

    .notification-message {
      color: #172b4d;
      font-size: 13px;
      margin-bottom: 4px;
    }

    .notification-time {
      color: #5e6c84;
      font-size: 11px;
    }

    .user-menu {
      position: relative;
    }

    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .user-avatar img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
    }

    .avatar-placeholder {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: #0052cc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
    }

    .user-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: white;
      border-radius: 8px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
      min-width: 240px;
      z-index: 1000;
    }

    .user-info {
      padding: 16px;
    }

    .user-name {
      font-weight: 600;
      color: #172b4d;
      margin-bottom: 4px;
    }

    .user-email {
      font-size: 12px;
      color: #5e6c84;
    }

    .dropdown-divider {
      height: 1px;
      background: #dfe1e6;
    }

    .dropdown-item {
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 12px;
      color: #172b4d;
      font-size: 14px;
      transition: background 0.2s;
    }

    .dropdown-item:hover {
      background: #f4f5f7;
    }

    .dropdown-item svg {
      color: #5e6c84;
    }

    /* Page Content */
    .page-content {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
    }
  `]
})
export class LayoutComponent implements OnInit, OnDestroy {
  currentUser: User | null = null;
  showUserMenu = false;
  showNotifications = false;
  notifications: Notification[] = [];
  unreadCount = 0;
  currentProject: string | null = null;
  projectId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private signalRService: SignalRService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscribe to authentication state changes
    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        // User logged in - start SignalR and load notifications
        this.initializeNotifications();
      } else {
        // User logged out - disconnect SignalR and clear notifications
        this.disconnectSignalR();
      }
    });

    // Subscribe to notification updates from the service
    this.notificationService.notifications$.pipe(takeUntil(this.destroy$)).subscribe(notifications => {
      this.notifications = notifications;
    });

    // Subscribe to unread count updates
    this.notificationService.unreadCount$.pipe(takeUntil(this.destroy$)).subscribe(count => {
      this.unreadCount = count;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnectSignalR();
  }

  /**
   * Initialize notifications when user logs in
   */
  private async initializeNotifications(): Promise<void> {
    try {
      // Load initial notifications from API
      this.notificationService.getUserNotifications().subscribe({
        next: (notifications) => {
          console.log('Initial notifications loaded:', notifications.length);
        },
        error: (error) => {
          // Silently handle 401/403 errors (user not authenticated)
          if (error.status !== 401 && error.status !== 403) {
            console.error('Error loading notifications:', error);
          }
        }
      });

      // Start SignalR connection for real-time updates
      await this.signalRService.startConnection();
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Disconnect SignalR when user logs out
   */
  private async disconnectSignalR(): Promise<void> {
    try {
      await this.signalRService.stopConnection();
      this.notificationService.clearNotifications();
    } catch (error) {
      console.error('Error disconnecting SignalR:', error);
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showUserMenu) {
      this.showUserMenu = false;
    }
  }

  handleNotificationClick(notification: Notification): void {
    // Don't process if user is not logged in
    if (!this.currentUser) {
      return;
    }

    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification.id).subscribe({
        next: () => {
          notification.isRead = true;
          this.unreadCount = Math.max(0, this.unreadCount - 1);
        },
        error: (error) => {
          // Silently handle auth errors
          if (error.status !== 401 && error.status !== 403) {
            console.error('Error marking notification as read:', error);
          }
        }
      });
    }

    // Navigate to the task/comment if taskId is available
    if (notification.taskId && notification.projectId) {
      this.showNotifications = false;

      // Navigate to the task detail page
      const taskDetailUrl = `/projects/${notification.projectId}/tasks/${notification.taskId}`;

      // If there's a comment, add it as a fragment to scroll to
      if (notification.commentId) {
        this.router.navigate([taskDetailUrl], { fragment: `comment-${notification.commentId}` });
      } else {
        this.router.navigate([taskDetailUrl]);
      }
    }
  }

  getTimeAgo(date: Date): string {
    // Calculate time difference directly (timezone doesn't affect the difference)
    const now = new Date();
    const notificationDate = new Date(date);

    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMinutes = Math.floor(diffInMs / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;

    return `${Math.floor(diffInDays / 7)}w ago`;
  }

  getInitials(user: User | null): string {
    if (!user) return '?';
    return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  }

  toggleUserMenu(): void {
    this.showUserMenu = !this.showUserMenu;
    if (this.showNotifications) {
      this.showNotifications = false;
    }
  }

  async logout(): Promise<void> {
    // Disconnect SignalR before logging out
    await this.disconnectSignalR();
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
