//web/src/components/ui/AddCameraModal.tsx

'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Wifi, Server, AlertCircle, CheckCircle, Webcam, Video } from 'lucide-react';
import GlassCard from './GlassCard';
import { crowdCameraApi, type CameraCreatePayload, type CrowdCamera } from '@/lib/crowdCameras';

interface AddCameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (camera: CrowdCamera) => void;
}

export default function AddCameraModal({ isOpen, onClose, onAdd }: AddCameraModalProps) {
  const [cameraType, setCameraType] = useState<'webcam' | 'ip' | 'video'>('webcam');
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('8080');
  const [protocol, setProtocol] = useState('http');
  const [videoPath, setVideoPath] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    let cameraData: CameraCreatePayload;
    
    if (cameraType === 'webcam') {
      cameraData = {
        name: name || 'Webcam',
        ip: '0',
        port: 0,
        protocol: 'http',
      };
    } else if (cameraType === 'video') {
      if (!videoPath) {
        setError('Please enter video file path');
        setLoading(false);
        return;
      }
      cameraData = {
        name: name || `Video: ${videoPath.split('/').pop() || videoPath}`,
        video_path: videoPath,
        ip: '',
        port: 0,
        protocol: 'http',
      };
    } else {
      if (!ip) {
        setError('Please enter IP address');
        setLoading(false);
        return;
      }
      cameraData = {
        name: name || `IP Camera (${ip})`,
        ip: ip,
        port: parseInt(port) || 8080,
        protocol: protocol,
      };
    }

    try {
      const data = await crowdCameraApi.create(cameraData);
      onAdd(data.camera);
      onClose();
      // Reset form
      setName('');
      setIp('');
      setPort('8080');
      setProtocol('http');
      setVideoPath('');
      setCameraType('webcam');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Make sure the backend is running');
      console.error('Error adding camera:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md"
          >
            <GlassCard className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-ink">Add Camera</h2>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-surface-soft transition-colors"
                >
                  <X size={20} className="text-muted" />
                </button>
              </div>

              {/* Camera Type Selection */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setCameraType('webcam')}
                  className={`p-3 rounded-xl border transition-all ${
                    cameraType === 'webcam'
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-hairline bg-surface-soft text-muted hover:bg-surface-card'
                  }`}
                >
                  <Webcam size={20} className="mx-auto mb-2" />
                  <span className="text-sm">Webcam</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCameraType('ip')}
                  className={`p-3 rounded-xl border transition-all ${
                    cameraType === 'ip'
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-hairline bg-surface-soft text-muted hover:bg-surface-card'
                  }`}
                >
                  <Wifi size={20} className="mx-auto mb-2" />
                  <span className="text-sm">IP Camera</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCameraType('video')}
                  className={`p-3 rounded-xl border transition-all ${
                    cameraType === 'video'
                      ? 'border-coral bg-coral/10 text-coral'
                      : 'border-hairline bg-surface-soft text-muted hover:bg-surface-card'
                  }`}
                >
                  <Video size={20} className="mx-auto mb-2" />
                  <span className="text-sm">Video File</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-2">
                    Camera Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={cameraType === 'webcam' ? "Webcam" : cameraType === 'video' ? "Video File" : "e.g., Gate A Camera"}
                    className="w-full px-4 py-2 rounded-xl bg-canvas border border-hairline text-ink placeholder-muted-soft focus:outline-none focus:border-coral transition-colors"
                  />
                </div>

                {cameraType === 'ip' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        IP Address *
                      </label>
                      <input
                        type="text"
                        value={ip}
                        onChange={(e) => setIp(e.target.value)}
                        placeholder="192.168.1.100"
                        className="w-full px-4 py-2 rounded-xl bg-canvas border border-hairline text-ink placeholder-muted-soft focus:outline-none focus:border-coral transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Port
                      </label>
                      <input
                        type="number"
                        value={port}
                        onChange={(e) => setPort(e.target.value)}
                        placeholder="8080"
                        className="w-full px-4 py-2 rounded-xl bg-canvas border border-hairline text-ink placeholder-muted-soft focus:outline-none focus:border-coral transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Protocol
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {['http', 'rtsp'].map((proto) => (
                          <button
                            key={proto}
                            type="button"
                            onClick={() => setProtocol(proto)}
                            className={`px-4 py-2 rounded-xl border transition-all ${
                              protocol === proto
                                ? 'border-coral bg-coral/10 text-coral'
                                : 'border-hairline bg-surface-soft text-muted hover:bg-surface-card'
                            }`}
                          >
                            {proto.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {cameraType === 'video' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-muted mb-2">
                        Video File Path *
                      </label>
                      <input
                        type="text"
                        value={videoPath}
                        onChange={(e) => setVideoPath(e.target.value)}
                        placeholder="crowd.mp4 or /path/to/video.mp4"
                        className="w-full px-4 py-2 rounded-xl bg-canvas border border-hairline text-ink placeholder-muted-soft focus:outline-none focus:border-coral transition-colors"
                        required
                      />
                      <p className="text-xs text-muted-soft mt-2">
                        Enter the path to your video file (e.g., crowd.mp4, ./videos/test.mp4)
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-accent/5 border border-accent/20">
                      <p className="text-xs text-coral text-center">
                        Video files will loop automatically for continuous monitoring
                      </p>
                    </div>
                  </>
                )}

                {cameraType === 'webcam' && (
                  <div className="p-3 rounded-xl bg-accent/5 border border-accent/20">
                    <p className="text-xs text-coral text-center">
                      Your default webcam (camera 0) will be used for monitoring
                    </p>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={16} className="text-red-400" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-coral text-on-primary font-medium hover:bg-coral-active transition-all disabled:opacity-50"
                >
                  {loading ? 'Connecting...' : 'Add Camera'}
                </button>

                <p className="text-xs text-center text-muted-soft mt-4">
                  {cameraType === 'webcam' 
                    ? "Your computer's webcam will be used for crowd detection"
                    : cameraType === 'video'
                    ? "Upload or specify a video file path for crowd analysis"
                    : "Supports IP cameras with HTTP or RTSP streams"}
                </p>
              </form>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
