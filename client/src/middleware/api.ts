import { Action, Middleware, ActionType } from './types';
import { apiRequest } from '@/lib/queryClient';
import { Task, TaskStatusType } from '@shared/schema';

/**
 * Middleware for handling API calls
 * This separates the API logic from the UI components
 */
export const apiMiddleware: Middleware = api => next => async (action: Action) => {
  // Always pass the action to the next middleware
  const result = next(action);
  
  // Handle API-related actions
  switch (action.type) {
    case ActionType.FETCH_TASKS:
      try {
        api.dispatch({ type: ActionType.SET_LOADING, payload: true });
        const tasks = await apiRequest('GET', '/api/tasks');
        api.dispatch({ 
          type: ActionType.FETCH_TASKS_SUCCESS, 
          payload: tasks 
        });
      } catch (error) {
        api.dispatch({ 
          type: ActionType.FETCH_TASKS_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to fetch tasks',
          error: true
        });
      } finally {
        api.dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
      break;
      
    case ActionType.CREATE_TASK:
      try {
        api.dispatch({ type: ActionType.SET_LOADING, payload: true });
        const task = await apiRequest('POST', '/api/tasks', action.payload);
        api.dispatch({ 
          type: ActionType.CREATE_TASK_SUCCESS, 
          payload: task 
        });
      } catch (error) {
        api.dispatch({ 
          type: ActionType.CREATE_TASK_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to create task',
          error: true
        });
      } finally {
        api.dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
      break;
      
    case ActionType.UPDATE_TASK:
      try {
        const { id, ...taskData } = action.payload;
        api.dispatch({ type: ActionType.SET_LOADING, payload: true });
        const task = await apiRequest('PATCH', `/api/tasks/${id}`, taskData);
        api.dispatch({ 
          type: ActionType.UPDATE_TASK_SUCCESS, 
          payload: task 
        });
      } catch (error) {
        api.dispatch({ 
          type: ActionType.UPDATE_TASK_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to update task',
          error: true
        });
      } finally {
        api.dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
      break;
      
    case ActionType.DELETE_TASK:
      try {
        const taskId = action.payload;
        api.dispatch({ type: ActionType.SET_LOADING, payload: true });
        await apiRequest('DELETE', `/api/tasks/${taskId}`);
        api.dispatch({ 
          type: ActionType.DELETE_TASK_SUCCESS, 
          payload: taskId 
        });
      } catch (error) {
        api.dispatch({ 
          type: ActionType.DELETE_TASK_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to delete task',
          error: true
        });
      } finally {
        api.dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
      break;
      
    case ActionType.MOVE_TASK:
      try {
        const { taskId, status, targetTaskId, position, toTop } = action.payload;
        api.dispatch({ type: ActionType.SET_LOADING, payload: true });
        
        const data: any = { status };
        if (targetTaskId) data.targetTaskId = targetTaskId;
        if (position !== undefined) data.position = position;
        if (toTop !== undefined) data.toTop = toTop;
        
        const task = await apiRequest('PATCH', `/api/tasks/${taskId}/status`, data);
        
        api.dispatch({ 
          type: ActionType.MOVE_TASK_SUCCESS, 
          payload: task,
          meta: { originalStatus: action.meta?.originalStatus } 
        });
      } catch (error) {
        api.dispatch({ 
          type: ActionType.MOVE_TASK_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to move task',
          error: true,
          meta: action.meta
        });
      } finally {
        api.dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
      break;
      
    case ActionType.REORDER_TASK:
      try {
        const { taskId, targetTaskId } = action.payload;
        api.dispatch({ type: ActionType.SET_LOADING, payload: true });
        
        const tasks = await apiRequest('POST', `/api/tasks/${taskId}/reorder`, { 
          targetTaskId 
        });
        
        api.dispatch({ 
          type: ActionType.REORDER_TASK_SUCCESS, 
          payload: tasks
        });
      } catch (error) {
        api.dispatch({ 
          type: ActionType.REORDER_TASK_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to reorder task',
          error: true
        });
      } finally {
        api.dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
      break;
  }
  
  return result;
};