import { createMiddlewareChain } from './core';
import { apiMiddleware } from './api';
import { loggerMiddleware } from './logger';
import { commandHistoryMiddleware } from './commandHistory';
import { Action } from './types';
import { actionCreators } from './actions';

// Initial state for our application
const initialState = {
  tasks: [],
  isLoading: false,
  error: null,
  filters: {
    status: null,
    type: null,
    searchQuery: ''
  },
  commandHistory: {
    past: [],
    future: []
  }
};

// Create our middleware chain with all middlewares
const middlewareChain = createMiddlewareChain(
  [
    loggerMiddleware,         // Log all actions
    apiMiddleware,            // Handle API calls
    commandHistoryMiddleware, // Handle undo/redo functionality
  ],
  initialState
);

// Create a store-like object that components can use
export const store = {
  // Method to dispatch actions to the middleware chain
  dispatch: (action: Action) => middlewareChain.dispatch(action),
  
  // Method to get the current state
  getState: () => middlewareChain.getState(),
  
  // Helper method to update state directly (simulating a reducer)
  updateState: (newState: any) => middlewareChain.updateState(newState),
  
  // Actions that can be dispatched
  actions: actionCreators
};

// Example of how to use the store:
//
// // Fetch tasks
// store.dispatch(store.actions.fetchTasks());
//
// // Create a new task
// store.dispatch(store.actions.createTask({
//   title: 'New Task',
//   description: 'Task description',
//   status: 'todo',
//   type: 'feature'
// }));
//
// // Move a task to a different column
// store.dispatch(store.actions.moveTask(1, 'in-progress', {
//   targetTaskId: 2,
//   originalStatus: 'todo'
// }));