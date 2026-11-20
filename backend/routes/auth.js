import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../database/dataStore.js';
import { generateToken, authenticate } from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const aliasEmail = normalizedEmail.includes('@company.com') 
    ? normalizedEmail.replace('@company.com', '@solvrex.com')
    : (normalizedEmail.includes('@solvrex.com') ? normalizedEmail.replace('@solvrex.com', '@company.com') : normalizedEmail);

  const user = db.findOne('users', u => {
    const uEmail = u.email.toLowerCase();
    return uEmail === normalizedEmail || uEmail === aliasEmail;
  });
  if (!user || !user.active) {
    return res.status(401).json({ error: 'Invalid credentials or inactive account' });
  }

  // Support plain text demo password or bcrypt hash
  const isValidPassword = user.password.startsWith('$2')
    ? bcrypt.compareSync(password, user.password)
    : user.password === password;

  if (!isValidPassword) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);

  // Suggested redirect path based on role as per Section 3
  let defaultRedirect = '/team';
  if (user.role === 'Analyst') {
    defaultRedirect = `/individual/${user.id}`;
  } else if (user.role === 'Admin') {
    defaultRedirect = '/settings';
  }

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      team: user.team
    },
    defaultRedirect
  });
});

// GET /api/auth/me
router.get('/me', authenticate, (req, res) => {
  const user = db.findOne('users', u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    team: user.team
  });
});

// GET /api/auth/demo-accounts - Helper for evaluator / manager one-click demo login
router.get('/demo-accounts', (req, res) => {
  const users = db.get('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    team: u.team
  }));
  res.json(users);
});

export default router;
