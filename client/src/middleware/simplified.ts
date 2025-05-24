/**
 * Simplified middleware implementation for Kanban board application
 * This provides a more direct way to use the middleware pattern
 */
import { Task, TaskStatusType } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

// ------ Action Types ------
export const ActionTypes = {
  // Task actions
  MOVE_TASK: 'MOVE_TASK',
  MOVE_TASK_SUCCESS: 'MOVE_TASK_SUCCESS',
  MOVE_TASK_ERROR: 'MOVE_TASK_ERROR',
  
  REORDER_TASK: 'REORDER_TASK',
  REORDER_TASK_SUCCESS: 'REORDER_TASK_SUCCESS',
  REORDER_TASK_ERROR: 'REORDER_TASK_ERROR',
  
  // UI State
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
};

// ------ Action Creators ------
export const moveTask = (
  taskId: number, 
  targetStatus: TaskStatusType, 
  options?: { 
    targetTaskId?: number; 
    position?: number; 
    toTop?: boolean; 
    originalStatus?: TaskStatusType 
  }
) => {
  // Ensure taskId is a valid number
  if (typeof taskId !== 'number' || isNaN(taskId)) {
    console.error('Invalid taskId in moveTask:', taskId);
    throw new Error('Invalid task ID');
  }
  
  return {
    type: ActionTypes.MOVE_TASK,
    payload: {
      taskId,
      targetStatus,
      targetTaskId: options?.targetTaskId,
      position: options?.position,
      toTop: options?.toTop
    },
    meta: {
      originalStatus: options?.originalStatus
    }
  };
};

export const reorderTask = (taskId: number, targetTaskId: number) => ({
  type: ActionTypes.REORDER_TASK,
  payload: {
    taskId,
    targetTaskId
  }
});

// ------ Middleware ------
// Simple middleware to handle task movement
export const taskMiddleware = async (action: any) => {
  // Return early if not a task action
  if (!action.type.startsWith('MOVE_TASK') && !action.type.startsWith('REORDER_TASK')) {
    return action;
  }
  
  try {
    switch (action.type) {
      case ActionTypes.MOVE_TASK: {
        const { taskId, targetStatus, targetTaskId, position, toTop } = action.payload;
        
        // Additional validation to ensure we have a valid task ID
        if (typeof taskId !== 'number' || isNaN(taskId)) {
          console.error('Invalid taskId in MOVE_TASK middleware:', taskId);
          throw new Error('Invalid task ID');
        }
        
        // Build request data
        const data: any = { status: targetStatus };
        if (targetTaskId) data.targetTaskId = targetTaskId;
        if (position !== undefined) data.position = position;
        if (toTop !== undefined) data.toTop = toTop;
        
        console.log(`Middleware - Moving task ${taskId} to ${targetStatus} with options:`, data);
        
        // Make API call
        const result = await apiRequest('PATCH', `/api/tasks/${taskId}/status`, data);
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        
        // Return success action
        return {
          type: ActionTypes.MOVE_TASK_SUCCESS,
          payload: result
        };
      }
      
      case ActionTypes.REORDER_TASK: {
        const { taskId, targetTaskId } = action.payload;
        
        // Additional validation to ensure we have valid task IDs
        if (typeof taskId !== 'number' || isNaN(taskId)) {
          console.error('Invalid source taskId in REORDER_TASK middleware:', taskId);
          throw new Error('Invalid source task ID');
        }
        
        if (typeof targetTaskId !== 'number' || isNaN(targetTaskId)) {
          console.error('Invalid target taskId in REORDER_TASK middleware:', targetTaskId);
          throw new Error('Invalid target task ID');
        }
        
        console.log(`Middleware - Reordering task ${taskId} to be positioned near task ${targetTaskId}`);
        
        // Make API call
        const result = await apiRequest('POST', `/api/tasks/${taskId}/reorder`, {
          targetTaskId
        });
        
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        
        // Return success action
        return {
          type: ActionTypes.REORDER_TASK_SUCCESS,
          payload: result
        };
      }
      
      default:
        return action;
    }
  } catch (error) {
    // Return error action on failure
    return {
      type: `${action.type}_ERROR`,
      payload: error instanceof Error ? error.message : 'An unknown error occurred',
      error: true,
      meta: action.meta
    };
  }
};

// ------ Dispatcher ------
// Simplified dispatcher function to use with the middleware
export const dispatch = async (action: any) => {
  // Log the action
  console.log('Dispatching action:', action.type, action.payload);
  
  // Process the action through middleware
  const result = await taskMiddleware(action);
  
  // Log the result
  console.log('Action result:', result.type, result.payload);
  
  // Return the processed action
  return result;
};