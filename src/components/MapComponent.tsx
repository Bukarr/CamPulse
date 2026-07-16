import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polygon, useMapEvents, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Report, AbuZone, ReportCategory } from '../types';
import { abuZones, ABU_LAT, ABU_LNG } from '../data/abuZones';
import { Search, MapPin, X, ChevronRight, Menu, MapPinned, Info, Navigation, Compass, Check } from 'lucide-react';

// Fix for default Leaflet icon paths in Webpack/Vite bundlers using CDN assets
const markerIcon2x = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png';
const markerIcon = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png';
const markerShadow = 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png';

// Override Leaflet's default icon to load correctly
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

// Category-specific high-contrast SVG markers
const CATEGORY_COLORS: Record<ReportCategory, string> = {
  broken_lights: '#f59e0b', // Amber
  plumbing: '#3b82f6',      // Blue
  wifi_outage: '#8b5cf6',   // Purple
  security: '#ef4444',      // Red
  structural: '#10b981',    // Green
  others: '#64748b'         // Slate
};

const CATEGORY_ICONS: Record<ReportCategory, string> = {
  broken_lights: '💡',
  plumbing: '🚰',
  wifi_outage: '📶',
  security: '🚨',
  structural: '🧱',
  others: '🔧'
};

function createCustomIcon(category: ReportCategory, status: string) {
  const color = CATEGORY_COLORS[category];
  const iconEmoji = CATEGORY_ICONS[category];
  
  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer transition-all duration-200 hover:scale-115">
        <!-- SVG Pin Shape (Sized Down) -->
        <svg style="width: 24px; height: 30px;" class="drop-shadow-md filter" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37 18.63 0 12 0Z" fill="${color}" />
          <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12C1.5 18 12 27.5 12 27.5C12 27.5 22.5 18 22.5 12C22.5 6.2 17.8 1.5 12 1.5Z" fill="#0b1329" />
          <circle cx="12" cy="11" r="8" fill="#0b1329" />
        </svg>
        <!-- Category Emoji Centered (Sized Down) -->
        <span class="absolute top-[4px] text-[10px] select-none z-10">${iconEmoji}</span>
        <!-- Active submitted radar pulse -->
        ${status === 'submitted' ? `<span class="absolute top-[3px] w-6 h-6 rounded-full animate-ping bg-red-500 opacity-25 pointer-events-none"></span>` : ''}
      </div>
    `,
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -28]
  });
}

// User-placed custom marker for new reports
const activeReportingIcon = L.divIcon({
  className: 'custom-reporting-marker',
  html: `
    <div class="relative flex flex-col items-center animate-bounce cursor-pointer">
      <svg style="width: 28px; height: 36px;" class="drop-shadow-xl filter" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.37 0 0 5.37 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37 18.63 0 12 0Z" fill="#f43f5e" />
        <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12C1.5 18 12 27.5 12 27.5C12 27.5 22.5 18 22.5 12C22.5 6.2 17.8 1.5 12 1.5Z" fill="#ffffff" />
        <circle cx="12" cy="11" r="8.5" fill="#f43f5e" />
      </svg>
      <span class="absolute top-[5px] text-[12px] select-none z-10">📍</span>
    </div>
  `,
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -32]
});

// Pulse indicator icon when zooming to a zone
const selectedZoneIcon = L.divIcon({
  className: 'selected-zone-marker',
  html: `
    <div class="relative flex items-center justify-center w-12 h-12">
      <div class="absolute w-12 h-12 rounded-full bg-emerald-500/30 animate-ping"></div>
      <div class="absolute w-8 h-8 rounded-full bg-emerald-500/50 animate-pulse"></div>
      <div class="w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 shadow-lg"></div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24]
});

function getZoneCenter(zone: AbuZone): [number, number] {
  const lngs = zone.coordinates.map(c => c[0]);
  const lats = zone.coordinates.map(c => c[1]);
  const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
  const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
  return [centerLat, centerLng];
}

function getZoneCategory(zone: AbuZone): string {
  return zone.category || 'amenity';
}

const ZONE_CATEGORY_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  faculty: { label: 'Faculties', emoji: '🎓', color: '#10b981' },
  department: { label: 'Departments', emoji: '📖', color: '#14b8a6' },
  hostel: { label: 'Hostels', emoji: '🏢', color: '#ec4899' },
  gate: { label: 'Gates', emoji: '🚧', color: '#ef4444' },
  library: { label: 'Libraries', emoji: '📚', color: '#6366f1' },
  administration: { label: 'Central Admin', emoji: '🏛️', color: '#3b82f6' },
  amenity: { label: 'Amenities', emoji: '🛍️', color: '#f59e0b' },
  health: { label: 'Medical', emoji: '🏥', color: '#06b6d4' },
  worship: { label: 'Worship', emoji: '🕌', color: '#8b5cf6' },
  ict: { label: 'ICT Center', emoji: '💻', color: '#f43f5e' },
  'student-services': { label: 'Support', emoji: '🤝', color: '#e11d48' },
  infrastructure: { label: 'Utility', emoji: '⚙️', color: '#64748b' }
};

