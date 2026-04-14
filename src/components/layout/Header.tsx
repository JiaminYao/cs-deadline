import { Github } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { TimezoneSelector } from "./TimezoneSelector";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0">
            <span className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              CS Conference Deadlines
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              Deadlines in <TimezoneSelector />
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/JiaminYao/CSDeadline"
            target="_blank"
            rel="noopener noreferrer"
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
