"use client";

import { useEffect } from "react";
import { setupPointerEventsReset, fixPointerEvents } from "@/lib/utils";

export default function PointerEventsFix() {
  useEffect(() => {
    // Fix on initial load
    fixPointerEvents();

    // Setup global listeners to handle pointer-events issues
    // and get the cleanup function
    const cleanup = setupPointerEventsReset();

    // Return the cleanup function
    return cleanup;
  }, []);

  // This is a utility component with no UI
  return null;
}
