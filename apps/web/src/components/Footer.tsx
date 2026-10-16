import type { FC } from 'react';

export const Footer: FC = () => {
  return (
    <footer className="w-full border-t border-zinc-800/80 py-5 px-4 bg-zinc-950/60 backdrop-blur-sm mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-zinc-500">
        <div className="flex items-center gap-1.5">
          <span>&copy; {new Date().getFullYear()} Imposter.</span>
          <span>All rights reserved.</span>
        </div>
        <div className="flex items-center gap-1">
          <span>Powered by</span>
          <span className="font-semibold text-zinc-300 tracking-wide">
            Huntech
          </span>
        </div>
      </div>
    </footer>
  );
};
