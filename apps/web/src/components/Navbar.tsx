import type { FC } from 'react';
import { LogIn, LogOut, Skull, ArrowLeft } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const Navbar: FC = () => {
  const { user, roomCode, leaveRoom, openAuthModal, signOutUser } = useGameStore();

  const username = user?.username || user?.name || 'Player';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: Brand / Leave Room */}
        <div className="flex items-center gap-2.5">
          {roomCode && (
            <button
              onClick={leaveRoom}
              className="p-1.5 -ml-1 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60 transition-colors flex items-center gap-1 text-xs font-medium cursor-pointer"
              title="Leave Room"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          )}

          <div
            onClick={() => {
              if (roomCode) leaveRoom();
            }}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-500/15 text-rose-500 flex items-center justify-center border border-rose-500/30 group-hover:scale-105 transition-transform">
              <Skull className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </div>
            <span className="font-eerie tracking-wider text-lg sm:text-xl font-bold text-white group-hover:text-rose-400 transition-colors">
              IMPOSTER
            </span>
          </div>
        </div>

        {/* Right: Real User State / Sign In */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                <div className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-[10px]">
                  {username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-zinc-200 max-w-[90px] sm:max-w-[120px] truncate">
                  {username}
                </span>
              </div>
              <button
                onClick={signOutUser}
                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openAuthModal}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors shadow-sm cursor-pointer active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
