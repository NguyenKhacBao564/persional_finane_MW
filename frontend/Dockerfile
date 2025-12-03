# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json ./
RUN npm install
COPY . .
# Build ra thư mục dist
RUN npm run build

# Stage 2: Serve bằng Nginx
FROM nginx:alpine
# Copy file build từ stage 1 sang thư mục html của nginx
COPY --from=builder /app/dist /usr/share/nginx/html
# Copy file config nginx (tạo ở bước sau)
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]