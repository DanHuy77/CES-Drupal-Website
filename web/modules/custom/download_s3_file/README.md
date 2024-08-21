# Download S3 File - Drush Command Usage

The Download S3 File module provides a Drush command to download files from an AWS S3 bucket to your local system. This document provides detailed instructions on how to use this command.

## Prerequisites

Before using the Drush command, ensure that you have completed the following:

- **Install the AWS SDK for PHP**: Ensure you have the AWS SDK for PHP installed on your system. This is necessary for interacting with AWS services.
- **Install and Enable the download_s3_file Module**: Install and enable the download_s3_file module in your Drupal site. This module provides the necessary functionality for downloading files from S3.
- **Configure AWS Credentials**: Add your AWS credentials and region to your `settings.php` file:

```php
$settings['AWS_S3_ACCESS_KEY_ID'] = 'your-access-key-id';
$settings['AWS_S3_SECRET_ACCESS_KEY'] = 'your-secret-access-key';
$settings['AWS_S3_REGION'] = 'your-region';


## How to Use

### Download a File from S3

To download a file from an S3 bucket, use the `download_s3_file:get` command. For example, to download a file named `myfile.txt` from the `mybucket` bucket:

```bash
drush download_s3_file:get mybucket myfile.txt

### Download a File with a Destination Path

```bash
drush download_s3_file:get mybucket myfile.txt --destination=/var/www/html/myfile.txt

### List Files in a Path

To get a list of files in a specific path within an S3 bucket, use the download_s3_file:list command.

```bash
drush download_s3_file:list mybucket examplePath

### Database list is saved on s3

To get list of databases on s3 of bucket `ces-drupal-website`

```bash
drush download_s3_file:list ces-drupal-website backups


