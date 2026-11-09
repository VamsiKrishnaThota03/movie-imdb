import { AlertTriangle, Film } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
      <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-medium text-destructive">{message}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-2 text-sm font-medium underline underline-offset-2 hover:text-foreground"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyNotice({ title, children, className }: { title: string; children?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mx-auto max-w-md rounded-xl border border-dashed p-10 text-center', className)}>
      <Film className="mx-auto size-10 text-muted-foreground/60" aria-hidden="true" />
      <p className="mt-4 font-medium">{title}</p>
      {children && <div className="mt-1 text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
