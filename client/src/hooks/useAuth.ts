import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";

export function useAuth() {
  const { data: user, isLoading, isError } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
    retryOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isLoading: isLoading && !isError,
    isAuthenticated: !!user,
  };
}
