import { getIdToken, isTokenExpired } from "../../auth/auth";
import { ENV } from "../../constants/env";
import { buildCognitoLogoutUrl } from "./cognito";

export const apiFetch = async (
  path: string,
  auth: boolean = false,
  options: RequestInit = {}
) => {
  let idToken: string | null = null;

  if (auth) {
    idToken = getIdToken();

    if (!idToken || isTokenExpired(idToken)) {
      localStorage.removeItem("id_token");
      localStorage.removeItem("access_token");
      window.location.href = buildCognitoLogoutUrl();
    }
  }

  return fetch(`${ENV.AWS_API_GATEWAY_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
  });
};
