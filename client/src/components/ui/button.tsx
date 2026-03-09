import { forwardRef } from 'react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={twMerge(
          clsx(
            'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
            {
              'bg-gold-500 text-black hover:bg-gold-400 focus:ring-gold-500': variant === 'primary',
              'bg-zinc-800 text-white hover:bg-zinc-700 focus:ring-zinc-500': variant === 'secondary',
              'border border-white/20 text-white hover:bg-white/5 focus:ring-white': variant === 'outline',
              'text-white hover:bg-white/5 focus:ring-white': variant === 'ghost',
              'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500': variant === 'danger',
              'px-3 py-1.5 text-sm': size === 'sm',
              'px-4 py-2 text-base': size === 'md',
              'px-6 py-3 text-lg': size === 'lg',
            }
          ),
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
