import { useEffect, useState } from 'react';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';
import { TaskStatusType } from '@shared/schema';

interface AccessibilityKeyboardProps {
  onAddTask?: (status: TaskStatusType) => void;
  onFocusSearch?: () => void;
  onToggleHelpDialog?: () => void;
  onEscapeModal?: () => void;
}

export function useAccessibilityKeyboard({
  onAddTask,
  onFocusSearch,
  onToggleHelpDialog,
  onEscapeModal
}: AccessibilityKeyboardProps = {}) {
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const { undo, redo, canUndo, canRedo } = useCommandHistory();

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
      
      // Check if Ctrl (or Cmd on Mac) is pressed
      const isCtrlPressed = event.ctrlKey || event.metaKey;
      
      // Show Help Dialog: ?
      if (event.key === '?' && !event.shiftKey && !isCtrlPressed) {
        event.preventDefault();
        setHelpDialogOpen(prev => !prev);
        onToggleHelpDialog?.();
        return;
      }
      
      // Close modals/dialogs: Escape
      if (event.key === 'Escape') {
        event.preventDefault();
        if (helpDialogOpen) {
          setHelpDialogOpen(false);
          onToggleHelpDialog?.();
        } else {
          onEscapeModal?.();
        }
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
      
      // Focus search box: Ctrl+F
      if (isCtrlPressed && event.key === 'f') {
        event.preventDefault();
        onFocusSearch?.();
        return;
      }
      
      // Add task to first column: Shift + N
      if (event.key === 'n' && event.shiftKey && !isCtrlPressed) {
        event.preventDefault();
        onAddTask?.('todo');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [undo, redo, canUndo, canRedo, onAddTask, onFocusSearch, onToggleHelpDialog, onEscapeModal, helpDialogOpen]);
  
  return {
    helpDialogOpen,
    setHelpDialogOpen
  };
}