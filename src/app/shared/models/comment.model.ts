export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId?: string;
  userName?: string;
  createdBy?: number;
  createdByName?: string;
  userAvatar?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateCommentRequest {
  content: string;
  taskId: string;
}

export interface UpdateCommentRequest {
  content: string;
}
