import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../../core/services/task.service';
import { ProjectService } from '../../../core/services/project.service';
import { UserService } from '../../../core/services/user.service';
import { SprintService } from '../../../core/services/sprint.service';
import { ToastService } from '../../../shared/services/toast.service';
import { Task, TaskStatus, TaskPriority, TaskType, User, Project, Sprint, SprintStatus } from '../../../shared/models';

@Component({
  selector: 'app-backlog',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="backlog-container">
      <div class="backlog-header">
        <div class="header-title">
          <h1>Backlog</h1>
          <p class="subtitle">Manage tasks that are not assigned to any sprint</p>
        </div>
        <button class="btn-create" (click)="showCreateTaskDialog()">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Create Task
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Type:</label>
          <select class="filter-select" [(ngModel)]="selectedType" (change)="applyFilters()">
            <option value="">All Types</option>
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
            <option value="Story">Story</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Priority:</label>
          <select class="filter-select" [(ngModel)]="selectedPriority" (change)="applyFilters()">
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>

        <div class="filter-group">
          <label>Assignee:</label>
          <select class="filter-select" [(ngModel)]="selectedAssigneeId" (change)="applyFilters()">
            <option value="">All Assignees</option>
            <option value="unassigned">Unassigned</option>
            @for (user of users; track user.id) {
              <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
            }
          </select>
        </div>

        <div class="filter-info">
          {{ filteredTasks.length }} {{ filteredTasks.length === 1 ? 'task' : 'tasks' }}
        </div>
      </div>

      <!-- Main Content Area: Tasks + Sprints Sidebar -->
      <div class="content-wrapper">
        <!-- Task List -->
        <div class="tasks-section">
          @if (loading) {
            <div class="loading-state">
              <div class="spinner"></div>
              <p>Loading backlog...</p>
            </div>
          } @else if (filteredTasks.length === 0) {
            <div class="empty-state">
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#b3bac5" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 3v18"/>
              </svg>
              <h3>No backlog tasks</h3>
              <p>Create a new task or all tasks are assigned to sprints</p>
              <button class="btn-primary" (click)="showCreateTaskDialog()">Create Task</button>
            </div>
          } @else {
            <div class="tasks-list">
              @for (task of filteredTasks; track task.id) {
                <div
                  class="task-card"
                  [class.dragging]="draggedTaskId === task.id"
                  draggable="true"
                  (dragstart)="onDragStart($event, task)"
                  (dragend)="onDragEnd($event)"
                  (click)="openTaskDetails(task)">
                  <div class="drag-handle" title="Drag to assign to sprint">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="8" y1="6" x2="16" y2="6"/>
                      <line x1="8" y1="12" x2="16" y2="12"/>
                      <line x1="8" y1="18" x2="16" y2="18"/>
                    </svg>
                  </div>
                  <div class="task-header">
                    <div class="task-type-badge" [class]="'type-' + task.type.toLowerCase()">
                      @if (task.type === 'Bug') {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="12" r="10"/>
                        </svg>
                      } @else if (task.type === 'Story') {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      } @else {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <polyline points="9 11 12 14 22 4"/>
                          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
                        </svg>
                      }
                      {{ task.type }}
                    </div>
                    <span class="task-key">{{ task.taskKey }}</span>
                  </div>

                  <h3 class="task-title">{{ task.title }}</h3>

                  @if (task.description) {
                    <p class="task-description">{{ task.description }}</p>
                  }

                  <div class="task-footer">
                    <div class="task-meta">
                      <span class="priority-badge" [class]="'priority-' + task.priority.toLowerCase()">
                        {{ task.priority }}
                      </span>
                      <span class="status-badge" [class]="'status-' + task.status.toLowerCase().replace(' ', '-')">
                        {{ task.status }}
                      </span>
                    </div>

                    @if (task.assigneeName) {
                      <div class="assignee-avatar" [title]="task.assigneeName">
                        {{ getInitials(task.assigneeName) }}
                      </div>
                    } @else {
                      <div class="assignee-avatar unassigned" title="Unassigned">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                          <circle cx="12" cy="7" r="4"/>
                        </svg>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Sprints Sidebar -->
        <div class="sprints-sidebar">
          <div class="sidebar-header">
            <h3>Available Sprints</h3>
            <p class="sidebar-subtitle">Drag tasks here to assign them</p>
          </div>

          @if (loadingSprints) {
            <div class="sprints-loading">
              <div class="spinner-small"></div>
              <p>Loading sprints...</p>
            </div>
          } @else if (availableSprints.length === 0) {
            <div class="sprints-empty">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#b3bac5" stroke-width="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <p>No active or planned sprints</p>
            </div>
          } @else {
            <div class="sprints-list">
              @for (sprint of availableSprints; track sprint.id) {
                <div
                  class="sprint-card"
                  [class.drag-over]="dragOverSprintId === sprint.id"
                  [class.sprint-active]="sprint.status === 'Active'"
                  [class.sprint-planned]="sprint.status === 'Planned'"
                  (dragover)="onDragOver($event, sprint)"
                  (dragleave)="onDragLeave($event)"
                  (drop)="onDrop($event, sprint)">
                  <div class="sprint-header">
                    <div class="sprint-name">{{ sprint.name }}</div>
                    <span class="sprint-status-badge" [class]="'status-' + sprint.status.toLowerCase()">
                      {{ sprint.status }}
                    </span>
                  </div>
                  @if (sprint.goal) {
                    <p class="sprint-goal">{{ sprint.goal }}</p>
                  }
                  @if (sprint.startDate && sprint.endDate) {
                    <div class="sprint-dates">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      <span>{{ formatSprintDate(sprint.startDate) }} - {{ formatSprintDate(sprint.endDate) }}</span>
                    </div>
                  }
                  <div class="drop-hint">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <polyline points="19 12 12 19 5 12"/>
                    </svg>
                    Drop task here
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Task Details Dialog -->
      @if (showTaskDialog) {
        <div class="dialog-overlay" (click)="closeTaskDialog()">
          <div class="dialog-content" (click)="$event.stopPropagation()">
            <div class="dialog-header">
              <h2>{{ selectedTask ? 'Task Details' : 'Create Task' }}</h2>
              <button class="close-btn" (click)="closeTaskDialog()">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div class="dialog-body">
              @if (selectedTask) {
                <!-- View Mode -->
                <div class="task-details">
                  <div class="detail-row">
                    <span class="label">Key:</span>
                    <span class="value">{{ selectedTask.taskKey }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Type:</span>
                    <div class="task-type-badge" [class]="'type-' + selectedTask.type.toLowerCase()">
                      {{ selectedTask.type }}
                    </div>
                  </div>
                  <div class="detail-row">
                    <span class="label">Title:</span>
                    <span class="value">{{ selectedTask.title }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Description:</span>
                    <span class="value">{{ selectedTask.description || 'No description' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Status:</span>
                    <span class="status-badge" [class]="'status-' + selectedTask.status.toLowerCase().replace(' ', '-')">
                      {{ selectedTask.status }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Priority:</span>
                    <span class="priority-badge" [class]="'priority-' + selectedTask.priority.toLowerCase()">
                      {{ selectedTask.priority }}
                    </span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Assignee:</span>
                    <span class="value">{{ selectedTask.assigneeName || 'Unassigned' }}</span>
                  </div>
                  <div class="detail-row">
                    <span class="label">Created:</span>
                    <span class="value">{{ formatDate(selectedTask.createdAt) }}</span>
                  </div>
                </div>
              } @else {
                <!-- Create Mode -->
                <form class="task-form" (ngSubmit)="createTask()">
                  <div class="form-group">
                    <label>Title *</label>
                    <input type="text" [(ngModel)]="newTask.title" name="title" required class="form-input">
                  </div>

                  <div class="form-group">
                    <label>Description</label>
                    <textarea [(ngModel)]="newTask.description" name="description" rows="4" class="form-input"></textarea>
                  </div>

                  <div class="form-row">
                    <div class="form-group">
                      <label>Type *</label>
                      <select [(ngModel)]="newTask.type" name="type" required class="form-input">
                        <option value="Task">Task</option>
                        <option value="Bug">Bug</option>
                        <option value="Story">Story</option>
                      </select>
                    </div>

                    <div class="form-group">
                      <label>Priority *</label>
                      <select [(ngModel)]="newTask.priority" name="priority" required class="form-input">
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div class="form-group">
                    <label>Assignee</label>
                    <select [(ngModel)]="newTask.assigneeId" name="assigneeId" class="form-input">
                      <option value="">Unassigned</option>
                      @for (user of users; track user.id) {
                        <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
                      }
                    </select>
                  </div>

                  <div class="form-actions">
                    <button type="button" class="btn-secondary" (click)="closeTaskDialog()">Cancel</button>
                    <button type="submit" class="btn-primary" [disabled]="!newTask.title">Create Task</button>
                  </div>
                </form>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .backlog-container {
      padding: 24px;
      max-width: 1600px;
      margin: 0 auto;
    }

    .content-wrapper {
      display: grid;
      grid-template-columns: 1fr 400px;
      gap: 24px;
      align-items: start;
    }

    .tasks-section {
      min-height: 400px;
    }

    .backlog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .header-title h1 {
      font-size: 28px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 4px 0;
    }

    .subtitle {
      color: #5e6c84;
      margin: 0;
      font-size: 14px;
    }

    .btn-create {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: #0052cc;
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-create:hover {
      background: #0747a6;
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
      flex-wrap: wrap;
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
      min-width: 150px;
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

    .tasks-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 16px;
    }

    .task-card {
      background: white;
      border-radius: 8px;
      padding: 16px;
      padding-left: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      cursor: move;
      transition: all 0.2s;
      border: 2px solid transparent;
      position: relative;
      display: flex;
      flex-direction: column;
    }

    .task-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #0052cc;
      transform: translateY(-2px);
    }

    .task-card.dragging {
      opacity: 0.5;
      transform: scale(0.95);
      cursor: grabbing;
    }

    .drag-handle {
      position: absolute;
      left: 0;
      top: 50%;
      transform: translateY(-50%);
      width: 8px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #b3bac5;
      opacity: 0;
      transition: opacity 0.2s;
      cursor: grab;
    }

    .task-card:hover .drag-handle {
      opacity: 1;
    }

    .drag-handle:active {
      cursor: grabbing;
    }

    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .task-type-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .task-type-badge.type-task {
      background: #deebff;
      color: #0052cc;
    }

    .task-type-badge.type-bug {
      background: #ffebe6;
      color: #de350b;
    }

    .task-type-badge.type-story {
      background: #e3fcef;
      color: #00875a;
    }

    .task-key {
      font-size: 12px;
      font-weight: 600;
      color: #5e6c84;
    }

    .task-title {
      font-size: 16px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 8px 0;
    }

    .task-description {
      font-size: 14px;
      color: #5e6c84;
      margin: 0 0 16px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 12px;
      border-top: 1px solid #f4f5f7;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .priority-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .priority-badge.priority-low {
      background: #e3fcef;
      color: #00875a;
    }

    .priority-badge.priority-medium {
      background: #fff4e6;
      color: #ff991f;
    }

    .priority-badge.priority-high {
      background: #ffebe6;
      color: #de350b;
    }

    .priority-badge.priority-critical {
      background: #ffebe6;
      color: #bf2600;
    }

    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .status-badge.status-to-do {
      background: #dfe1e6;
      color: #5e6c84;
    }

    .status-badge.status-in-progress {
      background: #deebff;
      color: #0052cc;
    }

    .status-badge.status-done {
      background: #e3fcef;
      color: #00875a;
    }

    .assignee-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0052cc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .assignee-avatar.unassigned {
      background: #dfe1e6;
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
      transition: background 0.2s;
    }

    .btn-primary:hover {
      background: #0747a6;
    }

    .btn-primary:disabled {
      background: #b3bac5;
      cursor: not-allowed;
    }

    .btn-secondary {
      padding: 12px 24px;
      background: white;
      color: #5e6c84;
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-secondary:hover {
      background: #f4f5f7;
      border-color: #b3bac5;
    }

    .dialog-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(9, 30, 66, 0.54);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 20px;
    }

    .dialog-content {
      background: white;
      border-radius: 8px;
      width: 100%;
      max-width: 600px;
      max-height: 90vh;
      overflow: auto;
      box-shadow: 0 20px 32px rgba(0, 0, 0, 0.2);
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 24px;
      border-bottom: 1px solid #f4f5f7;
    }

    .dialog-header h2 {
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
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5e6c84;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .dialog-body {
      padding: 24px;
    }

    .task-details {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 16px;
      align-items: start;
    }

    .detail-row .label {
      font-weight: 600;
      color: #5e6c84;
      font-size: 14px;
    }

    .detail-row .value {
      color: #172b4d;
      font-size: 14px;
    }

    .task-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-group label {
      font-size: 14px;
      font-weight: 600;
      color: #5e6c84;
    }

    .form-input {
      padding: 10px 12px;
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .form-input:hover {
      border-color: #b3bac5;
    }

    .form-input:focus {
      outline: none;
      border-color: #0052cc;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      padding-top: 16px;
      border-top: 1px solid #f4f5f7;
    }

    /* Sprint Sidebar Styles */
    .sprints-sidebar {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      position: sticky;
      top: 24px;
      max-height: calc(100vh - 48px);
      overflow-y: auto;
    }

    .sidebar-header {
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f4f5f7;
    }

    .sidebar-header h3 {
      font-size: 18px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 4px 0;
    }

    .sidebar-subtitle {
      font-size: 13px;
      color: #5e6c84;
      margin: 0;
    }

    .sprints-loading,
    .sprints-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px 20px;
      text-align: center;
    }

    .spinner-small {
      width: 32px;
      height: 32px;
      border: 3px solid #f3f3f3;
      border-top: 3px solid #0052cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    .sprints-empty svg {
      margin-bottom: 16px;
    }

    .sprints-empty p {
      font-size: 14px;
      color: #5e6c84;
      margin: 0;
    }

    .sprints-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .sprint-card {
      background: #f4f5f7;
      border: 2px dashed #dfe1e6;
      border-radius: 8px;
      padding: 16px;
      transition: all 0.2s;
      cursor: default;
      position: relative;
    }

    .sprint-card:hover {
      border-color: #b3bac5;
      background: #ebecf0;
    }

    .sprint-card.drag-over {
      border-color: #0052cc;
      border-style: solid;
      background: #deebff;
      transform: scale(1.02);
    }

    .sprint-card.drag-over .drop-hint {
      opacity: 1;
      transform: translateY(0);
    }

    .sprint-card.sprint-active {
      border-color: #00875a;
      background: #e3fcef;
    }

    .sprint-card.sprint-planned {
      border-color: #ff991f;
      background: #fff4e6;
    }

    .sprint-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .sprint-name {
      font-size: 15px;
      font-weight: 600;
      color: #172b4d;
    }

    .sprint-status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .sprint-status-badge.status-active {
      background: #00875a;
      color: white;
    }

    .sprint-status-badge.status-planned {
      background: #ff991f;
      color: white;
    }

    .sprint-goal {
      font-size: 13px;
      color: #5e6c84;
      margin: 0 0 12px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .sprint-dates {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #5e6c84;
      margin-top: 8px;
    }

    .drop-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #dfe1e6;
      font-size: 13px;
      font-weight: 600;
      color: #0052cc;
      opacity: 0;
      transform: translateY(-10px);
      transition: all 0.2s;
    }

    @media (max-width: 1200px) {
      .content-wrapper {
        grid-template-columns: 1fr;
      }

      .sprints-sidebar {
        position: relative;
        top: 0;
        max-height: none;
      }
    }
  `]
})
export class BacklogComponent implements OnInit {
  projectId: string = '';
  project: Project | null = null;
  allTasks: Task[] = [];
  filteredTasks: Task[] = [];
  users: User[] = [];
  loading = false;

  // Sprint-related properties
  availableSprints: Sprint[] = [];
  loadingSprints = false;

  // Drag and drop state
  draggedTaskId: string | null = null;
  dragOverSprintId: string | null = null;

  // Filters
  selectedType: string = '';
  selectedPriority: string = '';
  selectedAssigneeId: string = '';

  // Dialog state
  showTaskDialog = false;
  selectedTask: Task | null = null;
  newTask: any = {
    title: '',
    description: '',
    type: 'Task',
    priority: 'Medium',
    assigneeId: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private userService: UserService,
    private sprintService: SprintService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.projectId = params['id'];
      this.loadData();
    });
  }

  loadData(): void {
    this.loading = true;
    this.loadingSprints = true;

    this.projectService.getProjectById(this.projectId).subscribe({
      next: (project) => {
        this.project = project;
      },
      error: () => {
        this.toastService.error('Failed to load project');
      }
    });

    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: () => {
        this.toastService.error('Failed to load users');
      }
    });

    // Load tasks without sprint (backlog tasks)
    console.log('Loading backlog tasks for projectId:', this.projectId);
    this.taskService.getTasks({ projectId: this.projectId }).subscribe({
      next: (tasks) => {
        console.log('Received tasks from API:', tasks);
        // Filter only tasks without sprint
        this.allTasks = tasks.filter(task => !task.sprintId);
        console.log('Filtered backlog tasks (no sprint):', this.allTasks);
        this.applyFilters();
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading backlog tasks:', error);
        this.toastService.error('Failed to load backlog tasks');
        this.loading = false;
      }
    });

    // Load sprints for the project (only Planned and Active)
    this.sprintService.getSprints(this.projectId).subscribe({
      next: (sprints) => {
        this.availableSprints = sprints.filter(
          sprint => sprint.status === SprintStatus.Planned || sprint.status === SprintStatus.Active
        );
        this.loadingSprints = false;
      },
      error: () => {
        this.toastService.error('Failed to load sprints');
        this.loadingSprints = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allTasks];

    if (this.selectedType) {
      filtered = filtered.filter(task => task.type === this.selectedType);
    }

    if (this.selectedPriority) {
      filtered = filtered.filter(task => task.priority === this.selectedPriority);
    }

    if (this.selectedAssigneeId) {
      if (this.selectedAssigneeId === 'unassigned') {
        filtered = filtered.filter(task => !task.assigneeId);
      } else {
        filtered = filtered.filter(task => task.assigneeId === this.selectedAssigneeId);
      }
    }

    this.filteredTasks = filtered;
  }

  showCreateTaskDialog(): void {
    this.selectedTask = null;
    this.newTask = {
      title: '',
      description: '',
      type: 'Task',
      priority: 'Medium',
      assigneeId: ''
    };
    this.showTaskDialog = true;
  }

  openTaskDetails(task: Task): void {
    // Navigate to task detail page
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id]);
  }

  closeTaskDialog(): void {
    this.showTaskDialog = false;
    this.selectedTask = null;
  }

  createTask(): void {
    if (!this.newTask.title) {
      return;
    }

    const taskData = {
      title: this.newTask.title,
      description: this.newTask.description,
      projectId: this.projectId,
      type: this.newTask.type,
      priority: this.newTask.priority,
      status: TaskStatus.ToDo,
      assigneeId: this.newTask.assigneeId || undefined
    };

    this.taskService.createTask(taskData).subscribe({
      next: (task) => {
        this.toastService.success('Task created successfully');
        this.allTasks.unshift(task);
        this.applyFilters();
        this.closeTaskDialog();
      },
      error: () => {
        this.toastService.error('Failed to create task');
      }
    });
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'Africa/Cairo'
    });
  }

  formatSprintDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Cairo'
    });
  }

  // Drag and Drop handlers
  onDragStart(event: DragEvent, task: Task): void {
    this.draggedTaskId = task.id;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id);
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedTaskId = null;
    this.dragOverSprintId = null;
  }

  onDragOver(event: DragEvent, sprint: Sprint): void {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    this.dragOverSprintId = sprint.id;
  }

  onDragLeave(event: DragEvent): void {
    this.dragOverSprintId = null;
  }

  onDrop(event: DragEvent, sprint: Sprint): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOverSprintId = null;

    const taskId = event.dataTransfer?.getData('text/plain');
    if (!taskId || !this.draggedTaskId) {
      return;
    }

    // Find the task being dropped - handle both string and number IDs
    const task = this.allTasks.find(t => t.id.toString() === taskId.toString());
    if (!task) {
      console.error('Task not found in allTasks. TaskId:', taskId, 'All tasks:', this.allTasks.map(t => t.id));
      return;
    }

    // Update the task with the sprint assignment
    this.taskService.updateTask(task.id, { sprintId: sprint.id }).subscribe({
      next: (updatedTask) => {
        // Remove the task from the backlog view
        this.allTasks = this.allTasks.filter(t => t.id.toString() !== taskId.toString());
        this.applyFilters();

        // Show success message
        this.toastService.success(`Task ${task.taskKey} assigned to ${sprint.name}`);

        // Reset drag state
        this.draggedTaskId = null;
      },
      error: (error) => {
        console.error('Failed to assign task to sprint:', error);
        this.toastService.error('Failed to assign task to sprint');
        this.draggedTaskId = null;
      }
    });
  }

}
