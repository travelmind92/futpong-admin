export const ENV = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  AWS_REGION: process.env.REACT_APP_AWS_REGION ?? "",
  AWS_S3_BUCKET: process.env.REACT_APP_AWS_S3_BUCKET ?? "",
  AWS_COGNITO_DOMAIN: process.env.REACT_APP_AWS_COGNITO_DOMAIN ?? "",
  AWS_COGNITO_APP_CLIENT_ID: process.env.REACT_APP_AWS_COGNITO_APP_CLIENT_ID ?? "",
  AWS_COGNITO_REDIRECT_URI: process.env.REACT_APP_AWS_COGNITO_REDIRECT_URI ?? "",
  AWS_API_GATEWAY_URL: process.env.REACT_APP_AWS_API_GATEWAY_URL ?? "",
} as const;
