import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { authStore } from "@/lib/auth-store";

type RoleGuardProps = PropsWithChildren<{
  roles: string[];
}>;

export function RoleGuard({ roles, children }: RoleGuardProps) {
  const role = authStore.getRole();

  if (!role || !roles.includes(role)) {
    return <Navigate to={role === "writer" ? "/blogs" : "/"} replace />;
  }

  return <>{children}</>;
}
