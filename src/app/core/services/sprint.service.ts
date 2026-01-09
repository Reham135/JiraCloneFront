import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Sprint, CreateSprintRequest, UpdateSprintRequest } from '../../shared/models';

@Injectable({
  providedIn: 'root'
})
export class SprintService {
  private apiUrl = `${environment.apiUrl}/sprints`;

  constructor(private http: HttpClient) {}

  getSprints(projectId?: string): Observable<Sprint[]> {
    let params = new HttpParams();
    if (projectId) {
      params = params.set('projectId', projectId);
    }
    return this.http.get<Sprint[]>(this.apiUrl, { params });
  }

  getSprintById(id: string): Observable<Sprint> {
    return this.http.get<Sprint>(`${this.apiUrl}/${id}`);
  }

  createSprint(sprint: CreateSprintRequest): Observable<Sprint> {
    return this.http.post<Sprint>(this.apiUrl, sprint);
  }

  updateSprint(id: string, sprint: UpdateSprintRequest): Observable<Sprint> {
    return this.http.put<Sprint>(`${this.apiUrl}/${id}`, sprint);
  }

  deleteSprint(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  startSprint(id: string): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.apiUrl}/${id}/start`, {});
  }

  completeSprint(id: string): Observable<Sprint> {
    return this.http.post<Sprint>(`${this.apiUrl}/${id}/complete`, {});
  }
}
