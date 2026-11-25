import { useEffect, useRef, useState } from 'react';

/**
 * AdvancedMarker — replaces deprecated MarkerF with google.maps.marker.AdvancedMarkerElement
 * Requires mapId to be set on the GoogleMap component.
 * 
 * Props:
 *  - map: google.maps.Map instance
 *  - position: { lat, lng }
 *  - draggable: boolean
 *  - onDragEnd: (e) => void  (e.latLng available)
 *  - onClick: () => void
 *  - icon: URL string for a custom marker icon image
 *  - title: string
 */
const AdvancedMarker = ({ map, position, draggable, onDragEnd, onClick, icon, title }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (!map || !position || !window.google?.maps?.marker?.AdvancedMarkerElement) return;

    // Build marker content if icon URL is provided
    let content = undefined;
    if (icon) {
      const img = document.createElement('img');
      img.src = icon;
      img.width = 32;
      img.height = 32;
      img.style.cursor = 'pointer';
      content = img;
    }

    const marker = new window.google.maps.marker.AdvancedMarkerElement({
      map,
      position,
      gmpDraggable: draggable || false,
      title: title || '',
      ...(content ? { content } : {}),
    });

    const handleClick = () => {
      if (onClick) onClick();
    };

    const handleDragEnd = () => {
      if (onDragEnd) {
        onDragEnd({
          latLng: {
            lat: () => (typeof marker.position?.lat === 'function' ? marker.position.lat() : marker.position?.lat),
            lng: () => (typeof marker.position?.lng === 'function' ? marker.position.lng() : marker.position?.lng),
          }
        });
      }
    };

    if (onClick) {
      if (marker.addEventListener) {
        marker.addEventListener('gmp-click', handleClick);
      } else {
        marker.addListener('click', handleClick);
      }
    }

    if (onDragEnd) {
      if (marker.addEventListener) {
        marker.addEventListener('gmp-dragend', handleDragEnd);
      } else {
        marker.addListener('dragend', handleDragEnd);
      }
    }

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        if (onClick && markerRef.current.removeEventListener) {
          markerRef.current.removeEventListener('gmp-click', handleClick);
        }
        if (onDragEnd && markerRef.current.removeEventListener) {
          markerRef.current.removeEventListener('gmp-dragend', handleDragEnd);
        }
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [map, position?.lat, position?.lng, draggable, icon]);

  return null; // This component renders nothing — the marker is managed by the Maps API
};

export default AdvancedMarker;
