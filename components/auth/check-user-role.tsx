"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import { checkRoutePermission } from "@/components/auth/check-route-access";
import { User } from "@/types/types";
import { useAuth } from "@/context/AuthContext";
import Loader from "../loader";

export interface WithUserRole {
  user?: User | null;
  organizations?: any;
}

interface CheckUserRoleProps {
  children:
    | React.ReactElement<WithUserRole>
    | ((props: WithUserRole) => React.ReactElement);
}

export default function CheckUserRole({ children }: CheckUserRoleProps) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();

  useEffect(() => {
    const checkRolePermissions = async () => {
      // Wait for auth to finish loading
      if (authLoading) {
        return;
      }

      try {
        // If no user profile yet, wait for it to load
        if (!userProfile) {
          setLoading(false);
          return;
        }

        // Check role-based permissions only (authentication is handled by middleware)
        const isAuthorized = await checkRoutePermission(userProfile, pathname);

        if (!isAuthorized) {
          // Use Next.js router instead of window.location for better UX
          router.push("/");
          return;
        }

        setAuthorized(true);
        setLoading(false);
      } catch (error) {
        console.error("Role permission check failed:", error);
        setLoading(false);
      }
    };

    checkRolePermissions();
  }, [pathname, userProfile, authLoading, router]);

  // Show loading while auth is loading or while checking permissions
  if (authLoading || loading) {
    return (
      <div className="min-h-screen justify-center items-center flex">
        <Loader />
      </div>
    );
  }

  // If not authorized, don't render anything (redirect is in progress)
  if (!authorized) {
    return null;
  }

  // Handle both function children and element children
  if (typeof children === "function") {
    return children({ user: userProfile });
  }

  // Clone the children and pass the userRole as a prop
  const childrenWithRole = React.Children.map(children, (child) => {
    if (React.isValidElement<WithUserRole>(child)) {
      return React.cloneElement(child, {
        user: userProfile,
      } as WithUserRole);
    }
    return child;
  });

  return <>{childrenWithRole}</>;
}
