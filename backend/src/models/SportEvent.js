const mongoose = require('mongoose');

const sportEventSchema = new mongoose.Schema({
  sport: {
    type: String,
    enum: ['cricket', 'football', 'basketball', 'tennis', 'badminton', 'kabaddi', 'esports', 'horse-racing'],
    required: true
  },
  league: {
    type: String,
    required: true
  },
  teamA: {
    name: { type: String, required: true },
    logo: String,
    odds: { type: Number, required: true }
  },
  teamB: {
    name: { type: String, required: true },
    logo: String,
    odds: { type: Number, required: true }
  },
  drawOdds: Number,
  startTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['upcoming', 'live', 'finished', 'cancelled', 'suspended'],
    default: 'upcoming'
  },
  result: {
    winner: { type: String, enum: ['teamA', 'teamB', 'draw', null], default: null },
    scoreA: String,
    scoreB: String
  },
  isLive: {
    type: Boolean,
    default: false
  },
  liveData: {
    currentScore: String,
    currentTime: String,
    period: String
  },
  markets: [{
    name: String, // Over/Under, Handicap, etc.
    options: [{
      label: String,
      odds: Number,
      result: { type: String, enum: ['pending', 'won', 'lost'], default: 'pending' }
    }],
    status: { type: String, enum: ['open', 'closed', 'settled'], default: 'open' }
  }],
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

sportEventSchema.index({ sport: 1, status: 1, startTime: 1 });

module.exports = mongoose.model('SportEvent', sportEventSchema);
