const mongoose = require('mongoose');

const gameRoundSchema = new mongoose.Schema({
  game: {
    type: String,
    enum: ['slots', 'crash', 'dice', 'roulette', 'blackjack', 'baccarat',
           'plinko', 'mines', 'wheel', 'hilo', 'dragon-tiger', 'teen-patti',
           'andar-bahar', 'limbo', 'keno', 'tower', 'coinflip', 'aviator',
           'color-game', 'video-poker', 'bingo', 'scratch-card',
           'slots-golden-dragon', 'slots-fortune-tiger', 'slots-lucky-neko',
           'slots-money-coming', 'slots-treasure-hunt', 'slots-wild-west',
           'slots-pharaoh-gold', 'slots-diamond-rush', 'slots-fruit-party',
           'slots-mega-jackpot', 'slots-book-of-ra', 'slots-sweet-bonanza',
           'slots-gates-of-olympus', 'slots-starlight-princess', 'slots-sugar-rush',
           'slots-big-bass', 'slots-hot-fiesta', 'slots-zeus', 'slots-buffalo-king',
           'slots-wolf-gold'],
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  betAmount: {
    type: Number,
    required: true,
    min: 0
  },
  winAmount: {
    type: Number,
    default: 0
  },
  multiplier: {
    type: Number,
    default: 0
  },
  profit: {
    type: Number,
    default: 0
  },
  result: {
    type: mongoose.Schema.Types.Mixed // Different for each game
  },
  seed: {
    serverSeed: String,
    clientSeed: String,
    nonce: Number,
    hash: String
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  }
}, {
  timestamps: true
});

gameRoundSchema.index({ user: 1, game: 1, createdAt: -1 });
gameRoundSchema.index({ game: 1, createdAt: -1 });

module.exports = mongoose.model('GameRound', gameRoundSchema);
