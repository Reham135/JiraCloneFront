import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../core/services/task.service';
import { ProjectService } from '../../core/services/project.service';
import { ToastService } from '../../shared/services/toast.service';
import { Task, Project } from '../../shared/models';

@Component({
  selector: 'app-backlog-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="backlog-list-container">
      <div class="page-header">
        <div class="header-content">
          <h1>All Backlogs</h1>
          <p class="subtitle">View and manage backlog items across all projects</p>
        </div>
      </div>

      <!-- Project Filter -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Project:</label>
          <select class="filter-select" [(ngModel)]="selectedProjectId" (ngModelChange)="onProjectFilterChange()">
            <option value="">All Projects</option>
            @for (project of projects; track project.id) {
              <option [value]="project.id">{{ project.name }}</option>
            }
          </select>
        </div>

        <div class="filter-info">
          {{ backlogTasks.length }} {{ backlogTasks.length === 1 ? 'task' : 'tasks' }}
        </div>
      </div>

      <!-- Projects Grid -->
      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading backlogs...</p>
        </div>
      } @else if (projects.length === 0) {
        <div class="empty-state">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#b3bac5" stroke-width="1.5">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <h3>No projects yet</h3>
          <p>Create a project to start managing backlogs</p>
          <a routerLink="/projects" class="btn-primary">Go to Projects</a>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of filteredProjects; track project.id) {
            <div class="project-card">
              <div class="project-header">
             
                <h3>{{ project.name }}</h3>
              </div>
              <p class="project-description">{{ project.description || 'No description' }}</p>

              <div class="project-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ getProjectBacklogCount(project.id) }}</span>
                  <span class="stat-label">Backlog Items</span>
                </div>
              </div>

              <a [routerLink]="['/projects', project.id, 'backlog']" class="btn-view-backlog">
                View Backlog →
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .backlog-list-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
    }

    .page-header {
      margin-bottom: 32px;
    }

    .header-content h1 {
      font-size: 28px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
    }

    .subtitle {
      color: #5e6c84;
      margin: 0;
      font-size: 14px;
    }

    .filters-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border-radius: 8px;
      margin-bottom: 24px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .filter-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .filter-group label {
      font-size: 14px;
      font-weight: 600;
      color: #5e6c84;
    }

    .filter-select {
      padding: 8px 12px;
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      transition: border-color 0.2s;
      min-width: 200px;
    }

    .filter-select:hover {
      border-color: #b3bac5;
    }

    .filter-select:focus {
      outline: none;
      border-color: #0052cc;
    }

    .filter-info {
      margin-left: auto;
      font-size: 14px;
      color: #5e6c84;
      font-weight: 600;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 20px;
    }

    .project-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      border: 2px solid transparent;
      transition: all 0.2s;
    }

    .project-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #0052cc;
      transform: translateY(-2px);
    }

    .project-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }

    .project-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 16px;
    }

    .project-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #172b4d;
      margin: 0;
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

    .project-stats {
      display: flex;
      gap: 20px;
      padding: 16px 0;
      border-top: 1px solid #f4f5f7;
      border-bottom: 1px solid #f4f5f7;
      margin-bottom: 16px;
    }

    .stat-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: #172b4d;
    }

    .stat-label {
      font-size: 12px;
      color: #5e6c84;
    }

    .btn-view-backlog {
      display: inline-block;
      padding: 10px 16px;
      background: #0052cc;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: background 0.2s;
      text-align: center;
    }

    .btn-view-backlog:hover {
      background: #0747a6;
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
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #0747a6;
    }
  `]
})
export class BacklogListComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  backlogTasks: Task[] = [];
  loading = false;
  selectedProjectId: string = '';
  projectBacklogCounts: Map<string, number> = new Map();

  constructor(
    private projectService: ProjectService,
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;

    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.filterProjects(); // Use filterProjects to set initial state
        this.loadBacklogTasks();
      },
      error: () => {
        this.toastService.error('Failed to load projects');
        this.loading = false;
      }
    });
  }

  loadBacklogTasks(): void {
    // Filter projects first based on selected project
    this.filterProjects();

    const filter: any = {};
    if (this.selectedProjectId) {
      filter.projectId = this.selectedProjectId;
    }

    this.taskService.getTasks(filter).subscribe({
      next: (tasks) => {
        // Filter only tasks without sprint (backlog tasks)
        this.backlogTasks = tasks.filter(task => !task.sprintId);

        // Calculate backlog counts per project
        this.projectBacklogCounts.clear();
        this.backlogTasks.forEach(task => {
          const count = this.projectBacklogCounts.get(task.projectId) || 0;
          this.projectBacklogCounts.set(task.projectId, count + 1);
        });

        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load backlog tasks');
        this.loading = false;
      }
    });
  }

  filterProjects(): void {
    if (this.selectedProjectId && this.selectedProjectId.trim() !== '') {
      // Filter to show only the selected project
      this.filteredProjects = this.projects.filter(p => 
        p.id === this.selectedProjectId || p.id?.toString() === this.selectedProjectId
      );
    } else {
      // Show all projects
      this.filteredProjects = [...this.projects];
    }
  }

  getProjectBacklogCount(projectId: string): number {
    return this.projectBacklogCounts.get(projectId) || 0;
  }

  onProjectFilterChange(): void {
    this.filterProjects();
    this.loadBacklogTasks();
  }
}
