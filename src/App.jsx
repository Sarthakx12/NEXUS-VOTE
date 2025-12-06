import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { getFirestore, collection, query, orderBy, onSnapshot, doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Wallet, Vote, TrendingUp, Clock, Hash, Mail, Lock, User, LogIn, UserPlus, LogOut } from 'lucide-react';

// ============================================
// FIREBASE CONFIGURATION
// ============================================
// Load configuration from environment variables
// Create a .env file in the root directory with your Firebase credentials
// See .env.example for the required variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate Firebase config
const isFirebaseConfigValid = () => {
  const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missing = required.filter(key => !firebaseConfig[key] || 
    firebaseConfig[key] === undefined || 
    firebaseConfig[key].includes('your_') || 
    firebaseConfig[key].includes('YOUR_'));
  if (missing.length > 0) {
    console.error('❌ [FIREBASE] Invalid Firebase configuration! Missing or placeholder values for:', missing);
    console.error('❌ [FIREBASE] Please create a .env file in the root directory with your Firebase credentials');
    console.error('❌ [FIREBASE] See .env.example for the required variables');
    return false;
  }
  return true;
};

// Initialize Firebase
console.log('🔥 [FIREBASE] Initializing Firebase...');
console.log('🔥 [FIREBASE] Config check:', isFirebaseConfigValid() ? '✅ Valid' : '❌ Invalid');

let app, auth, db;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ [FIREBASE] Firebase app initialized:', app.name);
  auth = getAuth(app);
  console.log('✅ [FIREBASE] Auth initialized');
  db = getFirestore(app);
  console.log('✅ [FIREBASE] Firestore initialized');
} catch (error) {
  console.error('❌ [FIREBASE] Initialization error:', error);
  console.error('❌ [FIREBASE] Error details:', error.message);
}

// Candidate data
const CANDIDATES = [
  { id: 'candidate1', name: 'Alex Chen', color: 'from-cyan-400 to-cyan-600' },
  { id: 'candidate2', name: 'Sarah Martinez', color: 'from-purple-400 to-purple-600' },
  { id: 'candidate3', name: 'Jordan Kim', color: 'from-blue-400 to-blue-600' }
];

