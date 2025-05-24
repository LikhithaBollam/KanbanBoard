import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';

const columnSchema = z.object({
  id: z.string().min(2, { message: "Column ID must be at least 2 characters" }),
  title: z.string().min(2, { message: "Title must be at least 2 characters" }),
  color: z.string().min(1, { message: "Please select a color" })
});

type ColumnFormValues = z.infer<typeof columnSchema>;

interface AddColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (formData: ColumnFormValues) => void;
}

const AddColumnModal: React.FC<AddColumnModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [selectedColor, setSelectedColor] = useState('bg-primary');
  
  const colorOptions = [
    { value: 'bg-primary', label: 'Blue' },
    { value: 'bg-success', label: 'Green' },
    { value: 'bg-warning', label: 'Orange' },
    { value: 'bg-purple-500', label: 'Purple' },
    { value: 'bg-red-500', label: 'Red' },
    { value: 'bg-yellow-500', label: 'Yellow' },
  ];

  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm<ColumnFormValues>({
    resolver: zodResolver(columnSchema),
    defaultValues: {
      id: '',
      title: '',
      color: 'bg-primary',
    }
  });

  // Set the color in the form when a color is selected
  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    setValue('color', color);
  };

  const onSubmit = (formData: ColumnFormValues) => {
    // Convert the id to lowercase and replace spaces with dashes
    formData.id = formData.id.toLowerCase().replace(/\s+/g, '-');
    console.log("Saving column:", formData);
    onSave(formData);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 modal-backdrop">
      <div className="bg-white rounded-lg w-full max-w-md p-6 shadow-xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Add New Column</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-4">
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Column Title
            </label>
            <input
              id="title"
              type="text"
              {...register('title')}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="e.g., To Review, In Testing"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>

          <div className="mb-4">
            <label htmlFor="id" className="block text-sm font-medium text-gray-700 mb-1">
              Column ID (used in system)
            </label>
            <input
              id="id"
              type="text"
              {...register('id')}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary"
              placeholder="e.g., review, testing"
            />
            {errors.id && <p className="mt-1 text-sm text-red-600">{errors.id.message}</p>}
            <p className="text-xs text-gray-500 mt-1">Lowercase letters, numbers, hyphens. Spaces will be converted to hyphens.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Column Color
            </label>
            <div className="flex flex-wrap gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  className={`w-8 h-8 rounded-full ${color.value} border-2 ${
                    selectedColor === color.value ? 'border-gray-800' : 'border-transparent'
                  }`}
                  onClick={() => handleColorSelect(color.value)}
                  aria-label={`Select ${color.label} color`}
                  title={color.label}
                />
              ))}
            </div>
            {errors.color && <p className="mt-1 text-sm text-red-600">{errors.color.message}</p>}
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Column
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddColumnModal;