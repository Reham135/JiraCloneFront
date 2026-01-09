import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '../../shared/models';

export interface TaskFilter {
  projectId?: string;
  sprintId?: string;
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private apiUrl = `${environment.apiUrl}/tasks`;

  constructor(private http: HttpClient) {}

  getTasks(filter?: TaskFilter): Observable<Task[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.projectId) params = params.set('projectId', filter.projectId);
      if (filter.sprintId) params = params.set('sprintId', filter.sprintId);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.assigneeId) params = params.set('assigneeId', filter.assigneeId);
      if (filter.priority) params = params.set('priority', filter.priority);
    }

    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  createTask(task: CreateTaskRequest): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  updateTask(id: string, task: UpdateTaskRequest): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  updateTaskStatus(id: string, status: TaskStatus): Observable<Task> {
    return this.updateTask(id, { status });
  }
}
