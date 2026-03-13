/*
 * NeuroHealth ESP8266 Web Serial Raw Simulator
 * 
 * This code simulates an EEG headset by generating raw analog signal data
 * (0 - 1023) and sending it over the USB Serial port at 115200 baud.
 * 
 * It uses composed sine waves to simulate specific brainwave frequencies.
 * 
 * In a real piece of hardware, replace the synthetic 'analogVal' calculation
 * below with a real `analogRead(A0)` from your EEG sensor logic.
 */

unsigned long previousMicros = 0;
const long intervalMicros = 4000; // ~250Hz sampling rate (4ms per sample)

// Time tracking for sine waves
float t = 0.0;

void setup() {
  // Initialize Serial communication at 115200 baud
  Serial.begin(115200);
  while (!Serial) { ; }
}

void loop() {
  unsigned long currentMicros = micros();

  // Non-blocking high-speed loop (250Hz)
  if (currentMicros - previousMicros >= intervalMicros) {
    previousMicros = currentMicros;
    
    // Increment time (dt = 0.004 seconds)
    t += 0.004;

    // Simulate resting Alpha (10Hz) + Baseline Delta (2Hz) + Some Beta (20Hz)
    // Formula: sin(2 * PI * Frequency * time)
    float alphaWave = sin(2.0 * PI * 10.0 * t) * 100.0; 
    float deltaWave = sin(2.0 * PI * 2.0 * t) * 150.0;
    float betaWave  = sin(2.0 * PI * 20.0 * t) * 50.0;
    
    // Add noise
    float noise = random(-20, 20);

    // Combine waves and shift into a roughly 0-1023 analog range (centered at ~512)
    float composite = 512.0 + alphaWave + deltaWave + betaWave + noise;
    
    // Constrain to 10-bit ADC output
    int analogVal = (int)composite;
    if (analogVal < 0) analogVal = 0;
    if (analogVal > 1023) analogVal = 1023;

    // Send raw analog value followed by newline for fast frontend parsing
    Serial.println(analogVal);
  }
}
