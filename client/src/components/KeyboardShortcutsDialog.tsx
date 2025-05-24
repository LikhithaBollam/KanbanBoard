import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ShortcutItemProps {
  keys: string[];
  description: string;
}

const ShortcutItem: React.FC<ShortcutItemProps> = ({ keys, description }) => (
  <div className="flex justify-between py-2 border-b border-gray-100 last:border-0">
    <span className="text-gray-700">{description}</span>
    <div className="flex items-center space-x-1">
      {keys.map((key, index) => (
        <React.Fragment key={key}>
          <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">
            {key}
          </kbd>
          {index < keys.length - 1 && <span className="text-gray-500">+</span>}
        </React.Fragment>
      ))}
    </div>
  </div>
);

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ isOpen, onClose }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>
            Use these keyboard shortcuts to quickly navigate and manage your tasks.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Navigation</h3>
            <div className="space-y-1">
              <ShortcutItem keys={['1']} description="Focus Todo column" />
              <ShortcutItem keys={['2']} description="Focus In Progress column" />
              <ShortcutItem keys={['3']} description="Focus Done column" />
              <ShortcutItem keys={['↑', '↓']} description="Navigate between tasks in a column" />
              <ShortcutItem keys={['Ctrl', 'F']} description="Focus search box" />
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-500 mb-2">Actions</h3>
            <div className="space-y-1">
              <ShortcutItem keys={['Shift', 'N']} description="Add new task" />
              <ShortcutItem keys={['←', '→']} description="Move task between columns (when a task is focused)" />
              <ShortcutItem keys={['Ctrl', 'Z']} description="Undo last action" />
              <ShortcutItem keys={['Ctrl', 'Y']} description="Redo action" />
              <ShortcutItem keys={['Esc']} description="Close dialogs" />
              <ShortcutItem keys={['?']} description="Show this help dialog" />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;