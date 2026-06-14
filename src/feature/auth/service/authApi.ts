import { handleApiError } from "@/lib/handleApiError";
import axiosInstance from "@/service/baseApi";
import type { User } from "@/feature/auth/types";
import { AxiosResponse } from "axios";

interface LoginDto {
  email: string;
  password: string;
}

interface RegisterDto {
  email: string;
  password: string;
}

export const authApi = {
  login(form: LoginDto) {
    return axiosInstance
      .post<{ user: User }>("/api/auth/login", form)
      .then((res) => res.data)
      .catch(handleApiError);
  },
  register(form: RegisterDto) {
    return axiosInstance
      .post("/api/auth/register", form)
      .then((res) => res.data)
      .catch(handleApiError);
  },
  getMe() {
    return axiosInstance
      .get<User>("/api/auth/me")
      .then((res: AxiosResponse<User>) => res.data)
      .catch(handleApiError);
  },
};
