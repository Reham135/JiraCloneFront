import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Notification } from '../../shared/models';
import { SignalRService } from './signalr.service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private unreadCountSubject = new BehaviorSubject<number>(0);

  public notifications$ = this.notificationsSubject.asObservable();
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor(
    private http: HttpClient,
    private signalRService: SignalRService
  ) {
    // Subscribe to SignalR notifications
    this.signalRService.getNotifications().subscribe(notification => {
      this.handleNewNotification(notification);
    });
  }

  /**
   * Load user notifications from the API
   */
  getUserNotifications(): Observable<Notification[]> {
    return this.http.get<Notification[]>(this.apiUrl).pipe(
      tap(notifications => {
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      })
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): Observable<Notification> {
    return this.http.put<Notification>(`${this.apiUrl}/${id}/read`, {}).pipe(
      tap(updatedNotification => {
        // Update the local notification list
        const notifications = this.notificationsSubject.value.map(n =>
          n.id === id ? { ...n, isRead: true } : n
        );
        this.notificationsSubject.next(notifications);
        this.updateUnreadCount(notifications);
      })
    );
  }

  /**
   * Handle new notification received via SignalR
   */
  private handleNewNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;

    // Add the new notification to the beginning of the list
    const updatedNotifications = [notification, ...currentNotifications];

    this.notificationsSubject.next(updatedNotifications);
    this.updateUnreadCount(updatedNotifications);
  }

  /**
   * Update the unread notification count
   */
  private updateUnreadCount(notifications: Notification[]): void {
    const unreadCount = notifications.filter(n => !n.isRead).length;
    this.unreadCountSubject.next(unreadCount);
  }

  /**
   * Get current notifications value
   */
  getNotificationsValue(): Notification[] {
    return this.notificationsSubject.value;
  }

  /**
   * Get current unread count value
   */
  getUnreadCountValue(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Clear all notifications (when user logs out)
   */
  clearNotifications(): void {
    this.notificationsSubject.next([]);
    this.unreadCountSubject.next(0);
  }
}
