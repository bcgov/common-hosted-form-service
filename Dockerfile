FROM docker.io/node:20.18.3-alpine3.21
ENV NO_UPDATE_NOTIFIER=true
WORKDIR /opt/app-root/src/app
COPY . /opt/app-root/src

# Run the npm tasks to set up the various parts of the application. Then create
# the /.npm directory and grant access to group 0 to allow npm v9 to work
# See: https://docs.openshift.com/container-platform/4.11/openshift_images/create-images.html#use-uid_create-images

RUN npm run all:ci \
  && npm run all:build \
  && cd ../components && npm run build \
  && cd ../app \
  && cd frontend && npm run build:embed && cd .. \
  && mkdir -p /opt/app-root/src/webcomponents/v1/assets/vendor/formio \
  && cp -f /opt/app-root/src/app/frontend/node_modules/formiojs/dist/formio.full.min.* /opt/app-root/src/webcomponents/v1/assets/vendor/formio/ \
  && mkdir -p /opt/app-root/src/webcomponents/v1/assets/vendor/font-awesome/css /opt/app-root/src/webcomponents/v1/assets/vendor/font-awesome/fonts \
  && cp -f /opt/app-root/src/app/frontend/node_modules/font-awesome/css/font-awesome.min.css /opt/app-root/src/webcomponents/v1/assets/vendor/font-awesome/css/ \
  && cp -f /opt/app-root/src/app/frontend/node_modules/font-awesome/fonts/* /opt/app-root/src/webcomponents/v1/assets/vendor/font-awesome/fonts/ \
  && npm run frontend:purge \
  && npm run components:purge \
  && mkdir /.npm \
  && chgrp -R 0 /.npm \
  && chmod -R g=u /.npm
  
EXPOSE 8000

CMD ["npm", "run", "start"]