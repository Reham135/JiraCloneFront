# JiraClone Frontend - Angular Application

A complete, professional Jira-like project management application built with Angular 17, featuring a modern UI with drag-and-drop Kanban boards, sprint management, and comprehensive project tracking capabilities.

## Features

### Authentication
- User registration and login
- JWT token-based authentication
- Protected routes with auth guards
- Automatic token injection via HTTP interceptor

### Project Management
- Create, edit, and delete projects
- Project dashboard with cards view
- Project details and settings
- Color-coded project icons

### Kanban Board
- Drag-and-drop task management
- Four status columns: To Do, In Progress, In Review, Done
- Real-time status updates
- Filter by sprint and assignee
- Task cards with priority indicators
- Visual priority badges (Lowest to Highest)

### Sprint Management
- Create and manage sprints
- Start and complete sprints
- Sprint goals and date tracking
- Sprint status indicators (Planned, Active, Completed)

### Task Management
- Create tasks with rich details
- Assign tasks to team members
- Set priorities (Lowest, Low, Medium, High, Highest)
- Due date tracking with overdue indicators
- Task descriptions and metadata

### Modern UI/UX
- Clean, Jira-inspired design
- Responsive layout
- Toast notifications for user feedback
- Loading states and skeletons
- Smooth animations and transitions
- Professional color scheme (blue/white theme)

## Technology Stack

- **Angular 17** - Latest Angular framework with standalone components
- **TypeScript** - Type-safe development
- **Angular CDK** - Drag-and-drop functionality
- **Angular Material** - UI components and styling
- **RxJS** - Reactive state management
- **SCSS** - Advanced styling

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── guards/          # Auth guard
│   │   ├── interceptors/    # HTTP interceptor
│   │   └── services/        # Core services (auth, project, task, sprint, etc.)
│   ├── auth/
│   │   └── components/      # Login and register components
│   ├── features/
│   │   ├── dashboard/       # Dashboard component
│   │   ├── projects/        # Project list and management
│   │   ├── board/           # Kanban board
│   │   ├── sprints/         # Sprint management
│   │   └── tasks/           # Task components
│   ├── shared/
│   │   ├── components/      # Shared components (layout, toast, loading)
│   │   ├── models/          # TypeScript interfaces and types
│   │   └── services/        # Shared services
│   ├── app.routes.ts        # Application routing
│   └── app.config.ts        # App configuration
└── environments/            # Environment configurations

## Prerequisites

- Node.js (v18 or higher)
- npm (v9 or higher)
- Angular CLI (v17 or higher)

## Installation

1. Navigate to the project directory:
```bash
cd C:\Users\DELL\source\repos\JiraCloneFront
```

2. Install dependencies:
```bash
npm install
```

## Configuration

### API Endpoint Configuration

Update the API URL in the environment files if needed:

**Development** (`src/environments/environment.ts`):
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api/v1'
};
```

**Production** (`src/environments/environment.prod.ts`):
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-production-api.com/api/v1'
};
```

## Running the Application

### Development Server

Start the development server:
```bash
npm start
# or
ng serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload when you change source files.

### Production Build

Build the project for production:
```bash
ng build --configuration production
```

The build artifacts will be stored in the `dist/` directory.

## Backend API Requirements

This frontend expects a .NET 8 backend API with the following endpoints:

### Authentication
- POST `/api/v1/auth/register` - User registration
- POST `/api/v1/auth/login` - User login
- GET `/api/v1/auth/me` - Get current user

### Projects
- GET `/api/v1/projects` - Get all projects
- GET `/api/v1/projects/:id` - Get project by ID
- POST `/api/v1/projects` - Create project
- PUT `/api/v1/projects/:id` - Update project
- DELETE `/api/v1/projects/:id` - Delete project

### Tasks
- GET `/api/v1/tasks` - Get tasks (with filters: projectId, sprintId, status, assigneeId, priority)
- GET `/api/v1/tasks/:id` - Get task by ID
- POST `/api/v1/tasks` - Create task
- PUT `/api/v1/tasks/:id` - Update task
- DELETE `/api/v1/tasks/:id` - Delete task

### Sprints
- GET `/api/v1/sprints` - Get sprints (with filter: projectId)
- GET `/api/v1/sprints/:id` - Get sprint by ID
- POST `/api/v1/sprints` - Create sprint
- PUT `/api/v1/sprints/:id` - Update sprint
- DELETE `/api/v1/sprints/:id` - Delete sprint
- POST `/api/v1/sprints/:id/start` - Start sprint
- POST `/api/v1/sprints/:id/complete` - Complete sprint

### Comments (Optional)
- GET `/api/v1/comments?taskId=:taskId` - Get comments for a task
- POST `/api/v1/comments` - Create comment
- PUT `/api/v1/comments/:id` - Update comment
- DELETE `/api/v1/comments/:id` - Delete comment

### Users
- GET `/api/v1/users` - Get all users

## Usage Guide

### 1. Authentication
- Register a new account at `/register`
- Login with your credentials at `/login`
- You'll be redirected to the dashboard upon successful authentication

### 2. Creating a Project
- Navigate to the Projects page
- Click "Create Project"
- Fill in project name, key (2-10 characters), and description
- Submit to create your project

### 3. Managing Sprints
- Open a project and navigate to Sprints
- Create a new sprint with name, goal, and dates
- Start a sprint when ready to begin work
- Complete a sprint when all work is done

### 4. Using the Kanban Board
- Navigate to a project's board
- Create tasks using the "Create Task" button
- Drag and drop tasks between columns to change their status
- Click on a task card to view/edit details
- Filter tasks by sprint or assignee

### 5. Task Management
- Assign tasks to team members
- Set priority levels (Lowest to Highest)
- Add due dates to track deadlines
- Update task status by dragging to different columns

## Key Components

### Authentication Flow
1. User logs in → JWT token stored in localStorage
2. HTTP interceptor adds token to all API requests
3. Auth guard protects routes requiring authentication

### Kanban Board
- Uses Angular CDK drag-and-drop
- Real-time status updates via API calls
- Optimistic UI updates with rollback on error

### State Management
- Services use RxJS BehaviorSubjects
- Component-level state management
- Reactive data flow with observables

## Styling and Theming

The application uses a Jira-inspired color scheme:
- Primary Blue: `#0052cc`
- Dark Blue: `#0747a6`
- Background: `#f4f5f7`
- Text: `#172b4d`
- Secondary Text: `#5e6c84`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure your backend API has CORS configured to allow requests from `http://localhost:4200`

### Authentication Issues
- Check that the API URL in environment files is correct
- Verify JWT token is being stored in localStorage
- Check browser console for API errors

### Drag-and-Drop Not Working
- Ensure Angular CDK is properly installed
- Check that DragDropModule is imported in the board component

## Future Enhancements

Potential features for future development:
- Comments section on task detail modal
- Activity log for tasks
- File attachments
- Advanced filtering and search
- Reports and analytics
- Email notifications
- Real-time updates with WebSockets
- Dark mode
- Multi-language support

## License

This project is created for demonstration purposes.

## Contact

For questions or issues, please contact the development team.
```

## Development Tips

- Use Angular CLI for generating components: `ng generate component component-name`
- Follow Angular style guide for consistent code
- Use TypeScript strict mode for better type safety
- Implement OnPush change detection for better performance
- Write unit tests for critical business logic

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

Built with Angular by a Jira enthusiast!
