import { useToastStore, type ToastItem } from '@/stores/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, AlertTriangle, Sparkles, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <ToastItemComponent key={toast.id} toast={toast} onDismiss={() => removeToast(toast.id)} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItemComponent({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const icons = {
    default: null,
    success: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
    destructive: <AlertCircle className="h-4 w-4 text-destructive shrink-0" />,
    gesture: <Sparkles className="h-4 w-4 text-primary shrink-0" />,
  };

  const borderStyles = {
    default: 'border-border',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
    destructive: 'border-destructive/30 bg-destructive/5',
    gesture: 'border-primary/40 bg-primary/5 ring-1 ring-primary/20',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-lg border bg-card p-3.5 shadow-lg text-card-foreground',
        borderStyles[toast.type || 'default']
      )}
    >
      {icons[toast.type || 'default']}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold tracking-tight">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-muted-foreground break-words">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="rounded-sm opacity-60 hover:opacity-100 transition-opacity p-0.5"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </motion.div>
  );
}
