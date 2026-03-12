import React, { useState } from 'react';

export default function LandingPage({ onConnect, error }) {
  const [profile, setProfile] = useState('');

  const handleConnectClick = () => {
    if (!profile) {
      alert("Please select a profile first.");
      return;
    }
    onConnect(profile);
  };

  return (
    <div className="landing-container glass-panel" style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
      <h1>Welcome to Neuro Health</h1>
      <p className="subtitle" style={{ marginBottom: '3rem' }}>Optimize your brainwaves for peak performance.</p>

      <div style={{ marginBottom: '3rem' }}>
        <h3 style={{ color: 'white', fontFamily: 'var(--font-heading)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>1. Choose Your Profile</h3>
        <div className="profile-selector">
          <button 
            className={`profile-btn ${profile === 'Student' ? 'active' : ''}`}
            onClick={() => setProfile('Student')}
          >
            🎓 Student
          </button>
          <button 
            className={`profile-btn ${profile === 'Working Prof' ? 'active' : ''}`}
            onClick={() => setProfile('Working Prof')}
          >
            💼 Working Professional
          </button>
          <button 
            className={`profile-btn ${profile === 'Educator' ? 'active' : ''}`}
            onClick={() => setProfile('Educator')}
          >
            🍎 Educator
          </button>
        </div>
      </div>

      <div style={{ marginBottom: '3rem', backgroundColor: 'rgba(59, 130, 246, 0.05)', padding: '2rem', borderRadius: '15px' }}>
        <h3 style={{ color: 'white', fontFamily: 'var(--font-heading)', marginBottom: '1rem', fontSize: '1.5rem' }}>2. Wear the Headset</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.1rem' }}>
          Please place the BioAmp EXG Pill electrodes on your forehead to target the frontal lobe (Fp1 or Fp2 locations) for optimal Alpha/Beta readings.
        </p>
      </div>

      <div>
        <h3 style={{ color: 'white', fontFamily: 'var(--font-heading)', marginBottom: '1.5rem', fontSize: '1.5rem' }}>3. Connect Device</h3>
        <button 
          className="connect-btn" 
          onClick={handleConnectClick}
          style={{ padding: '1.2rem 4rem', fontSize: '1.2rem', opacity: profile ? 1 : 0.5 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
          Start Session
        </button>
        
        {error && <p style={{ color: '#ef4444', marginTop: '1rem' }}>{error}</p>}
      </div>

    </div>
  );
}
