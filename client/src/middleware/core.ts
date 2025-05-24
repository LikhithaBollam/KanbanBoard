import { Action, Middleware, MiddlewareAPI } from './types';

/**
 * Creates a middleware pipeline that processes actions
 * @param middlewares Array of middleware functions
 * @returns A function that processes actions through the middleware chain
 */
export function createMiddlewareChain(middlewares: Middleware[], initialState: any = {}) {
  // Create a store-like object that middlewares can interact with
  let state = initialState;
  
  const api: MiddlewareAPI = {
    dispatch: (action: Action) => processAction(action),
    getState: () => state,
  };
  
  // Build the middleware chain
  const chain = middlewares.map(middleware => middleware(api));
  
  // Function to process an action through the middleware chain
  function processAction(action: Action): any {
    // The last middleware in the chain just returns the action
    let index = 0;
    
    function next(i: number) {
      return (action: Action) => {
        if (i >= chain.length) {
          // This is where we would apply the action to the state
          // in a real Redux-like implementation
          if (action.type.includes('_SUCCESS') || action.type.includes('_ERROR')) {
            console.log('Action processed through middleware chain:', action);
          }
          return action;
        }
        return chain[i](next(i + 1))(action);
      };
    }
    
    return next(0)(action);
  }
  
  return {
    dispatch: processAction,
    getState: () => state,
    // Method to update state, simulating a reducer
    updateState: (newState: any) => {
      state = { ...state, ...newState };
    }
  };
}