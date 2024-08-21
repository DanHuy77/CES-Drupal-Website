# S3 Aggregated Assets

## Description
The **S3 Aggregated Assets** module serves CSS and JavaScript files from a CDN (Content Delivery Network). It improves the performance and speed of your Drupal site by offloading static file delivery to a CDN, reducing server load, and enhancing load times for users. The module also pushes compressed files to S3 if no compressed CSS files exist on S3 and changes the domain of those files from the server to the CDN domain.

## Features
- Serves CSS and JS files directly from a specified CDN.
- Automatically uploads compressed files to S3 if they don't already exist.
- Changes the domain of CSS and JS files to the CDN domain for improved load times.
- Easy configuration to set up your CDN and S3 settings.
- Integrates seamlessly with Drupal core.

## Installation
1. **Set Environment Variables for S3:**

   Add the following settings to your `settings.php` file:

   ```php
   $settings['AWS_S3_ACCESS_KEY_ID'] = 'example';
   $settings['AWS_S3_SECRET_ACCESS_KEY'] = 'example';
   $settings['AWS_S3_REGION'] = 'example';
   $settings['AWS_S3_BUCKET'] = 'example';

2. **Set the Value for CDN Name:**
  ```php
   $settings['CDN_NAME'] = 'example';

3. **Enable the module via Drush or the Drupal admin interface.**

```bash
# Enable the module using Drush
drush en domain_alter
