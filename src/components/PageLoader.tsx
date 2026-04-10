import { cn } from '../lib/utils';

interface PageLoaderProps {
  rows?: number;
  className?: string;
}

export default function PageLoader({ rows = 5, className }: PageLoaderProps) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      {/* Header skeleton */}
      <div className="flex gap-4 mb-2">
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-7 w-32 ml-auto" />
      </div>
      {/* Table skeleton */}
      <div className="card card-body p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              {Array.from({ length: 5 }).map((_, i) => (
                <th key={i}><div className="skeleton h-4 w-24" /></th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <td key={j}><div className="skeleton h-4 w-full" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
