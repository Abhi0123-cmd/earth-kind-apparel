export const getPublicAppUrl = () => {
  const configuredUrl = import.meta.env.VITE_PUBLIC_APP_URL?.trim();

  if (configuredUrl) {
    return configuredUrl.replace(/\/$/, "");
  }

  return window.location.origin;
};
