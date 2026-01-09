import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Attachment } from '../../shared/models/attachment.model';

@Injectable({
  providedIn: 'root'
})
export class AttachmentService {
  private apiUrl = `${environment.apiUrl}/attachments`;

  constructor(private http: HttpClient) {}

  uploadAttachment(taskId: string, file: File): Observable<Attachment> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<Attachment>(`${this.apiUrl}/upload/${taskId}`, formData);
  }

  getTaskAttachments(taskId: string): Observable<Attachment[]> {
    return this.http.get<Attachment[]>(`${this.apiUrl}/task/${taskId}`);
  }

  deleteAttachment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAttachmentUrl(id: string): string {
    return `${this.apiUrl}/${id}/download`;
  }

  downloadAttachment(id: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
