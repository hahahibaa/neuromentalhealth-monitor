import { useState, useRef, useCallback } from 'react';

export function useSerialPort(onDataReceived) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const keepReadingRef = useRef(true);

  // Buffer to handle partial lines of text
  const textBufferRef = useRef("");

  const connect = useCallback(async () => {
    try {
      if (!('serial' in navigator)) {
        throw new Error("Web Serial API not supported in this browser. Please use Chrome or Edge.");
      }

      // Request a port and open it
      const port = await navigator.serial.requestPort();
      // Most ESP8266 standard bioamp examples use 115200 baud rate for high frequency
      await port.open({ baudRate: 115200 });

      portRef.current = port;
      keepReadingRef.current = true;
      setIsConnected(true);
      setError(null);

      // Start the reading loop in the background
      readLoop(port);

    } catch (err) {
      console.error("Error connecting to serial port:", err);
      setError(err.message);
      setIsConnected(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    keepReadingRef.current = false;
    
    if (readerRef.current) {
      await readerRef.current.cancel();
      readerRef.current = null;
    }

    if (portRef.current) {
      try {
        await portRef.current.close();
      } catch (err) {
        console.error("Error closing port:", err);
      }
      portRef.current = null;
    }

    setIsConnected(false);
    textBufferRef.current = "";
  }, []);

  const readLoop = async (port) => {
    const decoder = new TextDecoderStream();
    const inputDone = port.readable.pipeTo(decoder.writable);
    const reader = decoder.readable.getReader();
    readerRef.current = reader;

    try {
      while (keepReadingRef.current) {
        const { value, done } = await reader.read();
        
        if (done) break;
        if (value) {
          textBufferRef.current += value;
          const lines = textBufferRef.current.split('\n');
          
          // Keep the last partial line in the buffer
          textBufferRef.current = lines.pop();

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine !== "") {
              const numValue = parseFloat(trimmedLine);
              if (!isNaN(numValue) && onDataReceived) {
                onDataReceived(numValue);
              }
            }
          }
        }
      }
    } catch (err) {
      console.error("Serial Read Error:", err);
      setError(err.message);
    } finally {
      reader.releaseLock();
    }
  };

  return { isConnected, connect, disconnect, error };
}
