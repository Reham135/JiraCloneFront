import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { TaskService } from '../../../../core/services/task.service';
import { ProjectService } from '../../../../core/services/project.service';
import { SprintService } from '../../../../core/services/sprint.service';
import { UserService } from '../../../../core/services/user.service';
import { CommentService } from '../../../../core/services/comment.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { Task, TaskStatus, TaskPriority, TaskType, Project, Sprint, User, Comment, Attachment, CreateTaskRequest } from '../../../../shared/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-kanban-board',
  standalone: true,
  imports: [CommonModule, DragDropModule, FormsModule],
  template: `
    <div class="board-page">
      <!-- Board Header -->
      <div class="board-header">
        <div class="board-title">
          @if (project) {
            <div class="project-icon" [style.background]="project.color || '#0052cc'">
              {{ project.key }}
            </div>
            <div>
              <h1>{{ project.name }}</h1>
              <p>Kanban Board</p>
            </div>
          }
        </div>

        <div class="board-actions">
          <select class="filter-select" [(ngModel)]="selectedSprintId" (change)="loadTasks()">
            <option value="">All Sprints</option>
            @for (sprint of sprints; track sprint.id) {
              <option [value]="sprint.id">{{ sprint.name }}</option>
            }
          </select>

          <select class="filter-select" [(ngModel)]="selectedAssigneeId" (change)="loadTasks()">
            <option value="">All Assignees</option>
            @for (user of users; track user.id) {
              <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
            }
          </select>

          <select class="filter-select" [(ngModel)]="selectedType" (change)="applyFilters()">
            <option value="">All Types</option>
            <option value="Task">Task</option>
            <option value="Bug">Bug</option>
            <option value="Story">Story</option>
          </select>

          <select class="filter-select" [(ngModel)]="selectedPriority" (change)="applyFilters()">
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>

          <button class="btn-primary" (click)="showCreateTaskModal = true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Create Task
          </button>
        </div>
      </div>

      <!-- Kanban Board -->
      <div class="kanban-board" cdkDropListGroup>
        @for (column of columns; track column.status) {
          <div class="board-column">
            <div class="column-header">
              <h3>{{ column.label }}</h3>
              <span class="task-count">{{ column.tasks.length }}</span>
            </div>

            <div
              class="column-content"
              cdkDropList
              [cdkDropListData]="column.tasks"
              (cdkDropListDropped)="onTaskDrop($event)"
              [id]="getStatusString(column.status)"
            >
              @for (task of column.tasks; track task.id) {
                <div class="task-card" cdkDrag (click)="openTaskDetail(task)">
                  <div class="task-header">
                    <div class="task-meta">
                      <span class="type-badge type-{{ getTypeClass(task.type) }}">
                        {{ getTypeIcon(task.type) }}
                      </span>
                      <span class="task-key">{{ task.taskKey || task.id }}</span>
                    </div>
                    <span class="priority-badge priority-{{ getPriorityClass(task.priority) }}">
                      {{ getPriorityIcon(task.priority) }}
                    </span>
                  </div>

                  <h4 class="task-title">{{ task.title }}</h4>

                  @if (task.description) {
                    <p class="task-description">{{ task.description }}</p>
                  }

                  <div class="task-footer">
                    @if (task.assigneeAvatar || task.assigneeName) {
                      <div class="assignee">
                        @if (task.assigneeAvatar) {
                          <img [src]="task.assigneeAvatar" [alt]="task.assigneeName" />
                        } @else {
                          <div class="assignee-placeholder">
                            {{ getInitials(task.assigneeName || '') }}
                          </div>
                        }
                      </div>
                    }

                    @if (task.dueDate) {
                      <span class="due-date" [class.overdue]="isOverdue(task.dueDate)">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                          <line x1="16" y1="2" x2="16" y2="6"/>
                          <line x1="8" y1="2" x2="8" y2="6"/>
                          <line x1="3" y1="10" x2="21" y2="10"/>
                        </svg>
                        {{ formatDueDate(task.dueDate) }}
                      </span>
                    }
                  </div>
                </div>
              }

              @if (column.tasks.length === 0) {
                <div class="empty-column">
                  Drop tasks here
                </div>
              }
            </div>
          </div>
        }
      </div>

      <!-- Create Task Modal -->
      @if (showCreateTaskModal) {
        <div class="modal-overlay" (click)="closeCreateModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Create New Task</h2>
              <button class="close-btn" (click)="closeCreateModal()">×</button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  [(ngModel)]="taskForm.title"
                  placeholder="Enter task title"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Description</label>
                <textarea
                  [(ngModel)]="taskForm.description"
                  placeholder="Enter task description"
                  class="form-textarea"
                  rows="4"
                ></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Status *</label>
                  <select [(ngModel)]="taskForm.status" class="form-select">
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Priority *</label>
                  <select [(ngModel)]="taskForm.priority" class="form-select">
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Type *</label>
                <select [(ngModel)]="taskForm.type" class="form-select">
                  <option value="Task">Task</option>
                  <option value="Bug">Bug</option>
                  <option value="Story">Story</option>
                </select>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label>Assignee</label>
                  <select [(ngModel)]="taskForm.assigneeId" class="form-select">
                    <option value="">Unassigned</option>
                    @for (user of users; track user.id) {
                      <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label>Sprint</label>
                  <select [(ngModel)]="taskForm.sprintId" class="form-select">
                    <option value="">No Sprint</option>
                    @for (sprint of sprints; track sprint.id) {
                      <option [value]="sprint.id">{{ sprint.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  [(ngModel)]="taskForm.dueDate"
                  class="form-input"
                />
              </div>

              <div class="form-group">
                <label>Attachments (Images/Videos)</label>
                <input
                  type="file"
                  #createFileInput
                  (change)="onCreateTaskFilesSelected($event)"
                  accept="image/*,video/*"
                  multiple
                  class="form-input"
                />
                @if (createTaskFiles.length > 0) {
                  <div class="selected-files">
                    @for (file of createTaskFiles; track file.name) {
                      <div class="file-chip">
                        <span>{{ file.name }} ({{ formatFileSize(file.size) }})</span>
                        <button type="button" (click)="removeCreateTaskFile(file)" class="remove-file-btn">×</button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button class="btn-secondary" (click)="closeCreateModal()">Cancel</button>
              <button
                class="btn-primary"
                (click)="createTask()"
                [disabled]="!taskForm.title || isUploading"
              >
                @if (isUploading) {
                  <span>Creating...</span>
                } @else {
                  <span>Create Task</span>
                }
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Task Detail Modal -->
      @if (selectedTask) {
        <div class="modal-overlay" (click)="closeTaskDetail()">
          <div class="modal modal-large task-modal" (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="task-modal-header">
              <div class="task-modal-breadcrumb">
                <span class="type-badge type-{{ getTypeClass(selectedTask.type) }}">
                  {{ getTypeIcon(selectedTask.type) }} {{ getTypeName(selectedTask.type) }}
                </span>
                <span class="task-key">{{ selectedTask.taskKey || selectedTask.id }}</span>
              </div>
              <button class="close-btn" (click)="closeTaskDetail()">×</button>
            </div>

            <!-- Main Content Area -->
            <div class="task-modal-content">
              <!-- Left Column - Main Details -->
              <div class="task-main-column">
                <!-- Title -->
                <h2 class="task-modal-title">{{ selectedTask.title }}</h2>

                <!-- Description -->
                <div class="task-section">
                  <div class="section-header">
                    <label>Description</label>
                    @if (!editingDescription) {
                      <button class="btn-link" (click)="toggleDescriptionEdit()">Edit</button>
                    }
                  </div>
                  @if (!editingDescription) {
                    <p class="task-description-text">{{ selectedTask.description || 'Add a description...' }}</p>
                  } @else {
                    <div class="description-edit">
                      <textarea
                        [(ngModel)]="editedDescription"
                        class="form-textarea"
                        rows="6"
                        placeholder="Add a description..."
                      ></textarea>
                      <div class="edit-actions">
                        <button class="btn-primary btn-sm" (click)="saveDescription()">Save</button>
                        <button class="btn-secondary btn-sm" (click)="toggleDescriptionEdit()">Cancel</button>
                      </div>
                    </div>
                  }
                </div>

                <!-- Comments -->
                <div class="task-section">
                  <label class="section-label">Comments ({{ taskComments.length }})</label>

                  <div class="comment-input">
                    <div class="mention-container">
                      <textarea
                        [(ngModel)]="newCommentText"
                        (input)="onCommentInput($event)"
                        placeholder="Add a comment... Use @ to mention users"
                        class="form-textarea"
                        rows="3"
                      ></textarea>
                      @if (showMentionDropdown && filteredUsers.length > 0) {
                        <div class="mention-dropdown">
                          @for (user of filteredUsers; track user.id) {
                            <div class="mention-item" (click)="selectMention(user)">
                              <div class="mention-avatar">
                                {{ getInitials(user.firstName + ' ' + user.lastName) }}
                              </div>
                              <span>{{ user.firstName }} {{ user.lastName }}</span>
                            </div>
                          }
                        </div>
                      }
                    </div>
                    <button
                      class="btn-primary btn-sm"
                      (click)="addComment()"
                      [disabled]="!newCommentText.trim()"
                    >
                      Add Comment
                    </button>
                  </div>

                  <div class="comments-list">
                    @for (comment of taskComments; track comment.id) {
                      <div class="comment-item" [id]="'comment-' + comment.id">
                        <div class="comment-header">
                          <div class="comment-author">
                            <div class="author-avatar">
                              {{ getInitials(comment.userName || 'Unknown') }}
                            </div>
                            <div class="author-info">
                              <span class="author-name">{{ comment.userName || 'Unknown User' }}</span>
                              <span class="comment-date">{{ comment.createdAt | date:'MMM d, y h:mm a' }}</span>
                            </div>
                          </div>
                          <button class="btn-icon" (click)="deleteComment(comment.id)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                        <p class="comment-content" [innerHTML]="renderCommentWithMentions(comment.content)"></p>
                      </div>
                    }
                  </div>
                </div>

                <!-- Attachments -->
                <div class="task-section">
                  <label class="section-label">Attachments ({{ taskAttachments.length }})</label>

                  <div class="attachment-upload">
                    <input
                      type="file"
                      #fileInput
                      (change)="onFileSelected($event)"
                      accept="image/*,video/*"
                      style="display: none"
                    />
                    <button
                      class="btn-secondary btn-sm"
                      (click)="fileInput.click()"
                      [disabled]="isUploading"
                    >
                      @if (isUploading) {
                        <span>Uploading...</span>
                      } @else {
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                          <polyline points="17 8 12 3 7 8"/>
                          <line x1="12" y1="3" x2="12" y2="15"/>
                        </svg>
                        <span>Upload Image or Video</span>
                      }
                    </button>
                  </div>

                  <div class="attachments-list">
                    @for (attachment of taskAttachments; track attachment.id) {
                      <div class="attachment-item">
                        @if (isImage(attachment.fileType)) {
                          <div class="attachment-preview">
                            <img [src]="getAttachmentUrl(attachment.id)" [alt]="attachment.fileName" />
                          </div>
                        } @else if (isVideo(attachment.fileType)) {
                          <div class="attachment-preview">
                            <video [src]="getAttachmentUrl(attachment.id)" controls></video>
                          </div>
                        }
                        <div class="attachment-info">
                          <div class="attachment-details">
                            <span class="attachment-name">{{ attachment.fileName }}</span>
                            <span class="attachment-meta">
                              {{ formatFileSize(attachment.fileSize) }} • {{ attachment.uploadedByName }} • {{ attachment.uploadedAt | date:'MMM d, y h:mm a' }}
                            </span>
                          </div>
                          <button class="btn-icon" (click)="deleteAttachment(attachment.id)">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    }

                    @if (taskAttachments.length === 0) {
                      <p class="empty-attachments">No attachments yet. Upload an image or video to get started.</p>
                    }
                  </div>
                </div>
              </div>

              <!-- Right Column - Metadata -->
              <div class="task-sidebar">
                <div class="sidebar-section">
                  <label>Status</label>
                  <select
                    [(ngModel)]="selectedTask.status"
                    (change)="updateTaskField('status', selectedTask.status)"
                    class="form-select-sm"
                  >
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div class="sidebar-section">
                  <label>Priority</label>
                  <select
                    [(ngModel)]="selectedTask.priority"
                    (change)="updateTaskField('priority', selectedTask.priority)"
                    class="form-select-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div class="sidebar-section">
                  <label>Type</label>
                  <select
                    [(ngModel)]="selectedTask.type"
                    (change)="updateTaskField('type', selectedTask.type)"
                    class="form-select-sm"
                  >
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                    <option value="Story">Story</option>
                  </select>
                </div>

                <div class="sidebar-section">
                  <label>Assignee</label>
                  <select
                    [(ngModel)]="selectedTask.assigneeId"
                    (change)="updateTaskField('assigneeId', selectedTask.assigneeId || null)"
                    class="form-select-sm"
                  >
                    <option [value]="null">Unassigned</option>
                    @for (user of users; track user.id) {
                      <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
                    }
                  </select>
                </div>

                <div class="sidebar-section">
                  <label>Sprint</label>
                  <select
                    [(ngModel)]="selectedTask.sprintId"
                    (change)="updateTaskField('sprintId', selectedTask.sprintId || null)"
                    class="form-select-sm"
                  >
                    <option [value]="null">No Sprint</option>
                    @for (sprint of sprints; track sprint.id) {
                      <option [value]="sprint.id">{{ sprint.name }}</option>
                    }
                  </select>
                </div>

                <div class="sidebar-section">
                  <label>Reporter</label>
                  <div class="sidebar-value">{{ selectedTask.reporterName ||selectedTask.createdByName || 'Unknown' }}</div>
                </div>

                <div class="sidebar-section">
                  <label>Created</label>
                  <div class="sidebar-value">{{ formatDate(selectedTask.createdAt) }}</div>
                </div>

                @if (selectedTask.dueDate) {
                  <div class="sidebar-section">
                    <label>Due Date</label>
                    <div class="sidebar-value">{{ formatDate(selectedTask.dueDate) }}</div>
                  </div>
                }

                <div class="sidebar-actions">
                  <button class="btn-danger btn-block" (click)="deleteTask()">Delete Task</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .board-page {
      height: calc(100vh - 112px);
      display: flex;
      flex-direction: column;
    }

    .board-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }

    .board-title {
      display: flex;
      align-items: center;
      gap: 16px;
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

    .board-title h1 {
      font-size: 24px;
      font-weight: 600;
      color: #172b4d;
      margin: 0;
    }

    .board-title p {
      font-size: 14px;
      color: #5e6c84;
      margin: 4px 0 0 0;
    }

    .board-actions {
      display: flex;
      gap: 12px;
    }

    .filter-select {
      padding: 8px 12px;
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      color: #172b4d;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
    }

    .filter-select:focus {
      outline: none;
      border-color: #0052cc;
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
      white-space: nowrap;
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

    /* Kanban Board */
    .kanban-board {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      flex: 1;
      overflow-x: auto;
      padding-bottom: 16px;
    }

    .board-column {
      display: flex;
      flex-direction: column;
      min-width: 280px;
      background: #f4f5f7;
      border-radius: 8px;
      height: fit-content;
      max-height: calc(100vh - 250px);
    }

    .column-header {
      padding: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #dfe1e6;
    }

    .column-header h3 {
      font-size: 14px;
      font-weight: 600;
      color: #5e6c84;
      text-transform: uppercase;
      margin: 0;
    }

    .task-count {
      background: #dfe1e6;
      color: #5e6c84;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;
    }

    .column-content {
      padding: 12px;
      flex: 1;
      overflow-y: auto;
      min-height: 100px;
    }

    .task-card {
      background: white;
      border: 1px solid #dfe1e6;
      border-radius: 8px;
      padding: 14px;
      margin-bottom: 10px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.2s;
    }

    .task-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      border-color: #0052cc;
      transform: translateY(-2px);
    }

    .cdk-drag-preview {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      opacity: 0.9;
    }

    .cdk-drag-animating {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .column-content.cdk-drop-list-dragging .task-card:not(.cdk-drag-placeholder) {
      transition: transform 250ms cubic-bezier(0, 0, 0.2, 1);
    }

    .task-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .task-meta {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .type-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
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

    .task-key {
      font-size: 11px;
      color: #5e6c84;
      font-weight: 600;
    }

    .priority-badge {
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
    }

    .priority-low {
      background: #e3fcef;
      color: #00875a;
    }

    .priority-medium {
      background: #fff4e6;
      color: #ff991f;
    }

    .priority-high {
      background: #ffebe6;
      color: #de350b;
    }

    .priority-critical {
      background: #ffebe6;
      color: #bf2600;
    }

    .task-title {
      font-size: 15px;
      font-weight: 600;
      color: #172b4d;
      margin: 8px 0 12px 0;
      line-height: 1.5;
      word-wrap: break-word;
      cursor: pointer;
      transition: color 0.2s;
    }

    .task-card:hover .task-title {
      color: #0052cc;
    }

    .task-description {
      font-size: 12px;
      color: #5e6c84;
      margin: 0 0 12px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .task-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 8px;
      border-top: 1px solid #f4f5f7;
    }

    .assignee img,
    .assignee-placeholder {
      width: 24px;
      height: 24px;
      border-radius: 50%;
    }

    .assignee img {
      object-fit: cover;
    }

    .assignee-placeholder {
      background: #0052cc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
    }

    .due-date {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #5e6c84;
    }

    .due-date.overdue {
      color: #de350b;
    }

    .empty-column {
      text-align: center;
      padding: 32px 16px;
      color: #b3bac5;
      font-size: 14px;
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

    .modal-large {
      max-width: 800px;
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
    .form-textarea,
    .form-select {
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
    .form-textarea:focus,
    .form-select:focus {
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

    .task-detail h3 {
      font-size: 20px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 24px 0;
    }

    .detail-row {
      display: grid;
      grid-template-columns: 120px 1fr;
      gap: 16px;
      margin-bottom: 16px;
      align-items: start;
    }

    .detail-row label {
      font-size: 14px;
      font-weight: 600;
      color: #5e6c84;
    }

    .detail-row p {
      margin: 0;
      color: #172b4d;
    }

    /* Comprehensive Task Modal */
    .task-modal {
      max-width: 1000px !important;
    }

    .task-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 24px;
      border-bottom: 1px solid #f4f5f7;
    }

    .task-modal-breadcrumb {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .task-modal-content {
      display: grid;
      grid-template-columns: 1fr 280px;
      gap: 32px;
      padding: 24px;
      max-height: calc(90vh - 80px);
      overflow-y: auto;
    }

    .task-main-column {
      min-width: 0;
    }

    .task-modal-title {
      font-size: 24px;
      font-weight: 600;
      color: #172b4d;
      margin: 0 0 24px 0;
      line-height: 1.3;
    }

    .task-section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .section-header label {
      font-size: 14px;
      font-weight: 600;
      color: #5e6c84;
      margin: 0;
    }

    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: #5e6c84;
      display: block;
      margin-bottom: 12px;
    }

    .task-description-text {
      font-size: 14px;
      color: #172b4d;
      line-height: 1.6;
      margin: 0;
    }

    .description-edit {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
    }

    /* Comments */
    .comment-input {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      background: #f4f5f7;
      border-radius: 8px;
      padding: 16px;
    }

    .comment-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .comment-author {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-avatar {
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

    .author-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .author-name {
      font-size: 14px;
      font-weight: 600;
      color: #172b4d;
    }

    .comment-date {
      font-size: 12px;
      color: #5e6c84;
    }

    .comment-content {
      font-size: 14px;
      color: #172b4d;
      line-height: 1.5;
      margin: 0;
      white-space: pre-wrap;
    }

    /* Sidebar */
    .task-sidebar {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .sidebar-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .sidebar-section label {
      font-size: 12px;
      font-weight: 600;
      color: #5e6c84;
      text-transform: uppercase;
    }

    .sidebar-value {
      font-size: 14px;
      color: #172b4d;
    }

    .sidebar-actions {
      margin-top: 8px;
    }

    .form-select-sm {
      width: 100%;
      padding: 8px 12px;
      border: 2px solid #dfe1e6;
      border-radius: 6px;
      font-size: 14px;
      font-family: inherit;
      background: white;
      transition: all 0.2s;
    }

    .form-select-sm:focus {
      outline: none;
      border-color: #0052cc;
    }

    /* Button Variants */
    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .btn-link {
      background: none;
      border: none;
      color: #0052cc;
      font-size: 14px;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .btn-link:hover {
      background: #deebff;
    }

    .btn-icon {
      width: 28px;
      height: 28px;
      padding: 0;
      background: none;
      border: none;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #5e6c84;
      transition: all 0.2s;
    }

    .btn-icon:hover {
      background: #ffebe6;
      color: #de350b;
    }

    .btn-block {
      width: 100%;
    }

    /* Mention functionality */
    .mention-container {
      position: relative;
    }

    .mention-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #dfe1e6;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      max-height: 200px;
      overflow-y: auto;
      z-index: 1000;
      margin-bottom: 8px;
    }

    .mention-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .mention-item:hover {
      background: #f4f5f7;
    }

    .mention-avatar {
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

    .mention-item span {
      font-size: 14px;
      color: #172b4d;
    }

    .comment-content ::ng-deep .mention {
      background: #deebff;
      color: #0052cc;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: 600;
    }

    /* Attachments */
    .attachment-upload {
      margin-bottom: 20px;
    }

    .attachment-upload button {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .attachment-item {
      border: 1px solid #dfe1e6;
      border-radius: 8px;
      padding: 12px;
      background: white;
    }

    .attachment-preview {
      margin-bottom: 12px;
      border-radius: 6px;
      overflow: hidden;
    }

    .attachment-preview img,
    .attachment-preview video {
      width: 100%;
      max-height: 400px;
      object-fit: contain;
      display: block;
    }

    .attachment-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .attachment-details {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
    }

    .attachment-name {
      font-size: 14px;
      font-weight: 600;
      color: #172b4d;
    }

    .attachment-meta {
      font-size: 12px;
      color: #5e6c84;
    }

    .empty-attachments {
      text-align: center;
      padding: 32px 16px;
      color: #b3bac5;
      font-size: 14px;
      margin: 0;
    }

    /* File chips for create task modal */
    .selected-files {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 12px;
    }

    .file-chip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #deebff;
      border: 1px solid #0052cc;
      border-radius: 16px;
      font-size: 13px;
      color: #0052cc;
    }

    .file-chip span {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .remove-file-btn {
      background: none;
      border: none;
      color: #0052cc;
      font-size: 20px;
      font-weight: bold;
      cursor: pointer;
      padding: 0;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s;
    }

    .remove-file-btn:hover {
      background: #0052cc;
      color: white;
    }
  `]
})
export class KanbanBoardComponent implements OnInit {
  projectId: string = '';
  project: Project | null = null;
  sprints: Sprint[] = [];
  users: User[] = [];
  selectedSprintId: string = '';
  selectedAssigneeId: string = '';
  selectedType: string = '';
  selectedPriority: string = '';
  allTasks: Task[] = [];
  selectedTask: Task | null = null;
  showCreateTaskModal = false;
  taskComments: Comment[] = [];
  newCommentText: string = '';
  editingDescription = false;
  editedDescription: string = '';
  taskAttachments: Attachment[] = [];
  selectedFile: File | null = null;
  isUploading = false;
  createTaskFiles: File[] = [];

