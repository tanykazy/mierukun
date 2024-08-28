FROM node:20.17.0-bookworm-slim
WORKDIR /usr/app
COPY ./ /usr/app
RUN npm install -g @angular/cli
RUN npm install
RUN npm run build
EXPOSE 4200
CMD ["node", "index.js"]