import { ReactNode } from 'react';

interface StatusPillProps {
  status: 'ok' | 'warn' | 'err';
  children: ReactNode;
}

export function StatusPill({ status, children }: StatusPillProps) {
  const colorMap = {
    ok: 'bg-state-ok text-white',
    warn: 'bg-state-warn text-white', 
    err: 'bg-state-err text-white'
  };

  return (
    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${colorMap[status]}`}>
      {children}
    </span>
  );
}