'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface Stylist {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  city: string;
  skills: string;
  experience: string;
  status: string;
  gender?: string;
  profilePicBase64?: string;
}

export default function DashboardPage() {
  const [stylists, setStylists] = useState<Stylist[]>([]);
  const [view, setView] = useState<'summary' | 'list'>('summary');
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [isEditingModal, setIsEditingModal] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<Stylist>>({});
  const [locationFilter, setLocationFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/');
  };

  const capitalizeName = (name: string) => {
    return name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'approved':
      case 'active':
        return 'bg-green-500/30 text-green-100 border border-green-400/50';
      case 'rejected':
        return 'bg-red-500/30 text-red-100 border border-red-400/50';
      case 'pending':
        return 'bg-yellow-500/30 text-yellow-100 border border-yellow-400/50';
      default:
        return 'bg-blue-500/30 text-blue-100 border border-blue-400/50';
    }
  };

  const handleStatusUpdate = async (stylistId: string, newStatus: string) => {
    try {
      const finalStatus = newStatus === 'approved' ? 'active' : newStatus;
      await updateDoc(doc(db, 'stylists', stylistId), { status: finalStatus });
      setStylists(prev => prev.map(s => s.id === stylistId ? {...s, status: finalStatus} : s));
      setSelectedStylist(prev => prev ? {...prev, status: finalStatus} : null);
      setMessage(`Stylist ${newStatus === 'approved' ? 'approved and activated' : newStatus} successfully!`);
      setIsError(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update status');
      setIsError(true);
    }
  };

  const handleDelete = async (stylistId: string) => {
    if (confirm('Are you sure you want to delete this stylist?')) {
      try {
        await deleteDoc(doc(db, 'stylists', stylistId));
        setStylists(prev => prev.filter(s => s.id !== stylistId));
        setSelectedStylist(null);
        setMessage('Stylist deleted successfully!');
        setIsError(false);
        setTimeout(() => setMessage(''), 3000);
      } catch (error) {
        setMessage('Failed to delete stylist');
        setIsError(true);
      }
    }
  };

  const handleEdit = (stylist: Stylist) => {
    setEditFormData(stylist);
    setIsEditingModal(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedStylist) return;
    try {
      await updateDoc(doc(db, 'stylists', selectedStylist.id), editFormData);
      setStylists(prev => prev.map(s => s.id === selectedStylist.id ? {...s, ...editFormData} : s));
      setSelectedStylist({...selectedStylist, ...editFormData} as Stylist);
      setIsEditingModal(false);
      setMessage('Stylist updated successfully!');
      setIsError(false);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Failed to update stylist');
      setIsError(true);
    }
  };

  const downloadStylistData = () => {
    const csvContent = [
      ['Name', 'Gender', 'Email', 'Phone', 'Location', 'Skills', 'Experience', 'Status'],
      ...realStylists.map(s => [
        s.fullName,
        s.gender || 'N/A',
        s.email,
        s.phone,
        `${s.location}, ${s.city}`,
        s.skills,
        s.experience,
        s.status
      ])
    ].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stylists-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const fetchStylists = async () => {
      const querySnapshot = await getDocs(collection(db, 'stylists'));
      const stylistsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stylist[];
      
      // Remove duplicates based on email
      const uniqueStylists = stylistsData.filter((stylist, index, self) => 
        index === self.findIndex(s => s.email === stylist.email)
      );
      
      setStylists(uniqueStylists);
    };
    fetchStylists();
  }, []);

  const realStylists = stylists.filter(s => s.email !== 'admin@salon.com');
  const filteredStylists = realStylists.filter(stylist => {
    const matchesLocation = !locationFilter || stylist.city.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesGender = !genderFilter || stylist.gender === genderFilter;
    return matchesLocation && matchesGender;
  });
  const activeStylists = realStylists.filter(s => s.status === 'active');
  const skillsCount = realStylists.reduce((acc, stylist) => {
    const skills = stylist.skills.split(',').map(s => s.trim());
    skills.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dashboard-container">
      <div style={{maxWidth: '1200px', margin: '0 auto', padding: '0 20px'}}>
        <div className="dashboard-header" style={{flexWrap: 'wrap', gap: '15px'}}>
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <div style={{display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap'}}>
            <div className="tab-buttons">
              <button
                onClick={() => setView('summary')}
                className={`tab-button ${view === 'summary' ? 'active' : ''}`}
              >
                Summary View
              </button>
              <button
                onClick={() => setView('list')}
                className={`tab-button ${view === 'list' ? 'active' : ''}`}
              >
                List View
              </button>
            </div>
            <button
              onClick={downloadStylistData}
              className="tab-button"
              style={{backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 0.5)'}}
            >
              📥 Download CSV
            </button>
            <button
              onClick={handleLogout}
              className="tab-button"
              style={{backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.5)'}}
            >
              Logout
            </button>
          </div>
        </div>

        {view === 'summary' ? (
          <div className="stats-grid">
            <div className="stat-card">
              <h3 className="stat-title">Total Stylists</h3>
              <p className="stat-value">{realStylists.length}</p>
            </div>
            <div className="stat-card">
              <h3 className="stat-title">Active Stylists</h3>
              <p className="stat-value">{activeStylists.length}</p>
            </div>
            <div className="stat-card" style={{gridColumn: 'span 2'}}>
              <h3 className="stat-title">Skills Distribution</h3>
              <div style={{display: 'flex', alignItems: 'center', gap: '20px', marginTop: '15px'}}>
                <div style={{position: 'relative', width: '120px', height: '120px'}}>
                  <svg width="120" height="120" style={{transform: 'rotate(-90deg)'}}>
                    {(() => {
                      const skills = Object.entries(skillsCount).slice(0, 5);
                      const total = skills.reduce((sum, [, count]) => sum + count, 0);
                      const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                      let currentAngle = 0;
                      
                      return skills.map(([skill, count], index) => {
                        const percentage = (count / total) * 100;
                        const angle = (count / total) * 360;
                        const radius = 50;
                        const centerX = 60;
                        const centerY = 60;
                        const innerRadius = 30;
                        
                        const startAngle = (currentAngle * Math.PI) / 180;
                        const endAngle = ((currentAngle + angle) * Math.PI) / 180;
                        
                        const x1 = centerX + radius * Math.cos(startAngle);
                        const y1 = centerY + radius * Math.sin(startAngle);
                        const x2 = centerX + radius * Math.cos(endAngle);
                        const y2 = centerY + radius * Math.sin(endAngle);
                        
                        const x3 = centerX + innerRadius * Math.cos(endAngle);
                        const y3 = centerY + innerRadius * Math.sin(endAngle);
                        const x4 = centerX + innerRadius * Math.cos(startAngle);
                        const y4 = centerY + innerRadius * Math.sin(startAngle);
                        
                        const largeArc = angle > 180 ? 1 : 0;
                        
                        const pathData = [
                          `M ${x1} ${y1}`,
                          `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                          `L ${x3} ${y3}`,
                          `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4}`,
                          'Z'
                        ].join(' ');
                        
                        currentAngle += angle;
                        
                        return (
                          <path
                            key={skill}
                            d={pathData}
                            fill={colors[index]}
                            opacity={0.8}
                          />
                        );
                      });
                    })()
                    }
                  </svg>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600'
                  }}>
                    {Object.values(skillsCount).reduce((a, b) => a + b, 0)}<br/>
                    <span style={{fontSize: '10px', opacity: 0.7}}>Total</span>
                  </div>
                </div>
                <div style={{flex: 1}}>
                  {Object.entries(skillsCount).slice(0, 5).map(([skill, count], index) => {
                    const colors = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];
                    return (
                      <div key={skill} style={{display: 'flex', alignItems: 'center', marginBottom: '8px'}}>
                        <div style={{
                          width: '12px',
                          height: '12px',
                          backgroundColor: colors[index],
                          borderRadius: '50%',
                          marginRight: '8px',
                          opacity: 0.8
                        }} />
                        <span style={{color: 'rgba(255, 255, 255, 0.7)', fontSize: '14px', flex: 1}}>{skill}</span>
                        <span style={{color: 'white', fontSize: '14px', fontWeight: '600'}}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <h3 style={{color: 'white', fontSize: '18px', marginBottom: '20px'}}>All Registered Stylists</h3>
            <div style={{display: 'flex', gap: '15px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <label style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px'}}>Location:</label>
                <input
                  type="text"
                  placeholder="Filter by city..."
                  value={locationFilter}
                  onChange={(e) => setLocationFilter(e.target.value)}
                  className="glass-input"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px',
                    width: '150px',
                    margin: '0'
                  }}
                />
              </div>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <label style={{color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px'}}>Gender:</label>
                <select
                  value={genderFilter}
                  onChange={(e) => setGenderFilter(e.target.value)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    color: 'white',
                    fontSize: '14px',
                    width: '120px',
                    backdropFilter: 'blur(10px)',
                    cursor: 'pointer',
                    outline: 'none',
                    transition: 'all 0.3s ease'
                  }}
                  onFocus={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.4)'}
                  onBlur={(e) => e.target.style.border = '1px solid rgba(255, 255, 255, 0.2)'}
                >
                  <option value="" style={{background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}>All</option>
                  <option value="male" style={{background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}>Male</option>
                  <option value="female" style={{background: 'rgba(0, 0, 0, 0.8)', color: 'white'}}>Female</option>
                </select>
              </div>
              <button
                onClick={() => {setLocationFilter(''); setGenderFilter('');}}
                className="tab-button"
                style={{backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.5)', padding: '6px 12px', fontSize: '12px'}}
              >
                Clear
              </button>
            </div>
            <div style={{overflowX: 'auto'}}>
              <table className="glass-table" style={{minWidth: '800px'}}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gender</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Location</th>
                  <th>Skills</th>
                  <th>Experience</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredStylists.map((stylist, index) => (
                  <tr key={index} onClick={() => setSelectedStylist(stylist)} style={{cursor: 'pointer'}}>
                    <td style={{color: 'white', fontWeight: '500'}}>{capitalizeName(stylist.fullName)}</td>
                    <td style={{textTransform: 'capitalize'}}>{stylist.gender || 'N/A'}</td>
                    <td>{stylist.email}</td>
                    <td>{stylist.phone}</td>
                    <td>{stylist.city}</td>
                    <td style={{maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis'}}>{stylist.skills}</td>
                    <td>{stylist.experience}</td>
                    <td>
                      <span className="status-badge" style={{
                        backgroundColor: stylist.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 
                                       stylist.status === 'rejected' ? 'rgba(239, 68, 68, 0.3)' : 
                                       'rgba(251, 146, 60, 0.3)',
                        color: stylist.status === 'active' ? 'rgb(134, 239, 172)' : 
                               stylist.status === 'rejected' ? 'rgb(252, 165, 165)' : 
                               'rgb(253, 186, 116)',
                        border: `1px solid ${stylist.status === 'active' ? 'rgba(34, 197, 94, 0.5)' : 
                                             stylist.status === 'rejected' ? 'rgba(239, 68, 68, 0.5)' : 
                                             'rgba(251, 146, 60, 0.5)'}`
                      }}>
                        {stylist.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              </table>
            </div>
          </div>
        )}
        
        {selectedStylist && (
          <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000}}>
            <div className="table-container" style={{maxWidth: '600px', maxHeight: '80vh', overflow: 'auto', position: 'relative'}}>
              {selectedStylist.profilePicBase64 && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '150px',
                  backgroundImage: `url(${selectedStylist.profilePicBase64})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  borderRadius: '20px 20px 0 0',
                  filter: 'blur(8px) brightness(0.3)',
                  zIndex: 0
                }} />
              )}
              
              <div style={{position: 'relative', zIndex: 10, paddingTop: selectedStylist.profilePicBase64 ? '40px' : '0'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', position: 'relative', zIndex: 10}}>
                  <h3 style={{color: 'white', fontSize: '20px', margin: 0}}></h3>
                  <div style={{display: 'flex', gap: '10px', alignItems: 'center', position: 'relative', zIndex: 10}}>
                    <button 
                      onClick={() => handleEdit(selectedStylist)}
                      className="tab-button"
                      style={{backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: 'rgba(59, 130, 246, 0.5)', padding: '5px 10px', fontSize: '12px', position: 'relative', zIndex: 10}}
                    >
                      Edit
                    </button>
                    <button onClick={() => setSelectedStylist(null)} style={{background: 'none', border: 'none', color: 'white', fontSize: '24px', cursor: 'pointer', position: 'relative', zIndex: 10}}>×</button>
                  </div>
                </div>
                
                {selectedStylist.profilePicBase64 && (
                  <div style={{display: 'flex', justifyContent: 'center', marginBottom: '20px', marginTop: '-40px', position: 'relative', zIndex: 2}}>
                    <img 
                      src={selectedStylist.profilePicBase64} 
                      alt="Profile" 
                      style={{
                        width: '100px', 
                        height: '100px', 
                        borderRadius: '50%', 
                        objectFit: 'cover',
                        border: '4px solid rgba(255, 255, 255, 0.8)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
                      }} 
                    />
                  </div>
                )}
              </div>
              
              {isEditingModal ? (
                <div style={{display: 'grid', gap: '15px', marginBottom: '30px'}}>
                  <input
                    type="text"
                    value={editFormData.fullName || ''}
                    onChange={(e) => setEditFormData({...editFormData, fullName: e.target.value})}
                    className="glass-input"
                    placeholder="Full Name"
                    style={{background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white'}}
                  />
                  <div style={{marginBottom: '15px'}}>
                    <label style={{color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginBottom: '8px', display: 'block'}}>Gender</label>
                    <div style={{display: 'flex', gap: '15px'}}>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="editGender"
                          value="male"
                          checked={editFormData.gender === 'male'}
                          onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                          style={{accentColor: 'rgba(255, 255, 255, 0.8)'}}
                        />
                        Male
                      </label>
                      <label style={{display: 'flex', alignItems: 'center', gap: '6px', color: 'rgba(255, 255, 255, 0.8)', cursor: 'pointer'}}>
                        <input
                          type="radio"
                          name="editGender"
                          value="female"
                          checked={editFormData.gender === 'female'}
                          onChange={(e) => setEditFormData({...editFormData, gender: e.target.value})}
                          style={{accentColor: 'rgba(255, 255, 255, 0.8)'}}
                        />
                        Female
                      </label>
                    </div>
                  </div>
                  <input
                    type="tel"
                    value={editFormData.phone || ''}
                    onChange={(e) => setEditFormData({...editFormData, phone: e.target.value})}
                    className="glass-input"
                    placeholder="Phone"
                    style={{background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white'}}
                  />
                  <input
                    type="text"
                    value={editFormData.location || ''}
                    onChange={(e) => setEditFormData({...editFormData, location: e.target.value})}
                    className="glass-input"
                    placeholder="Location"
                    style={{background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white'}}
                  />
                  <input
                    type="text"
                    value={editFormData.city || ''}
                    onChange={(e) => setEditFormData({...editFormData, city: e.target.value})}
                    className="glass-input"
                    placeholder="City"
                    style={{background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white'}}
                  />
                  <textarea
                    value={editFormData.skills || ''}
                    onChange={(e) => setEditFormData({...editFormData, skills: e.target.value})}
                    className="textarea"
                    placeholder="Skills"
                    rows={3}
                    style={{background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white'}}
                  />
                  <input
                    type="text"
                    value={editFormData.experience || ''}
                    onChange={(e) => setEditFormData({...editFormData, experience: e.target.value})}
                    className="glass-input"
                    placeholder="Experience"
                    style={{background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.2)', color: 'white'}}
                  />
                  <div style={{display: 'flex', gap: '10px'}}>
                    <button 
                      onClick={handleSaveEdit}
                      className="tab-button"
                      style={{backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 0.5)', flex: 1}}
                    >
                      Save Changes
                    </button>
                    <button 
                      onClick={() => setIsEditingModal(false)}
                      className="tab-button"
                      style={{backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.5)', flex: 1}}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{display: 'grid', gap: '15px', marginBottom: '30px'}}>
                  <div><strong style={{color: 'white'}}>Name:</strong> <span style={{color: 'rgba(255,255,255,0.8)'}}>{capitalizeName(selectedStylist.fullName)}</span></div>
                  <div><strong style={{color: 'white'}}>Gender:</strong> <span style={{color: 'rgba(255,255,255,0.8)', textTransform: 'capitalize'}}>{selectedStylist.gender || 'N/A'}</span></div>
                  <div><strong style={{color: 'white'}}>Email:</strong> <span style={{color: 'rgba(255,255,255,0.8)'}}>{selectedStylist.email}</span></div>
                  <div><strong style={{color: 'white'}}>Phone:</strong> <span style={{color: 'rgba(255,255,255,0.8)'}}>{selectedStylist.phone}</span></div>
                  <div><strong style={{color: 'white'}}>Location:</strong> <span style={{color: 'rgba(255,255,255,0.8)'}}>{selectedStylist.location}, {selectedStylist.city}</span></div>
                  <div><strong style={{color: 'white'}}>Skills:</strong> <span style={{color: 'rgba(255,255,255,0.8)'}}>{selectedStylist.skills}</span></div>
                  <div><strong style={{color: 'white'}}>Experience:</strong> <span style={{color: 'rgba(255,255,255,0.8)'}}>{selectedStylist.experience}</span></div>
                  <div><strong style={{color: 'white'}}>Status:</strong> 
                    <span className="status-badge" style={{
                      marginLeft: '10px',
                      backgroundColor: selectedStylist.status === 'active' ? 'rgba(34, 197, 94, 0.3)' : 
                                     selectedStylist.status === 'rejected' ? 'rgba(239, 68, 68, 0.3)' : 
                                     'rgba(251, 146, 60, 0.3)',
                      color: selectedStylist.status === 'active' ? 'rgb(134, 239, 172)' : 
                             selectedStylist.status === 'rejected' ? 'rgb(252, 165, 165)' : 
                             'rgb(253, 186, 116)',
                      border: `1px solid ${selectedStylist.status === 'active' ? 'rgba(34, 197, 94, 0.5)' : 
                                           selectedStylist.status === 'rejected' ? 'rgba(239, 68, 68, 0.5)' : 
                                           'rgba(251, 146, 60, 0.5)'}`
                    }}>
                      {selectedStylist.status}
                    </span>
                  </div>
                </div>
              )}
              
              {!isEditingModal && (
                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                {selectedStylist.status !== 'approved' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedStylist.id, 'approved')}
                    className="tab-button"
                    style={{backgroundColor: 'rgba(34, 197, 94, 0.3)', borderColor: 'rgba(34, 197, 94, 0.5)', flex: 1}}
                  >
                    Approve
                  </button>
                )}
                {selectedStylist.status !== 'rejected' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedStylist.id, 'rejected')}
                    className="tab-button"
                    style={{backgroundColor: 'rgba(251, 146, 60, 0.3)', borderColor: 'rgba(251, 146, 60, 0.5)', flex: 1}}
                  >
                    Reject
                  </button>
                )}
                {selectedStylist.status !== 'active' && (
                  <button 
                    onClick={() => handleStatusUpdate(selectedStylist.id, 'active')}
                    className="tab-button"
                    style={{backgroundColor: 'rgba(59, 130, 246, 0.3)', borderColor: 'rgba(59, 130, 246, 0.5)', flex: 1}}
                  >
                    Activate
                  </button>
                )}
                <button 
                  onClick={() => handleDelete(selectedStylist.id)}
                  className="tab-button"
                  style={{backgroundColor: 'rgba(239, 68, 68, 0.3)', borderColor: 'rgba(239, 68, 68, 0.5)', flex: 1}}
                >
                  Delete
                </button>
                </div>
              )}
            </div>
          </div>
        )}
        
        {message && (
          <div className={`message ${isError ? 'error-message' : 'success-message'}`} style={{position: 'fixed', bottom: '20px', right: '20px', zIndex: 1001}}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}