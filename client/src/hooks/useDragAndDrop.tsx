import { useState, useRef, useCallback, useEffect } from "react";
import { Task, TaskStatus, TaskStatusType } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { DragItem } from "@/lib/types";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// NOTES:
// I initially tried using react-dnd for this but decided to build my own
// drag-and-drop system since the assignment requires a custom implementation.
// This was quite challenging but gave me more control over the UX.
// - Likhitha

export const useDragAndDrop = () => {
  const { toast } = useToast();
  // Main drag state
  const [isDragging, setIsDragging] = useState(false);
  const [currentItem, setCurrentItem] = useState<DragItem | null>(null);
  const [dragPosition, setDragPosition] = useState({ x: 0, y: 0 });
  const [dropTarget, setDropTarget] = useState<TaskStatusType | null>(null);
  const [targetTaskId, setTargetTaskId] = useState<number | null>(null);
  const dragGhostRef = useRef<HTMLDivElement>(null);
  // Had to add this timeout to fix accidental drags on mobile
  const touchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to start dragging
  const handleDragStart = useCallback((task: Task, sourceStatus: TaskStatusType, sourceIndex: number, event: React.MouseEvent | React.TouchEvent) => {
    event.stopPropagation();
    
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
      
      // On mobile devices, we want to make this a more deliberate action
      // by requiring a longer press or a more significant movement
      touchTimeout.current = setTimeout(() => {
        // Start dragging after a longer delay on mobile (500ms)
        // This gives users time to decide if they want to scroll or drag
        setIsDragging(true);
        setCurrentItem({ id: task.id, task, sourceStatus, sourceIndex });
        setDragPosition({ x: initialX, y: initialY });
        
        // Add visual feedback for the user that drag mode is active
        const vibrate = () => {
          if ('vibrate' in navigator) {
            try {
              navigator.vibrate(50); // Short vibration to indicate drag started
            } catch (e) {
              // Vibration API not supported or failed
            }
          }
        };
        vibrate();
      }, 500); // Longer delay for mobile to distinguish between scroll and drag
    } else {
      // It's a mouse event
      initialX = event.clientX;
      initialY = event.clientY;
      
      setIsDragging(true);
      setCurrentItem({ id: task.id, task, sourceStatus, sourceIndex });
      setDragPosition({ x: initialX, y: initialY });
    }
  }, []);

  // Enable auto-scrolling when dragging near edges
  const scrollContainerIfNeeded = useCallback((clientY: number) => {
    if (!isDragging) return;
    
    const windowHeight = window.innerHeight;
    const scrollThreshold = 80; // pixels from top/bottom to trigger scroll
    const scrollSpeed = 10; // how many pixels to scroll
    
    // Near the top of the screen - scroll up
    if (clientY < scrollThreshold) {
      window.scrollBy(0, -scrollSpeed);
    }
    // Near the bottom of the screen - scroll down
    else if (clientY > windowHeight - scrollThreshold) {
      window.scrollBy(0, scrollSpeed);
    }
  }, [isDragging]);
  
  // Function to handle drag movement - mobile-optimized
  const handleDragMove = useCallback((event: MouseEvent | TouchEvent) => {
    // For mobile: allow drag to work immediately once initiated
    if (!currentItem) return;
    
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
    
    // Check if we need to auto-scroll the window
    scrollContainerIfNeeded(clientY);
    
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
    
    // Gather all needed information for drop target
    let columnId = null;
    let isTopTarget = false;
    let targetId = null;
    let isTargetTopHalf = false;
    
    // Get column information
    if (columnElement) {
      const columnContent = columnElement.classList.contains('kanban-column-content') 
        ? columnElement 
        : columnElement.closest('.kanban-column-content');
      
      columnId = columnContent?.getAttribute('data-column-id');
      isTopTarget = columnContent?.getAttribute('data-column-target') === 'top';
      console.log(`Column drop target: ${columnId}, isTopTarget: ${isTopTarget}`);
      
      // If we're at the top of an empty column or explicitly targeting column top
      if (isTopTarget && !taskContainer && !taskCard) {
        // We want to place at the top of this column
        setDropTarget(columnId as TaskStatusType);
        setTargetTaskId(null);
        return;
      }
    }
    
    // Determine target task id and position within task
    if (taskContainer && currentItem) {
      const rect = taskContainer.getBoundingClientRect();
      isTargetTopHalf = clientY < rect.top + rect.height / 2;
      
      // Get task ID from container
      targetId = parseInt(taskContainer.getAttribute('data-target-id') || '0');
      
      if (isTargetTopHalf) {
        console.log('Cursor in TOP half of card - will place BEFORE target');
      } else {
        console.log('Cursor in BOTTOM half of card - will place AFTER target');
      }
    } 
    // If not found from container, try to get it from the task card
    else if (taskCard) {
      targetId = parseInt(taskCard.getAttribute('data-task-id') || '0');
      
      // For task cards, determine position
      const rect = taskCard.getBoundingClientRect();
      isTargetTopHalf = clientY < rect.top + rect.height / 2;
    }
    
    // Set drop target information
    if (columnId) {
      setDropTarget(columnId as TaskStatusType);
      
      // Set target task ID - critical for proper dragging in all directions
      if (targetId && targetId !== currentItem.id) {
        console.log(`Setting target task: ${targetId} in column: ${columnId}`);
        setTargetTaskId(targetId);
        
        // Store whether we're targeting top or bottom half of the card
        // This helps when deciding reordering positions
        const cardElement = document.querySelector(`[data-task-id="${targetId}"]`);
        if (cardElement) {
          cardElement.setAttribute('data-drop-position', isTargetTopHalf ? 'before' : 'after');
          
          // Store this information in a data attribute we can access during drop
          if (currentItem) {
            cardElement.setAttribute('data-drop-exact-position', isTargetTopHalf ? 'before' : 'after');
          }
        }
      } else {
        setTargetTaskId(null);
      }
    } else {
      // Not over any column
      setDropTarget(null);
      setTargetTaskId(null);
    }
  }, [isDragging, currentItem]);

  // Function to end dragging - completely reset state to allow multiple drag operations
  const handleDragEnd = useCallback(async () => {
    // Clear touch timeout if it exists
    if (touchTimeout.current) {
      clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
    
    // Save current values before clearing state
    const savedItem = currentItem;
    const savedDropTarget = dropTarget;
    const savedTargetTaskId = targetTaskId;

    console.log('Drag end with states:', {
      isDragging,
      currentItemId: currentItem?.id,
      dropTarget,
      targetTaskId
    });
    
    // Use the saved values for the drop operation
    // This ensures we can process the drop correctly
    if (!savedItem) {
      // Reset the state completely
      setIsDragging(false);
      setCurrentItem(null);
      setDropTarget(null);
      setTargetTaskId(null);
      return;
    }

    try {
      // Case 1: Moving to a different column
      if (savedDropTarget && savedDropTarget !== savedItem.sourceStatus) {
        console.log('Moving to different column:', dropTarget);
        
        // Validate task ID to ensure it's a number
        if (typeof savedItem.id !== 'number' || isNaN(savedItem.id)) {
          console.error('Invalid task ID in drag end handler:', savedItem);
          toast({
            title: "Error moving task",
            description: "Failed to identify the task being moved.",
            variant: "destructive"
          });
          return;
        }
        
        const data: any = { 
          status: savedDropTarget
        };
        
        // If we have a target task ID, we're placing at a specific position
        if (savedTargetTaskId) {
          data.targetTaskId = savedTargetTaskId;
          
          // Get the precise position information from the DOM
          const targetCard = document.querySelector(`[data-task-id="${savedTargetTaskId}"]`);
          if (targetCard && targetCard.hasAttribute('data-drop-exact-position')) {
            // Use the exact position where the card was dropped
            const exactPosition = targetCard.getAttribute('data-drop-exact-position');
            data.placeBefore = exactPosition === 'before'; // true if 'before', false if 'after'
            console.log(`Using EXACT position: ${exactPosition} for task ${savedItem.id} relative to ${savedTargetTaskId}`);
          }
          
          console.log(`Moving to different column with target task position: ${savedTargetTaskId}`);
        } 
        // If no target task ID, place at the top by default
        else {
          data.toTop = true;
          console.log('PLACING at TOP position of column (no target task ID)');
        }
        
        try {
          // Update the task status on the server
          await apiRequest('PATCH', `/api/tasks/${savedItem.id}/status`, data);
        } catch (error) {
          console.error('Error updating task status:', error);
          toast({
            title: "Error moving task",
            description: "Failed to update task status on the server.",
            variant: "destructive"
          });
        }
        
        // Invalidate the tasks cache to trigger a refetch
        queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      }
      // Case 2: Reordering within the same column
      else if (savedDropTarget && savedDropTarget === savedItem.sourceStatus) {
        console.log('Reordering within column. Task ID:', savedItem.id, 'Target Task ID:', savedTargetTaskId);
        
        // Validate source task ID to ensure it's a number
        if (typeof savedItem.id !== 'number' || isNaN(savedItem.id)) {
          console.error('Invalid source task ID in reordering:', savedItem);
          toast({
            title: "Error reordering task",
            description: "Failed to identify the task being moved.",
            variant: "destructive"
          });
          return;
        }
        
        // Handle reordering with better position detection
        try {
          if (savedTargetTaskId && savedItem.id !== savedTargetTaskId) {
            // Get the target card and determine drop position
            const targetCard = document.querySelector(`[data-task-id="${savedTargetTaskId}"]`);
            
            // Get the exact position from the DOM if available
            let finalPosition = 'after'; // Default
            
            if (targetCard && targetCard.hasAttribute('data-drop-exact-position')) {
              finalPosition = targetCard.getAttribute('data-drop-exact-position') || 'after';
              console.log(`Using EXACT drop position from DOM: ${finalPosition}`);
            } else {
              // Fallback to the old calculation method if needed
              try {
                const tasksResponse = await apiRequest('GET', '/api/tasks');
                if (Array.isArray(tasksResponse)) {
                  const currentTask = tasksResponse.find(t => t.id === savedItem.id);
                  const targetTask = tasksResponse.find(t => t.id === savedTargetTaskId);
                  
                  if (currentTask && targetTask && 
                      currentTask.status === targetTask.status) {
                    // Calculate if we're moving up or down
                    const isMovingDown = (currentTask.position || 0) < (targetTask.position || 0);
                    finalPosition = isMovingDown ? 'after' : 'before';
                    console.log(`${isMovingDown ? 'DOWNWARD' : 'UPWARD'} MOVEMENT - Using ${finalPosition} position`);
                  }
                }
              } catch (err) {
                console.error('Error determining task position:', err);
              }
            }
            
            console.log(`Reordering task ${savedItem.id} ${finalPosition} task ${savedTargetTaskId}`);
            
            // Add position data to the reorder request
            await apiRequest('POST', `/api/tasks/${savedItem.id}/reorder`, { 
              targetTaskId: savedTargetTaskId,
              position: finalPosition
            });
          } else {
            // Move to top/bottom of column if no specific target
            console.log(`Moving task ${savedItem.id} to top of ${savedDropTarget} column`);
            await apiRequest('PATCH', `/api/tasks/${savedItem.id}/status`, { 
              status: savedDropTarget,
              toTop: true
            });
          }
          
          // Refresh data
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
        } catch (error) {
          console.error('Error reordering task:', error);
          toast({
            title: "Error reordering task",
            description: "Failed to reorder the task. Please try again.",
            variant: "destructive"
          });
        }
      } else {
        console.log('No valid drop target or same status, skipping update');
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      // Clean up any data attributes we added for positioning
      document.querySelectorAll('[data-drop-exact-position]').forEach(el => {
        el.removeAttribute('data-drop-exact-position');
      });
      
      // Reset states immediately after operation completes
      // Critical to avoid flicker and ensure next drag works properly
      setIsDragging(false);
      setCurrentItem(null);
      setDropTarget(null);
      setTargetTaskId(null);
    }
  }, [isDragging, currentItem, dropTarget, targetTaskId]);

  // Set up global event listeners for mouse and touch events
  useEffect(() => {
    // Only add listeners when dragging
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('touchmove', handleDragMove, { passive: true });
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchend', handleDragEnd);
      
      // For better touch experience - prevent page scrolling during drag
      const preventDefaultTouch = (e: TouchEvent) => {
        if (currentItem && e.touches.length === 1) {
          // Prevent the browser from scrolling during drag
          e.preventDefault();
        }
      };
      
      // Use capture phase to have priority over other handlers
      window.addEventListener('touchmove', preventDefaultTouch, { passive: false, capture: true });
      
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('touchmove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchend', handleDragEnd);
        window.removeEventListener('touchmove', preventDefaultTouch, { capture: true });
      };
    }
  }, [isDragging, currentItem, handleDragMove, handleDragEnd]);

  // Cancel dragging on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDragging) {
        setIsDragging(false);
        setCurrentItem(null);
        setDropTarget(null);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDragging]);

  return {
    isDragging,
    currentItem,
    dragPosition,
    dropTarget,
    targetTaskId,
    dragGhostRef,
    handleDragStart,
    handleDragEnd,
    // Make internal state accessible for external handlers
    setIsDragging,
    setCurrentItem,
    setDropTarget,
    setTargetTaskId
  };
};
