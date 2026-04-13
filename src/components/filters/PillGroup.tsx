import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: ReactNode;
  activeClass?: string;
}

interface Props<T extends string> {
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
}

export function PillGroup<T extends string>({ options, value, onChange, label }: Props<T>) {
  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 shrink-0">
          {label}
        </span>
      )}
      <div className="flex gap-1 flex-nowrap">
        {options.map((opt) => {
          const isActive = value === opt.value;
          const activeClass = opt.activeClass ?? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white";
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              className={cn(
                "px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors border",
                isActive
                  ? activeClass
                  : "bg-transparent text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
