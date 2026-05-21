import { apiConfig } from "../config/apiConfig";

function normalizeApiBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

const API_BASE_URL = apiConfig.useLocalApi
  ? normalizeApiBaseUrl(apiConfig.localApiOrigin)
  : normalizeApiBaseUrl(process.env.REACT_APP_AWS_API_GATEWAY_URL ?? "");

export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  AWS_REGION: process.env.REACT_APP_AWS_REGION ?? "",
  AWS_S3_BUCKET: process.env.REACT_APP_AWS_S3_BUCKET ?? "",
  AWS_COGNITO_DOMAIN: process.env.REACT_APP_AWS_COGNITO_DOMAIN ?? "",
  AWS_COGNITO_APP_CLIENT_ID: process.env.REACT_APP_AWS_COGNITO_APP_CLIENT_ID ?? "",
  AWS_COGNITO_REDIRECT_URI: process.env.REACT_APP_AWS_COGNITO_REDIRECT_URI ?? "",
  API_BASE_URL,
  AWS_API_GATEWAY_URL: API_BASE_URL,
  USE_LOCAL_API: apiConfig.useLocalApi,
} as const;

if (process.env.NODE_ENV === "development" && API_BASE_URL) {
  // eslint-disable-next-line no-console
  console.info(`[futpong-admin] API base URL: ${API_BASE_URL}`);
}
