export const formatDate = (date: Date | string): string => {
  return new Date(date).toISOString().split("T")[0];
};

export const generateRandomString = (length: number = 10): string => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const sanitizeInput = (input: string | any): string | any => {
  if (typeof input === "string") {
    return input.trim().replace(/[<>]/g, "");
  }
  return input;
};

export const paginate = (
  page: number = 1,
  limit: number = 10,
): { limit: number; offset: number } => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};
