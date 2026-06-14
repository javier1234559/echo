"use client";

import { authApi } from "@/feature/auth/service/authApi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const AUTH_KEY_FACTORY = {
  all: ["auth"] as const,
  login: () => [...AUTH_KEY_FACTORY.all, "login"] as const,
  register: () => [...AUTH_KEY_FACTORY.all, "register"] as const,
  user: () => [...AUTH_KEY_FACTORY.all, "user"] as const,
};

export const useAuth = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: AUTH_KEY_FACTORY.login(),
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.all });
    },
  });
};

export const useRegister = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: AUTH_KEY_FACTORY.register(),
    mutationFn: authApi.register,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: AUTH_KEY_FACTORY.all });
    },
  });
};

export const useUser = () => {
  return useQuery({
    queryKey: AUTH_KEY_FACTORY.user(),
    queryFn: () => authApi.getMe(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};
