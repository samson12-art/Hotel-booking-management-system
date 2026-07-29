const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";
const BACKEND_URL = API_URL.replace("/api/v1", "");

export const getFileUrl = (path: string | null | undefined): string => {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
};
