// components/map/MapComponent.tsx
// Generic Leaflet map component (OpenStreetMap, no API key required).
// Always import with: dynamic(() => import(...), { ssr: false })
//
// Fix "Map container is already initialized":
//   Root cause: Next.js HMR + React 18 StrictMode replace the module before
//   map.remove() runs, leaving _leaflet_id on the DOM node.
//
//   Two-pronged fix:
//   1) Patch L.Map.prototype._initContainer to delete _leaflet_id before the
//      throw, so Leaflet can reinitialize on the same container without error.
//   2) canRenderMap + setTimeout as a safety guard for SSR and StrictMode.

'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// ── Apply all Leaflet patches once per browser session ────────────────────────
let _leafletPatched = false;

function patchLeaflet() {
  if (_leafletPatched || typeof window === 'undefined') return;
  _leafletPatched = true;

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const L = require('leaflet');

  // 1. Fix broken default icon URLs (Webpack/Next.js asset handling)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl:
      'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });

  // 2. Patch _initContainer: remove stale _leaflet_id before the throw.
  //    Allows re-initialization after HMR or StrictMode double-mount.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const MapProto = (L.Map as any).prototype;
  const origInitContainer = MapProto._initContainer as (id: unknown) => void;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  MapProto._initContainer = function (id: any) {
    // Resolve to DOM element (string id or HTMLElement)
    const el: (HTMLElement & { _leaflet_id?: number }) | null =
      typeof id === 'string'
        ? (document.getElementById(id) as HTMLElement & { _leaflet_id?: number })
        : id;

    if (el && el._leaflet_id !== undefined) {
      // Remove stale Leaflet ID so the container can be reused cleanly
      delete el._leaflet_id;
    }
    origInitContainer.call(this, id);
  };
}

// ── Update map view without remounting ────────────────────────────────────────
function MapCenterUpdater({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface MapComponentProps {
  center: [number, number];
  zoom?: number;
  children?: React.ReactNode;
  className?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapComponent({
  center,
  zoom = 12,
  children,
  className = '',
}: MapComponentProps) {
  const [canRenderMap, setCanRenderMap] = useState(false);

  useEffect(() => {
    patchLeaflet();

    // setTimeout(0): in StrictMode, the cleanup cancels the first tick so
    // MapContainer only mounts in the second (real) effect cycle.
    const id = window.setTimeout(() => setCanRenderMap(true), 0);
    return () => {
      window.clearTimeout(id);
      setCanRenderMap(false);
    };
  }, []);

  if (!canRenderMap) {
    return (
      <div
        className={`w-full h-full bg-gray-100 flex items-center justify-center ${className}`}
        style={{ minHeight: '400px' }}
      >
        <span className="text-gray-400 text-sm animate-pulse">Loading map...</span>
      </div>
    );
  }

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        maxZoom={20}
      />
      <MapCenterUpdater center={center} zoom={zoom} />
      {children}
    </MapContainer>
  );
}
