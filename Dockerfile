FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm install

COPY . .
# Tạo var cho quá trình build SPA
ARG VITE_API_BASE_URL
ARG VITE_AUTO_LOGIN
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_AUTO_LOGIN=$VITE_AUTO_LOGIN

RUN npm run build

FROM nginx:alpine

# Copy kết quả build vào nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Cấu hình fallback SPA react-router-dom
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
