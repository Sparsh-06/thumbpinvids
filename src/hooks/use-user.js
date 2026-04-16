"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { mockUser } from "@/lib/mock-data";

/**
 * Hook to get the current authenticated user and their profile details.
 * Replaces Supabase auth with NextAuth.
 */
export function useUser() {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      if (status === "authenticated" && session?.user?.id) {
        try {
          const res = await fetch("/api/user/profile");
          if (res.ok) {
            const data = await res.json();
            setProfile(data.user);
          } else {
            // Fallback to session user and mock credits
            setProfile({
              ...session.user,
              credits: 100 // Default for now
            });
          }
        } catch (error) {
          console.error("[useUser] Error fetching profile:", error);
        } finally {
          setLoadingProfile(false);
        }
      } else if (status === "unauthenticated") {
        setProfile(null);
        setLoadingProfile(false);
      }
    }

    fetchProfile();
  }, [session, status]);

  const isLoading = status === "loading" || loadingProfile;

  return {
    user: session?.user || null,
    profile,
    loading: isLoading,
    credits: profile?.credits ?? 0,
    status
  };
}
