import markUrl from '../assets/logo-mark.png';
import fullUrl from '../assets/logo-full.png';

export default function Logo({ size = 30, full = false, light = false, className = '', alt = 'Shyfunmi Nails' }) {
  const src = full ? fullUrl : markUrl;
  const height = size;
  // logo-mark aspect ratio is 384 / 440 = ~0.87
  // logo-full aspect ratio is 784 / 580 = ~1.35
  const width = full ? Math.round(size * 1.35) : Math.round(size * (384 / 440));

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`site-logo ${light ? 'light' : ''} ${className}`.trim()}
      style={{ width: `${width}px`, height: `${height}px` }}
      loading="eager"
    />
  );
}
