"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";
import { Box, CircularProgress, Fab } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const LeafletMap = dynamic(() => import("@/components/Map"), {
  ssr: false,
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <CircularProgress />
    </Box>
  ),
});

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading" || status === "unauthenticated") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 56px)", width: "100%", position: "relative" }}>
      <LeafletMap />

      {/* Floating Action Button for adding Markers */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{
          position: "absolute",
          bottom: 32,
          left: 32,
          zIndex: 1000,
        }}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
}
