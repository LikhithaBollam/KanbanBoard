import { useEffect, useRef } from 'react';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';
import { TaskStatusType } from '@shared/schema';

interface KeyboardShortcutOptions {
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onAddTask?: (status: TaskStatusType) => void;
  onCloseModal?: () => void;
  setHelpDialogOpen?: (open: boolean) => void;
}

export function useKeyboardShortcuts({
  searchInputRef,
  onAddTask,
  onCloseModal,
  setHelpDialogOpen,
}: KeyboardShortcutOptions = {}) {
  // Track the last focused element to restore focus when needed
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  // Get command history functions for undo/redo
  const { undo, redo, canUndo, canRedo } = useCommandHistory();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        (event.target instanceof HTMLElement && event.target.isContentEditable)
      ) {
        // Allow Escape key in form fields to close dialogs
        if (event.key !== 'Escape') {
          return;
        }
      }
      
      // Store the active element for potential focus restoration
      if (document.activeElement instanceof HTMLElement) {
        lastFocusedElement.current = document.activeElement;
      }
      
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      // Show keyboard shortcuts help: ?
      if (event.key === '?' && !isCtrlPressed) {
        event.preventDefault();
        setHelpDialogOpen?.(true);
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
    setHelpDialogOpen, 
    undo, 
    redo, 
    canUndo, 
    canRedo
  ]);
}