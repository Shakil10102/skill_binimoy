const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/register', c.registerUser);
router.post('/login', c.loginUser);

// Profile
router.get('/profile', protect, c.getProfile);
router.put('/profile', protect, c.updateProfile);

// Skills
router.post('/skills', protect, c.addSkill);
router.delete('/skills/:id', protect, c.deleteSkill);

// Marketplace
router.get('/all', protect, c.getAllUsers);

// Requests
router.post('/requests', protect, c.sendRequest);
router.get('/requests', protect, c.getRequests);
router.put('/requests/:id', protect, c.updateRequest);

// Sessions
router.get('/sessions', protect, c.getSessions);
router.post('/sessions', protect, c.createSession);

// Messages
router.get('/messages/:userId', protect, c.getMessages);
router.post('/messages', protect, c.sendMessage);
router.get('/chat-users', protect, c.getChatUsers);

// Reviews
router.get('/reviews/:userId', protect, c.getReviews);

module.exports = router;