  // Mention functionality
  showMentionDropdown = false;
  filteredUsers: User[] = [];
  mentionStartIndex = -1;

  columns: { status: TaskStatus; label: string; tasks: Task[] }[] = [
    { status: TaskStatus.ToDo, label: 'To Do', tasks: [] },
    { status: TaskStatus.InProgress, label: 'In Progress', tasks: [] },
    { status: TaskStatus.Done, label: 'Done', tasks: [] }
  ];

  taskForm: any = {
    title: '',
    description: '',
    status: TaskStatus.ToDo,
    priority: TaskPriority.Medium,
    type: TaskType.Task,
    assigneeId: '',
    sprintId: '',
    dueDate: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private projectService: ProjectService,
    private sprintService: SprintService,
    private userService: UserService,
    private commentService: CommentService,
    private attachmentService: AttachmentService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id') || '';
    this.loadProject();
    this.loadSprints();
    this.loadUsers();
    this.loadTasks();

    // Check if we need to open a task from notification
    const openTaskId = sessionStorage.getItem('openTaskId');
    if (openTaskId) {
      // Wait a bit for tasks to load, then open the task
      setTimeout(() => {
        this.openTaskFromNotification(openTaskId);
      }, 1000);
    }
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

  loadUsers(): void {
    this.userService.getUsers().subscribe({
      next: (users) => {
        this.users = users;
      },
      error: () => {
        this.toastService.error('Failed to load users');
      }
    });
  }

  loadTasks(): void {
    const filter: any = { projectId: this.projectId };
    if (this.selectedSprintId) filter.sprintId = this.selectedSprintId;
    if (this.selectedAssigneeId) filter.assigneeId = this.selectedAssigneeId;

    this.taskService.getTasks(filter).subscribe({
      next: (tasks) => {
        this.allTasks = tasks;
        this.applyFilters();
      },
      error: () => {
        this.toastService.error('Failed to load tasks');
      }
    });
  }

  applyFilters(): void {
    // Start with all tasks
    let filteredTasks = [...this.allTasks];

    // Apply type filter
    if (this.selectedType) {
      filteredTasks = filteredTasks.filter(task => task.type === this.selectedType);
    }

    // Apply priority filter
    if (this.selectedPriority) {
      filteredTasks = filteredTasks.filter(task => task.priority === this.selectedPriority);
    }

    // Clear all columns
    this.columns.forEach(col => col.tasks = []);

    // Distribute filtered tasks to columns
    filteredTasks.forEach(task => {
      const column = this.columns.find(col => col.status === task.status);
      if (column) {
        column.tasks.push(task);
      }
    });
  }

  onTaskDrop(event: CdkDragDrop<Task[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const task = event.previousContainer.data[event.previousIndex];
      const newStatus = this.getStatusFromString(event.container.id);

      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );

      this.taskService.updateTaskStatus(task.id, newStatus).subscribe({
        next: () => {
          task.status = newStatus;
          this.toastService.success('Task status updated');
        },
        error: () => {
          this.toastService.error('Failed to update task status');
          transferArrayItem(
            event.container.data,
            event.previousContainer.data,
            event.currentIndex,
            event.previousIndex
          );
        }
      });
    }
  }

