export enum TaskStatus {
  ToDo = 'ToDo',
  InProgress = 'InProgress',
  Done = 'Done'
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
  Critical = 'Critical'
}

export enum TaskType {
  Task = 'Task',
  Bug = 'Bug',
  Story = 'Story'
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  projectName?: string;
  projectKey?: string;
  sprintId?: string;
  sprintName?: string;
  assigneeId?: string;
  assigneeName?: string;
  assigneeAvatar?: string;
  reporterId: string;
  reporterName?: string;
  createdBy?: string;
  createdByName?: string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt?: Date;
  estimatedHours?: number;
  taskKey?: string;
  statusName?: string;
  typeName?: string;
  priorityName?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  type: TaskType;
  projectId: string;
  sprintId?: string;
  assigneeId?: string;
  dueDate?: Date;
  estimatedHours?: number;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  type?: TaskType;
  assigneeId?: string;
  sprintId?: string;
  dueDate?: Date;
  estimatedHours?: number;
}
