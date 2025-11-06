import React from 'react';

interface AIActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  icon?: React.ElementType;
}

export function AIActionButton({
  children,
  variant = 'primary',
  icon,
  ...props
}: AIActionButtonProps) {
  const baseStyle =
    'px-4 py-2 rounded-lg font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]';

  const styles = {
    primary: 'bg-gradient-to-r from-purple-500 to-blue-500 text-white',
    secondary:
      'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600',
  };

  const Icon = icon;

  return (
    <button className={`${baseStyle} ${styles[variant]}`} {...props}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
}

