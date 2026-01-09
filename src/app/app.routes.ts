import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './auth/components/login/login.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { LayoutComponent } from './shared/components/layout/layout.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { ProjectListComponent } from './features/projects/components/project-list/project-list.component';
import { KanbanBoardComponent } from './features/board/components/kanban-board/kanban-board.component';
import { SprintListComponent } from './features/sprints/components/sprint-list/sprint-list.component';
import { BacklogComponent } from './features/backlog/components/backlog.component';
import { BacklogListComponent } from './features/backlog/backlog-list.component';
import { TaskDetailComponent } from './features/tasks/components/task-detail/task-detail.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'register',
    component: RegisterComponent
  },
  {
    path: '',
    component: LayoutComponent,
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: DashboardComponent
      },
      {
        path: 'projects',
        component: ProjectListComponent
      },
      {
        path: 'backlog',
        component: BacklogListComponent
      },
      {
        path: 'projects/:id/board',
        component: KanbanBoardComponent
      },
      {
        path: 'projects/:id/backlog',
        component: BacklogComponent
      },
      {
        path: 'projects/:id/sprints',
        component: SprintListComponent
      },
      {
        path: 'projects/:projectId/tasks/:taskId',
        component: TaskDetailComponent
      }
    ]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
