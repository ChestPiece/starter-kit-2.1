"use client";

import Loader from "@/components/loader";
import {
  AuthLayoutProvider,
  useAuthLayoutContext,
} from "@/context/AuthLayoutContext";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthLayoutProvider>
      <AuthLayoutContent>{children}</AuthLayoutContent>
    </AuthLayoutProvider>
  );
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
  const { isLoadingSettings } = useAuthLayoutContext();

  // Show loading spinner while settings are loading
  if (isLoadingSettings) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {children}
    </div>
  );
}
