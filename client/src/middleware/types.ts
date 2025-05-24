/**
 * Middleware system for handling side effects in the Kanban board application
 */

// Action types for our application
export enum ActionType {
  // Task actions
  FETCH_TASKS = 'FETCH_TASKS',
  FETCH_TASKS_SUCCESS = 'FETCH_TASKS_SUCCESS',
  FETCH_TASKS_ERROR = 'FETCH_TASKS_ERROR',
  
  CREATE_TASK = 'CREATE_TASK',
  CREATE_TASK_SUCCESS = 'CREATE_TASK_SUCCESS',
  CREATE_TASK_ERROR = 'CREATE_TASK_ERROR',
  
  UPDATE_TASK = 'UPDATE_TASK',
  UPDATE_TASK_SUCCESS = 'UPDATE_TASK_SUCCESS',
  UPDATE_TASK_ERROR = 'UPDATE_TASK_ERROR',
  
  DELETE_TASK = 'DELETE_TASK',
  DELETE_TASK_SUCCESS = 'DELETE_TASK_SUCCESS',
  DELETE_TASK_ERROR = 'DELETE_TASK_ERROR',
  
  MOVE_TASK = 'MOVE_TASK',
  MOVE_TASK_SUCCESS = 'MOVE_TASK_SUCCESS',
  MOVE_TASK_ERROR = 'MOVE_TASK_ERROR',
  
  REORDER_TASK = 'REORDER_TASK',
  REORDER_TASK_SUCCESS = 'REORDER_TASK_SUCCESS',
  REORDER_TASK_ERROR = 'REORDER_TASK_ERROR',
  
  // UI actions
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  CLEAR_ERROR = 'CLEAR_ERROR',
  
  // Filter actions
  SET_FILTER = 'SET_FILTER',
  CLEAR_FILTER = 'CLEAR_FILTER',
  SET_SEARCH_QUERY = 'SET_SEARCH_QUERY',
  
  // Command history actions
  EXECUTE_COMMAND = 'EXECUTE_COMMAND',
  EXECUTE_COMMAND_SUCCESS = 'EXECUTE_COMMAND_SUCCESS',
  EXECUTE_COMMAND_ERROR = 'EXECUTE_COMMAND_ERROR',
  
  UNDO_COMMAND = 'UNDO_COMMAND',
  UNDO_COMMAND_SUCCESS = 'UNDO_COMMAND_SUCCESS',
  UNDO_COMMAND_ERROR = 'UNDO_COMMAND_ERROR',
  
  REDO_COMMAND = 'REDO_COMMAND',
  REDO_COMMAND_SUCCESS = 'REDO_COMMAND_SUCCESS',
  REDO_COMMAND_ERROR = 'REDO_COMMAND_ERROR',
}

// Basic action structure
export interface Action<T = any> {
  type: ActionType;
  payload?: T;
  meta?: any;
  error?: boolean;
}

// Middleware type definition
export type Middleware = (api: MiddlewareAPI) => 
  (next: (action: Action) => any) => 
  (action: Action) => any;

// Middleware API interface
export interface MiddlewareAPI {
  dispatch: (action: Action) => any;
  getState: () => any;
}

// Action creators interface
export interface ActionCreators {
  [key: string]: (...args: any[]) => Action;
}