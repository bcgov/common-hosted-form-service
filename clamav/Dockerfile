FROM registry.access.redhat.com/ubi9/ubi
ARG VERSION=1.0.5

LABEL name="ubi8-clamav" \
      vendor="Red Hat" \
      version="${VERSION}" \
      release="1" \
      summary="UBI 9 ClamAV" \
      description="ClamAV for UBI 9" \
      maintainer="EPIC"

RUN yum -y update
RUN yum -y install https://www.clamav.net/downloads/production/clamav-${VERSION}.linux.x86_64.rpm
RUN yum -y install nc wget

# copy our configs to where clamav expects
COPY config/clamd.conf /usr/local/etc/clamd.conf
COPY config/freshclam.conf /usr/local/etc/freshclam.conf

RUN mkdir -p /opt/app-root/src
RUN chown -R 1001:0 /opt/app-root/src
RUN chmod -R ug+rwx /opt/app-root/src

# copy health check script to app-root 
COPY clamdcheck.sh /opt/app-root
RUN chmod ug+rwx /opt/app-root/clamdcheck.sh

# # To fix check permissions error for clamAV
RUN mkdir /var/log/clamav
RUN touch /var/log/clamav/clamav.log
RUN touch /var/log/clamav/freshclam.log
RUN chown -R 1001:0 /var/log/clamav
RUN chmod -R ug+rwx /var/log/clamav

RUN chown -R 1001:0 /opt/app-root/src

USER 1001

EXPOSE 3310

CMD freshclam && clamd