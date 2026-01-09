import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { Notification } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class SignalRService {
  private hubConnection: signalR.HubConnection | null = null;
  private connectionState$ = new BehaviorSubject<signalR.HubConnectionState>(signalR.HubConnectionState.Disconnected);
  private notificationReceived$ = new Subject<Notification>();

  constructor(private authService: AuthService) {}

  /**
   * Get the current connection state as an observable
   */
  getConnectionState() {
    return this.connectionState$.asObservable();
  }

  /**
   * Get notification events as an observable
   */
  getNotifications() {
    return this.notificationReceived$.asObservable();
  }

  /**
   * Start the SignalR connection
   */
  async startConnection(): Promise<void> {
    const token = this.authService.getToken();

    if (!token) {
      console.warn('Cannot start SignalR connection: No authentication token');
      return;
    }

    // Don't create multiple connections
    if (this.hubConnection && this.hubConnection.state !== signalR.HubConnectionState.Disconnected) {
      console.log('SignalR connection already active');
      return;
    }

    try {
      // Create new hub connection with JWT token
      this.hubConnection = new signalR.HubConnectionBuilder()
        .withUrl(`${environment.hubUrl}/notifications`, {
          accessTokenFactory: () => token,
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0s, 2s, 10s, 30s, then 60s
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount === 1) return 2000;
            if (retryContext.previousRetryCount === 2) return 10000;
            if (retryContext.previousRetryCount === 3) return 30000;
            return 60000;
          }
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Set up event handlers
      this.setupEventHandlers();

      // Start the connection
      await this.hubConnection.start();
      this.connectionState$.next(this.hubConnection.state);
      console.log('SignalR connection established successfully');
    } catch (error) {
      console.error('Error starting SignalR connection:', error);
      this.connectionState$.next(signalR.HubConnectionState.Disconnected);
      throw error;
    }
  }

  /**
   * Stop the SignalR connection
   */
  async stopConnection(): Promise<void> {
    if (this.hubConnection) {
      try {
        await this.hubConnection.stop();
        this.connectionState$.next(signalR.HubConnectionState.Disconnected);
        console.log('SignalR connection stopped');
      } catch (error) {
        console.error('Error stopping SignalR connection:', error);
      }
      this.hubConnection = null;
    }
  }

  /**
   * Get the current connection state
   */
  getConnectionStateValue(): signalR.HubConnectionState {
    return this.hubConnection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.hubConnection?.state === signalR.HubConnectionState.Connected;
  }

  /**
   * Set up SignalR event handlers
   */
  private setupEventHandlers(): void {
    if (!this.hubConnection) return;

    // Handle incoming notifications
    this.hubConnection.on('ReceiveNotification', (notification: Notification) => {
      console.log('Received notification via SignalR:', notification);
      this.notificationReceived$.next(notification);
    });

    // Handle reconnecting
    this.hubConnection.onreconnecting((error) => {
      console.warn('SignalR connection lost. Reconnecting...', error);
      this.connectionState$.next(signalR.HubConnectionState.Reconnecting);
    });

    // Handle reconnected
    this.hubConnection.onreconnected((connectionId) => {
      console.log('SignalR reconnected. Connection ID:', connectionId);
      this.connectionState$.next(signalR.HubConnectionState.Connected);
    });

    // Handle closed
    this.hubConnection.onclose((error) => {
      console.error('SignalR connection closed', error);
      this.connectionState$.next(signalR.HubConnectionState.Disconnected);

      // Attempt to reconnect after 5 seconds if not manually closed
      if (error) {
        setTimeout(() => {
          if (this.authService.isAuthenticated()) {
            console.log('Attempting to reconnect to SignalR...');
            this.startConnection().catch(err => {
              console.error('Failed to reconnect:', err);
            });
          }
        }, 5000);
      }
    });
  }

  /**
   * Clean up resources when service is destroyed
   */
  ngOnDestroy(): void {
    this.stopConnection();
  }
}
