import type { PropsWithChildren, ReactNode } from 'react';
import { X } from 'lucide-react';

type ModalProps = PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
}>;

export function Modal({ open, title, description, onClose, footer, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm'>
      <div className='w-full max-w-2xl rounded-[28px] border border-white/10 bg-white shadow-soft'>
        <div className='flex items-start justify-between border-b border-slate-100 px-6 py-5'>
          <div>
            <h3 className='text-xl font-semibold text-slate-900'>{title}</h3>
            {description ? <p className='mt-1 text-sm text-slate-500'>{description}</p> : null}
          </div>
          <button
            onClick={onClose}
            className='rounded-xl border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50'
          >
            <X size={18} />
          </button>
        </div>

        <div className='max-h-[70vh] overflow-auto px-6 py-5'>
          {children}
        </div>

        {footer ? (
          <div className='flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4'>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
