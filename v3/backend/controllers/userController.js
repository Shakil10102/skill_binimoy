const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// REGISTER USER
// ==========================================
exports.registerUser = async (req, res) => {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password)
        return res.status(400).json({ message: 'All fields are required' });
    
    // Gmail validation
    const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!gmailRegex.test(email)) {
        return res.status(400).json({ message: 'Only @gmail.com addresses are allowed' });
    }

    if (password.length < 6)
        return res.status(400).json({ message: 'Password must be at least 6 characters' });
    try {
        db.query('SELECT id FROM users WHERE email = ?', [email], async (err, result) => {
            if (err) return res.status(500).json({ message: 'Server error' });
            if (result.length > 0) return res.status(409).json({ message: 'Email already registered. Please login.' });
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            db.query('INSERT INTO users (full_name, email, password, verification_code, verification_expires) VALUES (?, ?, ?, ?, ?)', 
                [full_name, email, hashedPassword, verificationCode, verificationExpires], async (err2, result2) => {
                if (err2) return res.status(500).json({ message: 'Registration failed. Please try again.' });
                
                try {
                    await sendEmail(
                        email,
                        'Verify your Skill Binimoy account',
                        `Your verification code is: ${verificationCode}. It expires in 10 minutes.`
                    );
                    res.status(201).json({ 
                        message: 'Account created! Please check your Gmail for the verification code.', 
                        email 
                    });
                } catch (emailErr) {
                    console.error('Email error:', emailErr);
                    res.status(201).json({ 
                        message: 'Account created, but failed to send verification email. Please try resending the code.', 
                        email 
                    });
                }
            });
        });
    } catch (e) { res.status(500).json({ message: 'Server error.' }); }
};

// ==========================================
// VERIFY EMAIL
// ==========================================
exports.verifyEmail = (req, res) => {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

    db.query('SELECT * FROM users WHERE email = ?', [email], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (result.length === 0) return res.status(404).json({ message: 'User not found' });

        const user = result[0];
        if (user.is_verified) return res.status(400).json({ message: 'Email already verified' });

        if (user.verification_code !== code) return res.status(400).json({ message: 'Invalid verification code' });
        if (new Date() > new Date(user.verification_expires)) return res.status(400).json({ message: 'Verification code expired' });

        db.query('UPDATE users SET is_verified = TRUE, verification_code = NULL, verification_expires = NULL WHERE id = ?', [user.id], (err2) => {
            if (err2) return res.status(500).json({ message: 'Verification failed' });
            res.status(200).json({ message: 'Email verified successfully! You can now login.' });
        });
    });
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
exports.forgotPassword = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        
        // Security: always return success
        const successMsg = { message: 'If that email is registered, a reset code has been sent.' };
        if (result.length === 0) return res.status(200).json(successMsg);

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        db.query('UPDATE users SET reset_code = ?, reset_code_expires = ? WHERE email = ?', 
            [resetCode, resetExpires, email], async (err2) => {
            if (err2) return res.status(500).json({ message: 'Server error' });

            try {
                await sendEmail(
                    email,
                    'Password Reset Code - Skill Binimoy',
                    `Your password reset code is: ${resetCode}. It expires in 10 minutes.`
                );
                res.status(200).json(successMsg);
            } catch (emailErr) {
                res.status(500).json({ message: 'Failed to send email. Try again later.' });
            }
        });
    });
};

// ==========================================
// RESET PASSWORD
// ==========================================
exports.resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) return res.status(400).json({ message: 'All fields are required' });

    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (result.length === 0) return res.status(400).json({ message: 'Invalid email or code' });

        const user = result[0];
        if (user.reset_code !== code) return res.status(400).json({ message: 'Invalid reset code' });
        if (new Date() > new Date(user.reset_code_expires)) return res.status(400).json({ message: 'Reset code expired' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        db.query('UPDATE users SET password = ?, reset_code = NULL, reset_code_expires = NULL WHERE id = ?', 
            [hashedPassword, user.id], (err2) => {
            if (err2) return res.status(500).json({ message: 'Failed to reset password' });
            res.status(200).json({ message: 'Password reset successfully! You can now login.' });
        });
    });
};

