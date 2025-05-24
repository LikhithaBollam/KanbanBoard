import { useCallback, useEffect, useState } from 'react';
import { store } from './store';
import { Action } from './types';

/**
 * Custom hook to connect React components to our middleware system
 * This provides a Redux-like interface for components
 */
export function useMiddleware<T = any>(
  selector: (state: any) => T,
  dependencies: any[] = []
) {
  // Extract the selected slice of state
  const [selectedState, setSelectedState] = useState(() => selector(store.getState()));
  
  // Update the selected state when the store state changes
  useEffect(() => {
    // Simple implementation of a subscription system
    let mounted = true;
    
    // Initial selection
    setSelectedState(selector(store.getState()));
    
    // Create an interval to check for state changes
    // In a real implementation, we would use a proper subscription system
    const intervalId = setInterval(() => {
      if (mounted) {
        const newSelectedState = selector(store.getState());
        
        // Only update if the selected state has changed
        if (JSON.stringify(newSelectedState) !== JSON.stringify(selectedState)) {
          setSelectedState(newSelectedState);
        }
      }
    }, 100);
    
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
  }, [...dependencies, selectedState]);
  
  // Create a dispatch function
  const dispatch = useCallback((action: Action) => {
    return store.dispatch(action);
  }, []);
  
  // Return the selected state and dispatch function
  return { state: selectedState, dispatch, actions: store.actions };
}

/**
 * Example usage:
 * 
 * function TaskList() {
 *   const { state, dispatch, actions } = useMiddleware(
 *     state => ({
 *       tasks: state.tasks,
 *       isLoading: state.isLoading,
 *       error: state.error
 *     })
 *   );
 * 
 *   useEffect(() => {
 *     dispatch(actions.fetchTasks());
 *   }, [dispatch, actions]);
 * 
 *   return (
 *     <div>
 *       {state.isLoading ? (
 *         <p>Loading...</p>
 *       ) : state.error ? (
 *         <p>Error: {state.error}</p>
 *       ) : (
 *         <ul>
 *           {state.tasks.map(task => (
 *             <li key={task.id}>{task.title}</li>
 *           ))}
 *         </ul>
 *       )}
 *     </div>
 *   );
 * }
 */