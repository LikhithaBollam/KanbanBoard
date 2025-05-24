import React from 'react';
import { useCommandHistory } from '@/contexts/CommandHistoryContext';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const CommandHistoryToolbar: React.FC = () => {
  const { canUndo, canRedo, undo, redo } = useCommandHistory();

  return (
    <div className="flex items-center space-x-2 justify-end pr-4">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => undo()}
              disabled={!canUndo}
              aria-label="Undo"
              className="h-8 w-8"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Undo last action (Ctrl+Z)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              onClick={() => redo()}
              disabled={!canRedo}
              aria-label="Redo"
              className="h-8 w-8"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Redo last undone action (Ctrl+Y)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

export default CommandHistoryToolbar;