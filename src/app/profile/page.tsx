'use client';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface StylistData {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  city: string;
  skills: string;
  experience: string;
  profilePicBase64?: string;
  certificateNames?: string[];
  status?: string;
}

export default function ProfilePage() {
  const [user] = useAuthState(auth);
  const [stylistData, setStylistData] = useState<StylistData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [certMessage, setCertMessage] = useState('');
  const [formData, setFormData] = useState<StylistData>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    city: '',
    skills: '',
    experience: ''
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

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
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
      <div className="profile-card">
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
            zIndex: 0
          }} />
        )}
        
        <div className="profile-header" style={{position: 'relative', zIndex: 9999, paddingTop: stylistData.profilePicBase64 ? '60px' : '0'}}>
          <div>
            <h1 className="profile-title">My Profile</h1>
            <span style={{
              display: 'inline-block',
              padding: '5px 15px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: '600',
              marginTop: '10px',
              backgroundColor: stylistData.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 
                             stylistData.status === 'rejected' ? 'rgba(239, 68, 68, 0.3)' : 
                             'rgba(251, 146, 60, 0.3)',
              color: stylistData.status === 'active' ? 'rgb(134, 239, 172)' : 
                     stylistData.status === 'rejected' ? 'rgb(252, 165, 165)' : 
                     'rgb(253, 186, 116)',
              border: `1px solid ${stylistData.status === 'active' ? 'rgba(34, 197, 94, 0.5)' : 
                                   stylistData.status === 'rejected' ? 'rgba(239, 68, 68, 0.5)' : 
                                   'rgba(251, 146, 60, 0.5)'}`
            }}>
              {stylistData.status || 'pending'}
            </span>
          </div>
          <div style={{display: 'flex', gap: '15px'}}>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="glass-button"
              style={{width: 'auto', margin: '0'}}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
            <button
              onClick={handleLogout}
              className="glass-button"
              style={{width: 'auto', margin: '0', backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.5)'}}
            >
              Logout
            </button>
          </div>
        </div>

            {stylistData.profilePicBase64 && (
              <div style={{display: 'flex', justifyContent: 'center', marginBottom: '30px', marginTop: '-60px', position: 'relative', zIndex: 15}}>
                <img
                  src={stylistData.profilePicBase64}
                  alt="Profile"
                  className="profile-image"
                  style={{border: '4px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'}}
                />
              </div>
            )}

            {isEditing ? (
              <form onSubmit={handleUpdate}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={formData.fullName}
                  onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="glass-input"
                />
                <input
                  type="text"
                  placeholder="City, State"
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  className="glass-input"
                />
                <textarea
                  placeholder="Skills & Specializations"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  className="textarea"
                  rows={3}
                />
                <input
                  type="text"
                  placeholder="Experience"
                  value={formData.experience}
                  onChange={(e) => setFormData({...formData, experience: e.target.value})}
                  className="glass-input"
                />
                <button
                  type="submit"
                  className="glass-button"
                  style={{backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 0.5)'}}
                >
                  Save Changes
                </button>
              </form>
            ) : (
              <div>
                <div className="info-section">
                  <h3 className="info-label">Full Name</h3>
                  <p className="info-value">{stylistData.fullName}</p>
                </div>
                <div className="info-section">
                  <h3 className="info-label">Email</h3>
                  <p className="info-value">{stylistData.email}</p>
                </div>
                <div className="info-section">
                  <h3 className="info-label">Phone</h3>
                  <p className="info-value">{stylistData.phone}</p>
                </div>
                <div className="info-section">
                  <h3 className="info-label">Location</h3>
                  <p className="info-value">{stylistData.location}, {stylistData.city}</p>
                </div>
                <div className="info-section">
                  <h3 className="info-label">Skills & Specializations</h3>
                  <p className="info-value">{stylistData.skills}</p>
                </div>
                <div className="info-section">
                  <h3 className="info-label">Experience</h3>
                  <p className="info-value">{stylistData.experience}</p>
                </div>
                {stylistData.certificateNames && stylistData.certificateNames.length > 0 && (
                  <div className="info-section">
                    <h3 className="info-label">Certificates & Documents</h3>
                    <div style={{display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px'}}>
                      {stylistData.certificateNames.map((certName, index) => (
                        <div 
                          key={index} 
                          onClick={() => {
                            setCertMessage('Contact admin for full document access');
                            setTimeout(() => setCertMessage(''), 3000);
                          }}
                          style={{
                            background: 'rgba(255, 255, 255, 0.1)',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            fontSize: '14px',
                            color: 'rgba(255, 255, 255, 0.8)',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                          }}
                          onMouseEnter={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.background = 'rgba(255, 255, 255, 0.2)';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.target as HTMLElement;
                            target.style.background = 'rgba(255, 255, 255, 0.1)';
                          }}
                        >
                          📄 {certName}
                        </div>
                      ))}
                    </div>
                    {certMessage && (
                      <div className="message success-message" style={{marginTop: '15px'}}>
                        {certMessage}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {message && (
              <div className={`message ${isError ? 'error-message' : 'success-message'}`}>
                {message}
              </div>
            )}
      </div>
    </div>
  );
}