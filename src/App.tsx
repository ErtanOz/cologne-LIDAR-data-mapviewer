import { useEffect, useRef, useState } from 'react';
import maplibregl, { Map as MapLibreMap } from 'maplibre-gl';
import { LidarControlReact, useLidarState, LidarControl } from './lidar-lib/react';
import LidarLoading from './components/LidarLoading';
import 'maplibre-gl-lidar/style.css';
import 'maplibre-gl/dist/maplibre-gl.css';
import './App.css';

// List of available local data files
const AVAILABLE_FILES = [
  { id: 'dataset-1', name: 'West-Teil (Dataset 1)', url: './data/3dm_32_356_5644_1_nw.laz' },
  { id: 'dataset-2', name: 'Ost-Teil (Dataset 2)', url: './data/3dm_32_356_5645_1_nw.laz' }
];

const BASEMAPS = {
  dark: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  light: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
};

function App() {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);
  const [activeUrls, setActiveUrls] = useState<string[]>([AVAILABLE_FILES[0].url]);
  const [basemap, setBasemap] = useState<'dark' | 'light'>('dark');
  const lidarControlRef = useRef<LidarControl | null>(null);
  const loadedPointClouds = useRef<Map<string, string>>(new Map()); // URL -> ID

  // Lidar state management for sync
  const { state } = useLidarState({
    pointSize: 3,
    colorScheme: 'elevation',
    usePercentile: true,
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map) return;

    const mapInstance = new maplibregl.Map({
      container: mapContainer.current,
      style: BASEMAPS[basemap],
      center: [6.9531, 50.9352], // Cologne center
      zoom: 12,
      pitch: 60,
      maxPitch: 85,
      attributionControl: false
    });

    mapInstance.on('load', () => {
      setMap(mapInstance);
      mapInstance.addControl(new maplibregl.NavigationControl(), 'top-left');
      mapInstance.addControl(new maplibregl.AttributionControl({
        customAttribution: 'Created by Ertan Özcan | Based on maplibre-gl-lidar by Qiusheng Wu | Data: <a href="https://www.opengeodata.nrw" target="_blank">opengeodata.nrw</a>'
      }), 'bottom-right');
    });

    return () => {
      mapInstance.remove();
      setMap(null);
    };
  }, []);

  // Handle basemap change
  useEffect(() => {
    if (map) {
      map.setStyle(BASEMAPS[basemap]);
    }
  }, [basemap, map]);

  // Sync point clouds based on activeUrls
  useEffect(() => {
    const control = lidarControlRef.current;
    if (!control || !map) return;

    // 1. Identify URLs to remove
    const urlsToRemove = Array.from(loadedPointClouds.current.keys())
      .filter(url => !activeUrls.includes(url));
    
    urlsToRemove.forEach(url => {
      const id = loadedPointClouds.current.get(url);
      if (id) {
        control.unloadPointCloud(id);
        loadedPointClouds.current.delete(url);
      }
    });

    // 2. Identify URLs to add
    const urlsToAdd = activeUrls.filter(url => !loadedPointClouds.current.has(url));
    
    urlsToAdd.forEach(async (url) => {
      try {
        const info = await control.loadPointCloud(url);
        loadedPointClouds.current.set(url, info.id);
      } catch (err) {
        console.error(`Failed to load ${url}:`, err);
      }
    });

  }, [activeUrls, map]);

  const toggleUrl = (url: string) => {
    setActiveUrls(prev => 
      prev.includes(url) 
        ? prev.filter(u => u !== url) 
        : [...prev, url]
    );
  };

  const handleControlReady = (control: LidarControl) => {
    lidarControlRef.current = control;
    // Initial sync will happen via the useEffect above since lidarControlRef.current is now set
  };

  return (
    <div className="app-container">
      <div className="sidebar">
        <h1>Cologne LidarData MapViewer</h1>
        
        <div className="sidebar-section">
          <h3>Basemap</h3>
          <div className="toggle-group">
            <button 
              className={basemap === 'light' ? 'active' : ''} 
              onClick={() => setBasemap('light')}
            >Light</button>
            <button 
              className={basemap === 'dark' ? 'active' : ''} 
              onClick={() => setBasemap('dark')}
            >Dark</button>
          </div>
        </div>

        <div className="sidebar-section">
          <h3>Datasets</h3>
          <div className="checkbox-list">
            {AVAILABLE_FILES.map((file) => (
              <label key={file.id} className="checkbox-item">
                <input 
                  type="checkbox" 
                  checked={activeUrls.includes(file.url)}
                  onChange={() => toggleUrl(file.url)}
                />
                <span className="checkbox-label">{file.name}</span>
              </label>
            ))}
          </div>
        </div>
        
        <div className="info-panel">
          <p>Analyzing Cologne high-resolution LiDAR scans.</p>
          <div className="instructions">
            <ul>
              <li><span>Pan</span> <strong>Left Drag</strong></li>
              <li><span>Rotate</span> <strong>Right Drag</strong></li>
              <li><span>Zoom</span> <strong>Scroll</strong></li>
            </ul>
          </div>
          <div className="attribution-credits">
            <p>Created by <span>Ertan Özcan</span></p>
            <p>Based on project <span>maplibre-gl-lidar</span> by <span>Qiusheng Wu</span></p>
            <p className="data-source">Datasource: <a href="https://www.opengeodata.nrw" target="_blank" rel="noopener noreferrer">opengeodata.nrw</a></p>
          </div>
        </div>
      </div>

      <div ref={mapContainer} className="map-container" />
      
      {/* Premium Lidar Loading Interactive Overlay */}
      <LidarLoading 
        isLoading={!!(state.loading || (state.streamingActive && state.streamingProgress?.isLoading))}
        progress={state.streamingProgress ? Math.min(100, (state.streamingProgress.loadedPoints / 5000000) * 100) : 0}
        pointsLoaded={state.streamingProgress?.loadedPoints}
      />

      {map && (
        <LidarControlReact
          map={map}
          title="Cologne Lidar Control"
          position="top-right"
          pointSize={state.pointSize}
          colorScheme={state.colorScheme}
          onControlReady={handleControlReady}
          autoZoom={true}
        />
      )}
    </div>
  );
}

export default App;
