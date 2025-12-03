FROM node:20-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --production
COPY . .
# Build TypeScript
RUN npm run build
EXPOSE 4000
# Chạy file đã build
CMD ["npm", "start"]