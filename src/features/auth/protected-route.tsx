import type { PropsWithChildren } from "react";
import { Navigate } from "react-router-dom";
import { authStore } from "@/lib/auth-store";

export function ProtectedRoute({ children }: PropsWithChildren) {
  if (!authStore.getToken()) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
