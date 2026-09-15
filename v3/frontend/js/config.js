const isLocalHost = Boolean(
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]'
);
window.API_URL = isLocalHost ? 'http://localhost:5000' : 'https://skill-binimoy-backend.onrender.com';

