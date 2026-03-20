ARG DOCKER_BASE_IMAGE
ARG DOCKER_BASE_TAG

# ===================================================
# Build Project Image
# ===================================================
FROM ${DOCKER_BASE_IMAGE}:${DOCKER_BASE_TAG}

# You can pass the apache webroot as a build argument -> otherwise we will use /var/www/html as a default
ARG APACHE_WEBROOT

# @todo Add your maintainer here!
MAINTAINER LABOR.digital <info@labor.digital>

# Add our sources
ADD src /var/www/html
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

ENV WRITE_PERMISSION_MARKERS=1