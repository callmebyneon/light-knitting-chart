import type { ReactNode } from 'react';

type IconButtonProps = {
  icon: ReactNode;
  label: string;
  title?: string;
  isActive?: boolean;
  className?: string;
  onClick: () => void;
};

export default function IconButton({
  icon,
  label,
  title,
  isActive = false,
  className = '',
  onClick,
}: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={title ?? label}
      className={`flex h-8 w-8 items-center justify-center rounded-md transition ${
        isActive
          ? 'bg-sky-100 text-sky-700'
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      } ${className}`}
      onClick={onClick}
    >
      {icon}
    </button>
  );
}
