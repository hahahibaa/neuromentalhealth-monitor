import React, { useRef, useEffect } from 'react';

// Custom Canvas Spectrogram 
// Plots Time on X-axis, Frequency on Y-axis, Power as Color
export default function SpectrogramChart({ stftHistory, maxFreq = 40 }) {
  const canvasRef = useRef(null);

  // Define a color map function (Viridis-like) mapping 0-1 normalized magnitude to RGB
  const getColor = (normalizedValue) => {
    // Simple heatmap mapping: Blue (low) -> Green (mid) -> Red (high)
    const h = (1.0 - normalizedValue) * 240; // 240 is Blue, 0 is Red in HSL
    return `hsl(${h}, 100%, 50%)`;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#1e293b'; 
    ctx.fillRect(0, 0, width, height);

    if (stftHistory.length === 0) return;

    // The dimensions of the STFT history grid
    const numTimeSlices = stftHistory.length; // usually around 60 for 1-minute history
    // We only care about rendering up to maxFreq
    const exampleSpectrum = stftHistory[0];
    const binsToRender = exampleSpectrum.filter(s => s.frequency <= maxFreq);
    const numFreqBins = binsToRender.length;

    // Dimensions of each block on the canvas
    const blockWidth = width / 60; // Assuming we keep max 60 slices
    const blockHeight = height / numFreqBins;

    // Find global max magnitude for normalization (visual scaling)
    let globalMax = 0;
    stftHistory.forEach(spectrum => {
      spectrum.forEach(bin => {
        if (bin.frequency <= maxFreq && bin.magnitude > globalMax) {
          globalMax = bin.magnitude;
        }
      });
    });

    // Draw the Spectrogram
    stftHistory.forEach((spectrum, timeIndex) => {
      const x = timeIndex * blockWidth;
      
      const relevantBins = spectrum.filter(s => s.frequency <= maxFreq);
      
      relevantBins.forEach((bin, freqIndex) => {
        // Y goes from bottom (low freq) to top (high freq)
        const y = height - ((freqIndex + 1) * blockHeight);
        
        // Normalize power
        const norm = globalMax > 0 ? (bin.magnitude / globalMax) : 0;
        
        ctx.fillStyle = getColor(norm);
        ctx.fillRect(x, y, blockWidth + 1, blockHeight + 1); // +1 to prevent sub-pixel gaps
      });
    });

    // Draw Y-axis frequency labels
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '10px var(--font-main)';
    ctx.fillText('40 Hz', 5, 12);
    ctx.fillText('20 Hz', 5, height / 2);
    ctx.fillText(' 1 Hz', 5, height - 5);

  }, [stftHistory, maxFreq]);

  return (
    <div className="glass-panel" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ marginBottom: '1rem', color: '#94a3b8', fontFamily: 'var(--font-heading)' }}>Spectrogram (Time-Frequency)</h3>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '8px' }}>
        <canvas 
          ref={canvasRef} 
          width={800} // Logical width, scaled by CSS
          height={300} 
          style={{ width: '100%', height: '100%', display: 'block' }}
        />
      </div>
    </div>
  );
}
