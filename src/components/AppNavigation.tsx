"use client";

import { BottomNavigation, BottomNavigationAction, Paper } from "@mui/material";
import MapIcon from "@mui/icons-material/Map";
import TrackChangesIcon from "@mui/icons-material/TrackChanges";
import SearchIcon from "@mui/icons-material/Search";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function AppNavigation() {
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState(pathname === "/tracker" ? 1 : 0);

  useEffect(() => {
    if (pathname === "/") setValue(0);
    else if (pathname === "/tracker") setValue(1);
    else if (pathname.startsWith("/share")) setValue(2); // Just for state consistency
  }, [pathname]);

  if (pathname.startsWith("/share")) return null; // No nav on share page

  return (
    <Paper sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1100 }} elevation={3}>
      <BottomNavigation
        showLabels
        value={value}
        onChange={(event, newValue) => {
          setValue(newValue);
          if (newValue === 0) router.push("/");
          if (newValue === 1) router.push("/tracker");
        }}
        sx={{
          '& .Mui-selected': {
            color: 'primary.main',
          },
        }}
      >
        <BottomNavigationAction label="Delivery Map" icon={<MapIcon />} />
        <BottomNavigationAction label="Live Tracker" icon={<TrackChangesIcon />} />
      </BottomNavigation>
    </Paper>
  );
}
