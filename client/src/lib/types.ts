import { Task, TaskStatusType, TaskTypeType } from "@shared/schema";

export interface DragItem {
  id: number;
  task: Task;
  sourceStatus: TaskStatusType;
  sourceIndex?: number;
}

export interface DragColumnItem {
  id: TaskStatusType;
  index: number;
}

export interface ColumnData {
  id: TaskStatusType;
  title: string;
  colorClass: string;
  tasks: Task[];
  index: number;
}
