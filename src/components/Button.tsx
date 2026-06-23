import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ai text-white hover:bg-ai-dark',
  secondary: 'bg-ai-light text-ai hover:bg-ai/20',
  danger: 'bg-beni text-white hover:bg-beni/90',
  ghost: 'bg-transparent text-muted hover:bg-tatami'
};

export function Button({ variant = 'primary', fullWidth, className = '', children, ...props }: ButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-full px-6 py-2.5 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
