"use client";

import { useState, useEffect } from "react";
import { Drawer, Box, Typography, TextField, Button } from "@mui/material";

interface AreaSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (areaData: any) => Promise<void>;
  onDelete?: (areaId: string) => Promise<void>;
  coordinates?: number[][] | null;
  area?: any | null;
}

export default function AreaSheet({ open, onClose, onSubmit, onDelete, coordinates, area }: AreaSheetProps) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Initialize state when the area prop changes
  useEffect(() => {
    if (area) {
      setName(area.name || "");
      setNotes(area.notes || "");
    } else {
      setName("");
      setNotes("");
    }
  }, [area, open]);

  const handleSubmit = async () => {
    if (!coordinates || coordinates.length === 0 || !name.trim()) return;
    setLoading(true);
    try {
      await onSubmit({ coordinates, name, notes });
      if (!area) {
        setName("");
        setNotes("");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!area || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(area._id);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Drawer anchor="bottom" open={open} onClose={onClose}>
      <Box sx={{ p: 3, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}>
        <Typography variant="h6" gutterBottom>
          {area ? "View/Edit Covered Area" : "Save Covered Area"}
        </Typography>
        
        {coordinates ? (
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
            Points: {coordinates.length}
          </Typography>
        ) : null}

        <TextField
          fullWidth
          label="Area Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          sx={{ mb: 2 }}
          required
          disabled={!!area}
        />

        <TextField
          fullWidth
          label="Notes (Optional)"
          multiline
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          sx={{ mb: 3 }}
          disabled={!!area}
        />

        {!area ? (
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
        ) : (
          <Button
            fullWidth
            variant="outlined"
            size="large"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "Deleting..." : "Delete Area"}
          </Button>
        )}
      </Box>
    </Drawer>
  );
}
