import { useCallback } from 'react';
import { TaskStatusType } from '@shared/schema';
import { moveTask, reorderTask, dispatch } from '@/middleware/simplified';
import { MoveTaskCommand, ReorderTaskCommand } from '@/contexts/CommandHistoryContext';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';

// TODO: Consider refactoring this to make it more testable
// Maybe separate the command creation from the execution?

/**
 * IMPLEMENTATION NOTES:
 * I initially tried to implement this using Redux middleware,
 * but it felt too heavyweight for our needs. Then I tried a
 * simple pub/sub system, but it didn't integrate well with
 * the command pattern for undo/redo.
 * 
 * This custom middleware approach gives us the separation of 
 * concerns without the complexity of Redux. It took a while to
 * figure out how to integrate it with the command pattern though!
 * 
 * - Likhitha (May 22)
 */
export function useTaskMiddleware() {
  // Get command history context for undo/redo
  const { executeCommand } = useCommandHistory();
  
  // Move a task to a different column with command pattern for undo/redo
  const handleMoveTask = useCallback(async (
    task: any, 
    targetStatus: TaskStatusType,
    options?: { 
      targetTaskId?: number; 
      position?: number; 
      toTop?: boolean; 
    }
  ) => {
    if (!task) return;
    
    // Ensure we have a valid task with an ID that's a number
    if (typeof task.id !== 'number' || isNaN(task.id)) {
      console.error('Invalid task ID detected:', task);
      return;
    }
    
    const sourceStatus = task.status as TaskStatusType;
    
    // Create a command for undo/redo functionality
    const command = new MoveTaskCommand(
      task.id,  // Just pass the task ID, not the whole task object
      sourceStatus,
      targetStatus,
      async (t: any, status: TaskStatusType) => {
        // Get the valid task ID
        const taskId = typeof t === 'object' && t ? t.id : t;
        
        // Ensure the task ID is valid
        if (typeof taskId !== 'number' || isNaN(taskId)) {
          console.error('Invalid task ID in command execution:', taskId);
          throw new Error('Invalid task ID');
        }
        
        // This is executed by the command, using our middleware
        await dispatch(moveTask(taskId, status, {
          targetTaskId: options?.targetTaskId,
          position: options?.position,
          toTop: options?.toTop,
          originalStatus: sourceStatus
        }));
      }
    );
    
    // Execute the command
    await executeCommand(command);
  }, [executeCommand]);
  
  // Reorder a task within the same column with command pattern for undo/redo
  const handleReorderTask = useCallback(async (
    taskId: number, 
    targetTaskId: number, 
    tasks: any[], 
    status: TaskStatusType
  ) => {
    // Validate task IDs
    if (typeof taskId !== 'number' || isNaN(taskId)) {
      console.error('Invalid source task ID in reorderTask:', taskId);
      return;
    }
    
    if (typeof targetTaskId !== 'number' || isNaN(targetTaskId)) {
      console.error('Invalid target task ID in reorderTask:', targetTaskId);
      return;
    }
    
    // Filter tasks to get only those in the current column
    const tasksInColumn = tasks.filter(t => t.status === status);
    
    // Create a command for undo/redo functionality
    const command = new ReorderTaskCommand(
      status,
      tasksInColumn,
      async () => {
        // This is executed by the command, using our middleware
        await dispatch(reorderTask(taskId, targetTaskId));
      }
    );
    
    // Execute the command
    await executeCommand(command);
  }, [executeCommand, dispatch]);
  
  return {
    moveTask: handleMoveTask,
    reorderTask: handleReorderTask
  };
}