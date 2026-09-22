const { db, getNextId } = require('../config/firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// ==========================================
// REGISTER USER
// ==========================================
exports.registerUser = async (req, res) => {
    try {
        const { full_name, email, password } = req.body;
        if (!full_name || !email || !password) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Gmail validation
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        if (!gmailRegex.test(email)) {
            return res.status(400).json({ message: 'Only @gmail.com addresses are allowed' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters' });
        }

        // Check if email already registered in Firestore
        const existingSnap = await db.collection('users').where('email', '==', email.toLowerCase()).limit(1).get();
        if (!existingSnap.empty) {
            return res.status(409).json({ message: 'Email already registered. Please login.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        const userId = await getNextId('users');
        const userDoc = {
            id: userId,
            full_name: full_name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            bio: '',
            profile_image: null,
            cover_image: null,
            is_verified: false,
            verification_code: verificationCode,
            verification_expires: verificationExpires.toISOString(),
            created_at: new Date().toISOString()
        };

        await db.collection('users').doc(String(userId)).set(userDoc);

        // Dispatch email asynchronously in background so client response is instant (<300ms)
        sendEmail(
            email,
            'Verify your Skill Binimoy account',
            `Your verification code is: ${verificationCode}. It expires in 10 minutes.`
        ).then(() => {
            console.log(`✅ [Async Email Delivered] To: ${email}`);
        }).catch((emailErr) => {
            console.warn('[Async Register Email Notice]:', emailErr.message);
        });

        return res.status(201).json({
            message: 'Account created! Please check your Gmail for the verification code.',
            email,
            verification_code: verificationCode
        });
    } catch (e) {
        console.error('Register error:', e);
        return res.status(500).json({ message: 'Server error: ' + e.message });
    }
};

// ==========================================
// VERIFY EMAIL
// ==========================================
exports.verifyEmail = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ message: 'Email and code are required' });

        const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (userSnap.empty) return res.status(404).json({ message: 'User not found' });

        const userDocRef = userSnap.docs[0].ref;
        const user = userSnap.docs[0].data();

        if (user.is_verified) return res.status(400).json({ message: 'Email already verified' });
        if (user.verification_code !== code.trim()) return res.status(400).json({ message: 'Invalid verification code' });
        if (new Date() > new Date(user.verification_expires)) {
            return res.status(400).json({ message: 'Verification code expired' });
        }

        await userDocRef.update({
            is_verified: true,
            verification_code: null,
            verification_expires: null
        });

        return res.status(200).json({ message: 'Email verified successfully! You can now login.' });
    } catch (err) {
        console.error('Verify email error:', err);
        return res.status(500).json({ message: 'Verification failed' });
    }
};

// ==========================================
// FORGOT PASSWORD
// ==========================================
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const successMsg = { message: 'If that email is registered, a reset code has been sent.' };
        const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (userSnap.empty) return res.status(200).json(successMsg);

        const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
        const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await userSnap.docs[0].ref.update({
            reset_code: resetCode,
            reset_code_expires: resetExpires.toISOString()
        });

        // Dispatch email asynchronously in background
        sendEmail(
            email,
            'Password Reset Code - Skill Binimoy',
            `Your password reset code is: ${resetCode}. It expires in 10 minutes.`
        ).then(() => {
            console.log(`✅ [Async Reset Email Delivered] To: ${email}`);
        }).catch((emailErr) => {
            console.warn('[Async Forgot Password Email Notice]:', emailErr.message);
        });

        return res.status(200).json(successMsg);
    } catch (err) {
        console.error('Forgot password error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// RESET PASSWORD
// ==========================================
exports.resetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (userSnap.empty) return res.status(400).json({ message: 'Invalid email or code' });

        const userDocRef = userSnap.docs[0].ref;
        const user = userSnap.docs[0].data();

        if (user.reset_code !== code.trim()) return res.status(400).json({ message: 'Invalid reset code' });
        if (new Date() > new Date(user.reset_code_expires)) return res.status(400).json({ message: 'Reset code expired' });

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await userDocRef.update({
            password: hashedPassword,
            reset_code: null,
            reset_code_expires: null
        });

        return res.status(200).json({ message: 'Password reset successfully! You can now login.' });
    } catch (err) {
        console.error('Reset password error:', err);
        return res.status(500).json({ message: 'Failed to reset password' });
    }
};

// ==========================================
// RESEND CODE
// ==========================================
exports.resendCode = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email is required' });

        const userSnap = await db.collection('users')
            .where('email', '==', email.toLowerCase().trim())
            .where('is_verified', '==', false)
            .limit(1)
            .get();

        if (userSnap.empty) {
            return res.status(404).json({ message: 'User not found or already verified' });
        }

        const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
        const verificationExpires = new Date(Date.now() + 10 * 60 * 1000);

        await userSnap.docs[0].ref.update({
            verification_code: verificationCode,
            verification_expires: verificationExpires.toISOString()
        });

        // Dispatch email asynchronously in background
        sendEmail(
            email,
            'Your New Verification Code',
            `Your new verification code is: ${verificationCode}. It expires in 10 minutes.`
        ).then(() => {
            console.log(`✅ [Async Resend Email Delivered] To: ${email}`);
        }).catch((emailErr) => {
            console.warn('[Async Resend Email Notice]:', emailErr.message);
        });

        return res.status(200).json({
            message: 'New code sent to your Gmail!',
            verification_code: verificationCode
        });
    } catch (err) {
        console.error('Resend code error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// LOGIN USER
// ==========================================
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });

        const userSnap = await db.collection('users').where('email', '==', email.toLowerCase().trim()).limit(1).get();
        if (userSnap.empty) return res.status(401).json({ message: 'Invalid email or password' });

        const user = userSnap.docs[0].data();

        // Check verification status
        if (!user.is_verified) {
            return res.status(403).json({ message: 'Please verify your email before logging in.', email: user.email });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign({ id: user.id, email: user.email }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return res.status(200).json({
            message: 'Login successful!',
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                profile_image: user.profile_image
            }
        });
    } catch (e) {
        console.error('Login error:', e);
        return res.status(500).json({ message: 'Server error.' });
    }
};

