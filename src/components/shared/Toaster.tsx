"use client";

import { Toaster as SonnerToaster } from "sonner";

/* ----------------------------------------------------------------------
   Toaster
   ----------------------------------------------------------------------
   Tiny re-export of Sonner's <Toaster> with the project-wide defaults
   applied (top-right, rich colors, close button, 4-second duration).
   Mounted exactly once at the root in `src/app/layout.tsx`.
   ---------------------------------------------------------------------- */

type ToasterProps = {
  richColors?: boolean;
  position?:
    | "top-left"
    | "top-right"
    | "top-center"
    | "bottom-left"
    | "bottom-right"
    | "bottom-center";
};

export function Toaster({
  richColors = true,
  position = "top-right",
}: ToasterProps) {
  return (
    <SonnerToaster
      richColors={richColors}
      position={position}
      closeButton
      duration={4000}
    />
  );
}
