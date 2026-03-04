"use client";

import { useState } from "react";
import { Drawer, Box, Typography, TextField, Button } from "@mui/material";

interface AreaSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (areaData: any) => Promise<void>;
  coordinates: number[][] | null;
}

export default function AreaSheet({ open, onClose, onSubmit, coordinates }: AreaSheetProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!coordinates || coordinates.length === 0 || !name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ coordinates, name, notes });
      setName("");
      setNotes("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <Typography variant="h6" gutterBottom>
          Save Covered Area
        </Typography>
        
        {coordinates && (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Points: {coordinates.length}
          </Typography>
        )}

        <TextField
          fullWidth
          label="Area Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          required
        />

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
          disabled={loading || !name.trim() || !coordinates}
        >
          {loading ? "Saving..." : "Save Area"}
        </Button>
      </Box>
    </Drawer>
  );
}
