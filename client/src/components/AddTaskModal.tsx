import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { TaskStatus, TaskStatusType, TaskType, Task } from '@shared/schema';
import { format } from 'date-fns';

// Extended schema for form validation with required fields
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: z.string().min(1, "Status is required"),
  type: z.string().min(1, "Type is required"),
  dueDate: z.string().optional(),
  userId: z.number().optional().nullable(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: TaskFormValues) => void;
  initialStatus?: TaskStatusType;
  editTask?: Task | null;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialStatus = TaskStatus.TODO,
  editTask = null
}) => {
  const isEditMode = !!editTask;
  
  // Prepare default values
  const getDefaultValues = () => {
    if (editTask) {
      return {
        title: editTask.title,
        description: editTask.description || '',
        status: editTask.status,
        type: editTask.type,
        dueDate: editTask.dueDate ? format(new Date(editTask.dueDate), 'yyyy-MM-dd') : '',
        userId: editTask.userId
      };
    }
    
    return {
      title: '',
      description: '',
      status: initialStatus,
      type: TaskType.FEATURE,
      dueDate: '',
      userId: null
    };
  };

  // Initialize form with react-hook-form
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: getDefaultValues()
  });

  // Update form when editTask changes
  useEffect(() => {
    if (isOpen) {
      form.reset(getDefaultValues());
    }
  }, [isOpen, editTask, initialStatus]);

  // Form submission handler
  const onSubmit = (values: TaskFormValues) => {
    // Make sure we have all required fields set
    const processedValues = {
      ...values,
      // Make sure status and type are provided
      status: values.status || (editTask ? editTask.status : initialStatus),
      type: values.type || (editTask ? editTask.type : TaskType.FEATURE),
      // Make sure description is either a string or empty string, not null
      description: values.description || '',
      // Keep due date as a string and let the server handle it
      dueDate: values.dueDate || ''
    };
    
    console.log("Submitting form with values:", processedValues);
    onSave(processedValues);
    form.reset();
    onClose();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Task' : 'Add New Task'}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter task title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter task description" 
                      {...field} 
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskType.FEATURE}>Feature</SelectItem>
                        <SelectItem value={TaskType.BUG}>Bug</SelectItem>
                        <SelectItem value={TaskType.ENHANCEMENT}>Enhancement</SelectItem>
                        <SelectItem value={TaskType.RESEARCH}>Research</SelectItem>
                        <SelectItem value={TaskType.DOCUMENTATION}>Documentation</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TaskStatus.TODO}>To Do</SelectItem>
                        <SelectItem value={TaskStatus.IN_PROGRESS}>In Progress</SelectItem>
                        <SelectItem value={TaskStatus.DONE}>Done</SelectItem>
                        {/* We need to extend this to include custom columns */}
                        {/* Add any custom columns as options */}
                        {Object.entries(TaskStatus)
                          .filter(([_, v]) => 
                            typeof v === 'string' && 
                            v !== TaskStatus.TODO && 
                            v !== TaskStatus.IN_PROGRESS && 
                            v !== TaskStatus.DONE
                          )
                          .map(([_, v]) => {
                            const value = v as string;
                            return (
                              <SelectItem key={value} value={value}>
                                {value.charAt(0).toUpperCase() + 
                                 value.slice(1).replace(/-/g, ' ')}
                              </SelectItem>
                            );
                          })
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="dueDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? 'Update Task' : 'Save Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTaskModal;
