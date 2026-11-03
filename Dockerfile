# --- build ---
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install --no-audit --no-fund
COPY . .
ARG ENTRA_TENANT_ID=""
ARG ENTRA_SPA_CLIENT_ID=""
ARG ENTRA_API_CLIENT_ID=""
ARG API_BASE_URL=""
ENV ENTRA_TENANT_ID=$ENTRA_TENANT_ID ENTRA_SPA_CLIENT_ID=$ENTRA_SPA_CLIENT_ID \
    ENTRA_API_CLIENT_ID=$ENTRA_API_CLIENT_ID API_BASE_URL=$API_BASE_URL
RUN npm run build

# --- runtime ---
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/frontend-vidasalud/browser /usr/share/nginx/html
EXPOSE 80
