export function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 mt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 text-center text-xs text-gray-500 dark:text-gray-500 space-y-1">
        <p>
          Deadline data sourced from{" "}
          <a href="http://www.wikicfp.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900 dark:hover:text-gray-200 transition-colors">WikiCFP</a>
          {" "}and{" "}
          <a href="https://github.com/ccfddl/ccf-deadlines" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900 dark:hover:text-gray-200 transition-colors">ccf-deadlines</a>
          {" "}(MIT License).
          {" "}Rankings from{" "}
          <a href="https://www.core.edu.au/conference-portal" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900 dark:hover:text-gray-200 transition-colors">CORE 2023</a>
          {" "}and{" "}
          <a href="https://csrankings.org" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-900 dark:hover:text-gray-200 transition-colors">CSRankings</a>.
        </p>
        <p>All deadlines in AoE (UTC−12) unless otherwise noted.</p>
      </div>
    </footer>
  );
}