function App() {
  console.log('🚀 [APP] Component rendering...');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasVoted, setHasVoted] = useState(false);
  const [votes, setVotes] = useState({ candidate1: 0, candidate2: 0, candidate3: 0 });
  const [transactions, setTransactions] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [authView, setAuthView] = useState('landing'); // 'landing', 'signup', 'login'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  
  console.log('📊 [APP] Current state:', { user, loading, hasVoted, votes, totalVotes, transactionsCount: transactions.length, authView });

  // Check authentication state
  useEffect(() => {
    if (!auth) {
      console.error('❌ [AUTH] Auth not initialized, cannot set up listener');
      setLoading(false);
      return;
    }
    console.log('🔐 [AUTH] Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log('🔐 [AUTH] Auth state changed:', currentUser ? `User: ${currentUser.uid}` : 'No user');
      if (currentUser) {
        console.log('✅ [AUTH] User authenticated:', currentUser.uid);
        setUser(currentUser);
        // Check if user has already voted
        console.log('🗳️ [VOTE] Checking if user has voted...');
        if (db) {
          try {
            const voteDoc = await getDoc(doc(db, 'votes', currentUser.uid));
            console.log('🗳️ [VOTE] Vote document check result:', voteDoc.exists() ? 'User has voted' : 'User has not voted');
            if (voteDoc.exists()) {
              console.log('🗳️ [VOTE] Vote data:', voteDoc.data());
              setHasVoted(true);
            }
          } catch (error) {
            console.error('❌ [VOTE] Error checking vote status:', error);
          }
        } else {
          console.warn('⚠️ [VOTE] Firestore not initialized, cannot check vote status');
        }
      } else {
        console.log('👤 [AUTH] No user authenticated');
      }
      console.log('⏳ [LOADING] Setting loading to false');
      setLoading(false);
    });
    return () => {
      console.log('🔐 [AUTH] Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  // Real-time votes listener
  useEffect(() => {
    if (!db) {
      console.error('❌ [FIRESTORE] Firestore not initialized, cannot set up listener');
      return;
    }
    console.log('📡 [FIRESTORE] Setting up real-time votes listener...');
    const votesRef = collection(db, 'votes');
    console.log('📡 [FIRESTORE] Votes collection reference:', votesRef);
    
    // Try with orderBy first, fallback to simple query if index doesn't exist
    let q;
    try {
      q = query(votesRef, orderBy('timestamp', 'desc'));
      console.log('📡 [FIRESTORE] Query created with orderBy:', q);
    } catch (error) {
      console.warn('⚠️ [FIRESTORE] Could not create ordered query, using simple query:', error);
      q = query(votesRef);
      console.log('📡 [FIRESTORE] Using simple query without orderBy');
    }
    
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        console.log('📡 [FIRESTORE] Snapshot received, docs count:', snapshot.size);
        const newVotes = { candidate1: 0, candidate2: 0, candidate3: 0 };
        const newTransactions = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          console.log('📄 [FIRESTORE] Processing document:', doc.id, data);
          if (data.candidateId && Object.prototype.hasOwnProperty.call(newVotes, data.candidateId)) {
            newVotes[data.candidateId]++;
            console.log(`✅ [VOTES] Incremented vote for ${data.candidateId}`);
          }
          if (data.timestamp && data.transactionHash) {
            newTransactions.push({
              id: doc.id,
              candidateId: data.candidateId,
              candidateName: CANDIDATES.find(c => c.id === data.candidateId)?.name || 'Unknown',
              transactionHash: data.transactionHash,
              timestamp: data.timestamp
            });
            console.log('📝 [TRANSACTIONS] Added transaction:', data.transactionHash);
          }
        });
        
        // Sort transactions by timestamp if available (fallback if orderBy failed)
        newTransactions.sort((a, b) => {
          const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp?.getTime ? a.timestamp.getTime() : 0);
          const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp?.getTime ? b.timestamp.getTime() : 0);
          return timeB - timeA; // Descending order
        });
        
        console.log('📊 [VOTES] New vote counts:', newVotes);
        console.log('📝 [TRANSACTIONS] New transactions count:', newTransactions.length);
        setVotes(newVotes);
        setTransactions(newTransactions);
        const total = Object.values(newVotes).reduce((a, b) => a + b, 0);
        console.log('📊 [VOTES] Total votes:', total);
        setTotalVotes(total);
      },
      (error) => {
        console.error('❌ [FIRESTORE] Snapshot error:', error);
        console.error('❌ [FIRESTORE] Error code:', error.code);
        console.error('❌ [FIRESTORE] Error message:', error.message);
        
        // If error is about missing index, try without orderBy
        if (error.code === 'failed-precondition' || error.message?.includes('index')) {
          console.warn('⚠️ [FIRESTORE] Index error detected, retrying without orderBy...');
          const simpleQuery = query(votesRef);
          const retryUnsubscribe = onSnapshot(
            simpleQuery,
            (snapshot) => {
              console.log('📡 [FIRESTORE] Retry snapshot received, docs count:', snapshot.size);
              const newVotes = { candidate1: 0, candidate2: 0, candidate3: 0 };
              const newTransactions = [];
              
              snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.candidateId && Object.prototype.hasOwnProperty.call(newVotes, data.candidateId)) {
                  newVotes[data.candidateId]++;
                }
                if (data.timestamp && data.transactionHash) {
                  newTransactions.push({
                    id: doc.id,
                    candidateId: data.candidateId,
                    candidateName: CANDIDATES.find(c => c.id === data.candidateId)?.name || 'Unknown',
                    transactionHash: data.transactionHash,
                    timestamp: data.timestamp
                  });
                }
              });
              
              newTransactions.sort((a, b) => {
                const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.timestamp?.getTime ? a.timestamp.getTime() : 0);
                const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.timestamp?.getTime ? b.timestamp.getTime() : 0);
                return timeB - timeA;
              });
              
              setVotes(newVotes);
              setTransactions(newTransactions);
              setTotalVotes(Object.values(newVotes).reduce((a, b) => a + b, 0));
            },
            (retryError) => {
              console.error('❌ [FIRESTORE] Retry also failed:', retryError);
            }
          );
          return () => retryUnsubscribe();
        }
      }
    );

    return () => {
      console.log('📡 [FIRESTORE] Cleaning up votes listener');
      unsubscribe();
    };
  }, []);

  // Sign up with email and password
  const handleSignUp = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    
    if (password !== confirmPassword) {
      setAuthError('Passwords do not match');
      setAuthLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters');
      setAuthLoading(false);
      return;
    }
    
    try {
      console.log('📝 [SIGNUP] Attempting to create account...');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ [SIGNUP] Account created successfully:', userCredential.user.uid);
      // User will be automatically signed in, auth state listener will handle the rest
    } catch (error) {
      console.error('❌ [SIGNUP] Error creating account:', error);
      console.error('❌ [SIGNUP] Error code:', error.code);
      console.error('❌ [SIGNUP] Error message:', error.message);
      
      let errorMessage = 'Failed to create account. ';
      switch (error.code) {
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/Password authentication is not enabled in Firebase. Please enable it in Firebase Console → Authentication → Sign-in method → Email/Password.';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered. Please sign in instead.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak.';
          break;
        default:
          errorMessage += error.message;
      }
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign in with email and password
  const handleSignIn = async (e) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    
    try {
      console.log('🔐 [SIGNIN] Attempting to sign in...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ [SIGNIN] Sign in successful:', userCredential.user.uid);
      // User will be automatically signed in, auth state listener will handle the rest
    } catch (error) {
      console.error('❌ [SIGNIN] Error signing in:', error);
      console.error('❌ [SIGNIN] Error code:', error.code);
      console.error('❌ [SIGNIN] Error message:', error.message);
      
      let errorMessage = 'Failed to sign in. ';
      switch (error.code) {
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/Password authentication is not enabled in Firebase. Please enable it in Firebase Console → Authentication → Sign-in method → Email/Password.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        default:
          errorMessage += error.message;
      }
      setAuthError(errorMessage);
    } finally {
      setAuthLoading(false);
    }
  };

  // Sign out
  const handleSignOut = async () => {
    try {
      console.log('🚪 [SIGNOUT] Signing out...');
      await signOut(auth);
      console.log('✅ [SIGNOUT] Signed out successfully');
      setAuthView('landing');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setAuthError('');
    } catch (error) {
      console.error('❌ [SIGNOUT] Error signing out:', error);
    }
  };

  // Connect wallet (Firebase Anonymous Auth)
  const connectWallet = async () => {
    console.log('🔌 [WALLET] Connect wallet button clicked');
    try {
      console.log('🔌 [WALLET] Attempting anonymous sign in...');
      const userCredential = await signInAnonymously(auth);
      console.log('✅ [WALLET] Sign in successful:', userCredential.user.uid);
    } catch (error) {
      console.error('❌ [WALLET] Error connecting wallet:', error);
      console.error('❌ [WALLET] Error code:', error.code);
      console.error('❌ [WALLET] Error message:', error.message);
      alert('Failed to connect wallet. Please try again. Check console for details.');
    }
  };

  // Generate fake transaction hash
  const generateTransactionHash = () => {
    console.log('🔐 [HASH] Generating transaction hash...');
    const chars = '0123456789abcdef';
    const hash = '0x' + Array.from({ length: 64 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    console.log('🔐 [HASH] Generated hash:', hash);
    return hash;
  };

  // Cast vote
  const castVote = async (candidateId) => {
    console.log('🗳️ [VOTE] Cast vote called for candidate:', candidateId);
    console.log('🗳️ [VOTE] Current user:', user ? user.uid : 'No user');
    console.log('🗳️ [VOTE] Has voted:', hasVoted);
    
    if (!user) {
      console.warn('⚠️ [VOTE] Cannot vote: No user authenticated');
      return;
    }
    
    if (hasVoted) {
      console.warn('⚠️ [VOTE] Cannot vote: User has already voted');
      return;
    }

    try {
      console.log('🗳️ [VOTE] Starting vote process...');
      const transactionHash = generateTransactionHash();
      const timestamp = Timestamp.now(); // Use Firestore Timestamp for better compatibility
      console.log('🗳️ [VOTE] Vote data:', { candidateId, transactionHash, timestamp, userId: user.uid });

      // Record the vote
      if (!db) {
        console.error('❌ [FIRESTORE] Firestore not initialized, cannot save vote');
        throw new Error('Firestore not initialized');
      }
      console.log('💾 [FIRESTORE] Writing vote to Firestore...');
      await setDoc(doc(db, 'votes', user.uid), {
        candidateId,
        transactionHash,
        timestamp,
        userId: user.uid
      });
      console.log('✅ [FIRESTORE] Vote written successfully');

      console.log('✅ [VOTE] Vote cast successfully, setting hasVoted to true');
      setHasVoted(true);
    } catch (error) {
      console.error('❌ [VOTE] Error casting vote:', error);
      console.error('❌ [VOTE] Error code:', error.code);
      console.error('❌ [VOTE] Error message:', error.message);
      console.error('❌ [VOTE] Full error:', JSON.stringify(error, null, 2));
      alert('Failed to cast vote. Please try again. Check console for details.');
    }
  };

  // Calculate percentage
  const getPercentage = (votes) => {
    if (totalVotes === 0) {
      console.log('📊 [PERCENTAGE] No votes yet, returning 0');
      return 0;
    }
    const percentage = ((votes / totalVotes) * 100).toFixed(1);
    console.log(`📊 [PERCENTAGE] ${votes}/${totalVotes} = ${percentage}%`);
    return percentage;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  if (loading) {
    console.log('⏳ [RENDER] Rendering loading screen');
    return (
      <div className="min-h-screen bg-crypto-main flex items-center justify-center">
        <div className="text-cyan-400 text-xl animate-pulse">Loading NexusVote...</div>
      </div>
    );
  }

  // Show error if Firebase not configured
  if (!app || !auth || !db) {
    console.error('❌ [RENDER] Firebase not properly initialized, showing error screen');
    return (
      <div className="min-h-screen bg-crypto-main text-white flex items-center justify-center p-4">
        <div className="glass-card p-8 max-w-2xl text-center">
          <h1 className="text-4xl font-bold mb-4 text-red-400">⚠️ Configuration Error</h1>
          <p className="text-xl mb-4 text-gray-300">Firebase is not properly configured.</p>
          <div className="text-left bg-gray-900 p-4 rounded-lg mb-4 font-mono text-sm">
            <p className="text-cyan-400 mb-2">Please update the Firebase configuration in <code className="text-purple-400">src/App.jsx</code>:</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-300">
              <li>Go to Firebase Console (console.firebase.google.com)</li>
              <li>Create a new project or select existing one</li>
              <li>Enable Anonymous Authentication</li>
              <li>Create a Firestore database</li>
              <li>Copy your config and paste it in App.jsx (lines 11-17)</li>
            </ol>
          </div>
          <p className="text-sm text-gray-400">Check the browser console for detailed error messages.</p>
        </div>
      </div>
    );
  }

  // Landing Page / Sign Up / Login (Not Connected)
  if (!user) {
    console.log('🏠 [RENDER] Rendering auth page, view:', authView);
    
    // Sign Up Page
    if (authView === 'signup') {
      return (
        <div className="min-h-screen bg-crypto-main text-white relative overflow-hidden flex items-center justify-center p-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 w-full max-w-md perspective-container">
            <div className="glass-card p-8 animate-fade-in float-animation">
              <div className="text-center mb-6">
                <div className="icon-3d inline-block mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-4xl font-bold pulse-glow">
                    <UserPlus className="w-10 h-10" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Create Account
                </h1>
                <p className="text-gray-400">Join the decentralized voting network</p>
              </div>

              {authError && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm animate-fade-in">
                  <div className="font-bold mb-2">⚠️ Authentication Error</div>
                  <div>{authError}</div>
                  {authError.includes('operation-not-allowed') && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                      <div className="text-xs text-red-200/80">
                        <strong>Quick Fix:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Firebase Console</a></li>
                          <li>Select your project: <code className="text-purple-300">nexus-vote-d2d19</code></li>
                          <li>Navigate to: Authentication → Sign-in method</li>
                          <li>Click on "Email/Password"</li>
                          <li>Enable it and click "Save"</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all input-3d"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all input-3d"
                    placeholder="Minimum 6 characters"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all input-3d"
                    placeholder="Re-enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-cyan-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-3d pulse-glow"
                >
                  {authLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5" />
                      Create Account
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Already have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthView('login');
                      setAuthError('');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    setAuthView('landing');
                    setAuthError('');
                  }}
                  className="w-full text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Login Page
    if (authView === 'login') {
      return (
        <div className="min-h-screen bg-crypto-main text-white relative overflow-hidden flex items-center justify-center p-4">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>

          <div className="relative z-10 w-full max-w-md perspective-container">
            <div className="glass-card p-8 animate-fade-in float-animation">
              <div className="text-center mb-6">
                <div className="icon-3d inline-block mb-4">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center text-4xl font-bold pulse-glow">
                    <LogIn className="w-10 h-10" />
                  </div>
                </div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                  Sign In
                </h1>
                <p className="text-gray-400">Access your voting account</p>
              </div>

              {authError && (
                <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm animate-fade-in">
                  <div className="font-bold mb-2">⚠️ Authentication Error</div>
                  <div>{authError}</div>
                  {authError.includes('operation-not-allowed') && (
                    <div className="mt-3 pt-3 border-t border-red-500/30">
                      <div className="text-xs text-red-200/80">
                        <strong>Quick Fix:</strong>
                        <ol className="list-decimal list-inside mt-2 space-y-1">
                          <li>Go to <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Firebase Console</a></li>
                          <li>Select your project: <code className="text-purple-300">nexus-vote-d2d19</code></li>
                          <li>Navigate to: Authentication → Sign-in method</li>
                          <li>Click on "Email/Password"</li>
                          <li>Enable it and click "Save"</li>
                        </ol>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSignIn} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Mail className="w-4 h-4 inline mr-2" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all input-3d"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Lock className="w-4 h-4 inline mr-2" />
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/50 transition-all input-3d"
                    placeholder="Enter your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-cyan-500/50 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed btn-3d pulse-glow"
                >
                  {authLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Signing In...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Don't have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthView('signup');
                      setAuthError('');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </p>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <button
                  onClick={() => {
                    setAuthView('landing');
                    setAuthError('');
                  }}
                  className="w-full text-gray-400 hover:text-white text-sm transition-colors"
                >
                  ← Back to Home
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Landing Page
    return (
      <div className="min-h-screen bg-crypto-main text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-40 right-10 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-20">
          <div className="max-w-4xl mx-auto text-center animate-fade-in">
            <div className="mb-8 animate-slide-up">
              <div className="icon-3d inline-block mb-4">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-cyan-400 via-purple-500 to-cyan-400 rounded-full flex items-center justify-center text-6xl font-bold pulse-glow rotate-3d">
                  <Hash className="w-16 h-16" />
                </div>
              </div>
              <h1 className="text-6xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-cyan-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
                NexusVote
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 mx-auto pulse-glow"></div>
            </div>

            <div className="glass-card p-8 md:p-12 mb-8 animate-slide-up animation-delay-200">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-cyan-300">
                Decentralized Voting Protocol
              </h2>
              <p className="text-lg md:text-xl text-gray-300 mb-4 leading-relaxed">
                Experience the future of democratic participation through blockchain technology.
              </p>
              <p className="text-base md:text-lg text-gray-400 mb-8">
                Every vote is recorded on an immutable ledger, ensuring transparency and trust.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <button
                  onClick={() => setAuthView('signup')}
                  className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold text-lg rounded-lg hover:from-cyan-400 hover:to-purple-500 transition-all duration-300 shadow-lg shadow-cyan-500/50 flex items-center gap-3 btn-3d pulse-glow"
                >
                  <UserPlus className="w-6 h-6 icon-3d" />
                  Sign Up
                </button>
                <button
                  onClick={() => setAuthView('login')}
                  className="px-8 py-4 bg-white/5 border-2 border-cyan-400/50 text-cyan-400 font-bold text-lg rounded-lg hover:bg-white/10 transition-all duration-300 flex items-center gap-3 btn-3d"
                >
                  <LogIn className="w-6 h-6 icon-3d" />
                  Sign In
                </button>
                <button
                  onClick={connectWallet}
                  className="px-8 py-4 bg-white/5 border-2 border-purple-400/50 text-purple-400 font-bold text-lg rounded-lg hover:bg-white/10 transition-all duration-300 shadow-lg shadow-purple-500/30 flex items-center gap-3 btn-3d"
                >
                  <Wallet className="w-6 h-6 icon-3d" />
                  Guest Mode
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up animation-delay-400 perspective-container">
              <div className="glass-card p-6 card-3d tilt-shake" style={{ animationDelay: '0s' }}>
                <div className="icon-3d mb-4">
                  <Hash className="w-10 h-10 text-cyan-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-2">Blockchain Secured</h3>
                <p className="text-gray-400 text-sm">Every vote is cryptographically verified</p>
              </div>
              <div className="glass-card p-6 card-3d tilt-shake" style={{ animationDelay: '1.3s' }}>
                <div className="icon-3d mb-4">
                  <TrendingUp className="w-10 h-10 text-purple-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-2">Real-Time Results</h3>
                <p className="text-gray-400 text-sm">Live updates as votes are cast</p>
              </div>
              <div className="glass-card p-6 card-3d tilt-shake" style={{ animationDelay: '2.6s' }}>
                <div className="icon-3d mb-4">
                  <Vote className="w-10 h-10 text-blue-400 mx-auto" />
                </div>
                <h3 className="text-xl font-bold mb-2">One Vote Per Account</h3>
                <p className="text-gray-400 text-sm">Prevents double voting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Voting Dashboard (Connected)
  console.log('📊 [RENDER] Rendering voting dashboard (user connected)');
  return (
    <div className="min-h-screen bg-crypto-main text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Voting Area */}
          <div className="flex-1">
            {/* Header */}
            <div className="glass-card p-6 mb-6 animate-fade-in card-3d">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="icon-3d">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-purple-500 rounded-full flex items-center justify-center pulse-glow">
                      <Hash className="w-8 h-8" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                      NexusVote Dashboard
                    </h1>
                    <p className="text-gray-400 mt-1">Decentralized Voting Protocol</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-gray-300">
                      {user.email ? `Signed in as ${user.email}` : 'Wallet Connected'}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="px-4 py-2 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center gap-2 text-sm"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

            {/* Voting Section */}
            <div className="glass-card p-6 mb-6 animate-slide-up card-3d">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <div className="icon-3d">
                  <Vote className="w-6 h-6 text-cyan-400" />
                </div>
                Cast Your Vote
              </h2>
              
              {hasVoted ? (
                <div className="text-center py-8">
                  <div className="inline-block p-4 bg-green-500/20 rounded-lg mb-4">
                    <Vote className="w-12 h-12 text-green-400 mx-auto" />
                  </div>
                  <p className="text-xl text-gray-300">You have already voted!</p>
                  <p className="text-sm text-gray-400 mt-2">Check the ledger below to see your transaction</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 perspective-container">
                  {CANDIDATES.map((candidate, index) => (
                    <button
                      key={candidate.id}
                      onClick={() => castVote(candidate.id)}
                      className="glass-card p-6 hover:bg-white/10 transition-all duration-300 border-2 border-transparent hover:border-cyan-400/50 card-3d float-animation"
                      style={{ animationDelay: `${index * 0.2}s` }}
                    >
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${candidate.color} mx-auto mb-4 flex items-center justify-center text-2xl font-bold pulse-glow icon-3d`}>
                        {candidate.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold mb-2">{candidate.name}</h3>
                      <div className="text-sm text-gray-400">Click to vote</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Results Section */}
            <div className="glass-card p-6 animate-slide-up animation-delay-200 card-3d">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <div className="icon-3d">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                Live Results
              </h2>
              
              <div className="space-y-6">
                {CANDIDATES.map((candidate) => {
                  const voteCount = votes[candidate.id] || 0;
                  const percentage = getPercentage(voteCount);
                  
                  return (
                    <div key={candidate.id} className="animate-fade-in">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${candidate.color} flex items-center justify-center text-lg font-bold`}>
                            {candidate.name.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-bold text-lg">{candidate.name}</h3>
                            <p className="text-sm text-gray-400">{voteCount} votes</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-cyan-400">{percentage}%</div>
                        </div>
                      </div>
                      <div className="w-full bg-gray-800 rounded-full h-4 overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${candidate.color} transition-all duration-500 ease-out`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 pt-6 border-t border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Total Votes</span>
                  <span className="text-2xl font-bold text-cyan-400">{totalVotes}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Blockchain Ledger */}
          <div className="w-full lg:w-96 perspective-container">
            <div className="glass-card p-6 sticky top-8 animate-slide-up animation-delay-400 card-3d float-animation">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <div className="icon-3d">
                  <Hash className="w-6 h-6 text-cyan-400" />
                </div>
                Live Blockchain Ledger
              </h2>
              
              <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto custom-scrollbar">
                {transactions.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No transactions yet</p>
                    <p className="text-sm mt-2">Votes will appear here in real-time</p>
                  </div>
                ) : (
                  transactions.map((tx, index) => (
                    <div
                      key={tx.id}
                      className="glass-card p-4 border-l-4 border-cyan-400 animate-fade-in card-3d"
                      style={{ animationDelay: `${index * 0.1}s` }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="w-4 h-4 text-cyan-400" />
                            <span className="text-xs text-gray-400 font-mono">
                              {tx.transactionHash.substring(0, 12)}...
                            </span>
                          </div>
                          <div className="text-sm font-bold text-cyan-300 mt-2">
                            Voted: {tx.candidateName}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(tx.timestamp)}
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-700">
                        <span className="text-xs text-gray-500 font-mono">
                          Full Hash: {tx.transactionHash}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

