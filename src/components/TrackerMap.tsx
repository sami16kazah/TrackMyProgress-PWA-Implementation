"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon, DrawingManager } from "@react-google-maps/api";
import { Box, CircularProgress, IconButton, Button, Typography, Paper } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import StopIcon from "@mui/icons-material/Stop";
import ShareIcon from "@mui/icons-material/Share";
import { useSession } from "next-auth/react";
import * as turf from "@turf/turf";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 51.505,
  lng: -0.09,
};

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = ["drawing"];

export default function TrackerMap() {
  const { data: session } = useSession();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as any,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  
  // Target Area (defined by user)
  const [targetArea, setTargetArea] = useState<any | null>(null);
  
  // Coverage Area (Turf.js MultiPolygon)
  const [coverageGeojson, setCoverageGeojson] = useState<any>(null);
  const lastLocationRef = useRef<google.maps.LatLngLiteral | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  // Fetch existing track on mount
  useEffect(() => {
    const fetchTrack = async () => {
      try {
        const res = await fetch("/api/tracks");
        const data = await res.json();
        if (data.track) {
          setCoverageGeojson(data.track.geojson);
        }
      } catch (e) {
        console.error("Failed to fetch track", e);
      }
    };
    fetchTrack();
  }, []);

  // Auto-save effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTracking && coverageGeojson) {
      interval = setInterval(async () => {
        try {
          await fetch("/api/tracks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ geojson: coverageGeojson }),
          });
        } catch (e) {
          console.error("Failed to auto-save track", e);
        }
      }, 10000); // Save every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTracking, coverageGeojson]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const newPos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(newPos);

          if (isTracking && lastLocationRef.current) {
            updateCoverage(lastLocationRef.current, newPos);
          }
          lastLocationRef.current = newPos;
        },
        (error) => console.error("Error watching position", error),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, [isTracking, coverageGeojson]);

  const updateCoverage = (start: google.maps.LatLngLiteral, end: google.maps.LatLngLiteral) => {
    // Create a 10m buffer around the line segment from start to end
    const line = turf.lineString([[start.lng, start.lat], [end.lng, end.lat]]);
    const buffer = turf.buffer(line, 10, { units: 'meters' });

    if (!coverageGeojson) {
      setCoverageGeojson(buffer);
    } else {
      try {
        const unioned = turf.union(turf.featureCollection([coverageGeojson, buffer]));
        if (unioned) {
          setCoverageGeojson(unioned);
        }
      } catch (e) {
        console.error("Turf union error", e);
      }
    }
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath().getArray().map(latLng => [latLng.lng(), latLng.lat()]);
    // Close the loop for turf
    path.push(path[0]);
    const geojson = turf.polygon([path]);
    setTargetArea(geojson);
    polygon.setMap(null); // Hide drawing helper
  };

  const centerOnUser = () => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(17);
    }
  };

  const handleShare = () => {
    if (session?.user) {
      const userId = (session.user as any).id;
      const shareUrl = `${window.location.origin}/share/${userId}`;
      navigator.clipboard.writeText(shareUrl);
      alert("Live Share Link Copied to Clipboard!");
    } else {
      alert("You must be logged in to share.");
    }
  };

  if (!isLoaded) return <CircularProgress />;

  // Convert coverageGeojson to Google Maps paths
  const renderCoverage = () => {
    if (!coverageGeojson) return null;
    
    const features = coverageGeojson.type === 'FeatureCollection' 
      ? coverageGeojson.features 
      : [coverageGeojson];

    return features.map((feature: any, idx: number) => {
      if (feature.geometry.type === 'Polygon') {
        const paths = feature.geometry.coordinates[0].map((coord: any) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        return (
          <Polygon
            key={`cov-${idx}`}
            paths={paths}
            options={{
              fillColor: "#4ade80", // Green-400
              fillOpacity: 0.6,
              strokeColor: "#16a34a", // Green-600
              strokeWeight: 1,
              clickable: false,
            }}
          />
        );
      } else if (feature.geometry.type === 'MultiPolygon') {
        return feature.geometry.coordinates.map((poly: any, pIdx: number) => {
          const paths = poly[0].map((coord: any) => ({
            lat: coord[1],
            lng: coord[0]
          }));
          return (
            <Polygon
              key={`cov-${idx}-${pIdx}`}
              paths={paths}
              options={{
                fillColor: "#4ade80",
                fillOpacity: 0.6,
                strokeColor: "#16a34a",
                strokeWeight: 1,
                clickable: false,
              }}
            />
          );
        });
      }
      return null;
    });
  };

  return (
    <Box sx={{ height: "100%", width: "100%", position: "relative" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={15}
        onLoad={onMapLoad}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {userLocation && (
          <Marker 
            position={userLocation} 
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "white",
              strokeWeight: 3,
            }}
          />
        )}

        {/* Render User Defined Target Area */}
        {targetArea && (
          <Polygon
            paths={targetArea.geometry.coordinates[0].map((coord: any) => ({
              lat: coord[1] as number,
              lng: coord[0] as number
            }))}
            options={{
              fillColor: "#6366f1", // Indigo-500
              fillOpacity: 0.2,
              strokeColor: "#4f46e5",
              strokeWeight: 2,
            }}
          />
        )}

        {/* Render Automatic Coverage */}
        {renderCoverage()}

        <DrawingManager
          onPolygonComplete={handlePolygonComplete}
          options={{
            drawingControl: !targetArea, // Hide once target is set
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [google.maps.drawing.OverlayType.POLYGON],
            },
            polygonOptions: {
              fillColor: "#6366f1",
              fillOpacity: 0.3,
              strokeColor: "#4f46e5",
              strokeWeight: 2,
              editable: true,
            }
          }}
        />
      </GoogleMap>

      {/* UI Controls */}
      <Box sx={{ position: "absolute", bottom: 100, left: 16, right: 16, display: "flex", flexDirection: "column", gap: 2 }}>
        <Paper sx={{ p: 2, display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: 2 }}>
          <Box>
            <Typography variant="subtitle2" color="text.secondary">
              Status: {isTracking ? "Tracking Active" : "Waiting"}
            </Typography>
            <Typography variant="h6">
              {coverageGeojson ? (turf.area(coverageGeojson)).toFixed(1) : "0.0"} m² covered
            </Typography>
          </Box>
          <Button
            variant="contained"
            color={isTracking ? "error" : "success"}
            startIcon={isTracking ? <StopIcon /> : <PlayArrowIcon />}
            onClick={() => setIsTracking(!isTracking)}
            sx={{ borderRadius: 10, px: 3 }}
          >
            {isTracking ? "Stop" : "Start"}
          </Button>
        </Paper>
      </Box>

      {/* Floating Buttons */}
      <Box sx={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 1 }}>
        <IconButton
          onClick={handleShare}
          sx={{ backgroundColor: "white", boxShadow: 3, "&:hover": { backgroundColor: "#f3f4f6" }, p: 1.5 }}
        >
          <ShareIcon color="secondary" />
        </IconButton>

        <IconButton
          onClick={centerOnUser}
          sx={{ backgroundColor: "white", boxShadow: 3, "&:hover": { backgroundColor: "#f3f4f6" }, p: 1.5 }}
        >
          <MyLocationIcon color="primary" />
        </IconButton>
        
        {targetArea && (
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => {
              setTargetArea(null);
              setCoverageGeojson(null);
            }} 
            sx={{ backgroundColor: "white", color: "red", "&:hover": { backgroundColor: "#fee2e2" } }}
          >
            Reset
          </Button>
        )}
      </Box>
    </Box>
  );
}
