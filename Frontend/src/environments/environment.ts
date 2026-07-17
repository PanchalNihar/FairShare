const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    // If it's localhost or standard loopback, use localhost. Otherwise, use host IP.
    return `http://${hostname === 'localhost' || hostname === '127.0.0.1' ? 'localhost' : hostname}:5000/api`;
  }
  return 'http://localhost:5000/api'; // Fallback for Server-Side Rendering
};

export const environment = {
  production: false,
  apiUrl: getApiUrl(),
  googleClientId: '690211683834-av6kr1rrmb6f868cun9ku267i9j101t8.apps.googleusercontent.com'
};