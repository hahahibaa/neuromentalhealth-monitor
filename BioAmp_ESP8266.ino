/*
  BioAmp EXG Pill - ESP8266 EEG Serial Sender
  
  This code reads the analog signal from the BioAmp EXG Pill (connected to A0)
  and sends it over Serial at 115200 baud. The web application reads this directly.
  
  Hardware connections (ESP8266 NodeMCU):
  - BioAmp OUT -> ESP8266 A0 (Analog PIN 0)
  - BioAmp VCC -> 3.3V
  - BioAmp GND -> GND
*/

const int bioAmpPin = A0;

// Aim for approx 250Hz sampling rate
// 1000ms / 250 = 4ms delay between samples
const int SAMPLE_DELAY_MS = 4; 

void setup() {
  // Must match the baud rate initialized in the web application (useSerialPort.js)
  Serial.begin(115200);
}

void loop() {
  // Read analog value (0-1023 on ESP8266 typical 10-bit ADC)
  int eegValue = analogRead(bioAmpPin);
  
  // Print value followed by newline for the Web Serial reader to parse easily
  Serial.println(eegValue);
  
  // Small delay to maintain somewhat consistent sampling rate
  delay(SAMPLE_DELAY_MS);
}
