import React, { useEffect } from 'react';
import { useMiddleware } from '@/middleware/useMiddleware';
import { useMiddlewareTaskManagement } from '@/hooks/useMiddlewareTaskManagement';
import { useMiddlewareDragDrop } from '@/hooks/useMiddlewareDragDrop';
import { TaskStatusType } from '@shared/schema';

/**
 * Example component showing how to use the middleware pattern
 * This demonstrates how middleware separates UI logic from side effects
 */
const MiddlewareExample: React.FC = () => {
  // Get task data and operations through middleware
  const { 
    tasks, 
    isLoading, 
    error, 
    fetchTasks, 
    createTask, 
    updateTask, 
    deleteTask 
  } = useMiddlewareTaskManagement();
  
  // Get drag and drop functionality through middleware
  const {
    isDragging,
    currentItem,
    dragPosition,
    handleDragStart,
    setupDragListeners
  } = useMiddlewareDragDrop();
  
  // Setup drag and drop event listeners
  useEffect(() => {
    const cleanup = setupDragListeners();
    return cleanup;
  }, [setupDragListeners]);
  
  // Fetch tasks when the component mounts
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);
  
  // Example handler for creating a new task
  const handleCreateTask = () => {
    createTask({
      title: 'New Task',
      description: 'Created using middleware pattern',
      status: 'todo',
      type: 'feature'
    });
  };
  
  // Example handler for updating a task
  const handleUpdateTask = (id: number) => {
    updateTask(id, {
      title: 'Updated Task',
      description: 'Updated using middleware pattern'
    });
  };
  
  // Example handler for deleting a task
  const handleDeleteTask = (id: number) => {
    deleteTask(id);
  };
  
  // Example of how a task card would use the drag and drop functionality
  const renderTaskCard = (task: any, status: TaskStatusType, index: number) => (
    <div 
      key={task.id}
      className="task-card"
      data-task-id={task.id}
      draggable
      onMouseDown={(e) => handleDragStart(task, status, index, e)}
      onTouchStart={(e) => handleDragStart(task, status, index, e)}
    >
      <h3>{task.title}</h3>
      <p>{task.description}</p>
      <div className="task-actions">
        <button onClick={() => handleUpdateTask(task.id)}>Edit</button>
        <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
      </div>
    </div>
  );
  
  return (
    <div className="middleware-example">
      <h1>Middleware Pattern Example</h1>
      
      {isLoading && <div className="loading">Loading tasks...</div>}
      {error && <div className="error">Error: {error}</div>}
      
      <button onClick={handleCreateTask}>Create New Task</button>
      
      <div className="kanban-board">
        {/* Todo Column */}
        <div className="kanban-column">
          <h2>To Do</h2>
          <div className="kanban-column-content" data-column-id="todo">
            {tasks
              .filter(task => task.status === 'todo')
              .map((task, index) => renderTaskCard(task, 'todo', index))
            }
          </div>
        </div>
        
        {/* In Progress Column */}
        <div className="kanban-column">
          <h2>In Progress</h2>
          <div className="kanban-column-content" data-column-id="in-progress">
            {tasks
              .filter(task => task.status === 'in-progress')
              .map((task, index) => renderTaskCard(task, 'in-progress', index))
            }
          </div>
        </div>
        
        {/* Done Column */}
        <div className="kanban-column">
          <h2>Done</h2>
          <div className="kanban-column-content" data-column-id="done">
            {tasks
              .filter(task => task.status === 'done')
              .map((task, index) => renderTaskCard(task, 'done', index))
            }
          </div>
        </div>
      </div>
      
      {/* Drag Ghost */}
      {isDragging && currentItem && (
        <div 
          className="drag-ghost"
          style={{
            position: 'fixed',
            left: dragPosition.x,
            top: dragPosition.y,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1000,
            opacity: 0.8
          }}
        >
          <h3>{currentItem.task.title}</h3>
          <p>{currentItem.task.description}</p>
        </div>
      )}
    </div>
  );
};

export default MiddlewareExample;