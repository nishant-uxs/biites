import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader2 } from "lucide-react";

interface QRScannerProps {
  onScan: (qrCode: string) => void;
  onError?: (error: string) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string>("");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startScanning = async () => {
    try {
      setError("");
      setIsScanning(true);

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode("qr-reader");
      }

      await scannerRef.current.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10, // Scans per second
          qrbox: { width: 250, height: 250 }, // Scanning area
        },
        (decodedText) => {
          // Successfully scanned
          stopScanning();
          onScan(decodedText);
        },
        (errorMessage) => {
          // Ignore continuous scanning errors
          // Only log actual failures
        }
      );
    } catch (err: any) {
      setError(err.message || "Failed to start camera");
      setIsScanning(false);
      if (onError) {
        onError(err.message || "Failed to start camera");
      }
    }
  };

  const stopScanning = async () => {
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        await scannerRef.current.stop();
      }
      setIsScanning(false);
    } catch (err) {
      console.error("Error stopping scanner:", err);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      <div
        id="qr-reader"
        ref={containerRef}
        className={`${isScanning ? "block" : "hidden"} w-full rounded-lg overflow-hidden border-2 border-primary`}
      />

      {!isScanning && (
        <div className="flex flex-col items-center justify-center py-8 space-y-4 bg-muted rounded-lg">
          <Camera className="w-12 h-12 text-muted-foreground" />
          <p className="text-sm text-muted-foreground text-center">
            Click below to start camera and scan student's QR code
          </p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="flex gap-2">
        {!isScanning ? (
          <Button
            onClick={startScanning}
            className="flex-1"
            data-testid="button-start-camera"
          >
            <Camera className="w-4 h-4 mr-2" />
            Start Camera
          </Button>
        ) : (
          <Button
            onClick={stopScanning}
            variant="destructive"
            className="flex-1"
            data-testid="button-stop-camera"
          >
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Camera
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Point camera at student's QR code. It will scan automatically.
      </p>
    </div>
  );
}
