export const BASE_URL =
  process.env.NODE_ENV === "development"
    ? process.env.NEXT_PUBLIC_LOCAL_BASE_URL
    : process.env.NEXT_PUBLIC_HOSTED_BASE_URL;
