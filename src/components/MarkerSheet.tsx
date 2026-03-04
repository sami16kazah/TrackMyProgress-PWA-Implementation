"use client";

import { useState, useEffect } from "react";
import { Drawer, Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

interface MarkerSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (markerData: any) => Promise<void>;
  onDelete?: (markerId: string) => Promise<void>;
  lat?: number | null;
  lng?: number | null;
  marker?: any | null;
}

export default function MarkerSheet({ open, onClose, onSubmit, onDelete, lat, lng, marker }: MarkerSheetProps) {
  const [type, setType] = useState<"house" | "business" | "other">("house");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initialize state when the marker prop changes
  useEffect(() => {
    if (marker) {
      setType(marker.type || "house");
      setNotes(marker.notes || "");
    } else {
      setType("house");
      setNotes("");
    }
  }, [marker, open]);

  const handleSubmit = async () => {
    if (!lat && !marker?.lat) return;
    setLoading(true);
    try {
      await onSubmit({ lat: lat || marker.lat, lng: lng || marker.lng, type, notes });
      if (!marker) {
        setNotes("");
        setType("house");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!marker || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(marker._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <Typography variant="h6" gutterBottom>
          {marker ? "View/Edit Delivery Record" : "Add Delivery Record"}
        </Typography>
        
        {(lat && lng) || (marker?.lat && marker?.lng) ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Location: {(lat || marker.lat).toFixed(5)}, {(lng || marker.lng).toFixed(5)}
          </Typography>
        ) : null}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as any)}
            disabled={!!marker} // Assuming we only view/delete for now, but leaving edit possibility
          >
            <MenuItem value="house">House</MenuItem>
            <MenuItem value="business">Business</MenuItem>
            <MenuItem value="other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Notes (Optional)"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
          disabled={!!marker}
        />

        {!marker ? (
          <Button
            fullWidth
            variant="contained"
            size="large"
            color="primary"
            onClick={handleSubmit}
            disabled={loading || !lat || !lng}
          >
            {loading ? "Saving..." : "Save Marker"}
          </Button>
        ) : (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Marker"}
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
