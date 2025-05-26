Collaborative Kanban Board A dynamic Kanban board application with advanced drag-and-drop capabilities, responsive design, and intuitive task management.

Features Implemented

1. Drag and Drop Functionality -Custom Drag and Drop System: Built a completely custom drag and drop system without external libraries •Cross-Column Task Movement: Drag tasks between different status columns •Column Reordering: Drag and reorder the columns themselves •Within-Column Reordering: Reposition tasks within the same column Mobile Touch Support: Enhanced touch interactions for mobile devices with haptic feedback
2. State Management •Custom State Solution: Implemented a custom state management pattern without Redux or Zustand •React Context API: Used Context API for global state management •useReducer Integration: Implemented reducer pattern for predictable state updates •Middleware Pattern: Created a middleware system that separates UI events from side effects •Command Pattern: Implemented the command pattern for state changes that need undo/redo capabilities
3. Advanced Features •Undo/Redo Functionality: Full undo/redo support for all task movements and reorderings •Command History: Tracks all user actions that can be undone •Search and Filtering: Real-time filtering by task type Text search within task titles and descriptions Highlighted search results with custom highlighting component •Keyboard Accessibility: Comprehensive keyboard navigation between columns and tasks Keyboard shortcuts for all major actions (add task, move task, etc.) Help dialog showing available shortcuts Technical Implementation

Custom Hooks 

1. useDragAndDrop: Manages the entire drag and drop system, handling both mouse and touch events 
2. useCommandHistory: Implements the command pattern for tracking and executing undoable actions 
3. useKeyboardShortcuts: Manages keyboard shortcuts and navigation 
4. useColumnReordering: Handles the column drag and drop behavior 
5. useTaskMiddleware: Creates a separation between UI events and side effects

Core Architectural Patterns 

1. Command Pattern: Each user action that changes state is represented as a command object with execute and undo methods 
2. Middleware Pattern: UI events flow through middleware that handles side effects and updates Context + Reducer 
3. Pattern: Global state is managed with React Context and useReducer for Redux-like state management without the library
4. Mobile Optimization Enhanced Touch Controls: Custom touch event handling for better mobile experience 
5. Responsive Design: Fully responsive layout that works on all devices Gesture 
6. Recognition: Long press detection for drag operations on mobile 
7. Mobile Scrolling: Auto-scrolling when dragging near screen edges 

Installation & Setup 

Prerequisites 
1. Node.js v18 or higher 
2. npm or yarn package manager 

Running the Project Locally
1. Clone the repository git clone https://github.com/yourusername/kanban-board.git cd kanban-board

2. Install dependencies 
-> npm install or yarn install

3. Start the development server 
npm run dev or yarn dev

4. Note for Windows users: If you encounter issues with the NODE_ENV syntax in the npm scripts, use this command instead: npx tsx server/index.ts Open the application Navigate to http://localhost:5000 in your browser

Technical Constraints Met

1. No third-party drag-and-drop libraries used
2. No external state management libraries used
3. Only functional components and hooks throughout the application
4. Multiple custom hooks for reusable logic
