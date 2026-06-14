import * as yup from "yup";

export interface ILoginForm {
  email: string;
  password: string;
}

export const DEFAULT_LOGIN_FORM: ILoginForm = {
  email: "",
  password: "",
};

export const loginSchema: yup.ObjectSchema<ILoginForm> = yup.object({
  email: yup
    .string()
    .required("Email is required")
    .email("Invalid email address"),
  password: yup
    .string()
    .required("Password is required")
    .min(6, "Password must be at least 6 characters"),
});
