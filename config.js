// config.js — Environment configuration

const getConfig = () => {
  const isDevelopment =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isDevelopment) {
    return {
      API_BASE_URL: 'http://localhost:3000',
      WS_URL: 'http://localhost:3000',
      ENV: 'development',
      DEBUG: true,
    };
  }

  // Production configuration
  // Use the current domain and assume API is on same domain or specific subdomain
  const protocol = window.location.protocol; // https: or http:
  const host = window.location.host; // example.com

  // Determine API base URL
  let apiBaseUrl;
  if (host.includes('vercel.app')) {
    // If deployed on Vercel, use railway backend
    apiBaseUrl = process.env.REACT_APP_API_BASE_URL ||
                'https://ajiks-api.railway.app';
  } else {
    // Otherwise assume API is on same domain
    apiBaseUrl = `${protocol}//${host}/api`;
  }

  return {
    API_BASE_URL: apiBaseUrl,
    WS_URL: apiBaseUrl.replace('http', 'ws'),
    ENV: 'production',
    DEBUG: false,
  };
};

const config = getConfig();

// Make available globally
if (typeof window !== 'undefined') {
  window.CONFIG = config;
  window.API_BASE_URL = config.API_BASE_URL;
  window.WS_URL = config.WS_URL;
}

// Also support CommonJS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = config;
}
