import React from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { motion } from 'framer-motion';

const CrudActions = ({ onView, onEdit, onDelete, itemName = "item" }) => {
  return (
    <div className="flex items-center gap-1">
      {/* Read / View */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onView}
          className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 h-8 w-8 rounded-full"
          title="View Details"
        >
          <Eye className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Update / Edit */}
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={onEdit}
          className="text-yellow-400 hover:text-yellow-300 hover:bg-yellow-400/10 h-8 w-8 rounded-full"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </motion.div>

      {/* Delete with Confirmation */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="inline-block">
            <Button
              variant="ghost"
              size="icon"
              className="text-red-400 hover:text-red-300 hover:bg-red-400/10 h-8 w-8 rounded-full"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </motion.div>
        </AlertDialogTrigger>
        <AlertDialogContent className="bg-slate-900 border-2 border-red-500/20 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-bold text-red-400">Delete {itemName}?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              This action cannot be undone. This will permanently remove the record from the database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 text-white hover:bg-slate-700 border-gray-700">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDelete}
              className="bg-red-500 text-white hover:bg-red-600 border-none"
            >
              Delete Record
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CrudActions;