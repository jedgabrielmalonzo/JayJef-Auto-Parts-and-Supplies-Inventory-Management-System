import { AlertTriangle } from 'lucide-react';
import Button from './Button.jsx';

export default function ConfirmDialog({ open, title, description, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black-900/40 px-4 backdrop-blur-sm motion-safe:animate-fade-in">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md motion-safe:animate-scale-in">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
          <AlertTriangle size={20} className="text-red-600" strokeWidth={2} />
        </div>
        <h2 className="mt-3 font-heading font-bold text-lg text-black-900">{title}</h2>
        <p className="mt-2 text-sm text-black-700">{description}</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
