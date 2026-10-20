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

    if (onClick) {
      marker.addListener('click', onClick);
    }

    if (onDragEnd) {
      marker.addListener('dragend', (e) => {
        // AdvancedMarkerElement dragend event has the marker's position
        onDragEnd({
          latLng: {
            lat: () => marker.position.lat,
            lng: () => marker.position.lng,
          }
        });
      });
    }

    markerRef.current = marker;

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current = null;
      }
    };
  }, [map, position?.lat, position?.lng, draggable, icon]);

  return null; // This component renders nothing — the marker is managed by the Maps API
};

export default AdvancedMarker;
