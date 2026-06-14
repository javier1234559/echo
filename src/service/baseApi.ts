import axios from "axios";

import { globalConfig } from "@/config";

export const axiosInstance = axios.create({
  baseURL: globalConfig.API_URL ?? "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export default axiosInstance;
