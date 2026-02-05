# YouTube Clone with Tweet Feature

A full-stack YouTube-like application built with Node.js, Express, MongoDB, and React. This project includes a unique tweet feature that allows users to share short messages alongside video content.

## 🚀 Features

### Video Features
- **Video Upload**: Upload videos with thumbnails
- **Video Streaming**: Watch videos with custom player
- **Video Management**: Edit, delete, and manage your videos
- **Search & Discovery**: Search videos by title and description
- **Categories**: Browse videos by categories
- **Likes & Views**: Like videos and track view counts
- **Comments**: Comment on videos
- **Playlists**: Create and manage video playlists
- **Subscriptions**: Subscribe to channels

### Tweet Features
- **Create Tweets**: Share short messages (280 characters)
- **Like Tweets**: Like and unlike tweets
- **Edit/Delete**: Manage your own tweets
- **User Timeline**: View tweets from specific users

### User Features
- **Authentication**: Secure user registration and login
- **Profile Management**: Custom avatars and cover images
- **Channel Pages**: Personal channel pages
- **Watch History**: Track watched videos
- **Dashboard**: Channel analytics and stats

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **Cloudinary** - Media storage
- **Multer** - File upload handling
- **bcryptjs** - Password hashing

### Frontend
- **React** - UI library
- **Redux Toolkit** - State management
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Axios** - HTTP client
- **Lucide React** - Icons
- **Vite** - Build tool

## 📁 Project Structure

```
chai-backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middlewares/    # Custom middlewares
│   ├── utils/          # Utility functions
│   └── db/            # Database connection
├── frontend/
│   ├── src/
│   │   ├── components/ # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── store/      # Redux store
│   │   └── utils/      # Utility functions
│   └── public/         # Static assets
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Cloudinary account (for media storage)

### Backend Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   MONGODB_URI=mongodb://localhost:27017/youtube-clone
   CORS_ORIGIN=http://localhost:3000
   
   # JWT Secrets
   ACCESS_TOKEN_SECRET=your_access_token_secret
   REFRESH_TOKEN_SECRET=your_refresh_token_secret
   ACCESS_TOKEN_EXPIRY=15m
   REFRESH_TOKEN_EXPIRY=7d
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

3. **Start the server**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 📚 API Endpoints

### Authentication
- `POST /api/v1/users/register` - User registration
- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/logout` - User logout
- `GET /api/v1/users/current-user` - Get current user

### Videos
- `GET /api/v1/videos` - Get all videos
- `POST /api/v1/videos/publish` - Upload video
- `GET /api/v1/videos/:videoId` - Get video by ID
- `PATCH /api/v1/videos/:videoId` - Update video
- `DELETE /api/v1/videos/:videoId` - Delete video

### Tweets
- `POST /api/v1/tweets` - Create tweet
- `GET /api/v1/tweets/user/:username` - Get user tweets
- `PATCH /api/v1/tweets/:tweetId` - Update tweet
- `DELETE /api/v1/tweets/:tweetId` - Delete tweet

### Likes
- `POST /api/v1/likes/toggle/v/:videoId` - Toggle video like
- `POST /api/v1/likes/toggle/t/:tweetId` - Toggle tweet like
- `GET /api/v1/likes/liked-videos` - Get liked videos

### Comments
- `GET /api/v1/comments/:videoId` - Get video comments
- `POST /api/v1/comments/:videoId` - Add comment
- `PUT /api/v1/comments/:commentId` - Update comment
- `DELETE /api/v1/comments/:commentId` - Delete comment

### Playlists
- `POST /api/v1/playlists` - Create playlist
- `GET /api/v1/playlists/user/:userId` - Get user playlists
- `GET /api/v1/playlists/:playlistId` - Get playlist by ID
- `PATCH /api/v1/playlists/:playlistId` - Update playlist
- `DELETE /api/v1/playlists/:playlistId` - Delete playlist

### Subscriptions
- `POST /api/v1/subscriptions/toggle/:channelId` - Toggle subscription
- `GET /api/v1/subscriptions/channel/:channelId` - Get channel subscribers
- `GET /api/v1/subscriptions/subscriber/:subscriberId` - Get subscribed channels

## 🎨 Frontend Features

### Pages
- **Home** - Video feed with categories
- **Video Player** - Full video player with comments
- **Channel** - User channel pages
- **Upload** - Video upload interface
- **Tweets** - Tweet creation and viewing
- **Search** - Video search functionality
- **Playlists** - Playlist management
- **Liked Videos** - User's liked videos
- **History** - Watch history

### Components
- **Layout** - Main layout with sidebar and header
- **Video Card** - Video thumbnail component
- **Tweet Card** - Tweet display component
- **User Profile** - User information display

## 🔧 Development

### Backend Development
```bash
# Start development server with nodemon
npm run dev

# The server will start on http://localhost:8000
```

### Frontend Development
```bash
cd frontend
npm run dev

# The app will start on http://localhost:5173
```

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or use a MongoDB hosting service
2. Configure Cloudinary for media storage
3. Set up environment variables on your hosting platform
4. Deploy to platforms like Heroku, Railway, or DigitalOcean

### Frontend Deployment
1. Build the production version:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy to platforms like Vercel, Netlify, or AWS S3

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- YouTube for inspiration
- The open-source community for amazing tools and libraries
- All contributors who helped make this project possible

## 📞 Support

If you have any questions or need help, please open an issue on GitHub or contact the development team.

---

**Happy Coding! 🎉**