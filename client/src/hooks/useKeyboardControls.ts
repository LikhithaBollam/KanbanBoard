import { useEffect, useRef } from 'react';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';
import { TaskStatusType } from '@shared/schema';

interface KeyboardControlsOptions {
  searchInputRef?: React.RefObject<HTMLInputElement>;
  onAddTask?: (status: TaskStatusType) => void;
  onEscapeModal?: () => void;
  onToggleHelp?: () => void;
}

export function useKeyboardControls({
  searchInputRef,
  onAddTask,
  onEscapeModal,
  onToggleHelp
}: KeyboardControlsOptions = {}) {
  // Store the last focused element to restore focus later if needed
  const lastFocusedElement = useRef<HTMLElement | null>(null);
  
  // Get command history functions for undo/redo
  const { undo, redo, canUndo, canRedo } = useCommandHistory();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in a form field
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
      
      // Store the active element for potential focus restoration
      if (document.activeElement instanceof HTMLElement) {
        lastFocusedElement.current = document.activeElement;
      }
      
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      // Show keyboard shortcuts help: ?
      if (event.key === '?' && !isCtrlPressed) {
        event.preventDefault();
        onToggleHelp?.();
        return;
      }
      
      // Close modal with Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        onEscapeModal?.();
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
    onEscapeModal, 
    onToggleHelp, 
    undo, 
    redo, 
    canUndo, 
    canRedo
  ]);
}