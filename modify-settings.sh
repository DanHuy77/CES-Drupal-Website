#!/bin/bash
set -e

# Define file paths
SETTINGS_FILE="/opt/bitnami/drupal/sites/default/settings.php"
TMP_SETTINGS_FILE="/opt/bitnami/drupal/sites/default/settings.tmp.php"



# Ensure both files exist
if [[ -f "$SETTINGS_FILE" && -f "$TMP_SETTINGS_FILE" ]]; then
  echo "Files found, proceeding with modifications..."

  # Extract database configuration from settings.php
  DB_CONFIG=$(sed -n '/\$databases\['\''default'\''\]\['\''default'\''\] = array (/, /);/p' $SETTINGS_FILE | sed "s/);/  'isolation_level' => 'READ COMMITTED', );/")

  # Append database configuration to settings.tmp.php
  echo "$DB_CONFIG" >>$TMP_SETTINGS_FILE

  # Overwrite settings.php with the modified settings.tmp.php
  mv -f $TMP_SETTINGS_FILE $SETTINGS_FILE

  # enable redis extension
  echo "extension=redis.so" >>/opt/bitnami/php/etc/php.ini

  echo "settings.php has been successfully updated."

  # Run Drush generate sitemap
  drush xmlsitemap:regenerate

  # Run drush updatedb
  drush updatedb

  # Run Rebuild all caches.
  drush cr
else
  echo "Error: One or more required files do not exist."
  exit 1
fi
