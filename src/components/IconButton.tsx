import { ReactNode, ButtonHTMLAttributes } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export function IconButton({ 
  children, 
  variant = 'ghost', 
  size = 'md', 
  className = '', 
  ...props 
}: IconButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2';
  
  const variantClasses = {
    primary: 'bg-brand text-white hover:bg-brand-hover',
    secondary: 'bg-gray-100 text-ink-800 hover:bg-gray-200',
    ghost: 'text-ink-600 hover:bg-gray-100'
  };
  
  const sizeClasses = {
    sm: 'p-1.5 text-sm',
    md: 'p-2',
    lg: 'p-3 text-lg'
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}