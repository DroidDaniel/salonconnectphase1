'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    skills: '',
    experience: '',
    password: '',
    gender: ''
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [certificates, setCertificates] = useState<File[]>([]);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        canvas.width = 200;
        canvas.height = 200;
        ctx.drawImage(img, 0, 0, 200, 200);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      let profilePicBase64 = '';
      let certificateNames: string[] = [];

      if (profilePic) {
        profilePicBase64 = await compressImage(profilePic);
      }

      if (certificates.length > 0) {
        certificateNames = certificates.map(cert => cert.name);
      }

      await setDoc(doc(db, 'stylists', user.uid), {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        location: formData.location,
        city: formData.city,
        skills: formData.skills,
        experience: formData.experience,
        gender: formData.gender,
        profilePicBase64,
        certificateNames,
        status: 'active',
        createdAt: new Date()
      });

      setMessage('Registration successful! Redirecting to profile...');
      setIsError(false);
      
      setTimeout(() => {
        router.push('/profile');
      }, 1500);
    } catch (error: any) {
      setMessage(error.message || 'Registration failed. Please try again.');
      setIsError(true);
    }
  };

  return (
    <div className="register-container">
      <button 
        onClick={() => router.push('/')}
        className="back-home"
        title="Back to Home"
      >
        ←
      </button>
      <div style={{maxWidth: '600px', margin: '0 auto', padding: '0 20px'}}>
        <h1 className="glass-title">Create your professional stylist account</h1>
        <form onSubmit={handleSubmit} className="glass-form">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
            className="file-input"
          />
          
          <input
            type="text"
            required
            placeholder="Full Name *"
            value={formData.fullName}
            onChange={(e) => setFormData({...formData, fullName: e.target.value})}
            className="glass-input"
          />

          <div style={{marginBottom: '20px'}}>
            <label style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '16px', marginBottom: '10px', display: 'block'}}>Gender *</label>
            <div style={{display: 'flex', gap: '20px'}}>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer'}}>
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  required
                  style={{accentColor: 'rgba(255, 255, 255, 0.8)'}}
                />
                Male
              </label>
              <label style={{display: 'flex', alignItems: 'center', gap: '8px', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer'}}>
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  required
                  style={{accentColor: 'rgba(255, 255, 255, 0.8)'}}
                />
                Female
              </label>
            </div>
          </div>

          <input
            type="email"
            required
            placeholder="Email Address *"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="glass-input"
          />

          <input
            type="tel"
            required
            placeholder="Phone Number *"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="glass-input"
          />

          <input
            type="text"
            required
            placeholder="Location (Street, Area) *"
            value={formData.location}
            onChange={(e) => setFormData({...formData, location: e.target.value})}
            className="glass-input"
          />

          <input
            type="text"
            required
            placeholder="City, State *"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="glass-input"
          />

          <select
            required
            value={formData.skills}
            onChange={(e) => setFormData({...formData, skills: e.target.value})}
            className="glass-input"
            style={{color: formData.skills ? '#000000' : '#999999'}}
          >
            <option value="" disabled>Select Category *</option>
            <option value="Hair dressing">Hair dressing</option>
            <option value="Beautician">Beautician</option>
            <option value="Body therapist">Body therapist</option>
            <option value="Nail artist">Nail artist</option>
            <option value="Hair colorist">Hair colorist</option>
            <option value="Make up artist">Make up artist</option>
          </select>

          <input
            type="text"
            required
            placeholder="Years of Experience (e.g., 5 years) *"
            value={formData.experience}
            onChange={(e) => setFormData({...formData, experience: e.target.value})}
            className="glass-input"
          />

          <input
            type="file"
            multiple
            accept=".pdf,.jpg,.jpeg,.png"
            onChange={(e) => setCertificates(Array.from(e.target.files || []))}
            className="file-input"
          />

          <input
            type="password"
            required
            placeholder="Password *"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            className="glass-input"
          />

          <button type="submit" className="glass-button">
            Create Account
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