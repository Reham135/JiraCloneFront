export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  taskCreated?: {
    id: string;
    taskKey: string;
    title: string;
  };
}

export interface ChatRequest {
  message: string;
  timestamp: string;
  projectId?: number;
  sprintId?: number;
  assigneeId?: number;
}

export interface ChatResponse {
  message: string;
  taskCreated?: {
    id: string;
    taskKey: string;
    title: string;
    status: string;
  };
  choices?: ChatChoice[];
  expectsInput?: boolean;
  inputType?: 'text' | 'date' | 'file';
}

export interface ChatChoice {
  label: string;
  value: string;
  description?: string;
}
