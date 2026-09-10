import React from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { Button } from './Common';

const DEFAULT_POSITION = [23.7808, 90.4071];

export default function LeafletMap({ value = DEFAULT_POSITION, onChange = () => {} }) {
  const mapNode = React.useRef(null);
  const mapInstance = React.useRef(null);
  const markerInstance = React.useRef(null);
  const onChangeRef = React.useRef(onChange);
  const [ready, setReady] = React.useState(false);
  const [message, setMessage] = React.useState('Drag the marker to set the exact location');

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    if (!mapNode.current || mapInstance.current || !window.L) return undefined;

    const L = window.L;
    const map = L.map(mapNode.current, { zoomControl: false }).setView(value, 14);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.circle(DEFAULT_POSITION, {
      radius: 5000,
      color: '#65e6a5',
      weight: 1.5,
      fillColor: '#37c982',
      fillOpacity: 0.08,
      dashArray: '6 8',
    }).addTo(map);

    const marker = L.marker(value, { draggable: true }).addTo(map);
    marker.bindPopup('<strong>Selected complaint location</strong><br/>Inside the 5 km service zone').openPopup();
    marker.on('dragend', () => {
      const point = marker.getLatLng();
      const next = [Number(point.lat.toFixed(6)), Number(point.lng.toFixed(6))];
      onChangeRef.current(next);
      setMessage('Location updated from the map marker');
    });

    mapInstance.current = map;
    markerInstance.current = marker;
    setReady(true);

    const resizeTimer = setTimeout(() => map.invalidateSize(), 120);
    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, []);

  const locate = () => {
    if (!navigator.geolocation) {
      setMessage('Location is unavailable. The default Dhaka location is selected.');
      return;
    }
    setMessage('Finding your location...');
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = [Number(coords.latitude.toFixed(6)), Number(coords.longitude.toFixed(6))];
        onChange(next);
        markerInstance.current?.setLatLng(next);
        mapInstance.current?.flyTo(next, 16, { duration: 1.2 });
        setMessage('Current location selected successfully');
      },
      () => setMessage('Location permission was not provided. The default Dhaka location is selected.'),
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  return (
    <div className="leaflet-card">
      <div ref={mapNode} className="leaflet-map">
        {!ready && (
          <div className="leaflet-fallback">
            <MapPin size={32} />
            <span>Loading interactive map...</span>
          </div>
        )}
      </div>
      <div className="leaflet-card__toolbar">
        <span>{message}</span>
        <Button variant="glass" icon={LocateFixed} onClick={locate}>Use current location</Button>
      </div>
    </div>
  );
}
