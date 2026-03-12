import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSerialPort } from './useSerialPort';
import { BandpassFilter, computeFFT, classifyStateFFT, BUFFER_SIZE } from './dspUtils';
import LiveChart from './components/LiveChart';
import FFTChart from './components/FFTChart';
import LandingPage from './components/LandingPage';
import SessionReport from './components/SessionReport';

function App() {
  // Navigation State: 'landing', 'dashboard', 'report'
  const [currentView, setCurrentView] = useState('landing');
  const [userProfile, setUserProfile] = useState('');

  // Analytics State
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [focusedSeconds, setFocusedSeconds] = useState(0);
  const [distractedSeconds, setDistractedSeconds] = useState(0);

  // State for UI and charts
  const [signalData, setSignalData] = useState(new Array(300).fill(0)); // Keep last 300 points for graphing
  const [currentSpectrum, setCurrentSpectrum] = useState([]); // Array of {frequency, magnitude}
  const [cognitiveState, setCognitiveState] = useState('DISCONNECTED'); // FOCUSED, DISTRACTED, DISCONNECTED

  // Web Serial Hook
  const { isConnected, connect, disconnect, error } = useSerialPort((value) => {
    handleNewData(value);
  });

  // DSP and Buffering Refs
  const filterRef = useRef(new BandpassFilter());
  const sampleBufferRef = useRef([]); // Accumulates exact BUFFER_SIZE for FFT

  // Function called on every new value from serial port
  const handleNewData = useCallback((val) => {
    // 1. Apply Bandpass Filter (1-40 Hz)
    const filteredVal = filterRef.current.process(val);

    // 2. Accumulate for FFT calculation (need power of 2, e.g. 512)
    sampleBufferRef.current.push(filteredVal);

    // Maintain max length for graphing smoothly without blowing up memory
    setSignalData(prev => {
      const newData = [...prev, filteredVal];
      if (newData.length > 300) return newData.slice(newData.length - 300);
      return newData;
    });

  }, []);

  // Periodic interval to run FFT and classification
  // We don't run FFT on every sample, it's too expensive. We run it every X ms on the latest buffer.
  useEffect(() => {
    if (!isConnected) {
      setCognitiveState('DISCONNECTED');
      return;
    }

    const intervalId = setInterval(() => {
      // Create a snapshot of the current buffer
      let dataSnapshot = [...sampleBufferRef.current];
      
      // If we don't have enough data yet, wait.
      if (dataSnapshot.length < BUFFER_SIZE/2) return;

      // Ensure length is exactly BUFFER_SIZE (truncate or pad)
      if (dataSnapshot.length > BUFFER_SIZE) {
        dataSnapshot = dataSnapshot.slice(dataSnapshot.length - BUFFER_SIZE);
        // Also trim the main buffer to prevent infinite growth
        sampleBufferRef.current = sampleBufferRef.current.slice(sampleBufferRef.current.length - BUFFER_SIZE);
      } 
      
      // 3. Compute FFT for the current sliding window snapshot
      const newSpectrum = computeFFT(dataSnapshot);
      setCurrentSpectrum(newSpectrum);
      
      // 4. Classify the state using the latest FFT spectrum
      const state = classifyStateFFT(newSpectrum);
      setCognitiveState(state);
      
    }, 500); // 500ms update rate for UI and FFT

    return () => clearInterval(intervalId);
  }, [isConnected]);

  // Timer Tick Effect (1 second) for Analytics Tracking
  useEffect(() => {
    if (currentView !== 'dashboard' || !isConnected) return;

    const timerId = setInterval(() => {
      setTotalSeconds(prev => prev + 1);
      
      setCognitiveState(currentState => {
        if (currentState === 'FOCUSED') {
          setFocusedSeconds(prev => prev + 1);
        } else if (currentState === 'DISTRACTED') {
          setDistractedSeconds(prev => prev + 1);
        }
        return currentState; // Don't actually change state here, just read it
      });

    }, 1000);

    return () => clearInterval(timerId);
  }, [currentView, isConnected]);

  // Nav Handlers
  const handleStartSession = async (profile) => {
    setUserProfile(profile);
    await connect();
    if (!error) {
      setCurrentView('dashboard');
      setSessionStartTime(Date.now());
      setTotalSeconds(0);
      setFocusedSeconds(0);
      setDistractedSeconds(0);
    }
  };

  const handleEndSession = async () => {
    await disconnect();
    setCurrentView('report');
  };

  const handleReturnHome = () => {
    setCurrentView('landing');
    setUserProfile('');
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const focusPercentage = totalSeconds > 0 ? Math.round((focusedSeconds / totalSeconds) * 100) : 0;

  if (currentView === 'landing') {
    return <LandingPage onConnect={handleStartSession} error={error} />;
  }

  if (currentView === 'report') {
    return (
      <SessionReport 
        profile={userProfile}
        totalSeconds={totalSeconds}
        focusedSeconds={focusedSeconds}
        distractedSeconds={distractedSeconds}
        onReturnHome={handleReturnHome}
      />
    );
  }

  // Dashboard View
  return (
    <>
      <div className="title-container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'left' }}>
          <h1>Neuro Health</h1>
          <p className="subtitle">Profile: {userProfile}</p>
        </div>
        
        <div style={{ textAlign: 'right', display: 'flex', gap: '2rem', alignItems: 'center' }}>
           <div style={{ textAlign: 'center' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Focus Score</p>
             <h2 style={{ color: 'var(--state-relaxed)', fontFamily: 'var(--font-heading)' }}>{focusPercentage}%</h2>
           </div>
           <div style={{ textAlign: 'center' }}>
             <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.2rem' }}>Elapsed Time</p>
             <h2 style={{ color: 'white', fontFamily: 'var(--font-heading)' }}>{formatTime(totalSeconds)}</h2>
           </div>
            <button className="connect-btn disconnect" onClick={handleEndSession}>
             End Session
           </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Main Charts Column */}
        <div className="charts-container">
          <div className="chart-wrapper">
            <LiveChart data={signalData} />
          </div>
          <div className="chart-wrapper">
            <FFTChart spectrum={currentSpectrum} />
          </div>
        </div>

        {/* Side Control Panel & State Indicator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          
          <div className="glass-panel" style={{ display: 'flex', justifyContent: 'center' }}>
             <div style={{ textAlign: 'center' }}>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Connection Status</p>
                <div style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '20px',
                  backgroundColor: isConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: isConnected ? 'var(--state-relaxed)' : 'var(--state-distracted)'
                }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: 'currentColor' }}></div>
                  {isConnected ? 'Connected to ESP8266' : 'Disconnected'}
                </div>
             </div>
          </div>

          <div className="glass-panel state-indicator">
            <h2>Current State</h2>
            <div className={`status-text ${cognitiveState.toLowerCase()}`}>
              {cognitiveState}
            </div>
            {cognitiveState === 'FOCUSED' && (
              <p style={{ color: 'var(--state-relaxed)', marginTop: '1rem', fontSize: '0.9rem' }}>Alpha dominance detected</p>
            )}
            {cognitiveState === 'DISTRACTED' && (
              <p style={{ color: 'var(--state-distracted)', marginTop: '1rem', fontSize: '0.9rem' }}>High Beta ratio / Artifacts</p>
            )}
          </div>

          <div className="glass-panel" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <h3 style={{ color: 'white', marginBottom: '0.5rem', fontFamily: 'var(--font-heading)' }}>How it Works</h3>
            <p>1. Connect your BioAmp EXG Pill via serial port (115200 baud).</p>
            <p>2. Fast Fourier Transform (FFT) extraction runs on sliding windows.</p>
            <p>3. Top chart plots raw signal; bottom bar chart shows real-time power spectrum.</p>
            <p>4. Ratio of Alpha (8-12Hz) to Beta (13-30Hz) waves determines your Focus state.</p>
          </div>

        </div>
      </div>
    </>
  );
}

export default App;
