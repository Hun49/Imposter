import { useState, type FC } from 'react';
import {
  Copy,
  Check,
  Clock,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Flame,
  AlertTriangle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useGameStore } from '../store/gameStore';
import { MIN_PLAYERS_TO_START, TIMER_PRESETS } from '@imposter/shared';

export const LobbyScreen: FC = () => {
  const {
    user,
    roomCode,
    phase,
    hostId,
    players,
    timerMinutes,
    remainingSeconds,
    isMyCardFlipped,
    myRole,
    revealedData,
    error,
    toggleReady,
    setTimerMinutes,
    startRound,
    revealAllCards,
    startNextRound,
    toggleMyCard,
    clearError,
  } = useGameStore();

  const userId = user?.id;

  const [copied, setCopied] = useState(false);
  const [customMinutes, setCustomMinutes] = useState(timerMinutes.toString());
  const [showCustomInput, setShowCustomInput] = useState(false);

  const handleCopyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCustomTimeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(customMinutes, 10);
    if (!isNaN(val)) {
      setTimerMinutes(val);
      setShowCustomInput(false);
    }
  };

  const myPlayer = players.find((p) => p.id === userId) || players[0];
  const isMeReady = myPlayer?.isReady ?? false;
  const isHostUser = userId === hostId;
  const allReady = players.length >= MIN_PLAYERS_TO_START && players.every((p) => p.isReady);

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex-1 flex flex-col max-w-5xl w-full mx-auto px-4 py-4 sm:py-6">
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={clearError}
            className="text-xs text-red-300 hover:text-white font-bold ml-2 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* =========================================================================
          TOP ROW: Timer at Left, Room Code at Right
      ========================================================================= */}
      <div className="flex items-center justify-between mb-6 pt-1">
        {/* Left: Timer */}
        <div className="flex items-center gap-2.5">
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-2xl font-mono text-xl sm:text-2xl font-extrabold tracking-tight transition-all ${
              phase === 'AWAITING_REVEAL'
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/40 animate-pulse'
                : remainingSeconds <= 60 && phase === 'ACTIVE'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/40 animate-pulse'
                  : 'bg-zinc-900 text-zinc-100 border border-zinc-800'
            }`}
          >
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-zinc-400" />
            <span>{formatTime(remainingSeconds)}</span>
          </div>
        </div>

        {/* Right: Room Code */}
        <div className="flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-zinc-900 border border-zinc-800">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            Code:
          </span>
          <span className="font-mono text-sm sm:text-base font-black tracking-widest text-zinc-100">
            {roomCode || 'ROOM77'}
          </span>
          <button
            onClick={handleCopyCode}
            className="p-1 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Copy room code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* =========================================================================
          PLAYERS SECTION: Title "Players", spaced cards, no avatar boxes
      ========================================================================= */}
      <div className="mb-7 sm:mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">
            Players ({players.length})
          </h2>
          {players.length < MIN_PLAYERS_TO_START && (
            <span className="text-xs text-amber-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Minimum {MIN_PLAYERS_TO_START} players needed
            </span>
          )}
        </div>

        {/* 2-column card grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {players.map((slot) => {
            const isMe = slot.id === userId;
            const isImposterRevealed =
              revealedData && revealedData.imposterId === slot.id;

            return (
              <div
                key={slot.id}
                onClick={() => {
                  if (isMe && phase === 'ACTIVE') {
                    toggleMyCard();
                  }
                }}
                className={`relative rounded-2xl p-4 sm:p-5 border border-zinc-800 bg-zinc-900 transition-all duration-200 shadow-sm ${
                  isMe && phase === 'ACTIVE' ? 'cursor-pointer active:scale-[0.99]' : ''
                } ${
                  phase === 'REVEALED' && isImposterRevealed
                    ? 'ring-2 ring-rose-500/70 bg-rose-950/20'
                    : ''
                }`}
              >
                {/* Header row of Card: Name & Ready Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm sm:text-base text-zinc-100">
                      {slot.name}
                    </span>
                    {slot.isHost && (
                      <span className="text-[11px] font-semibold text-zinc-400">
                        (Host)
                      </span>
                    )}
                  </div>

                  {/* Ready / Not Ready status pill */}
                  <div>
                    {slot.isReady ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1 shadow-sm">
                        <Check className="w-3.5 h-3.5" />
                        READY
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700 text-xs font-medium">
                        NOT READY
                      </span>
                    )}
                  </div>
                </div>

                {/* Body of Card: Dynamic per game phase */}
                <div className="mt-1 pt-3 border-t border-zinc-800/80">
                  {phase === 'LOBBY' && (
                    <div className="text-xs text-zinc-400 flex items-center justify-between">
                      <span>Waiting in room</span>
                      {isMe && (
                        <span className="text-blue-400 font-semibold text-[11px]">
                          Your Card
                        </span>
                      )}
                    </div>
                  )}

                  {phase === 'ACTIVE' && (
                    <div>
                      {isMe ? (
                        /* Current Player's interactive card */
                        <div
                          className={`p-3.5 rounded-xl text-center border transition-all ${
                            isMyCardFlipped
                              ? myRole?.isImposter
                                ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                              : 'bg-zinc-850 border-dashed border-zinc-700 hover:border-zinc-600 text-zinc-200'
                          }`}
                        >
                          {isMyCardFlipped ? (
                            <div>
                              <div className="flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                                <EyeOff className="w-3 h-3" />
                                <span>Tap to conceal</span>
                              </div>
                              {myRole?.isImposter ? (
                                <div className="py-1">
                                  <div className="text-lg sm:text-xl font-black font-eerie text-rose-400 tracking-wider">
                                    YOU ARE THE IMPOSTER
                                  </div>
                                  <p className="text-[10px] text-rose-400/90 mt-0.5 font-medium">
                                    Blend in! You don't receive the secret word.
                                  </p>
                                </div>
                              ) : (
                                <div className="py-1">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    Secret Word
                                  </span>
                                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-display tracking-tight mt-0.5">
                                    {myRole?.secretWord}
                                  </div>
                                  <p className="text-[10px] text-zinc-400 mt-0.5">
                                    Describe it without making it obvious.
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2 py-2.5">
                              <Eye className="w-4 h-4 text-zinc-400" />
                              <span className="text-xs sm:text-sm font-bold text-zinc-200">
                                Tap here to reveal your secret card
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        /* Other Player's Card: strictly concealed */
                        <div className="p-3 rounded-xl bg-zinc-850/60 border border-zinc-800 text-center text-xs text-zinc-400 flex items-center justify-center gap-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Secret Card Concealed</span>
                        </div>
                      )}
                    </div>
                  )}

                  {phase === 'AWAITING_REVEAL' && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center text-xs text-rose-400 font-semibold">
                      Time expired! Discuss and vote in Discord. Cards remain secret until host reveals.
                    </div>
                  )}

                  {phase === 'REVEALED' && (
                    /* Global reveal: Everyone sees all roles and the word */
                    <div
                      className={`p-3.5 rounded-xl text-center border ${
                        isImposterRevealed
                          ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                          : 'bg-zinc-850 border-zinc-750 text-zinc-200'
                      }`}
                    >
                      {isImposterRevealed ? (
                        <div>
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black uppercase tracking-wider mb-1">
                            <Flame className="w-3 h-3" />
                            IMPOSTER
                          </div>
                          <div className="text-sm sm:text-base font-bold">This player was the Imposter!</div>
                        </div>
                      ) : (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                            Role: Innocent Player
                          </span>
                          <div className="text-xs sm:text-sm font-semibold text-zinc-300 mt-0.5">
                            Word: <span className="font-bold font-display text-emerald-400">{revealedData?.secretWord}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          BOTTOM ACTION PANEL: Readiness Toggle & Host Controls
      ========================================================================= */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex flex-col gap-4">
          {/* Readiness selector row (for all players) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3.5 border-b border-zinc-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 block">
                Your Readiness
              </span>
              <span className="text-xs text-zinc-500">
                {isMeReady
                  ? 'Marked Ready. Awaiting host to start.'
                  : 'Click Ready when prepared for the round.'}
              </span>
            </div>

            {/* Ready / Not Ready Toggle Button */}
            <button
              onClick={toggleReady}
              disabled={phase === 'ACTIVE' || phase === 'AWAITING_REVEAL'}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
                isMeReady
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
                  : 'bg-zinc-800 hover:bg-zinc-750 text-zinc-200 border border-zinc-700'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isMeReady ? "I'm Ready!" : 'Click to Ready Up'}</span>
            </button>
          </div>

          {/* Host Controls */}
          {isHostUser ? (
            <div className="space-y-3.5">
              {/* Timer duration controls */}
              {(phase === 'LOBBY' || phase === 'REVEALED') && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                      Host Timer Duration (min 6m)
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowCustomInput(!showCustomInput)}
                      className="text-xs text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {showCustomInput ? 'Presets' : 'Custom'}
                    </button>
                  </div>

                  {showCustomInput ? (
                    <form onSubmit={handleCustomTimeSubmit} className="flex items-center gap-2">
                      <input
                        type="number"
                        min={6}
                        max={60}
                        value={customMinutes}
                        onChange={(e) => setCustomMinutes(e.target.value)}
                        className="w-24 px-3 py-1.5 rounded-xl bg-zinc-800 border border-zinc-700 text-xs font-mono font-bold text-zinc-100 focus:outline-none focus:ring-1.5 focus:ring-blue-500"
                      />
                      <span className="text-xs text-zinc-400">minutes</span>
                      <button
                        type="submit"
                        className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 cursor-pointer"
                      >
                        Set
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {TIMER_PRESETS.map((mins) => (
                        <button
                          key={mins}
                          onClick={() => setTimerMinutes(mins)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            timerMinutes === mins
                              ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                              : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-750'
                          }`}
                        >
                          {mins}m
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Start Round Button */}
              {phase === 'LOBBY' && (
                <div>
                  <button
                    onClick={startRound}
                    disabled={!allReady}
                    className={`w-full py-3.5 px-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer ${
                      allReady
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25'
                        : 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>Start Round</span>
                  </button>
                  {!allReady && (
                    <p className="text-[10px] text-zinc-400 text-center mt-1.5 font-medium">
                      {players.length < MIN_PLAYERS_TO_START
                        ? `At least ${MIN_PLAYERS_TO_START} players are required to start.`
                        : 'Waiting for all players to mark Ready.'}
                    </p>
                  )}
                </div>
              )}

              {phase === 'ACTIVE' && (
                <div className="text-xs text-zinc-400 text-center py-1">
                  Round in progress. Countdown timer is synchronized with the server.
                </div>
              )}

              {phase === 'AWAITING_REVEAL' && (
                <div>
                  <button
                    onClick={revealAllCards}
                    className="w-full py-3.5 px-5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Reveal All Cards</span>
                  </button>
                </div>
              )}

              {phase === 'REVEALED' && (
                <div>
                  <button
                    onClick={startNextRound}
                    className="w-full py-3.5 px-5 rounded-2xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Prepare Next Round</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Regular Participant view */
            <div className="py-1 text-center text-xs text-zinc-400">
              {phase === 'LOBBY' && 'Waiting for host to start once all players are ready.'}
              {phase === 'ACTIVE' && 'Round in progress. Discuss in Discord voice chat.'}
              {phase === 'AWAITING_REVEAL' && 'Time expired! Conduct verbal vote in voice chat.'}
              {phase === 'REVEALED' && 'Roles revealed! Awaiting next round.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
