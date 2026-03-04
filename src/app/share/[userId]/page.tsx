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
  const [track, setTrack] = useState<any>(null);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [markersRes, areasRes, trackRes] = await Promise.all([
        fetch(`/api/share/${userId}/markers`),
        fetch(`/api/share/${userId}/areas`),
        fetch(`/api/share/${userId}/tracks`),
      ]);
      
      if (!markersRes.ok || !areasRes.ok) {
         setError(true);
         return;
      }

      const markersData = await markersRes.json();
      const areasData = await areasRes.json();
      const trackData = trackRes.ok ? await trackRes.json() : null;
      
      if (markersData.markers) setMarkers(markersData.markers);
      if (areasData.areas) setAreas(areasData.areas);
      if (trackData?.track) setTrack(trackData.track.geojson);
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

  const renderTrack = () => {
    if (!track) return null;
    
    const features = track.type === 'FeatureCollection' 
      ? track.features 
      : [track];

    return features.map((feature: any, idx: number) => {
      if (feature.geometry.type === 'Polygon') {
        const paths = feature.geometry.coordinates[0].map((coord: any) => ({
          lat: coord[1],
          lng: coord[0]
        }));
        return (
          <Polygon
            key={`track-${idx}`}
            paths={paths}
            options={{
              fillColor: "#4ade80",
              fillOpacity: 0.5,
              strokeColor: "#16a34a",
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
              key={`track-${idx}-${pIdx}`}
              paths={paths}
              options={{
                fillColor: "#4ade80",
                fillOpacity: 0.5,
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

        {renderTrack()}
      </GoogleMap>
    </Box>
  );
}
