import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SprintService } from '../../../../core/services/sprint.service';
import { ProjectService } from '../../../../core/services/project.service';
import { TaskService } from '../../../../core/services/task.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Sprint, SprintStatus, Project, Task } from '../../../../shared/models';

@Component({
  selector: 'app-sprint-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="sprints-page">
      <div class="page-header">
        <div>
          <h1>Sprints</h1>
          @if (project) {
            <p>{{ project.name }}</p>
          }
        </div>
        <button class="btn-primary" (click)="showCreateModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Sprint
        </button>
      </div>

      <div class="sprints-list">
        @for (sprint of sprints; track sprint.id) {
          <div class="sprint-card" [class.active]="sprint.status === 'Active'" [class.expanded]="isSprintExpanded(sprint)">
            <div class="sprint-header" (click)="toggleSprintExpansion(sprint)">
              <div class="sprint-header-left">
                <button class="expand-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                       [style.transform]="isSprintExpanded(sprint) ? 'rotate(90deg)' : 'rotate(0deg)'">
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
                <div>
                  <h3>{{ sprint.name }}</h3>
                  <span class="status-badge status-{{ sprint.status.toLowerCase() }}">
                    {{ sprint.status }}
                  </span>
                </div>
              </div>
              <div class="sprint-actions" (click)="$event.stopPropagation()">
                @if (sprint.status === 'Planned') {
                  <button class="btn-success" (click)="startSprint(sprint)">Start Sprint</button>
                }
                @if (sprint.status === 'Active') {
                  <button class="btn-warning" (click)="completeSprint(sprint)">Complete Sprint</button>
                }
                <button class="icon-btn" (click)="editSprint(sprint)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="icon-btn" (click)="deleteSprint(sprint)">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="sprint-info">
              @if (sprint.goal) {
                <p class="sprint-goal">{{ sprint.goal }}</p>
              }

              <div class="sprint-meta">
                <div class="sprint-dates">
                  @if (sprint.startDate) {
                    <div class="date-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      <span>{{ formatDate(sprint.startDate) }}</span>
                    </div>
                  }
                  @if (sprint.endDate) {
                    <div class="date-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{{ formatDate(sprint.endDate) }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            @if (isSprintExpanded(sprint)) {
              <div class="sprint-tasks">
                @if (isLoadingTasks(sprint)) {
                  <div class="loading-tasks">
                    <div class="spinner"></div>
                    <span>Loading tasks...</span>
                  </div>
                } @else {
                  @if (getSprintTasks(sprint).length === 0) {
                    <div class="no-tasks">
                      <p>No tasks in this sprint</p>
                    </div>
                  } @else {
                    <div class="tasks-summary">
                      <div class="summary-item">
                        <span class="summary-label">To Do:</span>
                        <span class="summary-count">{{ getTaskCountByStatus(getSprintTasks(sprint), 'ToDo') }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="summary-label">In Progress:</span>
                        <span class="summary-count">{{ getTaskCountByStatus(getSprintTasks(sprint), 'InProgress') }}</span>
                      </div>
                      <div class="summary-item">
                        <span class="summary-label">Done:</span>
                        <span class="summary-count">{{ getTaskCountByStatus(getSprintTasks(sprint), 'Done') }}</span>
                      </div>
                    </div>
                    <div class="tasks-list">
                      @for (task of getSprintTasks(sprint); track task.id) {
                        <div class="task-row" (click)="openTask(task)">
                          <div class="task-type-icon">
                            @if (task.type === 'Task') {
                              <span class="type-badge type-task">✓</span>
                            } @else if (task.type === 'Bug') {
                              <span class="type-badge type-bug">🐛</span>
                            } @else {
                              <span class="type-badge type-story">📖</span>
                            }
                          </div>
                          <div class="task-info">
                            <div class="task-key">{{ task.taskKey || task.id }}</div>
                            <div class="task-title">{{ task.title }}</div>
                          </div>
                          <div class="task-meta">
                            <span class="task-status status-{{ task.status.toLowerCase() }}">
                              {{ task.status }}
                            </span>
                            <span class="task-priority priority-{{ task.priority.toLowerCase() }}">
                              @if (task.priority === 'Low') {
                                ↘
                              } @else if (task.priority === 'Medium') {
                                →
                              } @else if (task.priority === 'High') {
                                ↗
                              } @else {
                                ↑
                              }
                            </span>
                            @if (task.assigneeName) {
                              <div class="task-assignee">
                                <div class="assignee-avatar">
                                  {{ getInitials(task.assigneeName) }}
                                </div>
                              </div>
                            }
                          </div>
                        </div>
                      }
                    </div>
                  }
                }
              </div>
            }
          </div>
        }
      </div>

      <!-- Create/Edit Modal -->
      @if (showCreateModal || showEditModal) {
        <div class="modal-overlay" (click)="closeModals()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ showEditModal ? 'Edit Sprint' : 'Create Sprint' }}</h2>
              <button class="close-btn" (click)="closeModals()">×</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Sprint Name *</label>
                <input
                  type="text"
                  [(ngModel)]="sprintForm.name"
                  placeholder="e.g., Sprint 1"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Sprint Goal</label>
                <textarea
                  [(ngModel)]="sprintForm.goal"
                  placeholder="What do you want to achieve in this sprint?"
                  class="form-textarea"
                  rows="3"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    [(ngModel)]="sprintForm.startDate"
                    class="form-input"
                  />
                </div>

                <div class="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    [(ngModel)]="sprintForm.endDate"
                    class="form-input"
                  />
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeModals()">Cancel</button>
              <button
                class="btn-primary"
                (click)="showEditModal ? updateSprint() : createSprint()"
                [disabled]="!sprintForm.name"
              >
                {{ showEditModal ? 'Update' : 'Create' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .sprints-page {
      max-width: 1200px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 32px;
    }

    .page-header h1 {
      font-size: 28px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 4px 0;
    }

    .page-header p {
      color: #5e6c84;
      margin: 0;
    }

    .btn-primary {
      padding: 10px 20px;
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
    }

    .btn-primary:hover:not(:disabled) {
      background: #0747a6;
    }

    .btn-primary:disabled {
      background: #b3d4ff;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 10px 20px;
      background: white;
      color: #172b4d;
      border: 1px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f4f5f7;
    }

    .btn-success {
      padding: 8px 16px;
      background: #00875a;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-success:hover {
      background: #006644;
    }

    .btn-warning {
      padding: 8px 16px;
      background: #ff991f;
      color: white;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-warning:hover {
      background: #ff8b00;
    }

    .sprints-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .sprint-card {
      background: white;
      border-radius: 8px;
      padding: 24px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      border-left: 4px solid #dfe1e6;
      transition: all 0.2s;
    }

    .sprint-card.active {
      border-left-color: #0052cc;
      background: #f4f8ff;
    }

    .sprint-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 16px;
    }

    .sprint-header > div:first-child {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .sprint-header h3 {
      font-size: 20px;
      font-weight: 600;
      color: #172b4d;
      margin: 0;
    }

    .status-badge {
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-planned {
      background: #f4f5f7;
      color: #5e6c84;
    }

    .status-active {
      background: #deebff;
      color: #0052cc;
    }

    .status-completed {
      background: #e3fcef;
      color: #00875a;
    }

    .sprint-actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .icon-btn {
      width: 32px;
      height: 32px;
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

    .icon-btn:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .sprint-goal {
      font-size: 14px;
      color: #5e6c84;
      margin: 0 0 16px 0;
      line-height: 1.5;
    }

    .sprint-dates {
      display: flex;
      gap: 24px;
      padding-top: 16px;
      border-top: 1px solid #f4f5f7;
    }

    .date-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #5e6c84;
    }

    .date-item svg {
      color: #5e6c84;
    }

    /* Sprint Expansion */
    .sprint-header {
      cursor: pointer;
      user-select: none;
    }

    .sprint-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .expand-btn {
      width: 24px;
      height: 24px;
      border: none;
      background: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #5e6c84;
      transition: all 0.2s;
      cursor: pointer;
    }

    .expand-btn svg {
      transition: transform 0.2s;
    }

    .sprint-info {
      margin-bottom: 0;
    }

    .sprint-meta {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    /* Task List Styles */
    .sprint-tasks {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 2px solid #f4f5f7;
    }

    .loading-tasks {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      padding: 32px;
      color: #5e6c84;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #f4f5f7;
      border-top-color: #0052cc;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .no-tasks {
      text-align: center;
      padding: 32px;
      color: #b3bac5;
    }

    .tasks-summary {
      display: flex;
      gap: 24px;
      margin-bottom: 16px;
      padding: 12px 16px;
      background: #f4f5f7;
      border-radius: 6px;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .summary-label {
      font-size: 13px;
      color: #5e6c84;
      font-weight: 600;
    }

    .summary-count {
      font-size: 14px;
      font-weight: 700;
      color: #172b4d;
      background: white;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .tasks-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .task-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background: white;
      border: 1px solid #dfe1e6;
      border-radius: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .task-row:hover {
      background: #f4f5f7;
      border-color: #0052cc;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .task-type-icon {
      flex-shrink: 0;
    }

    .type-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
      border-radius: 4px;
      font-size: 12px;
    }

    .type-task {
      background: #deebff;
      color: #0052cc;
    }

    .type-bug {
      background: #ffebe6;
      color: #bf2600;
    }

    .type-story {
      background: #e3fcef;
      color: #00875a;
    }

    .task-info {
      flex: 1;
      min-width: 0;
    }

    .task-key {
      font-size: 12px;
      font-weight: 600;
      color: #5e6c84;
      margin-bottom: 4px;
    }

    .task-title {
      font-size: 14px;
      color: #172b4d;
      font-weight: 500;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .task-status {
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-todo {
      background: #f4f5f7;
      color: #5e6c84;
    }

    .status-inprogress {
      background: #deebff;
      color: #0052cc;
    }

    .status-done {
      background: #e3fcef;
      color: #00875a;
    }

    .task-priority {
      font-size: 16px;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 24px;
      height: 24px;
    }

    .priority-low {
      color: #00875a;
    }

    .priority-medium {
      color: #ff991f;
    }

    .priority-high {
      color: #de350b;
    }

    .priority-critical {
      color: #bf2600;
    }

    .task-assignee {
      flex-shrink: 0;
    }

    .assignee-avatar {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #0052cc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 11px;
      font-weight: 600;
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
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow: auto;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid #f4f5f7;
    }

    .modal-header h2 {
      font-size: 20px;
      font-weight: 600;
      color: #172b4d;
      margin: 0;
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: none;
      font-size: 24px;
      color: #5e6c84;
      cursor: pointer;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
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

    .form-input,
    .form-textarea {
      width: 100%;
      padding: 10px 12px;
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: all 0.2s;
      box-sizing: border-box;
    }

    .form-input:focus,
    .form-textarea:focus {
      outline: none;
      border-color: #0052cc;
    }

    .form-textarea {
      resize: vertical;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding: 24px;
      border-top: 1px solid #f4f5f7;
    }
  `]
})
export class SprintListComponent implements OnInit {
  projectId: string = '';
  project: Project | null = null;
  sprints: Sprint[] = [];
  showCreateModal = false;
  showEditModal = false;
  selectedSprint: Sprint | null = null;
  sprintTasks: Map<string, Task[]> = new Map();
  expandedSprints: Set<string> = new Set();
  loadingTasks: Set<string> = new Set();

  sprintForm = {
    name: '',
    goal: '',
    startDate: '',
    endDate: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private sprintService: SprintService,
    private projectService: ProjectService,
    private taskService: TaskService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProject();
    this.loadSprints();
  }

  loadProject(): void {
    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
      },
      error: () => {
        this.toastService.error('Failed to load project');
      }
    });
  }

  loadSprints(): void {
    this.sprintService.getSprints(this.projectId).subscribe({
      next: (sprints) => {
        this.sprints = sprints;
      },
      error: () => {
        this.toastService.error('Failed to load sprints');
      }
    });
  }

  createSprint(): void {
    const sprintData: any = {
      ...this.sprintForm,
      projectId: this.projectId
    };

    this.sprintService.createSprint(sprintData).subscribe({
      next: (sprint) => {
        this.toastService.success('Sprint created successfully');
        this.sprints.unshift(sprint);
        this.closeModals();
      },
      error: () => {
        this.toastService.error('Failed to create sprint');
      }
    });
  }

  editSprint(sprint: Sprint): void {
    this.selectedSprint = sprint;
    this.sprintForm = {
      name: sprint.name,
      goal: sprint.goal || '',
      startDate: sprint.startDate ? new Date(sprint.startDate).toISOString().split('T')[0] : '',
      endDate: sprint.endDate ? new Date(sprint.endDate).toISOString().split('T')[0] : ''
    };
    this.showEditModal = true;
  }

  updateSprint(): void {
    if (!this.selectedSprint) return;

    const updateData: any = {
      name: this.sprintForm.name,
      goal: this.sprintForm.goal || undefined,
      startDate: this.sprintForm.startDate ? new Date(this.sprintForm.startDate) : undefined,
      endDate: this.sprintForm.endDate ? new Date(this.sprintForm.endDate) : undefined
    };

    this.sprintService.updateSprint(this.selectedSprint.id, updateData).subscribe({
      next: (updatedSprint) => {
        this.toastService.success('Sprint updated successfully');
        const index = this.sprints.findIndex(s => s.id === updatedSprint.id);
        if (index !== -1) {
          this.sprints[index] = updatedSprint;
        }
        this.closeModals();
      },
      error: () => {
        this.toastService.error('Failed to update sprint');
      }
    });
  }

  startSprint(sprint: Sprint): void {
    this.sprintService.startSprint(sprint.id).subscribe({
      next: (updatedSprint) => {
        this.toastService.success('Sprint started');
        const index = this.sprints.findIndex(s => s.id === updatedSprint.id);
        if (index !== -1) {
          this.sprints[index] = updatedSprint;
        }
      },
      error: () => {
        this.toastService.error('Failed to start sprint');
      }
    });
  }

  completeSprint(sprint: Sprint): void {
    this.sprintService.completeSprint(sprint.id).subscribe({
      next: (updatedSprint) => {
        this.toastService.success('Sprint completed');
        const index = this.sprints.findIndex(s => s.id === updatedSprint.id);
        if (index !== -1) {
          this.sprints[index] = updatedSprint;
        }
      },
      error: () => {
        this.toastService.error('Failed to complete sprint');
      }
    });
  }

  deleteSprint(sprint: Sprint): void {
    if (!confirm(`Are you sure you want to delete ${sprint.name}?`)) {
      return;
    }

    this.sprintService.deleteSprint(sprint.id).subscribe({
      next: () => {
        this.toastService.success('Sprint deleted successfully');
        this.sprints = this.sprints.filter(s => s.id !== sprint.id);
      },
      error: () => {
        this.toastService.error('Failed to delete sprint');
      }
    });
  }

  toggleSprintExpansion(sprint: Sprint): void {
    const sprintId = sprint.id.toString();

    if (this.expandedSprints.has(sprintId)) {
      this.expandedSprints.delete(sprintId);
    } else {
      this.expandedSprints.add(sprintId);

      // Load tasks if not already loaded
      if (!this.sprintTasks.has(sprintId)) {
        this.loadSprintTasks(sprint);
      }
    }
  }

  loadSprintTasks(sprint: Sprint): void {
    const sprintId = sprint.id.toString();
    this.loadingTasks.add(sprintId);

    this.taskService.getTasks({ sprintId: sprint.id }).subscribe({
      next: (tasks) => {
        this.sprintTasks.set(sprintId, tasks);
        this.loadingTasks.delete(sprintId);
      },
      error: () => {
        this.toastService.error('Failed to load sprint tasks');
        this.loadingTasks.delete(sprintId);
      }
    });
  }

  isSprintExpanded(sprint: Sprint): boolean {
    return this.expandedSprints.has(sprint.id.toString());
  }

  getSprintTasks(sprint: Sprint): Task[] {
    return this.sprintTasks.get(sprint.id.toString()) || [];
  }

  isLoadingTasks(sprint: Sprint): boolean {
    return this.loadingTasks.has(sprint.id.toString());
  }

  getTaskCountByStatus(tasks: Task[], status: string): number {
    return tasks.filter(t => t.status === status).length;
  }

  openTask(task: Task): void {
    // Navigate to task detail page
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id]);
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.selectedSprint = null;
    this.sprintForm = {
      name: '',
      goal: '',
      startDate: '',
      endDate: ''
    };
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Cairo'
    });
  }
}
