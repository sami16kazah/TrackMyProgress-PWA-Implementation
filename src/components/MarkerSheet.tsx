"use client";

import { useState } from "react";
import { Drawer, Box, Typography, TextField, Button, MenuItem, Select, FormControl, InputLabel } from "@mui/material";

interface MarkerSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (markerData: any) => Promise<void>;
  lat: number | null;
  lng: number | null;
}

export default function MarkerSheet({ open, onClose, onSubmit, lat, lng }: MarkerSheetProps) {
  const [type, setType] = useState<"house" | "business" | "other">("house");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!lat || !lng) return;
    setLoading(true);
    try {
      await onSubmit({ lat, lng, type, notes });
      setNotes("");
      setType("house");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <Typography variant="h6" gutterBottom>
          Add Delivery Record
        </Typography>
        
        {lat && lng && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Location: {lat.toFixed(5)}, {lng.toFixed(5)}
          </Typography>
        )}

        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Type</InputLabel>
          <Select
            value={type}
            label="Type"
            onChange={(e) => setType(e.target.value as any)}
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
        />

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
      </Box>
    </Drawer>
  );
}
