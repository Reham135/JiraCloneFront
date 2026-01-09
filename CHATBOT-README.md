# AI-Powered Chatbot Feature

## Overview
The chatbot allows users to create tasks using natural language. Simply describe what you need, and the AI will extract the task details and create it automatically.

## Features
- Floating chat button (always accessible from any page)
- Natural language task creation
- AI-powered task detail extraction
- Real-time task creation
- Direct link to created tasks on the board
- Toast notifications for success/errors

## Architecture
```
User Types Message
    ↓
Angular Chatbot Component
    ↓
ChatbotService → POST to n8n webhook (localhost:5678)
    ↓
n8n Workflow:
  1. Receive message
  2. Extract task details using OpenAI
  3. Call backend API to create task
  4. Format response
    ↓
Response returned to Angular
    ↓
Display task details with link
```

## Setup Instructions

### 1. Prerequisites
- n8n running on `http://localhost:5678`
- Backend API running on `http://localhost:5145`
- OpenAI API key (for n8n workflow)

### 2. Start n8n
```bash
docker run -it --rm --name n8n -p 5678:5678 n8nio/n8n
```

### 3. Import n8n Workflow
1. Open n8n at `http://localhost:5678`
2. Import the workflow from `../JiraClone/n8n-chatbot-workflow-setup.md`
3. Add your OpenAI API key
4. Activate the workflow

### 4. Start Angular App
```bash
ng serve
```

## Usage

### Basic Examples
1. Click the floating blue chat button in the bottom-right corner
2. Type one of these examples:
   - "Create a high priority bug to fix the login page"
   - "Add a story for user authentication feature"
   - "New task: Update documentation for API endpoints"
   - "Fix the navbar alignment issue urgently"
3. Press Enter or click the Send button
4. Wait for the AI to process (loading indicator)
5. See the created task with a link to view it on the board

### What the AI Extracts
From your message, the AI will extract:
- **Title**: Clear, action-oriented task title
- **Description**: Detailed description of the task
- **Type**: Task, Bug, or Story (based on keywords)
- **Priority**: Low, Medium, High, or Critical
- **Status**: Always starts as "ToDo"

### Keywords that Affect Task Type
- "bug", "fix", "error", "issue" → Type: **Bug**, Priority: **High**
- "story", "feature" → Type: **Story**
- "high priority", "urgent", "critical" → Priority: **Critical**
- Default: Type: **Task**, Priority: **Medium**

## Files Structure

```
src/app/
├── core/
│   └── services/
│       └── chatbot.service.ts         # Service for chat state and n8n communication
├── shared/
│   ├── components/
│   │   └── chatbot/
│   │       └── chatbot.component.ts   # Main chatbot UI component
│   └── models/
│       ├── chatbot.model.ts           # TypeScript interfaces
│       └── index.ts                   # Model exports
└── environments/
    ├── environment.ts                 # Dev config with n8n URL
    └── environment.prod.ts            # Prod config with n8n URL
```

## Configuration

### Environment Variables
Located in `src/environments/environment.ts`:
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5145/api/v1',
  n8nWebhook: 'http://localhost:5678/webhook/09511de5-a9a4-4385-a159-d5918abbc357/chat'  // n8n webhook URL
};
```

### Customization
To change the chatbot behavior:

1. **UI Styling**: Edit `chatbot.component.ts` styles section (lines 117-447)
2. **Welcome Message**: Edit template lines 44-53
3. **n8n URL**: Change `n8nWebhook` in environment files
4. **AI Extraction Logic**: Modify n8n workflow OpenAI system prompt

## API Integration

### Request Format (Frontend → n8n)
```typescript
POST http://localhost:5678/webhook/chat
Content-Type: application/json

