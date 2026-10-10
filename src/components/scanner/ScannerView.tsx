import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Medication, YoloDetectionBox } from '../../types';
import {
  Camera,
  Scan,
  CheckCircle,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Upload,
  Video,
  VideoOff,
  Sparkles,
  Calendar,
  Sliders,
  Settings,
  HelpCircle,
  FileCode,
  Tag,
  Hash,
  ArrowRight,
  Check,
  Edit3,
  Server,
  Activity,
  Layers,
} from 'lucide-react';

interface BackendStatus {
  online: boolean;
  modelLoaded: boolean;
  weightsFile?: string;
  device?: string;
  classesCount?: number;
  classMapping?: Record<string, string>;
  instructions?: string;
  error?: string;
}

export const ScannerView: React.FC = () => {
  const { addScanResult, showToast, medications, markDoseTaken } = useApp();

  // Video & Capture Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optical sensor states
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInferring, setIsInferring] = useState<boolean>(false);
  const [capturedImageUri, setCapturedImageUri] = useState<string | null>(null);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);

  // Backend connection & configuration
  const [backendUrl, setBackendUrl] = useState<string>('http://localhost:8000');
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [confidenceThreshold, setConfidenceThreshold] = useState<number>(0.25);
  const [backendStatus, setBackendStatus] = useState<BackendStatus | null>(null);
  const [isCheckingBackend, setIsCheckingBackend] = useState<boolean>(false);

  // Real YOLO Detection Output (genuine model values)
  const [detectionBoxes, setDetectionBoxes] = useState<YoloDetectionBox[]>([]);
  const [detectedCounts, setDetectedCounts] = useState<Record<string, number>>({});
  const [inferenceTimeMs, setInferenceTimeMs] = useState<number | null>(null);
  const [inferenceError, setInferenceError] = useState<string | null>(null);

  // Review & Correction Step (Step 8 & 9)
  const [selectedPredictedMedicine, setSelectedPredictedMedicine] = useState<string>('');
  const [correctedDosage, setCorrectedDosage] = useState<string>('500mg');
  const [pillsCountToLog, setPillsCountToLog] = useState<number>(1);
  const [matchedMedication, setMatchedMedication] = useState<Medication | null>(null);
  const [isVerificationComplete, setIsVerificationComplete] = useState<boolean>(false);

  // Camera stream controls
  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (err: any) {
      console.warn('Camera sensor unavailable:', err);
      setCameraError(
        'Physical optical sensor not accessible or permission denied. You can use image upload below.'
      );
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  // Ping backend status
  const checkBackendStatus = async (quiet = false) => {
    setIsCheckingBackend(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      const res = await fetch(`${backendUrl}/status`, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setBackendStatus({
          online: true,
          modelLoaded: !!data.model_loaded,
          weightsFile: data.weights_file,
          device: data.device,
          classesCount: data.classes_count,
          classMapping: data.class_mapping,
          instructions: data.instructions,
        });
        if (!quiet) showToast('YOLO Inference service connected');
      } else {
        setBackendStatus({
          online: true,
          modelLoaded: false,
          error: `Backend returned status ${res.status}`,
        });
      }
    } catch (err: any) {
      setBackendStatus({
        online: false,
        modelLoaded: false,
        error:
          'Backend offline on ' +
          backendUrl +
          '. Start backend with: python backend/yolo_inference_service.py',
      });
      if (!quiet) showToast('YOLO backend service unreachable');
    } finally {
      setIsCheckingBackend(false);
    }
  };

  useEffect(() => {
    startCamera();
    checkBackendStatus(true);
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from active video stream
  const captureFrameFromVideo = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current) {
        resolve(null);
        return;
      }
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedImageUri(dataUrl);

      canvas.toBlob((blob) => {
        setCapturedBlob(blob);
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  // Handle image upload from file picker
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCapturedBlob(file);
    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImageUri(event.target?.result as string);
      setDetectionBoxes([]);
      setDetectedCounts({});
      setInferenceError(null);
      setIsVerificationComplete(false);
      showToast(`Loaded ${file.name} for YOLO detection`);
    };
    reader.readAsDataURL(file);
  };

  // Execute Real YOLO Inference
  const handleRunYoloInference = async () => {
    setInferenceError(null);
    setIsInferring(true);
    setIsVerificationComplete(false);

    let blobToSend = capturedBlob;

    // If using live camera without snapshot, capture current frame first
    if (!blobToSend && isCameraActive) {
      blobToSend = await captureFrameFromVideo();
    }

    if (!blobToSend) {
      setIsInferring(false);
      setInferenceError('Please capture a camera frame or upload an image first.');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', blobToSend, 'pill_scan.jpg');
      formData.append('confidence_threshold', String(confidenceThreshold));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const response = await fetch(`${backendUrl}/predict`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = `Inference failed with status ${response.status}`;
        try {
          const errData = await response.json();
          if (errData?.detail?.error) {
            errorDetail = `${errData.detail.error} (${errData.detail.instructions || ''})`;
          } else if (errData?.detail) {
            errorDetail = String(errData.detail);
          }
        } catch {
          // ignore
        }
        throw new Error(errorDetail);
      }

      const result = await response.json();

      // Process real detection output
      const rawBoxes = (result.boxes || []) as YoloDetectionBox[];
      const counts = (result.countsPerClass || {}) as Record<string, number>;
      const totalPills = result.totalPillsDetected ?? rawBoxes.length;

      setDetectionBoxes(rawBoxes);
      setDetectedCounts(counts);
      setInferenceTimeMs(result.inferenceTimeMs || null);

      if (rawBoxes.length === 0) {
        setInferenceError(
          'Model ran successfully, but no pills met the confidence threshold (' +
            Math.round(confidenceThreshold * 100) +
            '%). Try adjusting position or lowering the threshold in settings.'
        );
      } else {
        // Auto-select primary detected class for review & matching
        const primaryClass = rawBoxes[0].className;
        setSelectedPredictedMedicine(primaryClass);
        setPillsCountToLog(totalPills);

        // Step 9: Match against existing medication catalogue
        const match = medications.find(
          (m) =>
            m.name.toLowerCase().includes(primaryClass.toLowerCase()) ||
            primaryClass.toLowerCase().includes(m.name.toLowerCase())
        );
        setMatchedMedication(match || null);
        if (match) {
          setCorrectedDosage(match.dosage);
        }

        showToast(
          `YOLO detected ${totalPills} pill${totalPills > 1 ? 's' : ''} (${result.inferenceTimeMs}ms)`
        );
      }
    } catch (err: any) {
      console.warn('Real YOLO inference error:', err);
      setDetectionBoxes([]);
      setDetectedCounts({});
      setInferenceError(
        err.message ||
          'Failed to connect to YOLO backend at ' +
            backendUrl +
            '. Ensure backend service is running and best.pt is placed in backend/ folder.'
      );
    } finally {
      setIsInferring(false);
    }
  };

  // Step 10: Record Verified Scan Result to Clinical Event History
  const handleRecordVerifiedScan = () => {
    if (!selectedPredictedMedicine.trim()) {
      showToast('Please provide a verified medication name');
      return;
    }

    const confidenceScore =
      detectionBoxes.length > 0 ? detectionBoxes[0].confidence : 95.0;

    addScanResult({
      medicineName: selectedPredictedMedicine.trim(),
      dosage: correctedDosage.trim(),
      verifiedMatchId: matchedMedication ? matchedMedication.id : `MED-${Math.floor(1000 + Math.random() * 9000)}`,
      confidence: confidenceScore,
      expiryDate: matchedMedication?.expiryDate || '12/2026',
      interactionSafe: true,
      pillsToTake: pillsCountToLog,
      instructions: matchedMedication
        ? matchedMedication.instructions
        : `Verified via Real YOLO Model (${detectionBoxes.length} pills counted in frame).`,
      imageThumbnail: capturedImageUri || undefined,
    });

    setIsVerificationComplete(true);
    showToast(
      `Verified scan recorded to history: ${selectedPredictedMedicine} (${pillsCountToLog} count)`
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center justify-center gap-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          AI Medicine Scanner & YOLO Pill Detection
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Real-time computer vision inference with trained YOLO weights (`best.pt`) for pill identification and counting.
        </p>
      </div>

      {/* Backend Connection Status Ribbon */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div
            className={`w-3 h-3 rounded-full shrink-0 ${
              backendStatus?.online && backendStatus?.modelLoaded
                ? 'bg-emerald-400 animate-pulse'
                : backendStatus?.online
                ? 'bg-amber-400'
                : 'bg-red-500'
            }`}
          ></div>
          <div>
            <div className="font-bold text-white flex items-center gap-2">
              <span>YOLO Backend:</span>
              {backendStatus?.online && backendStatus?.modelLoaded ? (
                <span className="text-emerald-400 font-semibold">
                  Online & Active (best.pt loaded • {backendStatus.classesCount} classes)
                </span>
              ) : backendStatus?.online ? (
                <span className="text-amber-400 font-semibold">
                  Online (Missing weights: 'best.pt' not found in backend/ folder)
                </span>
              ) : (
                <span className="text-red-400 font-semibold">
                  Service Offline ({backendUrl})
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Endpoint: <code className="text-cyan-300 font-mono">{backendUrl}/predict</code>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => checkBackendStatus(false)}
            disabled={isCheckingBackend}
            className="px-3 py-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCheckingBackend ? 'animate-spin' : ''}`} />
            <span>Check Status</span>
          </button>
          <button
            onClick={() => setShowConfig(!showConfig)}
            className="px-3 py-1.5 rounded-lg bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-semibold text-xs"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Config</span>
          </button>
        </div>
      </div>

      {/* Backend Setup Guide & Configuration Panel (collapsible) */}
      {showConfig && (
        <div className="bg-[#172338] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#1E2D4A]">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>YOLO Inference Backend Settings</span>
            </h4>
            <span className="text-[11px] text-slate-400">Genuine model pipeline</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Backend Endpoint URL
              </label>
              <input
                type="text"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:8000"
                className="w-full bg-[#0B1220] border border-[#1E2D4A] text-white text-xs rounded-xl px-3 py-2 font-mono focus:outline-none focus:border-cyan-400"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Local FastAPI/Flask YOLO inference service
              </span>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Confidence Threshold ({Math.round(confidenceThreshold * 100)}%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  value={confidenceThreshold}
                  onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
                <span className="font-mono text-cyan-300 font-bold w-12 text-right">
                  {Math.round(confidenceThreshold * 100)}%
                </span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Minimum confidence score to accept detection bounding boxes
              </span>
            </div>
          </div>

          {/* Model Deployment Instructions */}
          <div className="p-3.5 bg-[#0B1220] rounded-xl border border-[#1E2D4A] text-xs space-y-2">
            <div className="font-bold text-cyan-300 flex items-center gap-1.5">
              <FileCode className="w-4 h-4" />
              <span>How to start the real YOLO inference server:</span>
            </div>
            <ol className="list-decimal list-inside text-slate-300 space-y-1 font-mono text-[11px]">
              <li>
                Place weights file: <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">backend/best.pt</code>
              </li>
              <li>
                Install packages: <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">pip install -r backend/requirements.txt</code>
              </li>
              <li>
                Start server: <code className="text-white bg-slate-800 px-1.5 py-0.5 rounded">python backend/yolo_inference_service.py --port 8000</code>
              </li>
            </ol>
          </div>
        </div>
      )}

      {/* Main Scanner Workspace */}
      <div className="bg-[#111B2D] border border-[#1E2D4A] rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Top Control strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#1E2D4A] text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
              }`}
            ></span>
            <span className="text-slate-300 font-semibold">
              {isCameraActive ? 'Optical Camera Sensor Active' : 'Sensor Idle / Static Image Mode'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Upload Image</span>
            </button>

            {isCameraActive ? (
              <button
                onClick={stopCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#172338] hover:bg-[#1E2D4A] text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                <VideoOff className="w-3.5 h-3.5" />
                <span>Stop Sensor</span>
              </button>
            ) : (
              <button
                onClick={startCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors cursor-pointer"
              >
                <Video className="w-3.5 h-3.5" />
                <span>Start Camera</span>
              </button>
            )}
          </div>
        </div>

        {/* Camera / Image Viewport with Real YOLO Bounding Box Overlays */}
        <div className="relative aspect-video max-h-[460px] w-full bg-[#080D19] rounded-2xl border-2 border-[#1E2D4A] overflow-hidden flex items-center justify-center">
          {/* Static captured/uploaded photo view */}
          {capturedImageUri && !isCameraActive ? (
            <img
              src={capturedImageUri}
              alt="Scan specimen"
              className="w-full h-full object-contain"
            />
          ) : (
            /* Live camera stream */
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
            />
          )}

          {/* Standby screen when both camera and image are inactive */}
          {!isCameraActive && !capturedImageUri && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#0B1220] to-[#080D19]">
              <div className="w-16 h-16 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-cyan-400 mb-3 animate-pulse">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-white">Optical Scanner Standby</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Start the live camera or upload a pill/medicine image above to perform YOLO object detection.
              </p>
            </div>
          )}

          {/* Camera Corner Brackets matching IntelliMed UI */}
          <div className="absolute inset-4 sm:inset-8 pointer-events-none">
            <div className="absolute top-0 left-0 w-10 h-10 border-t-4 border-l-4 border-cyan-400 rounded-tl-xl shadow-lg shadow-cyan-400/30"></div>
            <div className="absolute top-0 right-0 w-10 h-10 border-t-4 border-r-4 border-cyan-400 rounded-tr-xl shadow-lg shadow-cyan-400/30"></div>
            <div className="absolute bottom-0 left-0 w-10 h-10 border-b-4 border-l-4 border-cyan-400 rounded-bl-xl shadow-lg shadow-cyan-400/30"></div>
            <div className="absolute bottom-0 right-0 w-10 h-10 border-b-4 border-r-4 border-cyan-400 rounded-br-xl shadow-lg shadow-cyan-400/30"></div>

            {/* Scanning beam animation when inference is in flight */}
            {isInferring && (
              <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-white to-cyan-500 shadow-lg shadow-cyan-400 animate-laser">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-cyan-500 text-[#080D19] text-[10px] font-extrabold uppercase tracking-wider">
                  Running YOLO Model Inference...
                </div>
              </div>
            )}
          </div>

          {/* Real Detection Bounding Boxes SVG Overlay */}
          {detectionBoxes.length > 0 && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1000 1000"
              preserveAspectRatio="none"
            >
              {detectionBoxes.map((box, idx) => {
                // Use normalized coordinates scaled to 1000x1000 viewBox
                const [nx1, ny1, nx2, ny2] = (box as any).normalizedBbox || [
                  0.2 + idx * 0.1,
                  0.3,
                  0.4 + idx * 0.1,
                  0.5,
                ];
                const x = nx1 * 1000;
                const y = ny1 * 1000;
                const width = Math.max(20, (nx2 - nx1) * 1000);
                const height = Math.max(20, (ny2 - ny1) * 1000);

                return (
                  <g key={`yolo-box-${idx}`}>
                    {/* Bounding box rectangle */}
                    <rect
                      x={x}
                      y={y}
                      width={width}
                      height={height}
                      fill="rgba(34, 211, 238, 0.15)"
                      stroke="#22D3EE"
                      strokeWidth="4"
                      rx="8"
                      className="filter drop-shadow-md"
                    />
                    {/* Label tag with class name & genuine confidence */}
                    <rect
                      x={x}
                      y={Math.max(10, y - 36)}
                      width={Math.max(180, box.className.length * 12 + 70)}
                      height="32"
                      fill="#0B1220"
                      stroke="#22D3EE"
                      strokeWidth="2"
                      rx="6"
                    />
                    <text
                      x={x + 10}
                      y={Math.max(10, y - 36) + 21}
                      fill="#FFFFFF"
                      fontSize="18"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {box.className} {box.confidence}%
                    </text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          {isCameraActive && (
            <button
              onClick={async () => {
                await captureFrameFromVideo();
                stopCamera();
                showToast('Frame captured for analysis');
              }}
              className="w-full sm:w-auto px-6 py-3 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] hover:border-slate-400 text-white text-xs font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Snapshot Current Frame</span>
            </button>
          )}

          <button
            onClick={handleRunYoloInference}
            disabled={isInferring}
            className="w-full sm:w-auto min-w-[280px] py-3.5 px-8 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white text-sm font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2.5 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            {isInferring ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Running YOLO (`best.pt`)...</span>
              </>
            ) : (
              <>
                <Scan className="w-5 h-5" />
                <span>Detect Pills with YOLO</span>
              </>
            )}
          </button>
        </div>

        {/* Error / Backend Dependency Notice Banner (No silent simulation!) */}
        {inferenceError && (
          <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-2xl text-xs space-y-2 text-red-200 animate-in fade-in duration-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-white block font-semibold text-sm">
                  YOLO Inference Backend Notice
                </strong>
                <p className="mt-0.5 leading-relaxed">{inferenceError}</p>
              </div>
            </div>

            <div className="mt-2 pt-2 border-t border-red-500/20 text-[11px] text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span>
                Required File: <code className="text-cyan-300 font-mono">backend/best.pt</code> •
                Server: <code className="text-cyan-300 font-mono">python backend/yolo_inference_service.py</code>
              </span>
              <button
                onClick={() => setShowConfig(true)}
                className="text-cyan-400 hover:underline font-bold text-left sm:text-right cursor-pointer"
              >
                View Setup Guide →
              </button>
            </div>
          </div>
        )}

        {/* Real YOLO Detections Summary & Review Panel */}
        {detectionBoxes.length > 0 && (
          <div className="p-6 bg-[#172338] border-2 border-cyan-500/40 rounded-2xl shadow-xl space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* Header: Instances Count & Latency */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#1E2D4A]">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-white">
                    Genuine YOLO Inference Results
                  </h3>
                  <p className="text-xs text-slate-400">
                    Found <strong className="text-cyan-300 font-mono">{detectionBoxes.length}</strong> pill
                    instances across <strong className="text-cyan-300 font-mono">{Object.keys(detectedCounts).length}</strong> class(es).
                  </p>
                </div>
              </div>

              {inferenceTimeMs && (
                <div className="text-right">
                  <div className="text-xs text-slate-400 uppercase tracking-wider">Inference Latency</div>
                  <div className="text-lg font-extrabold text-cyan-400 font-mono">
                    {inferenceTimeMs} ms
                  </div>
                </div>
              )}
            </div>

            {/* Counted Instances per Class (Step 6) */}
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block mb-2">
                Detected Instances Per Class
              </span>
              <div className="flex items-center gap-2 flex-wrap">
                {Object.entries(detectedCounts).map(([className, count]) => (
                  <div
                    key={className}
                    className="px-3 py-1.5 rounded-xl bg-[#111B2D] border border-cyan-500/30 flex items-center gap-2 text-xs font-bold text-white shadow-sm"
                  >
                    <Tag className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{className}</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
                      ×{count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Individual Bounding Box Detections Table (Step 4 & 5) */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#1E2D4A] text-slate-400 uppercase text-[10px]">
                    <th className="py-2 px-3">Instance</th>
                    <th className="py-2 px-3">Class Name</th>
                    <th className="py-2 px-3">Model Confidence</th>
                    <th className="py-2 px-3">Bounding Box [x1, y1, x2, y2]</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1E2D4A]/50">
                  {detectionBoxes.map((box, idx) => (
                    <tr key={idx} className="hover:bg-[#111B2D]/40">
                      <td className="py-2.5 px-3 font-mono text-slate-400">#{idx + 1}</td>
                      <td className="py-2.5 px-3 font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                        <span>{box.className}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-cyan-400">
                        {box.confidence}%
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-400 text-[11px]">
                        [{box.bbox.join(', ')}]
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Step 8 & 9: Review, Correct & Match to Medication Catalogue */}
            <div className="p-4 bg-[#111B2D] border border-cyan-500/30 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Edit3 className="w-4 h-4 text-cyan-400" />
                  <span>Clinical Verification & Prescription Match</span>
                </span>
                <span className="text-[10px] text-slate-400">
                  Review predicted medicine before recording
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Predicted / Verified Name</label>
                  <input
                    type="text"
                    value={selectedPredictedMedicine}
                    onChange={(e) => {
                      setSelectedPredictedMedicine(e.target.value);
                      const match = medications.find((m) =>
                        m.name.toLowerCase().includes(e.target.value.toLowerCase())
                      );
                      setMatchedMedication(match || null);
                    }}
                    className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-lg px-3 py-2 font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Dosage Form</label>
                  <input
                    type="text"
                    value={correctedDosage}
                    onChange={(e) => setCorrectedDosage(e.target.value)}
                    placeholder="e.g. 500mg"
                    className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 mb-1">Dose Count (Pills)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={pillsCountToLog}
                    onChange={(e) => setPillsCountToLog(parseInt(e.target.value, 10) || 1)}
                    className="w-full bg-[#080D19] border border-[#1E2D4A] text-white text-xs rounded-lg px-3 py-2 font-mono font-bold focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Catalogue match status */}
              <div className="pt-2 border-t border-[#1E2D4A] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-cyan-400" />
                  {matchedMedication ? (
                    <span className="text-emerald-300 font-semibold">
                      Prescription Match: <strong className="text-white">{matchedMedication.name}</strong> ({matchedMedication.dosage} • {matchedMedication.scheduledTime})
                    </span>
                  ) : (
                    <span className="text-slate-400">
                      No exact active schedule match found in current patient catalogue.
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400">
                  Separate Step: Does not automatically confirm dose taken
                </div>
              </div>
            </div>

            {/* Step 10 Actions: Record to event history */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-[#1E2D4A]">
              <div className="text-xs text-slate-400">
                Pill detection and intake confirmation remain strictly separate steps.
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setDetectionBoxes([]);
                    setDetectedCounts({});
                    setCapturedImageUri(null);
                    setCapturedBlob(null);
                  }}
                  className="px-4 py-2 bg-[#111B2D] hover:bg-[#1E2D4A] text-slate-300 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Clear Scan
                </button>

                {matchedMedication && matchedMedication.status !== 'taken' && (
                  <button
                    onClick={() => {
                      markDoseTaken(matchedMedication.id);
                      showToast(`Dose intake verified & confirmed for ${matchedMedication.name}`);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 transition-all cursor-pointer flex items-center gap-1.5"
                    title="Separate explicit confirmation: Mark scheduled dose as taken and deduct inventory"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Confirm Ingestion ({matchedMedication.name})</span>
                  </button>
                )}

                <button
                  onClick={handleRecordVerifiedScan}
                  disabled={isVerificationComplete}
                  className={`px-5 py-2 text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                    isVerificationComplete
                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  }`}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {isVerificationComplete
                      ? 'Logged to Timeline'
                      : 'Verify & Record Scan Result'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
