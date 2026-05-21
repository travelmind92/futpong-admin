import { clearSession, getIdToken, isTokenExpired } from "../../auth/auth";
import { ENV } from "../../constants/env";

export const apiFetch = async (
  path: string,
  auth: boolean = false,
  options: RequestInit = {}
) => {
  let idToken: string | null = null;

  if (auth) {
    idToken = getIdToken();

    if (!idToken || isTokenExpired(idToken)) {
      clearSession();
      window.location.assign(
        `${window.location.origin}${window.location.pathname}`
      );
      throw new Error("Session expired");
    }
  }

  const isFormData = options.body instanceof FormData;

  return fetch(`${ENV.API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
};
