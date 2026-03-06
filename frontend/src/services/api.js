import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data)
};

// Wallet
export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getPaymentMethods: () => api.get('/wallet/payment-methods'),
  deposit: (data) => api.post('/wallet/deposit', data),
  withdraw: (data) => api.post('/wallet/withdraw', data),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  // Agent
  getPending: () => api.get('/wallet/agent/pending'),
  approveDeposit: (id, data) => api.put(`/wallet/agent/deposit/${id}`, data),
  approveWithdraw: (id, data) => api.put(`/wallet/agent/withdraw/${id}`, data)
};

// Games
export const gamesAPI = {
  // Crash
  crashBet: (data) => api.post('/games/crash/bet', data),
  crashCashout: (data) => api.post('/games/crash/cashout', data),
  // Dice
  dicePlay: (data) => api.post('/games/dice/play', data),
  // Mines
  minesStart: (data) => api.post('/games/mines/start', data),
  minesReveal: (data) => api.post('/games/mines/reveal', data),
  minesCashout: (data) => api.post('/games/mines/cashout', data),
  // Plinko
  plinkoPlay: (data) => api.post('/games/plinko/play', data),
  // Roulette
  roulettePlay: (data) => api.post('/games/roulette/play', data),
  // Slots
  slotsSpin: (data) => api.post('/games/slots/spin', data),
  // Wheel
  wheelSpin: (data) => api.post('/games/wheel/spin', data),
  // Coin Flip
  coinFlipPlay: (data) => api.post('/games/coinflip/play', data),
  // Limbo
  limboPlay: (data) => api.post('/games/limbo/play', data),
  // Keno
  kenoPlay: (data) => api.post('/games/keno/play', data),
  // Hi-Lo
  hiloPlay: (data) => api.post('/games/hilo/play', data),
  // Blackjack
  blackjackDeal: (data) => api.post('/games/blackjack/deal', data),
  // Baccarat
  baccaratPlay: (data) => api.post('/games/baccarat/play', data),
  // Dragon Tiger
  dragonTigerPlay: (data) => api.post('/games/dragon-tiger/play', data),
  // Teen Patti
  teenPattiPlay: (data) => api.post('/games/teen-patti/play', data),
  // Andar Bahar
  andarBaharPlay: (data) => api.post('/games/andar-bahar/play', data),
  // Tower
  towerStart: (data) => api.post('/games/tower/start', data),
  towerClimb: (data) => api.post('/games/tower/climb', data),
  towerCashout: (data) => api.post('/games/tower/cashout', data),
  // Aviator
  aviatorBet: (data) => api.post('/games/aviator/bet', data),
  aviatorCashout: (data) => api.post('/games/aviator/cashout', data),
  // Color Game
  colorGamePlay: (data) => api.post('/games/color-game/play', data),
  // Video Poker
  videoPokerDeal: (data) => api.post('/games/video-poker/deal', data),
  videoPokerDraw: (data) => api.post('/games/video-poker/draw', data),
  // Scratch Card
  scratchCardBuy: (data) => api.post('/games/scratch-card/buy', data),
  scratchCardReveal: (data) => api.post('/games/scratch-card/reveal', data),
  // Themed Slots
  themedSlotsSpin: (data) => api.post('/games/themed-slots/spin', data),
  // History
  getHistory: (params) => api.get('/games/history', { params })
};

// Sports
export const sportsAPI = {
  getEvents: (params) => api.get('/sports/events', { params }),
  getEvent: (id) => api.get(`/sports/events/${id}`),
  placeBet: (data) => api.post('/sports/bet', data),
  getMyBets: (params) => api.get('/sports/my-bets', { params })
};

// User
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
  getReferrals: () => api.get('/user/referrals'),
  getVipInfo: () => api.get('/user/vip')
};

// Promotions
export const promoAPI = {
  getAll: () => api.get('/promotions')
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  banUser: (id, data) => api.put(`/admin/users/${id}/ban`, data),
  adjustBalance: (id, data) => api.put(`/admin/users/${id}/balance`, data),
  setRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  getGameRounds: (params) => api.get('/admin/game-rounds', { params }),
  getSettings: () => api.get('/admin/settings'),
  // Sports admin
  createEvent: (data) => api.post('/sports/admin/event', data),
  updateEvent: (id, data) => api.put(`/sports/admin/event/${id}`, data),
  settleEvent: (id, data) => api.post(`/sports/admin/event/${id}/settle`, data),
  // Promotions
  createPromo: (data) => api.post('/promotions', data),
  updatePromo: (id, data) => api.put(`/promotions/${id}`, data),
  deletePromo: (id) => api.delete(`/promotions/${id}`)
};

export default api;
