import { Action, Middleware } from './types';

/**
 * Middleware for logging actions
 * Helps with debugging by showing what actions are being dispatched
 */
export const loggerMiddleware: Middleware = api => next => action => {
  // Log the action and current state
  console.group(`Action: ${action.type}`);
  console.log('Payload:', action.payload);
  if (action.meta) console.log('Meta:', action.meta);
  if (action.error) console.log('Error:', action.error);
  console.log('Current State:', api.getState());
  console.groupEnd();
  
  // Pass to the next middleware
  return next(action);
};