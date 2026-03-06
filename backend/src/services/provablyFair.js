const crypto = require('crypto');

// Provably Fair system - ensures game results are verifiable
class ProvablyFair {
  // Generate server seed
  static generateServerSeed() {
    return crypto.randomBytes(32).toString('hex');
  }

  // Hash server seed (shown to player before game)
  static hashServerSeed(serverSeed) {
    return crypto.createHash('sha256').update(serverSeed).digest('hex');
  }

  // Generate combined hash
  static generateHash(serverSeed, clientSeed, nonce) {
    const combined = `${serverSeed}:${clientSeed}:${nonce}`;
    return crypto.createHmac('sha256', serverSeed).update(`${clientSeed}:${nonce}`).digest('hex');
  }

  // Convert hash to float between 0 and 1
  static hashToFloat(hash) {
    const subHash = hash.substring(0, 8);
    const intValue = parseInt(subHash, 16);
    return intValue / 0xFFFFFFFF;
  }

  // Get result for crash game
  static getCrashResult(serverSeed, clientSeed, nonce) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const houseEdge = parseFloat(process.env.HOUSE_EDGE_CRASH || 3) / 100;

    // 1 in (1/houseEdge) chance of instant crash
    const hs = parseInt(hash.substring(0, 13), 16);
    if (hs % Math.floor(1 / houseEdge) === 0) return 1.00;

    const h = parseInt(hash.substring(0, 8), 16);
    const e = Math.pow(2, 32);
    const result = Math.floor((100 * e - h) / (e - h)) / 100;
    return Math.max(1, result);
  }

  // Get result for dice (0-99.99)
  static getDiceResult(serverSeed, clientSeed, nonce) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const float = this.hashToFloat(hash);
    return Math.floor(float * 10001) / 100; // 0.00 to 100.00
  }

  // Get slot result (array of reel positions)
  static getSlotResult(serverSeed, clientSeed, nonce, reels = 5, symbols = 10) {
    const results = [];
    for (let i = 0; i < reels; i++) {
      const hash = this.generateHash(serverSeed, clientSeed + i, nonce);
      const float = this.hashToFloat(hash);
      results.push(Math.floor(float * symbols));
    }
    return results;
  }

  // Get roulette result (0-36)
  static getRouletteResult(serverSeed, clientSeed, nonce) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const float = this.hashToFloat(hash);
    return Math.floor(float * 37);
  }

  // Get card from deck
  static getCards(serverSeed, clientSeed, nonce, count = 1) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      const hash = this.generateHash(serverSeed, clientSeed + i, nonce);
      const float = this.hashToFloat(hash);
      cards.push(Math.floor(float * 52));
    }
    return cards;
  }

  // Plinko result
  static getPlinkoResult(serverSeed, clientSeed, nonce, rows = 16) {
    const directions = [];
    for (let i = 0; i < rows; i++) {
      const hash = this.generateHash(serverSeed, `${clientSeed}:${i}`, nonce);
      const float = this.hashToFloat(hash);
      directions.push(float < 0.5 ? 'L' : 'R');
    }
    return directions;
  }

  // Mines: generate mine positions
  static getMinePositions(serverSeed, clientSeed, nonce, gridSize = 25, mineCount = 5) {
    const positions = new Set();
    let i = 0;
    while (positions.size < mineCount) {
      const hash = this.generateHash(serverSeed, `${clientSeed}:${i}`, nonce);
      const float = this.hashToFloat(hash);
      positions.add(Math.floor(float * gridSize));
      i++;
    }
    return Array.from(positions);
  }

  // Wheel of Fortune
  static getWheelResult(serverSeed, clientSeed, nonce, segments = 54) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const float = this.hashToFloat(hash);
    return Math.floor(float * segments);
  }

  // Limbo result
  static getLimboResult(serverSeed, clientSeed, nonce) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const float = this.hashToFloat(hash);
    const houseEdge = parseFloat(process.env.HOUSE_EDGE_CRASH || 3) / 100;
    return Math.max(1, (1 - houseEdge) / float);
  }

  // Keno: draw numbers
  static getKenoResult(serverSeed, clientSeed, nonce, drawCount = 10, maxNumber = 40) {
    const numbers = new Set();
    let i = 0;
    while (numbers.size < drawCount) {
      const hash = this.generateHash(serverSeed, `${clientSeed}:${i}`, nonce);
      const float = this.hashToFloat(hash);
      numbers.add(Math.floor(float * maxNumber) + 1);
      i++;
    }
    return Array.from(numbers).sort((a, b) => a - b);
  }

  // Coin flip
  static getCoinFlipResult(serverSeed, clientSeed, nonce) {
    const hash = this.generateHash(serverSeed, clientSeed, nonce);
    const float = this.hashToFloat(hash);
    return float < 0.5 ? 'heads' : 'tails';
  }

  // Tower game
  static getTowerResult(serverSeed, clientSeed, nonce, rows = 10, columns = 3) {
    const safeColumns = [];
    for (let i = 0; i < rows; i++) {
      const hash = this.generateHash(serverSeed, `${clientSeed}:${i}`, nonce);
      const float = this.hashToFloat(hash);
      safeColumns.push(Math.floor(float * columns));
    }
    return safeColumns;
  }
}

module.exports = ProvablyFair;
