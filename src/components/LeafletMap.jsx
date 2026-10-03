// Interactive Leaflet map used to select and confirm complaint locations.
import React from "react";
import { LocateFixed, MapPin } from "lucide-react";
import { Button } from "./Common";

// -----------------------------------------------------------------------------
// FEATURE 1: Default map location
// This Dhaka coordinate is used before the citizen selects another location.
// -----------------------------------------------------------------------------
const DEFAULT_POSITION = [23.7808, 90.4071];

export default function LeafletMap({
  value = DEFAULT_POSITION,
  onChange = () => {},
  onAddressChange = () => {},
}) {
  // ---------------------------------------------------------------------------
  // FEATURE 2: Leaflet and DOM references
  // These references keep the map, marker and HTML container available without
  // recreating them every time the React component renders.
  // ---------------------------------------------------------------------------
  const mapNode = React.useRef(null);
  const mapInstance = React.useRef(null);
  const markerInstance = React.useRef(null);

  // ---------------------------------------------------------------------------
  // FEATURE 3: Latest parent callbacks
  // Leaflet event handlers live outside React's normal event system. Refs ensure
  // they always call the latest setLocation and setAddress functions.
  // ---------------------------------------------------------------------------
  const onChangeRef = React.useRef(onChange);
  const onAddressChangeRef = React.useRef(onAddressChange);

  // ---------------------------------------------------------------------------
  // FEATURE 4: Map loading and user status messages
  // ---------------------------------------------------------------------------
  const [ready, setReady] = React.useState(false);
  const [message, setMessage] = React.useState(
    "Drag the marker to set the exact location",
  );

  React.useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  React.useEffect(() => {
    onAddressChangeRef.current = onAddressChange;
  }, [onAddressChange]);

  // ---------------------------------------------------------------------------
  // FEATURE 5: Reverse geocoding
  // Sends latitude and longitude to OpenStreetMap Nominatim and receives a
  // readable address such as "Badda, Dhaka, Bangladesh".
  // ---------------------------------------------------------------------------
  const resolveAddress = React.useCallback(async ([latitude, longitude]) => {
    setMessage("Fetching address from the selected map location...");
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
        { headers: { Accept: "application/json" } },
      );

      if (!response.ok) throw new Error("Address lookup failed");

      const data = await response.json();
      const address = data.display_name?.trim();

      if (!address) throw new Error("No address was returned");

      // Sends the fetched address back to the location-selection page.
      onAddressChangeRef.current(address);
      setMessage("Address fetched from OpenStreetMap");
    } catch {
      // Coordinates remain usable even if the address service is unavailable.
      onAddressChangeRef.current("");
      setMessage("Coordinates selected. You can enter the address manually.");
    }
  }, []);

  // ---------------------------------------------------------------------------
  // FEATURE 6: Create the Leaflet map
  // This effect runs when the component opens and creates the map only once.
  // ---------------------------------------------------------------------------
  React.useEffect(() => {
    if (!mapNode.current || mapInstance.current || !window.L) return undefined;

    const L = window.L;

    // Create the map and centre it on the current coordinate.
    const map = L.map(mapNode.current, { zoomControl: false }).setView(
      value,
      14,
    );

    // -------------------------------------------------------------------------
    // FEATURE 7: OpenStreetMap tile layer
    // Leaflet downloads only the small map-image tiles visible on the screen.
    // -------------------------------------------------------------------------
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap contributors",
    }).addTo(map);

    // Place the zoom buttons at the bottom-right corner.
    L.control.zoom({ position: "bottomright" }).addTo(map);

    // -------------------------------------------------------------------------
    // FEATURE 8: Five-kilometre service-area circle
    // This is the green boundary displayed around the default service point.
    // -------------------------------------------------------------------------
    L.circle(DEFAULT_POSITION, {
      radius: 5000,
      color: "#65e6a5",
      weight: 1.5,
      fillColor: "#37c982",
      fillOpacity: 0.08,
      dashArray: "6 8",
    }).addTo(map);

    // -------------------------------------------------------------------------
    // FEATURE 9: Draggable complaint-location marker
    // The marker starts at the current value and can be moved by the citizen.
    // -------------------------------------------------------------------------
    const marker = L.marker(value, { draggable: true }).addTo(map);
    marker
      .bindPopup(
        "<strong>Selected complaint location</strong><br/>Inside the 5 km service zone",
      )
      .openPopup();

    // -------------------------------------------------------------------------
    // FEATURE 10: Fetch coordinates after marker dragging
    // getLatLng() reads the selected latitude/longitude. The coordinates are
    // sent to React state and then converted into a readable address.
    // -------------------------------------------------------------------------
    marker.on("dragend", () => {
      const point = marker.getLatLng();
      const next = [
        Number(point.lat.toFixed(6)),
        Number(point.lng.toFixed(6)),
      ];

      onChangeRef.current(next);
      resolveAddress(next);
    });

    // Save the created instances so the GPS function can move them later.
    mapInstance.current = map;
    markerInstance.current = marker;
    setReady(true);

    // Fetch the readable address for the initial coordinate.
    resolveAddress(value);

    // Leaflet may initialise before its panel reaches its final size.
    const resizeTimer = setTimeout(() => map.invalidateSize(), 120);

    // -------------------------------------------------------------------------
    // FEATURE 11: Map cleanup
    // Removes Leaflet listeners and instances when leaving the location page.
    // -------------------------------------------------------------------------
    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapInstance.current = null;
      markerInstance.current = null;
    };
  }, [resolveAddress]);

  // ---------------------------------------------------------------------------
  // FEATURE 12: Browser GPS/current-location button
  // Requests permission from the browser, gets device coordinates, moves the
  // marker and map, and then fetches the readable address.
  // ---------------------------------------------------------------------------
  const locate = () => {
    if (!navigator.geolocation) {
      setMessage(
        "Location is unavailable. The default Dhaka location is selected.",
      );
      return;
    }

    setMessage("Finding your location...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const next = [
          Number(coords.latitude.toFixed(6)),
          Number(coords.longitude.toFixed(6)),
        ];

        // Update the location stored by the complaint form.
        onChange(next);
        onChangeRef.current(next);

        // Move the visible marker and map to the detected position.
        markerInstance.current?.setLatLng(next);
        mapInstance.current?.flyTo(next, 16, { duration: 1.2 });

        // Convert the detected coordinates into an address.
        resolveAddress(next);
      },
      () =>
        setMessage(
          "Location permission was not provided. The default Dhaka location is selected.",
        ),
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  // ---------------------------------------------------------------------------
  // FEATURE 13: Map interface
  // Displays the map, loading fallback, status message and GPS button.
  // ---------------------------------------------------------------------------
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
        <Button variant="glass" icon={LocateFixed} onClick={locate}>
          Use current location
        </Button>
      </div>
    </div>
  );
}
