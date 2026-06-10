const express = require('express');
const router = express.Router();
const c = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

// Public
router.post('/register', c.registerUser);
router.post('/login', c.loginUser);
router.post('/verify-email', c.verifyEmail);
router.post('/resend-code', c.resendCode);
router.post('/forgot-password', c.forgotPassword);
router.post('/reset-password', c.resetPassword);

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

// Friends (accepted requests only)
router.get('/friends', protect, c.getFriends);

// Direct Messages
router.get('/messages/:userId', protect, c.getMessages);
router.post('/messages', protect, c.sendMessage);

// Groups
router.post('/groups', protect, c.createGroup);
router.get('/groups', protect, c.getGroups);
router.get('/groups/:groupId/messages', protect, c.getGroupMessages);
router.post('/groups/:groupId/messages', protect, c.sendGroupMessage);
router.get('/groups/:groupId/members', protect, c.getGroupMembers);

// Reviews
router.get('/reviews/:userId', protect, c.getReviews);

module.exports = router;
