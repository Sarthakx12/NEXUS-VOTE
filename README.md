# NexusVote - Decentralized Voting Protocol

A modern, blockchain-themed voting application built with React, Firebase, and Tailwind CSS. Features a stunning dark crypto aesthetic with 3D UI effects, real-time voting, and a simulated blockchain ledger.

![NexusVote](https://img.shields.io/badge/React-19.2.0-blue) ![Firebase](https://img.shields.io/badge/Firebase-Latest-orange) ![Tailwind](https://img.shields.io/badge/Tailwind-3.0-38bdf8)

## ✨ Features

- 🔐 **Multiple Authentication Methods**
  - Email/Password authentication
  - Anonymous (Guest) authentication
- 🗳️ **Real-Time Voting System**

  - Live vote counting with progress bars
  - One vote per user (prevents double voting)
  - Instant results updates

- ⛓️ **Blockchain Simulation**

  - Live transaction ledger
  - Unique transaction hashes for each vote
  - Real-time blockchain updates

- 🎨 **Stunning 3D UI**

  - Dark crypto/blockchain theme
  - Glassmorphism effects
  - 3D animations and transforms
  - Neon cyan and purple color scheme

- 📱 **Responsive Design**
  - Mobile-friendly interface
  - Works on all screen sizes

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase account

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Sarthakx12/NEXUS-VOTE.git
   cd NEXUS-VOTE/nexus-vote
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up Firebase**

   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create a new project or select an existing one
   - Enable **Email/Password** authentication:
     - Navigate to Authentication → Sign-in method
     - Enable "Email/Password"
   - Enable **Anonymous** authentication (optional):
     - In Sign-in method, enable "Anonymous"
   - Create a **Firestore Database**:
     - Navigate to Firestore Database
     - Create database (start in test mode for development)
   - Get your Firebase configuration:
     - Go to Project Settings → General
     - Scroll to "Your apps" section
     - Click on the web app icon (</>) or create a new web app
     - Copy the Firebase configuration object

4. **Configure environment variables**

   ```bash
   # Copy the example environment file
   cp .env.example .env

   # Edit .env and add your Firebase credentials
   # The file should look like this:
   ```

   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

## 📁 Project Structure

```
nexus-vote/
├── src/
│   ├── App.jsx          # Main application component
│   ├── main.jsx         # Application entry point
│   ├── index.css        # Global styles and animations
│   └── assets/          # Static assets
├── public/              # Public assets
├── .env                 # Environment variables (not in git)
├── .env.example         # Environment variables template
├── tailwind.config.js   # Tailwind CSS configuration
└── vite.config.js       # Vite configuration
```

## 🔧 Configuration

### Firebase Setup

1. **Authentication**

   - Enable Email/Password in Firebase Console
   - Enable Anonymous (for guest mode)

2. **Firestore Database**

   - Create a Firestore database
   - The app will automatically create the `votes` collection
   - For production, set up proper security rules

3. **Firestore Index (Optional)**
   - If you see an index error, Firebase will provide a link to create it
   - Or manually create: Collection: `votes`, Field: `timestamp`, Order: Descending

## 🎨 Customization

### Colors

Edit `tailwind.config.js` to customize the color scheme:

```js
colors: {
  crypto: {
    main: '#0a0f1e',      // Deep Space Blue
    accent: '#00f0ff',    // Neon Cyan
    purple: '#7000ff',    // Deep Purple
  }
}
```

### Candidates

Edit the `CANDIDATES` array in `src/App.jsx`:

```js
const CANDIDATES = [
  { id: "candidate1", name: "Alex Chen", color: "from-cyan-400 to-cyan-600" },
  // Add more candidates...
];
```

## 📦 Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## 🚢 Deployment

### Vercel (Recommended)

1. **Push your code to GitHub**

   ```bash
   git push origin main
   ```

2. **Import your repository on Vercel**

   - Go to [Vercel](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite settings

3. **Configure Environment Variables**

   - In Vercel project settings, go to "Environment Variables"
   - Add all variables from your `.env` file:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
     - `VITE_FIREBASE_MEASUREMENT_ID`
   - Make sure to add them for **Production**, **Preview**, and **Development** environments

4. **Deploy Settings**

   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `dist` (auto-detected)
   - Install Command: `npm install` (auto-detected)
   - Framework Preset: Vite (auto-detected)

5. **Deploy!**
   - Click "Deploy"
   - Vercel will build and deploy your app
   - Your app will be live at `your-project.vercel.app`

**Note:** The `vercel.json` file is already configured for proper SPA routing.

### Netlify

1. Push your code to GitHub
2. Import your repository on [Netlify](https://netlify.com)
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in Netlify dashboard

## 🛠️ Tech Stack

- **React 19.2.0** - UI library
- **Vite** - Build tool and dev server
- **Firebase** - Authentication and Firestore
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **3D CSS Transforms** - Animations

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 👤 Author

**Sarthakx12**

- GitHub: [@Sarthakx12](https://github.com/Sarthakx12)

## 🙏 Acknowledgments

- Firebase for backend services
- Tailwind CSS for styling framework
- Lucide for beautiful icons

---

Made with ❤️ using React and Firebase