export const CAMPUS_BOUNDS = L.latLngBounds([11.135, 7.615], [11.170, 7.665]);

export function createZoneIcon(zone: AbuZone, isSelected: boolean) {
  const category = zone.category || 'amenity';
  const info = ZONE_CATEGORY_INFO[category] || { label: 'Amenity', emoji: '📍', color: '#64748b' };
  const color = zone.color || '#64748b';
  
  return L.divIcon({
    className: 'custom-zone-marker-container',
    html: `
      <div class="relative flex flex-col items-center group cursor-pointer transition-all duration-200 hover:scale-115 ${isSelected ? 'scale-115' : ''}">
        <!-- SVG Pin Shape (Sized Down) -->
        <svg style="width: 20px; height: 25px;" class="drop-shadow-sm filter" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 0C5.37 0 0 5.37 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37 18.63 0 12 0Z" fill="${color}" />
          <path d="M12 1.5C6.2 1.5 1.5 6.2 1.5 12C1.5 18 12 27.5 12 27.5C12 27.5 22.5 18 22.5 12C22.5 6.2 17.8 1.5 12 1.5Z" fill="#0f172a" />
          <circle cx="12" cy="11" r="7" fill="#0f172a" />
        </svg>
        <!-- Category Emoji Centered (Sized Down) -->
        <span class="absolute top-[3px] text-[8px] font-sans select-none z-10">${info.emoji}</span>
        <!-- Optional pulse outer ring if selected -->
        ${isSelected ? `<span class="absolute top-1 w-5 h-5 rounded-full animate-ping bg-emerald-400 opacity-20 pointer-events-none"></span>` : ''}
      </div>
    `,
    iconSize: [20, 25],
    iconAnchor: [10, 25],
    popupAnchor: [0, -22]
  });
}

// MapRecenter component to fly map to coordinates
function MapRecenter({ center, zoom }: { center: [number, number] | null; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, {
        animate: true,
        duration: 1.5
      });
    }
  }, [center, zoom, map]);
  return null;
}

interface MapComponentProps {
  reports: Report[];
  onMapClick?: (lat: number, lng: number) => void;
  reportingCoords?: { lat: number; lng: number } | null;
  onReportingCoordsChange?: (lat: number, lng: number) => void;
  selectedReport?: Report | null;
  onSelectReport?: (report: Report) => void;
}

