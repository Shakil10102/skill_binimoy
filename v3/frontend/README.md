# Skill Binimoy - Skill Exchange Platform

A modern, responsive peer-to-peer skill exchange platform built with HTML5, CSS3, and Vanilla JavaScript.

## 🎨 Features

- **Modern Dark Theme** with light mode toggle
- **Glassmorphism UI** with smooth animations
- **Fully Responsive** design (Desktop, Tablet, Mobile)
- **10 Complete Pages** with interactive functionality
- **No Frameworks Required** - Pure HTML, CSS, and JavaScript

## 📁 Project Structure

```
frontend/
│
├── index.html              # Homepage
├── login.html              # Login page
├── register.html           # Registration page
├── dashboard.html          # User dashboard
├── marketplace.html        # Skill marketplace
├── profile.html            # User profile
├── requests.html           # Exchange requests
├── chat.html               # Messaging system
├── sessions.html           # Learning sessions
├── admin.html              # Admin dashboard
│
├── css/
│   ├── style.css          # Main styles
│   ├── auth.css           # Authentication styles
│   ├── dashboard.css      # Dashboard styles
│   ├── marketplace.css    # Marketplace styles
│   └── responsive.css     # Responsive breakpoints
│
├── js/
│   ├── app.js             # Main JavaScript
│   ├── auth.js            # Authentication logic
│   ├── dashboard.js       # Dashboard functionality
│   ├── marketplace.js     # Marketplace features
│   └── chat.js            # Chat functionality
│
└── images/                # (Create this folder for your images)
```

## 🚀 Getting Started

1. **Extract the Files**
   - Download and extract all files maintaining the folder structure

2. **Open in Browser**
   - Open `index.html` in your web browser
   - Or use a local server (recommended):
     ```bash
     # Using Python
     python -m http.server 8000
     
     # Using Node.js
     npx http-server
     ```

3. **Navigate the Platform**
   - Start at the homepage (`index.html`)
   - Click "Login" or "Get Started" to explore
   - Use any email/password for demo purposes

## 📄 Page Details

### 1. **Home Page** (index.html)
- Hero section with animations
- How it works section
- Popular skills showcase
- Testimonials
- Responsive navigation

### 2. **Login Page** (login.html)
- Form validation
- Password toggle
- Social login buttons
- Remember me option

### 3. **Register Page** (register.html)
- Profile image upload
- Password strength checker
- Skills input fields
- Form validation
- Terms agreement

### 4. **Dashboard** (dashboard.html)
- Statistics cards
- Recent activity feed
- Upcoming sessions
- Skills overview
- Sidebar navigation

### 5. **Marketplace** (marketplace.html)
- User skill cards
- Search functionality
- Category filters
- Sort options
- Detailed user modals

### 6. **Profile Page** (profile.html)
- Profile editing
- Skills management
- Reviews & ratings
- Profile statistics

### 7. **Requests Page** (requests.html)
- Pending requests
- Accepted exchanges
- Rejected requests
- Tab navigation
- Accept/reject actions

### 8. **Chat Page** (chat.html)
- Messenger-style UI
- Real-time messaging
- Chat list sidebar
- Online indicators
- Message input

### 9. **Sessions Page** (sessions.html)
- Session calendar
- Upcoming sessions
- Completed sessions
- Session details
- Meeting links

### 10. **Admin Dashboard** (admin.html)
- User management
- Analytics
- Popular skills chart
- Activity monitoring
- Data tables

## 🎨 Design Features

### Color Scheme
- **Primary**: #6C63FF (Purple)
- **Secondary**: #00C2FF (Cyan)
- **Dark Background**: #0F172A
- **Card Background**: #1E293B
- **Text**: White/Light Gray

### UI Components
- Glassmorphism cards
- Gradient buttons
- Animated floating shapes
- Smooth transitions
- Modern shadows
- Rounded corners

### Responsive Breakpoints
- Desktop: 1024px+
- Tablet: 768px - 1023px
- Mobile: 320px - 767px

## ⚙️ Customization

### Changing Colors
Edit CSS variables in `css/style.css`:
```css
:root {
    --primary-color: #6C63FF;
    --secondary-color: #00C2FF;
    /* Add your custom colors */
}
```

### Adding Images
1. Create an `images/` folder in the frontend directory
2. Add your images
3. Reference them in HTML:
   ```html
   <img src="images/your-image.jpg" alt="Description">
   ```

### Modifying JavaScript
- `app.js` - General functionality
- `auth.js` - Login/Registration logic
- `dashboard.js` - Dashboard features
- `marketplace.js` - Marketplace data and filters
- `chat.js` - Messaging functionality

## 🌓 Dark/Light Mode

Toggle between themes using the moon/sun icon button. The theme preference is saved in localStorage.

## 📱 Mobile Features

- Hamburger menu navigation
- Touch-friendly buttons
- Swipeable content
- Optimized layouts
- Responsive images

## 🔧 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 Notes for Development

- All forms have client-side validation
- Demo login accepts any credentials
- Marketplace data is hardcoded (see `marketplace.js`)
- Chat messages are simulated
- No backend required for demo purposes

## 🎓 For Your DBMS Project

This frontend is perfect for:
1. University final year projects
2. DBMS practical demonstrations
3. Web development portfolios
4. UI/UX showcases

### Connecting to Backend
When ready to connect a backend:
1. Replace hardcoded data with API calls
2. Implement actual authentication
3. Connect to your database
4. Add real-time features (WebSocket for chat)

## 📚 Technologies Used

- **HTML5**: Semantic markup
- **CSS3**: Modern styling, animations
- **JavaScript (ES6+)**: Interactive functionality
- **No external libraries**: Pure vanilla code

## 🤝 Credits

Created for **Skill Binimoy** - A Skill Exchange Platform
Perfect for university DBMS final projects

## 📄 License

Free to use for educational purposes

---

**Need Help?**
All code is well-commented. Check the JavaScript files for functionality details.

**Enjoy building your skill exchange platform! 🚀**
