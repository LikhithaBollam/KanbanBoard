import { useEffect } from 'react';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';
import { TaskStatusType } from '@shared/schema';

interface KeyboardAccessOptions {
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onAddTask?: (status: TaskStatusType) => void;
  onCloseModal?: () => void;
  onOpenHelp?: () => void;
}

export function useKeyboardAccess({
  searchInputRef,
  onAddTask,
  onCloseModal,
  onOpenHelp
}: KeyboardAccessOptions = {}) {
  const { undo, redo, canUndo, canRedo } = useCommandHistory();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip keyboard shortcuts when typing in form fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        // Exception: Allow Escape to close dialogs even in form fields
        if (event.key !== 'Escape') {
          return;
        }
      }
      
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      // Show keyboard shortcuts help: ?
      if (event.key === '?' && !isCtrlPressed) {
        event.preventDefault();
        onOpenHelp?.();
        return;
      }
      
      // Close modal with Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseModal?.();
        return;
      }
      
      // Focus search box: Ctrl+F
      if (isCtrlPressed && event.key === 'f') {
        event.preventDefault();
        searchInputRef?.current?.focus();
        return;
      }
      
      // Add new task: Shift+N
      if (event.key === 'n' && event.shiftKey && !isCtrlPressed) {
        event.preventDefault();
        onAddTask?.('todo');
        return;
      }
      
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
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    searchInputRef, 
    onAddTask, 
    onCloseModal, 
    onOpenHelp, 
    undo, 
    redo, 
    canUndo, 
    canRedo
  ]);
}