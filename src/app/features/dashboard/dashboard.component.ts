import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../core/services/project.service';
import { TaskService } from '../../core/services/task.service';
import { SprintService } from '../../core/services/sprint.service';
import { Project, Task, Sprint, TaskStatus, SprintStatus } from '../../shared/models';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard">
      <div class="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back! Here's an overview of your projects.</p>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon" style="background: #e3fcef;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00875a">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ projects.length }}</div>
            <div class="stat-label">Active Projects</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #deebff;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0052cc">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 11l3 3 5-5"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ completedTasksCount }}</div>
            <div class="stat-label">Tasks Completed</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #fff4e6;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff991f">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ activeSprintsCount }}</div>
            <div class="stat-label">Active Sprints</div>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon" style="background: #ffebe6;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#de350b">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
            </svg>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ inProgressTasksCount }}</div>
            <div class="stat-label">In Progress</div>
          </div>
        </div>
      </div>

      <div class="section-header">
        <h2>Recent Projects</h2>
        <a routerLink="/projects" class="link-button">View all projects →</a>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading projects...</p>
        </div>
      } @else if (projects.length === 0) {
        <div class="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#b3bac5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          <a routerLink="/projects" class="btn-primary">Create Project</a>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of projects; track project.id) {
            <div class="project-card" [routerLink]="['/projects', project.id, 'board']">
              <div class="project-header">
                
                <button class="project-menu-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="1"/>
                    <circle cx="19" cy="12" r="1"/>
                    <circle cx="5" cy="12" r="1"/>
                  </svg>
                </button>
              </div>
              <h3 class="project-name">{{ project.name }}</h3>
              <p class="project-description">{{ project.description || 'No description' }}</p>
             
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1400px;
      margin: 0 auto;
    }

    .dashboard-header {
      margin-bottom: 32px;
    }

    .dashboard-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
    }

    .dashboard-header p {
      color: #5e6c84;
      margin: 0;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }

    .stat-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .stat-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-info {
      flex: 1;
    }

    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #172b4d;
      line-height: 1;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      color: #5e6c84;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .section-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #172b4d;
      margin: 0;
    }

    .link-button {
      color: #0052cc;
      text-decoration: none;
      font-size: 14px;
      font-weight: 500;
      transition: color 0.2s;
    }

    .link-button:hover {
      color: #0747a6;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }

    .project-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: all 0.2s;
      border: 2px solid transparent;
    }

    .project-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #0052cc;
      transform: translateY(-2px);
    }

    .project-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .project-icon {
      width: 40px;
      height: 40px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 14px;
    }

    .project-menu-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: none;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5e6c84;
      transition: all 0.2s;
    }

    .project-menu-btn:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .project-name {
      font-size: 18px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
    }

    .project-description {
      font-size: 14px;
      color: #5e6c84;
      margin: 0 0 16px 0;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 16px;
      border-top: 1px solid #f4f5f7;
      font-size: 12px;
    }

    .project-key {
      padding: 4px 8px;
      background: #f4f5f7;
      border-radius: 4px;
      font-weight: 600;
      color: #5e6c84;
    }

    .project-owner {
      color: #5e6c84;
    }

    .loading-state,
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      text-align: center;
    }

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #0052cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .empty-state svg {
      margin-bottom: 24px;
    }

    .empty-state h3 {
      font-size: 20px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      color: #5e6c84;
      margin: 0 0 24px 0;
    }

    .btn-primary {
      padding: 12px 24px;
      background: #0052cc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: all 0.2s;
    }

    .btn-primary:hover {
      background: #0747a6;
    }
  `]
})
export class DashboardComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  completedTasksCount = 0;
  activeSprintsCount = 0;
  inProgressTasksCount = 0;

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private sprintService: SprintService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    forkJoin({
      projects: this.projectService.getProjects(),
      tasks: this.taskService.getTasks({}),
      sprints: this.sprintService.getSprints()
    }).subscribe({
      next: (result) => {
        this.projects = result.projects;

        // Calculate statistics
        this.completedTasksCount = result.tasks.filter(t => t.status === TaskStatus.Done).length;
        this.inProgressTasksCount = result.tasks.filter(t => t.status === TaskStatus.InProgress).length;
        this.activeSprintsCount = result.sprints.filter(s => s.status === SprintStatus.Active).length;

        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
