# ── Usar build pre-compilado en Mac ──────────────────────────────────────────
# El dist ya está compilado localmente con npm run build
FROM nginx:alpine

COPY dist /usr/share/nginx/html

# Configuración nginx para React Router (SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
