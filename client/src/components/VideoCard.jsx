import React, { useRef, useState } from 'react';
import { PlayIcon } from './Icons.jsx';

export default function VideoCard({ video, onClick, className = '' }) {
  const videoRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  };

  return (
    <div
      className={`tile video-tile-interactive ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={() => onClick(video)}
      role="button"
      tabIndex={0}
      aria-label={`Play video: ${video.title || video.category || 'Nail set'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(video);
        }
      }}
    >
      <video
        ref={videoRef}
        src={video.url}
        className="tile-video"
        muted
        playsInline
        loop
        preload="metadata"
      />

      {/* Dark Subtle Gradient Overlay */}
      <div className="video-card-gradient" />

      {/* Center Play Button Overlay */}
      <div className={`video-card-center-play ${isHovered ? 'hovered' : ''}`}>
        <div className="video-card-play-bubble">
          <PlayIcon size={22} />
        </div>
      </div>

      {/* Top Tag / Pill */}
      <div className="video-card-top-tag">
        <span className="video-badge-pill">
          <span className="video-dot" />
          {video.category || 'Video'}
        </span>
      </div>

      {/* Bottom Title Bar */}
      {(video.title || video.caption) && (
        <div className="video-card-caption">
          <p className="video-card-title">{video.title || video.category}</p>
          {video.caption && <span className="video-card-sub">{video.caption}</span>}
        </div>
      )}
    </div>
  );
}

