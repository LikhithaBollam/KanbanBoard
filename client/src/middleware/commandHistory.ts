import { Action, Middleware, ActionType } from './types';
import { Command } from '@/contexts/CommandHistoryContext';

/**
 * Middleware for handling command history (undo/redo)
 * Works with our existing Command pattern implementation
 */
export const commandHistoryMiddleware: Middleware = api => next => async (action: Action) => {
  // Pass the action to the next middleware first
  const result = next(action);
  
  switch (action.type) {
    case ActionType.EXECUTE_COMMAND:
      try {
        const command = action.payload as Command;
        
        // Execute the command
        await command.execute();
        
        // Update command history in state
        const state = api.getState();
        const updatedState = {
          commandHistory: {
            past: [...state.commandHistory.past, command],
            future: []
          }
        };
        
        // Update the state
        api.dispatch({ 
          type: ActionType.EXECUTE_COMMAND_SUCCESS, 
          payload: command
        });
        
      } catch (error) {
        api.dispatch({ 
          type: ActionType.EXECUTE_COMMAND_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to execute command',
          error: true
        });
      }
      break;
      
    case ActionType.UNDO_COMMAND:
      try {
        const state = api.getState();
        const { past, future } = state.commandHistory;
        
        if (past.length === 0) {
          console.log('Nothing to undo');
          break;
        }
        
        // Get the last executed command
        const commandToUndo = past[past.length - 1];
        
        // Undo the command
        await commandToUndo.undo();
        
        // Update command history
        const updatedState = {
          commandHistory: {
            past: past.slice(0, past.length - 1),
            future: [commandToUndo, ...future]
          }
        };
        
        // Update the state
        api.dispatch({ 
          type: ActionType.UNDO_COMMAND_SUCCESS, 
          payload: commandToUndo
        });
        
      } catch (error) {
        api.dispatch({ 
          type: ActionType.UNDO_COMMAND_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to undo command',
          error: true
        });
      }
      break;
      
    case ActionType.REDO_COMMAND:
      try {
        const state = api.getState();
        const { past, future } = state.commandHistory;
        
        if (future.length === 0) {
          console.log('Nothing to redo');
          break;
        }
        
        // Get the first undone command
        const commandToRedo = future[0];
        
        // Redo the command
        await commandToRedo.execute();
        
        // Update command history
        const updatedState = {
          commandHistory: {
            past: [...past, commandToRedo],
            future: future.slice(1)
          }
        };
        
        // Update the state
        api.dispatch({ 
          type: ActionType.REDO_COMMAND_SUCCESS, 
          payload: commandToRedo
        });
        
      } catch (error) {
        api.dispatch({ 
          type: ActionType.REDO_COMMAND_ERROR, 
          payload: error instanceof Error ? error.message : 'Failed to redo command',
          error: true
        });
      }
      break;
  }
  
  return result;
};