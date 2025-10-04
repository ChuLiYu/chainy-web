# CHAINY Frontend

Modern React frontend for the CHAINY URL shortener service.

[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5-purple)](https://vitejs.dev/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3-cyan)](https://tailwindcss.com/)

## 🎨 Features

- ✅ **Modern React UI** with gradient design and animations
- ✅ **Responsive Design** optimized for all device sizes
- ✅ **Real-time Pinning** functionality for link management
- ✅ **Multi-language Support** (English/Chinese)
- ✅ **Google OAuth Integration** with JWT authentication
- ✅ **Link Management Dashboard** with analytics
- ✅ **Custom Short Codes** creation
- ✅ **Note/Title Support** for better organization

## 🛠️ Development

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **npm or yarn** - Package manager

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/chainy.git
cd chainy-web

# Install dependencies
npm install

# Start development server
npm run dev
# Open http://localhost:5173
```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run lint:fix     # Fix ESLint issues
```

## 📦 Build

```bash
npm run build
```

## 🌐 Environment Variables

Create `.env.local` file in the project root:

```env
# API Configuration
VITE_CHAINY_API=https://your-api-endpoint.com

# Google OAuth Configuration
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_GOOGLE_REDIRECT_URI=http://localhost:5173

# Optional: App Configuration
VITE_APP_NAME=Chainy
VITE_APP_VERSION=1.0.0
```

## 🎯 Key Components

### Core Components

- **App.jsx** - Main application component with routing and state management
- **utils/auth.js** - Authentication utilities and JWT token management
- **utils/googleAuth.js** - Google OAuth integration
- **styles.css** - Global styles, animations, and responsive design

### Component Structure

```
src/
├── App.jsx              # Main application
├── styles.css           # Global styles
├── utils/
│   ├── auth.js          # Authentication utilities
│   └── googleAuth.js    # Google OAuth integration
└── components/          # Reusable components (if any)
```

## 📱 Responsive Design

The application is fully responsive with breakpoints optimized for all devices:

- **Large screens (1920px+)**: 7rem title, full layout
- **Desktop (1200px+)**: 6rem title, standard layout
- **Tablet (768px+)**: 4rem title, compact layout
- **Mobile (320px+)**: 3rem title, mobile-optimized layout

### Design Features

- **Gradient backgrounds** with smooth animations
- **Glass morphism** effects for modern UI
- **Touch-friendly** buttons and interactions
- **Smooth transitions** and hover effects

## 🚀 Deployment

### Static Hosting Options

The frontend can be deployed to any static hosting service:

- **AWS S3 + CloudFront** (Recommended)
- **Vercel** (Zero-config deployment)
- **Netlify** (Git-based deployment)
- **GitHub Pages** (Free hosting)

### Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

### AWS S3 + CloudFront Deployment

```bash
# Build the application
npm run build

# Deploy to S3
aws s3 sync dist/ s3://your-bucket-name --delete

# Invalidate CloudFront cache
aws cloudfront create-invalidation \
  --distribution-id YOUR_DISTRIBUTION_ID \
  --paths "/*"
```

## 🤝 Contributing

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow the existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. Check the [troubleshooting guides](../docs/)
2. Review existing [GitHub issues](https://github.com/your-username/chainy/issues)
3. Create a new issue with detailed information

## 🔗 Links

- **Live Application**: [https://chainy.luichu.dev](https://chainy.luichu.dev)
- **Backend Repository**: [chainy](../chainy/)
- **Documentation**: [docs](../docs/)
