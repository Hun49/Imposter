import { useEffect } from 'react';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './components/LandingPage';
import { LobbyScreen } from './components/LobbyScreen';
import { AuthModal } from './components/AuthModal';
import { JoinModal } from './components/JoinModal';
import { useGameStore } from './store/gameStore';

export function App() {
  const { roomCode, roomClosedReason, clearRoomClosed, checkAuth } = useGameStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 antialiased selection:bg-rose-500/20 selection:text-rose-400">
      {/* Top Navigation */}
      <Navbar />

      {/* Main View: Landing or Lobby */}
      <main className="flex-1 flex flex-col">
        {roomCode ? <LobbyScreen /> : <LandingPage />}
      </main>

      {/* Footer */}
      <Footer />

      {/* Modals driven directly by Zustand */}
      <AuthModal />
      <JoinModal />

      {/* Host Disconnect / Room Closed Alert Modal (Spec §6.9) */}
      {roomClosedReason && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 mb-3 border border-rose-500/20">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-white font-display mb-1.5">
              Room Closed
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              {roomClosedReason}
            </p>
            <button
              onClick={clearRoomClosed}
              className="w-full py-3 px-4 rounded-xl bg-white text-zinc-950 font-bold text-xs hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to Home</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
