import { useCallback } from 'react';
import { useMiddleware } from '@/middleware/useMiddleware';
import { Task, TaskStatusType, InsertTask, UpdateTask } from '@shared/schema';
import { MoveTaskCommand, ReorderTaskCommand } from '@/contexts/CommandHistoryContext';
import { useMiddlewareCommandHistory } from './useMiddlewareCommandHistory';

/**
 * Custom hook to manage tasks through the middleware system
 * This separates the UI logic from side effects like API calls
 */
export function useMiddlewareTaskManagement() {
  // Connect to the middleware system for task data
  const { state, dispatch, actions } = useMiddleware(state => ({
    tasks: state.tasks,
    isLoading: state.isLoading,
    error: state.error
  }));
  
  // Connect to the command history middleware for undo/redo
  const commandHistory = useMiddlewareCommandHistory();
  
  // Fetch all tasks
  const fetchTasks = useCallback(() => {
    dispatch(actions.fetchTasks());
  }, [dispatch, actions]);
  
  // Create a new task
  const createTask = useCallback((taskData: InsertTask) => {
    dispatch(actions.createTask(taskData));
  }, [dispatch, actions]);
  
  // Update an existing task
  const updateTask = useCallback((id: number, taskData: UpdateTask) => {
    dispatch(actions.updateTask(id, taskData));
  }, [dispatch, actions]);
  
  // Delete a task
  const deleteTask = useCallback((id: number) => {
    dispatch(actions.deleteTask(id));
  }, [dispatch, actions]);
  
  // Move a task to a different column with command pattern for undo/redo
  const moveTask = useCallback(async (
    taskId: number, 
    targetStatus: TaskStatusType,
    options?: { 
      targetTaskId?: number; 
      position?: number; 
      toTop?: boolean; 
    }
  ) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const sourceStatus = task.status as TaskStatusType;
    
    // Create a command for undo/redo functionality
    const command = new MoveTaskCommand(
      task.id, // Use task ID directly, not the whole task object
      sourceStatus,
      targetStatus,
      async (t: Task | number, status: TaskStatusType) => {
        // This is executed by the command
        // Extract the ID whether we have a task object or just an ID
        const taskId = typeof t === 'object' && t !== null ? t.id : t;
        
        if (typeof taskId !== 'number' || isNaN(taskId)) {
          console.error('Invalid task ID in middleware command execution:', taskId);
          throw new Error('Invalid task ID');
        }
        
        dispatch(actions.moveTask(taskId, status, {
          targetTaskId: options?.targetTaskId,
          position: options?.position,
          toTop: options?.toTop,
          originalStatus: sourceStatus
        }));
      }
    );
    
    // Execute the command through the command history middleware
    await commandHistory.executeCommand(command);
  }, [state.tasks, dispatch, actions, commandHistory]);
  
  // Reorder a task within the same column with command pattern for undo/redo
  const reorderTask = useCallback(async (taskId: number, targetTaskId: number) => {
    const task = state.tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const status = task.status as TaskStatusType;
    const tasksInColumn = state.tasks.filter(t => t.status === status);
    
    // Create a command for undo/redo functionality
    const command = new ReorderTaskCommand(
      status,
      tasksInColumn,
      async () => {
        // Validate IDs to ensure they're numbers
        if (typeof taskId !== 'number' || isNaN(taskId)) {
          console.error('Invalid source task ID in reorderTask:', taskId);
          throw new Error('Invalid source task ID');
        }
        
        if (typeof targetTaskId !== 'number' || isNaN(targetTaskId)) {
          console.error('Invalid target task ID in reorderTask:', targetTaskId);
          throw new Error('Invalid target task ID');
        }
        
        // This is executed by the command
        dispatch(actions.reorderTask(taskId, targetTaskId));
      }
    );
    
    // Execute the command through the command history middleware
    await commandHistory.executeCommand(command);
  }, [state.tasks, dispatch, actions, commandHistory]);
  
  return {
    tasks: state.tasks,
    isLoading: state.isLoading,
    error: state.error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    reorderTask
  };
}