# Quick Start Guide - JiraClone Frontend

## Getting Started in 3 Steps

### 1. Install Dependencies
```bash
cd C:\Users\DELL\source\repos\JiraCloneFront
npm install
```

### 2. Configure API Endpoint (if needed)
Edit `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://localhost:5001/api/v1'  // Change this to your backend URL
};
```

### 3. Run the Application
```bash
npm start
```

Open your browser and navigate to: **http://localhost:4200**

## First Time Setup

### Without Backend Running
If you don't have the backend API running yet, you'll see authentication errors. The frontend is fully functional but requires the backend API to work properly.

### With Backend Running
1. Start your .NET 8 backend API first (should be running on https://localhost:5001)
2. Start the Angular frontend (npm start)
3. Navigate to http://localhost:4200
4. Register a new account
5. Create your first project
6. Start using the Kanban board!

## Default Routes

- **/** - Redirects to dashboard (requires login)
- **/login** - Login page
- **/register** - Registration page
- **/dashboard** - Main dashboard (protected)
- **/projects** - Projects list (protected)
- **/projects/:id/board** - Kanban board for a project (protected)
- **/projects/:id/sprints** - Sprint management (protected)

## Key Features to Try

### 1. Project Management
- Click "Create Project" on the Projects page
- Fill in: Name, Key (e.g., "PROJ"), Description
- Projects appear as cards

### 2. Kanban Board
- Open a project → Navigate to Board
- Create tasks using "Create Task" button
- Drag tasks between columns (To Do, In Progress, In Review, Done)
- Click on task cards to view details

### 3. Sprint Management
- Open a project → Navigate to Sprints
- Create a sprint with name, goal, and dates
- Click "Start Sprint" to activate it
- Filter board tasks by active sprint

## Troubleshooting

### Port Already in Use
If port 4200 is already in use:
```bash
ng serve --port 4201
```

### CORS Errors
Ensure your backend API has CORS configured to allow http://localhost:4200

### API Connection Failed
1. Verify backend API is running on https://localhost:5001
2. Check `src/environments/environment.ts` has correct API URL
3. Check browser console for specific error messages

### Build Errors
```bash
# Clear node_modules and reinstall
rm -rf node_modules
npm install

# Clear Angular cache
ng cache clean
```

## Development Commands

```bash
# Start development server
npm start

# Run tests
npm test

# Build for production
npm run build

# Generate a new component
ng generate component component-name

# Generate a new service
ng generate service service-name
```

## Browser DevTools

### Check Auth Token
Open browser DevTools → Application → Local Storage → http://localhost:4200
Look for `jira_token` and `jira_user`

### Check API Calls
Open browser DevTools → Network tab
Filter by "Fetch/XHR" to see API requests

## Common Issues

### 1. Blank Page After Login
- Check browser console for errors
- Verify API endpoints are responding
- Check that JWT token is stored in localStorage

### 2. Drag and Drop Not Working
- Ensure you're on the Board page (/projects/:id/board)
- Check that tasks are loaded properly
- Try refreshing the page

### 3. Tasks Not Loading
- Verify project ID in URL is correct
- Check that backend API is returning tasks
- Check browser console for errors

## Project Structure Overview

```
src/app/
├── auth/              # Login/Register
├── features/
│   ├── dashboard/     # Main dashboard
│   ├── projects/      # Project management
│   ├── board/         # Kanban board
│   └── sprints/       # Sprint management
├── core/
│   ├── guards/        # Route protection
│   ├── interceptors/  # HTTP token injection
│   └── services/      # API services
└── shared/
    ├── components/    # Reusable components
    └── models/        # TypeScript interfaces
```

## Next Steps

1. **Explore the Dashboard** - See overview of all projects
2. **Create Projects** - Set up your first project
3. **Add Sprints** - Plan your work iterations
4. **Create Tasks** - Add work items to your backlog
5. **Use Kanban Board** - Manage task flow with drag-and-drop

## Need Help?

- Check the full README_JIRA_CLONE.md for detailed documentation
- Review browser console for error messages
- Verify backend API is responding correctly
- Check network tab for failed API requests

---

Happy Project Management! 🚀
