'use client';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      setMessage('Login successful! Redirecting...');
      setIsError(false);
      
      setTimeout(() => {
        if (email === 'admin@salon.com') {
          router.push('/dashboard');
        } else {
          router.push('/profile');
        }
      }, 1000);
    } catch (error: any) {
      setMessage(error.message || 'Login failed. Please try again.');
      setIsError(true);
    }
  };

  return (
    <div className="glass-container">
      <div className="glass-card">
        <h2 className="glass-title">Salon Connect</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            required
            className="glass-input"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            className="glass-input"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button 
            type="submit" 
            className="glass-button"
            style={{backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 0.5)'}}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => router.push('/register')}
            className="glass-button"
            style={{backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: 'rgba(59, 130, 246, 0.5)'}}
          >
            Register as Stylist
          </button>
          {message && (
            <div className={`message ${isError ? 'error-message' : 'success-message'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}