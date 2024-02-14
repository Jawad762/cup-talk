import axios, { AxiosInstance } from 'axios';

const createAxiosInstance = (): AxiosInstance => {

  const instance = axios.create();

  instance.interceptors.request.use((config) => {
    config.withCredentials = true;
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error && error.response.status === 401) {
        window.location.href = '/signin'
      }
      return Promise.reject(error);
    }
  );

  return instance;
};

export default createAxiosInstance;
