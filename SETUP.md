# Osamendi Bet 25 - Setup Guide

## Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

## Quick Start

### 1. Backend Setup
```bash
cd backend
cp .env.example .env
# Edit .env with your settings (MongoDB URI, MFS agent numbers, etc.)
npm install
npm run seed    # Creates admin user & default promotions
npm run dev     # Starts backend on port 5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm start       # Starts on port 3000
```

### 3. Default Login Credentials
- **Super Admin**: username: `admin` / password: `admin123456`
- **Agent**: username: `agent01` / password: `agent123456`

**IMPORTANT**: Change these passwords immediately after first login!

## Configuration (.env)

### MFS Agent Numbers
Set your personal bKash/Nagad/Rocket numbers:
```
BKASH_AGENT_NUMBER=01XXXXXXXXX
NAGAD_AGENT_NUMBER=01XXXXXXXXX
ROCKET_AGENT_NUMBER=01XXXXXXXXX
```

### Deposit/Withdraw Limits
```
MIN_DEPOSIT=100
MAX_DEPOSIT=50000
MIN_WITHDRAW=500
MAX_WITHDRAW=25000
```

### House Edge (profit margin)
```
HOUSE_EDGE_SLOTS=5
HOUSE_EDGE_CRASH=3
HOUSE_EDGE_DICE=2
```

## How the Payment System Works

1. User selects bKash/Nagad/Rocket and sees agent number
2. User sends money via their MFS app
3. User submits the Transaction ID on the website
4. Admin/Agent sees the request in Agent Panel
5. Agent verifies the payment and approves/rejects
6. User's balance is updated immediately

## Project Structure
```
osamendi-bet-25/
├── backend/           # Node.js + Express API
│   └── src/
│       ├── models/    # MongoDB schemas
│       ├── routes/    # API endpoints
│       ├── services/  # Game logic, sockets
│       ├── middleware/ # Auth middleware
│       └── server.js  # Entry point
├── frontend/          # React website
│   └── src/
│       ├── pages/     # All pages
│       ├── components/# Reusable components
│       ├── context/   # Auth & Socket context
│       ├── services/  # API client
│       └── styles/    # CSS
└── android-app/       # Future Android app
```

## Games Available
- Crash, Slots, Dice, Mines, Plinko, Roulette
- Blackjack, Wheel of Fortune, Coin Flip
- Limbo, Keno, Hi-Lo
- Sports Betting (Cricket, Football, etc.)

## Features
- Provably Fair gaming system
- bKash/Nagad/Rocket manual agent payment
- Real-time live bets feed
- VIP system (11 levels)
- Referral program (5% commission)
- Admin dashboard with full analytics
- Agent panel for deposit/withdrawal management
- Responsive design (mobile-friendly)
- Bangla language support
