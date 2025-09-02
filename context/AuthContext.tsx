"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { Session, WeakPassword } from "@supabase/supabase-js";
import { authService, AuthSignupData } from "@/modules/auth";
import { getSupabaseClient } from "@/lib/supabase/client";
import { usersServiceClient } from "@/modules/users";
import { User } from "@/types/types";
import { Settings } from "@/modules/settings";
import { settingsServiceClient } from "@/modules/settings";
import Loader from "@/components/loader";
import {
  UserSessionManager,
  REALTIME_CONFIG,
} from "@/utils/user-session-manager";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  userProfile: User | null;
  session: Session | null;
  loading: boolean;
  settings: Settings | null;
  signUp: (
    data: AuthSignupData
  ) => Promise<{ user: User | null; session: Session | null } | { user: User }>;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ user: User; session: Session; weakPassword?: WeakPassword }>;
  signOut: () => Promise<void>;
  acceptInvite: (token: string, password: string) => Promise<any>;
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
  const [settings, setSettings] = useState<Settings | null>(null);

  // Define public routes that don't require authentication
  const PUBLIC_ROUTES = [
    "/auth/login",
    "/auth/sign-up",
    "/auth/forgot-password",
    "/auth/reset-password",
    "/auth/accept-invite",
  ];

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
        const userData = await usersServiceClient.getUserById(supabaseUser.id);

        // Check if user exists and is active
        if (!userData || !userData.is_active) {
          console.log(
            "User not found or inactive in database, will log out..."
          );
          return { isValid: false, shouldLogout: true };
        }

        return { isValid: true, shouldLogout: false };
      } catch (error) {
        console.error("Error validating user in database:", error);
        // On validation error, log out for security
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
              console.log("User validation failed, logging out...");
              setLoading(false); // Set loading to false before logout
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
              const userData = await usersServiceClient.getUserById(
                supabaseUser.id
              );
              if (userData && isMounted.current) {
                // Check if user is still active
                if (!userData.is_active) {
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
                setUserProfile(userData);
              } else if (!userData && isMounted.current) {
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
              if (settingsData && isMounted.current) {
                setSettings(settingsData);
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
    const supabase = getSupabaseClient();
    const isMounted = { current: true };

    // Get initial session
    const getInitialSession = async () => {
      try {
        if (!isMounted.current) return;
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted.current) return;

        if (error) {
          // Only log in development mode
          if (process.env.NODE_ENV === "development") {
            console.error("Error getting session:", error);
          }
          setLoading(false);
          return;
        }

        if (session) {
          setSession(session);
          setUser(session.user);
          if (session.user.email_confirmed_at) {
            await fetchUserData(session.user, isMounted);
          }
        } else {
          // No session found
          setSession(null);
          setUser(null);
          setUserProfile(null);
          // Don't clear settings here - let auth layout handle it
        }

        if (isMounted.current) {
          setLoading(false);
        }
      } catch (error) {
        // Only log in development mode
        if (process.env.NODE_ENV === "development") {
          console.error("Error in getInitialSession:", error);
        }
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Fallback timeout to ensure loading never gets stuck
    const loadingTimeout = setTimeout(() => {
      if (isMounted.current) {
        console.warn("Loading timeout reached, setting loading to false");
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    // Listen for auth state changes using the same client instance
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted.current) return;

      // Only log meaningful auth state changes in development mode
      if (
        process.env.NODE_ENV === "development" &&
        event !== "INITIAL_SESSION"
      ) {
        console.log(
          "Auth state changed:",
          event,
          session?.user?.email || "no user"
        );
      }

      // Set loading to true only for sign-in events that need data fetching
      if (event === "SIGNED_IN" && session?.user?.email_confirmed_at) {
        setLoading(true);
      }

      if (session) {
        setSession(session);
        setUser(session.user);
        // Only fetch user data for verified users to prevent errors
        if (session.user.email_confirmed_at) {
          await fetchUserData(session.user, isMounted);
        } else {
          // For unverified users, just set loading to false
          if (isMounted.current) {
            setLoading(false);
          }
        }
      } else {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        // Don't clear settings on sign out - they can be reused
        if (isMounted.current) {
          setLoading(false);
        }
      }

      // Ensure loading is always set to false after auth state change processing
      if (isMounted.current) {
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, [fetchUserData]);

  // Set up real-time subscriptions for user changes
  useEffect(() => {
    if (!user?.id || !(user as any)?.email_confirmed_at) return;

    const supabase = getSupabaseClient();
    let subscription: any = null;
    let periodicValidation: NodeJS.Timeout | null = null;

    const setupRealTimeSubscription = async () => {
      try {
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
              console.log("User table change detected:", payload);

              if (payload.eventType === "DELETE") {
                console.log("Real-time: User deleted from database");
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

                // Check if user was deactivated
                if (!updatedUser.is_active) {
                  console.log("Real-time: User deactivated");
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
                "Real-time subscription established for user:",
                user.email
              );
              toast.success("Connected to real-time updates", {
                duration: 2000,
              });
            } else if (status === "CHANNEL_ERROR") {
              console.error(
                "Real-time subscription error for user:",
                user.email
              );
              toast.error("Real-time connection failed", {
                duration: 3000,
              });
            }
          });

        // Set up periodic validation
        periodicValidation = setInterval(async () => {
          if ((user as any)?.email_confirmed_at) {
            console.log("Performing periodic user validation...");
            const sessionValidation =
              await UserSessionManager.validateUserSession(
                user.id,
                usersServiceClient.getUserById
              );

            if (!sessionValidation.isValid) {
              console.log("Periodic validation failed, logging user out");
              await UserSessionManager.handleUserLogout(
                sessionValidation.reason || "Session validation failed",
                "/auth/login"
              );
              await authService.signOut();
            }
          }
        }, REALTIME_CONFIG.VALIDATION_INTERVAL);
      } catch (error) {
        console.error("Error setting up real-time subscription:", error);
      }
    };

    setupRealTimeSubscription();

    // Cleanup function
    return () => {
      if (subscription) {
        supabase.removeChannel(subscription);
      }
      if (periodicValidation) {
        clearInterval(periodicValidation);
      }
    };
  }, [user, validateUserInDatabase]);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = async () => {
      try {
        const fetchedSettings = await settingsServiceClient.getSettingsById();
        setSettings(fetchedSettings);
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

  const signUp = async (data: AuthSignupData) => {
    const result = await authService.signUp(data);
    // Supabase auth state listener will handle setting user state
    return result;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authService.signIn(email, password);
      // Supabase auth state listener will handle setting user state
      return result;
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      await authService.signOut();
      // Supabase auth state listener will handle clearing user state
      // Middleware will handle redirect to login page
    } catch (error) {
      setLoading(false);
      console.error("Sign out error:", error);
      throw error;
    }
  };

  const acceptInvite = async (token: string, password: string) => {
    try {
      const result = await authService.acceptInvite(token, password);
      // Supabase auth state listener will handle setting user state
      return result;
    } catch (error) {
      console.error("Accept invite error:", error);
      throw error;
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
    acceptInvite,
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
