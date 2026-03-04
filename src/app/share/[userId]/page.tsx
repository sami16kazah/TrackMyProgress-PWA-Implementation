"use client";

import { useEffect, useState, useCallback, use } from "react";
import { GoogleMap, useJsApiLoader, Marker, Polygon } from "@react-google-maps/api";
import { Box, CircularProgress, Typography } from "@mui/material";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 51.505,
  lng: -0.09,
};

const libraries: ("drawing" | "geometry" | "places" | "visualization")[] = ["drawing"];

export default function SharedMapPage({ params }: { params: Promise<{ userId: string }> }) {
  const unwrappedParams = use(params);
  const userId = unwrappedParams.userId;

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries,
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [areas, setAreas] = useState<any[]>([]);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      // Need a public endpoint to fetch data by userId
      const [markersRes, areasRes] = await Promise.all([
        fetch(`/api/share/${userId}/markers`),
        fetch(`/api/share/${userId}/areas`),
      ]);
      
      if (!markersRes.ok || !areasRes.ok) {
         setError(true);
         return;
      }

      const markersData = await markersRes.json();
      const areasData = await areasRes.json();
      
      if (markersData.markers) setMarkers(markersData.markers);
      if (areasData.areas) setAreas(areasData.areas);
    } catch (err) {
      console.error("Failed to fetch shared data", err);
      setError(true);
    }
  }, [userId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onLoad = useCallback(function callback(map: google.maps.Map) {
    setMap(map);
  }, []);

  const onUnmount = useCallback(function callback(map: google.maps.Map) {
    setMap(null);
  }, []);

  if (error) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <Typography color="error">Coverage data not found or is private.</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  const centerMap = markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : defaultCenter;

  return (
    <Box sx={{ height: "100vh", width: "100%", position: "relative" }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={centerMap}
        zoom={12}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
        }}
      >
        {markers.map((marker) => (
          <Marker 
            key={marker._id} 
            position={{ lat: marker.lat, lng: marker.lng }} 
            title={marker.type}
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
              options={{
                fillColor: "#3b82f6",
                fillOpacity: 0.3,
                strokeColor: "#2563eb",
                strokeWeight: 2,
                clickable: false,
              }}
            />
          );
        })}
      </GoogleMap>
    </Box>
  );
}
