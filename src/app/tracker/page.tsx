"use client";

import TrackerMap from "@/components/TrackerMap";
import { Box, Typography, Container } from "@mui/material";

export default function TrackerPage() {
  return (
    <Box sx={{ height: "calc(100vh - 56px)", width: "100%", display: "flex", flexDirection: "column" }}>
      <Box sx={{ p: 2, backgroundColor: "primary.main", color: "white", boxShadow: 2 }}>
        <Typography variant="h6" fontWeight="bold">Auto Coverage Tracker</Typography>
        <Typography variant="caption">Draw a target area, then start moving to track coverage.</Typography>
      </Box>
      <Box sx={{ flexGrow: 1, position: "relative" }}>
        <TrackerMap />
      </Box>
    </Box>
  );
}
