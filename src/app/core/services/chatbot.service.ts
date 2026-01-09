import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ChatMessage, ChatRequest, ChatResponse } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private apiUrl = `${environment.apiUrl}/chat`;

  // Chat messages state
  private messagesSubject = new BehaviorSubject<ChatMessage[]>([]);
  public messages$ = this.messagesSubject.asObservable();

  // Chat window open/closed state
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpenSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Send a message to the backend chatbot API (powered by X.AI Grok)
   */
  sendMessage(
    message: string,
    projectId?: number | null,
    sprintId?: number | null,
    assigneeId?: number | null
  ): Observable<ChatResponse> {
    const request: ChatRequest = {
      message,
      timestamp: new Date().toISOString(),
      projectId: projectId || undefined,
      sprintId: sprintId || undefined,
      assigneeId: assigneeId || undefined
    };

    return this.http.post<ChatResponse>(this.apiUrl, request);
  }

  /**
   * Upload a file to the chatbot for task attachment
   */
  uploadFile(file: File): Observable<ChatResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ChatResponse>(`${this.apiUrl}/upload`, formData);
  }

  /**
   * Clear the current conversation state on the backend
   */
  clearConversation(): Observable<any> {
    return this.http.post(`${this.apiUrl}/clear`, {});
  }

  /**
   * @deprecated Use sendMessage() instead. Kept for backward compatibility.
   */
  sendMessageToN8n(
    message: string,
    projectId?: number | null,
    sprintId?: number | null,
    assigneeId?: number | null
  ): Observable<ChatResponse> {
    return this.sendMessage(message, projectId, sprintId, assigneeId);
  }

  /**
   * Add a message to the local chat history
   */
  addMessage(message: ChatMessage): void {
    const currentMessages = this.messagesSubject.value;
    this.messagesSubject.next([...currentMessages, message]);
  }

  /**
   * Get current messages
   */
  getMessages(): ChatMessage[] {
    return this.messagesSubject.value;
  }

  /**
   * Clear all messages
   */
  clearMessages(): void {
    this.messagesSubject.next([]);
  }

  /**
   * Toggle chat window open/closed
   */
  toggleChat(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  /**
   * Open chat window
   */
  openChat(): void {
    this.isOpenSubject.next(true);
  }

  /**
   * Close chat window
   */
  closeChat(): void {
    this.isOpenSubject.next(false);
  }

  /**
   * Check if chat is open
   */
  isOpen(): boolean {
    return this.isOpenSubject.value;
  }
}
