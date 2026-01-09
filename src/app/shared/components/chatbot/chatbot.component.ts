import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { ChatbotService } from '../../../core/services/chatbot.service';
import { ToastService } from '../../services/toast.service';
import { ChatMessage, ChatResponse } from '../../models';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="chatbot-widget">
      <!-- Floating Chat Toggle Button -->
      <button class="chat-toggle-btn" (click)="toggleChat()" [class.active]="isOpen$ | async">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
      </button>

      <!-- Chat Window -->
      @if (isOpen$ | async) {
        <div class="chat-window">
          <!-- Header -->
          <div class="chat-header">
            <div class="header-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <h3>Task Assistant</h3>
            </div>
            <div class="header-actions">
              <button class="restart-btn" (click)="startNewConversation()" title="Start new conversation">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
              <button class="close-btn" (click)="toggleChat()">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Messages -->
          <div class="chat-messages" #messagesContainer>
            @if ((messages$ | async)?.length === 0) {
              <div class="welcome-message">
                <div class="welcome-icon">👋</div>
                <h4>Hi! I'm your Task Assistant</h4>
                <p>I can help you create tasks quickly. Just describe what you need!</p>
                <div class="example-message">
                  <strong>Example:</strong><br>
                  "Create a high priority bug to fix the login page"
                </div>
              </div>
            }

            @for (msg of messages$ | async; track msg.id) {
              <div class="message-wrapper" [class.user-message]="msg.sender === 'user'" [class.bot-message]="msg.sender === 'bot'">
                <div class="message">
                  <div class="message-text">{{ msg.text }}</div>

                  @if (msg.taskCreated) {
                    <div class="task-created">
                      <div class="task-icon"></div>
                      <div class="task-details">
                        <div class="task-key">{{ msg.taskCreated.taskKey }}</div>
                        <div class="task-title">{{ msg.taskCreated.title }}</div>
                        <a [routerLink]="['/projects', getCurrentProjectId(), 'tasks', msg.taskCreated.id]" class="view-task-link" (click)="closeChat()">
                          View Task →
                        </a>
                      </div>
                    </div>
                  }

                  <div class="message-time">{{ formatTime(msg.timestamp) }}</div>
                </div>
              </div>
            }

            @if (isLoading) {
              <div class="message-wrapper bot-message">
                <div class="message">
                  <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Choice Buttons -->
          @if (lastBotResponse?.choices && (lastBotResponse?.choices?.length ?? 0) > 0 && !isLoading) {
            <div class="choice-buttons">
              @for (choice of lastBotResponse?.choices; track choice.value) {
                <button
                  class="choice-btn"
                  (click)="selectChoice(choice.value)">
                  <span class="choice-label">{{ choice.label }}</span>
                  @if (choice.description) {
                    <span class="choice-desc">{{ choice.description }}</span>
                  }
                </button>
              }
            </div>
          }

          <!-- File Upload -->
          @if (lastBotResponse?.inputType === 'file' && !isLoading) {
            <div class="file-upload">
              <input
                type="file"
                accept="image/*"
                (change)="onFileSelected($event)"
                #fileInput
                hidden
              />
              <button class="upload-btn" (click)="fileInput.click()">
                📎 Choose Image
              </button>
            </div>
          }

          <!-- Input -->
          <div class="chat-input">
            @if (lastBotResponse?.inputType === 'text' && lastBotResponse?.expectsInput) {
              <!-- Multiline textarea for descriptions -->
              <textarea
                [(ngModel)]="inputText"
                (keydown.enter)="handleTextareaEnter($event)"
                placeholder="Type your description... (Shift+Enter for new line)"
                [disabled]="isLoading"
                class="message-textarea"
                rows="3"
              ></textarea>
            } @else {
              <!-- Single line input for other messages -->
              <input
                type="text"
                [(ngModel)]="inputText"
                (keyup.enter)="sendMessage()"
                placeholder="Type to create a task..."
                [disabled]="isLoading"
                class="message-input"
              />
            }
            <button
              (click)="sendMessage()"
              [disabled]="!inputText.trim() || isLoading"
              class="send-btn"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .chatbot-widget {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 1000;
    }

    .chat-toggle-btn {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #0052cc;
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 82, 204, 0.4);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;
    }

    .chat-toggle-btn:hover {
      background: #0747a6;
      box-shadow: 0 6px 16px rgba(0, 82, 204, 0.5);
      transform: scale(1.05);
    }

    .chat-toggle-btn.active {
      background: #de350b;
    }

    .chat-window {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 380px;
      height: 550px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .chat-header {
      padding: 16px 20px;
      background: linear-gradient(135deg, #0052cc 0%, #0747a6 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .chat-header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .restart-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .restart-btn:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: rotate(-45deg);
    }

    .close-btn {
      width: 32px;
      height: 32px;
      border: none;
      background: rgba(255, 255, 255, 0.1);
      color: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .close-btn:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      background: #f4f5f7;
    }

    .welcome-message {
      text-align: center;
      padding: 40px 20px;
      color: #5e6c84;
    }

    .welcome-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .welcome-message h4 {
      margin: 0 0 8px 0;
      font-size: 18px;
      color: #172b4d;
    }

    .welcome-message p {
      margin: 0 0 20px 0;
      font-size: 14px;
    }

    .example-message {
      background: white;
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid #0052cc;
      text-align: left;
      font-size: 13px;
      color: #5e6c84;
      margin-top: 16px;
    }

    .message-wrapper {
      margin-bottom: 12px;
      display: flex;
    }

    .user-message {
      justify-content: flex-end;
    }

    .bot-message {
      justify-content: flex-start;
    }

    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
    }

    .user-message .message {
      background: #0052cc;
      color: white;
      border-bottom-right-radius: 4px;
    }

    .bot-message .message {
      background: white;
      color: #172b4d;
      border-bottom-left-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }

    .message-text {
      margin-bottom: 4px;
    }

    .message-time {
      font-size: 11px;
      opacity: 0.7;
      margin-top: 4px;
    }

    .task-created {
      margin-top: 12px;
      padding: 12px;
      background: #e3fcef;
      border-radius: 8px;
      border-left: 3px solid #00875a;
      display: flex;
      gap: 10px;
    }

    .task-icon {
      font-size: 20px;
    }

    .task-details {
      flex: 1;
    }

    .task-key {
      font-size: 12px;
      font-weight: 600;
      color: #00875a;
      margin-bottom: 4px;
    }

    .task-title {
      font-size: 13px;
      color: #172b4d;
      font-weight: 500;
      margin-bottom: 8px;
    }

    .view-task-link {
      font-size: 13px;
      color: #0052cc;
      text-decoration: none;
      font-weight: 600;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .view-task-link:hover {
      text-decoration: underline;
    }

    .typing-indicator {
      display: flex;
      gap: 4px;
      padding: 8px 0;
    }

    .typing-indicator span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #5e6c84;
      animation: typing 1.4s infinite;
    }

    .typing-indicator span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .typing-indicator span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes typing {
      0%, 60%, 100% {
        opacity: 0.3;
        transform: translateY(0);
      }
      30% {
        opacity: 1;
        transform: translateY(-8px);
      }
    }

    .chat-input {
      padding: 16px;
      background: white;
      border-top: 1px solid #dfe1e6;
      display: flex;
      gap: 8px;
    }

    .message-input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #dfe1e6;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
    }

    .message-input:focus {
      border-color: #0052cc;
    }

    .message-input:disabled {
      background: #f4f5f7;
      cursor: not-allowed;
    }

    .message-textarea {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #dfe1e6;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      resize: vertical;
      min-height: 60px;
      max-height: 150px;
      font-family: inherit;
      line-height: 1.5;
    }

    .message-textarea:focus {
      border-color: #0052cc;
    }

    .message-textarea:disabled {
      background: #f4f5f7;
      cursor: not-allowed;
    }

    .send-btn {
      width: 42px;
      height: 42px;
      border: none;
      background: #0052cc;
      color: white;
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: #0747a6;
      transform: scale(1.05);
    }

    .send-btn:disabled {
      background: #b3d4ff;
      cursor: not-allowed;
    }

    /* Scrollbar styling */
    .chat-messages::-webkit-scrollbar {
      width: 6px;
    }

    .chat-messages::-webkit-scrollbar-track {
      background: #f4f5f7;
    }

    .chat-messages::-webkit-scrollbar-thumb {
      background: #dfe1e6;
      border-radius: 3px;
    }

    .chat-messages::-webkit-scrollbar-thumb:hover {
      background: #b3bac5;
    }

    /* Choice Buttons */
    .choice-buttons {
      padding: 12px 16px;
      background: #f4f5f7;
      border-top: 1px solid #dfe1e6;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .choice-btn {
      padding: 12px 16px;
      background: white;
      border: 2px solid #0052cc;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .choice-btn:hover {
      background: #deebff;
      transform: translateX(4px);
      box-shadow: 0 2px 8px rgba(0, 82, 204, 0.15);
    }

    .choice-label {
      font-size: 14px;
      font-weight: 600;
      color: #0052cc;
    }

    .choice-desc {
      font-size: 12px;
      color: #5e6c84;
    }

    /* File Upload */
    .file-upload {
      padding: 12px 16px;
      background: #f4f5f7;
      border-top: 1px solid #dfe1e6;
      display: flex;
      justify-content: center;
    }

    .upload-btn {
      padding: 12px 24px;
      background: #00875a;
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.2s;
    }

    .upload-btn:hover {
      background: #006644;
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 135, 90, 0.3);
    }
  `]
})
export class ChatbotComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;

  inputText = '';
  isLoading = false;
  messages$ = this.chatbotService.messages$;
  isOpen$ = this.chatbotService.isOpen$;
  currentProjectId: number | null = null;
  lastBotResponse: ChatResponse | null = null;
  selectedFile: File | null = null;

  private subscriptions = new Subscription();
  private shouldScrollToBottom = false;

  constructor(
    private chatbotService: ChatbotService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Add welcome message on first load
    const currentMessages = this.chatbotService.getMessages();
    if (currentMessages.length === 0) {
      // Chat is empty, welcome message will show
    }

    // Extract project ID from current route
    this.extractProjectIdFromRoute();

    // Listen to route changes to update project ID
    this.subscriptions.add(
      this.router.events
        .pipe(filter(event => event instanceof NavigationEnd))
        .subscribe(() => {
          this.extractProjectIdFromRoute();
        })
    );
  }

  private extractProjectIdFromRoute(): void {
    const url = this.router.url;
    const match = url.match(/\/projects\/(\d+)/);
    if (match && match[1]) {
      this.currentProjectId = parseInt(match[1], 10);
    } else {
      this.currentProjectId = null;
    }
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleChat(): void {
    this.chatbotService.toggleChat();
  }

  closeChat(): void {
    // Clear conversation when closing chatbot
    this.chatbotService.clearConversation().subscribe({
      next: () => {
        this.lastBotResponse = null;
      },
      error: (error) => {
        console.error('Error clearing conversation on close:', error);
      }
    });
    this.chatbotService.closeChat();
  }

  startNewConversation(): void {
    // Clear backend conversation state
    this.chatbotService.clearConversation().subscribe({
      next: () => {
        // Clear frontend messages and state
        this.chatbotService.clearMessages();
        this.lastBotResponse = null;
        this.selectedFile = null;
        this.inputText = '';
        this.toastService.success('New conversation started!');
      },
      error: (error) => {
        console.error('Error clearing conversation:', error);
        // Still clear frontend even if backend fails
        this.chatbotService.clearMessages();
        this.lastBotResponse = null;
        this.selectedFile = null;
        this.inputText = '';
        this.toastService.success('New conversation started!');
      }
    });
  }

  handleTextareaEnter(event: any): void {
    // If Shift+Enter, allow newline (default behavior)
    if (event.shiftKey) {
      return;
    }

    // If just Enter (without Shift), send message
    event.preventDefault();
    this.sendMessage();
  }

  sendMessage(): void {
    if (!this.inputText.trim() || this.isLoading) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: this.inputText.trim(),
      sender: 'user',
      timestamp: new Date()
    };

    // Add user message to chat
    this.chatbotService.addMessage(userMessage);
    this.shouldScrollToBottom = true;

    const messageText = this.inputText.trim();
    this.inputText = '';
    this.isLoading = true;

    // Send to backend chatbot API (powered by Groq AI)
    this.chatbotService.sendMessage(messageText, this.currentProjectId).subscribe({
      next: (response) => {
        const botMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response.message,
          sender: 'bot',
          timestamp: new Date(),
          taskCreated: response.taskCreated
        };

        this.chatbotService.addMessage(botMessage);
        this.lastBotResponse = response; // Store for choices/input
        this.shouldScrollToBottom = true;
        this.isLoading = false;

        if (response.taskCreated) {
          this.toastService.success(`Task created: ${response.taskCreated.taskKey}`);
          this.lastBotResponse = null; // Clear choices after task creation
        }
      },
      error: (error) => {
        console.error('Error sending message to chatbot API:', error);

        const errorMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: 'Sorry, I couldn\'t process your request. Please try again or contact support.',
          sender: 'bot',
          timestamp: new Date()
        };

        this.chatbotService.addMessage(errorMessage);
        this.shouldScrollToBottom = true;
        this.isLoading = false;

        this.toastService.error('Failed to send message. Please try again.');
      }
    });
  }

  selectChoice(value: string): void {
    // User selected a choice button
    this.inputText = value;
    this.sendMessage();
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      this.isLoading = true;

      // Add user message about file upload
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: `Uploading ${file.name}...`,
        sender: 'user',
        timestamp: new Date()
      };
      this.chatbotService.addMessage(userMessage);
      this.shouldScrollToBottom = true;

      // Upload file to backend
      this.chatbotService.uploadFile(file).subscribe({
        next: (response) => {
          const botMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: response.message,
            sender: 'bot',
            timestamp: new Date(),
            taskCreated: response.taskCreated
          };

          this.chatbotService.addMessage(botMessage);
          this.lastBotResponse = response; // Store for choices/input
          this.shouldScrollToBottom = true;
          this.isLoading = false;
          this.selectedFile = null;

          if (response.taskCreated) {
            this.toastService.success(`Task created: ${response.taskCreated.taskKey}`);
            this.lastBotResponse = null; // Clear choices after task creation
          }
        },
        error: (error) => {
          console.error('Error uploading file:', error);

          const errorMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            text: 'Failed to upload file. Please try again.',
            sender: 'bot',
            timestamp: new Date()
          };

          this.chatbotService.addMessage(errorMessage);
          this.shouldScrollToBottom = true;
          this.isLoading = false;
          this.selectedFile = null;

          this.toastService.error('Failed to upload file. Please try again.');
        }
      });
    }
  }

  formatTime(timestamp: Date): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  getCurrentProjectId(): string {
    return this.currentProjectId?.toString() || '1';
  }

  private scrollToBottom(): void {
    try {
      if (this.messagesContainer) {
        this.messagesContainer.nativeElement.scrollTop =
          this.messagesContainer.nativeElement.scrollHeight;
      }
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }
}
