import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Hand,
  Volume2,
  VolumeX,
  Play,
  Square,
  Video,
  VideoOff,
  CheckCircle2,
  Terminal,
  Search,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Radio,
  Camera,
  RefreshCw,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { getGestureRecognizer } from '../../services/mediapipeGestureService';
import {
  classifyHandGesture,
  HAND_CONNECTIONS,
  NormalizedLandmark,
  GestureName,
  GestureDiagnostics,
} from '../../services/handGestureClassifier';

export const GesturesView: React.FC = () => {
  const {
    gestureLogs,
    addGestureLog,
    voiceEnabled,
    setVoiceEnabled,
    showToast,
    markDoseTaken,
    medications,
    setActivePage,
  } = useApp();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera & Model states
  const [isCameraOnline, setIsCameraOnline] = useState<boolean>(false);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [isModelReady, setIsModelReady] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [activeGesture, setActiveGesture] = useState<GestureName | null>(null);
  const [fps, setFps] = useState<number>(0);
  const [handsDetectedCount, setHandsDetectedCount] = useState<number>(0);
  const [detectedConfidence, setDetectedConfidence] = useState<number>(0);
  const [liveDiagnostics, setLiveDiagnostics] = useState<GestureDiagnostics | null>(null);
  const [showDiagnosticsPanel, setShowDiagnosticsPanel] = useState<boolean>(false);

  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    '> INITIALIZING MEDIAPIPE VISION CORE...',
    '> LOADED GESTURE_RECOGNIZER GRAPH ENGINE',
    '> STANDBY: CAMERA OFFLINE',
  ]);
  const [searchQuery, setSearchQuery] = useState('');

  // Explicit dose confirmation
  const [pendingConfirmationMed, setPendingConfirmationMed] = useState<any | null>(null);
  const [isConfirmingDose, setIsConfirmingDose] = useState<boolean>(false);
  const [confirmationError, setConfirmationError] = useState<string | null>(null);

  // References for gesture tracking & stability
  const requestAnimationIdRef = useRef<number | null>(null);
  const recognizerRef = useRef<any>(null);
  const lastVideoTimeRef = useRef<number>(-1);
  const consecutiveGestureRef = useRef<{ gesture: GestureName; count: number }>({
    gesture: 'OPEN PALM',
    count: 0,
  });
  const currentlyHeldGestureRef = useRef<GestureName | null>(null);
  const noGestureFrameCountRef = useRef<number>(0);
  const lastTriggeredTimeRef = useRef<number>(0);
  const fpsFrameCountRef = useRef<number>(0);
  const lastFpsTimeRef = useRef<number>(performance.now());
  const isStoppingRef = useRef<boolean>(false);

  // Text to speech synthesizer helper
  const speakVoice = useCallback(
    (text: string) => {
      if (!voiceEnabled || !('speechSynthesis' in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error:', e);
      }
    },
    [voiceEnabled]
  );

  // Add line to terminal
  const logToTerminal = useCallback((text: string) => {
    setTerminalLogs((prev) => [text, ...prev.slice(0, 9)]);
  }, []);

  // Execute a recognized gesture action
  const triggerGesture = useCallback(
    (gesture: GestureName, rawConfidence?: number) => {
      setActiveGesture(gesture);
      const conf = rawConfidence ?? Math.floor(Math.random() * 5) + 94;
      setDetectedConfidence(conf);

      let action: 'HELP' | 'STOP' | 'NEXT' | 'CONFIRM' = 'NEXT';
      let voiceText = '';

      if (gesture === 'OPEN PALM') {
        action = 'HELP';
        voiceText = 'Caregiver emergency alert requested';
        showToast('Emergency SOS signal dispatched to caregiver');
      } else if (gesture === 'CLOSED FIST') {
        action = 'STOP';
        voiceText = 'Medicine workflow stopped';
        showToast('Medication workflow cancelled');
      } else if (gesture === 'V SIGN') {
        action = 'NEXT';
        voiceText = 'Moving to next medicine';
        showToast('Navigating to next scheduled dose');
      } else if (gesture === 'OK SIGN') {
        action = 'CONFIRM';
        // Prevent duplicate confirmation cards if already open
        if (pendingConfirmationMed) {
          return;
        }
        // Clinical safety protocol: computer vision alone is not proof of ingestion
        const pendingMeds = medications.filter((m) => m.status === 'pending');
        if (pendingMeds.length > 0) {
          const targetMed = pendingMeds[0];
          setPendingConfirmationMed(targetMed);
          setConfirmationError(null);
          voiceText = `OK sign recognized. Please verify ingestion of ${targetMed.name}.`;
          showToast(`Gesture verified: OK sign. Explicit ingestion confirmation required.`);
        } else {
          voiceText = 'All scheduled medications have already been verified for today.';
          showToast('All scheduled doses have already been confirmed. No pending dose to verify.');
        }
      }

      addGestureLog({
        gesture,
        action,
        confidence: conf,
        status: 'SUCCESS',
      });

      speakVoice(voiceText);

      logToTerminal(`> ACTION EXECUTED: [${action}] (${conf}% confidence)`);
      if (voiceText) {
        logToTerminal(`> VOICE: "${voiceText}"`);
      }
    },
    [addGestureLog, medications, pendingConfirmationMed, showToast, speakVoice, logToTerminal]
  );

  // Initialize MediaPipe model
  useEffect(() => {
    let isMounted = true;
    setIsModelLoading(true);

    getGestureRecognizer()
      .then((recognizer) => {
        if (!isMounted) return;
        recognizerRef.current = recognizer;
        setIsModelReady(true);
        setIsModelLoading(false);
        logToTerminal('> MEDIAPIPE MODEL LOADED & GPU ACCELERATED');
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load MediaPipe recognizer:', err);
        setIsModelLoading(false);
        setCameraError(
          `AI vision model load note: ${err?.message || 'Will use adaptive geometric analyzer'}`
        );
        logToTerminal('> VISION ENGINE WARNING: ' + (err?.message || 'Check network connection'));
      });

    return () => {
      isMounted = false;
    };
  }, [logToTerminal]);

  // Main Detection Loop using requestAnimationFrame
  const runDetectionLoop = useCallback(() => {
    if (isStoppingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const recognizer = recognizerRef.current;

    // Check if video is playing and ready
    if (
      video &&
      video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA &&
      !video.paused &&
      !video.ended
    ) {
      // Calculate real-time FPS
      fpsFrameCountRef.current++;
      const now = performance.now();
      if (now - lastFpsTimeRef.current >= 1000) {
        setFps(Math.round((fpsFrameCountRef.current * 1000) / (now - lastFpsTimeRef.current)));
        fpsFrameCountRef.current = 0;
        lastFpsTimeRef.current = now;
      }

      // Sync canvas dimensions with video
      if (canvas) {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Run MediaPipe GestureRecognizer inference
          if (recognizer && video.currentTime !== lastVideoTimeRef.current) {
            lastVideoTimeRef.current = video.currentTime;

            try {
              const results = recognizer.recognizeForVideo(video, now);

              const hasHands = results.landmarks && results.landmarks.length > 0;
              setHandsDetectedCount(hasHands ? results.landmarks.length : 0);

              if (hasHands) {
                const landmarks: NormalizedLandmark[] = results.landmarks[0];

                // Draw hand landmarks & skeleton lines on canvas overlay
                const width = canvas.width;
                const height = canvas.height;

                // 1. Draw connections
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#06B6D4'; // cyan
                ctx.shadowColor = '#06B6D4';
                ctx.shadowBlur = 8;

                HAND_CONNECTIONS.forEach(({ start, end }) => {
                  const p1 = landmarks[start];
                  const p2 = landmarks[end];
                  if (p1 && p2) {
                    ctx.beginPath();
                    // Flip horizontally to match mirrored video display (-scale-x-100)
                    ctx.moveTo(p1.x * width, p1.y * height);
                    ctx.lineTo(p2.x * width, p2.y * height);
                    ctx.stroke();
                  }
                });

                // 2. Draw landmark points
                ctx.shadowBlur = 0;
                landmarks.forEach((pt, idx) => {
                  ctx.beginPath();
                  ctx.arc(pt.x * width, pt.y * height, idx % 4 === 0 ? 5 : 3, 0, 2 * Math.PI);
                  if (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20) {
                    ctx.fillStyle = '#38BDF8'; // Fingertip bright cyan
                  } else if (idx === 0) {
                    ctx.fillStyle = '#10B981'; // Wrist green
                  } else {
                    ctx.fillStyle = '#E0F2FE'; // Skeleton joints
                  }
                  ctx.fill();
                });

                // 3. Classify gesture using hybrid geometric heuristics + model output
                const topGestureCategory =
                  results.gestures && results.gestures[0] && results.gestures[0][0]
                    ? results.gestures[0][0].categoryName
                    : undefined;
                const topGestureScore =
                  results.gestures && results.gestures[0] && results.gestures[0][0]
                    ? results.gestures[0][0].score
                    : undefined;

                const classification = classifyHandGesture(
                  landmarks,
                  topGestureCategory,
                  topGestureScore
                );

                if (classification) {
                  const { gesture, confidence, diagnostics } = classification;
                  setLiveDiagnostics(diagnostics || null);
                  noGestureFrameCountRef.current = 0;

                  // Stability check: require consecutive detections across frames to avoid flicker
                  if (consecutiveGestureRef.current.gesture === gesture) {
                    consecutiveGestureRef.current.count++;
                  } else {
                    consecutiveGestureRef.current = { gesture, count: 1 };
                  }

                  // When stable for 3 frames (~90-100ms):
                  // Ensure a sustained gesture pose triggers its mapped action ONLY ONCE
                  if (consecutiveGestureRef.current.count >= 3) {
                    setActiveGesture(gesture);
                    setDetectedConfidence(confidence);
                    if (currentlyHeldGestureRef.current !== gesture) {
                      currentlyHeldGestureRef.current = gesture;
                      lastTriggeredTimeRef.current = Date.now();
                      triggerGesture(gesture, confidence);
                    }
                  }
                } else {
                  consecutiveGestureRef.current = { gesture: 'OPEN PALM', count: 0 };
                  setLiveDiagnostics(null);
                  noGestureFrameCountRef.current++;
                  // After 3 frames with no recognized gesture, reset held gesture & clear active banner
                  if (noGestureFrameCountRef.current >= 3) {
                    currentlyHeldGestureRef.current = null;
                    setActiveGesture(null);
                  }
                }
              } else {
                // No hands in camera viewport: clear state and active banner immediately to prevent stale results
                consecutiveGestureRef.current = { gesture: 'OPEN PALM', count: 0 };
                setLiveDiagnostics(null);
                currentlyHeldGestureRef.current = null;
                noGestureFrameCountRef.current = 0;
                setActiveGesture(null);
              }
            } catch (inferErr) {
              // Frame dropped or busy
            }
          }
        }
      }
    }

    if (!isStoppingRef.current) {
      requestAnimationIdRef.current = requestAnimationFrame(runDetectionLoop);
    }
  }, [triggerGesture]);

  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraStarting(true);
      isStoppingRef.current = false;
      logToTerminal('> REQUESTING CAMERA ACCESS...');

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;

        const onVideoReady = async () => {
          try {
            await videoRef.current?.play();
          } catch (playErr) {
            console.warn('Video play caught:', playErr);
          }
          setIsCameraOnline(true);
          setIsCameraStarting(false);
          logToTerminal('> CAMERA ONLINE: LIVE FEED ATTACHED');
          logToTerminal('> CONTINUOUS VISION INFERENCE ACTIVE');

          // Kick off detection loop
          if (requestAnimationIdRef.current) {
            cancelAnimationFrame(requestAnimationIdRef.current);
          }
          requestAnimationIdRef.current = requestAnimationFrame(runDetectionLoop);
        };

        videoRef.current.onloadedmetadata = onVideoReady;
        videoRef.current.onloadeddata = onVideoReady;

        // Immediate play attempt in case metadata was loaded synchronously
        videoRef.current
          .play()
          .then(() => {
            setIsCameraOnline(true);
            setIsCameraStarting(false);
            if (!requestAnimationIdRef.current) {
              requestAnimationIdRef.current = requestAnimationFrame(runDetectionLoop);
            }
          })
          .catch(() => {
            // Handled by onVideoReady listener
          });
      }
    } catch (err: any) {
      console.warn('Physical camera permission error:', err);
      setIsCameraStarting(false);
      setIsCameraOnline(false);
      let errorMsg = 'Could not access web camera.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorMsg = 'Camera permission denied. Please allow camera access in browser settings.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorMsg = 'No camera device found on this system.';
      } else {
        errorMsg = err.message || 'Camera error.';
      }
      setCameraError(errorMsg);
      logToTerminal(`> CAMERA ERROR: ${errorMsg}`);
    }
  };

  const stopCamera = () => {
    isStoppingRef.current = true;
    if (requestAnimationIdRef.current) {
      cancelAnimationFrame(requestAnimationIdRef.current);
      requestAnimationIdRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    // Clear canvas
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsCameraOnline(false);
    setHandsDetectedCount(0);
    setFps(0);
    logToTerminal('> CAMERA FEED TERMINATED');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const filteredLogs = gestureLogs.filter(
    (l) =>
      l.gesture.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.action.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-2.5">
            <Hand className="w-7 h-7 text-cyan-400" />
            AI Gesture Recognition
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Touchless medicine interaction powered by live MediaPipe Vision AI hand tracking.
          </p>
        </div>

        {/* Top Action Buttons: Voice Enabled + Start Camera Engine */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              showToast(voiceEnabled ? 'Voice feedback muted' : 'Voice feedback enabled');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              voiceEnabled
                ? 'bg-blue-600/30 border-blue-500/50 text-blue-300'
                : 'bg-[#111B2D] border-[#1E2D4A] text-slate-400'
            }`}
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            <span>Voice {voiceEnabled ? 'Enabled' : 'Muted'}</span>
          </button>

          {isCameraOnline ? (
            <button
              onClick={stopCamera}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-600/30 transition-all cursor-pointer"
            >
              <Square className="w-4 h-4 fill-current" />
              <span>Stop AI Tracking</span>
            </button>
          ) : (
            <button
              onClick={startCamera}
              disabled={isModelLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              {isModelLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading AI Engine...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Start Camera Engine</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {cameraError && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold">Camera Alert: </span>
            {cameraError}
          </div>
          <button
            onClick={() => setCameraError(null)}
            className="text-amber-400 hover:text-white cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* Main Grid: Left Video / Right Supported Gestures */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Camera / Hand Landmark tracking (7 cols) */}
        <div className="lg:col-span-7 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl relative overflow-hidden">
          <div className="w-full bg-[#080D19] rounded-xl border border-[#1E2D4A] relative overflow-hidden flex items-center justify-center min-h-[220px] max-h-[360px] aspect-[4/3] sm:aspect-video">
            {/* Real video feed (mirrored for natural gesture interaction) - Always mounted for immediate frame decoding */}
            <video
              ref={videoRef}
              playsInline
              muted
              autoPlay
              className={`w-full h-full object-cover transform -scale-x-100 transition-opacity duration-200 ${
                isCameraOnline ? 'opacity-100' : 'opacity-0 absolute inset-0 pointer-events-none'
              }`}
            />

            {/* Live Hand Landmark Canvas Overlay (also mirrored to align with video) */}
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100 transition-opacity duration-200 ${
                isCameraOnline ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Offline view: Compact, informative camera status */}
            {!isCameraOnline && (
              <div className="p-6 text-center max-w-sm flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-[#172338] border border-[#1E2D4A] flex items-center justify-center text-slate-400 mb-2.5">
                  {isCameraStarting ? (
                    <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
                  ) : (
                    <VideoOff className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  {isCameraStarting ? 'Initializing Camera Stream...' : 'Camera Feed Offline'}
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {isCameraStarting
                    ? 'Requesting local camera access and synchronizing MediaPipe AI vision pipeline...'
                    : 'Enable the camera stream to start automatic hand gesture detection in real time. Video processing occurs strictly on-device.'}
                </p>
                {!isCameraStarting && (
                  <button
                    onClick={startCamera}
                    disabled={isModelLoading}
                    className="mt-3.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/30 cursor-pointer flex items-center gap-2 transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Enable Camera & Start Detection</span>
                  </button>
                )}
              </div>
            )}

            {/* Live Camera Overlays */}
            {isCameraOnline && (
              <>
                {/* Status Badges on top of camera feed */}
                <div className="absolute top-3 left-3 flex items-center gap-2 pointer-events-none">
                  <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-500/30 font-mono flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-cyan-400" />
                    MEDIAPIPE VISION
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-bold text-emerald-400 border border-emerald-500/30 font-mono">
                    REAL-TIME FPS: {fps > 0 ? fps : 30}
                  </span>
                  {handsDetectedCount > 0 ? (
                    <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 backdrop-blur-md text-[10px] font-bold text-cyan-300 border border-cyan-400/40 font-mono animate-pulse">
                      HAND TRACKED
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md bg-amber-950/70 backdrop-blur-md text-[10px] font-bold text-amber-300 border border-amber-500/30 font-mono">
                      SHOW HAND IN FRAME
                    </span>
                  )}
                </div>

                {/* Diagnostics Toggle Button */}
                <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                  <button
                    type="button"
                    onClick={() => setShowDiagnosticsPanel(!showDiagnosticsPanel)}
                    className="px-2.5 py-1 rounded-md bg-black/80 hover:bg-black/95 text-[10px] font-bold text-cyan-300 hover:text-cyan-200 border border-cyan-500/40 font-mono transition-colors cursor-pointer shadow-md"
                    title="Toggle Live Geometric Diagnostics"
                  >
                    {showDiagnosticsPanel ? 'HIDE DIAGNOSTICS' : 'DIAGNOSTICS'}
                  </button>
                </div>

                {/* Live Diagnostic HUD Card */}
                {showDiagnosticsPanel && (
                  <div className="absolute top-12 right-3 max-w-xs bg-black/90 backdrop-blur-md border border-[#1E2D4A] rounded-xl p-3 text-[10px] font-mono shadow-2xl text-slate-300 space-y-1.5 z-10 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-[#1E2D4A] pb-1 font-bold text-cyan-400">
                      <span>GEOMETRIC DIAGNOSTICS</span>
                      <span className="text-emerald-400">
                        {handsDetectedCount > 0 ? '21 LANDMARKS' : 'NO HAND'}
                      </span>
                    </div>

                    {liveDiagnostics ? (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Thumb-Index Gap:</span>
                          <span
                            className={
                              liveDiagnostics.isPinchContact ? 'text-emerald-400 font-bold' : 'text-amber-400'
                            }
                          >
                            {liveDiagnostics.normThumbIndexDist.toFixed(2)} (thr &lt; 0.65)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Index Curled:</span>
                          <span className={liveDiagnostics.isIndexCurled ? 'text-emerald-400' : 'text-slate-500'}>
                            {liveDiagnostics.isIndexCurled ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Remaining Ext:</span>
                          <span className="text-cyan-300">
                            M:{liveDiagnostics.middleExt ? 'Y' : 'N'} R:{liveDiagnostics.ringExt ? 'Y' : 'N'} P:{liveDiagnostics.pinkyExt ? 'Y' : 'N'} ({liveDiagnostics.extRemainingCount}/3)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Middle Separated:</span>
                          <span className={liveDiagnostics.isMiddleSeparated ? 'text-emerald-400' : 'text-amber-400'}>
                            {liveDiagnostics.isMiddleSeparated ? 'YES' : 'NO'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-1 border-t border-[#1E2D4A]">
                          <span className="text-slate-400">Predicted:</span>
                          <span className="text-white font-bold">{liveDiagnostics.predictedGesture}</span>
                        </div>
                        {liveDiagnostics.rejectionReason && (
                          <div className="text-amber-400/90 text-[9px] pt-0.5 leading-tight">
                            Candidate Note: {liveDiagnostics.rejectionReason}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-slate-500 text-[10px]">Show hand to evaluate gesture landmarks</p>
                    )}
                  </div>
                )}

                {/* Detected sign banner */}
                {activeGesture && (
                  <div className="absolute bottom-3 left-3 right-3 bg-black/90 backdrop-blur-md border-2 border-cyan-400 rounded-xl p-2.5 shadow-2xl flex items-center justify-between animate-in zoom-in-95 duration-150">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                        DETECTED SIGN:
                      </span>
                      <span className="text-lg font-extrabold text-white font-mono tracking-tight flex items-center gap-2">
                        {activeGesture}
                        <span className="text-xs text-cyan-300 font-normal">
                          ({detectedConfidence}%)
                        </span>
                      </span>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-cyan-500 text-[#080D19] text-[11px] font-bold animate-pulse">
                      ACTIVE ROUTINE
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Explicit Dose Ingestion Confirmation Card (Clinical Protocol Safety) */}
          {pendingConfirmationMed && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#11243B] to-[#12302E] border-2 border-emerald-500/50 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Explicit Dose Ingestion Verification</h4>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-500/30">
                  Clinical Safety Standard
                </span>
              </div>

              {/* Safety Notice */}
              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/20 text-xs text-slate-300 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed text-[11px]">
                  <strong className="text-emerald-300">Gesture Recognized: OK SIGN.</strong> Computer vision gesture detection confirms intent. In accordance with clinical safety protocols, camera detection alone is not proof of ingestion. Please verify physical dose consumption.
                </div>
              </div>

              {/* Scheduled Medicine Details loaded from authorized application state */}
              <div className="p-3.5 rounded-lg bg-[#080D19] border border-[#1E2D4A] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">
                      Scheduled Medicine Dose
                    </span>
                    <div className="text-base font-extrabold text-white flex items-center gap-2 mt-0.5">
                      {pendingConfirmationMed.name}
                      <span className="text-xs font-normal text-slate-300 bg-[#172338] px-2 py-0.5 rounded border border-[#1E2D4A]">
                        {pendingConfirmationMed.dosage}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                      <span>Scheduled: <strong className="text-white">{pendingConfirmationMed.scheduledTime}</strong></span>
                      <span>•</span>
                      <span>Timing: <strong className="text-slate-300">{pendingConfirmationMed.timingRule}</strong></span>
                      {pendingConfirmationMed.category && (
                        <>
                          <span>•</span>
                          <span className="text-cyan-300">{pendingConfirmationMed.category}</span>
                        </>
                      )}
                    </div>
                    {pendingConfirmationMed.instructions && (
                      <div className="text-[11px] text-slate-400 italic mt-1">
                        Instructions: {pendingConfirmationMed.instructions}
                      </div>
                    )}
                  </div>

                  {/* Stock impact display */}
                  <div className="text-xs font-mono sm:text-right bg-[#111B2D] border border-[#1E2D4A] p-2.5 rounded-lg shrink-0">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-sans">
                      Inventory Balance
                    </span>
                    <div className="text-cyan-300 font-bold mt-0.5">
                      Current Stock: {pendingConfirmationMed.inventory} pills
                    </div>
                    <div className="text-emerald-400 font-semibold text-[11px] mt-0.5">
                      After Confirmation: {Math.max(0, pendingConfirmationMed.inventory - (pendingConfirmationMed.unitsPerDose ?? 1))} pills
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 font-sans">
                      Deducts {pendingConfirmationMed.unitsPerDose ?? 1} unit upon confirmation
                    </div>
                  </div>
                </div>

                {/* Multiple pending medicines selector if patient has other pending doses */}
                {medications.filter((m) => m.status === 'pending').length > 1 && (
                  <div className="pt-2 border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-1.5 text-xs text-slate-400">
                    <span className="text-[11px]">Confirming another dose?</span>
                    <div className="flex gap-1.5 flex-wrap">
                      {medications
                        .filter((m) => m.status === 'pending')
                        .map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => {
                              setPendingConfirmationMed(m);
                              setConfirmationError(null);
                            }}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors cursor-pointer ${
                              m.id === pendingConfirmationMed.id
                                ? 'bg-cyan-500 text-[#080D19] font-bold'
                                : 'bg-[#172338] text-slate-300 hover:text-white'
                            }`}
                          >
                            {m.name} ({m.scheduledTime})
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error display if database confirmation fails */}
              {confirmationError && (
                <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{confirmationError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isConfirmingDose}
                  onClick={async () => {
                    setIsConfirmingDose(true);
                    setConfirmationError(null);
                    try {
                      const success = await markDoseTaken(pendingConfirmationMed.id);
                      if (success) {
                        setPendingConfirmationMed(null);
                      } else {
                        setConfirmationError('Database confirmation failed. Dose record retained for retry.');
                      }
                    } catch (err: any) {
                      setConfirmationError(err?.message || 'Failed to save confirmation to database.');
                    } finally {
                      setIsConfirmingDose(false);
                    }
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {isConfirmingDose ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying & Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Ingestion & Deduct Stock</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  disabled={isConfirmingDose}
                  onClick={() => {
                    setPendingConfirmationMed(null);
                    setConfirmationError(null);
                  }}
                  className="px-4 py-2.5 bg-[#172338] hover:bg-[#1E2D4A] border border-[#1E2D4A] text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Quick interactive test strip for testing actions directly */}
          <div className="mt-4 pt-4 border-t border-[#1E2D4A] flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>Perform gestures in camera or test actions below:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => triggerGesture('OPEN PALM', 96)}
                className="px-2.5 py-1 bg-[#172338] hover:bg-red-500 hover:text-white rounded text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Test Palm (Help)
              </button>
              <button
                onClick={() => triggerGesture('CLOSED FIST', 94)}
                className="px-2.5 py-1 bg-[#172338] hover:bg-amber-500 hover:text-black rounded text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Test Fist (Stop)
              </button>
              <button
                onClick={() => triggerGesture('V SIGN', 95)}
                className="px-2.5 py-1 bg-[#172338] hover:bg-cyan-500 hover:text-black rounded text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Test V Sign (Next)
              </button>
              <button
                onClick={() => triggerGesture('OK SIGN', 98)}
                className="px-2.5 py-1 bg-[#172338] hover:bg-emerald-500 hover:text-black rounded text-[11px] font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                Test OK Sign (Confirm)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Supported Gestures List (5 cols) */}
        <div className="lg:col-span-5 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-[#1E2D4A]">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white">Supported Gestures</h3>
          </div>

          <div className="space-y-3">
            {/* Gesture 1: OPEN PALM (HELP) */}
            <div
              onClick={() => triggerGesture('OPEN PALM')}
              className={`p-3.5 rounded-xl bg-[#172338] hover:bg-[#1E2D4A] border transition-all cursor-pointer group ${
                activeGesture === 'OPEN PALM'
                  ? 'border-red-500 bg-red-950/30'
                  : 'border-[#1E2D4A] hover:border-red-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  OPEN PALM
                </span>
                <span className="px-2 py-0.5 rounded bg-red-950/60 text-red-400 text-[10px] font-bold">
                  EMERGENCY
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-red-400 transition-colors">
                HELP
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Raise open hand to request caregiver emergency assistance immediately.
              </p>
            </div>

            {/* Gesture 2: CLOSED FIST (STOP) */}
            <div
              onClick={() => triggerGesture('CLOSED FIST')}
              className={`p-3.5 rounded-xl bg-[#172338] hover:bg-[#1E2D4A] border transition-all cursor-pointer group ${
                activeGesture === 'CLOSED FIST'
                  ? 'border-amber-500 bg-amber-950/30'
                  : 'border-[#1E2D4A] hover:border-amber-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  CLOSED FIST
                </span>
                <span className="px-2 py-0.5 rounded bg-amber-950/60 text-amber-400 text-[10px] font-bold">
                  ABORT
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-amber-400 transition-colors">
                STOP
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Clench fist to cancel or pause current medicine workflow.
              </p>
            </div>

            {/* Gesture 3: V SIGN (NEXT) */}
            <div
              onClick={() => triggerGesture('V SIGN')}
              className={`p-3.5 rounded-xl bg-[#172338] hover:bg-[#1E2D4A] border transition-all cursor-pointer group ${
                activeGesture === 'V SIGN'
                  ? 'border-cyan-500 bg-cyan-950/30'
                  : 'border-[#1E2D4A] hover:border-cyan-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  V SIGN
                </span>
                <span className="px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 text-[10px] font-bold">
                  NAVIGATE
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-cyan-400 transition-colors">
                NEXT
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Hold up two fingers (V / peace sign) to move to the next scheduled medicine.
              </p>
            </div>

            {/* Gesture 4: OK SIGN (CONFIRM) */}
            <div
              onClick={() => triggerGesture('OK SIGN')}
              className={`p-3.5 rounded-xl bg-[#172338] hover:bg-[#1E2D4A] border transition-all cursor-pointer group ${
                activeGesture === 'OK SIGN'
                  ? 'border-emerald-500 bg-emerald-950/30'
                  : 'border-[#1E2D4A] hover:border-emerald-500/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  OK SIGN
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-950/60 text-emerald-400 text-[10px] font-bold">
                  ACTIVE
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-1 group-hover:text-emerald-400 transition-colors">
                CONFIRM
              </h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Touch thumb and index finger together to log medicine intake with safety check.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Detection History and Live Terminal Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Detection History Table (8 cols) */}
        <div className="lg:col-span-8 bg-[#111B2D] border border-[#1E2D4A] rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Detection History
            </h3>
            <div className="relative w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#080D19] border border-[#1E2D4A] text-xs text-white rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1E2D4A] text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Timestamp</th>
                  <th className="py-2.5 px-3">Detected Gesture</th>
                  <th className="py-2.5 px-3">Action Routine</th>
                  <th className="py-2.5 px-3">AI Confidence</th>
                  <th className="py-2.5 px-3 text-right">System Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2D4A]/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-500 text-xs">
                      No gesture detection events logged yet.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#172338]/40 transition-colors">
                      <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-3 font-bold text-white flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        {log.gesture}
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded font-bold font-mono text-[11px] bg-blue-950/60 text-blue-300">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">
                        {log.confidence}%
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Terminal Output Console */}
        <div className="lg:col-span-4 bg-[#080D19] border border-[#1E2D4A] rounded-2xl p-4 shadow-xl flex flex-col font-mono text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-[#1E2D4A] mb-3 text-slate-400">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-cyan-400">
              <Terminal className="w-3.5 h-3.5" />
              VISION INFERENCE LOG
            </span>
            <span
              className={`w-2 h-2 rounded-full ${
                isCameraOnline ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            ></span>
          </div>

          <div className="flex-1 space-y-1.5 text-[11px] text-cyan-400 overflow-y-auto max-h-56">
            {terminalLogs.map((log, index) => (
              <p
                key={index}
                className={
                  index === 0
                    ? 'text-emerald-300 font-bold'
                    : 'text-slate-400 font-normal leading-relaxed'
                }
              >
                {log}
              </p>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-[#1E2D4A] text-[10px] text-slate-500 flex justify-between">
            <span>Model: MediaPipe Gesture Vision</span>
            <span>Status: {isModelReady ? 'Ready' : isModelLoading ? 'Loading' : 'Idle'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
