export const endpoints = {
  auth: {
    register: () => "/api/auth/register",
    login: () => "/api/auth/login",
  },
  productos: {
    list: () => "/api/productos",
    create: () => "/api/productos",
  },
  healthcheck: () => "/api/healthcheck",
};