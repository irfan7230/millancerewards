// =============================================================================
// Card — design-system primitive
// =============================================================================
import React from 'react';
import { cn } from '@/lib/utils';
import { motion, type HTMLMotionProps } from 'framer-motion';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  glass?: boolean;
}

export function Card({ className, hover, padding = 'md', glass, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-white border border-neutral-200/80 shadow-sm transition-all duration-200 overflow-hidden',
        hover && 'hover:shadow-md hover:border-neutral-300 cursor-pointer hover:-translate-y-0.5',
        glass && 'card-glass',
        padding === 'none' && 'p-0',
        padding === 'sm'   && 'p-4',
        padding === 'md'   && 'p-6',
        padding === 'lg'   && 'p-8',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function MotionCard({ className, hover, padding = 'md', glass, children, ...props }: CardProps & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={cn(
        'rounded-2xl bg-white border border-neutral-200/80 shadow-sm overflow-hidden',
        hover && 'hover:shadow-md hover:border-neutral-300 cursor-pointer',
        glass && 'card-glass',
        padding === 'none' && 'p-0',
        padding === 'sm'   && 'p-4',
        padding === 'md'   && 'p-6',
        padding === 'lg'   && 'p-8',
        className,
      )}
      whileHover={hover ? { y: -2, transition: { duration: 0.2 } } : undefined}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex flex-col gap-1.5 pb-4', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-lg font-semibold tracking-tight text-neutral-900', className)} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-sm text-neutral-500', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('flex items-center pt-5 mt-2 border-t border-neutral-100', className)} {...props}>
      {children}
    </div>
  );
}

// Stat card for dashboards
interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: { value: number; label: string };
  accent?: 'brand' | 'accent' | 'success' | 'warning' | 'info' | 'danger';
  className?: string;
}

export function StatCard({ title, value, description, icon, trend, accent = 'brand', className }: StatCardProps) {
  return (
    <Card hover className={cn('relative overflow-hidden group', className)}>
      {/* Decorative gradient blob */}
      <div className={cn(
        'absolute -right-8 -top-8 w-24 h-24 rounded-full opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-150',
        `stat-accent-${accent}`
      )} />
      
      <div className="relative flex items-start justify-between z-10">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-neutral-900 tabular-nums">{value}</p>
          
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold',
                trend.value >= 0 ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700',
              )}>
                {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
              </span>
            )}
            {description && <span className="text-xs text-neutral-500 truncate">{description}</span>}
          </div>
        </div>
        
        {icon && (
          <div className={cn(
            'shrink-0 ml-4 h-12 w-12 rounded-xl flex items-center justify-center shadow-sm',
            accent === 'brand' && 'bg-brand-50 text-brand-600 border border-brand-100',
            accent === 'accent' && 'bg-accent-50 text-accent-600 border border-accent-100',
            accent === 'success' && 'bg-success-50 text-success-600 border border-success-100',
            accent === 'warning' && 'bg-warning-50 text-warning-600 border border-warning-100',
            accent === 'info' && 'bg-info-50 text-info-600 border border-info-100',
            accent === 'danger' && 'bg-danger-50 text-danger-600 border border-danger-100',
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
