<?php

namespace Drupal\download_s3_file\Commands;

use Aws\Credentials\Credentials;
use Aws\S3\S3Client;
use Drupal\Core\Site\Settings;
use DrupalCodeGenerator\Exception\UnexpectedValueException;
use Drush\Commands\DrushCommands;

/**
 * Provides a Drush command to download files from an S3 bucket.
 *
 * This class initializes an S3 client using the AWS credentials and region
 * specified in the Drupal settings. It provides two Drush commands:
 *
 * - `download_s3_file:get`: Downloads a file from an S3 bucket to a local
 *   destination.
 * - `download_s3_file:list`: Lists all files in a specified path within an
 *   S3 bucket.
 *
 * The class also includes private helper methods to initialize the S3 client
 * and log errors.
 */
class S3FileCommands extends DrushCommands {
  const AWS_ACCESS_KEY = 'AWS_S3_ACCESS_KEY_ID';
  const AWS_SECRET_KEY = 'AWS_S3_SECRET_ACCESS_KEY';
  const AWS_REGION = 'AWS_S3_REGION';

  /**
   * Initializes the S3 client using the AWS credentials and region.
   *
   * @return \Aws\S3\S3Client
   *   The initialized S3 client.
   *
   * @throws \Exception
   *   If the AWS credentials or region are missing.
   */
  public function initializeS3Client() {
    $aws_access_key_id = Settings::get(self::AWS_ACCESS_KEY);
    $aws_secret_access_key = Settings::get(self::AWS_SECRET_KEY);
    $aws_region = Settings::get(self::AWS_REGION);

    if (!$aws_access_key_id || !$aws_secret_access_key || !$aws_region) {
      $this->logError('AWS credentials or region not set in settings.php.');
      throw new UnexpectedValueException('Failed to initialize S3 client: Missing credentials or region.');
    }

    return new S3Client([
      'version' => 'latest',
      'region' => $aws_region,
      'credentials' => new Credentials($aws_access_key_id, $aws_secret_access_key),
    ]);
  }

  /**
   * Logs an error message.
   *
   * @param string $message
   *   The error message.
   *
   * @codeCoverageIgnore
   */
  private function logError($message) {
    $this->logger()->error($message);
  }

  /**
   * Retrieves a file from an S3 bucket.
   *
   * @param string $bucket
   *   The name of the S3 bucket.
   * @param string $key
   *   The key (file path) of the file to retrieve.
   * @param array $options
   *   (optional) An associative array of options, with the following keys:
   *   destination: (string) The local file path to save the retrieved file to.
   *
   * @return mixed
   *   The contents of the retrieved file, or FALSE on failure.
   *
   * @command download_s3_file:get
   * @aliases dsf-get
   */
  public function get($bucket, $key, array $options = ['destination' => '']) {
    try {
      $s3 = $this->initializeS3Client();
      $destination = $options['destination'] ?: '/tmp/' . basename($key);

      if (!is_writable(dirname($destination))) {
        throw new UnexpectedValueException("The destination directory " . dirname($destination) . " is not writable.");
      }

      $s3->getObject([
        'Bucket' => $bucket,
        'Key' => $key,
        'SaveAs' => $destination,
      ]);

      $this->logger()->success(dt('File downloaded to @destination', ['@destination' => $destination]));
    }
    catch (\Exception $e) {
      $this->logError($e->getMessage());
    }
  }

  /**
   * Lists the files in an S3 bucket with the given prefix.
   *
   * @param string $bucket
   *   The name of the S3 bucket to list files from.
   * @param string $prefix
   *   The prefix to use when listing files.
   *
   * @command download_s3_file:list
   * @aliases dsf-list
   */
  public function listFiles($bucket, $prefix) {
    try {
      $s3 = $this->initializeS3Client();

      $objects = $s3->getIterator('ListObjects', [
        'Bucket' => $bucket,
        'Prefix' => $prefix,
      ]);

      $this->output()->writeln("Files in '{$prefix}':");
      foreach ($objects as $object) {
        $this->output()->writeln($object['Key']);
      }
    }
    catch (\Exception $e) {
      $this->logError($e->getMessage());
    }
  }

}
