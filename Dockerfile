FROM node:22-alpine
MAINTAINER ldhhello <ldhhello@naver.com>

WORKDIR /app
COPY . .

RUN npm install typescript
RUN npm install
RUN npm run build
CMD ["npm", "start"]