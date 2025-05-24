import { useEffect, useState, useCallback, useRef } from 'react';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';
import { TaskStatusType } from '@shared/schema';

// TODO: Consider adding more keyboard shortcuts for:
// - Filtering tasks
// - Clearing filters
// - Batch selection of multiple tasks
// - Quick edit mode for task titles

// NOTES:
// I spent hours researching accessibility best practices for keyboard navigation.
// Initially tried to use a library but decided to build a custom solution because:
// 1. Most libraries were too heavyweight for our needs
// 2. We needed very specific behavior for column/card navigation
// 3. Building custom gave us better integration with our command pattern
// 
// The focus tracking was tricky - had to maintain state for both column and card
// focus to support the arrow key navigation properly.
// 
// - Likhitha (May 21)

type ShortcutHandlers = {
  onAddTask?: (status: TaskStatusType) => void;
  onFocusSearch?: () => void;
  onEscapeModal?: () => void;
  onOpenHelp?: () => void;
  onMoveTaskBetweenColumns?: (direction: 'left' | 'right') => void;
  onFocusColumn?: (columnIndex: number) => void;
  onFocusNextCard?: (direction: 'up' | 'down') => void;
};

export function useKeyboardShortcuts(handlers: ShortcutHandlers = {}) {
  const { undo, redo, canUndo, canRedo } = useCommandHistory();
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [focusedColumn, setFocusedColumn] = useState<number | null>(null);
  const [focusedCard, setFocusedCard] = useState<number | null>(null);
  
  // Store last focused element to restore focus after actions
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  const openHelpDialog = useCallback(() => {
    setHelpDialogOpen(true);
    handlers.onOpenHelp?.();
  }, [handlers]);
  
  const closeHelpDialog = useCallback(() => {
    setHelpDialogOpen(false);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input field, textarea or contenteditable
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        // Exception: Allow Escape key in form fields
        if (event.key !== 'Escape') {
          return;
        }
      }
      
      // Store the currently focused element for potential focus restoration
      if (document.activeElement instanceof HTMLElement) {
        lastFocusedElement.current = document.activeElement;
      }
      
      // Check if Ctrl (or Cmd on Mac) is pressed
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      // ---------- Global Shortcuts ----------
      
      // Show Help Dialog: ?
      if (event.key === '?' && !event.shiftKey && !isCtrlPressed) {
        event.preventDefault();
        openHelpDialog();
        return;
      }
      
      // Close modals/dialogs: Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        if (helpDialogOpen) {
          closeHelpDialog();
        } else {
          handlers.onEscapeModal?.();
        }
        return;
      }
      
      // ---------- Command History ----------
      
      // Undo: Ctrl+Z
      if (isCtrlPressed && event.key === 'z' && !event.shiftKey && canUndo) {
        event.preventDefault();
        undo();
        return;
      }
      
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      if (isCtrlPressed && 
         ((event.key === 'y') || (event.key === 'z' && event.shiftKey)) && 
         canRedo) {
        event.preventDefault();
        redo();
        return;
      }
      
      // ---------- Navigation Shortcuts ----------
      
      // Focus search box: Ctrl+F
      if (isCtrlPressed && event.key === 'f') {
        event.preventDefault();
        handlers.onFocusSearch?.();
        return;
      }
      
      // Focus columns with number keys
      if (['1', '2', '3'].includes(event.key) && !isCtrlPressed) {
        const columnIndex = parseInt(event.key) - 1;
        handlers.onFocusColumn?.(columnIndex);
        setFocusedColumn(columnIndex);
        setFocusedCard(null);
        return;
      }
      
      // Navigate between cards with arrow keys
      if (focusedColumn !== null) {
        if (event.key === 'ArrowUp') {
          event.preventDefault();
          handlers.onFocusNextCard?.('up');
          return;
        }
        
        if (event.key === 'ArrowDown') {
          event.preventDefault();
          handlers.onFocusNextCard?.('down');
          return;
        }
      }
      
      // Move tasks between columns
      if (focusedCard !== null) {
        if (event.key === 'ArrowLeft' && focusedColumn !== null && focusedColumn > 0) {
          event.preventDefault();
          handlers.onMoveTaskBetweenColumns?.('left');
          return;
        }
        
        if (event.key === 'ArrowRight' && focusedColumn !== null && focusedColumn < 2) {
          event.preventDefault();
          handlers.onMoveTaskBetweenColumns?.('right');
          return;
        }
      }
      
      // ---------- Action Shortcuts ----------
      
      // Add task to specific column: Shift + N
      if (event.key === 'n' && event.shiftKey && !isCtrlPressed) {
        event.preventDefault();
        if (focusedColumn !== null) {
          // Map column indices to status
          const statuses: TaskStatusType[] = ['todo', 'in-progress', 'done'];
          handlers.onAddTask?.(statuses[focusedColumn]);
        } else {
          // Default to adding a task to the first column
          handlers.onAddTask?.('todo');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    undo, redo, canUndo, canRedo, 
    handlers, helpDialogOpen, 
    openHelpDialog, closeHelpDialog,
    focusedColumn, focusedCard
  ]);
  
  return {
    helpDialogOpen,
    setHelpDialogOpen,
    focusedColumn,
    setFocusedColumn,
    focusedCard,
    setFocusedCard
  };
}