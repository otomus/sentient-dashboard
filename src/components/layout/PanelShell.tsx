import type { ReactNode } from "react";

interface Props {
  title: string;
  className?: string;
  children: ReactNode;
  actions?: ReactNode;
}

export function PanelShell({ title, className = "", children, actions }: Props) {
  return (
    <div className={`glass-panel flex flex-col overflow-hidden ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--glass-border)] shrink-0">
        <span className="text-[9px] font-bold tracking-[1.5px] uppercase text-[var(--dim)]">
          {title}
        </span>
        {actions}
      </div>
      <div className="flex-1 overflow-hidden">{children}</div>
    </div>
  );
}
