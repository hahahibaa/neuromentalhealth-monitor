// Simple DSP Utilities for EEG Signal Processing
import FFT from 'jsfft';

// Constants for sampling and buffers
// Assuming an ESP8266 sending data approximately every 4ms => 250Hz sampling rate
export const SAMPLING_RATE = 250; 
export const BUFFER_SIZE = 512; // Must be power of 2 for FFT

// Basic IIR Bandpass Filter (1Hz - 40Hz)
// Designed for a 250Hz sampling rate.
// This is a simplified 2nd order Butterworth bandpass approximation for real-time web use.
export class BandpassFilter {
  constructor() {
    this.x1 = 0; this.x2 = 0;
    this.y1 = 0; this.y2 = 0;
    
    // Coefficients for ~1-40Hz Bandpass at 250Hz (normalized)
    // Pre-calculated coefficients using standard bilinear transform
    this.b0 = 0.385;
    this.b1 = 0;
    this.b2 = -0.385;
    this.a1 = -1.22;
    this.a2 = 0.49;
  }

  process(value) {
    const output = 
      this.b0 * value + 
      this.b1 * this.x1 + 
      this.b2 * this.x2 - 
      this.a1 * this.y1 - 
      this.a2 * this.y2;
      
    this.x2 = this.x1;
    this.x1 = value;
    
    this.y2 = this.y1;
    this.y1 = output;
    
    return output;
  }
}

/**
 * Computes the FFT on the provided data array.
 * @param {number[]} data Array of numerical samples, must be a power of 2.
 * @returns {Array<{frequency: number, magnitude: number}>} Spectrum
 */
export function computeFFT(data) {
  if (data.length === 0) return [];
  
  // Pad or truncate data to generic power of 2 (BUFFER_SIZE)
  let paddedData = [...data];
  if (paddedData.length > BUFFER_SIZE) {
    paddedData = paddedData.slice(paddedData.length - BUFFER_SIZE);
  } else while (paddedData.length < BUFFER_SIZE) {
    paddedData.push(0);
  }

  // Convert to complex array format expected by jsfft
  const complexArray = new FFT.ComplexArray(BUFFER_SIZE);
  for (let i = 0; i < BUFFER_SIZE; i++) {
    complexArray.real[i] = paddedData[i];
    complexArray.imag[i] = 0;
  }

  // Perform FFT
  const fft = complexArray.FFT();
  
  const spectrum = [];
  const binWidth = SAMPLING_RATE / BUFFER_SIZE;
  
  // We only care about positive frequencies up to Nyquist (125Hz)
  // But practically only up to 40Hz as requested
  for (let i = 0; i <= BUFFER_SIZE / 2; i++) {
    const freq = i * binWidth;
    if (freq > 45) break; // Optimization: stop calculating after ~45Hz
    
    const real = fft.real[i];
    const imag = fft.imag[i];
    
    // Calculate magnitude (power)
    const magnitude = Math.sqrt(real * real + imag * imag);
    
    spectrum.push({
      frequency: freq,
      magnitude: magnitude
    });
  }
  
  return spectrum;
}

/**
 * Calculates the variance of the data array.
 * @param {number[]} data Array of numerical samples
 * @returns {number} Variance
 */
export function calculateVariance(data) {
  if (data.length === 0) return 0;
  
  const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
  const squareDiffs = data.map(val => {
    const diff = val - mean;
    return diff * diff;
  });
  
  const variance = squareDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  return variance;
}

// Define EEG Frequency Bands
export const BANDS = {
  THETA: { min: 4, max: 7 },
  ALPHA: { min: 8, max: 12 },
  BETA:  { min: 13, max: 30 }
};

/**
 * Extracts average power in a specific frequency band from a spectrum
 */
export function getBandPower(spectrum, band) {
  if (!spectrum || spectrum.length === 0) return 0;
  
  let powerSum = 0;
  let count = 0;
  
  for (let point of spectrum) {
    if (point.frequency >= band.min && point.frequency <= band.max) {
      powerSum += point.magnitude;
      count++;
    }
  }
  
  return count > 0 ? (powerSum / count) : 0;
}

/**
 * Classifies Focus vs Distracted using STFT Time-Frequency Analysis.
 * Instead of reacting instantly to an amplitude spike or a single noisy FFT bin,
 * this calculates the Alpha/Beta ratio.
 * 
 * High Alpha / Beta ratio = FOCUSED (Relaxed, internalized attention)
 * Low Alpha / Beta ratio = DISTRACTED / ANXIOUS (Active outward attention, or muscle noise)
 * 
 * @param {Array<{frequency: number, magnitude: number}>[]} stftHistory 2D array of recent spectra
 */
export function classifyStateSTFT(stftHistory) {
  if (!stftHistory || stftHistory.length < 5) return 'DISCONNECTED';
  
  // We average the band powers over the last few windows (e.g., last 5 STFT frames) to smooth out blinks
  const recentFrames = stftHistory.slice(-5);
  
  let totalAlpha = 0;
  let totalBeta = 0;
  
  recentFrames.forEach(spectrum => {
    totalAlpha += getBandPower(spectrum, BANDS.ALPHA);
    totalBeta += getBandPower(spectrum, BANDS.BETA);
  });
  
  const avgAlpha = totalAlpha / recentFrames.length;
  const avgBeta = totalBeta / recentFrames.length;
  
  // If no significant brainwave activity is found (sensor disconnected or off head)
  if (avgAlpha < 0.1 && avgBeta < 0.1) return 'DISCONNECTED';
  
  // The Ratio
  const ratio = avgAlpha / (avgBeta || 1); // Avoid div by 0
  
  // A high ratio means Alpha is dominant over Beta (Focused / Relaxed State)
  // A low ratio means Beta is jumping (Distracted, anxious, or muscle noise from movement)
  // Threshold can be tuned. Typically Alpha/Beta > 1.0 indicates a resting focused state.
  if (ratio > 1.0) {
    return 'FOCUSED';
  } else {
    return 'DISTRACTED';
  }
}

/**
 * Classifies Focus vs Distracted using a single FFT spectrum.
 * 
 * @param {Array<{frequency: number, magnitude: number}>} spectrum Current spectrum
 */
export function classifyStateFFT(spectrum) {
  if (!spectrum || spectrum.length === 0) return 'DISCONNECTED';
  
  const alpha = getBandPower(spectrum, BANDS.ALPHA);
  const beta = getBandPower(spectrum, BANDS.BETA);
  
  // Threshold for disconnection / no signal
  if (alpha < 0.1 && beta < 0.1) return 'DISCONNECTED';
  
  // Ratio of Alpha to Beta
  const ratio = alpha / (beta || 1);
  
  if (ratio > 1.0) {
    return 'FOCUSED';
  } else {
    return 'DISTRACTED';
  }
}
