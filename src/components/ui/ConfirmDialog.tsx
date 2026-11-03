/* ============================================
   CONFIRMATION DIALOG — Apple visionOS Sheet
   ============================================ */

import React, { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialogA11y } from '@/lib/useDialogA11y';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDanger?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  description,
  confirmLabel = 'Conferma',
  cancelLabel = 'Annulla',
  onConfirm,
  onCancel,
  isDanger = false,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogA11y(isOpen, onCancel, dialogRef);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-2xl"
          onClick={onCancel}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-desc"
            tabIndex={-1}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="w-full max-w-[480px] bg-[#161618]/95 backdrop-blur-3xl rounded-t-modal border-t border-white/[0.12] p-6 pb-[calc(32px+env(safe-area-inset-bottom))] focus:outline-none shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Grab handle */}
            <div className="w-9 h-1 rounded-full bg-white/20 mx-auto mb-6" />

            <h3 id="confirm-dialog-title" className="text-heading font-semibold text-text-primary mb-2">
              {title}
            </h3>
            <p id="confirm-dialog-desc" className="text-body font-normal text-text-secondary mb-6">
              {description}
            </p>
            <div className="flex flex-col gap-2">
              <Button
                variant={isDanger ? 'danger' : 'primary'}
                fullWidth
                onClick={onConfirm}
              >
                {confirmLabel}
              </Button>
              <Button variant="ghost" fullWidth onClick={onCancel}>
                {cancelLabel}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
