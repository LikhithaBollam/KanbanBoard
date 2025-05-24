import { tasks, type Task, type InsertTask, type UpdateTask, type User, users, TaskStatus } from "@shared/schema";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: User): Promise<User>;
  
  // Task methods
  getAllTasks(): Promise<Task[]>;
  getTasksByStatus(status: string): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: UpdateTask): Promise<Task | undefined>;
  updateTaskStatus(id: number, status: string): Promise<Task | undefined>;
  updateTaskPosition(id: number, position: number): Promise<Task | undefined>;
  reorderTaskInColumn(taskId: number, targetTaskId: number): Promise<Task[]>;
  deleteTask(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private userCurrentId: number;
  private taskCurrentId: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.userCurrentId = 1;
    this.taskCurrentId = 1;
    
    // Initialize with some sample tasks
    this.initializeSampleTasks();
  }

  private initializeSampleTasks() {
    const sampleTasks: InsertTask[] = [
      {
        title: "Implement drag and drop functionality",
        description: "Create a custom drag and drop system that works on both desktop and mobile devices.",
        status: "todo",
        type: "feature",
        position: 0,
        dueDate: new Date("2023-10-21"),
        userId: null,
      },
      {
        title: "Fix mobile responsiveness issues",
        description: "Board doesn't render correctly on small screens. Implement responsive design.",
        status: "todo",
        type: "bug",
        position: 1,
        dueDate: new Date("2023-10-18"),
        userId: null,
      },
      {
        title: "Add visual feedback to drag operations",
        description: "Create visual indicators when dragging cards between columns.",
        status: "todo",
        type: "enhancement",
        position: 2,
        dueDate: new Date("2023-10-22"),
        userId: null,
      },
      {
        title: "Research touch events implementation",
        description: "Explore best practices for implementing touch events for mobile drag and drop functionality.",
        status: "todo",
        type: "research",
        position: 3,
        dueDate: new Date("2023-10-20"),
        userId: null,
      },
      {
        title: "Set up basic column structure",
        description: "Create the three main columns (To Do, In Progress, Done) with header styling.",
        status: "in-progress",
        type: "feature",
        position: 0,
        dueDate: new Date("2023-10-19"),
        userId: null,
      },
      {
        title: "Create API documentation",
        description: "Document all the server endpoints used for data persistence.",
        status: "in-progress",
        type: "documentation",
        position: 1,
        dueDate: new Date("2023-10-23"),
        userId: null,
      },
      {
        title: "Implement task edit functionality",
        description: "Create a form for editing existing task cards with validation.",
        status: "in-progress",
        type: "enhancement",
        position: 2,
        dueDate: new Date("2023-10-20"),
        userId: null,
      },
      {
        title: "Set up project structure",
        description: "Initialize React project with Tailwind CSS and set up folder structure.",
        status: "done",
        type: "feature",
        position: 0,
        dueDate: null,
        userId: null,
      },
      {
        title: "Design card and column UI",
        description: "Create the visual design for task cards and columns using Tailwind CSS.",
        status: "done",
        type: "enhancement",
        position: 1,
        dueDate: null,
        userId: null,
      },
    ];

    sampleTasks.forEach(task => this.createTask(task));
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: any): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Task methods
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTasksByStatus(status: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(
      (task) => task.status === status
    );
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskCurrentId++;
    const now = new Date();
    
    // Find the maximum position in the target column to place this task at the bottom
    const tasksInColumn = Array.from(this.tasks.values())
      .filter(t => t.status === insertTask.status);
    
    // Calculate position - either use the provided position or place at the bottom
    let position = insertTask.position;
    if (position === null || position === undefined) {
      // If no tasksInColumn, set position to 0
      // Otherwise, set position to max + 1 for bottom placement
      position = tasksInColumn.length > 0 
        ? Math.max(...tasksInColumn.map(t => t.position || 0)) + 1 
        : 0;
    }
    
    console.log(`Creating task '${insertTask.title}' in ${insertTask.status} at position ${position}`);
    
    // Process date fields separately to ensure proper typing
    const task: Task = {
      id,
      title: insertTask.title,
      description: insertTask.description || null,
      status: insertTask.status,
      type: insertTask.type,
      position: position,
      dueDate: insertTask.dueDate ? new Date(insertTask.dueDate) : null,
      userId: insertTask.userId || null,
      createdAt: now
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, updateTask: UpdateTask): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    console.log('Updating task with:', updateTask);
    
    // Process date fields separately to ensure proper typing
    const updatedTask: Task = {
      ...task,
      title: updateTask.title,
      description: updateTask.description !== undefined ? updateTask.description : task.description,
      status: updateTask.status,
      type: updateTask.type,
      position: updateTask.position !== undefined ? updateTask.position : task.position,
      dueDate: updateTask.dueDate !== undefined ? 
               (updateTask.dueDate ? new Date(updateTask.dueDate) : null) : 
               task.dueDate,
      userId: updateTask.userId !== undefined ? updateTask.userId : task.userId,
      createdAt: task.createdAt
    };
    
    console.log('Updated task result:', updatedTask);
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async updateTaskStatus(id: number, status: string, targetPosition?: number, targetTaskId?: number, placeBefore: boolean = false): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    // Get the current status to check if we're moving between columns
    const oldStatus = task.status;
    const isCrossingColumns = oldStatus !== status;
    
    console.log(`Moving task ${id} (${task.title}) to ${status} column with ${targetTaskId ? 'targetTaskId=' + targetTaskId : targetPosition !== undefined ? 'position=' + targetPosition : 'no position specified'}`);
    
    // Default to top placement if no position is specified
    let insertPosition = 0;
    let toTop = targetPosition === undefined && targetTaskId === undefined;
    
    // If we have a target task ID, determine the position from it
    if (targetTaskId) {
      const targetTask = this.tasks.get(targetTaskId);
      if (targetTask) {
        // When dropping ON a card with blue line at top, we want to insert BEFORE it
        // So we use the target's position directly
        insertPosition = (targetTask.position || 0);
        console.log(`Moving between columns with target task ${targetTaskId}`);
        toTop = false; // Make sure we're not forcing top placement
      }
    } else if (targetPosition !== undefined) {
      insertPosition = targetPosition;
      console.log(`Using explicit position: ${insertPosition}`);
    }
    
    if (toTop) {
      console.log(`FORCE TOP PLACEMENT: ${oldStatus} -> ${status}, placing at TOP`);
    }
    
    // STEP 1: First update our task with the new status
    const updatedTask: Task = {
      ...task,
      status,
      position: insertPosition // Use the determined position
    };
    
    // Log what we're doing for clarity
    console.log(`Moving task ${id} (${task.title}) to ${status} column with targetTaskId=${targetTaskId}`);
    
    this.tasks.set(id, updatedTask);
    
    // STEP 2: Get all tasks in target column (including our newly updated task)
    const tasksInTargetColumn = Array.from(this.tasks.values())
      .filter(t => t.status === status)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    console.log(`Column ${status} has ${tasksInTargetColumn.length} tasks after adding the moved task`);
    
    // STEP 3: Now we need to update all positions to reflect the new ordering
    // First, reset the positions of all tasks in the target column to match their array index
    const finalTasksOrdering = [...tasksInTargetColumn].sort((a, b) => {
      // Special case: The moved task should be at the insert position
      if (a.id === id) return (a.position || 0) - (b.id === id ? a.position || 0 : b.position || 0);
      if (b.id === id) return (a.id === id ? b.position || 0 : a.position || 0) - (b.position || 0);
      
      // Natural ordering for all other tasks
      return (a.position || 0) - (b.position || 0);
    });
    
    // Update positions based on the final sorted order
    if (!toTop) {
      for (let i = 0; i < finalTasksOrdering.length; i++) {
        const taskToUpdate = finalTasksOrdering[i];
        
        // Only update if position has changed
        if (taskToUpdate.position !== i) {
          console.log(`Setting task ${taskToUpdate.id} (${taskToUpdate.title}) position to ${i}`);
          
          // Update the task with its new position
          this.tasks.set(taskToUpdate.id, {
            ...taskToUpdate,
            position: i
          });
        }
      }
    } 
    // If placing at the top, shift everything down
    else {
      for (const existingTask of tasksInTargetColumn) {
        // Skip the task we're moving - keep it at position 0
        if (existingTask.id === id) continue;
        
        // Shift everything else down by 1
        const newPosition = (existingTask.position || 0) + 1;
        console.log(`Shifting task ${existingTask.id} to position ${newPosition}`);
        
        // Update the task with new position
        this.tasks.set(existingTask.id, {
          ...existingTask,
          position: newPosition
        });
      }
    }
    
    console.log(`Task ${id} is now at position ${insertPosition} in ${status} column`);
    
    // Return the updated task
    return updatedTask;
  }

  async updateTaskPosition(id: number, position: number): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;

    const updatedTask: Task = {
      ...task,
      position,
    };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async reorderTaskInColumn(taskId: number, targetTaskId: number, placeAfter: boolean = false): Promise<Task[]> {
    // Retrieve the tasks by ID
    const task = this.tasks.get(taskId);
    const targetTask = this.tasks.get(targetTaskId);
    
    console.log(`Reordering task ${taskId} (${task?.title}) ${placeAfter ? 'AFTER' : 'BEFORE'} task ${targetTaskId} (${targetTask?.title})`);
    
    // Validate that both tasks exist and are in the same column
    if (!task || !targetTask) {
      console.error('Task or target task not found');
      return Array.from(this.tasks.values())
        .filter(t => t.status === (task?.status || targetTask?.status || ''))
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    
    if (task.status !== targetTask.status) {
      console.error('Cannot reorder tasks in different columns');
      return Array.from(this.tasks.values())
        .filter(t => t.status === task.status)
        .sort((a, b) => (a.position || 0) - (b.position || 0));
    }
    
    // Get all tasks in the same column, ordered by position
    const tasksInColumn = Array.from(this.tasks.values())
      .filter(t => t.status === task.status)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
    
    console.log('Tasks in column before reordering:', 
      tasksInColumn.map(t => `${t.id}:${t.title}:${t.position}`));
    
    // First, remove the task being moved
    let updatedTasks = tasksInColumn.filter(t => t.id !== task.id);
    
    // Find where to insert the task (position of the target)
    const targetIndex = updatedTasks.findIndex(t => t.id === targetTask.id);
    
    if (targetIndex === -1) {
      console.error('Target task not found in filtered column tasks');
      return tasksInColumn;
    }
    
    // Determine if we're moving up or down within the column
    const originalIndex = tasksInColumn.findIndex(t => t.id === task.id);
    const targetTaskOriginalIndex = tasksInColumn.findIndex(t => t.id === targetTask.id);
    
    // Calculate the insert position based on direction and placement preference
    // When placing AFTER the target, add 1 to the target index
    let insertPosition = placeAfter ? targetIndex + 1 : targetIndex;
    
    // Log the operation details
    console.log(`Original position: ${originalIndex}, Target position: ${targetTaskOriginalIndex}, Insert at: ${insertPosition}, PlaceAfter: ${placeAfter}`);
    
    // Insert the task at the calculated position
    updatedTasks = [
      ...updatedTasks.slice(0, insertPosition),
      task,
      ...updatedTasks.slice(insertPosition)
    ];
    
    // Update the positions of all tasks in the column
    const result = updatedTasks.map((t, idx) => {
      const updatedTask: Task = {
        ...t,
        position: idx
      };
      
      // Update in the storage
      this.tasks.set(t.id, updatedTask);
      return updatedTask;
    });
    
    console.log('Tasks in column after reordering:', 
      result.map(t => `${t.id}:${t.title}:${t.position}`));
    
    return result;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
}

export const storage = new MemStorage();