// ==========================================
// GET PROFILE
// ==========================================
exports.getProfile = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const userDoc = await db.collection('users').doc(String(userId)).get();
        if (!userDoc.exists) return res.status(404).json({ message: 'User not found' });

        const userData = userDoc.data();
        const user = {
            id: userData.id,
            full_name: userData.full_name,
            email: userData.email,
            bio: userData.bio || '',
            profile_image: userData.profile_image || null,
            cover_image: userData.cover_image || null,
            created_at: userData.created_at
        };

        // Get user skills
        const skillsSnap = await db.collection('skills').where('user_id', '==', userId).get();
        const skills = skillsSnap.docs.map(doc => ({ id: doc.data().id, skill_name: doc.data().skill_name, skill_type: doc.data().skill_type }));

        user.skills_teach = skills.filter(s => s.skill_type === 'teach');
        user.skills_learn = skills.filter(s => s.skill_type === 'learn');

        return res.status(200).json({ user });
    } catch (err) {
        console.error('Get profile error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// UPDATE PROFILE
// ==========================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const { full_name, bio, profile_image, cover_image } = req.body;

        if (!full_name || full_name.trim().length < 2) {
            return res.status(400).json({ message: 'Full name must be at least 2 characters' });
        }

        const updateData = {
            full_name: full_name.trim(),
            bio: bio !== undefined ? bio : ''
        };

        if (profile_image !== undefined) updateData.profile_image = profile_image;
        if (cover_image !== undefined) updateData.cover_image = cover_image;

        await db.collection('users').doc(String(userId)).update(updateData);
        return res.status(200).json({ message: 'Profile updated successfully!' });
    } catch (err) {
        console.error('Update profile error:', err);
        return res.status(500).json({ message: 'Failed to update profile' });
    }
};

// ==========================================
// ADD SKILL
// ==========================================
exports.addSkill = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const { skill_name, skill_type } = req.body;

        if (!skill_name || !skill_type) return res.status(400).json({ message: 'Skill name and type required' });
        if (!['teach', 'learn'].includes(skill_type)) return res.status(400).json({ message: 'skill_type must be teach or learn' });

        const skillId = await getNextId('skills');
        const skillData = {
            id: skillId,
            user_id: userId,
            skill_name: skill_name.trim(),
            skill_type,
            created_at: new Date().toISOString()
        };

        await db.collection('skills').doc(String(skillId)).set(skillData);

        return res.status(201).json({
            message: 'Skill added!',
            skill: { id: skillId, skill_name: skill_name.trim(), skill_type }
        });
    } catch (err) {
        console.error('Add skill error:', err);
        return res.status(500).json({ message: 'Failed to add skill' });
    }
};

// ==========================================
// DELETE SKILL
// ==========================================
exports.deleteSkill = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const skillId = parseInt(req.params.id);

        const skillRef = db.collection('skills').doc(String(skillId));
        const skillDoc = await skillRef.get();

        if (!skillDoc.exists || skillDoc.data().user_id !== userId) {
            return res.status(404).json({ message: 'Skill not found' });
        }

        await skillRef.delete();
        return res.status(200).json({ message: 'Skill deleted!' });
    } catch (err) {
        console.error('Delete skill error:', err);
        return res.status(500).json({ message: 'Failed to delete skill' });
    }
};

