import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlayIcon,
  PauseIcon,
  Volume2Icon,
  VolumeXIcon,
  RotateCcwIcon,
  RotateCwIcon,
  MaximizeIcon,
  MinimizeIcon,
  CloseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './Icons.jsx';
import { getVideoPoster } from './VideoCard.jsx';

const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds) || timeInSeconds === null) return '0:00';
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function VideoModal({ item, onClose, onPrev, onNext, hasPrev, hasNext }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);

  // Auto-hide controls after inactivity when playing
  useEffect(() => {
    const bumpControls = () => {
      setShowControls(true);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
      if (isPlaying) {
        controlsTimeout.current = setTimeout(() => setShowControls(false), 2500);
      }
    };

    bumpControls();
    window.addEventListener('mousemove', bumpControls);
    window.addEventListener('touchstart', bumpControls);
    return () => {
      window.removeEventListener('mousemove', bumpControls);
      window.removeEventListener('touchstart', bumpControls);
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, [isPlaying]);

  // Autoplay on mount or item change
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  }, [item?.url]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleSeek(-10);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleSeek(10);
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Track fullscreen state
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const togglePlay = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSeek = (seconds, e) => {
    e?.stopPropagation();
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.min(
      Math.max(videoRef.current.currentTime + seconds, 0),
      videoRef.current.duration || 0
    );
  };

  const handleScrub = (e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = percent * (videoRef.current.duration || 0);
  };

  const toggleFullscreen = (e) => {
    e?.stopPropagation();
    const el = containerRef.current || videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      if (el.requestFullscreen) {
        el.requestFullscreen().catch(() => {});
      } else if (videoRef.current.webkitEnterFullscreen) {
        videoRef.current.webkitEnterFullscreen();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const curr = videoRef.current.currentTime;
    const dur = videoRef.current.duration || 0;
    setCurrentTime(curr);
    setProgress(dur > 0 ? (curr / dur) * 100 : 0);
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 0);
    }
  };

  return (
    <motion.div
      className="cinematic-modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onClick={onClose}
    >
      {/* Top Close Button */}
      <button
        type="button"
        className="cinematic-close-btn"
        onClick={onClose}
        aria-label="Close video player"
      >
        <CloseIcon size={20} />
      </button>

      {/* Prev / Next Arrows */}
      {hasPrev && (
        <button
          type="button"
          className="cinematic-nav-btn prev"
          onClick={(e) => { e.stopPropagation(); onPrev(); }}
          aria-label="Previous item"
        >
          <ChevronLeftIcon size={28} />
        </button>
      )}
      {hasNext && (
        <button
          type="button"
          className="cinematic-nav-btn next"
          onClick={(e) => { e.stopPropagation(); onNext(); }}
          aria-label="Next item"
        >
          <ChevronRightIcon size={28} />
        </button>
      )}

      {/* Video Container Box */}
      <motion.div
        ref={containerRef}
        className="cinematic-video-frame"
        initial={{ scale: 0.94, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 15 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={item.url}
          poster={getVideoPoster(item.url)}
          className="cinematic-video-element"
          playsInline
          muted={isMuted}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Big Center Play/Pause Indicator on tap/pause */}
        {!isPlaying && (
          <div className="cinematic-center-play" onClick={togglePlay}>
            <div className="cinematic-play-bubble">
              <PlayIcon size={32} />
            </div>
          </div>
        )}

        {/* Custom Apple-Sleek Cinematic Controls Overlay (matching Ardai) */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              className="cinematic-controls-bar"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Title & Live Timestamp */}
              <div className="cinematic-meta-row">
                <div className="cinematic-title-wrap">
                  <span className="cinematic-title">{item.title || 'Shyfunmi Nails Set'}</span>
                  {item.category && <span className="pill" style={{ marginLeft: 8, fontSize: '0.72rem' }}>{item.category}</span>}
                </div>
                <span className="cinematic-timer font-mono">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* Interactive Scrub Bar */}
              <div className="cinematic-scrubber" onClick={handleScrub} role="slider" aria-label="Seek video">
                <div className="cinematic-scrub-bg">
                  <motion.div
                    className="cinematic-scrub-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              {/* Controls Buttons Row */}
              <div className="cinematic-actions-row">
                {/* Left: Rewind 10s */}
                <button
                  type="button"
                  className="cinematic-icon-btn"
                  onClick={(e) => handleSeek(-10, e)}
                  aria-label="Rewind 10 seconds"
                  title="Rewind 10s"
                >
                  <RotateCcwIcon size={18} />
                </button>

                {/* Center: Play/Pause */}
                <button
                  type="button"
                  className="cinematic-play-btn"
                  onClick={togglePlay}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <PauseIcon size={20} /> : <PlayIcon size={20} />}
                </button>

                {/* Right: Forward 10s */}
                <button
                  type="button"
                  className="cinematic-icon-btn"
                  onClick={(e) => handleSeek(10, e)}
                  aria-label="Forward 10 seconds"
                  title="Forward 10s"
                >
                  <RotateCwIcon size={18} />
                </button>

                {/* Secondary controls: Volume & Fullscreen */}
                <div className="cinematic-sub-actions">
                  <button
                    type="button"
                    className="cinematic-icon-btn"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeXIcon size={18} /> : <Volume2Icon size={18} />}
                  </button>
                  <button
                    type="button"
                    className="cinematic-icon-btn"
                    onClick={toggleFullscreen}
                    aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <MinimizeIcon size={18} /> : <MaximizeIcon size={18} />}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

