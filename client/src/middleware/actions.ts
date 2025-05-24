import { Action, ActionType, ActionCreators } from './types';
import { Task, TaskStatusType, InsertTask, UpdateTask } from '@shared/schema';

/**
 * Action creators for the application
 * These functions create action objects that can be dispatched to the middleware system
 */
export const actionCreators: ActionCreators = {
  // Task actions
  fetchTasks: (): Action => ({
    type: ActionType.FETCH_TASKS
  }),
  
  createTask: (taskData: InsertTask): Action => ({
    type: ActionType.CREATE_TASK,
    payload: taskData
  }),
  
  updateTask: (id: number, taskData: UpdateTask): Action => ({
    type: ActionType.UPDATE_TASK,
    payload: { id, ...taskData }
  }),
  
  deleteTask: (id: number): Action => ({
    type: ActionType.DELETE_TASK,
    payload: id
  }),
  
  moveTask: (
    taskId: number, 
    status: TaskStatusType, 
    options?: { 
      targetTaskId?: number; 
      position?: number; 
      toTop?: boolean; 
      originalStatus?: TaskStatusType 
    }
  ): Action => ({
    type: ActionType.MOVE_TASK,
    payload: {
      taskId,
      status,
      targetTaskId: options?.targetTaskId,
      position: options?.position,
      toTop: options?.toTop
    },
    meta: {
      originalStatus: options?.originalStatus
    }
  }),
  
  reorderTask: (taskId: number, targetTaskId: number): Action => ({
    type: ActionType.REORDER_TASK,
    payload: {
      taskId,
      targetTaskId
    }
  }),
  
  // UI actions
  setLoading: (isLoading: boolean): Action => ({
    type: ActionType.SET_LOADING,
    payload: isLoading
  }),
  
  setError: (error: string): Action => ({
    type: ActionType.SET_ERROR,
    payload: error,
    error: true
  }),
  
  clearError: (): Action => ({
    type: ActionType.CLEAR_ERROR
  }),
  
  // Filter actions
  setFilter: (filter: { status?: string; type?: string }): Action => ({
    type: ActionType.SET_FILTER,
    payload: filter
  }),
  
  clearFilter: (): Action => ({
    type: ActionType.CLEAR_FILTER
  }),
  
  setSearchQuery: (query: string): Action => ({
    type: ActionType.SET_SEARCH_QUERY,
    payload: query
  }),
  
  // Command history actions
  executeCommand: (command: any): Action => ({
    type: ActionType.EXECUTE_COMMAND,
    payload: command
  }),
  
  undoCommand: (): Action => ({
    type: ActionType.UNDO_COMMAND
  }),
  
  redoCommand: (): Action => ({
    type: ActionType.REDO_COMMAND
  }),
};