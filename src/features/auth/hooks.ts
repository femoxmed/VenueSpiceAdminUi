import { useMutation, useQuery } from "@tanstack/react-query";
import { getMe, login, verifyAdminOtp } from "@/features/auth/api";

export function useLogin() {
  return useMutation({
    mutationFn: login
  });
}

export function useVerifyAdminOtp() {
  return useMutation({
    mutationFn: verifyAdminOtp
  });
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled
  });
}
