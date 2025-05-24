import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import KanbanBoard from "@/pages/KanbanBoard";
import { CommandHistoryProvider } from "@/contexts/CommandHistoryContext";

function Router() {
  return (
    <Switch>
      {/* Add pages below */}
      <Route path="/" component={KanbanBoard} />
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <CommandHistoryProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </CommandHistoryProvider>
    </QueryClientProvider>
  );
}

export default App;
