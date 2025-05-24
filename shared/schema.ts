import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema from the existing code
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Task status enum
export const TaskStatus = {
  TODO: "todo",
  IN_PROGRESS: "in-progress",
  DONE: "done",
} as const;

// Use string type to allow for dynamic custom statuses
export type TaskStatusType = string;

// Task type enum
export const TaskType = {
  FEATURE: "feature",
  BUG: "bug",
  ENHANCEMENT: "enhancement",
  RESEARCH: "research",
  DOCUMENTATION: "documentation",
} as const;

export type TaskTypeType = typeof TaskType[keyof typeof TaskType];

// Tasks schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").notNull().default(TaskStatus.TODO),
  type: text("type").notNull().default(TaskType.FEATURE),
  position: integer("position").default(0), // Add position field for ordering within columns
  dueDate: timestamp("due_date"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  status: z.string().min(1, "Status is required"),
  type: z.string().min(1, "Type is required"),
  position: z.number().nullable().optional(),
  // Allow any date format and set to null if empty/invalid
  dueDate: z.preprocess(
    val => val === "" || val === undefined ? null : val,
    z.any().nullable().optional()
  ),
  userId: z.number().nullable().optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().nullable().optional(),
  status: z.string().min(1, "Status is required"),
  type: z.string().min(1, "Type is required"),
  position: z.number().nullable().optional(),
  // Allow any date format and set to null if empty/invalid
  dueDate: z.preprocess(
    val => val === "" || val === undefined ? null : val,
    z.any().nullable().optional()
  ),
  userId: z.number().nullable().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type Task = typeof tasks.$inferSelect;
