import React from 'react';
import { Task, TaskStatus, TaskStatusType } from '@shared/schema';
import TaskCard from './TaskCard';
import { Plus, GripVertical } from 'lucide-react';

interface KanbanColumnProps {
  id: TaskStatusType;
  title: string;
  tasks: Task[];
  count: number;
  color: string;
  index: number;
  onDragStart: (task: Task, sourceStatus: TaskStatusType, index: number, event: React.MouseEvent | React.TouchEvent) => void;
  isDropTarget: boolean;
  targetTaskId?: number | null;
  onAddTask: (status: TaskStatusType) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number) => void;
  onDeleteColumn?: (columnId: TaskStatusType) => void;
  onColumnDragStart?: (columnId: TaskStatusType) => void;
  onColumnDragOver?: (columnId: TaskStatusType) => void;
  onColumnDragEnd?: () => void;
  isDraggingColumn?: TaskStatusType | null;
  searchQuery?: string;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({
  id,
  title,
  tasks,
  count,
  color,
  index,
  onDragStart,
  isDropTarget,
  targetTaskId,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onDeleteColumn,
  onColumnDragStart,
  onColumnDragOver,
  onColumnDragEnd,
  isDraggingColumn,
  searchQuery = ''
}) => {
  // Handle task drag start with the column's status context
  const handleTaskDragStart = (task: Task, sourceStatus: TaskStatusType, taskIndex: number, event: React.MouseEvent | React.TouchEvent) => {
    // Add a small delay for mobile touch events to ensure the drag state is properly initialized
    if ('touches' in event) {
      // For touch events, we need a more reliable approach
      setTimeout(() => {
        onDragStart(task, id, taskIndex, event);
      }, 10);
    } else {
      // For mouse events, proceed immediately
      onDragStart(task, id, taskIndex, event);
    }
  };

  // Column drag and drop handlers
  const handleColumnDragStart = () => {
    if (onColumnDragStart) {
      onColumnDragStart(id);
    }
  };

  const handleColumnDragOver = () => {
    if (onColumnDragOver) {
      onColumnDragOver(id);
    }
  };

  // Determine if this column is being dragged
  const isBeingDragged = (isDraggingColumn !== null && isDraggingColumn === id);

  return (
    <div 
      className={`kanban-column bg-gray-50 rounded-lg shadow-md md:w-1/3 min-w-[280px] flex flex-col transition-transform duration-200 border-none cursor-grab
                 ${isBeingDragged ? 'dragging-column' : ''}`}
      data-column-id={id}
      data-column-index={index}
      style={{ 
        border: 'none',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
      draggable={true}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', id);
        handleColumnDragStart();
      }}
      onDragOver={(e) => {
        e.preventDefault();
        handleColumnDragOver();
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (onColumnDragEnd) onColumnDragEnd();
      }}
      onDragEnd={onColumnDragEnd}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-100 rounded-t-lg">
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full ${color} mr-2`}></div>
          <h3 className="font-semibold text-lg text-gray-700">{title}</h3>
          <span className="ml-2 bg-white text-gray-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
            {count}
          </span>
        </div>
        <div className="flex items-center">

          <div className="relative dropdown">
            <button 
              className="text-gray-500 hover:text-primary focus:outline-none dropdown-toggle"
              onClick={(e) => {
                const dropdown = e.currentTarget.parentElement?.querySelector('.dropdown-menu');
                if (dropdown) {
                  dropdown.classList.toggle('show');
                }
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {/* Dropdown Menu */}
            <div className="dropdown-menu absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg hidden z-50">
              <div className="py-1 border border-gray-200 rounded-md">
                {/* Only show delete option for custom columns */}
                {id !== 'todo' && id !== 'in-progress' && id !== 'done' && (
                  <button
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      // Hide the dropdown
                      const dropdown = document.querySelector('.dropdown-menu.show');
                      if (dropdown) dropdown.classList.remove('show');
                      
                      // Delete column immediately without confirmation
                      if (onDeleteColumn) onDeleteColumn(id);
                    }}
                  >
                    Delete Column
                  </button>
                )}
                
                {/* Always show add task option */}
                <button
                  className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-gray-100"
                  onClick={(e) => {
                    // Hide the dropdown
                    const dropdown = document.querySelector('.dropdown-menu.show');
                    if (dropdown) dropdown.classList.remove('show');
                    
                    onAddTask(id);
                  }}
                >
                  Add Task
                </button>
              </div>
            </div>
            
            {/* We'll use a className approach instead of inline styles */}
          </div>
        </div>
      </div>
      
      {/* Column Content */}
      <div 
        className={`kanban-column-content p-3 sm:p-4 flex-1 overflow-y-scroll column-scroll touch-pan-y
                   ${isDropTarget ? 'drag-over' : ''}`}
        style={{ 
          height: "calc(100% - 120px)",
          overflowY: "scroll",
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          scrollbarWidth: 'thin',
          scrollbarColor: '#90A4AE #EDF2F7',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        data-column-id={id}
        data-column-target="top" // Important: This marks the column as a potential drop target
      >
        {/* Subtle indicator at the top of column when dragging - removed blue line */}
        {isDropTarget && !targetTaskId && (
          <div className="h-1 bg-transparent w-full mb-4"></div>
        )}
        {tasks
          .sort((a, b) => (a.position || 0) - (b.position || 0))
          .map((task, taskIndex) => (
            <div 
              key={task.id} 
              className="task-container relative p-2 mt-3 first:mt-0 rounded-lg transition-all duration-200"
              style={{ 
                border: '2px solid transparent',
                backgroundColor: 'transparent'
              }}
              data-target-id={task.id}
            >
              {/* Subtle indicator that appears where the card will be placed - removed blue line */}
              {targetTaskId === task.id && (
                <div className="h-1.5 bg-gray-200 w-full rounded absolute -top-3 left-0"></div>
              )}
              <TaskCard
                task={task}
                index={taskIndex}
                onDragStart={handleTaskDragStart}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
                isDropTarget={targetTaskId === task.id}
                searchQuery={searchQuery}
              />
            </div>
          ))}
      </div>
      
      {/* Add Task Button (Column-specific) */}
      <div className="p-3 border-t border-gray-200">
        <button 
          className="w-full flex items-center justify-center py-2 text-sm text-gray-600 hover:text-primary hover:bg-gray-50 rounded-md transition-colors duration-200"
          onClick={() => onAddTask(id)}
        >
          <Plus className="h-5 w-5 mr-1" />
          Add Task
        </button>
      </div>
    </div>
  );
};

export default KanbanColumn;
