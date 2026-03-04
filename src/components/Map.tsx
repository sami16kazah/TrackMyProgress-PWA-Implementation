"use client";

import { useEffect, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon, DrawingManager } from "@react-google-maps/api";
import { Box, CircularProgress, IconButton } from "@mui/material";
import MyLocationIcon from "@mui/icons-material/MyLocation";
import ShareIcon from "@mui/icons-material/Share";
import { useSession } from "next-auth/react";
import MarkerSheet from "./MarkerSheet";
import AreaSheet from "./AreaSheet";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 51.505,
  lng: -0.09,
};

const libraries: ("drawing" | "geometry" | "localContext" | "places" | "visualization")[] = ["drawing"];

export default function AppMap() {
  const { data: session } = useSession();
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries as any,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  
  // Marker Sheet State
  const [markerSheetOpen, setMarkerSheetOpen] = useState(false);
  const [selectedLat, setSelectedLat] = useState<number | null>(null);
  const [selectedLng, setSelectedLng] = useState<number | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<any | null>(null);

  // Area Sheet State
  const [areaSheetOpen, setAreaSheetOpen] = useState(false);
  const [selectedCoordinates, setSelectedCoordinates] = useState<number[][] | null>(null);
  const [selectedArea, setSelectedArea] = useState<any | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [markersRes, areasRes] = await Promise.all([
        fetch("/api/markers"),
        fetch("/api/areas")
      ]);
      const markersData = await markersRes.json();
      const areasData = await areasRes.json();
      
      if (markersData.markers) setMarkers(markersData.markers);
      if (areasData.areas) setAreas(areasData.areas);
    } catch (error) {
      console.error("Failed to fetch data", error);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (navigator.geolocation) {
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => console.error("Error watching position", error),
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
      );
      return () => navigator.geolocation.clearWatch(watchId);
    }
  }, []);

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      setSelectedLat(e.latLng.lat());
      setSelectedLng(e.latLng.lng());
      setSelectedMarker(null);
      setMarkerSheetOpen(true);
    }
  };

  // Interaction Handlers
  const handleMarkerClick = (marker: any) => {
    setSelectedLat(null);
    setSelectedLng(null);
    setSelectedMarker(marker);
    setMarkerSheetOpen(true);
  };

  const handleAreaClick = (area: any) => {
    setSelectedCoordinates(null);
    setSelectedArea(area);
    setAreaSheetOpen(true);
  };

  const handleMarkerDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/markers/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMarkerSheetOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete marker", error);
    }
  };

  const handleAreaDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/areas/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAreaSheetOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to delete area", error);
    }
  };

  const centerOnUser = () => {
    if (userLocation && map) {
      map.panTo(userLocation);
      map.setZoom(16);
    }
  };

  const handleMarkerSubmit = async (markerData: any) => {
    try {
      const res = await fetch("/api/markers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(markerData),
      });
      if (res.ok) {
        setMarkerSheetOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save marker", error);
    }
  };

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath().getArray().map(latLng => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));
    
    const coordinates = path.map(p => [p.lat, p.lng]);
    setSelectedCoordinates(coordinates);
    setSelectedArea(null);
    setAreaSheetOpen(true);
    
    // Remove the unsaved polygon from the map since we will render it via state when saved
    polygon.setMap(null);
  };

  const handleAreaSubmit = async (areaData: any) => {
    try {
      const res = await fetch("/api/areas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(areaData),
      });
      if (res.ok) {
        setAreaSheetOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error("Failed to save area", error);
    }
  };

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "100vh", width: "100%", position: "relative" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={userLocation || defaultCenter}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
        onClick={handleMapClick}
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
               scale: 7,
               fillColor: "#3b82f6",
               fillOpacity: 1,
               strokeColor: "white",
               strokeWeight: 2,
            }} 
          />
        )}

        {markers.map((marker) => (
          <Marker 
            key={marker._id} 
            position={{ lat: marker.lat, lng: marker.lng }} 
            title={marker.type}
            onClick={() => handleMarkerClick(marker)}
          />
        ))}

        {areas.map((area) => {
          const paths = area.coordinates.map((coord: number[]) => ({
            lat: coord[0],
            lng: coord[1],
          }));

          return (
            <Polygon
              key={area._id}
              paths={paths}
              onClick={() => handleAreaClick(area)}
              options={{
                fillColor: "#3b82f6",
                fillOpacity: 0.45,
                strokeColor: "#2563eb",
                strokeWeight: 2,
                clickable: true,
              }}
            />
          );
        })}

        <DrawingManager
          onPolygonComplete={handlePolygonComplete}
          options={{
            drawingControl: true,
            drawingControlOptions: {
              position: google.maps.ControlPosition.TOP_CENTER,
              drawingModes: [
                google.maps.drawing.OverlayType.POLYGON,
              ],
            },
            polygonOptions: {
              fillColor: "#ef4444", // Red-500 for active drawing
              fillOpacity: 0.6,
              strokeColor: "#dc2626", // Red-600
              strokeWeight: 3,
              clickable: false,
              editable: true,
              zIndex: 1,
            },
          }}
        />
      </GoogleMap>

      <Box sx={{ position: "absolute", top: 16, left: 16, display: "flex", flexDirection: "column", gap: 1.5 }}>
        <IconButton
          onClick={() => {
            if (session?.user) {
              const userId = (session.user as any).id;
              const shareUrl = `${window.location.origin}/share/${userId}`;
              navigator.clipboard.writeText(shareUrl);
              alert("Share Link Copied to Clipboard!");
            } else {
              alert("You must be logged in to share your map.");
            }
          }}
          sx={{
            backgroundColor: "white",
            boxShadow: 3,
            "&:hover": { backgroundColor: "#f3f4f6" },
            p: 1.5,
          }}
        >
          <ShareIcon color="secondary" />
        </IconButton>
        
        <IconButton
          onClick={centerOnUser}
          sx={{
            backgroundColor: "white",
            boxShadow: 3,
            "&:hover": { backgroundColor: "#f3f4f6" },
            p: 1.5,
          }}
        >
          <MyLocationIcon color="primary" />
        </IconButton>
      </Box>

      <MarkerSheet
        open={markerSheetOpen}
        onClose={() => setMarkerSheetOpen(false)}
        onSubmit={handleMarkerSubmit}
        onDelete={handleMarkerDelete}
        lat={selectedLat}
        lng={selectedLng}
        marker={selectedMarker}
      />

      <AreaSheet
        open={areaSheetOpen}
        onClose={() => setAreaSheetOpen(false)}
        onSubmit={handleAreaSubmit}
        onDelete={handleAreaDelete}
        coordinates={selectedCoordinates}
        area={selectedArea}
      />
    </Box>
  );
}
