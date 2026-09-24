// =============================================================================
// Input, Select, Textarea — form field primitives
// =============================================================================
import React from 'react';
import { cn } from '@/lib/utils';

const fieldBase = [
  'w-full rounded-md border border-neutral-300 bg-white px-3 py-2',
  'text-sm text-neutral-900 placeholder:text-neutral-400',
  'transition-colors duration-150',
  'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500',
  'disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-neutral-50',
  'read-only:bg-neutral-50',
];

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  helperText?: string;
  leftAddon?: React.ReactNode;
  rightAddon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, leftAddon, rightAddon, id, ...props }, ref) => {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative flex w-full items-center">
          {leftAddon && (
            <div className="absolute left-3 flex items-center text-neutral-400">{leftAddon}</div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              fieldBase,
              leftAddon  && 'pl-9',
              rightAddon && 'pr-9',
              error && 'border-danger-500 focus:ring-danger-500 focus:border-danger-500',
              className,
            )}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />
          {rightAddon && (
            <div className="absolute right-3 flex items-center text-neutral-400">{rightAddon}</div>
          )}
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1 text-xs text-danger-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1 text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string;
  label?: string;
  helperText?: string;
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, label, helperText, placeholder, id, children, ...props }, ref) => {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            fieldBase,
            'appearance-none pr-8',
            'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\'%3E%3Cpath d=\'m6 9 6 6 6-6\'/%3E%3C/svg%3E")] bg-no-repeat bg-right-2 bg-center',
            error && 'border-danger-500 focus:ring-danger-500',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children}
        </select>
        {error && <p className="mt-1 text-xs text-danger-600" role="alert">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
      </div>
    );
  },
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  label?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, label, helperText, id, ...props }, ref) => {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2)}`;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-neutral-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            fieldBase,
            'resize-y min-h-[80px]',
            error && 'border-danger-500 focus:ring-danger-500',
            className,
          )}
          aria-invalid={!!error}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-danger-600" role="alert">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-neutral-500">{helperText}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
