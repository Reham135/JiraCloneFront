import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProjectService } from '../../../../core/services/project.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Project } from '../../../../shared/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="projects-page">
      <div class="page-header">
        <div>
          <h1>Projects</h1>
          <p>Manage and organize your projects</p>
        </div>
        <button class="btn-primary" (click)="showCreateModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Project
        </button>
      </div>

      @if (loading) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Loading projects...</p>
        </div>
      } @else if (projects.length === 0) {
        <div class="empty-state">
          <div class="empty-state-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#b3bac5" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
          </div>
          <h3>No projects yet</h3>
          <p>Get started by creating your first project</p>
          <button class="btn-primary" (click)="showCreateModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Your First Project
          </button>
        </div>
      } @else {
        <div class="projects-grid">
          @for (project of projects; track project.id) {
            <div class="project-card">
              <div class="project-header">
              <h3 class="project-name">{{ project.name }}</h3>
                <div class="project-actions">
                  <button class="icon-btn" (click)="editProject(project)" title="Edit project">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                  </button>
                  <button class="icon-btn icon-btn-danger" (click)="deleteProjectConfirm(project)" title="Delete project">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="project-content">
                <p class="project-description">{{ project.description || 'No description provided' }}</p>

                <div class="project-footer">
                  <div class="project-meta">
                    <span class="project-date">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {{ project.createdAt | date:'MMM d, y' }}
                    </span>
                  </div>
                </div>

                <div class="project-buttons">
                  <a class="btn-secondary btn-board" [routerLink]="['/projects', project.id, 'board']">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="3" width="7" height="7"/>
                      <rect x="14" y="3" width="7" height="7"/>
                      <rect x="14" y="14" width="7" height="7"/>
                      <rect x="3" y="14" width="7" height="7"/>
                    </svg>
                    Board
                  </a>
                  <a class="btn-secondary btn-sprints" [routerLink]="['/projects', project.id, 'sprints']">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Sprints
                  </a>
                </div>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showCreateModal || showEditModal) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ showEditModal ? 'Edit Project' : 'Create New Project' }}</h2>
              <button class="close-btn" (click)="closeModals()">×</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Project Name *</label>
                <input
                  type="text"
                  [(ngModel)]="projectForm.name"
                  placeholder="Enter project name"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Project Key *</label>
                <input
                  type="text"
                  [(ngModel)]="projectForm.key"
                  placeholder="e.g., PROJ"
                  class="form-input"
                  [disabled]="showEditModal"
                  maxlength="10"
                  (input)="projectForm.key = projectForm.key.toUpperCase()"
                />
                <small>A short identifier (2-10 characters)</small>
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea
                  [(ngModel)]="projectForm.description"
                  placeholder="Describe your project"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModals()">Cancel</button>
              <button
                class="btn-primary"
                (click)="showEditModal ? updateProject() : createProject()"
                [disabled]="!projectForm.name || !projectForm.key"
              >
                {{ showEditModal ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal -->
      @if (showDeleteModal) {
        <div class="modal-overlay" (click)="showDeleteModal = false">
          <div class="modal modal-small" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Delete Project</h2>
              <button class="close-btn" (click)="showDeleteModal = false">×</button>
            </div>

            <div class="modal-body">
              <p>Are you sure you want to delete <strong>{{ selectedProject?.name }}</strong>?</p>
              <p class="warning-text">This action cannot be undone.</p>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="showDeleteModal = false">Cancel</button>
              <button class="btn-danger" (click)="deleteProject()">Delete</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .projects-page {
      max-width: 1400px;
      margin: 0 auto;
      padding: 24px;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid #f4f5f7;
    }

    .page-header h1 {
      font-size: 32px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }

    .page-header p {
      color: #5e6c84;
      margin: 0;
      font-size: 15px;
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
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0, 82, 204, 0.2);
    }

    .btn-primary:hover:not(:disabled) {
      background: #0747a6;
      box-shadow: 0 4px 8px rgba(0, 82, 204, 0.3);
      transform: translateY(-1px);
    }

    .btn-primary:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-primary:disabled {
      background: #b3d4ff;
      cursor: not-allowed;
      box-shadow: none;
    }

    .btn-secondary {
      padding: 10px 16px;
      background: white;
      color: #172b4d;
      border: 1px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .btn-secondary:hover {
      background: #f4f5f7;
      border-color: #0052cc;
      color: #0052cc;
    }

    .btn-danger {
      padding: 10px 20px;
      background: #de350b;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-danger:hover {
      background: #bf2600;
    }

    .projects-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 24px;
    }

    .project-card {
      background: white;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 1px solid #f4f5f7;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    .project-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
      transform: translateY(-4px);
      border-color: #dfe1e6;
    }

    .project-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 24px 16px;
      background: #196ae4ff;
      border-bottom: 1px solid #f4f5f7;
    }

    .project-icon-wrapper {
      display: flex;
      align-items: center;
    }

    .project-icon {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 700;
      font-size: 18px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      transition: transform 0.2s;
    }

    .project-card:hover .project-icon {
      transform: scale(1.05);
    }

    .project-actions {
      display: flex;
      gap: 4px;
    }

    .project-card:hover .project-actions {
      opacity: 1;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5e6c84;
      transition: all 0.2s;
    }

    .icon-btn:hover {
      background: white;
      color: #172b4d;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .icon-btn-danger:hover {
      background: #ffebe6;
      color: #de350b;
    }

    .project-content {
      padding: 20px 24px 24px;
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .project-name {
      font-size: 22px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 12px 0;
      line-height: 1.3;
    }

    .project-description {
      font-size: 14px;
      color: #5e6c84;
      margin: 0 0 20px 0;
      line-height: 1.6;
      min-height: 44px;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .project-footer {
      padding: 16px 0;
      border-top: 1px solid #f4f5f7;
      margin-bottom: 20px;
    }

    .project-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .project-key-badge {
      padding: 6px 10px;
      background: #deebff;
      color: #0052cc;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .project-date {
      font-size: 12px;
      color: #5e6c84;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .project-date svg {
      opacity: 0.6;
    }

    .project-buttons {
      display: flex;
      gap: 8px;
      margin-top: auto;
    }

    .project-buttons .btn-secondary {
      flex: 1;
      padding: 10px 14px;
    }

    /* Modal Styles */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 16px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
    }

    .modal-small {
      max-width: 450px;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px 28px;
      border-bottom: 1px solid #f4f5f7;
      background: linear-gradient(135deg, #fafbfc 0%, #ffffff 100%);
    }

    .modal-header h2 {
      font-size: 22px;
      font-weight: 600;
      color: #172b4d;
      margin: 0;
      letter-spacing: -0.3px;
    }

    .close-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: transparent;
      font-size: 24px;
      color: #5e6c84;
      cursor: pointer;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      line-height: 1;
    }

    .close-btn:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .modal-body {
      padding: 24px;
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: #172b4d;
      margin-bottom: 8px;
    }

    .form-group small {
      display: block;
      font-size: 12px;
      color: #5e6c84;
      margin-top: 4px;
    }

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 12px 14px;
      border: 2px solid #dfe1e6;
      border-radius: 8px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
      box-sizing: border-box;
      background: white;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #0052cc;
      box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
    }

    .form-input:disabled {
      background: #f4f5f7;
      cursor: not-allowed;
      opacity: 0.7;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .modal-body {
      overflow-y: auto;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 20px 28px;
      border-top: 1px solid #f4f5f7;
      background: #fafbfc;
    }

    .warning-text {
      color: #de350b;
      font-weight: 500;
      margin-top: 8px;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
      background: white;
      border-radius: 12px;
      border: 2px dashed #dfe1e6;
    }

    .empty-state-icon {
      margin-bottom: 24px;
      opacity: 0.5;
    }

    .empty-state h3 {
      font-size: 24px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
    }

    .empty-state p {
      font-size: 15px;
      color: #5e6c84;
      margin: 0 0 32px 0;
    }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 80px 20px;
      text-align: center;
      background: white;
      border-radius: 12px;
    }

    .loading-state p {
      color: #5e6c84;
      margin-top: 16px;
      font-size: 15px;
    }

    .spinner {
      width: 48px;
      height: 48px;
      border: 4px solid #f4f5f7;
      border-top: 4px solid #0052cc;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive Design */
    @media (max-width: 768px) {
      .projects-page {
        padding: 16px;
      }

      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 16px;
        padding-bottom: 20px;
      }

      .page-header h1 {
        font-size: 24px;
      }

      .projects-grid {
        grid-template-columns: 1fr;
        gap: 16px;
      }

      .project-card {
        border-radius: 8px;
      }

      .project-header {
        padding: 16px 20px 12px;
      }

      .project-content {
        padding: 16px 20px 20px;
      }

      .modal {
        width: 95%;
        max-height: 95vh;
        border-radius: 12px;
      }

      .modal-header,
      .modal-footer {
        padding: 20px;
      }

      .modal-body {
        padding: 20px;
      }
    }

    /* Custom Scrollbar for Modal */
    .modal-body::-webkit-scrollbar {
      width: 8px;
    }

    .modal-body::-webkit-scrollbar-track {
      background: transparent;
    }

    .modal-body::-webkit-scrollbar-thumb {
      background: #dfe1e6;
      border-radius: 4px;
    }

    .modal-body::-webkit-scrollbar-thumb:hover {
      background: #b3bac5;
    }
  `]
})
export class ProjectListComponent implements OnInit {
  projects: Project[] = [];
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  selectedProject: Project | null = null;

  projectForm = {
    name: '',
    key: '',
    description: ''
  };

  constructor(
    private projectService: ProjectService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading = true;
    this.projectService.getProjects().subscribe({
      next: (projects) => {
        this.projects = projects;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to load projects');
        this.loading = false;
      }
    });
  }

  createProject(): void {
    this.projectService.createProject(this.projectForm).subscribe({
      next: (project) => {
        this.toastService.success('Project created successfully');
        this.projects.unshift(project);
        this.closeModals();
      },
      error: () => {
        this.toastService.error('Failed to create project');
      }
    });
  }

  editProject(project: Project): void {
    this.selectedProject = project;
    this.projectForm = {
      name: project.name,
      key: project.key,
      description: project.description || ''
    };
    this.showEditModal = true;
  }

  updateProject(): void {
    if (!this.selectedProject) return;

    this.projectService.updateProject(this.selectedProject.id, {
      name: this.projectForm.name,
      description: this.projectForm.description
    }).subscribe({
      next: (updatedProject) => {
        this.toastService.success('Project updated successfully');
        const index = this.projects.findIndex(p => p.id === updatedProject.id);
        if (index !== -1) {
          this.projects[index] = updatedProject;
        }
        this.closeModals();
      },
      error: () => {
        this.toastService.error('Failed to update project');
      }
    });
  }

  deleteProjectConfirm(project: Project): void {
    this.selectedProject = project;
    this.showDeleteModal = true;
  }

  deleteProject(): void {
    if (!this.selectedProject) return;

    this.projectService.deleteProject(this.selectedProject.id).subscribe({
      next: () => {
        this.toastService.success('Project deleted successfully');
        this.projects = this.projects.filter(p => p.id !== this.selectedProject!.id);
        this.showDeleteModal = false;
        this.selectedProject = null;
      },
      error: () => {
        this.toastService.error('Failed to delete project');
      }
    });
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedProject = null;
    this.projectForm = {
      name: '',
      key: '',
      description: ''
    };
  }
}
