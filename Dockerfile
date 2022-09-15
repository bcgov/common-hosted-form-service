FROM docker.io/node:16.15.0-alpine

ENV NO_UPDATE_NOTIFIER=true
WORKDIR /opt/app-root/src/app
COPY . /opt/app-root/src
RUN npm run all:ci \
  && npm run all:build \
  && npm run frontend:purge \
  && npm run components:clean \
  && npm run components:purge
EXPOSE 8000
CMD ["npm", "run", "start"]
