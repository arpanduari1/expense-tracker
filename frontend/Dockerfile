# ---- Stage 1: Build ----
FROM node:20-alpine AS build
WORKDIR /app

ARG VITE_API_BASE_URL=/api/v1/
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY package*.json ./
RUN npm ci                  # ci is faster & stricter than npm install

COPY . .
RUN npm run build           # creates /app/dist or /app/build folder

# ---- Stage 2: Serve with Nginx ----
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Custom nginx config to handle React Router (SPA routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
