import { getSupabaseClient } from "@/lib/supabase/client";
import { usersServiceClient } from "@/modules/users";

export const checkAuthentication = async () => {
  try {
    const supabase = getSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      return { session: null, status: false, user: null };
    }

    // Get user profile data
    let userProfile = null;
    if (session.user) {
      try {
        userProfile = await usersServiceClient.getUserById(session.user.id);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    }

    return {
      session: session,
      status: true,
      user: userProfile || session.user,
    };
  } catch (error) {
    console.error("Error checking authentication:", error);
    return { session: null, status: false, user: null };
  }
};
