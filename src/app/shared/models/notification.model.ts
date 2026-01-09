export interface Notification {
  id: string;
  message: string;
  userId: string;
  taskId?: string;
  commentId?: string;
  projectId?: string;
  isRead: boolean;
  createdAt: Date;
}