// ==========================================
// RESEND CODE
// ==========================================
exports.resendCode = (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

    db.query('UPDATE users SET verification_code = ?, verification_expires = ? WHERE email = ? AND is_verified = FALSE', 
        [verificationCode, verificationExpires, email], async (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (result.affectedRows === 0) return res.status(404).json({ message: 'User not found or already verified' });

        try {
            await sendEmail(
                email,
                'Your New Verification Code',
                `Your new verification code is: ${verificationCode}. It expires in 10 minutes.`
            );
            res.status(200).json({ message: 'New code sent to your Gmail!' });
        } catch (emailErr) {
            res.status(500).json({ message: 'Failed to send email. Try again.' });
        }
    });
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
            
            // Check verification status
            if (!user.is_verified) {
                return res.status(403).json({ message: 'Please verify your email before logging in.', email: user.email });
            }

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

    // Build dynamic query - only update image fields if provided
    let sql = 'UPDATE users SET full_name = ?, bio = ?';
    let params = [full_name.trim(), bio || ''];

    if (profile_image !== undefined) { sql += ', profile_image = ?'; params.push(profile_image); }
    if (cover_image !== undefined) { sql += ', cover_image = ?'; params.push(cover_image); }

    sql += ' WHERE id = ?';
    params.push(userId);

    db.query(sql, params, (err) => {
        if (err) { console.error('Update error:', err); return res.status(500).json({ message: 'Failed to update profile' }); }
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

// ==========================================
// GET FRIENDS (accepted exchange requests only)
// ==========================================
exports.getFriends = (req, res) => {
    const userId = req.user.id;
    db.query(`SELECT DISTINCT u.id, u.full_name, u.profile_image
              FROM exchange_requests er
              JOIN users u ON (
                  CASE WHEN er.sender_id = ? THEN er.receiver_id = u.id
                  ELSE er.sender_id = u.id END
              )
              WHERE (er.sender_id = ? OR er.receiver_id = ?)
              AND er.status = 'Accepted'
              AND u.id != ?`, [userId, userId, userId, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ friends: result });
    });
};

// ==========================================
// CREATE GROUP
// ==========================================
exports.createGroup = (req, res) => {
    const userId = req.user.id;
    const { group_name, member_ids } = req.body;
    if (!group_name || !member_ids || !member_ids.length)
        return res.status(400).json({ message: 'Group name and members required' });

    db.query('INSERT INTO groups_table (name, created_by) VALUES (?, ?)', [group_name, userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Failed to create group' });
        const groupId = result.insertId;
        // Add creator + all members
        const allMembers = [...new Set([userId, ...member_ids])];
        const values = allMembers.map(id => [groupId, id]);
        db.query('INSERT INTO group_members (group_id, user_id) VALUES ?', [values], (err2) => {
            if (err2) return res.status(500).json({ message: 'Failed to add members' });
            res.status(201).json({ message: 'Group created!', group_id: groupId });
        });
    });
};

// ==========================================
// GET MY GROUPS
// ==========================================
exports.getGroups = (req, res) => {
    const userId = req.user.id;
    db.query(`SELECT g.id, g.name, g.created_by, g.created_at,
              (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count,
              (SELECT message FROM group_messages WHERE group_id = g.id ORDER BY created_at DESC LIMIT 1) as last_message
              FROM groups_table g
              JOIN group_members gm ON g.id = gm.group_id
              WHERE gm.user_id = ?
              ORDER BY g.created_at DESC`, [userId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ groups: result });
    });
};

// ==========================================
// GET GROUP MESSAGES
// ==========================================
exports.getGroupMessages = (req, res) => {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    // Check if user is member
    db.query('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId], (err, check) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (!check.length) return res.status(403).json({ message: 'Not a member of this group' });
        db.query(`SELECT gm.*, u.full_name as sender_name, u.profile_image as sender_image
                  FROM group_messages gm
                  JOIN users u ON gm.sender_id = u.id
                  WHERE gm.group_id = ?
                  ORDER BY gm.created_at ASC`, [groupId], (err2, result) => {
            if (err2) return res.status(500).json({ message: 'Server error' });
            res.status(200).json({ messages: result });
        });
    });
};

// ==========================================
// SEND GROUP MESSAGE
// ==========================================
exports.sendGroupMessage = (req, res) => {
    const userId = req.user.id;
    const groupId = req.params.groupId;
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Message required' });
    // Check membership
    db.query('SELECT id FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId], (err, check) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        if (!check.length) return res.status(403).json({ message: 'Not a member of this group' });
        db.query('INSERT INTO group_messages (group_id, sender_id, message) VALUES (?, ?, ?)', [groupId, userId, message], (err2, result) => {
            if (err2) return res.status(500).json({ message: 'Failed to send message' });
            res.status(201).json({ message: 'Sent!', id: result.insertId });
        });
    });
};

// ==========================================
// GET GROUP MEMBERS
// ==========================================
exports.getGroupMembers = (req, res) => {
    const groupId = req.params.groupId;
    db.query(`SELECT u.id, u.full_name, u.profile_image
              FROM group_members gm
              JOIN users u ON gm.user_id = u.id
              WHERE gm.group_id = ?`, [groupId], (err, result) => {
        if (err) return res.status(500).json({ message: 'Server error' });
        res.status(200).json({ members: result });
    });
};
