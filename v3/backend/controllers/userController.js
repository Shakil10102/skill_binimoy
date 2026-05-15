const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ==========================================
// REGISTER USER
// ==========================================
exports.registerUser = async (req, res) => {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password)
        return res.status(400).json({ message: 'All fields are required' });
    if (password.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    try {
        db.query('SELECT id FROM users WHERE email = ?', [email], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            if (result.length > 0) return res.status(409).json({ message: 'Email already registered. Please login.' });
            const hashedPassword = await bcrypt.hash(password, 10);
            db.query('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)', [full_name, email, hashedPassword], (err2, result2) => {
                if (err2) return res.status(500).json({ message: 'Registration failed. Please try again.' });
                const token = jwt.sign({ id: result2.insertId, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
                res.status(201).json({ message: 'Account created successfully!', token, user: { id: result2.insertId, full_name, email } });
            });
        });
    } catch (e) { res.status(500).json({ message: 'Server error.' }); }
};

// ==========================================
// LOGIN USER
// ==========================================
exports.loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
    try {
        db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            if (result.length === 0) return res.status(401).json({ message: 'Invalid email or password' });
            const user = result[0];
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
            const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
            res.status(200).json({ message: 'Login successful!', token, user: { id: user.id, full_name: user.full_name, email: user.email, profile_image: user.profile_image } });
        });
    } catch (e) { res.status(500).json({ message: 'Server error.' }); }
};

// ==========================================
// GET PROFILE
// ==========================================
exports.getProfile = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT id, full_name, email, bio, profile_image, cover_image, created_at FROM users WHERE id = ?', [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (result.length === 0) return res.status(404).json({ message: 'User not found' });
        const user = result[0];
        // Get skills
        db.query('SELECT id, skill_name, skill_type FROM skills WHERE user_id = ?', [userId], (err2, skills) => {
            if (err2) return res.status(500).json({ message: 'Server error' });
            user.skills_teach = skills.filter(s => s.skill_type === 'teach');
            user.skills_learn = skills.filter(s => s.skill_type === 'learn');
            res.status(200).json({ user });
        });
    });
};

// ==========================================
// UPDATE PROFILE
// ==========================================
exports.updateProfile = (req, res) => {
    const userId = req.user.id;
    const { full_name, bio, profile_image, cover_image } = req.body;
    if (!full_name || full_name.trim().length < 2)
        return res.status(400).json({ message: 'Full name must be at least 2 characters' });
    db.query('UPDATE users SET full_name = ?, bio = ?, profile_image = ?, cover_image = ? WHERE id = ?',
        [full_name.trim(), bio || '', profile_image || null, cover_image || null, userId],
        (err) => {
            if (err) return res.status(500).json({ message: 'Failed to update profile' });
            res.status(200).json({ message: 'Profile updated successfully!' });
        });
};

// ==========================================
// ADD SKILL
// ==========================================
exports.addSkill = (req, res) => {
    const userId = req.user.id;
    const { skill_name, skill_type } = req.body;
    if (!skill_name || !skill_type) return res.status(400).json({ message: 'Skill name and type required' });
    if (!['teach', 'learn'].includes(skill_type)) return res.status(400).json({ message: 'skill_type must be teach or learn' });
    db.query('INSERT INTO skills (user_id, skill_name, skill_type) VALUES (?, ?, ?)', [userId, skill_name.trim(), skill_type], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to add skill' });
        res.status(201).json({ message: 'Skill added!', skill: { id: result.insertId, skill_name: skill_name.trim(), skill_type } });
    });
};

// ==========================================
// DELETE SKILL
// ==========================================
exports.deleteSkill = (req, res) => {
    const userId = req.user.id;
    const skillId = req.params.id;
    db.query('DELETE FROM skills WHERE id = ? AND user_id = ?', [skillId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to delete skill' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Skill not found' });
        res.status(200).json({ message: 'Skill deleted!' });
    });
};

// ==========================================
// GET ALL USERS (Marketplace)
// ==========================================
exports.getAllUsers = (req, res) => {
    const userId = req.user.id;
    db.query('SELECT id, full_name, email, bio, profile_image FROM users WHERE id != ?', [userId], (err, users) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (users.length === 0) return res.status(200).json({ users: [] });
        // Get skills for each user
        db.query('SELECT user_id, skill_name, skill_type FROM skills WHERE user_id IN (?)', [users.map(u => u.id)], (err2, skills) => {
            if (err2) return res.status(500).json({ message: 'Server error' });
            users.forEach(u => {
                u.skills_teach = skills.filter(s => s.user_id === u.id && s.skill_type === 'teach').map(s => s.skill_name);
                u.skills_learn = skills.filter(s => s.user_id === u.id && s.skill_type === 'learn').map(s => s.skill_name);
            });
            res.status(200).json({ users });
        });
    });
};

