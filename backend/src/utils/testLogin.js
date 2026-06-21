require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Conectado a:', process.env.MONGO_URI);

  const email = 'pedrazapedrazajesusdavid@gmail.com';
  const passwordToTest = '123456';

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    console.log('❌ NO se encontró el usuario con ese email');
    process.exit(1);
  }

  console.log('✅ Usuario encontrado:', user.email);
  console.log('   active:', user.active);
  console.log('   password hash:', user.password);

  const isMatch = await bcrypt.compare(passwordToTest, user.password);
  console.log('   ¿La contraseña 123456 coincide?', isMatch);

  const isMatchMethod = await user.comparePassword(passwordToTest);
  console.log('   ¿comparePassword() coincide?', isMatchMethod);

  process.exit(0);
};

run().catch(e => { console.error('ERROR:', e); process.exit(1); });