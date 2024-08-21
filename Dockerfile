FROM node:18-alpine AS build-stage
WORKDIR /app

RUN npm install -g gulp-cli@latest
COPY ./web/themes/custom/ces ./themes/custom/ces

WORKDIR /app/themes/custom/ces
RUN npm install && gulp buildNoWatch

FROM bitnami/drupal:10.3.1-debian-12-r7

ENV DRUPAL_CONFIG_SYNC_DIR=/opt/bitnami/drupal/sites/config
ENV DRUPAL_HASH_SALT=_8UfDkDL3m4KWc0FGQe2Ff9gJdpQVI-94GOIO0eciWpPGM9hXwpgss6CBvYLoT62jnrZi28_kw

WORKDIR /opt/bitnami/drupal

COPY ./patches ./patches
COPY ./web/composer.json ./web/composer.lock ./

COPY ./web/modules/custom/ ./modules/custom/
COPY ./web/libraries ./libraries
COPY ./web/themes/custom/ ./themes/custom/

# COPY ./web/sites/default/settings.php ./sites/default/settings.php
COPY ./web/sites/default/settings.production.php ./sites/default/settings.production.php
COPY ./config ./sites/config
COPY ./web/sites/default/settings.php ./sites/default/settings.tmp.php
COPY ./web/BingSiteAuth.xml ./BingSiteAuth.xml

COPY --from=build-stage /app/themes/custom/ces ./themes/custom/ces

USER root

RUN chown 1001:1001 -R ./sites/ ./themes/ ./modules/ ./libraries ./composer.json ./composer.lock

# Create private files directory and set permissions
RUN mkdir -p ./sites/default/files/private \
  && chmod 755 ./sites/default/files/private

RUN install_packages \
  curl \
  build-essential \
  php-dev && pecl install redis

RUN apt-get clean && rm -rf /var/lib/apt/lists/*

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
# Copy the modification script
COPY modify-settings.sh /docker-entrypoint-init.d/modify-settings.sh
RUN chmod +x /docker-entrypoint-init.d/modify-settings.sh

USER 1001

# Install composer-patches plugin
RUN composer update --no-dev --prefer-dist --optimize-autoloader
RUN composer require cweagans/composer-patches
RUN rm -rf ./robots.txt
