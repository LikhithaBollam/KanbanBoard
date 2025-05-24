import React, { forwardRef } from 'react';
import { Task, TaskType } from '@shared/schema';
import { format } from 'date-fns';

interface DragGhostProps {
  task: Task | null;
  position: { x: number; y: number };
  isDragging: boolean;
}

const DragGhost = forwardRef<HTMLDivElement, DragGhostProps>(
  ({ task, position, isDragging }, ref) => {
    if (!task) return null;

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

    const formattedDate = task.dueDate ? format(new Date(task.dueDate), 'MMM dd') : '';

    return (
      <div
        ref={ref}
        className={`fixed pointer-events-none -translate-x-1/2 -translate-y-1/2 z-50 transition-opacity ${
          isDragging ? 'opacity-70 sm:opacity-90' : 'opacity-0'
        } w-44 sm:w-64`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
      >
        {/* Ghost card mirrors the task card styling */}
        <div className="task-card bg-white border border-gray-200 rounded-lg p-3 sm:p-4 shadow-md">
          <div className="flex justify-between items-start mb-1 sm:mb-2">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColorClass(
                task.type
              )}`}
            >
              {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
            </span>
          </div>
          <h4 className="font-medium text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base truncate">{task.title}</h4>
          {/* On mobile, we show a more simplified preview with only the title for better scrolling experience */}
          <div className="hidden sm:block">
            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{task.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-xs text-gray-500">
                  Due: <span className="font-medium">{formattedDate}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

DragGhost.displayName = 'DragGhost';

export default DragGhost;
