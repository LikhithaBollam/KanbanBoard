import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { HelpCircle } from 'lucide-react';

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-700">{description}</span>
    <div className="flex items-center space-x-1">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-gray-400 mx-1">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

const KeyboardShortcutsInfo: React.FC = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="ml-2" 
          title="Keyboard Shortcuts"
          aria-label="Show keyboard shortcuts"
        >
          <HelpCircle className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and manage your tasks more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">General</h3>
            <div className="space-y-1">
              <ShortcutItem keys={["?"]} description="Show this help dialog" />
              <ShortcutItem keys={["Esc"]} description="Close dialogs" />
              <ShortcutItem keys={["Ctrl", "F"]} description="Focus search box" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Task Management</h3>
            <div className="space-y-1">
              <ShortcutItem keys={["Shift", "N"]} description="Add new task" />
              <ShortcutItem keys={["Ctrl", "Z"]} description="Undo last action" />
              <ShortcutItem keys={["Ctrl", "Y"]} description="Redo last action" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsInfo;