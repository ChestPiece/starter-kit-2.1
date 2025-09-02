import { clsx, type ClassValue } from "clsx"
import { NextRequest } from "next/server"
import { twMerge } from "tailwind-merge"
import React from "react"
import { getSupabaseBrowserClient } from "./supabase-auth-client";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format date to locale string with custom options
export function formatDate(date: string | Date | undefined, options: Intl.DateTimeFormatOptions = {}) {
  if (!date) return "";
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };
  
  return new Date(date).toLocaleDateString(undefined, defaultOptions);
}

// Get the user cookie from the request (for server-side usage)
export function getUserCookie(request: NextRequest) {
  return request.cookies.get('auth.user')
}

// Utility function to get current user session from Supabase (client-side only)
export async function getCurrentUser() {
  try {
    // Only run on client side
    if (typeof window === 'undefined') {
      return null;
    }
    const supabaseClient = getSupabaseBrowserClient();
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

// Utility function to get current session from Supabase (client-side only)
export async function getCurrentSession() {
  try {
    // Only run on client side
    if (typeof window === 'undefined') {
      return null;
    }
    const supabaseClient = getSupabaseBrowserClient();
    const { data: { session }, error } = await supabaseClient.auth.getSession();
    if (error) throw error;
    return session;
  } catch (error) {
    console.error("Error getting current session:", error);
    return null;
  }
}

// Utility functions that use the Supabase session
export async function getUserId() {
  const user = await getCurrentUser();
  return user?.id;
}

export async function getUserEmail() {
  const user = await getCurrentUser();
  return user?.email;
}

// Utility to fix pointer-events style issues
export function fixPointerEvents() {
  // Reset pointer-events if it's been set to 'none'
  if (document.body.style.pointerEvents === 'none') {
    document.body.style.removeProperty('pointer-events');
  }
}

// Setup global listener to fix pointer-events
export function setupPointerEventsReset() {
  // Function to check and fix pointer-events
  const checkAndFixPointerEvents = () => {
    if (document.body.style.pointerEvents === 'none') {
      const activeDialogs = document.querySelectorAll('[role="dialog"][data-state="open"]');
      const activePopovers = document.querySelectorAll('[role="dialog"][data-state="open"]');
      const activeAlerts = document.querySelectorAll('[role="alertdialog"][data-state="open"]');
      const activeDropdowns = document.querySelectorAll('[data-radix-popper-content-wrapper]');
      
      // If no dialogs are open but pointer-events is still none, fix it
      if (
        activeDialogs.length === 0 && 
        activePopovers.length === 0 &&
        activeAlerts.length === 0 &&
        activeDropdowns.length === 0
      ) {
        document.body.style.removeProperty('pointer-events');
      }
    }
  };
  
  // Add listeners to various events that might indicate dialog closure
  document.addEventListener('click', checkAndFixPointerEvents);
  document.addEventListener('mousedown', checkAndFixPointerEvents);
  document.addEventListener('mouseup', checkAndFixPointerEvents);
  document.addEventListener('touchstart', checkAndFixPointerEvents);
  document.addEventListener('touchend', checkAndFixPointerEvents);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // Wait a bit for the dialog to close
      setTimeout(checkAndFixPointerEvents, 100);
    }
  });
  
  // MutationObserver to detect DOM changes (like dialog being removed)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList' || mutation.type === 'attributes') {
        checkAndFixPointerEvents();
      }
    }
  });
  
  // Observe changes to the body element and its children
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['data-state', 'style']
  });
  
  // Periodic check as a fallback
  const intervalId = setInterval(checkAndFixPointerEvents, 500);
  
  // Return a cleanup function
  return () => {
    document.removeEventListener('click', checkAndFixPointerEvents);
    document.removeEventListener('mousedown', checkAndFixPointerEvents);
    document.removeEventListener('mouseup', checkAndFixPointerEvents);
    document.removeEventListener('touchstart', checkAndFixPointerEvents);
    document.removeEventListener('touchend', checkAndFixPointerEvents);
    document.removeEventListener('keydown', checkAndFixPointerEvents);
    observer.disconnect();
    clearInterval(intervalId);
  };
}

// Get user profile from local storage or session
export function getUserProfile() {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem('user_profile');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

// Custom hook for user data (client-side usage)
export function useUserData() {
  const [userData, setUserData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await getCurrentUser();
        setUserData(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
  }, []);
  
  return { userData, loading };
}
  