import React, { useState, useEffect, useRef } from 'react';
import { BrowserCodeReader } from '@zxing/library';
import { toast } from 'sonner';
import { Button } from './ui/button';

export const BarcodeScanner = ({ onScanSuccess, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);

  useEffect(() => {
    startScanning();
    
    return () => {
      stopScanning();
    };
  }, []);

  const startScanning = async () => {
    try {
      setScanning(true);
      setError(null);

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });

      // Initialize code reader
      const codeReader = new BrowserCodeReader();
      codeReaderRef.current = codeReader;

      // Start decoding
      const result = await codeReader.decodeOnceFromStream(stream, videoRef.current);
      
      if (result) {
        toast.success('Barcode scanned successfully!');
        onScanSuccess(result.text);
      }
    } catch (err) {
      console.error('Barcode scanning error:', err);
      if (err.name === 'NotAllowedError') {
        setError('Camera permission denied. Please allow camera access.');
        toast.error('Camera permission denied');
      } else if (err.name === 'NotFoundError') {
        setError('No camera found on this device.');
        toast.error('No camera found');
      } else {
        setError('Failed to scan barcode. Please try again.');
        toast.error('Scanning failed');
      }
    } finally {
      setScanning(false);
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
  };

  const handleRetry = () => {
    stopScanning();
    startScanning();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full rounded-lg bg-black"
          style={{ maxHeight: '400px', minHeight: '300px' }}
          autoPlay
          playsInline
        />
        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 border-4 border-[#D4AF37] rounded-lg animate-pulse" />
          </div>
        )}
      </div>
      
      {error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-500 text-center">{error}</p>
          <Button 
            onClick={handleRetry}
            className="w-full bg-[#D4AF37] text-black hover:bg-[#b5952f]"
          >
            Try Again
          </Button>
        </div>
      ) : (
        <p className="text-sm text-zinc-400 text-center">
          {scanning ? 'Scanning... Point camera at barcode' : 'Initializing camera...'}
        </p>
      )}
      
      <Button 
        onClick={onClose}
        variant="outline"
        className="w-full"
      >
        Cancel
      </Button>
    </div>
  );
};