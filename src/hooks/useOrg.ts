"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "current_org_id";

export function useOrg() {
  const [orgId, setOrgId] = useState<string>("");

  useEffect(() => {
    const saved =
      typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
    if (saved) setOrgId(saved);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      if (orgId) localStorage.setItem(STORAGE_KEY, orgId);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }, [orgId]);

  return { orgId, setOrgId };
}
