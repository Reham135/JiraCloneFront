import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { TaskService } from '../../../../core/services/task.service';
import { UserService } from '../../../../core/services/user.service';
import { SprintService } from '../../../../core/services/sprint.service';
import { AttachmentService } from '../../../../core/services/attachment.service';
import { CommentService } from '../../../../core/services/comment.service';
import { ToastService } from '../../../../shared/services/toast.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Task, User, Sprint, Attachment, Comment } from '../../../../shared/models';

@Component({
  selector: 'app-task-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="task-detail-container">
      @if (task) {
        <div class="task-detail">
          <div class="task-header">
            <div class="task-header-left">
              <span class="task-key">{{ task.taskKey }}</span>
              <h1 class="task-title">{{ task.title }}</h1>
            </div>
          </div>

          <div class="task-content-wrapper">
            <!-- Left Column: Main Content -->
            <div class="task-content-main">
              <div class="task-section">
                <div class="section-header">
                  <h3 class="section-title-main">
                    <span>Description</span>
                  </h3>
                  @if (!editingDescription) {
                    <button class="btn-link" (click)="toggleDescriptionEdit()">Edit</button>
                  }
                </div>
                @if (!editingDescription) {
                  <div class="description-content">
                    <p>{{ task.description || 'No description provided' }}</p>
                  </div>
                } @else {
                  <div class="description-edit">
                    <textarea
                      [(ngModel)]="editedDescription"
                      class="form-textarea"
                      rows="6"
                      placeholder="Add a description..."
                    ></textarea>
                    <div class="edit-actions">
                      <button class="btn btn-primary btn-sm" (click)="saveDescription()">Save</button>
                      <button class="btn btn-secondary btn-sm" (click)="toggleDescriptionEdit()">Cancel</button>
                    </div>
                  </div>
                }
              </div>

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
                    class="btn btn-secondary btn-sm"
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
                            {{ formatFileSize(attachment.fileSize) }} • {{ attachment.uploadedByName }} • {{ formatDate(attachment.uploadedAt) }}
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

              <div class="task-section">
                <label class="section-label">Comments ({{ taskComments.length }})</label>

                <div class="comment-input">
                  <div class="mention-container">
                    <div class="comment-avatar">
                      {{ getInitials((currentUser?.firstName || '') + ' ' + (currentUser?.lastName || '')) }}
                    </div>
                    <div class="comment-input-wrapper">
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
                  </div>
                  <button
                    class="btn btn-primary btn-sm"
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
                            {{ getInitials(comment.createdByName || comment.userName || 'Unknown') }}
                          </div>
                          <div class="author-info">
                            <span class="author-name">{{ comment.createdByName || comment.userName || 'Unknown User' }}</span>
                            <span class="comment-date">{{ formatDate(comment.createdAt) }}</span>
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
            </div>

            <!-- Right Column: Sidebar -->
            <div class="task-sidebar">
              <div class="sidebar-header">
                <div class="header-actions">
                  <button class="btn-icon-sm" title="Lock">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </button>
                  <button class="btn-icon-sm" title="Watchers (1)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                    <span class="badge-count">1</span>
                  </button>
                  <button class="btn-icon-sm" title="Share">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="18" cy="5" r="3"/>
                      <circle cx="6" cy="12" r="3"/>
                      <circle cx="18" cy="19" r="3"/>
                      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                    </svg>
                  </button>
                  <button class="btn-icon-sm" title="More actions">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <circle cx="12" cy="12" r="1"/>
                      <circle cx="12" cy="5" r="1"/>
                      <circle cx="12" cy="19" r="1"/>
                    </svg>
                  </button>
                  <button class="btn-icon-sm" title="Expand">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/>
                    </svg>
                  </button>
                </div>
                <button class="btn-icon" title="Close" (click)="goBack()">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              <div class="sidebar-section">
                <div class="status-actions">
                  <select
                    [(ngModel)]="task.status"
                    (change)="updateTaskField('status', task.status)"
                    class="status-select"
                    [class.status-todo]="task.status === 'ToDo'"
                    [class.status-inprogress]="task.status === 'InProgress'"
                    [class.status-done]="task.status === 'Done'"
                  >
                    <option value="ToDo">To Do</option>
                    <option value="InProgress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                
                </div>
              </div>

              <div class="sidebar-section">
                <div class="section-title" (click)="detailsExpanded = !detailsExpanded" [class.expanded]="detailsExpanded">
                  <span>Details</span>
                </div>
                
                @if (detailsExpanded) {
                
                <div class="meta-item">
                  <label>Due date</label>
                  @if (!editingDueDate) {
                    <div class="due-date-display">
                      @if (task.dueDate) {
                        <span [class.overdue]="isOverdue(task.dueDate)">
                          {{ formatDueDate(task.dueDate) }}
                        </span>
                      } @else {
                        <button class="btn-link-small" (click)="toggleDueDateEdit()">Add due date</button>
                      }
                    </div>
                  } @else {
                    <div class="due-date-edit">
                      <input
                        type="date"
                        [(ngModel)]="editedDueDate"
                        class="form-input-sm"
                      />
                      <div class="inline-actions">
                        <button class="btn-icon-sm" (click)="saveDueDate()" title="Save">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        </button>
                        <button class="btn-icon-sm" (click)="toggleDueDateEdit()" title="Cancel">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"/>
                            <line x1="6" y1="6" x2="18" y2="18"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  }
                </div>

                <div class="meta-item">
                  <label>Assignee</label>
                  <div class="assignee-wrapper">
                    @if (task.assigneeId) {
                      <div class="assignee-display">
                        <div class="user-avatar">
                          {{ getAssigneeInitials() }}
                        </div>
                        <select
                          [(ngModel)]="task.assigneeId"
                          (change)="updateTaskField('assigneeId', task.assigneeId || null)"
                          class="form-select-sm assignee-select-inline"
                        >
                          <option [value]="null">Unassigned</option>
                          @for (user of users; track user.id) {
                            <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
                          }
                        </select>
                      </div>
                    } @else {
                      <div class="assignee-unassigned-wrapper">
                        <select
                          [(ngModel)]="task.assigneeId"
                          (change)="updateTaskField('assigneeId', task.assigneeId || null)"
                          class="form-select-sm assignee-select"
                        >
                          <option [value]="null">Unassigned</option>
                          @for (user of users; track user.id) {
                            <option [value]="user.id">{{ user.firstName }} {{ user.lastName }}</option>
                          }
                        </select>
                        <button class="btn-link-small assign-to-me-btn" (click)="assignToMe()">Assign to me</button>
                      </div>
                    }
                  </div>
                </div>

               

                
                <div class="meta-item">
                  <label>Reporter</label>
                  <div class="reporter-display">
                    <div class="user-avatar">
                      {{ getInitials(task.createdByName || task.reporterName || 'Unknown') }}
                    </div>
                    <span>{{ task.createdByName || task.reporterName || 'Unknown' }}</span>
                  </div>
                </div>

                 <div class="meta-item">
                  <label>Priority</label>
                  <select
                    [(ngModel)]="task.priority"
                    (change)="updateTaskField('priority', task.priority)"
                    class="form-select-sm priority-select"
                    [class.priority-low]="task.priority === 'Low'"
                    [class.priority-medium]="task.priority === 'Medium'"
                    [class.priority-high]="task.priority === 'High'"
                    [class.priority-critical]="task.priority === 'Critical'"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div class="meta-item">
                  <label>Type</label>
                  <select
                    [(ngModel)]="task.type"
                    (change)="updateTaskField('type', task.type)"
                    class="form-select-sm"
                  >
                    <option value="Task">Task</option>
                    <option value="Bug">Bug</option>
                    <option value="Story">Story</option>
                  </select>
                </div>

              

                <div class="meta-item">
                  <label>Sprint</label>
                  <select
                    [(ngModel)]="task.sprintId"
                    (change)="updateTaskField('sprintId', task.sprintId || null)"
                    class="form-select-sm"
                  >
                    <option [value]="null">No Sprint</option>
                    @for (sprint of sprints; track sprint.id) {
                      <option [value]="sprint.id">{{ sprint.name }}</option>
                    }
                  </select>
                </div>
                  <div class="meta-item">
                  <label>Project</label>
                  <span>{{ task.projectName || task.projectKey || task.projectId }}</span>
                </div>
                }
              </div>

              <div class="sidebar-actions">
                <button class="btn btn-primary btn-sm" (click)="goToBoard()">View on Board</button>
                <button class="btn btn-danger btn-sm" (click)="deleteTask()">Delete Task</button>
              </div>
            </div>
          </div>
        </div>
      } @else if (loading) {
        <div class="loading">Loading task...</div>
      } @else if (error) {
        <div class="error">
          <p>{{ error }}</p>
          <button class="btn btn-secondary" (click)="goBack()">Go Back</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .task-detail-container {
      padding: 0;
      height: 100vh;
      overflow: hidden;
      background: #f4f5f7;
    }

    .task-detail {
      background: white;
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .task-header {
      padding: 16px 24px;
      border-bottom: 1px solid #dfe1e6;
      flex-shrink: 0;
    }

    .task-key {
      display: inline-block;
      padding: 4px 8px;
      background: #f4f5f7;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 600;
      color: #5e6c84;
      margin-bottom: 8px;
    }

    .task-title {
      margin: 8px 0 0 0;
      font-size: 24px;
      font-weight: 600;
      color: #172b4d;
    }

    .task-content-wrapper {
      display: flex;
      flex: 1;
      overflow: hidden;
    }

    .task-content-main {
      flex: 1;
      padding: 24px;
      overflow-y: auto;
      min-width: 0;
    }

    .task-sidebar {
      width: 340px;
      border-left: 1px solid #dfe1e6;
      background: white;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }

    .sidebar-header {
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #dfe1e6;
      gap: 8px;
    }

    .header-actions {
      display: flex;
      gap: 4px;
      align-items: center;
    }

    .btn-icon-sm {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      color: #5e6c84;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
      position: relative;
    }

    .btn-icon-sm:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .badge-count {
      position: absolute;
      top: -4px;
      right: -4px;
      background: #de350b;
      color: white;
      font-size: 10px;
      font-weight: 600;
      padding: 2px 5px;
      border-radius: 10px;
      min-width: 16px;
      text-align: center;
      line-height: 12px;
    }

    .sidebar-section {
      padding: 16px;
      border-bottom: 1px solid #dfe1e6;
    }

    .section-title {
      font-size: 12px;
      font-weight: 600;
      color: #5e6c84;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      cursor: pointer;
      user-select: none;
      transition: color 0.2s;
    }

    .section-title:hover {
      color: #172b4d;
    }

    .section-title::before {
      content: '▼';
      font-size: 10px;
      margin-right: 8px;
      color: #5e6c84;
      transition: transform 0.2s;
    }

    .section-title.expanded::before {
      transform: rotate(0deg);
    }

    .section-title:not(.expanded)::before {
      transform: rotate(-90deg);
    }

    .status-actions {
      margin-bottom: 16px;
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .status-select {
      flex: 1;
      padding: 8px 12px;
      border: 2px solid #dfe1e6;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      background: white;
      cursor: pointer;
      outline: none;
      transition: all 0.2s;
    }

    .status-select.status-todo {
      border-color: #dfe1e6;
      background: #f4f5f7;
      color: #42526e;
    }

    .status-select.status-inprogress {
      border-color: #0052cc;
      background: #deebff;
      color: #0052cc;
    }

    .status-select.status-done {
      border-color: #00875a;
      background: #e3fcef;
      color: #00875a;
    }

    .status-select:focus {
      border-color: #0052cc;
      box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
    }

    .quick-action-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #dfe1e6;
      background: white;
      color: #5e6c84;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }

    .quick-action-btn:hover {
      background: #f4f5f7;
      border-color: #0052cc;
      color: #0052cc;
    }

    .task-section {
      margin-bottom: 32px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .task-section h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #172b4d;
    }

    .section-title-main {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .description-content {
      background: #fafbfc;
      border-radius: 6px;
      padding: 12px;
      min-height: 40px;
    }

    .task-section p {
      margin: 0;
      color: #172b4d;
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .btn-link {
      background: none;
      border: none;
      color: #0052cc;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 4px 8px;
    }

    .btn-link:hover {
      text-decoration: underline;
    }

    .form-textarea {
      width: 100%;
      padding: 10px;
      border: 2px solid #dfe1e6;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      resize: vertical;
      outline: none;
    }

    .form-textarea:focus {
      border-color: #0052cc;
    }

    .description-edit {
      margin-top: 8px;
    }

    .edit-actions {
      display: flex;
      gap: 8px;
      margin-top: 8px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 13px;
    }

    .form-select-sm {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #dfe1e6;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      cursor: pointer;
      outline: none;
      margin-top: 8px;
    }

    .form-select-sm:focus {
      border-color: #0052cc;
      box-shadow: 0 0 0 3px rgba(0, 82, 204, 0.1);
    }

    .priority-select.priority-low {
      border-left: 3px solid #00875a;
    }

    .priority-select.priority-medium {
      border-left: 3px solid #ff991f;
    }

    .priority-select.priority-high {
      border-left: 3px solid #de350b;
    }

    .priority-select.priority-critical {
      border-left: 3px solid #bf2600;
      font-weight: 600;
    }

    .meta-item {
      margin-bottom: 16px;
    }

    .meta-item:last-child {
      margin-bottom: 0;
    }

    .meta-item label {
      font-size: 11px;
      font-weight: 600;
      color: #5e6c84;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      display: block;
      margin-bottom: 8px;
    }

    .meta-item span {
      font-size: 14px;
      color: #172b4d;
    }

    .assignee-wrapper {
      margin-top: 4px;
    }

    .assignee-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .assignee-select-inline {
      flex: 1;
      border: none;
      background: transparent;
      padding: 4px 8px;
      margin: 0;
      cursor: pointer;
      font-size: 14px;
      color: #172b4d;
      outline: none;
      appearance: none;
      -webkit-appearance: none;
      -moz-appearance: none;
    }

    .assignee-select-inline:hover {
      background: #f4f5f7;
      border-radius: 4px;
    }

    .assignee-select-inline:focus {
      background: #f4f5f7;
      border-radius: 4px;
    }

    .assignee-unassigned-wrapper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .assignee-select {
      flex: 1;
      min-width: 150px;
    }

    .assign-to-me-btn {
      white-space: nowrap;
    }

    .reporter-display {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .user-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }

    .btn {
      padding: 10px 20px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn-primary {
      background: #0052cc;
      color: white;
    }

    .btn-primary:hover {
      background: #0747a6;
    }

    .btn-secondary {
      background: #f4f5f7;
      color: #42526e;
    }

    .btn-secondary:hover {
      background: #e1e4e8;
    }

    .btn-danger {
      background: #de350b;
      color: white;
    }

    .btn-danger:hover {
      background: #bf2600;
    }

    .loading, .error {
      padding: 60px 24px;
      text-align: center;
      color: #5e6c84;
    }

    .error p {
      margin-bottom: 16px;
      color: #de350b;
    }

    .section-label {
      font-size: 14px;
      font-weight: 600;
      color: #172b4d;
      margin-bottom: 12px;
      display: block;
    }

    .attachment-upload {
      margin-bottom: 16px;
    }

    .btn-icon {
      width: 32px;
      height: 32px;
      border: none;
      background: transparent;
      color: #5e6c84;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }

    .btn-icon:hover {
      background: #f4f5f7;
      color: #172b4d;
    }

    .btn-icon:active {
      background: #e1e4e8;
    }

    .attachments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .attachment-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #f4f5f7;
      border-radius: 8px;
    }

    .attachment-preview {
      width: 120px;
      height: 120px;
      border-radius: 6px;
      overflow: hidden;
      background: white;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .attachment-preview img,
    .attachment-preview video {
      max-width: 100%;
      max-height: 100%;
      object-fit: cover;
    }

    .attachment-info {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .attachment-details {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .attachment-name {
      font-size: 14px;
      font-weight: 500;
      color: #172b4d;
    }

    .attachment-meta {
      font-size: 12px;
      color: #5e6c84;
    }

    .empty-attachments {
      padding: 32px;
      text-align: center;
      color: #5e6c84;
      font-size: 14px;
      background: #f4f5f7;
      border-radius: 8px;
      margin: 0;
    }

    .comment-input {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .comment-input .mention-container {
      display: flex;
      gap: 12px;
      align-items: flex-start;
    }

    .comment-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
      flex-shrink: 0;
      margin-top: 2px;
    }

    .comment-input-wrapper {
      position: relative;
      flex: 1;
    }

    .comment-input-wrapper textarea {
      width: 100%;
    }

    .mention-dropdown {
      position: absolute;
      bottom: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #dfe1e6;
      border-radius: 6px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-height: 200px;
      overflow-y: auto;
      z-index: 10;
      margin-bottom: 8px;
    }

    .mention-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
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
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: 600;
    }

    .mention-item span {
      font-size: 14px;
      color: #172b4d;
    }

    .comments-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .comment-item {
      padding: 16px;
      background: #f4f5f7;
      border-radius: 8px;
    }

    .comment-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
    }

    .comment-author {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .author-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 14px;
      font-weight: 600;
    }

    .author-info {
      display: flex;
      flex-direction: column;
      gap: 4px;
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
      margin: 0;
      color: #172b4d;
      line-height: 1.6;
      font-size: 14px;
    }

    .comment-content ::ng-deep .mention {
      background: #deebff;
      color: #0052cc;
      padding: 2px 4px;
      border-radius: 3px;
      font-weight: 500;
    }

    .due-date-display {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .due-date-display span {
      font-size: 14px;
      color: #172b4d;
    }

    .due-date-display span.overdue {
      color: #de350b;
      font-weight: 600;
    }

    .btn-link-small {
      background: none;
      border: none;
      color: #0052cc;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      padding: 0;
    }

    .btn-link-small:hover {
      text-decoration: underline;
    }

    .due-date-edit {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-input-sm {
      width: 100%;
      padding: 6px 10px;
      border: 1px solid #dfe1e6;
      border-radius: 4px;
      font-size: 14px;
      background: white;
      outline: none;
    }

    .form-input-sm:focus {
      border-color: #0052cc;
    }

    .inline-actions {
      display: flex;
      gap: 4px;
    }

    .btn-icon-sm {
      width: 24px;
      height: 24px;
      border: none;
      background: #f4f5f7;
      color: #5e6c84;
      border-radius: 3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
      padding: 0;
    }

    .btn-icon-sm:hover {
      background: #e1e4e8;
      color: #0052cc;
    }

    .btn-icon-sm:last-child:hover {
      color: #de350b;
    }

    .sidebar-actions {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-top: auto;
      border-top: 1px solid #dfe1e6;
    }

    /* Custom Scrollbar */
    .task-content-main::-webkit-scrollbar,
    .task-sidebar::-webkit-scrollbar {
      width: 8px;
    }

    .task-content-main::-webkit-scrollbar-track,
    .task-sidebar::-webkit-scrollbar-track {
      background: transparent;
    }

    .task-content-main::-webkit-scrollbar-thumb,
    .task-sidebar::-webkit-scrollbar-thumb {
      background: #dfe1e6;
      border-radius: 4px;
    }

    .task-content-main::-webkit-scrollbar-thumb:hover,
    .task-sidebar::-webkit-scrollbar-thumb:hover {
      background: #b3bac5;
    }

    /* Enhanced hover states */
    .meta-item:hover {
      background: transparent;
    }

    /* Status badge styles */
    .status-select option {
      padding: 8px;
    }

    /* Priority visual indicators */
    .priority-select option {
      padding-left: 24px;
    }

    .priority-select option[value="Low"]::before {
      content: "↓ ";
      color: #00875a;
    }

    .priority-select option[value="Medium"]::before {
      content: "→ ";
      color: #ff991f;
    }

    .priority-select option[value="High"]::before {
      content: "↑ ";
      color: #de350b;
    }

    .priority-select option[value="Critical"]::before {
      content: "↑↑ ";
      color: #bf2600;
    }

    /* Improved transitions */
    .assignee-display,
    .reporter-display,
    .due-date-display {
      transition: all 0.2s ease;
    }

    /* Better focus states */
    .form-select-sm,
    .form-input-sm,
    .form-textarea,
    .status-select {
      transition: all 0.2s ease;
    }
  `]
})
export class TaskDetailComponent implements OnInit, AfterViewInit {
  task: Task | null = null;
  loading = true;
  error: string | null = null;
  users: User[] = [];
  sprints: Sprint[] = [];
  editingDescription = false;
  editedDescription = '';
  editingDueDate = false;
  editedDueDate = '';
  currentUser: User | null = null;
  taskAttachments: Attachment[] = [];
  selectedFile: File | null = null;
  isUploading = false;
  taskComments: Comment[] = [];
  newCommentText = '';
  showMentionDropdown = false;
  filteredUsers: User[] = [];
  mentionStartIndex = -1;
  detailsExpanded = true;
  editingAssignee = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private taskService: TaskService,
    private userService: UserService,
    private sprintService: SprintService,
    private attachmentService: AttachmentService,
    private commentService: CommentService,
    private toastService: ToastService,
    private authService: AuthService
  ) {
    this.currentUser = this.authService.getCurrentUserValue();
  }

  ngOnInit(): void {
    const taskId = this.route.snapshot.paramMap.get('taskId');
    const projectId = this.route.snapshot.paramMap.get('projectId');

    if (taskId) {
      this.loadTask(taskId);

      // Load users and sprints for edit dropdowns
      if (projectId) {
        this.loadUsers(projectId);
        this.loadSprints(projectId);
      }
    } else {
      this.error = 'Invalid task ID';
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {
    // Check if there's a fragment (comment ID to scroll to)
    this.route.fragment.subscribe(fragment => {
      if (fragment) {
        // Wait a bit for the comments to load and render
        setTimeout(() => {
          const element = document.getElementById(fragment);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Highlight the comment briefly
            element.style.backgroundColor = '#fff3cd';
            setTimeout(() => {
              element.style.backgroundColor = '';
            }, 2000);
          }
        }, 500);
      }
    });
  }

  loadTask(taskId: string): void {
    this.taskService.getTaskById(taskId).subscribe({
      next: (task) => {
        this.task = task;
        this.loading = false;
        this.loadTaskAttachments();
        // Load comments after users are loaded
        if (this.users.length > 0) {
          this.loadTaskComments();
        }
      },
      error: (error) => {
        console.error('Error loading task:', error);
        this.error = 'Failed to load task. Please try again.';
        this.loading = false;
      }
    });
  }

  formatDate(date: string | Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Africa/Cairo'
    });
  }

  goToBoard(): void {
    if (this.task) {
      this.router.navigate(['/projects', this.task.projectId, 'board']);
    }
  }

  goBack(): void {
    window.history.back();
  }

  loadUsers(projectId: string): void {
    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users = users;
        // Load comments after users are loaded so we can map userNames
        if (this.task) {
          this.loadTaskComments();
        }
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
      }
    });
  }

  loadSprints(projectId: string): void {
    this.sprintService.getSprints(projectId).subscribe({
      next: (sprints: Sprint[]) => {
        this.sprints = sprints;
      },
      error: (error: any) => {
        console.error('Error loading sprints:', error);
      }
    });
  }

  toggleDescriptionEdit(): void {
    this.editingDescription = !this.editingDescription;
    if (this.editingDescription && this.task) {
      this.editedDescription = this.task.description || '';
    }
  }

  saveDescription(): void {
    if (!this.task) return;

    this.taskService.updateTask(this.task.id, {
      description: this.editedDescription
    }).subscribe({
      next: (updatedTask) => {
        this.task!.description = updatedTask.description;
        this.editingDescription = false;
        this.toastService.success('Description updated');
      },
      error: () => {
        this.toastService.error('Failed to update description');
      }
    });
  }

  updateTaskField(field: string, value: any): void {
    if (!this.task) return;

    const updateData: any = {};
    updateData[field] = value;

    this.taskService.updateTask(this.task.id, updateData).subscribe({
      next: (updatedTask) => {
        Object.assign(this.task!, updatedTask);
        this.toastService.success('Task updated');
      },
      error: () => {
        this.toastService.error('Failed to update task');
      }
    });
  }

  deleteTask(): void {
    if (!this.task) return;

    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    this.taskService.deleteTask(this.task.id).subscribe({
      next: () => {
        this.toastService.success('Task deleted');
        this.router.navigate(['/projects', this.task!.projectId, 'board']);
      },
      error: () => {
        this.toastService.error('Failed to delete task');
      }
    });
  }

  loadTaskAttachments(): void {
    if (!this.task) return;

    this.attachmentService.getTaskAttachments(this.task.id).subscribe({
      next: (attachments: Attachment[]) => {
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
    if (!this.task || !this.selectedFile) return;

    this.isUploading = true;
    this.attachmentService.uploadAttachment(this.task.id, this.selectedFile).subscribe({
      next: (attachment: Attachment) => {
        this.taskAttachments.push(attachment);
        this.selectedFile = null;
        this.isUploading = false;
        this.toastService.success('File uploaded successfully');
      },
      error: () => {
        this.isUploading = false;
        this.toastService.error('Failed to upload file');
      }
    });
  }

  deleteAttachment(attachmentId: string): void {
    if (!confirm('Are you sure you want to delete this attachment?')) {
      return;
    }

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

  loadTaskComments(): void {
    if (!this.task) return;

    this.commentService.getComments(this.task.id).subscribe({
      next: (comments: Comment[]) => {
        // Backend should return createdByName, but populate from users list if not present
        this.taskComments = comments.map(comment => {
          if (!comment.createdByName && comment.createdBy !== undefined) {
            const user = this.users.find(u => u.id === comment.createdBy!.toString());
            if (user) {
              comment.createdByName = `${user.firstName} ${user.lastName}`;
            }
          }
          return comment;
        });
      },
      error: () => {
        this.toastService.error('Failed to load comments');
      }
    });
  }

  addComment(): void {
    if (!this.task || !this.newCommentText.trim() || !this.currentUser) return;

    this.commentService.createComment({
      content: this.newCommentText,
      taskId: this.task.id
    }).subscribe({
      next: (comment: Comment) => {
        // Backend should return createdByName, but set it if not present
        if (!comment.createdByName) {
          comment.createdByName = `${this.currentUser!.firstName} ${this.currentUser!.lastName}`;
        }

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

    const text = this.newCommentText;
    const beforeMention = text.substring(0, this.mentionStartIndex);
    const afterAt = text.substring(this.mentionStartIndex + 1);
    
    // Find the end of the mention pattern (up to the first space or end of text)
    // We need to find what was typed after @ that should be replaced
    const textAfterAt = afterAt;
    const spaceIndex = textAfterAt.indexOf(' ');
    
    let searchPattern = '';
    let textToPreserve = '';
    
    if (spaceIndex !== -1) {
      // There's a space, so we have: "@pattern text after"
      searchPattern = textAfterAt.substring(0, spaceIndex);
      textToPreserve = textAfterAt.substring(spaceIndex); // Include the space
    } else {
      // No space, so everything after @ is the search pattern
      searchPattern = textAfterAt;
      textToPreserve = '';
    }
    
    // Replace the search pattern with the user's full name
    // Format: "@FirstName LastName " - always include a space after for proper backend parsing
    const mentionText = `${user.firstName} ${user.lastName}`;
    
    // Always ensure there's a space after the mention for backend to parse correctly
    // If textToPreserve already starts with a space (from the original text), use it
    // Otherwise, add a space after the mention
    const hasSpaceInPreserved = textToPreserve.length > 0 && textToPreserve.charAt(0) === ' ';
    const spaceAfterMention = hasSpaceInPreserved ? '' : ' ';
    
    // Construct the final text: before + @ + mention + space + preserved text
    this.newCommentText = beforeMention + '@' + mentionText + spaceAfterMention + textToPreserve;
    
    // Focus back to textarea and set cursor position after the mention
    setTimeout(() => {
      const textarea = document.querySelector('.comment-input-wrapper textarea') as HTMLTextAreaElement;
      if (textarea) {
        // Position cursor after mention, space (if added), and any preserved text
        const spaceLength = spaceAfterMention.length;
        const newCursorPosition = this.mentionStartIndex + 1 + mentionText.length + spaceLength + textToPreserve.length;
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
        textarea.focus();
      }
    }, 0);
    
    this.showMentionDropdown = false;
    this.mentionStartIndex = -1;
  }

  renderCommentWithMentions(content: string): string {
    // Replace @mentions with styled spans
    return content.replace(/@([\w\s]+?)(?=\s|$|[.,!?])/g, '<span class="mention">@$1</span>');
  }

  getInitials(name: string): string {
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().substring(0, 2);
  }

  getAssigneeName(): string {
    if (!this.task?.assigneeId) return '';
    const user = this.users.find(u => u.id === this.task?.assigneeId);
    return user ? `${user.firstName} ${user.lastName}` : '';
  }

  getAssigneeInitials(): string {
    if (!this.task?.assigneeId) return '';
    const user = this.users.find(u => u.id === this.task?.assigneeId);
    return user ? this.getInitials(`${user.firstName} ${user.lastName}`) : '';
  }

  assignToMe(): void {
    if (!this.currentUser) return;
    this.task!.assigneeId = this.currentUser.id;
    this.updateTaskField('assigneeId', this.currentUser.id);
  }

  formatDueDate(date: string | Date | undefined): string {
    if (!date) return 'Not set';

    const dueDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const taskDate = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    const diffTime = taskDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Format the date
    const formattedDate = dueDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    if (diffDays === 0) {
      return `${formattedDate} (Today)`;
    } else if (diffDays === 1) {
      return `${formattedDate} (Tomorrow)`;
    } else if (diffDays === -1) {
      return `${formattedDate} (Yesterday)`;
    } else if (diffDays > 1 && diffDays <= 7) {
      return `${formattedDate} (In ${diffDays} days)`;
    } else if (diffDays < 0) {
      return `${formattedDate} (${Math.abs(diffDays)} days ago)`;
    }

    return formattedDate;
  }

  isOverdue(date: string | Date | undefined): boolean {
    if (!date) return false;
    const dueDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return dueDate < today;
  }

  toggleDueDateEdit(): void {
    this.editingDueDate = !this.editingDueDate;
    if (this.editingDueDate && this.task) {
      // Convert Date to YYYY-MM-DD format for input[type="date"]
      if (this.task.dueDate) {
        const date = new Date(this.task.dueDate);
        this.editedDueDate = this.formatDateForInput(date);
      } else {
        this.editedDueDate = '';
      }
    }
  }

  formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  saveDueDate(): void {
    if (!this.task || !this.editedDueDate) return;

    const dueDate = new Date(this.editedDueDate);

    this.taskService.updateTask(this.task.id, {
      dueDate: dueDate
    }).subscribe({
      next: (updatedTask) => {
        this.task!.dueDate = updatedTask.dueDate;
        this.editingDueDate = false;
        this.toastService.success('Due date updated');
      },
      error: () => {
        this.toastService.error('Failed to update due date');
      }
    });
  }

  clearDueDate(): void {
    if (!this.task) return;

    if (!confirm('Are you sure you want to clear the due date?')) {
      return;
    }

    this.taskService.updateTask(this.task.id, {
      dueDate: undefined
    }).subscribe({
      next: (updatedTask) => {
        this.task!.dueDate = updatedTask.dueDate;
        this.editingDueDate = false;
        this.toastService.success('Due date cleared');
      },
      error: () => {
        this.toastService.error('Failed to clear due date');
      }
    });
  }
}
