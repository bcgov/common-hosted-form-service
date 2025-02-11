export const INITIAL_TOKEN = __ENV.INITIAL_TOKEN;
export const INITIAL_REFRESH_TOKEN = __ENV.INITIAL_REFRESH_TOKEN;

export const generateRequestConfig = (token) => {
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};
