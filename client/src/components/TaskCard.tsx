import React from 'react';
import { Task, TaskType, TaskStatusType } from '@shared/schema';
import { format } from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import HighlightedText from './HighlightedText';

// TODO: Add support for task prioritization with color-coded borders
// Maybe add subtle priority indicators (high/medium/low) - Likhitha

// NOTES: 
// The mobile touch handling was tricky - I had to balance between
// scroll behavior and drag interactions. The current implementation
// with timeouts seems to work well but might need more testing with
// different mobile devices. - Likhitha 5/22

interface TaskCardProps {
  task: Task;
  index: number;
  onDragStart: (task: Task, sourceStatus: TaskStatusType, index: number, event: React.MouseEvent | React.TouchEvent) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number) => void;
  isDropTarget?: boolean;
  searchQuery?: string;
}

const TaskCard: React.FC<TaskCardProps> = ({ 
  task, 
  index, 
  onDragStart, 
  onEdit, 
  onDelete, 
  isDropTarget = false,
  searchQuery = ''
}) => {
  // Detect touch capability
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  
  React.useEffect(() => {
    // Check if device supports touch events
    const touchDevice = ('ontouchstart' in window) || 
                       (navigator.maxTouchPoints > 0) || 
                       ((navigator as any).msMaxTouchPoints > 0);
    setIsTouchDevice(touchDevice);
  }, []);
  // Function to get the badge color class based on task type
  const getTypeColorClass = (type: string) => {
    switch (type) {
      case TaskType.FEATURE:
        return 'bg-orange-100 text-orange-800';
      case TaskType.BUG:
        return 'bg-red-100 text-red-800';
      case TaskType.ENHANCEMENT:
        return 'bg-blue-100 text-blue-800';
      case TaskType.RESEARCH:
        return 'bg-purple-100 text-purple-800';
      case TaskType.DOCUMENTATION:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Prevent default behavior for touch and mouse events to enable custom drag
  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    onDragStart(task, task.status as TaskStatusType, index, e);
  };

  // Variable to track if we're in drag mode on mobile
  const [mobileCardState, setMobileCardState] = React.useState<'normal' | 'hold' | 'drag'>('normal');
  const longPressTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialPositionRef = React.useRef<{x: number, y: number} | null>(null);
  
  // For mobile devices, use a long press approach
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    
    // Clear any existing timeout
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
    }
    
    const touch = e.touches[0];
    initialPositionRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Set a timeout for long press detection (450ms - more responsive)
    longPressTimeoutRef.current = setTimeout(() => {
      // Visual feedback for hold state
      setMobileCardState('hold');
      
      // Haptic feedback if available
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate(50);
        } catch (e) {
          // Vibration not supported
        }
      }
      
      // Start drag immediately after showing hold state feedback
  // This makes drag operation much more responsive
  setMobileCardState('drag');
  onDragStart(task, task.status as TaskStatusType, index, e);
    }, 450);
  };
  
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!initialPositionRef.current || e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - initialPositionRef.current.x;
    const dy = touch.clientY - initialPositionRef.current.y;
    
    // If moved more than 15px, cancel the long press
    if (Math.sqrt(dx * dx + dy * dy) > 15 && mobileCardState === 'normal') {
      if (longPressTimeoutRef.current) {
        clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    }
    
    // If already in drag state, let the parent handlers manage it
    if (mobileCardState === 'drag') {
      // The drag handlers in parent will handle this
    }
  };
  
  const handleTouchEnd = (e: React.TouchEvent) => {
    // Clear the timeout if it exists
    if (longPressTimeoutRef.current) {
      clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    
    // Always reset the card state after touch end
    // This is critical to allow subsequent drag operations to work
    setMobileCardState('normal');
    
    // Reset position tracking
    initialPositionRef.current = null;
  };

  // Handle click on the card to edit it
  const handleCardClick = (e: React.MouseEvent) => {
    // Only trigger edit on desktop devices
    // On mobile devices, we'll rely solely on the edit button
    if (!isTouchDevice && !(e.target as HTMLElement).closest('button')) {
      onEdit(task);
    }
  };

  // Format the date for display
  const formattedDate = task.dueDate 
    ? format(new Date(task.dueDate), 'MMM dd') 
    : '';

  // Determine if the task is in the "done" column for date display
  const isDone = task.status === "done";
  const dateLabel = isDone ? "Completed: " : "Due: ";

  return (
    <div
      className={`task-card bg-white border rounded-lg p-3 sm:p-4 mb-3 cursor-pointer shadow-sm transition-all duration-200 select-none 
        ${!isTouchDevice ? 'hover:shadow-md hover:-translate-y-1' : ''} 
        ${mobileCardState === 'hold' ? 'border-blue-400 shadow-md scale-[0.98]' : ''}
        ${mobileCardState === 'drag' ? 'border-blue-500 shadow-lg scale-[0.95] opacity-90' : 'border-gray-200'}
      `}
      style={{ 
        height: "180px", // Fixed height instead of minHeight for consistency
        display: "flex",
        flexDirection: "column",
        WebkitUserSelect: 'none',
        userSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        touchAction: isTouchDevice ? 'none' : 'auto'
      }}
      draggable="true"
      onDragStart={handleDragStart}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onClick={handleCardClick}
      data-task-id={task.id}
      data-position={task.position}
      data-target-id={task.id}
    >
      <div className="flex justify-between items-start mb-2">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColorClass(task.type)}`}>
          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
        </span>
        <div className="flex items-center space-x-1">
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button 
            className="text-gray-500 hover:text-red-600"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <h4 className="font-medium text-gray-800 mb-2">
        {searchQuery ? (
          <HighlightedText text={task.title} searchQuery={searchQuery} />
        ) : (
          task.title
        )}
      </h4>
      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
        {searchQuery && task.description ? (
          <HighlightedText text={task.description} searchQuery={searchQuery} />
        ) : (
          task.description
        )}
      </p>
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <span className="text-xs text-gray-500">
            {dateLabel}
            <span className="font-medium">{formattedDate}</span>
          </span>
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
