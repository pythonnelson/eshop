import { useState, useRef } from 'react';
import { Box } from '@mui/material';

/**
 * Product image with hover zoom (magnifying lens effect).
 * Shows a 2x zoomed area in an overlay when hovering.
 */
export default function ProductImageZoom({ src, alt, zoomLevel = 2 }) {
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseEnter = () => setShowZoom(true);
  const handleMouseLeave = () => setShowZoom(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  return (
    <Box
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      sx={{
        position: 'relative',
        overflow: 'hidden',
        cursor: 'zoom-in',
        bgcolor: 'grey.50',
        '&:hover img': { opacity: showZoom ? 0.85 : 1 },
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{
          width: '100%',
          maxHeight: 400,
          objectFit: 'contain',
          p: 2,
          display: 'block',
        }}
      />
      {showZoom && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${src})`,
            backgroundRepeat: 'no-repeat',
            backgroundSize: `${zoomLevel * 100}%`,
            backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
            pointerEvents: 'none',
          }}
        />
      )}
    </Box>
  );
}
