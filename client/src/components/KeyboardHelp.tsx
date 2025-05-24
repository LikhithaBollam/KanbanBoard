import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface KeyboardShortcutProps {
  keys: string[];
  description: string;
}

const KeyboardShortcut: React.FC<KeyboardShortcutProps> = ({ keys, description }) => (
  <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-700">{description}</span>
    <div className="flex items-center space-x-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-gray-400 mx-1">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

interface KeyboardHelpProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const KeyboardHelp: React.FC<KeyboardHelpProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to navigate and manage your tasks more efficiently.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Navigation</h3>
            <div className="space-y-1">
              <KeyboardShortcut keys={["1"]} description="Focus Todo column" />
              <KeyboardShortcut keys={["2"]} description="Focus In Progress column" />
              <KeyboardShortcut keys={["3"]} description="Focus Done column" />
              <KeyboardShortcut keys={["↑", "↓"]} description="Navigate between tasks" />
              <KeyboardShortcut keys={["Ctrl", "F"]} description="Focus search box" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Task Management</h3>
            <div className="space-y-1">
              <KeyboardShortcut keys={["Shift", "N"]} description="Add new task" />
              <KeyboardShortcut keys={["←", "→"]} description="Move task between columns" />
              <KeyboardShortcut keys={["Ctrl", "Z"]} description="Undo last action" />
              <KeyboardShortcut keys={["Ctrl", "Y"]} description="Redo last action" />
              <KeyboardShortcut keys={["Esc"]} description="Close dialogs" />
              <KeyboardShortcut keys={["?"]} description="Show keyboard shortcuts" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardHelp;