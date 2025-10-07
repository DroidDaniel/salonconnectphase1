'use client';
import { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    country: '',
    category: '',
    password: '',
    gender: '',
    ownsSalon: false
  });
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [identityProof, setIdentityProof] = useState<File | null>(null);
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
      let identityProofBase64 = '';

      if (profilePic) {
        profilePicBase64 = await compressImage(profilePic);
      }
      if (identityProof) {
        identityProofBase64 = await compressImage(identityProof);
      }

      await setDoc(doc(db, 'stylists', user.uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        category: formData.category,
        gender: formData.gender,
        ownsSalon: formData.ownsSalon,
        profilePicBase64,
        identityProofBase64,
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
        <h1 className="glass-title">Account Creation</h1>
        <form onSubmit={handleSubmit} className="glass-form">
          <input
            type="text"
            required
            placeholder="Name *"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="glass-input"
          />

          <div style={{marginBottom: '20px'}}>
            <label className="custom-checkbox">
              <input
                type="checkbox"
                checked={formData.ownsSalon}
                onChange={(e) => setFormData({...formData, ownsSalon: e.target.checked})}
              />
              <span className="checkmark"></span>
              <span style={{color: '#FFFFFF'}}>I'm owning a salon</span>
            </label>
          </div>

          <div style={{marginBottom: '20px'}}>
            <label className="gender-label">Gender *</label>
            <div className="gender-group">
              <label className="custom-radio">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  required
                />
                <span className="radiomark"></span>
                <span style={{color: '#FFFFFF'}}>Male</span>
              </label>
              <label className="custom-radio">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => setFormData({...formData, gender: e.target.value})}
                  required
                />
                <span className="radiomark"></span>
                <span style={{color: '#FFFFFF'}}>Female</span>
              </label>
            </div>
          </div>

          <input
            type="tel"
            required
            placeholder="Phone Number *"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="glass-input"
          />

          <input
            type="email"
            required
            placeholder="Email ID *"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            className="glass-input"
          />

          <input
            type="text"
            required
            placeholder="Current Residence Address *"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            className="glass-input"
          />

          <div style={{marginBottom: '20px'}}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfilePic(e.target.files?.[0] || null)}
              className="file-input"
              id="profile-pic"
              style={{display: 'none'}}
            />
            <label htmlFor="profile-pic" className="glass-button" style={{cursor: 'pointer', display: 'inline-block', textAlign: 'center', marginBottom: '0'}}>
              Upload Profile Photo
            </label>
            {profilePic && <div style={{color: '#FFD700', fontSize: '14px', marginTop: '5px'}}>{profilePic.name}</div>}
          </div>

          <div style={{marginBottom: '20px'}}>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setIdentityProof(e.target.files?.[0] || null)}
              className="file-input"
              id="identity-proof"
              style={{display: 'none'}}
            />
            <label htmlFor="identity-proof" className="glass-button" style={{cursor: 'pointer', display: 'inline-block', textAlign: 'center', marginBottom: '0'}}>
              Upload Identity Proof
            </label>
            {identityProof && <div style={{color: '#FFD700', fontSize: '14px', marginTop: '5px'}}>{identityProof.name}</div>}
          </div>

          <input
            type="text"
            required
            placeholder="City *"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="glass-input"
          />

          <input
            type="text"
            required
            placeholder="State *"
            value={formData.state}
            onChange={(e) => setFormData({...formData, state: e.target.value})}
            className="glass-input"
          />

          <input
            type="text"
            required
            placeholder="Country *"
            value={formData.country}
            onChange={(e) => setFormData({...formData, country: e.target.value})}
            className="glass-input"
          />

          <select
            required
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            className="glass-input"
            style={{color: formData.category ? '#FFFFFF' : '#999999'}}
          >
            <option value="" disabled>Category *</option>
            <option value="Hair dressing">Hair dressing</option>
            <option value="Beautician">Beautician</option>
            <option value="Body therapist">Body therapist</option>
            <option value="Nail artist">Nail artist</option>
            <option value="Hair colorist">Hair colorist</option>
            <option value="Make up artist">Make up artist</option>
          </select>

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