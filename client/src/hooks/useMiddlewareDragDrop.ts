import { useState, useCallback, useRef } from 'react';
import { Task, TaskStatusType } from '@shared/schema';
import { useMiddlewareTaskManagement } from './useMiddlewareTaskManagement';

interface DragItem {
  id: number;
  task: Task;
  sourceStatus: TaskStatusType;
  sourceIndex?: number;
}

/**
 * Custom hook to handle drag and drop operations through the middleware system
 * This demonstrates how the middleware pattern separates UI logic from side effects
 */
export function useMiddlewareDragDrop() {
  // State for tracking the current drag operation
  const [isDragging, setIsDragging] = useState(false);
  const [currentItem, setCurrentItem] = useState<DragItem | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<TaskStatusType | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<number | null>(null);
  
  // Reference for touch events
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Get task management functions that use middleware
  const { moveTask, reorderTask } = useMiddlewareTaskManagement();
  
  // Function to start dragging
  const handleDragStart = useCallback((
    task: Task, 
    sourceStatus: TaskStatusType, 
    sourceIndex: number, 
    event: React.MouseEvent | React.TouchEvent
  ) => {
    // Determine initial position based on event type
    let initialX: number;
    let initialY: number;
    
    if ('touches' in event) {
      // It's a touch event
      initialX = event.touches[0].clientX;
      initialY = event.touches[0].clientY;
      
      // Clear any existing timeout
      if (touchTimeout.current) {
        clearTimeout(touchTimeout.current);
      }
      
      // Set a timeout to distinguish between tap and drag on touch devices
      touchTimeout.current = setTimeout(() => {
        setIsDragging(true);
        setCurrentItem({ id: task.id, task, sourceStatus, sourceIndex });
        setDragPosition({ x: initialX, y: initialY });
      }, 200);
    } else {
      // It's a mouse event
      initialX = event.clientX;
      initialY = event.clientY;
      
      setIsDragging(true);
      setCurrentItem({ id: task.id, task, sourceStatus, sourceIndex });
      setDragPosition({ x: initialX, y: initialY });
    }
  }, []);
  
  // Function to handle drag movement
  const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    if (!isDragging || !currentItem) return;
    
    // Get client coordinates based on event type
    let clientX: number;
    let clientY: number;
    
    if ('touches' in event) {
      if (event.touches.length === 0) return;
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Update the position of the drag ghost
    setDragPosition({ x: clientX, y: clientY });
    
    // Get all elements at the current mouse position
    const elementsAtPoint = document.elementsFromPoint(clientX, clientY);
    
    // Direct targeting approach for task containers
    const taskContainer = elementsAtPoint.find(el => el.classList.contains('task-container'));
    const taskCard = elementsAtPoint.find(el => el.classList.contains('task-card'));
    
    // Find column element
    const columnElement = elementsAtPoint.find(el => 
      el.classList.contains('kanban-column-content') || 
      el.closest('.kanban-column-content')
    );
    
    // Determine column ID
    let columnId = null;
    
    if (columnElement) {
      const columnContent = columnElement.classList.contains('kanban-column-content') 
        ? columnElement 
        : columnElement.closest('.kanban-column-content');
      
      columnId = columnContent?.getAttribute('data-column-id');
    }
    
    // Determine target task ID for reordering
    let targetId = null;
    
    // First try to get it from the task container
    if (taskContainer) {
      targetId = parseInt(taskContainer.getAttribute('data-target-id') || '0');
    } 
    // If not found, try to get it from the task card
    else if (taskCard) {
      targetId = parseInt(taskCard.getAttribute('data-task-id') || '0');
    }
    
    // Set drop target column
    if (columnId) {
      setDropTarget(columnId as TaskStatusType);
      
      // Set target task for reordering
      if (targetId && targetId !== currentItem.id) {
        setTargetTaskId(targetId);
      } else {
        setTargetTaskId(null);
      }
    } else {
      // Not over any column
      setDropTarget(null);
      setTargetTaskId(null);
    }
  }, [isDragging, currentItem]);
  
  // Function to end dragging
  const handleDragEnd = useCallback(async () => {
    // Clear touch timeout if it exists
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    
    // If we're not dragging or don't have a current item, just reset states
    if (!isDragging || !currentItem) {
      setIsDragging(false);
      setCurrentItem(null);
      setDropTarget(null);
      setTargetTaskId(null);
      return;
    }

    try {
      // Case 1: Moving to a different column
      if (dropTarget && dropTarget !== currentItem.sourceStatus) {
        // Use middleware to move the task
        await moveTask(currentItem.id, dropTarget, {
          targetTaskId: targetTaskId || undefined,
          toTop: targetTaskId ? false : true
        });
      }
      // Case 2: Reordering within the same column
      else if (dropTarget && dropTarget === currentItem.sourceStatus && targetTaskId) {
        // Use middleware to reorder the task
        await reorderTask(currentItem.id, targetTaskId);
      }
      // Case 3: No valid drop target or same status without target task
      else {
        console.log('No valid drop target or same status, skipping update');
      }
    } catch (error) {
      console.error('Error during drag operation:', error);
    } finally {
      // Reset drag state regardless of outcome
      setIsDragging(false);
      setCurrentItem(null);
      setDropTarget(null);
      setTargetTaskId(null);
    }
  }, [isDragging, currentItem, dropTarget, targetTaskId, moveTask, reorderTask]);
  
  // Set up event listeners when the component mounts
  const setupDragListeners = useCallback(() => {
    // Mouse events
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    // Touch events
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
    
    // Cleanup function
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('touchmove', handleDragMove);
      document.removeEventListener('touchend', handleDragEnd);
    };
  }, [handleDragMove, handleDragEnd]);
  
  return {
    isDragging,
    currentItem,
    dragPosition,
    dropTarget,
    targetTaskId,
    handleDragStart,
    setupDragListeners
  };
}