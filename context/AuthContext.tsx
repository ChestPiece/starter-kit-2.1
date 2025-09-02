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
import { usersService } from "@/modules/users";
import { User } from "@/types/types";
import { Settings, settingsService } from "@/modules/settings";
import Loader from "@/components/loader";

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
            // Fetch user profile data from user_profile table
            const userData = await usersService.getUserById(supabaseUser.id);
            if (userData && isMounted.current) {
              setUserProfile(userData);
            }

            // Fetch settings data only once per session
            if (!settings) {
              const settingsData = await settingsService.getSettingsById();
              if (settingsData && isMounted.current) {
                setSettings(settingsData);
              }
            }
          }
        }
      } catch (error) {
        // Don't log errors for unverified users
        if (supabaseUser?.email_confirmed_at) {
          console.error("Error fetching user data:", error);
        }
        if (isMounted.current) {
          setUserProfile(null);
          // Don't clear settings on user data error
        }
      }
    },
    [settings]
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
          await fetchUserData(session.user, isMounted);
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
        }
      } else {
        setSession(null);
        setUser(null);
        setUserProfile(null);
        // Don't clear settings on sign out - they can be reused
      }

      // Always set loading to false after processing
      if (isMounted.current) {
        setLoading(false);
      }
    });

    return () => {
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  // Listen for settings updates
  useEffect(() => {
    const handleSettingsUpdate = async () => {
      try {
        const fetchedSettings = await settingsService.getSettingsById();
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
