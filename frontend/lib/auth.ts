"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "./api";

export interface CurrentUser {
  id: string;
  email: string;
  full_name: string;
  company_id: string;
  roles: { id?: string; name: string }[];
  avatar_url?: string;
  is_active: boolean;
}

export function useAuth(requireAuth: boolean = true) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem("marp_token");
      if (!token) {
        setLoading(false);
        if (requireAuth) {
          router.push("/login");
        }
        return;
      }

      try {
        const userData = await apiFetch<CurrentUser>("/auth/me");
        if (userData && (userData.id || userData.email)) {
          setUser(userData);
        } else {
          throw new Error("Invalid user response");
        }
      } catch (err) {
        if (requireAuth) {
          localStorage.removeItem("marp_token");
          localStorage.removeItem("marp_user");
          router.push("/login");
        }
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, [requireAuth, router]);

  const logout = () => {
    localStorage.removeItem("marp_token");
    localStorage.removeItem("marp_user");
    localStorage.removeItem("marp_company_id");
    router.push("/login");
  };

  const hasRole = (roleName: string) => {
    if (!user || !Array.isArray(user.roles)) return false;
    return user.roles.some((r: any) =>
      typeof r === "string" ? r === roleName : r?.name === roleName
    );
  };

  const isAdmin = () => hasRole("Company Administrator");

  return { user, loading, logout, hasRole, isAdmin };
}
