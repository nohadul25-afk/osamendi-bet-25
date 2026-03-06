const mongoose = require('mongoose');
const User = require('../models/User');
const Promotion = require('../models/Promotion');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/osamendi_bet_25');
  console.log('Connected to MongoDB');

  // Create super admin
  const existingAdmin = await User.findOne({ role: 'superadmin' });
  if (!existingAdmin) {
    const admin = new User({
      username: 'admin',
      email: 'admin@osamendbet25.com',
      phone: '01700000000',
      password: 'admin123456', // CHANGE THIS IN PRODUCTION
      role: 'superadmin',
      balance: 1000000,
      isVerified: true
    });
    await admin.save();
    console.log('Super admin created: admin / admin123456');
  }

  // Create demo agent
  const existingAgent = await User.findOne({ role: 'agent' });
  if (!existingAgent) {
    const agent = new User({
      username: 'agent01',
      email: 'agent@osamendbet25.com',
      phone: '01700000001',
      password: 'agent123456',
      role: 'agent',
      isVerified: true
    });
    await agent.save();
    console.log('Agent created: agent01 / agent123456');
  }

  // Seed promotions
  const promoCount = await Promotion.countDocuments();
  if (promoCount === 0) {
    await Promotion.insertMany([
      {
        title: '100% Welcome Bonus',
        titleBn: '১০০% স্বাগতম বোনাস',
        description: 'Get 100% bonus on your first deposit up to ৳5,000',
        descriptionBn: 'প্রথম ডিপোজিটে ৳৫,০০০ পর্যন্ত ১০০% বোনাস পান',
        type: 'welcome',
        bonusPercent: 100,
        maxBonus: 5000,
        minDeposit: 100,
        wagerRequirement: 10,
        isActive: true,
        order: 1
      },
      {
        title: 'Daily 5% Cashback',
        titleBn: '৫% দৈনিক ক্যাশব্যাক',
        description: 'Get 5% cashback on daily losses. Minimum loss ৳500.',
        descriptionBn: 'দৈনিক লসে ৫% ক্যাশব্যাক। সর্বনিম্ন লস ৳৫০০।',
        type: 'cashback',
        bonusPercent: 5,
        maxBonus: 25000,
        isActive: true,
        order: 2
      },
      {
        title: 'Refer & Earn 5%',
        titleBn: 'রেফার করে ৫% আয় করুন',
        description: 'Earn 5% commission on every deposit by your referred friends.',
        descriptionBn: 'আপনার রেফার করা বন্ধুদের প্রতিটি ডিপোজিটে ৫% কমিশন আয় করুন।',
        type: 'referral',
        bonusPercent: 5,
        isActive: true,
        order: 3
      },
      {
        title: '50% Weekend Reload',
        titleBn: '৫০% উইকেন্ড রিলোড',
        description: 'Every Friday-Saturday get 50% bonus on deposits up to ৳3,000',
        descriptionBn: 'প্রতি শুক্র-শনিবার ডিপোজিটে ৳৩,০০০ পর্যন্ত ৫০% বোনাস',
        type: 'reload',
        bonusPercent: 50,
        maxBonus: 3000,
        minDeposit: 200,
        wagerRequirement: 5,
        isActive: true,
        order: 4
      }
    ]);
    console.log('Promotions seeded');
  }

  console.log('Seed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
