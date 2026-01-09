export enum SprintStatus {
  Planned = 'Planned',
  Active = 'Active',
  Completed = 'Completed'
}

export interface Sprint {
  id: string;
  name: string;
  projectId: string;
  status: SprintStatus;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreateSprintRequest {
  name: string;
  projectId: string;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
}

export interface UpdateSprintRequest {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  goal?: string;
  status?: SprintStatus;
}
