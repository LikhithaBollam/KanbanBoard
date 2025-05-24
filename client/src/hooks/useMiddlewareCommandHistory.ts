import { useEffect, useCallback } from 'react';
import { useMiddleware } from '@/middleware/useMiddleware';
import { Command } from '@/contexts/CommandHistoryContext';

/**
 * Custom hook to use the command history through the middleware system
 * This connects our existing command pattern with the new middleware architecture
 */
export function useMiddlewareCommandHistory() {
  // Connect to the middleware system
  const { state, dispatch, actions } = useMiddleware(state => ({
    past: state.commandHistory.past,
    future: state.commandHistory.future,
    canUndo: state.commandHistory.past.length > 0,
    canRedo: state.commandHistory.future.length > 0,
    isLoading: state.isLoading
  }));
  
  // Execute a command through the middleware
  const executeCommand = useCallback(async (command: Command) => {
    dispatch(actions.executeCommand(command));
  }, [dispatch, actions]);
  
  // Undo the last executed command
  const undo = useCallback(async () => {
    if (state.canUndo) {
      dispatch(actions.undoCommand());
    }
  }, [dispatch, actions, state.canUndo]);
  
  // Redo the last undone command
  const redo = useCallback(async () => {
    if (state.canRedo) {
      dispatch(actions.redoCommand());
    }
  }, [dispatch, actions, state.canRedo]);
  
  return {
    executeCommand,
    undo,
    redo,
    canUndo: state.canUndo,
    canRedo: state.canRedo,
    isLoading: state.isLoading,
    commandHistory: state.past,
    redoStack: state.future
  };
}