// ==========================================
// GET ALL USERS (Marketplace)
// ==========================================
exports.getAllUsers = async (req, res) => {
    try {
        const currentUserId = req.user ? parseInt(req.user.id) : null;
        const includeSelf = req.query.include_self === 'true' || req.query.admin === 'true';

        // Fetch all users
        const usersSnap = await db.collection('users').get();
        const users = [];
        const userIds = [];

        usersSnap.forEach(doc => {
            const u = doc.data();
            if (includeSelf || u.id !== currentUserId) {
                users.push({
                    id: u.id,
                    full_name: u.full_name,
                    email: u.email,
                    bio: u.bio || '',
                    profile_image: u.profile_image || null,
                    is_current_user: u.id === currentUserId,
                    skills_teach: [],
                    skills_learn: []
                });
                userIds.push(u.id);
            }
        });

        if (users.length === 0) return res.status(200).json({ users: [] });

        // Fetch all skills
        const skillsSnap = await db.collection('skills').get();
        const skillsByUser = new Map();

        skillsSnap.forEach(doc => {
            const s = doc.data();
            if (!skillsByUser.has(s.user_id)) {
                skillsByUser.set(s.user_id, { teach: [], learn: [] });
            }
            if (s.skill_type === 'teach') skillsByUser.get(s.user_id).teach.push(s.skill_name);
            else if (s.skill_type === 'learn') skillsByUser.get(s.user_id).learn.push(s.skill_name);
        });

        users.forEach(u => {
            const userSkills = skillsByUser.get(u.id);
            if (userSkills) {
                u.skills_teach = userSkills.teach;
                u.skills_learn = userSkills.learn;
            }
        });

        return res.status(200).json({ users });
    } catch (err) {
        console.error('Get all users error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// SEND REQUEST
// ==========================================
exports.sendRequest = async (req, res) => {
    try {
        const sender_id = parseInt(req.user.id);
        const { receiver_id, offered_skill, requested_skill, message } = req.body;

        if (!receiver_id) return res.status(400).json({ message: 'Receiver required' });
        const targetReceiverId = parseInt(receiver_id);

        if (sender_id === targetReceiverId) {
            return res.status(400).json({ message: 'Cannot send exchange request to yourself' });
        }

        // 1. Check if already friends (Accepted request exists in either direction)
        const [acceptedSnap1, acceptedSnap2] = await Promise.all([
            db.collection('exchange_requests')
                .where('sender_id', '==', sender_id)
                .where('receiver_id', '==', targetReceiverId)
                .where('status', '==', 'Accepted')
                .limit(1)
                .get(),
            db.collection('exchange_requests')
                .where('sender_id', '==', targetReceiverId)
                .where('receiver_id', '==', sender_id)
                .where('status', '==', 'Accepted')
                .limit(1)
                .get()
        ]);

        if (!acceptedSnap1.empty || !acceptedSnap2.empty) {
            return res.status(409).json({ message: 'You are already connected as friends with this user' });
        }

        // 2. Check if a request is already pending in either direction
        const [pendingSnap1, pendingSnap2] = await Promise.all([
            db.collection('exchange_requests')
                .where('sender_id', '==', sender_id)
                .where('receiver_id', '==', targetReceiverId)
                .where('status', '==', 'Pending')
                .limit(1)
                .get(),
            db.collection('exchange_requests')
                .where('sender_id', '==', targetReceiverId)
                .where('receiver_id', '==', sender_id)
                .where('status', '==', 'Pending')
                .limit(1)
                .get()
        ]);

        if (!pendingSnap1.empty) {
            return res.status(409).json({ message: 'Request already sent to this user and is pending' });
        }

        if (!pendingSnap2.empty) {
            return res.status(409).json({ message: 'This user has already sent you a pending request. Check your incoming requests to accept!' });
        }

        const requestId = await getNextId('exchange_requests');
        const requestData = {
            id: requestId,
            sender_id,
            receiver_id: targetReceiverId,
            offered_skill: offered_skill || '',
            requested_skill: requested_skill || '',
            message: message || '',
            status: 'Pending',
            created_at: new Date().toISOString()
        };

        await db.collection('exchange_requests').doc(String(requestId)).set(requestData);
        return res.status(201).json({ message: 'Request sent successfully!', request_id: requestId });
    } catch (err) {
        console.error('Send request error:', err);
        return res.status(500).json({ message: 'Failed to send request' });
    }
};

// ==========================================
// GET MY REQUESTS (incoming & outgoing)
// ==========================================
exports.getRequests = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);

        const [receiverSnap, senderSnap] = await Promise.all([
            db.collection('exchange_requests').where('receiver_id', '==', userId).get(),
            db.collection('exchange_requests').where('sender_id', '==', userId).get()
        ]);

        const requestsMap = new Map();
        receiverSnap.forEach(doc => requestsMap.set(doc.data().id, doc.data()));
        senderSnap.forEach(doc => requestsMap.set(doc.data().id, doc.data()));

        const requests = Array.from(requestsMap.values());
        // Sort descending by created_at
        requests.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Cache user info lookups to avoid repeated database hits
        const userCache = new Map();
        const getUserData = async (uid) => {
            if (!uid) return { name: 'Member', image: '' };
            if (userCache.has(uid)) return userCache.get(uid);
            try {
                const uDoc = await db.collection('users').doc(String(uid)).get();
                if (uDoc.exists) {
                    const u = uDoc.data();
                    const data = { name: u.full_name || 'Member', image: u.profile_image || '' };
                    userCache.set(uid, data);
                    return data;
                }
            } catch (e) {}
            const fallback = { name: 'Member', image: '' };
            userCache.set(uid, fallback);
            return fallback;
        };

        for (const r of requests) {
            const senderData = await getUserData(r.sender_id);
            r.sender_name = senderData.name;
            r.sender_image = senderData.image;

            const receiverData = await getUserData(r.receiver_id);
            r.receiver_name = receiverData.name;
            r.receiver_image = receiverData.image;
        }

        return res.status(200).json({ requests });
    } catch (err) {
        console.error('Get requests error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// UPDATE REQUEST STATUS
// ==========================================
exports.updateRequest = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const requestId = parseInt(req.params.id);
        const { status } = req.body;

        if (!['Accepted', 'Rejected', 'Cancelled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const reqRef = db.collection('exchange_requests').doc(String(requestId));
        const reqDoc = await reqRef.get();

        if (!reqDoc.exists) {
            return res.status(404).json({ message: 'Request not found' });
        }

        const reqData = reqDoc.data();

        // Sender can cancel their own pending request
        if (status === 'Cancelled') {
            if (reqData.sender_id !== userId) {
                return res.status(403).json({ message: 'Only sender can cancel a request' });
            }
        } else {
            // Receiver can accept or reject
            if (reqData.receiver_id !== userId) {
                return res.status(403).json({ message: 'Only receiver can accept or reject a request' });
            }
        }

        await reqRef.update({ status });
        return res.status(200).json({ message: `Request ${status}` });
    } catch (err) {
        console.error('Update request error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// GET SESSIONS
// ==========================================
exports.getSessions = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);

        // 1. Fetch exchange requests where current user is sender or receiver
        const senderReqs = await db.collection('exchange_requests').where('sender_id', '==', userId).get();
        const receiverReqs = await db.collection('exchange_requests').where('receiver_id', '==', userId).get();

        const requestsMap = new Map();
        senderReqs.forEach(doc => requestsMap.set(doc.data().id, doc.data()));
        receiverReqs.forEach(doc => requestsMap.set(doc.data().id, doc.data()));

        if (requestsMap.size === 0) return res.status(200).json({ sessions: [] });

        const requestIds = Array.from(requestsMap.keys());
        const sessionsSnap = await db.collection('sessions').get();
        const relevantSessions = [];

        sessionsSnap.forEach(doc => {
            const s = doc.data();
            if (requestsMap.has(s.request_id)) {
                relevantSessions.push({ ...s });
            }
        });

        // Join data
        for (const s of relevantSessions) {
            const er = requestsMap.get(s.request_id);
            s.offered_skill = er.offered_skill;
            s.requested_skill = er.requested_skill;
            s.sender_id = er.sender_id;
            s.receiver_id = er.receiver_id;

            const u1Doc = await db.collection('users').doc(String(er.sender_id)).get();
            const u2Doc = await db.collection('users').doc(String(er.receiver_id)).get();

            s.sender_name = u1Doc.exists ? u1Doc.data().full_name : 'Member';
            s.receiver_name = u2Doc.exists ? u2Doc.data().full_name : 'Member';
        }

        relevantSessions.sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));
        return res.status(200).json({ sessions: relevantSessions });
    } catch (err) {
        console.error('Get sessions error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// CREATE SESSION (after accept)
// ==========================================
exports.createSession = async (req, res) => {
    try {
        const { request_id, scheduled_at, duration_minutes, meeting_link } = req.body;
        if (!request_id || !scheduled_at) {
            return res.status(400).json({ message: 'request_id and scheduled_at required' });
        }

        const sessionId = await getNextId('sessions');
        const sessionData = {
            id: sessionId,
            request_id: parseInt(request_id),
            scheduled_at,
            duration_minutes: duration_minutes ? parseInt(duration_minutes) : 60,
            meeting_link: meeting_link || '',
            status: 'Upcoming',
            created_at: new Date().toISOString()
        };

        await db.collection('sessions').doc(String(sessionId)).set(sessionData);
        return res.status(201).json({ message: 'Session scheduled!', session_id: sessionId });
    } catch (err) {
        console.error('Create session error:', err);
        return res.status(500).json({ message: 'Failed to create session' });
    }
};

// ==========================================
// GET MESSAGES
// ==========================================
exports.getMessages = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const otherUserId = parseInt(req.params.userId);

        // Fetch messages where (sender == user && receiver == other) OR (sender == other && receiver == user)
        const snap1 = await db.collection('messages')
            .where('sender_id', '==', userId)
            .where('receiver_id', '==', otherUserId)
            .get();

        const snap2 = await db.collection('messages')
            .where('sender_id', '==', otherUserId)
            .where('receiver_id', '==', userId)
            .get();

        const messages = [];
        const unreadBatch = db.batch();

        snap1.forEach(doc => messages.push(doc.data()));
        snap2.forEach(doc => {
            const data = doc.data();
            messages.push(data);
            if (!data.is_read) {
                unreadBatch.update(doc.ref, { is_read: true });
            }
        });

        await unreadBatch.commit();

        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        // Fetch sender names
        const senderNames = new Map();
        for (const m of messages) {
            if (!senderNames.has(m.sender_id)) {
                const uDoc = await db.collection('users').doc(String(m.sender_id)).get();
                senderNames.set(m.sender_id, uDoc.exists ? uDoc.data().full_name : 'Member');
            }
            m.sender_name = senderNames.get(m.sender_id);
        }

        return res.status(200).json({ messages });
    } catch (err) {
        console.error('Get messages error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// SEND MESSAGE
// ==========================================
exports.sendMessage = async (req, res) => {
    try {
        const sender_id = parseInt(req.user.id);
        const { receiver_id, message } = req.body;

        if (!receiver_id || !message) return res.status(400).json({ message: 'receiver_id and message required' });

        const msgId = await getNextId('messages');
        const messageData = {
            id: msgId,
            sender_id,
            receiver_id: parseInt(receiver_id),
            message: message.trim(),
            is_read: false,
            created_at: new Date().toISOString()
        };

        await db.collection('messages').doc(String(msgId)).set(messageData);
        return res.status(201).json({ message: 'Message sent!', id: msgId });
    } catch (err) {
        console.error('Send message error:', err);
        return res.status(500).json({ message: 'Failed to send message' });
    }
};

// ==========================================
// GET CHAT USERS
// ==========================================
exports.getChatUsers = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);

        const sentSnap = await db.collection('messages').where('sender_id', '==', userId).get();
        const recvSnap = await db.collection('messages').where('receiver_id', '==', userId).get();

        const partnerIds = new Set();
        sentSnap.forEach(d => partnerIds.add(d.data().receiver_id));
        recvSnap.forEach(d => partnerIds.add(d.data().sender_id));
        partnerIds.delete(userId);

        const users = [];
        for (const pId of partnerIds) {
            const uDoc = await db.collection('users').doc(String(pId)).get();
            if (uDoc.exists) {
                const u = uDoc.data();
                const unreadSnap = await db.collection('messages')
                    .where('receiver_id', '==', userId)
                    .where('sender_id', '==', pId)
                    .where('is_read', '==', false)
                    .get();

                users.push({
                    id: u.id,
                    full_name: u.full_name,
                    profile_image: u.profile_image || null,
                    unread: unreadSnap.size
                });
            }
        }

        return res.status(200).json({ users });
    } catch (err) {
        console.error('Get chat users error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// GET REVIEWS
// ==========================================
exports.getReviews = async (req, res) => {
    try {
        const userId = parseInt(req.params.userId || req.user.id);
        const reviewsSnap = await db.collection('reviews')
            .where('reviewed_id', '==', userId)
            .get();

        const reviews = reviewsSnap.docs.map(doc => doc.data());
        reviews.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        for (const r of reviews) {
            const uDoc = await db.collection('users').doc(String(r.reviewer_id)).get();
            if (uDoc.exists) {
                const u = uDoc.data();
                r.reviewer_name = u.full_name;
                r.reviewer_image = u.profile_image || null;
            } else {
                r.reviewer_name = 'Member';
                r.reviewer_image = null;
            }
        }

        return res.status(200).json({ reviews });
    } catch (err) {
        console.error('Get reviews error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// GET FRIENDS (accepted exchange requests only)
// ==========================================
exports.getFriends = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);

        const snap1 = await db.collection('exchange_requests')
            .where('sender_id', '==', userId)
            .where('status', '==', 'Accepted')
            .get();

        const snap2 = await db.collection('exchange_requests')
            .where('receiver_id', '==', userId)
            .where('status', '==', 'Accepted')
            .get();

        const friendIds = new Set();
        snap1.forEach(d => friendIds.add(d.data().receiver_id));
        snap2.forEach(d => friendIds.add(d.data().sender_id));
        friendIds.delete(userId);

        const friends = [];
        for (const fId of friendIds) {
            const uDoc = await db.collection('users').doc(String(fId)).get();
            if (uDoc.exists) {
                const u = uDoc.data();
                friends.push({
                    id: u.id,
                    full_name: u.full_name,
                    profile_image: u.profile_image || null
                });
            }
        }

        return res.status(200).json({ friends });
    } catch (err) {
        console.error('Get friends error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// CREATE GROUP
// ==========================================
exports.createGroup = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const { group_name, member_ids } = req.body;

        if (!group_name || !member_ids || !member_ids.length) {
            return res.status(400).json({ message: 'Group name and members required' });
        }

        const groupId = await getNextId('groups');
        const groupData = {
            id: groupId,
            name: group_name.trim(),
            created_by: userId,
            created_at: new Date().toISOString()
        };

        await db.collection('groups').doc(String(groupId)).set(groupData);

        // Add creator + all members
        const allMembers = [...new Set([userId, ...member_ids.map(Number)])];
        const batch = db.batch();

        for (const mId of allMembers) {
            const memberRef = db.collection('group_members').doc(`${groupId}_${mId}`);
            batch.set(memberRef, {
                group_id: groupId,
                user_id: mId,
                joined_at: new Date().toISOString()
            });
        }

        await batch.commit();
        return res.status(201).json({ message: 'Group created!', group_id: groupId });
    } catch (err) {
        console.error('Create group error:', err);
        return res.status(500).json({ message: 'Failed to create group' });
    }
};

// ==========================================
// GET MY GROUPS
// ==========================================
exports.getGroups = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);

        const memSnap = await db.collection('group_members').where('user_id', '==', userId).get();
        if (memSnap.empty) return res.status(200).json({ groups: [] });

        const groups = [];
        for (const doc of memSnap.docs) {
            const gId = doc.data().group_id;
            const gDoc = await db.collection('groups').doc(String(gId)).get();
            if (gDoc.exists) {
                const gData = gDoc.data();

                // Count members
                const allMembersSnap = await db.collection('group_members').where('group_id', '==', gId).get();

                // Last message
                const msgSnap = await db.collection('group_messages')
                    .where('group_id', '==', gId)
                    .get();

                let lastMessage = null;
                if (!msgSnap.empty) {
                    const allMsgs = msgSnap.docs.map(d => d.data());
                    allMsgs.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                    lastMessage = allMsgs[0].message;
                }

                groups.push({
                    id: gData.id,
                    name: gData.name,
                    created_by: gData.created_by,
                    created_at: gData.created_at,
                    member_count: allMembersSnap.size,
                    last_message: lastMessage
                });
            }
        }

        groups.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return res.status(200).json({ groups });
    } catch (err) {
        console.error('Get groups error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// GET GROUP MESSAGES
// ==========================================
exports.getGroupMessages = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const groupId = parseInt(req.params.groupId);

        // Check if member
        const memDoc = await db.collection('group_members').doc(`${groupId}_${userId}`).get();
        if (!memDoc.exists) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        const msgSnap = await db.collection('group_messages')
            .where('group_id', '==', groupId)
            .get();

        const messages = msgSnap.docs.map(d => d.data());
        messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        for (const m of messages) {
            const uDoc = await db.collection('users').doc(String(m.sender_id)).get();
            if (uDoc.exists) {
                const u = uDoc.data();
                m.sender_name = u.full_name;
                m.sender_image = u.profile_image || null;
            } else {
                m.sender_name = 'Member';
                m.sender_image = null;
            }
        }

        return res.status(200).json({ messages });
    } catch (err) {
        console.error('Get group messages error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// SEND GROUP MESSAGE
// ==========================================
exports.sendGroupMessage = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const groupId = parseInt(req.params.groupId);
        const { message } = req.body;

        if (!message) return res.status(400).json({ message: 'Message required' });

        const memDoc = await db.collection('group_members').doc(`${groupId}_${userId}`).get();
        if (!memDoc.exists) {
            return res.status(403).json({ message: 'Not a member of this group' });
        }

        const msgId = await getNextId('group_messages');
        const msgData = {
            id: msgId,
            group_id: groupId,
            sender_id: userId,
            message: message.trim(),
            created_at: new Date().toISOString()
        };

        await db.collection('group_messages').doc(String(msgId)).set(msgData);
        return res.status(201).json({ message: 'Sent!', id: msgId });
    } catch (err) {
        console.error('Send group message error:', err);
        return res.status(500).json({ message: 'Failed to send message' });
    }
};

// ==========================================
// GET GROUP MEMBERS
// ==========================================
exports.getGroupMembers = async (req, res) => {
    try {
        const groupId = parseInt(req.params.groupId);
        const memSnap = await db.collection('group_members').where('group_id', '==', groupId).get();

        const members = [];
        for (const doc of memSnap.docs) {
            const uId = doc.data().user_id;
            const uDoc = await db.collection('users').doc(String(uId)).get();
            if (uDoc.exists) {
                const u = uDoc.data();
                members.push({
                    id: u.id,
                    full_name: u.full_name,
                    profile_image: u.profile_image || null
                });
            }
        }

        return res.status(200).json({ members });
    } catch (err) {
        console.error('Get group members error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// AI CHATBOT (Binimoy AI Assistant)
// ==========================================
exports.chatWithBot = async (req, res) => {
    const { message, history } = req.body;
    if (!message || !message.trim()) {
        return res.status(400).json({ message: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return res.status(200).json({
            reply: "👋 Hello! I am **Binimoy AI**, your Skill Binimoy assistant.\n\nIt looks like the `GEMINI_API_KEY` hasn't been set in your backend environment variables yet. Once added on Render, I'll be fully active to answer all your learning and platform questions!\n\n💡 *Quick tip: Skill Binimoy lets you teach skills you know and learn new skills for free—no money needed!*"
        });
    }

    const systemInstruction = `You are Binimoy AI, the official friendly and intelligent assistant for "Skill Binimoy" — a modern peer-to-peer skill exchange platform where people share knowledge for free through skill bartering (no money involved).

Key Knowledge about Skill Binimoy:
1. Registration & Auth: Users register with a @gmail.com address, receive a 6-digit verification code, and verify their account.
2. Profile: Users list "Skills I Teach" and "Skills I Want to Learn", and can upload an avatar/cover photo.
3. Marketplace: Users can browse and search members by skills offered/wanted, view profiles, and click "Send Request" to initiate an exchange.
4. Requests: Received exchange requests can be Accepted or Rejected.
5. Sessions: Once a request is accepted, users can schedule 1-on-1 sessions with meeting links (Google Meet, Zoom, etc.) and durations.
6. Messages/Chat: Users can chat directly with accepted partners or create study groups.
7. Reviews: Users can review and rate each other (1 to 5 stars) after learning sessions.

Your responsibilities:
- Answer questions about how to use Skill Binimoy clearly and concisely.
- If a user asks for skill recommendations or learning roadmaps (e.g., Web Development, Python, UI/UX, Graphic Design, Photography, Cooking, etc.), give structured, encouraging, and practical advice.
- Keep answers concise, polite, well-formatted with Markdown (bullet points, bold text), and easy to read on mobile.`;

    try {
        const contents = [];
        if (Array.isArray(history)) {
            const validHistory = history.slice(-6);
            for (const item of validHistory) {
                if (item.role && item.text) {
                    contents.push({
                        role: item.role === 'user' ? 'user' : 'model',
                        parts: [{ text: item.text }]
                    });
                }
            }
        }
        contents.push({
            role: 'user',
            parts: [{ text: message.trim() }]
        });

        const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-lite-latest'];
        let replyText = null;

        for (const model of candidateModels) {
            try {
                const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(geminiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-goog-api-key': apiKey
                    },
                    body: JSON.stringify({
                        system_instruction: {
                            parts: [{ text: systemInstruction }]
                        },
                        contents,
                        generationConfig: {
                            temperature: 0.7,
                            maxOutputTokens: 800
                        }
                    })
                });

                const data = await response.json();
                if (response.ok && data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    replyText = data.candidates[0].content.parts[0].text;
                    break;
                } else {
                    console.warn(`Model ${model} failed:`, data?.error?.message || data);
                }
            } catch (modelErr) {
                console.warn(`Model ${model} request error:`, modelErr.message);
            }
        }

        if (!replyText) {
            return res.status(200).json({
                reply: "I'm having a little trouble connecting to the AI service right now. Please try again in a few moments! 😊"
            });
        }

        return res.status(200).json({ reply: replyText });
    } catch (err) {
        console.error('Chatbot error:', err);
        return res.status(500).json({
            reply: "Oops! Something went wrong while processing your question. Please try again."
        });
    }
};

// ==========================================
// GET TRENDING SKILLS
// ==========================================
exports.getTrendingSkills = async (req, res) => {
    try {
        const skillsSnap = await db.collection('skills').get();
        const skillCounts = new Map();

        skillsSnap.forEach(doc => {
            const s = doc.data();
            const name = s.skill_name;
            if (!name) return;

            if (!skillCounts.has(name)) {
                skillCounts.set(name, { skill_name: name, total_count: 0, teach_count: 0, learn_count: 0 });
            }
            const item = skillCounts.get(name);
            item.total_count += 1;
            if (s.skill_type === 'teach') item.teach_count += 1;
            if (s.skill_type === 'learn') item.learn_count += 1;
        });

        const trending = Array.from(skillCounts.values());
        trending.sort((a, b) => b.total_count - a.total_count || a.skill_name.localeCompare(b.skill_name));

        return res.status(200).json({ trending: trending.slice(0, 10) });
    } catch (err) {
        console.error('Trending skills error:', err);
        return res.status(500).json({ message: 'Failed to get trending skills' });
    }
};

// ==========================================
// GENERATE VIDEO ROOM (Jitsi Meet)
// ==========================================
exports.generateVideoRoom = async (req, res) => {
    try {
        const userId = parseInt(req.user.id);
        const type = req.body.type;
        const targetId = req.body.targetId || req.body.target_id;

        if (!type || !targetId) {
            return res.status(400).json({ message: 'Call type and targetId are required' });
        }

        if (type === 'session') {
            const sDoc = await db.collection('sessions').doc(String(targetId)).get();
            if (!sDoc.exists) return res.status(403).json({ message: 'Session not found' });
            const session = sDoc.data();

            const erDoc = await db.collection('exchange_requests').doc(String(session.request_id)).get();
            if (!erDoc.exists) return res.status(403).json({ message: 'Exchange request not found' });
            const er = erDoc.data();

            if (er.sender_id !== userId && er.receiver_id !== userId) {
                return res.status(403).json({ message: 'Session unauthorized' });
            }

            const u1Doc = await db.collection('users').doc(String(er.sender_id)).get();
            const u2Doc = await db.collection('users').doc(String(er.receiver_id)).get();
            const senderName = u1Doc.exists ? u1Doc.data().full_name : 'Member';
            const receiverName = u2Doc.exists ? u2Doc.data().full_name : 'Member';
            const partnerName = er.sender_id === userId ? receiverName : senderName;

            return res.status(200).json({
                roomName: `skillbinimoy-session-${session.id}`,
                durationMinutes: 20, // Enforced 20-minute maximum limit for sessions
                title: `${er.offered_skill} ↔ ${er.requested_skill}`,
                partnerName
            });
        } else if (type === 'direct') {
            const otherUserId = parseInt(targetId);

            // Verify friendship (accepted request)
            const snap1 = await db.collection('exchange_requests')
                .where('sender_id', '==', userId)
                .where('receiver_id', '==', otherUserId)
                .where('status', '==', 'Accepted')
                .limit(1)
                .get();

            const snap2 = await db.collection('exchange_requests')
                .where('sender_id', '==', otherUserId)
                .where('receiver_id', '==', userId)
                .where('status', '==', 'Accepted')
                .limit(1)
                .get();

            if (snap1.empty && snap2.empty) {
                return res.status(403).json({ message: 'You can only video call accepted friends' });
            }

            const otherUserDoc = await db.collection('users').doc(String(otherUserId)).get();
            const partnerName = otherUserDoc.exists ? otherUserDoc.data().full_name : 'Friend';

            const minId = Math.min(userId, otherUserId);
            const maxId = Math.max(userId, otherUserId);
            const roomName = `skillbinimoy-call-${minId}-${maxId}`;

            return res.status(200).json({
                roomName,
                durationMinutes: null,
                title: `Video Call with ${partnerName}`,
                partnerName
            });
        } else if (type === 'group') {
            const groupId = parseInt(targetId);
            const memDoc = await db.collection('group_members').doc(`${groupId}_${userId}`).get();
            if (!memDoc.exists) return res.status(403).json({ message: 'Not a member of this group' });

            const gDoc = await db.collection('groups').doc(String(groupId)).get();
            const groupName = gDoc.exists ? gDoc.data().name : 'Group';

            return res.status(200).json({
                roomName: `skillbinimoy-group-${groupId}`,
                durationMinutes: null,
                title: `Group Call: ${groupName}`,
                partnerName: groupName
            });
        } else {
            return res.status(400).json({ message: 'Invalid call type' });
        }
    } catch (err) {
        console.error('Generate video room error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// ==========================================
// REAL-TIME CALL REGISTRY (Messenger-style)
// ==========================================
const activeCalls = new Map();

// Periodic cleanup of stale calls (older than 60 seconds)
setInterval(() => {
    const now = Date.now();
    for (const [callId, call] of activeCalls.entries()) {
        if (now - call.createdAt > 60000 || ['rejected', 'cancelled', 'ended'].includes(call.status)) {
            activeCalls.delete(callId);
        }
    }
}, 30000);

// INITIATE CALL (User A calls User B - Video or Audio)
exports.initiateCall = async (req, res) => {
    try {
        const callerId = parseInt(req.user.id);
        const receiverId = req.body.receiverId || req.body.receiver_id;
        const callType = req.body.callType || req.body.call_type || 'video';
        const offer = req.body.offer;

        if (!receiverId) return res.status(400).json({ message: 'Receiver ID required' });
        const targetUserId = parseInt(receiverId);

        if (callerId === targetUserId) {
            return res.status(400).json({ message: 'You cannot call yourself' });
        }

        // Fetch Target User & Caller info from Firestore
        const targetDoc = await db.collection('users').doc(String(targetUserId)).get();
        if (!targetDoc.exists) return res.status(404).json({ message: 'User not found' });
        const targetUser = targetDoc.data();

        const callerDoc = await db.collection('users').doc(String(callerId)).get();
        if (!callerDoc.exists) return res.status(404).json({ message: 'Caller not found' });
        const callerUser = callerDoc.data();

        // Clear any existing active calls for this pair
        for (const [existingId, existingCall] of activeCalls.entries()) {
            if (existingCall.callerId === callerId || existingCall.receiverId === callerId) {
                if (existingCall.status === 'ringing') {
                    existingCall.status = 'cancelled';
                }
            }
        }

        const minId = Math.min(callerId, targetUserId);
        const maxId = Math.max(callerId, targetUserId);
        const roomName = `skillbinimoy-call-${minId}-${maxId}`;
        const callId = `call_${callerId}_${targetUserId}_${Date.now()}`;

        const callData = {
            callId,
            callerId,
            callerName: callerUser.full_name,
            callerImage: callerUser.profile_image || '',
            receiverId: targetUserId,
            receiverName: targetUser.full_name,
            receiverImage: targetUser.profile_image || '',
            roomName,
            callType: (callType === 'audio') ? 'audio' : 'video',
            offer: offer || null,
            answer: null,
            callerCandidates: [],
            receiverCandidates: [],
            status: 'ringing',
            createdAt: Date.now()
        };

        activeCalls.set(callId, callData);

        return res.status(200).json({
            callId,
            roomName,
            callType: callData.callType,
            partnerName: targetUser.full_name,
            partnerImage: targetUser.profile_image || '',
            status: 'ringing'
        });
    } catch (err) {
        console.error('Initiate call error:', err);
        return res.status(500).json({ message: 'Server error' });
    }
};

// CHECK CALL STATUS (Caller checks if Receiver accepted/rejected)
exports.checkCallStatus = (req, res) => {
    const { callId } = req.params;
    const call = activeCalls.get(callId);

    if (!call) {
        return res.status(200).json({ status: 'ended' });
    }

    // Auto timeout if ringing > 35s
    if (call.status === 'ringing' && Date.now() - call.createdAt > 35000) {
        call.status = 'timeout';
    }

    res.status(200).json({
        callId: call.callId,
        status: call.status,
        callType: call.callType || 'video',
        roomName: call.roomName,
        answer: call.answer || null
    });
};

// GET INCOMING CALL (Receiver polls to see if anyone is calling them)
exports.getIncomingCall = (req, res) => {
    const userId = parseInt(req.user.id);
    const now = Date.now();

    for (const call of activeCalls.values()) {
        if (call.receiverId === userId && call.status === 'ringing') {
            if (now - call.createdAt <= 35000) {
                return res.status(200).json({
                    incomingCall: {
                        callId: call.callId,
                        callerName: call.callerName,
                        callerImage: call.callerImage,
                        roomName: call.roomName,
                        callerId: call.callerId,
                        callType: call.callType || 'video',
                        offer: call.offer || null
                    }
                });
            } else {
                call.status = 'timeout';
            }
        }
    }

    res.status(200).json({ incomingCall: null });
};

// RESPOND TO CALL (Receiver accepts or rejects/cuts)
exports.respondCall = (req, res) => {
    const userId = parseInt(req.user.id);
    const callId = req.body.callId || req.body.call_id;
    const action = req.body.action;
    const answer = req.body.answer;

    const call = activeCalls.get(callId);
    if (!call || call.receiverId !== userId) {
        return res.status(404).json({ message: 'Call not found or expired' });
    }

    if (action === 'accept') {
        call.status = 'accepted';
        if (answer) call.answer = answer;
        return res.status(200).json({
            message: 'Call accepted',
            roomName: call.roomName,
            partnerName: call.callerName,
            callType: call.callType || 'video',
            offer: call.offer || null
        });
    } else {
        call.status = 'rejected';
        return res.status(200).json({ message: 'Call rejected' });
    }
};

// CANCEL CALL (Caller cancels before answered, or either user ends call)
exports.cancelCall = (req, res) => {
    const userId = parseInt(req.user.id);
    const callId = req.body.callId || req.body.call_id;

    const call = activeCalls.get(callId);
    if (call && (call.callerId === userId || call.receiverId === userId)) {
        call.status = 'ended';
    }
    res.status(200).json({ message: 'Call ended' });
};

// SEND CALL SIGNAL (Exchange ICE Candidates, offer, or answer)
exports.sendCallSignal = (req, res) => {
    const userId = parseInt(req.user.id);
    const callId = req.body.callId || req.body.call_id;
    const candidate = req.body.candidate || (req.body.type === 'ice' ? req.body.payload : null);
    const offer = req.body.offer || (req.body.type === 'offer' ? req.body.payload : null);
    const answer = req.body.answer || (req.body.type === 'answer' ? req.body.payload : null);
    const role = req.body.role || (req.body.type === 'caller' ? 'caller' : 'receiver');
    const call = activeCalls.get(callId);
    if (!call) return res.status(404).json({ message: 'Call not found' });

    if (offer) {
        call.offer = offer;
    }
    if (answer) {
        call.answer = answer;
    }
    if (candidate) {
        if (role === 'caller' && call.callerId === userId) {
            call.callerCandidates.push(candidate);
        } else if (role === 'receiver' && call.receiverId === userId) {
            call.receiverCandidates.push(candidate);
        }
    }
    res.status(200).json({ status: 'ok' });
};

// GET CALL SIGNALS (Retrieve ICE Candidates & signals from peer)
exports.getCallSignals = (req, res) => {
    const userId = parseInt(req.user.id);
    const { callId } = req.params;
    const { role } = req.query;
    const call = activeCalls.get(callId);
    if (!call) return res.status(200).json({ candidates: [], offer: null, answer: null });

    let candidates = [];
    if (role === 'caller' && call.callerId === userId) {
        candidates = [...call.receiverCandidates];
        call.receiverCandidates = [];
    } else if (role === 'receiver' && call.receiverId === userId) {
        candidates = [...call.callerCandidates];
        call.callerCandidates = [];
    }
    res.status(200).json({ candidates, offer: call.offer || null, answer: call.answer || null });
};
