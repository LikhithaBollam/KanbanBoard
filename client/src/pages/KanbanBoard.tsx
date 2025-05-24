import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Task, TaskStatus, TaskStatusType } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import KanbanColumn from '@/components/KanbanColumn';
import AddTaskModal from '@/components/AddTaskModal';
import AddColumnModal from '@/components/AddColumnModal';
import DragGhost from '@/components/DragGhost';
import CommandHistoryToolbar from '@/components/CommandHistoryToolbar';
import KeyboardHelp from '@/components/KeyboardHelp';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';
import { useColumnReordering } from '@/hooks/useColumnReordering';
import { ColumnData } from '@/lib/types';
import { Search, Filter, Clipboard } from 'lucide-react';
import KeyboardShortcutsInfo from '@/components/KeyboardShortcutsInfo';
import { useToast } from '@/hooks/use-toast';
import { useCommandHistory, MoveTaskCommand, ReorderTaskCommand } from '@/contexts/CommandHistoryContext';
import { useKeyboardControls } from '@/hooks/useKeyboardControls';

// Import middleware for task operations
import { useTaskMiddleware } from '@/hooks/useTaskMiddleware';

const KanbanBoard: React.FC = () => {
  // State for the modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [initialStatus, setInitialStatus] = useState<TaskStatusType>(TaskStatus.TODO);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  // State for storing custom columns and rendering updates
  const [customColumns, setCustomColumns] = useState<ColumnData[]>([]);
  const [forceUpdate, setForceUpdate] = useState(0); // For forcing re-renders
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All Tasks');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
  const [focusedTaskId, setFocusedTaskId] = useState<number | null>(null);
  const [focusedColumnIndex, setFocusedColumnIndex] = useState<number | null>(null);
  
  // References for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const columnRefs = useRef<Array<HTMLDivElement | null>>([null, null, null]);
  const taskRefs = useRef<Map<number, HTMLElement>>(new Map());
  
  const { toast } = useToast();

  // Fetch tasks from API
  const { data: tasks = [], isLoading, error } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Extract unique task types for filtering
  const taskTypes = React.useMemo(() => {
    const types = new Set<string>();
    tasks.forEach(task => {
      if (task.type) types.add(task.type);
    });
    return Array.from(types);
  }, [tasks]);

  // COMPLETELY NEW APPROACH: Filter and prepare tasks for display
  // First apply search and type filters
  const filteredBySearchAndType = React.useMemo(() => {
    console.log("Filtering by search and type:", { searchQuery, typeFilter });
    
    return tasks.filter(task => {
      // Search filter - case insensitive search in title and description
      const matchesSearch = searchQuery === '' || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // Type filter - case insensitive
      const matchesType = typeFilter === 'All Types' || 
        task.type.toLowerCase() === typeFilter.toLowerCase();
      
      return matchesSearch && matchesType;
    });
  }, [tasks, searchQuery, typeFilter]);
  
  // Determine if we should show a task type based on type filter
  const shouldShowTaskType = React.useCallback((taskType: string) => {
    return typeFilter === 'All Types' || taskType.toLowerCase() === typeFilter.toLowerCase();
  }, [typeFilter]);
  
  // Now prepare the tasks for each column based on status filter
  const todoTasks = React.useMemo(() => {
    if (statusFilter !== 'All Tasks' && statusFilter !== 'To Do') {
      return []; // Return empty if filtering for a different status
    }
    return filteredBySearchAndType.filter(task => task.status === 'todo');
  }, [filteredBySearchAndType, statusFilter]);
  
  const inProgressTasks = React.useMemo(() => {
    if (statusFilter !== 'All Tasks' && statusFilter !== 'In Progress') {
      return []; // Return empty if filtering for a different status
    }
    return filteredBySearchAndType.filter(task => task.status === 'in-progress');
  }, [filteredBySearchAndType, statusFilter]);
  
  const doneTasks = React.useMemo(() => {
    if (statusFilter !== 'All Tasks' && statusFilter !== 'Done') {
      return []; // Return empty if filtering for a different status
    }
    return filteredBySearchAndType.filter(task => task.status === 'done');
  }, [filteredBySearchAndType, statusFilter]);
  
  // This function gets tasks for a custom column
  const getCustomColumnTasks = (columnId: string) => {
    return filteredBySearchAndType.filter(task => task.status === columnId);
  };
  
  // Determine which columns to show based on status filter
  const showTodoColumn = statusFilter === 'All Tasks' || statusFilter === 'To Do';
  const showInProgressColumn = statusFilter === 'All Tasks' || statusFilter === 'In Progress';
  const showDoneColumn = statusFilter === 'All Tasks' || statusFilter === 'Done';
  
  // Get all unique task types in the filtered results for display
  const filteredTaskTypes = React.useMemo(() => {
    const types = new Set<string>();
    filteredBySearchAndType.forEach(task => {
      if (task.type) types.add(task.type);
    });
    return Array.from(types);
  }, [filteredBySearchAndType]);

  // Define the default columns 
  const defaultColumns = [
    { 
      id: TaskStatus.TODO, 
      title: 'To Do', 
      colorClass: 'bg-warning', 
      tasks: todoTasks,
      index: 0
    },
    { 
      id: TaskStatus.IN_PROGRESS, 
      title: 'In Progress', 
      colorClass: 'bg-primary', 
      tasks: inProgressTasks,
      index: 1
    },
    { 
      id: TaskStatus.DONE, 
      title: 'Done', 
      colorClass: 'bg-success', 
      tasks: doneTasks,
      index: 2
    }
  ];
  
  // Combine default columns with custom columns and assign tasks to custom columns
  const allColumns = [
    ...defaultColumns, 
    ...customColumns.map((col, idx) => ({
      ...col,
      tasks: getCustomColumnTasks(col.id),
      index: defaultColumns.length + idx
    }))
  ];
  
  // Set this as our initial columns
  const initialColumns = allColumns;

  // Set up columns directly instead of using the custom hook
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns);
  const [draggedColumnId, setDraggedColumnId] = useState<TaskStatusType | null>(null);
  
  // Full column drag and drop implementation
  const handleColumnDragStart = (columnId: TaskStatusType) => {
    setDraggedColumnId(columnId);
  };
  
  const handleColumnDragOver = (targetColumnId: TaskStatusType) => {
    if (!draggedColumnId || draggedColumnId === targetColumnId) return;
    
    // Find the indices of the source and target columns
    const sourceIndex = columns.findIndex(col => col.id === draggedColumnId);
    const targetIndex = columns.findIndex(col => col.id === targetColumnId);
    
    if (sourceIndex === -1 || targetIndex === -1) return;
    
    // Make a copy of the columns array
    const newColumns = [...columns];
    
    // Remove the dragged column from the array
    const [draggedColumn] = newColumns.splice(sourceIndex, 1);
    
    // Insert it at the target position
    newColumns.splice(targetIndex, 0, draggedColumn);
    
    // Update the index property of each column
    const updatedColumns = newColumns.map((col, idx) => ({
      ...col,
      index: idx
    }));
    
    // Update the state
    setColumns(updatedColumns);
  };
  
  const handleColumnDragEnd = () => {
    setDraggedColumnId(null);
  };
  
  // When customColumns changes, update our columns
  useEffect(() => {
    const updatedColumns = [
      // Default columns with their tasks
      { 
        id: TaskStatus.TODO, 
        title: 'To Do', 
        colorClass: 'bg-warning', 
        tasks: todoTasks,
        index: 0
      },
      { 
        id: TaskStatus.IN_PROGRESS, 
        title: 'In Progress', 
        colorClass: 'bg-primary', 
        tasks: inProgressTasks,
        index: 1
      },
      { 
        id: TaskStatus.DONE, 
        title: 'Done', 
        colorClass: 'bg-success', 
        tasks: doneTasks,
        index: 2
      },
      // Add custom columns with their tasks
      ...customColumns.map((col, idx) => ({
        ...col,
        tasks: getCustomColumnTasks(col.id),
        index: 3 + idx
      }))
    ];
    
    setColumns(updatedColumns);
  }, [customColumns, todoTasks, inProgressTasks, doneTasks]);

  // Use a memo to update column data only when tasks change
  // We're using a ref to prevent infinite update loops
  const prevTasksRef = useRef<Task[]>([]);
  
  // Create a custom function to update column data
  const updateColumnData = (newColumns: ColumnData[]) => {
    // Get existing custom columns
    const customCols = columns.filter(col => 
      col.id !== TaskStatus.TODO && 
      col.id !== TaskStatus.IN_PROGRESS && 
      col.id !== TaskStatus.DONE
    ).map(col => ({
      ...col,
      tasks: getCustomColumnTasks(col.id) // Make sure custom columns get their updated tasks
    }));
    
    // Combine with the new standard columns
    const updatedColumns = [...newColumns, ...customCols];
    
    // Update the state
    setColumns(updatedColumns);
  };
  
  useEffect(() => {
    // Always update when tasks change to ensure custom columns show their tasks
    if (tasks) {
      // Update our reference of the previous tasks
      prevTasksRef.current = [...tasks];
      
      const standardColumns = [
        { 
          id: TaskStatus.TODO, 
          title: 'To Do', 
          colorClass: 'bg-warning', 
          tasks: todoTasks,
          index: 0
        },
        { 
          id: TaskStatus.IN_PROGRESS, 
          title: 'In Progress', 
          colorClass: 'bg-primary', 
          tasks: inProgressTasks,
          index: 1
        },
        { 
          id: TaskStatus.DONE, 
          title: 'Done', 
          colorClass: 'bg-success', 
          tasks: doneTasks,
          index: 2
        }
      ];
      
      // Update column data preserving the current order
      updateColumnData(standardColumns);
    }
  }, [tasks, todoTasks, inProgressTasks, doneTasks]);

  // Mutations for CRUD operations
  const createTaskMutation = useMutation({
    mutationFn: (newTask: any) => 
      apiRequest('POST', '/api/tasks', newTask),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Success toast removed
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create task",
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, task }: { id: number; task: any }) => 
      apiRequest('PUT', `/api/tasks/${id}`, task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Success toast removed
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update task",
      });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/tasks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Success toast removed
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete task",
      });
    }
  });

  // Command history hooks
  const commandHistory = useCommandHistory();
  
  // State for the keyboard shortcuts dialog
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Reference for search input element
  const searchRef = useRef<HTMLInputElement>(null);
  
  // Setup keyboard shortcuts for accessibility
  useKeyboardControls({
    searchInputRef: searchRef,
    onAddTask: (status) => {
      setInitialStatus(status);
      setIsTaskModalOpen(true);
    },
    onEscapeModal: () => {
      if (isTaskModalOpen) {
        setIsTaskModalOpen(false);
      }
      if (isColumnModalOpen) {
        setIsColumnModalOpen(false);
      }
    },
    onOpenHelp: () => {
      setIsHelpDialogOpen(true);
    },
    onFocusColumn: (columnIndex) => {
      if (columnRefs.current[columnIndex]) {
        columnRefs.current[columnIndex]?.focus();
        
        // If the column has tasks, focus the first one
        const columnStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
        // Get tasks for the current column based on column index
        let columnTasks = [];
        if (columnIndex === 0) {
          columnTasks = todoTasks;
        } else if (columnIndex === 1) {
          columnTasks = inProgressTasks;
        } else if (columnIndex === 2) {
          columnTasks = doneTasks;
        }
        
        if (columnTasks.length > 0) {
          const firstTaskElement = taskRefs.current.get(columnTasks[0].id);
          if (firstTaskElement) {
            firstTaskElement.focus();
            setFocusedCard(columnTasks[0].id);
          }
        }
      }
    },
    onFocusNextCard: (direction) => {
      if (focusedColumnIndex === null || focusedTaskId === null) return;
      
      // Get tasks for the focused column
      let columnTasks = [];
      if (focusedColumnIndex === 0) {
        columnTasks = [...todoTasks];
      } else if (focusedColumnIndex === 1) {
        columnTasks = [...inProgressTasks];
      } else if (focusedColumnIndex === 2) {
        columnTasks = [...doneTasks];
      }
      
      // Sort them by position for navigation
      columnTasks.sort((a, b) => (a.position || 0) - (b.position || 0));
      
      const currentIndex = columnTasks.findIndex(t => t.id === focusedTaskId);
      if (currentIndex === -1) return;
      
      let nextIndex = currentIndex;
      if (direction === 'up' && currentIndex > 0) {
        nextIndex = currentIndex - 1;
      } else if (direction === 'down' && currentIndex < columnTasks.length - 1) {
        nextIndex = currentIndex + 1;
      }
      
      if (nextIndex !== currentIndex) {
        const nextTaskElement = taskRefs.current.get(columnTasks[nextIndex].id);
        if (nextTaskElement) {
          nextTaskElement.focus();
          setFocusedTaskId(columnTasks[nextIndex].id);
        }
      }
    },
    onMoveTaskBetweenColumns: async (direction) => {
      if (focusedColumnIndex === null || focusedTaskId === null) return;
      
      const columnStatuses = [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.DONE];
      
      // Find the current task based on focused column
      let currentTask;
      if (focusedColumnIndex === 0) {
        currentTask = todoTasks.find(t => t.id === focusedTaskId);
      } else if (focusedColumnIndex === 1) {
        currentTask = inProgressTasks.find(t => t.id === focusedTaskId);
      } else if (focusedColumnIndex === 2) {
        currentTask = doneTasks.find(t => t.id === focusedTaskId);
      }
      
      if (!currentTask) return;
      
      let targetColumnIndex = focusedColumnIndex;
      if (direction === 'left' && focusedColumnIndex > 0) {
        targetColumnIndex = focusedColumnIndex - 1;
      } else if (direction === 'right' && focusedColumnIndex < 2) {
        targetColumnIndex = focusedColumnIndex + 1;
      }
      
      if (targetColumnIndex !== focusedColumnIndex) {
        const targetStatus = columnStatuses[targetColumnIndex];
        
        try {
          // Create a command and execute it
          const command = new MoveTaskCommand(
            currentTask.id,
            currentTask.status as TaskStatusType,
            targetStatus
          );
          await commandHistory.executeCommand(command);
          
          // Update focus
          setFocusedColumnIndex(targetColumnIndex);
          toast({
            title: "Task moved",
            description: `Task moved to ${targetStatus} column`,
            variant: "default"
          });
        } catch (error) {
          console.error("Error moving task:", error);
          toast({
            title: "Error",
            description: "Failed to move task",
            variant: "destructive"
          });
        }
      }
    }
  });
  
  // Custom task drag and drop hook with command history integration
  const { 
    isDragging, 
    currentItem, 
    dragPosition, 
    dropTarget,
    targetTaskId,
    dragGhostRef,
    handleDragStart,
    handleDragEnd: originalHandleDragEnd,
    setIsDragging,
    setCurrentItem,
    setDropTarget,
    setTargetTaskId
  } = useDragAndDrop();
  
  // Get our task middleware hook
  const taskMiddleware = useTaskMiddleware();
  
  // Custom drag end handler with middleware integration
  const handleDragEnd = async () => {
    // Skip if not dragging or no current item
    if (!isDragging || !currentItem) return;
    
    try {
      // Case 1: Moving to a different column (cross-column drag)
      if (dropTarget && dropTarget !== currentItem.sourceStatus) {
        // Use our middleware to move the task
        await taskMiddleware.moveTask(currentItem.task, dropTarget, {
          targetTaskId: targetTaskId || undefined,
          toTop: targetTaskId ? false : true
        });
      }
      // Case 2: Reordering within the same column
      else if (dropTarget && targetTaskId && dropTarget === currentItem.sourceStatus) {
        if (currentItem.id === targetTaskId) {
          console.log('Cannot reorder a task with itself');
          return;
        }
        
        // Use our middleware to reorder the task
        await taskMiddleware.reorderTask(
          currentItem.id,
          targetTaskId,
          tasks,
          currentItem.sourceStatus
        );
      }
    } catch (error) {
      console.error('Failed to update task:', error);
    } finally {
      // Reset drag state
      setTimeout(() => {
        setIsDragging(false);
        setCurrentItem(null);
        setDropTarget(null);
        setTargetTaskId(null);
      }, 100);
    }
  };

  // Handler for opening the add task modal
  const handleAddTask = (status: TaskStatusType) => {
    setEditingTask(null);
    setInitialStatus(status);
    setIsTaskModalOpen(true);
  };
  
  // Add new column and update TaskStatus object
  const handleAddColumn = (columnData: any) => {
    try {
      // Add the new status to the TaskStatus object
      // @ts-ignore - We're dynamically adding a new property
      TaskStatus[columnData.id.toUpperCase().replace(/-/g, '_')] = columnData.id;
      
      // Create new column data with the current tasks that belong to this status
      const newColumn: ColumnData = {
        id: columnData.id,
        title: columnData.title,
        colorClass: columnData.color,
        tasks: getCustomColumnTasks(columnData.id),
        index: columns.length
      };
      
      // Create a fresh copy of columns and add the new one
      const updatedColumns = [...columns, newColumn];
      
      // Update the state with the new columns array
      setColumns(updatedColumns);
      
      // Close the modal
      setIsColumnModalOpen(false);
    } catch (error) {
      console.error("Error adding column:", error);
      toast({
        title: "Error",
        description: "Failed to add column. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Handler for editing a task
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Handler for deleting a task - no confirmation dialog
  const handleDeleteTask = (taskId: number) => {
    // Delete immediately without confirmation
    deleteTaskMutation.mutate(taskId);
  };
  
  // Function to handle column deletion - no confirmation dialog
  const handleDeleteColumn = (columnId: TaskStatusType) => {
    // First, check if this column has any tasks
    const tasksInColumn = tasks.filter(task => task.status === columnId);
    
    if (tasksInColumn.length > 0) {
      // Move all tasks to To Do column without confirmation
      Promise.all(
        tasksInColumn.map(task => 
          updateTaskMutation.mutateAsync({
            id: task.id, 
            task: { ...task, status: TaskStatus.TODO }
          })
        )
      ).then(() => {
        // After moving tasks, remove the column
        const updatedColumns = columns.filter(col => col.id !== columnId);
        setColumns(updatedColumns);
        
        // Also remove from customColumns
        const updatedCustomColumns = customColumns.filter(col => col.id !== columnId);
        setCustomColumns(updatedCustomColumns);
      });
    } else {
      // No tasks in column, just remove it
      const updatedColumns = columns.filter(col => col.id !== columnId);
      setColumns(updatedColumns);
      
      // Also remove from customColumns
      const updatedCustomColumns = customColumns.filter(col => col.id !== columnId);
      setCustomColumns(updatedCustomColumns);
    }
  };

  // Handler for saving a task (create or update)
  const handleSaveTask = (formData: any) => {
    // Just send the form data directly without trying to convert dates
    // The server will handle any necessary conversions
    const taskData = {
      title: formData.title,
      description: formData.description || null,
      status: formData.status,
      type: formData.type,
      position: formData.position || null,
      // Pass the date as is - we fixed the server validation to handle this properly
      dueDate: formData.dueDate || null,
      userId: formData.userId || null
    };

    if (editingTask) {
      // Update existing task with correct ID
      console.log("Updating task with validated data:", editingTask.id, taskData);
      updateTaskMutation.mutate({ 
        id: editingTask.id, 
        task: taskData 
      });
    } else {
      // Create new task
      createTaskMutation.mutate(taskData);
    }
  };

  // Get the timestamp for "last updated"
  const lastUpdatedTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* App Header - Enhanced Design */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 flex flex-col sm:flex-row justify-between items-center">
          <div className="flex items-center space-x-3 mb-3 sm:mb-0">
            <div className="bg-white p-2 rounded-full shadow-md">
              <Clipboard className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">Collaborative Kanban</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <button 
              className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-100 text-blue-700 font-medium rounded-md shadow-sm transition-all duration-200 flex items-center hover:shadow-md text-sm sm:text-base"
              onClick={() => setIsColumnModalOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
              </svg>
              <span>Add Column</span>
            </button>
            <button 
              className="px-3 sm:px-4 py-2 bg-white hover:bg-gray-100 text-blue-700 font-medium rounded-md shadow-sm transition-all duration-200 flex items-center hover:shadow-md text-sm sm:text-base"
              onClick={() => handleAddTask(TaskStatus.TODO)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Task</span>
            </button>
            <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-medium shadow-md">
              LB
            </div>
          </div>
        </div>
      </header>

      {/* Board Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Board Controls */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between">
          <div className="mb-4 sm:mb-0">
            <h2 className="text-xl font-semibold text-gray-700 hidden sm:block">Project Board</h2>
            <p className="text-sm text-gray-500 hidden sm:block">Last updated: <span>{lastUpdatedTime}</span></p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-3">
              {/* Undo/Redo Toolbar */}
              <CommandHistoryToolbar />
            
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search tasks..." 
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={searchRef}
                />
                <Search className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
              </div>
              
              {/* User Profile Icon */}
              <div className="flex items-center">
                <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center text-white font-medium">
                  LB
                </div>
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 hidden sm:inline">Status:</label>
              <div className="relative">
                <select 
                  id="statusFilter" 
                  className="border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 appearance-none pr-8"
                  value={statusFilter}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('Selected status:', newValue);
                    setStatusFilter(newValue);
                  }}
                >
                  <option value="All Tasks">All Tasks</option>
                  <option value="To Do">To Do</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Done">Done</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            {/* Type Filter */}
            <div className="flex items-center gap-2">
              <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700 hidden sm:inline">Type:</label>
              <div className="relative">
                <select 
                  id="typeFilter" 
                  className="border border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm py-2 px-3 appearance-none pr-8"
                  value={typeFilter}
                  onChange={(e) => {
                    const newValue = e.target.value;
                    console.log('Selected type:', newValue); 
                    setTypeFilter(newValue);
                  }}
                >
                  <option value="All Types">All Types</option>
                  <option value="feature">Feature</option>
                  <option value="bug">Bug</option>
                  <option value="enhancement">Enhancement</option>
                  <option value="research">Research</option>
                  <option value="documentation">Documentation</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                </div>
              </div>
            </div>
            
            {/* Show results count */}
            {searchQuery && (
              <div className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-md">
                {todoTasks.length + inProgressTasks.length + doneTasks.length} result{(todoTasks.length + inProgressTasks.length + doneTasks.length) !== 1 ? 's' : ''}
              </div>
            )}
            
            {/* Keyboard Shortcuts Info Button */}
            <KeyboardShortcutsInfo />
          </div>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="text-center py-10">
            <div className="spinner animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tasks...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-red-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p>Failed to load tasks. Please try again later.</p>
            </div>
          </div>
        )}



        {/* Kanban Board - Improved for mobile */}
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 overflow-x-auto pb-4 items-stretch h-[600px] relative select-none">
          {columns.map((column) => {
            // Only show columns based on status filter
            if (
              (column.id === TaskStatus.TODO && !showTodoColumn) ||
              (column.id === TaskStatus.IN_PROGRESS && !showInProgressColumn) ||
              (column.id === TaskStatus.DONE && !showDoneColumn)
            ) {
              return null; // Don't render this column
            }
            
            // If type filter is active and no tasks of that type in this column, hide column
            if (typeFilter !== 'All Types' && 
                column.tasks.filter(task => task.type.toLowerCase() === typeFilter.toLowerCase()).length === 0) {
              return null; // No tasks of this type in this column
            }
            
            // Filter tasks within column by type if type filter is active
            const visibleTasks = typeFilter === 'All Types' 
              ? column.tasks 
              : column.tasks.filter(task => task.type.toLowerCase() === typeFilter.toLowerCase());
            
            // Only show this column if it has tasks to display
            if (visibleTasks.length === 0 && typeFilter !== 'All Types') {
              return null;
            }
            
            return (
              <KanbanColumn
                key={column.id}
                id={column.id}
                title={column.title}
                tasks={visibleTasks}
                count={visibleTasks.length}
                color={column.colorClass}
                index={column.index}
                onDragStart={handleDragStart}
                isDropTarget={dropTarget === column.id}
                targetTaskId={dropTarget === column.id ? targetTaskId : null}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                onDeleteTask={handleDeleteTask}
                onColumnDragStart={handleColumnDragStart}
                onColumnDragOver={handleColumnDragOver}
                onColumnDragEnd={handleColumnDragEnd}
                isDraggingColumn={draggedColumnId}
                searchQuery={searchQuery}
                onDeleteColumn={handleDeleteColumn}
              />
            );
          })}
          
          {/* Add Column Button - positioned beside the columns */}
          <button 
            className="min-w-[60px] h-[60px] border border-gray-200 rounded-lg flex items-center justify-center bg-white hover:bg-gray-50 transition-colors shadow-sm self-start"
            onClick={() => setIsColumnModalOpen(true)}
            aria-label="Add new column"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </main>

      {/* Add/Edit Task Modal */}
      <AddTaskModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        initialStatus={initialStatus}
        editTask={editingTask}
      />
      
      {/* Add Column Modal */}
      <AddColumnModal
        isOpen={isColumnModalOpen}
        onClose={() => setIsColumnModalOpen(false)}
        onSave={handleAddColumn}
      />
      
      {/* Keyboard Shortcuts Help Dialog */}
      <KeyboardHelp 
        open={isHelpDialogOpen} 
        onOpenChange={setIsHelpDialogOpen} 
      />

      {/* Drag Ghost Element */}
      <DragGhost
        ref={dragGhostRef}
        task={currentItem?.task || null}
        position={dragPosition}
        isDragging={isDragging}
      />
      
      {/* Register window event handlers for drag and drop */}
      {React.useEffect(() => {
        if (isDragging) {
          const handleWindowMouseUp = () => handleDragEnd();
          const handleWindowTouchEnd = () => handleDragEnd();
          
          window.addEventListener('mouseup', handleWindowMouseUp);
          window.addEventListener('touchend', handleWindowTouchEnd);
          
          return () => {
            window.removeEventListener('mouseup', handleWindowMouseUp);
            window.removeEventListener('touchend', handleWindowTouchEnd);
          };
        }
      }, [isDragging, handleDragEnd])}
    </div>
  );
};

export default KanbanBoard;
