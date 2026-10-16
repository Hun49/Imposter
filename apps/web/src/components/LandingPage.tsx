import type { FC } from 'react';
import { PlusCircle, Users, LogIn } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const LandingPage: FC = () => {
  const { user, createRoom, openJoinModal, openAuthModal } = useGameStore();
  const isLoggedIn = Boolean(user);

  const handleCreateRoom = async () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    await createRoom();
  };

  const handleJoinRoom = () => {
    if (!isLoggedIn) {
      openAuthModal();
      return;
    }
    openJoinModal();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-12 sm:py-20 text-center relative overflow-hidden">
      {/* Atmospheric ambient glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[500px] h-[320px] sm:h-[500px] bg-rose-600/10 rounded-full blur-[110px] -z-10 pointer-events-none" />

      {/* Big Stylish Imposter Lettering */}
      <div className="relative mb-4">
        <h1 className="font-eerie tracking-wider text-6xl sm:text-8xl md:text-9xl lg:text-[10rem] font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-200 to-rose-600 creepy-glow select-none">
          IMPOSTER
        </h1>
        <div className="absolute -bottom-2 sm:-bottom-3 left-1/2 -translate-x-1/2 w-28 sm:w-48 h-1 bg-gradient-to-r from-transparent via-rose-600 to-transparent opacity-80" />
      </div>

      {/* Subtext */}
      <p className="max-w-xs sm:max-w-sm mx-auto text-xs sm:text-sm text-zinc-400 leading-relaxed font-normal mb-10 tracking-wide">
        Everyone receives the secret word except one. Listen carefully, blend in, and survive the vote.
      </p>

      {/* Main Buttons */}
      <div className="w-full max-w-xs sm:max-w-md flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5 sm:gap-4 mb-6">
        {/* Create Room Button (Blue) */}
        <button
          onClick={handleCreateRoom}
          className="flex-1 py-4 px-6 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-sm sm:text-base shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <PlusCircle className="w-5 h-5 shrink-0" />
          <span>Create Room</span>
        </button>

        {/* Join Room Button */}
        <button
          onClick={handleJoinRoom}
          className="flex-1 py-4 px-6 rounded-2xl bg-zinc-900 hover:bg-zinc-800 active:scale-[0.98] text-zinc-100 font-bold text-sm sm:text-base border border-zinc-800 shadow-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
        >
          <Users className="w-5 h-5 shrink-0" />
          <span>Join Room</span>
        </button>
      </div>

      {/* Sign In CTA ONLY if NOT logged in. Once logged in, no CTA is rendered here */}
      {!isLoggedIn && (
        <div className="mt-1">
          <button
            onClick={openAuthModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-blue-400" />
            <span>Sign In</span>
          </button>
        </div>
      )}
    </div>
  );
};
