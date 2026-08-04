# Step 1: Build the app
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Step 2: Serve with Nginx
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 8080

# Substitute PORT env var into default Nginx config
CMD ["sh", "-c", "sed -i 's/listen  *80;/listen '\"$PORT\"';/g' /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]