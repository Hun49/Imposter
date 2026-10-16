import { useState, type FC, type FormEvent } from 'react';
import { X, Hash, ArrowRight, AlertCircle } from 'lucide-react';
import { useGameStore } from '../store/gameStore';

export const JoinModal: FC = () => {
  const { isJoinModalOpen, closeJoinModal, joinRoom } = useGameStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isJoinModalOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = code.trim().toUpperCase();
    if (clean.length < 4) {
      setError('Please enter a valid room code (at least 4 characters)');
      return;
    }

    const res = await joinRoom(clean);
    if (res.success) {
      setError(null);
      setCode('');
    } else {
      setError(res.error || 'Could not join room. Check the code and try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3.5 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-[340px] sm:max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl text-zinc-100">
        <button
          onClick={closeJoinModal}
          className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 mb-2 border border-blue-500/20">
            <Hash className="w-5 h-5" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white">
            Join Room
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Enter the room code shared by your host
          </p>
        </div>

        {error && (
          <div className="mb-3 p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-1 text-center">
              Room Code
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="ROOM CODE"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              className="w-full text-center tracking-[0.2em] text-xl font-mono font-bold uppercase py-2.5 px-3 rounded-xl bg-zinc-800/80 border border-zinc-700 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1.5 focus:ring-blue-500 transition-all"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <span>Enter Lobby</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
