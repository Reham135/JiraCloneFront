export interface Project {
  id: string;
  name: string;
  key: string;
  description?: string;
  ownerId: string;
  ownerName?: string;
  createdAt: Date;
  updatedAt?: Date;
  iconUrl?: string;
  color?: string;
}

export interface CreateProjectRequest {
  name: string;
  key: string;
  description?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
}