export default function MapComponent({
  reports,
  onMapClick,
  reportingCoords,
  onReportingCoordsChange,
  selectedReport,
  onSelectReport
}: MapComponentProps) {
  const [zoom, setZoom] = useState(15);
  const [focusCoords, setFocusCoords] = useState<[number, number] | null>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [mapLayer, setMapLayer] = useState<'streets' | 'satellite' | 'dark'>('streets');

  const handleSelectZone = (zone: AbuZone) => {
    const center = getZoneCenter(zone);
    setSelectedZoneId(zone.id);
    setFocusCoords(center);
    if (window.innerWidth < 640) {
      setIsSidebarOpen(false);
    }
  };

  // Custom click and zoom handler within the Leaflet context
  const MapEvents = () => {
    const map = useMapEvents({
      click(e) {
        if (onMapClick) {
          onMapClick(e.latlng.lat, e.latlng.lng);
        }
      },
      zoomend() {
        setZoom(map.getZoom());
      }
    });
    return null;
  };

  // Event handler for dragging the reporter's marker
  const handleMarkerDrag = (e: L.LeafletEvent) => {
    const marker = e.target as L.Marker;
    const position = marker.getLatLng();
    if (onReportingCoordsChange) {
      onReportingCoordsChange(position.lat, position.lng);
    }
  };

  const filteredZones = abuZones.filter(zone => {
    const category = getZoneCategory(zone);
    const matchesSearch = zone.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          zone.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (activeCategory === 'all') return matchesSearch;
    if (activeCategory === 'faculty') return category === 'faculty' && matchesSearch;
    if (activeCategory === 'department') return category === 'department' && matchesSearch;
    if (activeCategory === 'hostel') return category === 'hostel' && matchesSearch;
    if (activeCategory === 'other') {
      return ['gate', 'library', 'administration', 'amenity', 'health', 'worship', 'ict', 'student-services', 'infrastructure'].includes(category) && matchesSearch;
    }
    return matchesSearch;
  });

  return (
    <div id="map-container" className="relative w-full h-full rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      <MapContainer
        center={[ABU_LAT, ABU_LNG]}
        zoom={15}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ background: '#0f172a' }}
        maxBounds={CAMPUS_BOUNDS}
        minZoom={14}
      >
        <MapRecenter center={focusCoords} zoom={17} />
        <TileLayer
          key={mapLayer}
          attribution={
            mapLayer === 'dark'
              ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              : '&copy; <a href="https://maps.google.com">Google Maps</a>'
          }
          url={
            mapLayer === 'dark'
              ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              : mapLayer === 'streets'
                ? "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                : "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
          }
        />
        
        {/* Render ABU campus zones as clickable styled Polygons and Markers */}
        {abuZones.map((zone: AbuZone) => {
          const isSelected = selectedZoneId === zone.id;
          const center = getZoneCenter(zone);
          
          // Leaflet Polygon expects positions to be [lat, lng][].
          // Since our zone.coordinates is formatted as [lng, lat][] (longitude-first),
          // we convert them to [lat, lng][] (latitude-first) for Leaflet rendering.
          const leafletPositions = zone.coordinates.map(([lng, lat]) => [lat, lng] as [number, number]);
          
          return (
            <React.Fragment key={zone.id}>
              <Polygon
                positions={leafletPositions}
                pathOptions={{
                  color: zone.color,
                  fillColor: zone.color,
                  fillOpacity: isSelected ? 0.35 : 0.08,
                  weight: isSelected ? 2.5 : 1,
                  dashArray: isSelected ? '4, 4' : undefined,
                }}
                eventHandlers={{
                  click: () => {
                    setSelectedZoneId(zone.id);
                    if (onMapClick) {
                      onMapClick(center[0], center[1]);
                    }
                  }
                }}
              />
              <Marker
                position={center}
                icon={createZoneIcon(zone, isSelected)}
                eventHandlers={{
                  click: () => {
                    // Set the clicked zone as selected
                    setSelectedZoneId(zone.id);
                    // Clicking on a zone can prompt reporting in that zone
                    if (onMapClick) {
                      onMapClick(center[0], center[1]);
                    }
                  }
                }}
              >
                {zoom >= 16 && (
                  <Tooltip
                    permanent
                    direction="top"
                    offset={[0, -25]}
                    className="!bg-slate-950/90 !border-slate-800 !text-slate-200 !shadow-lg !p-1 !px-2 rounded-md font-sans text-[9px] font-semibold tracking-wide whitespace-nowrap pointer-events-none"
                  >
                    {zone.name}
                  </Tooltip>
                )}
                <Popup>
                  <div className="text-xs text-slate-100 bg-slate-950 p-1.5 rounded">
                    <h4 className="font-bold text-sm" style={{ color: zone.color }}>{zone.name}</h4>
                    <p className="mt-1 text-slate-300">{zone.description}</p>
                    <div className="mt-1.5 text-[10px] text-slate-400 font-mono">ID: {zone.id}</div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        })}

        {/* Selected Zone Pulsing Pinpoint indicator */}
        {selectedZoneId && (() => {
          const zone = abuZones.find(z => z.id === selectedZoneId);
          if (zone) {
            const center = getZoneCenter(zone);
            return (
              <Marker
                position={center}
                icon={selectedZoneIcon}
                interactive={false}
              />
            );
          }
          return null;
        })()}

        {/* Existing reports marked on the map */}
        {reports.map((report: Report) => {
          const isSelected = selectedReport && selectedReport.id === report.id;
          return (
            <Marker
              key={report.id}
              position={[report.lat, report.lng]}
              icon={createCustomIcon(report.category, report.status)}
              eventHandlers={{
                click: () => {
                  if (onSelectReport) {
                    onSelectReport(report);
                  }
                }
              }}
            >
              <Popup>
                <div className="p-2 max-w-[200px] text-xs text-slate-100">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-sm">{CATEGORY_ICONS[report.category]}</span>
                    <span className="font-bold capitalize text-slate-200">
                      {report.category.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-slate-300 line-clamp-2 mt-1">{report.description}</p>
                  
                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-800">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      report.status === 'resolved' ? 'bg-green-500/20 text-green-400' :
                      report.status === 'in_progress' ? 'bg-indigo-500/20 text-indigo-400' :
                      report.status === 'assigned' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {report.status}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">
                      🔺 {report.upvotes} upvotes
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {/* Reporter placement marker */}
        {reportingCoords && (
          <Marker
            position={[reportingCoords.lat, reportingCoords.lng]}
            icon={activeReportingIcon}
            draggable={true}
            eventHandlers={{
              dragend: handleMarkerDrag
            }}
          >
            <Popup>
              <div className="p-2 text-xs text-slate-100 text-center">
                <span className="font-bold block text-sm mb-1 text-rose-400">Target Issue Location</span>
                <span>Drag me precisely to the broken facility! 🚀</span>
                <span className="block mt-1 font-mono text-[10px] text-slate-400">
                  Lat: {reportingCoords.lat.toFixed(5)}, Lng: {reportingCoords.lng.toFixed(5)}
                </span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Listeners for click interaction to place pin */}
        <MapEvents />
      </MapContainer>
      
      {/* Search & Location Directory Sidebar Toggle */}
      <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2 max-w-[90%]">
        <div className="flex gap-2">
          {/* Dynamic Map Tile Layer Selector */}
          <button
            type="button"
            onClick={() => {
              setMapLayer(prev => prev === 'streets' ? 'satellite' : prev === 'satellite' ? 'dark' : 'streets');
            }}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl shadow-lg transition-all duration-200 select-none"
          >
            <Compass className={`w-4 h-4 text-sky-400 ${mapLayer === 'satellite' ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            <span className="text-xs font-semibold">
              {mapLayer === 'streets' ? 'Google Streets' : mapLayer === 'satellite' ? 'Google Satellite' : 'Dark Map'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-900/95 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white rounded-xl shadow-lg transition-all duration-200"
          >
            {isSidebarOpen ? (
              <>
                <X className="w-4 h-4 text-rose-400" />
                <span className="text-xs font-semibold">Close Directory</span>
              </>
            ) : (
              <>
                <MapPinned className="w-4 h-4 text-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold">Campus Directory</span>
              </>
            )}
          </button>
        </div>

        {isSidebarOpen && (
          <div className="w-80 max-h-[70vh] flex flex-col bg-slate-950/95 backdrop-blur border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Campus Directory</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Find & pinpoint any location</p>
                </div>
              </div>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-slate-900/60">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search departments, halls, gates..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900/80 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs text-white rounded-lg pl-9 pr-8 py-2.5 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-500 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Category quick filters */}
            <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b border-slate-900/60 scrollbar-none select-none">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap ${
                  activeCategory === 'all'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All ({abuZones.length})
              </button>
              <button
                onClick={() => setActiveCategory('faculty')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'faculty'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>🎓</span>
                <span>Faculties</span>
              </button>
              <button
                onClick={() => setActiveCategory('department')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'department'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>📖</span>
                <span>Depts</span>
              </button>
              <button
                onClick={() => setActiveCategory('hostel')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'hostel'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>🏢</span>
                <span>Hostels</span>
              </button>
              <button
                onClick={() => setActiveCategory('other')}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all whitespace-nowrap flex items-center gap-1 ${
                  activeCategory === 'other'
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                <span>🌐</span>
                <span>Central</span>
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto max-h-[35vh] p-2 space-y-1 scrollbar-thin">
              {filteredZones.length === 0 ? (
                <div className="p-6 text-center text-slate-500">
                  <MapPin className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-[11px]">No campus locations found matching your search.</p>
                </div>
              ) : (
                filteredZones.map((zone) => {
                  const category = getZoneCategory(zone);
                  const info = ZONE_CATEGORY_INFO[category] || { label: 'Amenity', emoji: '📍', color: '#64748b' };
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <button
                      key={zone.id}
                      onClick={() => handleSelectZone(zone)}
                      className={`w-full flex items-start gap-2.5 p-2 rounded-xl text-left border transition-all duration-150 group ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-slate-900/40 hover:bg-slate-900 border-slate-900/50 hover:border-slate-800'
                      }`}
                    >
                      <div
                        className="w-7 h-7 flex-shrink-0 flex items-center justify-center rounded-lg text-sm bg-slate-950 border"
                        style={{ borderColor: zone.color }}
                      >
                        {info.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className={`text-[11px] font-bold truncate block ${
                            isSelected ? 'text-emerald-400' : 'text-slate-200 group-hover:text-white'
                          }`}>
                            {zone.name}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                        </div>
                        <span className="text-[9px] text-slate-400 block truncate mt-0.5">
                          {zone.description}
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: zone.color }}
                          ></span>
                          <span className="text-[8px] text-slate-500 font-medium uppercase tracking-wider">
                            {info.label}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer / Quick Stats */}
            <div className="p-3 bg-slate-950 border-t border-slate-900/80 flex items-center justify-between text-[9px] text-slate-500 font-sans">
              <span>Showing {filteredZones.length} of {abuZones.length} sites</span>
              <span className="font-mono text-emerald-500/80">ABU Campus Map</span>
            </div>
          </div>
        )}
      </div>

      {/* Small float overlay explaining interaction */}
      <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 p-2.5 rounded-xl max-w-[200px] text-[10px] text-slate-300 shadow-lg pointer-events-none sm:block hidden">
        <div className="font-semibold text-slate-200 mb-1">💡 Interactive Maps Guide</div>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Click any zone boundary to see details.</li>
          <li>Click anywhere on map to drop a **New Report Pin**.</li>
          <li>Drag the 📍 pin to adjust the coordinates.</li>
        </ul>
      </div>
    </div>
  );
}
