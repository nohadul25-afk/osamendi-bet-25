import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import { Toaster } from 'react-hot-toast';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Casino = lazy(() => import('./pages/Casino'));
const Sports = lazy(() => import('./pages/Sports'));
const Promotions = lazy(() => import('./pages/Promotions'));
const Wallet = lazy(() => import('./pages/Wallet'));
const Profile = lazy(() => import('./pages/Profile'));
const VIP = lazy(() => import('./pages/VIP'));
const Referral = lazy(() => import('./pages/Referral'));

// Original Games
const CrashGame = lazy(() => import('./pages/games/CrashGame'));
const DiceGame = lazy(() => import('./pages/games/DiceGame'));
const MinesGame = lazy(() => import('./pages/games/MinesGame'));
const PlinkoGame = lazy(() => import('./pages/games/PlinkoGame'));
const RouletteGame = lazy(() => import('./pages/games/RouletteGame'));
const SlotsGame = lazy(() => import('./pages/games/SlotsGame'));
const WheelGame = lazy(() => import('./pages/games/WheelGame'));
const CoinFlipGame = lazy(() => import('./pages/games/CoinFlipGame'));
const LimboGame = lazy(() => import('./pages/games/LimboGame'));
const KenoGame = lazy(() => import('./pages/games/KenoGame'));
const HiLoGame = lazy(() => import('./pages/games/HiLoGame'));
const BlackjackGame = lazy(() => import('./pages/games/BlackjackGame'));

// New Games
const BaccaratGame = lazy(() => import('./pages/games/BaccaratGame'));
const DragonTigerGame = lazy(() => import('./pages/games/DragonTigerGame'));
const TeenPattiGame = lazy(() => import('./pages/games/TeenPattiGame'));
const AndarBaharGame = lazy(() => import('./pages/games/AndarBaharGame'));
const TowerGame = lazy(() => import('./pages/games/TowerGame'));
const AviatorGame = lazy(() => import('./pages/games/AviatorGame'));
const ColorGame = lazy(() => import('./pages/games/ColorGame'));
const VideoPokerGame = lazy(() => import('./pages/games/VideoPokerGame'));
const ScratchCardGame = lazy(() => import('./pages/games/ScratchCardGame'));
const ThemedSlotsGame = lazy(() => import('./pages/games/ThemedSlotsGame'));

// Admin
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminUsers = lazy(() => import('./pages/admin/Users'));
const AdminTransactions = lazy(() => import('./pages/admin/Transactions'));
const AdminAgent = lazy(() => import('./pages/admin/Agent'));

const Loading = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', background: '#0a0e17'
  }}>
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: 50, height: 50, border: '3px solid #2a3042',
        borderTop: '3px solid #f5a623', borderRadius: '50%',
        animation: 'spin 1s linear infinite', margin: '0 auto 16px'
      }} />
      <div style={{ color: '#f5a623', fontWeight: 700, fontSize: 18 }}>Osamendi Bet 25</div>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user) return <Navigate to="/login" />;
  return children;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <Loading />;
  if (!user || !['admin', 'superadmin'].includes(user.role)) return <Navigate to="/" />;
  return children;
};

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1f2e',
            color: '#fff',
            border: '1px solid #2a3042'
          }
        }}
      />
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/casino" element={<Casino />} />
            <Route path="/sports" element={<Sports />} />
            <Route path="/promotions" element={<Promotions />} />

            {/* Original Games */}
            <Route path="/games/crash" element={<ProtectedRoute><CrashGame /></ProtectedRoute>} />
            <Route path="/games/dice" element={<ProtectedRoute><DiceGame /></ProtectedRoute>} />
            <Route path="/games/mines" element={<ProtectedRoute><MinesGame /></ProtectedRoute>} />
            <Route path="/games/plinko" element={<ProtectedRoute><PlinkoGame /></ProtectedRoute>} />
            <Route path="/games/roulette" element={<ProtectedRoute><RouletteGame /></ProtectedRoute>} />
            <Route path="/games/slots" element={<ProtectedRoute><SlotsGame /></ProtectedRoute>} />
            <Route path="/games/wheel" element={<ProtectedRoute><WheelGame /></ProtectedRoute>} />
            <Route path="/games/coinflip" element={<ProtectedRoute><CoinFlipGame /></ProtectedRoute>} />
            <Route path="/games/limbo" element={<ProtectedRoute><LimboGame /></ProtectedRoute>} />
            <Route path="/games/keno" element={<ProtectedRoute><KenoGame /></ProtectedRoute>} />
            <Route path="/games/hilo" element={<ProtectedRoute><HiLoGame /></ProtectedRoute>} />
            <Route path="/games/blackjack" element={<ProtectedRoute><BlackjackGame /></ProtectedRoute>} />

            {/* New Games */}
            <Route path="/games/baccarat" element={<ProtectedRoute><BaccaratGame /></ProtectedRoute>} />
            <Route path="/games/dragon-tiger" element={<ProtectedRoute><DragonTigerGame /></ProtectedRoute>} />
            <Route path="/games/teen-patti" element={<ProtectedRoute><TeenPattiGame /></ProtectedRoute>} />
            <Route path="/games/andar-bahar" element={<ProtectedRoute><AndarBaharGame /></ProtectedRoute>} />
            <Route path="/games/tower" element={<ProtectedRoute><TowerGame /></ProtectedRoute>} />
            <Route path="/games/aviator" element={<ProtectedRoute><AviatorGame /></ProtectedRoute>} />
            <Route path="/games/color-game" element={<ProtectedRoute><ColorGame /></ProtectedRoute>} />
            <Route path="/games/video-poker" element={<ProtectedRoute><VideoPokerGame /></ProtectedRoute>} />
            <Route path="/games/scratch-card" element={<ProtectedRoute><ScratchCardGame /></ProtectedRoute>} />

            {/* Themed Slots */}
            <Route path="/slots/:slotId" element={<ProtectedRoute><ThemedSlotsGame /></ProtectedRoute>} />

            {/* User */}
            <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/vip" element={<ProtectedRoute><VIP /></ProtectedRoute>} />
            <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
            <Route path="/admin/transactions" element={<AdminRoute><AdminTransactions /></AdminRoute>} />
            <Route path="/admin/agent" element={<AdminRoute><AdminAgent /></AdminRoute>} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
