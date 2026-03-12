import React from 'react';

export default function SessionReport({ 
  profile, 
  totalSeconds, 
  focusedSeconds, 
  distractedSeconds, 
  onReturnHome 
}) {
  
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  const focusPercentage = totalSeconds > 0 ? Math.round((focusedSeconds / totalSeconds) * 100) : 0;

  // Generate a custom tip based on profile
  let insights = "";
  if (profile === 'Student') {
    insights = "Try the Pomodoro technique (25min focus, 5min rest) to maintain higher focus percentages during study sessions.";
  } else if (profile === 'Working Prof') {
    insights = "Short screen-breaks every hour can reduce high-frequency beta waves and prevent cognitive fatigue.";
  } else if (profile === 'Educator') {
    insights = "Your baseline focus provides a great reference point when comparing against typical classroom engagement levels.";
  }

  return (
    <div className="glass-panel" style={{ maxWidth: '800px', margin: '4rem auto', textAlign: 'center' }}>
      <h1 style={{ marginBottom: '1rem' }}>Session Complete</h1>
      <p className="subtitle" style={{ marginBottom: '3rem' }}>Profile: {profile}</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem', marginBottom: '3rem' }}>
        <div style={{ padding: '2rem', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: '15px' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Total Time</h4>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'white' }}>{formatTime(totalSeconds)}</span>
        </div>
        <div style={{ padding: '2rem', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: '15px' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Focus Score</h4>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--state-relaxed)' }}>{focusPercentage}%</span>
        </div>
        <div style={{ padding: '2rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: '15px' }}>
          <h4 style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Distracted Time</h4>
          <span style={{ fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--state-distracted)' }}>{formatTime(distractedSeconds)}</span>
        </div>
      </div>

      <div style={{ marginBottom: '3rem', padding: '2rem', border: '1px solid var(--border-color)', borderRadius: '15px', textAlign: 'left' }}>
        <h3 style={{ color: 'white', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>Insights for {profile}s</h3>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '1.1rem' }}>{insights}</p>
      </div>

      <button className="connect-btn" onClick={onReturnHome}>
        Return Home
      </button>
    </div>
  );
}
