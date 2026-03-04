"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button, Container, Typography, Box } from "@mui/material";
import GoogleIcon from "@mui/icons-material/Google";
import MapIcon from "@mui/icons-material/Map";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  if (status === "loading") {
    return <Box sx={{ display: "flex", height: "100vh", justifyContent: "center", alignItems: "center" }}><Typography>Loading...</Typography></Box>;
  }

  return (
    <Container maxWidth="sm" sx={{ display: "flex", flexDirection: "column", justifyContent: "center", height: "100vh" }}>
      <Box sx={{ textAlign: "center", mb: 8 }}>
        <MapIcon sx={{ fontSize: 80, color: "primary.main", mb: 2 }} />
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          TrackMyProgress
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Track and map your ticket and brochure deliveries effortlessly.
        </Typography>
      </Box>

      <Button
        variant="contained"
        size="large"
        startIcon={<GoogleIcon />}
        onClick={() => signIn("google")}
        sx={{
          py: 1.5,
          borderRadius: 8,
          textTransform: "none",
          fontSize: "1.1rem",
          boxShadow: 3,
        }}
      >
        Sign in with Google
      </Button>
    </Container>
  );
}
