"use client";

// Add global type for the auth initialization flag
declare global {
  interface Window {
    __SUPABASE_AUTH_INITIALIZED?: boolean;
  }
}

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Session, WeakPassword } from "@supabase/supabase-js";
import { authService, AuthSignupData, AuthResponse } from "@/modules/auth";
import { ServiceResponse } from "@/lib/BaseService";
import { getSupabaseClient } from "@/lib/supabase/client";
import { usersService } from "@/modules/users";
import { User } from "@/types/types";
import { Settings } from "@/modules/settings";
import { settingsServiceClient } from "@/modules/settings";
import Loader from "@/components/loader";
import {
  UserSessionManager,
  REALTIME_CONFIG,
} from "@/utils/user-session-manager";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import { clearAuthSession } from "@/utils/clear-auth-session";

type AuthContextType = {
  user: User | null;
  userProfile: User | null;
  session: Session | null;
  loading: boolean;
  settings: Settings | null;
  signUp: (data: AuthSignupData) => Promise<AuthResponse | null>;
  signIn: (email: string, password: string) => Promise<AuthResponse | null>;
  signOut: () => Promise<void>;

  setUser: (user: User | null) => void;
  setUserProfile: (userProfile: any | null) => void;
  setSettings: (settings: Settings | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth protection configuration
const DEFAULT_AUTH_ROUTE = "/auth/login";
const DEFAULT_PROTECTED_ROUTE = "/";

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const [settings, setSettings] = useState<Settings | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  // Define public routes that don't require authentication
  const PUBLIC_ROUTES = useMemo(
    () => [
      "/auth/login",
      "/auth/sign-up",
      "/auth/signup",
      "/auth/forgot-password",
      "/auth/reset-password",
      "/auth/verify",
    ],
    []
  );

  // Define routes that authenticated users should be redirected from (e.g., login page)
  const AUTH_ROUTES = ["/auth/login", "/auth/sign-up"];

  // Function to validate user exists and is active in database
  const validateUserInDatabase = useCallback(
    async (
      supabaseUser: any
    ): Promise<{ isValid: boolean; shouldLogout: boolean }> => {
      if (!supabaseUser?.email_confirmed_at)
        return { isValid: true, shouldLogout: false }; // Don't validate unverified users

      try {
        const userData = await usersService.getUserById(supabaseUser.id);

        // Check if user exists and is active
        if (!userData.success || !userData.data || !userData.data.is_active) {
          return { isValid: false, shouldLogout: true };
        }

        return { isValid: true, shouldLogout: false };
      } catch (error) {
        console.error("Error validating user in database:", error);
        return { isValid: false, shouldLogout: true };
      }
    },
    []
  );

  // Function to fetch user profile and settings data
  const fetchUserData = useCallback(
    async (
      supabaseUser: any,
      isMounted: { current: boolean } = { current: true }
    ) => {
      try {
        if (supabaseUser && isMounted.current) {
          // Only fetch user data if email is confirmed (to avoid errors on unverified users)
          if (supabaseUser.email_confirmed_at) {
            // Validate user exists in database first
            const validation = await validateUserInDatabase(supabaseUser);
            if (validation.shouldLogout) {
              setLoading(false);
              setSession(null);
              setUser(null);
              setUserProfile(null);
              await authService.signOut();
              return;
            }
            if (!validation.isValid) {
              if (isMounted.current) {
                setLoading(false);
              }
              return;
            }

            // Fetch user profile data from user_profile table
            try {
              const userData = await usersService.getUserById(supabaseUser.id);
              if (userData.success && userData.data && isMounted.current) {
                // Check if user is still active
                if (!userData.data.is_active) {
                  console.log("User is no longer active, logging out...");
                  if (isMounted.current) {
                    setLoading(false);
                    setSession(null);
                    setUser(null);
                    setUserProfile(null);
                  }
                  await authService.signOut();
                  return;
                }
                setUserProfile(userData.data);
              } else if (!userData.success && isMounted.current) {
                // User doesn't exist in database but has Supabase session
                console.log("User not found in database, logging out...");
                setLoading(false);
                setSession(null);
                setUser(null);
                setUserProfile(null);
                await authService.signOut();
                return;
              }
            } catch (userError) {
              // User doesn't exist in database or error fetching user
              console.log(
                "Error fetching user or user doesn't exist:",
                userError
              );
              if (isMounted.current) {
                setLoading(false);
                setSession(null);
                setUser(null);
                setUserProfile(null);
              }
              // Use clearAuthSession for thorough cleanup
              await clearAuthSession();
              return;
            }

            // Fetch settings data only once per session
            if (!settings) {
              const settingsData =
                await settingsServiceClient.getSettingsById();
              if (
                settingsData.success &&
                settingsData.data &&
                isMounted.current
              ) {
                setSettings(settingsData.data);
              }
            }
          }
        }
      } catch (error) {
        // Handle general errors
        console.error("Error in fetchUserData:", error);
        if (isMounted.current) {
          setUserProfile(null);
          setLoading(false); // Ensure loading is set to false on error
        }
      }
    },
    [settings, validateUserInDatabase]
  );

  // Handle auth state and routing
  useEffect(() => {
    // Only run on client side to avoid multiple instances
    if (typeof window === "undefined") return;

    // Use singleton client instance to avoid multiple GoTrueClient instances
    // Only initialize auth once to prevent duplicate event handlers
    if (window.__SUPABASE_AUTH_INITIALIZED) return;
    window.__SUPABASE_AUTH_INITIALIZED = true;

    const supabase = getSupabaseClient();
    const isMounted = { current: true };

    // Get initial session - simple, no rate limiting
    const getInitialSession = async () => {
      try {
        if (!isMounted.current || initialized) return;

        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted.current) return;

        if (error) {
          console.warn("Auth session error:", error.message);
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          setInitialized(true);
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          if (session.user.email_confirmed_at) {
            await fetchUserData(session.user, isMounted);
          }
        } else {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }

        if (isMounted.current) {
          setLoading(false);
          setInitialized(true);
        }
      } catch (error) {
        console.warn("Error in getInitialSession:", error);
        if (isMounted.current) {
          setSession(null);
          setUser(null);
          setUserProfile(null);
          setLoading(false);
          setInitialized(true);
        }
      }
    };

    getInitialSession();

    // Fallback timeout to ensure loading never gets stuck
    const loadingTimeout = setTimeout(() => {
      if (isMounted.current) {
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Listen for auth state changes - simple handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      // Handle auth state changes immediately but only if initialized
      if (initialized) {
        if (session) {
          setSession(session);
          setUser(session.user);
          if (session.user.email_confirmed_at) {
            await fetchUserData(session.user, isMounted);
          }
        } else {
          setSession(null);
          setUser(null);
          setUserProfile(null);
        }

        if (isMounted.current) {
          setLoading(false);
        }
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [fetchUserData, initialized]);

  // Handle client-side routing based on auth state
  useEffect(() => {
    if (!initialized || loading) return;

    const isAuthPage = PUBLIC_ROUTES.includes(pathname);

    if (!user && !isAuthPage) {
      // Not logged in and trying to access protected page
      router.push("/auth/login");
    } else if (user && isAuthPage && pathname !== "/auth/verify") {
      // Logged in but on auth page (except verify)
      router.push("/");
    } else if (
      user &&
      !(user as any).email_confirmed_at &&
      pathname !== "/auth/verify"
    ) {
      // User not verified
      router.push("/auth/verify");
    }
  }, [user, pathname, initialized, loading, router, PUBLIC_ROUTES]);

  // Set up real-time subscriptions for user changes
  useEffect(() => {
    if (!user?.id || !(user as any)?.email_confirmed_at) return;

    const supabase = getSupabaseClient();
    let subscription: any = null;
    let periodicValidation: NodeJS.Timeout | null = null;
    let reconnectTimer: NodeJS.Timeout | null = null;
    let isConnecting = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const INITIAL_RECONNECT_DELAY = 1000;

    const setupRealTimeSubscription = async () => {
      // Prevent multiple simultaneous connection attempts
      if (isConnecting) return;
      isConnecting = true;

      try {
        // Add tracking for connection attempts
        reconnectAttempts++;
        const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        console.log(
          `[REALTIME:${subscriptionId}] Setting up real-time subscription, attempt ${reconnectAttempts}`,
          {
            userId: user.id,
            channelName: REALTIME_CONFIG.getUserChannelName(user.id),
            timestamp: new Date().toISOString(),
          }
        );

        // Subscribe to changes in the users table for the current user
        subscription = supabase
          .channel(REALTIME_CONFIG.getUserChannelName(user.id))
          .on(
            "postgres_changes",
            {
              event: "*",
              schema: "public",
              table: "users",
              filter: `id=eq.${user.id}`,
            },
            (payload: any) => {
              console.log(
                `[REALTIME:${subscriptionId}] User table change detected:`,
                {
                  eventType: payload.eventType,
                  table: payload.table,
                  schema: payload.schema,
                  timestamp: new Date().toISOString(),
                }
              );

              if (payload.eventType === "DELETE") {
                console.log(
                  `[REALTIME:${subscriptionId}] User deleted from database`
                );
                setLoading(false);
                setSession(null);
                setUser(null);
                setUserProfile(null);
                UserSessionManager.handleUserLogout(
                  "Your account has been deleted",
                  "/auth/login"
                );
                authService.signOut();
                return;
              }

              if (payload.eventType === "UPDATE") {
                const updatedUser = payload.new as any;
                console.log(`[REALTIME:${subscriptionId}] User updated:`, {
                  isActive: updatedUser.is_active,
                  timestamp: new Date().toISOString(),
                });

                // Check if user was deactivated
                if (!updatedUser.is_active) {
                  console.log(`[REALTIME:${subscriptionId}] User deactivated`);
                  setLoading(false);
                  setSession(null);
                  setUser(null);
                  setUserProfile(null);
                  UserSessionManager.handleUserLogout(
                    "Your account has been deactivated",
                    "/auth/login"
                  );
                  authService.signOut();
                  return;
                }

                // Update user profile in state with notification
                UserSessionManager.handleUserUpdate(
                  updatedUser,
                  setUserProfile
                );
              }
            }
          )
          .subscribe((status: string) => {
            if (status === "SUBSCRIBED") {
              console.log(
                `[REALTIME:${subscriptionId}] Real-time subscription established`,
                {
                  userId: user.id,
                  email: user.email,
                  timestamp: new Date().toISOString(),
                }
              );

              // Reset reconnect attempts on successful connection
              reconnectAttempts = 0;
              isConnecting = false;
            } else if (status === "CHANNEL_ERROR") {
              console.error(
                `[REALTIME:${subscriptionId}] Real-time subscription error`,
                {
                  userId: user.id,
                  email: user.email,
                  timestamp: new Date().toISOString(),
                }
              );

              isConnecting = false;

              // Attempt to reconnect with exponential backoff
              if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay =
                  INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttempts - 1);
                console.log(
                  `[REALTIME:${subscriptionId}] Will attempt to reconnect in ${delay}ms`
                );

                // Clear any existing reconnect timer
                if (reconnectTimer) clearTimeout(reconnectTimer);

                reconnectTimer = setTimeout(() => {
                  console.log(
                    `[REALTIME:${subscriptionId}] Attempting to reconnect...`
                  );

                  // Cleanup old subscription before reconnecting
                  if (subscription) {
                    try {
                      supabase.removeChannel(subscription);
                    } catch (e) {
                      console.error(
                        `[REALTIME:${subscriptionId}] Error removing channel:`,
                        e
                      );
                    }
                    subscription = null;
                  }

                  // Try to reconnect
                  setupRealTimeSubscription();
                }, delay);
              } else {
                console.error(
                  `[REALTIME:${subscriptionId}] Maximum reconnection attempts reached`
                );
              }
            }
          });

        // Set up periodic validation with improved logging
        const validationId = `val_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        periodicValidation = setInterval(async () => {
          if ((user as any)?.email_confirmed_at) {
            console.log(
              `[VALIDATION:${validationId}] Performing periodic user validation`,
              {
                userId: user.id,
                interval: `${REALTIME_CONFIG.VALIDATION_INTERVAL / 1000}s`,
                timestamp: new Date().toISOString(),
              }
            );

            try {
              const startTime = performance.now();
              const sessionValidation =
                await UserSessionManager.validateUserSession(
                  user.id,
                  usersService.getUserById
                );
              const duration = Math.round(performance.now() - startTime);

              if (!sessionValidation.isValid) {
                console.log(
                  `[VALIDATION:${validationId}] Periodic validation failed, logging user out`,
                  {
                    userId: user.id,
                    reason:
                      sessionValidation.reason || "Session validation failed",
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString(),
                  }
                );
                await UserSessionManager.handleUserLogout(
                  sessionValidation.reason || "Session validation failed",
                  "/auth/login"
                );
                await authService.signOut();
              } else {
                console.log(
                  `[VALIDATION:${validationId}] Periodic validation passed`,
                  {
                    userId: user.id,
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString(),
                  }
                );
              }
            } catch (error) {
              console.error(
                `[VALIDATION:${validationId}] Error during validation:`,
                {
                  error:
                    error instanceof Error ? error.message : "Unknown error",
                  userId: user.id,
                  timestamp: new Date().toISOString(),
                }
              );
            }
          }
        }, REALTIME_CONFIG.VALIDATION_INTERVAL);
      } catch (error) {
        console.error(`[REALTIME] Error setting up real-time subscription:`, {
          error: error instanceof Error ? error.message : "Unknown error",
          userId: user.id,
          timestamp: new Date().toISOString(),
        });
        isConnecting = false;
      }
    };

    // Initial setup
    setupRealTimeSubscription();

    // Enhanced cleanup function
    return () => {
      console.log("[REALTIME] Cleaning up real-time subscriptions", {
        userId: user.id,
        timestamp: new Date().toISOString(),
      });

      // Clear all timers
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }

      if (periodicValidation) {
        clearInterval(periodicValidation);
        periodicValidation = null;
      }

      // Remove subscription properly
      if (subscription) {
        try {
          supabase.removeChannel(subscription);
        } catch (e) {
          console.error("[REALTIME] Error removing channel during cleanup:", e);
        }
        subscription = null;
      }
    };
  }, [user, validateUserInDatabase]);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = async () => {
      try {
        const fetchedSettings = await settingsServiceClient.getSettingsById();
        if (fetchedSettings.success && fetchedSettings.data) {
          setSettings(fetchedSettings.data);
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error);
      }
    };

    window.addEventListener("settings-update", handleSettingsUpdate);
    return () => {
      window.removeEventListener("settings-update", handleSettingsUpdate);
    };
  }, []);

  // Remove client-side routing logic - let middleware handle redirects
  // const checkRouteAccess = (path: string, userData: User | null) => {
  //   // Middleware will handle all routing logic
  // };

  const signUp = async (data: AuthSignupData): Promise<AuthResponse | null> => {
    const result = await authService.signUp(data);
    // Supabase auth state listener will handle setting user state
    return result || null; // Ensure we return null instead of undefined
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<AuthResponse | null> => {
    try {
      const result = await authService.signIn(email, password);
      // Supabase auth state listener will handle setting user state
      return result || null; // Ensure we return null instead of undefined
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      // Clear session state immediately to prevent UI issues
      setSession(null);
      setUser(null);
      setUserProfile(null);

      // Sign out from Supabase auth
      await authService.signOut();

      // Clear any local storage items related to auth
      localStorage.removeItem("signup_email");
      localStorage.removeItem("sb-supabase-auth-token");

      // Clear any Supabase-related localStorage keys
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("sb-") || key.includes("supabase")) {
          localStorage.removeItem(key);
        }
      });

      // Reset loading state
      setLoading(false);

      return;
    } catch (error) {
      // Make sure loading state is reset even if there's an error
      setLoading(false);
      setSession(null);
      setUser(null);
      setUserProfile(null);

      console.error("Sign out error:", error);
      return;
    }
  };

  // Show loading state or nothing while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader />
      </div>
    );
  }

  const value = {
    user,
    userProfile,
    session,
    loading,
    settings,
    signUp,
    setUserProfile,
    signIn,
    signOut,
    setUser,
    setSettings,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext) as AuthContextType;
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
