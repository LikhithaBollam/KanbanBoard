import { useState, useCallback, useEffect, useRef } from "react";
import { TaskStatusType } from "@shared/schema";
import { DragColumnItem, ColumnData } from "@/lib/types";

export const useColumnDragAndDrop = (initialColumns: ColumnData[]) => {
  const [columns, setColumns] = useState<ColumnData[]>(initialColumns);
  const [isDraggingColumn, setIsDraggingColumn] = useState(false);
  const [currentColumn, setCurrentColumn] = useState<DragColumnItem | null>(null);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const draggingElem = useRef<HTMLElement | null>(null);
  const columnRefs = useRef<Map<string, HTMLElement>>(new Map());

  // Update columns when initialColumns changes (i.e., when tasks are updated)
  useEffect(() => {
    // Only update task content, preserving column order
    if (columns.length > 0) {
      setColumns(prevColumns => 
        prevColumns.map(col => {
          // Find matching column in initialColumns
          const updatedCol = initialColumns.find(initial => initial.id === col.id);
          if (updatedCol) {
            return { ...col, tasks: updatedCol.tasks };
          }
          return col;
        })
      );
    } else {
      setColumns(initialColumns);
    }
  }, [initialColumns]);

  // Register a column element
  const registerColumn = useCallback((id: string, element: HTMLElement | null) => {
    if (element) {
      columnRefs.current.set(id, element);
    } else {
      columnRefs.current.delete(id);
    }
  }, []);

  // Function to start dragging a column
  const handleColumnDragStart = useCallback((columnId: TaskStatusType, index: number, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    const elem = columnRefs.current.get(columnId);
    if (!elem) return;
    
    // Track the initial mouse position
    dragStartPos.current = { 
      x: event.clientX, 
      y: event.clientY 
    };
    
    draggingElem.current = elem;
    elem.classList.add('dragging-column');
    
    setIsDraggingColumn(true);
    setCurrentColumn({ id: columnId, index });
    
    // Add global event listeners for mouse move and up
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Handle mouse movement during drag
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDraggingColumn || !currentColumn || !draggingElem.current) return;
    
    // Find out which column we're hovering over
    const elementsAtPoint = document.elementsFromPoint(e.clientX, e.clientY);
    const hoveredColumn = elementsAtPoint.find(el => 
      el.classList.contains('kanban-column') || 
      el.closest('.kanban-column')
    );
    
    if (hoveredColumn) {
      const columnElement = hoveredColumn.classList.contains('kanban-column') 
        ? hoveredColumn 
        : hoveredColumn.closest('.kanban-column');
        
      if (columnElement) {
        const targetId = columnElement.getAttribute('data-column-id') as TaskStatusType;
        const targetIndex = parseInt(columnElement.getAttribute('data-column-index') || '0');
        
        if (targetId && targetId !== currentColumn.id) {
          // Visual feedback for the target column
          columnRefs.current.forEach((el) => {
            el.classList.remove('column-drop-target');
          });
          columnElement.classList.add('column-drop-target');
          
          // Reorder columns
          setColumns(prevColumns => {
            const newColumns = [...prevColumns];
            
            // Get position of source and target columns
            const sourceIndex = newColumns.findIndex(col => col.id === currentColumn.id);
            
            if (sourceIndex !== -1 && targetIndex !== sourceIndex) {
              // Remove the column from its original position
              const [movedColumn] = newColumns.splice(sourceIndex, 1);
              
              // Insert it at the new position
              newColumns.splice(targetIndex, 0, movedColumn);
              
              // Update indices for all columns
              return newColumns.map((col, idx) => ({
                ...col,
                index: idx
              }));
            }
            
            return prevColumns;
          });
        }
      }
    }
  }, [isDraggingColumn, currentColumn]);

  // Handle mouse up to end dragging
  const handleMouseUp = useCallback(() => {
    if (draggingElem.current) {
      draggingElem.current.classList.remove('dragging-column');
      draggingElem.current = null;
    }
    
    // Remove visual feedback from all columns
    columnRefs.current.forEach((el) => {
      el.classList.remove('column-drop-target');
    });
    
    setIsDraggingColumn(false);
    setCurrentColumn(null);
    
    // Remove global event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Clean up event listeners when unmounting
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  return {
    columns,
    isDraggingColumn,
    currentColumn,
    handleColumnDragStart,
    registerColumn
  };
};