// =============================================================================
// Button — design-system primitive
// Variants: primary | secondary | ghost | destructive | outline | accent
// Sizes: sm | md | lg
// =============================================================================
import React from 'react';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium',
    'transition-all duration-200 ease-out',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed',
    'select-none active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'bg-brand-600 text-white shadow-sm hover:shadow btn-glow',
          'hover:bg-brand-500',
          'focus-visible:ring-brand-500',
        ],
        secondary: [
          'bg-white text-neutral-700 border border-neutral-200 shadow-sm',
          'hover:bg-neutral-50 hover:border-neutral-300',
          'focus-visible:ring-neutral-400',
        ],
        ghost: [
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          'focus-visible:ring-neutral-400',
        ],
        destructive: [
          'bg-danger-600 text-white shadow-sm hover:shadow',
          'hover:bg-danger-500',
          'focus-visible:ring-danger-500',
        ],
        outline: [
          'border-2 border-brand-500 text-brand-600 bg-transparent',
          'hover:bg-brand-50',
          'focus-visible:ring-brand-500',
        ],
        accent: [
          'bg-accent-600 text-white shadow-sm hover:shadow',
          'hover:bg-accent-500',
          'focus-visible:ring-accent-500',
        ],
        glass: [
          'bg-white/50 backdrop-blur-md text-neutral-800 border border-white/60 shadow-sm',
          'hover:bg-white/80',
          'focus-visible:ring-neutral-400',
        ],
      },
      size: {
        xs:  'h-7 px-2.5 text-xs rounded-md',
        sm:  'h-8 px-3 text-sm',
        md:  'h-10 px-4 text-sm',
        lg:  'h-12 px-6 text-base',
        xl:  'h-14 px-8 text-base',
        icon: 'h-10 w-10 p-0',
        'icon-sm': 'h-8 w-8 p-0 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin shrink-0" aria-hidden="true" />
        ) : leftIcon ? (
          <span className="shrink-0" aria-hidden="true">{leftIcon}</span>
        ) : null}
        <span className="truncate">{children}</span>
        {rightIcon && !loading && (
          <span className="shrink-0" aria-hidden="true">{rightIcon}</span>
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';

export { buttonVariants };
