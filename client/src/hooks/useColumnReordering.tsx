import { useState, useCallback, useRef } from "react";
import { TaskStatusType } from "@shared/schema";
import { ColumnData } from "@/lib/types";

export function useColumnReordering(initialColumns: ColumnData[]) {
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns.map((col, index) => ({
    ...col,
    index
  })));
  const [draggedColumnId, setDraggedColumnId] = useState<TaskStatusType | null>(null);
  const dragStartX = useRef<number>(0);
  const dragStartY = useRef<number>(0);

  // Update column data (tasks) without changing the order
  const updateColumnData = useCallback((newInitialColumns: ColumnData[]) => {
    setColumns(prevColumns => {
      // Get all existing column IDs for comparison
      const existingColumnIds = prevColumns.map(col => col.id);
      
      // Find any new columns that don't exist in current state
      const newColumns = newInitialColumns.filter(
        newCol => !existingColumnIds.includes(newCol.id)
      );
      
      // First update existing columns
      const updatedExistingColumns = prevColumns.map(col => {
        // Find the matching column from the new data
        const newData = newInitialColumns.find(newCol => newCol.id === col.id);
        
        // Update tasks while preserving order and other properties
        if (newData) {
          return {
            ...col,
            tasks: newData.tasks
          };
        }
        
        return col;
      });
      
      // Then add any new columns with proper indices
      if (newColumns.length > 0) {
        const columnsToAdd = newColumns.map((newCol, idx) => ({
          ...newCol,
          index: updatedExistingColumns.length + idx
        }));
        
        return [...updatedExistingColumns, ...columnsToAdd];
      }
      
      return updatedExistingColumns;
    });
  }, []);

  // Simple swap implementation
  const swapColumns = useCallback((sourceId: TaskStatusType, targetId: TaskStatusType) => {
    setColumns(prevColumns => {
      // Find indices
      const sourceIndex = prevColumns.findIndex(col => col.id === sourceId);
      const targetIndex = prevColumns.findIndex(col => col.id === targetId);
      
      if (sourceIndex === -1 || targetIndex === -1) return prevColumns;
      
      // Create a new array
      const newColumns = [...prevColumns];
      
      // Swap columns
      [newColumns[sourceIndex], newColumns[targetIndex]] = 
        [newColumns[targetIndex], newColumns[sourceIndex]];
      
      // Update indices
      return newColumns.map((col, index) => ({
        ...col,
        index
      }));
    });
  }, []);

  // Handler for starting column drag
  const handleDragStart = useCallback((columnId: TaskStatusType) => {
    // Set which column is being dragged
    setDraggedColumnId(columnId);
    
    // Store positions
    const event = window.event as MouseEvent | TouchEvent;
    if (event) {
      if ('clientX' in event) {
        dragStartX.current = event.clientX;
        dragStartY.current = event.clientY;
      } else if (event.touches && event.touches.length > 0) {
        dragStartX.current = event.touches[0].clientX;
        dragStartY.current = event.touches[0].clientY;
      }
    }
  }, []);

  // Handler for dropping a column in a new position
  const handleDragOver = useCallback((targetColumnId: TaskStatusType) => {
    if (!draggedColumnId || targetColumnId === draggedColumnId) return;

    // Just swap the columns directly
    swapColumns(draggedColumnId, targetColumnId);
  }, [draggedColumnId, swapColumns]);

  // Handler for ending column drag
  const handleDragEnd = useCallback(() => {
    setDraggedColumnId(null);
  }, []);

  return {
    columns,
    updateColumnData,
    draggedColumnId,
    handleDragStart,
    handleDragOver,
    handleDragEnd
  };
}