{
  "message": "Create a high priority bug to fix login",
  "timestamp": "2025-01-01T10:00:00.000Z"
}
```

### Response Format (n8n → Frontend)
```typescript
{
  "message": "Task created successfully: PROJ-5 - Fix login bug",
  "taskCreated": {
    "id": "5",
    "taskKey": "PROJ-5",
    "title": "Fix login bug",
    "status": "ToDo"
  }
}
```

## Components

### ChatbotService
Location: `src/app/core/services/chatbot.service.ts`

**Responsibilities:**
- Manage chat messages (BehaviorSubject)
- Handle chat window state (open/closed)
- Communicate with n8n webhook
- Provide observables for reactive UI updates

**Key Methods:**
- `sendMessageToN8n(message: string): Observable<ChatResponse>`
- `addMessage(message: ChatMessage): void`
- `toggleChat(): void`
- `clearMessages(): void`

### ChatbotComponent
Location: `src/app/shared/components/chatbot/chatbot.component.ts`

**Features:**
- Floating button with active/inactive states
- Chat window with slide-up animation
- Message history with user/bot styling
- Task creation cards with green background
- Typing indicator during loading
- Auto-scroll to bottom on new messages
- Error handling with toast notifications
- Welcome message for first-time users

**Template Sections:**
- Chat toggle button (line 17)
- Chat window (line 24)
- Header (line 27)
- Messages container (line 43)
- Welcome message (line 44)
- Message loop (line 56)
- Task creation card (line 61)
- Loading indicator (line 79)
- Input field (line 94)

## Troubleshooting

### Issue: "Failed to send message. Check if n8n is running."
**Solution:**
1. Make sure n8n is running: `docker ps` (should show n8n container)
2. Check n8n is accessible: `curl http://localhost:5678`
3. Verify workflow is activated in n8n UI
4. Check browser console for CORS errors

### Issue: Chatbot button not visible
**Solution:**
1. Check `app.component.html` includes `<app-chatbot></app-chatbot>`
2. Verify `app.component.ts` imports `ChatbotComponent`
3. Clear browser cache and reload

### Issue: Task created but not showing in board
**Solution:**
1. Refresh the board page
2. Check the project ID matches (default is project 1)
3. Check sprint filter (if task has no sprint, it goes to backlog)

### Issue: AI extracts wrong task details
**Solution:**
1. Be more specific in your message
2. Include keywords like "bug", "high priority", "story"
3. Modify the OpenAI system prompt in n8n workflow for better extraction

### Issue: Message sent but no response
**Solution:**
1. Check n8n execution log for errors
2. Verify OpenAI API key is valid
3. Check backend API is running and accessible
4. Test n8n webhook directly with curl

### Issue: CORS error in browser console
**Solution:**
1. n8n should handle CORS automatically
2. If issues persist, add CORS headers in n8n "Respond to Webhook" node
3. Check if n8n is running on correct port (5678)

## Testing

### Manual Testing Checklist
- [ ] Click chat button → window opens
- [ ] Click X button → window closes
- [ ] Type message and press Enter → message appears
- [ ] Wait for response → bot message appears
- [ ] Check task created in backend
- [ ] Click "View on Board" → navigates to board
- [ ] Send another message → chat history preserved
- [ ] Send empty message → button disabled
- [ ] Stop n8n → error message shown
- [ ] Reload page → chat state resets

### Test Messages
```
1. "Create a high priority bug to fix the login page"
2. "Add a story for user authentication feature"
3. "New task: Update documentation for API endpoints"
4. "Fix the navbar alignment issue urgently"
5. "Create a critical bug for database connection timeout"
6. "Add a medium priority task to refactor the code"
```

### Expected Results
Each message should:
1. Show user message in blue bubble (right side)
2. Show loading indicator (3 dots)
3. Show bot response in white bubble (left side)
4. Show green task card with:
   - Task key (e.g., "PROJ-5")
   - Task title
   - "View on Board →" link
5. Show toast notification
6. Clicking link navigates to board

## Future Enhancements (Out of Scope)
- [ ] Conversation persistence (save to database)
- [ ] Edit/delete tasks via chat
- [ ] Query existing tasks ("Show my tasks")
- [ ] File attachments
- [ ] Multi-turn conversations with context
- [ ] Voice input
- [ ] Task suggestions based on project history
- [ ] Multi-language support
- [ ] Keyboard shortcuts
- [ ] Unread message badge

## Performance Considerations
- Chat messages stored in memory (BehaviorSubject)
- Messages cleared on page reload
- No pagination (all messages shown)
- For production: Consider message history limits or persistence

## Security Considerations
- No authentication on n8n webhook (localhost only)
- For production:
  - Add authentication to n8n webhook
  - Pass user JWT token from frontend
  - Validate token in n8n before creating task
  - Add rate limiting to prevent abuse
  - Sanitize user input to prevent injection

## Support
For issues or questions:
1. Check n8n execution logs for errors
2. Check browser console for frontend errors
3. Check backend API logs for task creation issues
4. Refer to `n8n-chatbot-workflow-setup.md` for n8n configuration

## License
Same as main project
