const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
<<<<<<< HEAD
require('./config/firebase');
=======
>>>>>>> 17a17e23800d607b51f29a6c49dcd5ee82c05319

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

try {
    const userRoutes = require('./routes/userRoutes');
    app.use('/api/users', userRoutes);
    console.log('✅ Routes loaded');
} catch(e) {
    console.error('❌ Routes failed:', e.message);
}

app.get('/', (req, res) => {
<<<<<<< HEAD
    res.json({ status: 'ok', message: 'Skill Binimoy Backend Running with Firebase ✅' });
=======
    res.json({ status: 'ok', message: 'Skill Binimoy Backend Running ✅' });
>>>>>>> 17a17e23800d607b51f29a6c49dcd5ee82c05319
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
