require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');

const run = async () => {
  await connectDB();
  const email = 'admin@examportal.com';
  const password = 'Admin@123';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await User.create({ name: 'Portal Admin', email, password: hashedPassword, role: 'admin' });
  console.log(`Admin created. Email: ${email} Password: ${password}`);
  process.exit(0);
};

run().catch(err => { console.error(err); process.exit(1); });