// ==========================================
// SEND REQUEST
// ==========================================
exports.sendRequest = (req, res) => {
    const sender_id = req.user.id;
    const { receiver_id, offered_skill, requested_skill, message } = req.body;
    if (!receiver_id) return res.status(400).json({ message: 'Receiver required' });
    // Check duplicate pending request
    db.query('SELECT id FROM exchange_requests WHERE sender_id = ? AND receiver_id = ? AND status = "Pending"', [sender_id, receiver_id], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (result.length > 0) return res.status(409).json({ message: 'Request already sent to this user' });
        db.query('INSERT INTO exchange_requests (sender_id, receiver_id, offered_skill, requested_skill, message) VALUES (?, ?, ?, ?, ?)',
            [sender_id, receiver_id, offered_skill || '', requested_skill || '', message || ''],
            (err2, result2) => {
                if (err2) return res.status(500).json({ message: 'Failed to send request' });
                res.status(201).json({ message: 'Request sent successfully!' });
            });
    });
};

// ==========================================
// GET MY REQUESTS (received)
// ==========================================
exports.getRequests = (req, res) => {
    const userId = req.user.id;
    db.query(`SELECT er.*, u.full_name as sender_name, u.profile_image as sender_image 
              FROM exchange_requests er 
              JOIN users u ON er.sender_id = u.id 
              WHERE er.receiver_id = ? 
              ORDER BY er.created_at DESC`, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ requests: result });
    });
};

// ==========================================
// UPDATE REQUEST STATUS
// ==========================================
exports.updateRequest = (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;
    if (!['Accepted', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });
    db.query('UPDATE exchange_requests SET status = ? WHERE id = ? AND receiver_id = ?', [status, id, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Request not found' });
        res.status(200).json({ message: `Request ${status}` });
    });
};

// ==========================================
// GET SESSIONS
// ==========================================
exports.getSessions = (req, res) => {
    const userId = req.user.id;
    db.query(`SELECT s.*, er.offered_skill, er.requested_skill, er.sender_id, er.receiver_id,
              u1.full_name as sender_name, u2.full_name as receiver_name
              FROM sessions s
              JOIN exchange_requests er ON s.request_id = er.id
              JOIN users u1 ON er.sender_id = u1.id
              JOIN users u2 ON er.receiver_id = u2.id
              WHERE er.sender_id = ? OR er.receiver_id = ?
              ORDER BY s.scheduled_at DESC`, [userId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ sessions: result });
    });
};

// ==========================================
// CREATE SESSION (after accept)
// ==========================================
exports.createSession = (req, res) => {
    const { request_id, scheduled_at, duration_minutes, meeting_link } = req.body;
    if (!request_id || !scheduled_at) return res.status(400).json({ message: 'request_id and scheduled_at required' });
    db.query('INSERT INTO sessions (request_id, scheduled_at, duration_minutes, meeting_link) VALUES (?, ?, ?, ?)',
        [request_id, scheduled_at, duration_minutes || 60, meeting_link || ''],
        (err, result) => {
            if (err) return res.status(500).json({ message: 'Failed to create session' });
            res.status(201).json({ message: 'Session scheduled!', session_id: result.insertId });
        });
};

// ==========================================
// GET MESSAGES
// ==========================================
exports.getMessages = (req, res) => {
    const userId = req.user.id;
    const otherUserId = req.params.userId;
    db.query(`SELECT m.*, u.full_name as sender_name FROM messages m
              JOIN users u ON m.sender_id = u.id
              WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
              ORDER BY m.created_at ASC`, [userId, otherUserId, otherUserId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        // Mark as read
        db.query('UPDATE messages SET is_read = TRUE WHERE receiver_id = ? AND sender_id = ?', [userId, otherUserId], () => {});
        res.status(200).json({ messages: result });
    });
};

// ==========================================
// SEND MESSAGE
// ==========================================
exports.sendMessage = (req, res) => {
    const sender_id = req.user.id;
    const { receiver_id, message } = req.body;
    if (!receiver_id || !message) return res.status(400).json({ message: 'receiver_id and message required' });
    db.query('INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)', [sender_id, receiver_id, message], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to send message' });
        res.status(201).json({ message: 'Message sent!', id: result.insertId });
    });
};

// ==========================================
// GET CHAT USERS (users I have messages with)
// ==========================================
exports.getChatUsers = (req, res) => {
    const userId = req.user.id;
    db.query(`SELECT DISTINCT u.id, u.full_name, u.profile_image,
              (SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND sender_id = u.id AND is_read = FALSE) as unread
              FROM messages m
              JOIN users u ON (m.sender_id = u.id OR m.receiver_id = u.id)
              WHERE (m.sender_id = ? OR m.receiver_id = ?) AND u.id != ?`, [userId, userId, userId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ users: result });
    });
};

// ==========================================
// GET REVIEWS
// ==========================================
exports.getReviews = (req, res) => {
    const userId = req.params.userId || req.user.id;
    db.query(`SELECT r.*, u.full_name as reviewer_name, u.profile_image as reviewer_image
              FROM reviews r JOIN users u ON r.reviewer_id = u.id
              WHERE r.reviewed_id = ? ORDER BY r.created_at DESC`, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ reviews: result });
    });
};