  createTask(): void {
    const taskData: CreateTaskRequest = {
      title: this.taskForm.title,
      description: this.taskForm.description || undefined,
      status: this.taskForm.status,
      priority: this.taskForm.priority,
      type: this.taskForm.type,
      projectId: this.projectId,
      sprintId: this.taskForm.sprintId || undefined,
      assigneeId: this.taskForm.assigneeId || undefined,
      dueDate: this.taskForm.dueDate || undefined
    };

    this.isUploading = true;

    this.taskService.createTask(taskData).subscribe({
      next: (task) => {
        // If there are files to upload, upload them
        if (this.createTaskFiles.length > 0) {
          this.uploadCreateTaskFiles(task.id);
        } else {
          this.toastService.success('Task created successfully');
          const column = this.columns.find(col => col.status === task.status);
          if (column) {
            column.tasks.push(task);
          }
          this.isUploading = false;
          this.closeCreateModal();
        }
      },
      error: () => {
        this.isUploading = false;
        this.toastService.error('Failed to create task');
      }
    });
  }

  uploadCreateTaskFiles(taskId: string): void {
    let uploadedCount = 0;
    const totalFiles = this.createTaskFiles.length;

    this.createTaskFiles.forEach(file => {
      this.attachmentService.uploadAttachment(taskId, file).subscribe({
        next: () => {
          uploadedCount++;
          if (uploadedCount === totalFiles) {
            this.toastService.success(`Task created with ${totalFiles} attachment(s)`);
            this.loadTasks();
            this.isUploading = false;
            this.closeCreateModal();
          }
        },
        error: (error) => {
          uploadedCount++;
          const errorMessage = error?.error?.message || 'Failed to upload some files';
          this.toastService.error(errorMessage);
          if (uploadedCount === totalFiles) {
            this.toastService.success('Task created but some attachments failed to upload');
            this.loadTasks();
            this.isUploading = false;
            this.closeCreateModal();
          }
        }
      });
    });
  }

  onCreateTaskFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const newFiles = Array.from(input.files);
      this.createTaskFiles = [...this.createTaskFiles, ...newFiles];
      input.value = ''; // Reset input to allow selecting the same file again
    }
  }

  removeCreateTaskFile(file: File): void {
    this.createTaskFiles = this.createTaskFiles.filter(f => f !== file);
  }

  openTaskDetail(task: Task): void {
    // Navigate to task detail page
    this.router.navigate(['/projects', task.projectId, 'tasks', task.id]);
  }

  closeTaskDetail(): void {
    this.selectedTask = null;
    this.taskComments = [];
    this.taskAttachments = [];
    this.newCommentText = '';
    this.editingDescription = false;
    this.selectedFile = null;
    this.isUploading = false;
  }

  openTaskFromNotification(taskId: string): void {
    // Find the task in all columns
    let task: Task | undefined;
    for (const column of this.columns) {
      task = column.tasks.find(t => t.id === taskId);
      if (task) break;
    }

    if (task) {
      // Open the task detail
      this.openTaskDetail(task);

      // Clear the session storage
      sessionStorage.removeItem('openTaskId');

      // Check if we need to scroll to a specific comment
      const scrollToCommentId = sessionStorage.getItem('scrollToCommentId');
      if (scrollToCommentId) {
        // Wait for comments to load and DOM to update
        setTimeout(() => {
          const commentElement = document.getElementById(`comment-${scrollToCommentId}`);
          if (commentElement) {
            commentElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the comment briefly
            commentElement.style.backgroundColor = '#deebff';
            setTimeout(() => {
              commentElement.style.backgroundColor = '';
            }, 2000);
          }
          sessionStorage.removeItem('scrollToCommentId');
        }, 500);
      }
    }
  }

  loadTaskComments(): void {
    if (!this.selectedTask) return;

    this.commentService.getComments(this.selectedTask.id).subscribe({
      next: (comments) => {
        this.taskComments = comments;
      },
      error: () => {
        this.toastService.error('Failed to load comments');
      }
    });
  }

  addComment(): void {
    if (!this.selectedTask || !this.newCommentText.trim()) return;

    this.commentService.createComment({
      content: this.newCommentText,
      taskId: this.selectedTask.id
    }).subscribe({
      next: (comment) => {
        this.taskComments.push(comment);
        this.newCommentText = '';
        this.toastService.success('Comment added');
      },
      error: () => {
        this.toastService.error('Failed to add comment');
      }
    });
  }

  deleteComment(commentId: string): void {
    if (!confirm('Delete this comment?')) return;

    this.commentService.deleteComment(commentId).subscribe({
      next: () => {
        this.taskComments = this.taskComments.filter(c => c.id !== commentId);
        this.toastService.success('Comment deleted');
      },
      error: () => {
        this.toastService.error('Failed to delete comment');
      }
    });
  }

  toggleDescriptionEdit(): void {
    this.editingDescription = !this.editingDescription;
    if (this.editingDescription && this.selectedTask) {
      this.editedDescription = this.selectedTask.description || '';
    }
  }

  saveDescription(): void {
    if (!this.selectedTask) return;

    this.taskService.updateTask(this.selectedTask.id, {
      description: this.editedDescription
    }).subscribe({
      next: (updatedTask) => {
        this.selectedTask!.description = updatedTask.description;
        this.editingDescription = false;
        this.toastService.success('Description updated');
      },
      error: () => {
        this.toastService.error('Failed to update description');
      }
    });
  }

  updateTaskField(field: string, value: any): void {
    if (!this.selectedTask) return;

    const updateData: any = { [field]: value };

    this.taskService.updateTask(this.selectedTask.id, updateData).subscribe({
      next: (updatedTask) => {
        Object.assign(this.selectedTask!, updatedTask);
        this.toastService.success('Task updated');
        this.loadTasks(); // Refresh the board
      },
      error: () => {
        this.toastService.error('Failed to update task');
      }
    });
  }

  updateTaskStatus(): void {
    if (!this.selectedTask) return;

    this.taskService.updateTask(this.selectedTask.id, {
      status: this.selectedTask.status
    }).subscribe({
      next: () => {
        this.toastService.success('Task updated');
        this.loadTasks();
      },
      error: () => {
        this.toastService.error('Failed to update task');
      }
    });
  }

  deleteTask(): void {
    if (!this.selectedTask) return;

    this.taskService.deleteTask(this.selectedTask.id).subscribe({
      next: () => {
        this.toastService.success('Task deleted');
        this.loadTasks();
        this.closeTaskDetail();
      },
      error: () => {
        this.toastService.error('Failed to delete task');
      }
    });
  }

  closeCreateModal(): void {
    this.showCreateTaskModal = false;
    this.createTaskFiles = [];
    this.isUploading = false;
    this.taskForm = {
      title: '',
      description: '',
      status: TaskStatus.ToDo,
      priority: TaskPriority.Medium,
      type: TaskType.Task,
      assigneeId: '',
      sprintId: '',
      dueDate: ''
    };
  }

  getPriorityIcon(priority: TaskPriority): string {
    const icons: { [key in TaskPriority]: string } = {
      [TaskPriority.Low]: '↘',
      [TaskPriority.Medium]: '→',
      [TaskPriority.High]: '↗',
      [TaskPriority.Critical]: '↑'
    };
    return icons[priority] || '→';
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  isOverdue(dueDate: Date): boolean {
    const now = new Date();
    const due = new Date(dueDate);
    return due < now;
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Cairo'
    });
  }

  formatDueDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Cairo'
    });
  }

  getStatusString(status: TaskStatus): string {
    return TaskStatus[status].toLowerCase();
  }

  getPriorityClass(priority: TaskPriority): string {
    return TaskPriority[priority].toLowerCase();
  }

  getStatusFromString(statusStr: string): TaskStatus {
    const statusMap: { [key: string]: TaskStatus } = {
      'todo': TaskStatus.ToDo,
      'inprogress': TaskStatus.InProgress,
      'done': TaskStatus.Done
    };
    return statusMap[statusStr.toLowerCase()] || TaskStatus.ToDo;
  }

  getTypeIcon(type: TaskType): string {
    const icons: { [key in TaskType]: string } = {
      [TaskType.Task]: '✓',
      [TaskType.Bug]: '🐛',
      [TaskType.Story]: '📖'
    };
    return icons[type] || '✓';
  }

  getTypeClass(type: TaskType): string {
    return TaskType[type].toLowerCase();
  }

  getTypeName(type: TaskType): string {
    return TaskType[type];
  }

  onCommentInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const text = textarea.value;
    const cursorPosition = textarea.selectionStart;

    // Find the last @ before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');

    if (lastAtIndex !== -1) {
      const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);

      // Check if there's a space after @, if so, close dropdown
      if (textAfterAt.includes(' ')) {
        this.showMentionDropdown = false;
        return;
      }

      // Show dropdown and filter users
      this.showMentionDropdown = true;
      this.mentionStartIndex = lastAtIndex;
      const searchTerm = textAfterAt.toLowerCase();

      this.filteredUsers = this.users.filter(user => {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        return fullName.includes(searchTerm);
      });
    } else {
      this.showMentionDropdown = false;
    }
  }

  selectMention(user: User): void {
    if (this.mentionStartIndex === -1) return;

    const beforeMention = this.newCommentText.substring(0, this.mentionStartIndex);
    const afterMention = this.newCommentText.substring(this.mentionStartIndex + 1);

    // Remove any text after @ up to the first space or end
    const afterAtParts = afterMention.split(' ');
    afterAtParts[0] = `${user.firstName} ${user.lastName}`;

    this.newCommentText = beforeMention + '@' + afterAtParts.join(' ');
    this.showMentionDropdown = false;
    this.mentionStartIndex = -1;
  }

  renderCommentWithMentions(content: string): string {
    // Replace @mentions with styled spans
    return content.replace(/@([\w\s]+?)(?=\s|$|[.,!?])/g, '<span class="mention">@$1</span>');
  }

  loadTaskAttachments(): void {
    if (!this.selectedTask) return;

    this.attachmentService.getTaskAttachments(this.selectedTask.id).subscribe({
      next: (attachments) => {
        this.taskAttachments = attachments;
      },
      error: () => {
        this.toastService.error('Failed to load attachments');
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.uploadAttachment();
    }
  }

  uploadAttachment(): void {
    if (!this.selectedTask || !this.selectedFile) return;

    this.isUploading = true;

    this.attachmentService.uploadAttachment(this.selectedTask.id, this.selectedFile).subscribe({
      next: (attachment) => {
        this.taskAttachments.push(attachment);
        this.selectedFile = null;
        this.isUploading = false;
        this.toastService.success('File uploaded successfully');
      },
      error: (error) => {
        this.isUploading = false;
        this.selectedFile = null;
        const errorMessage = error?.error?.message || 'Failed to upload file';
        this.toastService.error(errorMessage);
      }
    });
  }

  deleteAttachment(attachmentId: string): void {
    if (!confirm('Delete this attachment?')) return;

    this.attachmentService.deleteAttachment(attachmentId).subscribe({
      next: () => {
        this.taskAttachments = this.taskAttachments.filter(a => a.id !== attachmentId);
        this.toastService.success('Attachment deleted');
      },
      error: () => {
        this.toastService.error('Failed to delete attachment');
      }
    });
  }

  getAttachmentUrl(attachmentId: string): string {
    return this.attachmentService.getAttachmentUrl(attachmentId);
  }

  isImage(fileType: string): boolean {
    return fileType.startsWith('image/');
  }

  isVideo(fileType: string): boolean {
    return fileType.startsWith('video/');
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
