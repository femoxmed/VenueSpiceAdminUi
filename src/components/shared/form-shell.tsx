import type { PropsWithChildren, ReactNode } from 'react';

type FormShellProps = PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export function FormShell({ title, description, footer, children }: FormShellProps) {
  return (
    <div className='card p-5'>
      <div className='mb-4'>
        <h3 className='text-lg font-semibold text-slate-900'>{title}</h3>
        <p className='mt-1 text-sm text-slate-500'>{description}</p>
      </div>
      <div className='space-y-4'>{children}</div>
      {footer ? <div className='mt-4'>{footer}</div> : null}
    </div>
  );
}
