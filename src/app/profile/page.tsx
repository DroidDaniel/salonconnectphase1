'use client';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface StylistData {
  fullName?: string;
  name?: string;
  email: string;
  phone: string;
  location?: string;
  address?: string;
  city: string;
  state?: string;
  country?: string;
  skills?: string;
  category?: string;
  experience?: string;
  profilePicBase64?: string;
  certificateNames?: string[];
  identityProofBase64?: string;
  status?: string;
  gender?: string;
  ownsSalon?: boolean;
}

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [stylistData, setStylistData] = useState<StylistData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [certMessage, setCertMessage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [formData, setFormData] = useState<StylistData>({
    fullName: '',
    name: '',
    email: '',
    phone: '',
    location: '',
    address: '',
    city: '',
    state: '',
    country: '',
    skills: '',
    category: '',
    experience: '',
    gender: '',
    ownsSalon: false
  });
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  useEffect(() => {
    const fetchStylistData = async () => {
      if (user) {
        const docRef = doc(db, 'stylists', user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as StylistData;
          setStylistData(data);
          setFormData(data);
        }
      }
    };
    fetchStylistData();
  }, [user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDropdown) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    if (!auth || !db) {
      setMessage('Firebase not configured. Please check your setup.');
      setIsError(true);
      return;
    }
    
    try {
      if (user) {
        await updateDoc(doc(db, 'stylists', user.uid), formData as any);
        setStylistData(formData);
        setIsEditing(false);
        setMessage('Profile updated successfully!');
        setIsError(false);
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error: any) {
      setMessage(error.message || 'Update failed. Please try again.');
      setIsError(true);
    }
  };

  if (!stylistData) return <div>Loading...</div>;

  return (
    <div className="profile-container">
      <div className="profile-card" style={{border: 'none', background: 'transparent', boxShadow: 'none', padding: '20px'}}>
        {/* Cover Image Background */}
        {stylistData.profilePicBase64 && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '200px',
            backgroundImage: `url(${stylistData.profilePicBase64})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '20px 20px 0 0',
            filter: 'blur(8px) brightness(0.3)',
            zIndex: -1
          }} />
        )}
        
        {/* Navbar Style Header */}
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '70px',
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          zIndex: 1000,
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h1 style={{color: '#FFFFFF', fontSize: '18px', fontWeight: 'bold', margin: 0}}>Salon Connect</h1>
          
          <div style={{position: 'relative'}}>
            <div 
              onClick={() => setShowDropdown(!showDropdown)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                padding: '5px'
              }}
            >
              <div style={{position: 'relative'}}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  background: stylistData.profilePicBase64 ? `url(${stylistData.profilePicBase64})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  {!stylistData.profilePicBase64 && (stylistData.fullName || stylistData.name || 'U').charAt(0).toUpperCase()}
                </div>
                {stylistData.status === 'active' && (
                  <div style={{
                    position: 'absolute',
                    bottom: '2px',
                    right: '2px',
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid rgba(0, 0, 0, 0.9)'
                  }} />
                )}
              </div>
              
              {/* <div style={{
                color: '#FFFFFF',
                fontSize: '18px',
                transform: showDropdown ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s ease'
              }}>▼</div> */}
            </div>
            
            {showDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '10px',
                background: 'rgba(0, 0, 0, 0.9)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                minWidth: '180px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
              }}>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(255, 255, 255, 0.1)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'transparent'}
                >
                  {isEditing ? '✕ Cancel Edit' : '✏️ Edit Profile'}
                </button>
                <button
                  onClick={() => {
                    handleLogout();
                    setShowDropdown(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    color: '#FFFFFF',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderRadius: '0 0 10px 10px'
                  }}
                  onMouseEnter={(e) => (e.target as HTMLButtonElement).style.background = 'rgba(239, 68, 68, 0.2)'}
                  onMouseLeave={(e) => (e.target as HTMLButtonElement).style.background = 'transparent'}
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Content with top padding */}
        <div style={{paddingTop: '90px'}}>



            {isEditing ? (
              <form onSubmit={handleUpdate}>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.fullName || formData.name || ''}
                  onChange={(e) => setFormData({...formData, name: e.target.value, fullName: e.target.value})}
                  className="glass-input"
                />
                <div style={{marginBottom: '20px'}}>
                  <label style={{color: '#FFFFFF', fontSize: '16px', marginBottom: '10px', display: 'block'}}>Gender</label>
                  <div style={{display: 'flex', gap: '20px'}}>
                    <label style={{display: 'flex', alignItems: 'center', color: '#FFFFFF', cursor: 'pointer'}}>
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === 'male'}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        style={{marginRight: '8px'}}
                      />
                      Male
                    </label>
                    <label style={{display: 'flex', alignItems: 'center', color: '#FFFFFF', cursor: 'pointer'}}>
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === 'female'}
                        onChange={(e) => setFormData({...formData, gender: e.target.value})}
                        style={{marginRight: '8px'}}
                      />
                      Female
                    </label>
                  </div>
                </div>
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="Address"
                  value={formData.location || formData.address || ''}
                  onChange={(e) => setFormData({...formData, address: e.target.value, location: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="State"
                  value={formData.state || ''}
                  onChange={(e) => setFormData({...formData, state: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.country || ''}
                  onChange={(e) => setFormData({...formData, country: e.target.value})}
                  className="glass-input"
                />
                <select
                  value={formData.skills || formData.category || ''}
                  onChange={(e) => setFormData({...formData, category: e.target.value, skills: e.target.value})}
                  className="glass-input"
                  style={{color: '#FFFFFF'}}
                >
                  <option value="" disabled>Category</option>
                  <option value="Hair dressing">Hair dressing</option>
                  <option value="Beautician">Beautician</option>
                  <option value="Body therapist">Body therapist</option>
                  <option value="Nail artist">Nail artist</option>
                  <option value="Hair colorist">Hair colorist</option>
                  <option value="Make up artist">Make up artist</option>
                </select>
                <button
                  type="submit"
                  className="glass-button"
                  style={{backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 0.5)'}}
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                textAlign: 'center',
                padding: '30px 5px',
                margin: '20px 0'
              }}>
                <div style={{fontSize: '60px', marginBottom: '20px'}}>🎉</div>
                <h2 style={{color: '#FFFFFF', fontSize: '22px', fontWeight: 'bold', marginBottom: '20px'}}>Congratulations!</h2>
                <p style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.6', textAlign: 'center'}}>
                  You've successfully registered with Salon Connect.</p>
                  <p style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.6', textAlign: 'center', marginTop: '10px'}}>
                  Get ready — your profile will soon start receiving appointments, and you'll also receive your free accessories kit as a welcome reward. 💇♀️✨
                </p>
              </div>
            )}
            {message && (
              <div className={`message ${isError ? 'error-message' : 'success-message'}`}>
                {message}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}