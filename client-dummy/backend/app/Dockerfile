ARG DOCKER_BASE_IMAGE
ARG DOCKER_BASE_TAG

# ===================================================
# Install composer dependencies
# ===================================================

# Uncomment this to use a multi-step build to install your composer
# dependencies while building your production image

#FROM ${DOCKER_BASE_IMAGE}:${DOCKER_BASE_TAG}-dev
#
#ENV WRITE_PERMISSION_MARKERS=0
#
## Add and run our additional shell scripts
#COPY opt /opt/project
#RUN find /opt/project -type f -iname "*.sh" -exec chmod +x {} \;
#
## Prepare build environment
#ADD src/ /var/www/html/
#RUN source /root/.bashrc \
#	&& chown -R "$DEFAULT_OWNER" /var/www/html \
#	&& chmod -R u=rwX,g=rwX,o-rwx /var/www/html
#
#RUN /opt/dev/prepare-build-env.sh
#
## Run composer install
#RUN source /root/.bashrc \
#		&& composer install --ignore-platform-reqs --no-progress --optimize-autoloader --no-interaction --verbose --no-dev

# ===================================================
# Build Project Image
# ===================================================
FROM ${DOCKER_BASE_IMAGE}:${DOCKER_BASE_TAG}

# You can pass the apache webroot as a build argument -> otherwise we will use /var/www/html as a default
ARG APACHE_WEBROOT

# @todo Add your maintainer here!
MAINTAINER LABOR.digital <info@labor.digital>

# Add our sources
# Comment out the "ADD" line and uncomment the "COPY" line when you want to use the multi-step build
ADD src /var/www/html
#COPY --from=0 /var/www/html/vendor /var/www/html
RUN source /root/.bashrc \
	&& chown -R "$DEFAULT_OWNER" /var/www/html \
	&& chmod -R u=rX,g=rX,o-rwx /var/www/html

# Add and run our additional shell scripts
COPY opt /opt/project
RUN find /opt/project -type f -iname "*.sh" -exec chmod +x {} \;

# Add to avoid Doppler
# CMD ["/opt/bootstrap.sh"]

# Run our build script
RUN /opt/build.sh

ENV APACHE_WEBROOT=${APACHE_WEBROOT}
ENV WRITE_PERMISSION_MARKERS=1
