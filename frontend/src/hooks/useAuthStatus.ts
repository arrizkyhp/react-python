import { useQuery, useMutation } from "@tanstack/react-query";
import {logout} from "@/features/login/fetch.ts";

interface AuthStatusResponse {
  logged_in: boolean;
}

// The fetch function
export const checkAuthStatus = async (): Promise<AuthStatusResponse> => {
  const response = await fetch("http://127.0.0.1:5000/api/auth/status", {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || "Failed to check authentication status");
  }

  return response.json();
};

// React Query hooks
export const useAuthStatus = () => {
  const query = useQuery({
    queryKey: ["authStatus"],
    queryFn: checkAuthStatus,
    // Refresh every 5 minutes and when the window regains focus
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Invalidate auth status query after successful logout
      query.refetch();
    },
  });

  return {
    ...query,
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
};
