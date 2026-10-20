import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, X, Sparkles, Volume2, AlertCircle } from 'lucide-react';

const VoiceInput = ({ onTranscript, placeholder = "Click to speak..." }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);

  // Waveform bars configuration
  const barCount = 40;
  const bars = Array.from({ length: barCount }, (_, i) => i);

  const startRecording = async () => {
    try {
      setError(null);
      setTranscript('');
      chunksRef.current = [];
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      analyserRef.current.smoothingTimeConstant = 0.8;
      source.connect(analyserRef.current);
      
      // Set up media recorder
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        await processAudio(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setShowOverlay(true);
      
      // Start visualization
      visualize();
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const processAudio = async (audioBlob) => {
    setIsProcessing(true);
    
    // Simulate AI transcription
    setTimeout(() => {
      const mockTranscripts = [
        "There's a large pothole on Main Street that needs immediate attention.",
        "The street light near the park has been flickering for three days.",
        "Garbage hasn't been collected in our area for a week now.",
        "A water pipe is leaking and flooding the road near my building.",
        "The traffic signal at the intersection is not working properly."
      ];
      
      const randomTranscript = mockTranscripts[Math.floor(Math.random() * mockTranscripts.length)];
      setTranscript(randomTranscript);
      onTranscript?.(randomTranscript);
      setIsProcessing(false);
      setShowOverlay(false);
    }, 2000);
  };

  const visualize = useCallback(() => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    // Calculate average volume
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    const average = sum / dataArray.length;
    setAudioLevel(average / 255);
    
    animationFrameRef.current = requestAnimationFrame(visualize);
  }, []);

  const getBarHeight = (index) => {
    if (!isRecording) return 3;
    
    // Create a wave effect based on audio level and index
    const baseHeight = 3 + (audioLevel * 40);
    const waveOffset = Math.sin((Date.now() / 200) + (index * 0.3)) * 10;
    const randomVariation = Math.random() * audioLevel * 20;
    
    return Math.max(3, Math.min(60, baseHeight + waveOffset + randomVariation));
  };

  const cancelRecording = () => {
    stopRecording();
    setShowOverlay(false);
    setTranscript('');
    setError(null);
  };

  return (
    <>
      {/* Voice Input Button */}
      <div className="relative">
        <motion.button
          onClick={() => isRecording ? stopRecording() : startRecording()}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
            isRecording
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-gradient-to-r from-blue-500/20 to-purple-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isRecording ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                <Square className="w-5 h-5 fill-current" />
              </motion.div>
              <span>Recording...</span>
            </>
          ) : (
            <>
              <Mic className="w-5 h-5" />
              <span>Voice Input</span>
            </>
          )}
        </motion.button>

        {/* Recording indicator */}
        {isRecording && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1, 1.2, 1], opacity: [0, 1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity, times: [0, 0.2, 0.5, 1] }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"
          />
        )}
      </div>

      {/* Full Screen Overlay */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl"
          >
            {/* Background effects */}
            <div className="absolute inset-0 overflow-hidden">
              <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[120px]"
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
              <motion.div
                className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/20 rounded-full blur-[100px]"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 5, repeat: Infinity, delay: 1 }}
              />
            </div>

            <div className="relative flex flex-col items-center">
              {/* Close button */}
              <motion.button
                onClick={cancelRecording}
                className="absolute -top-20 right-0 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>

              {/* Recording status */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 mb-12"
              >
                {isProcessing ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Sparkles className="w-6 h-6 text-blue-400" />
                    </motion.div>
                    <span className="text-xl font-medium text-white">Processing with AI...</span>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="w-4 h-4 bg-red-500 rounded-full"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <span className="text-xl font-medium text-white">Listening...</span>
                  </>
                )}
              </motion.div>

              {/* Waveform Visualization */}
              <div className="flex items-center justify-center gap-1 h-32 mb-12">
                {bars.map((i) => (
                  <motion.div
                    key={i}
                    className="w-1.5 rounded-full bg-gradient-to-t from-blue-500 via-purple-500 to-cyan-400"
                    animate={{
                      height: isProcessing ? [20, 40, 20] : getBarHeight(i),
                    }}
                    transition={{
                      duration: isProcessing ? 0.5 : 0.1,
                      repeat: isProcessing ? Infinity : 0,
                      delay: i * 0.01,
                    }}
                    style={{
                      opacity: 0.3 + (audioLevel * 0.7),
                    }}
                  />
                ))}
              </div>

              {/* Processing or Stop button */}
              {isProcessing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center gap-4"
                >
                  <div className="w-16 h-1 bg-white/20 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 2 }}
                    />
                  </div>
                  <p className="text-gray-400 text-sm">Transcribing your voice...</p>
                </motion.div>
              ) : (
                <motion.button
                  onClick={stopRecording}
                  className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/30 font-medium hover:bg-red-500/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>Stop Recording</span>
                </motion.button>
              )}

              {/* Hint text */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-gray-500 text-sm max-w-md text-center"
              >
                Speak clearly into your microphone. The AI will transcribe and analyze your complaint.
              </motion.p>

              {/* Error message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400"
                >
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript preview */}
      <AnimatePresence>
        {transcript && !showOverlay && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 rounded-xl bg-green-500/10 border border-green-500/30"
          >
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-green-400" />
              <span className="text-xs font-medium text-green-400 uppercase tracking-wider">Transcribed</span>
            </div>
            <p className="text-sm text-gray-300">{transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default VoiceInput;
