import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { insertTaskSchema, updateTaskSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all tasks
  app.get("/api/tasks", async (_req, res) => {
    try {
      const tasks = await storage.getAllTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  // Get tasks by status
  app.get("/api/tasks/status/:status", async (req, res) => {
    try {
      const status = req.params.status;
      const tasks = await storage.getTasksByStatus(status);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks by status" });
    }
  });

  // Get task by id
  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  // Create a new task
  app.post("/api/tasks", async (req, res) => {
    try {
      console.log('Creating task with payload:', req.body);
      
      // Prepare a safe payload with known expected properties
      const safePayload = {
        title: req.body.title,
        description: req.body.description || null,
        status: req.body.status,
        type: req.body.type,
        position: req.body.position || null,
        dueDate: req.body.dueDate || null,
        userId: req.body.userId || null
      };
      
      const task = await storage.createTask(safePayload);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  // Update a task
  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }
      
      console.log('Updating task with payload:', req.body);
      
      // Prepare a safe payload with known expected properties
      const safePayload = {
        title: req.body.title,
        description: req.body.description || null,
        status: req.body.status,
        type: req.body.type,
        position: req.body.position || null,
        dueDate: req.body.dueDate || null,
        userId: req.body.userId || null
      };

      const updatedTask = await storage.updateTask(id, safePayload);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Update task status
  app.patch("/api/tasks/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const schema = z.object({ 
        status: z.string(),
        targetTaskId: z.number().optional(),
        position: z.number().optional(),
        toTop: z.boolean().optional(), // Flag to place at top
        forceTop: z.boolean().optional(),
        isNewColumn: z.boolean().optional(),
        placeBefore: z.boolean().optional() // New parameter - true if placing before target, false if after
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid status", errors: result.error.errors });
      }

      const { status, targetTaskId, position, toTop, forceTop, isNewColumn, placeBefore } = result.data;
      
      // Get the task we're moving
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      console.log(`Moving task ${id} to ${status} column with toTop=${toTop}, position=${position}, placeBefore=${placeBefore}`);
      
      // Moving between columns
      if (task.status !== status) {
        // If we have a target task ID or position, use it to place the task
        if (targetTaskId) {
          console.log(`Moving between columns with target task ${targetTaskId}, placeBefore=${placeBefore}`);
          // Pass the placeBefore parameter to precisely control placement
          const updatedTask = await storage.updateTaskStatus(id, status, undefined, targetTaskId, placeBefore);
          return res.json(updatedTask);
        } 
        else if (position !== undefined) {
          console.log(`Moving between columns with explicit position ${position}`);
          const updatedTask = await storage.updateTaskStatus(id, status, position);
          return res.json(updatedTask);
        }
        // If toTop is true or forceTop is true, place at top
        else if (toTop || forceTop || isNewColumn) {
          console.log(`FORCE TOP PLACEMENT: ${task.status} -> ${status}, placing at TOP`);
          const updatedTask = await storage.updateTaskStatus(id, status); // No position = top
          return res.json(updatedTask);
        }
        // Default case for cross-column movement
        else {
          const updatedTask = await storage.updateTaskStatus(id, status);
          return res.json(updatedTask);
        }
      }
      
      // Reordering within the same column
      if (targetTaskId && task.status === status) {
        console.log(`Reordering within ${status} column near task ${targetTaskId}, placeBefore=${placeBefore}`);
        // Use placeBefore to decide if we're placing before or after target
        const placeAfter = placeBefore === undefined ? false : !placeBefore;
        const reorderedTasks = await storage.reorderTaskInColumn(id, targetTaskId, placeAfter);
        const updatedTask = reorderedTasks.find(t => t.id === id);
        return res.json(updatedTask || task);
      }
      
      // Default case - just update the status
      const updatedTask = await storage.updateTaskStatus(id, status, position, targetTaskId, placeBefore);
      return res.json(updatedTask);
    } catch (error) {
      console.error("Error updating task status:", error);
      res.status(500).json({ message: "Failed to update task status" });
    }
  });
  
  // Update task position
  app.patch("/api/tasks/:id/position", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const schema = z.object({ position: z.number() });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid position", errors: result.error.errors });
      }

      const { position } = result.data;
      const updatedTask = await storage.updateTaskPosition(id, position);
      if (!updatedTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task position" });
    }
  });
  
  // Reorder tasks within a column
  app.post("/api/tasks/:id/reorder", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const schema = z.object({ 
        targetTaskId: z.number(),
        position: z.string().optional() // 'before' or 'after'
      });
      const result = schema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ message: "Invalid target task", errors: result.error.errors });
      }

      const { targetTaskId, position } = result.data;
      
      console.log(`API: Reordering task ${id} to ${position || 'before'} task ${targetTaskId}`);
      
      if (id === targetTaskId) {
        return res.status(400).json({ message: "Cannot reorder a task with itself" });
      }
      
      // Get source and target tasks
      const sourceTask = await storage.getTask(id);
      const targetTask = await storage.getTask(targetTaskId);
      
      if (!sourceTask || !targetTask) {
        return res.status(404).json({ message: "Source or target task not found" });
      }
      
      // Check if we're moving up or down in the same column
      const isMovingDown = 
        sourceTask.status === targetTask.status && 
        (sourceTask.position ?? 0) < (targetTask.position ?? 0);
        
      // For moving down within a column, we want to place after the target
      // For moving up or across columns, we typically place before
      const placeAfter = position === 'after' || (isMovingDown && position !== 'before');
      
      console.log(`Moving ${isMovingDown ? 'DOWN' : 'UP'} - placement: ${placeAfter ? 'AFTER' : 'BEFORE'} target`);
      
      // Call reorder with additional positioning information
      const updatedTasks = await storage.reorderTaskInColumn(id, targetTaskId, placeAfter);
      
      console.log(`API: Reordering complete, returning ${updatedTasks.length} tasks`);
      res.json(updatedTasks);
    } catch (error) {
      console.error("Failed to reorder tasks:", error);
      res.status(500).json({ message: "Failed to reorder tasks" });
    }
  });

  // Delete a task
  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const result = await storage.deleteTask(id);
      if (!result) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
