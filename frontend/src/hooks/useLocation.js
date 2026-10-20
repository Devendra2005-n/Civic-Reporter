import { useState, useCallback } from 'react';

const useUserLocation = () => {
  const [lat, setLat] = useState(null);
  const [lng, setLng] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const reverseGeocode = async (latitude, longitude) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=jsonv2`);
      const data = await response.json();

      if (data && data.address) {
        const { suburb, village, city, town, county, state_district, state } = data.address;
        
        const parts = [
          suburb || village,
          city || town,
          county || state_district,
          state
        ].filter(Boolean);
        
        return parts.length > 0 ? parts.join(', ') : data.display_name;
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000,
        });
      });

      const { latitude, longitude } = position.coords;
      setLat(latitude);
      setLng(longitude);

      const addr = await reverseGeocode(latitude, longitude);
      setAddress(addr);
    } catch (err) {
      // Fallback to IP location if GPS fails
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          setLat(ipData.latitude);
          setLng(ipData.longitude);
          const addr = await reverseGeocode(ipData.latitude, ipData.longitude);
          setAddress(addr);
          return;
        }
      } catch (ipErr) {
        console.error('IP location fallback failed', ipErr);
      }

      const messages = {
        1: 'Location permission denied. Please enable location access.',
        2: 'Location unavailable. Please try again.',
        3: 'Location request timed out. Please try again.',
      };
      setError(messages[err.code] || 'Failed to detect location');
    } finally {
      setLoading(false);
    }
  }, []);

  return { lat, lng, address, setAddress, loading, error, detectLocation };
};

export default useUserLocation;
