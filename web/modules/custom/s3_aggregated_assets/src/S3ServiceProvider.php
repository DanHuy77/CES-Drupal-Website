<?php

declare(strict_types=1);

namespace Drupal\s3_aggregated_assets;

use Aws\Credentials\Credentials;
use Aws\S3\Exception\S3Exception;
use Aws\S3\S3Client;
use Drupal\Core\Site\Settings;
use DrupalCodeGenerator\Exception\UnexpectedValueException;

/**
 * Provides S3 services for file management.
 */
class S3ServiceProvider {
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
    \Drupal::messenger()->addStatus($message);
  }

  /**
   * Check if a file exists in an S3 bucket.
   *
   * @param string $bucket_name
   *   The name of the S3 bucket.
   * @param string $key
   *   The key of the file to check.
   *
   * @return bool
   *   True if the file exists, false otherwise.
   */
  public function fileExists($bucket_name, $key) {
    $s3 = $this->initializeS3Client();

    try {
      $s3->headObject([
        'Bucket' => $bucket_name,
        'Key' => $key,
      ]);
      return TRUE;
    }
    catch (S3Exception $e) {
      if ($e->getStatusCode() == 404) {
        return FALSE;
      }
      $this->logError('S3 check file exists error: ' . $e->getMessage());
      return FALSE;
    }
  }

  /**
   * Upload a file to an S3 bucket.
   *
   * This function uploads a file to the specified S3
   * bucket under the given folder path.
   * If the upload is successful, it returns TRUE.
   * If an error occurs during the upload,
   * it logs the error message and returns FALSE.
   *
   * @param string $file_path
   *   The path to the file to upload.
   * @param string $bucket_name
   *   The name of the S3 bucket.
   * @param string $folder_path
   *   The folder path within the bucket where the file will be uploaded.
   *
   * @return bool
   *   TRUE if the file was uploaded successfully, FALSE otherwise.
   *
   * @throws \Exception
   *   If there is an issue initializing the S3 client.
   */
  public function uploadFile($file_path, $bucket_name, $folder_path) {
    $s3 = $this->initializeS3Client();

    // Extract the file name from the file path.
    $file_name = basename($file_path);

    // Concatenate the folder path with the file name to create the full key.
    $key = rtrim($folder_path, '/') . '/' . $file_name;

    try {
      $s3->putObject([
        'Bucket' => $bucket_name,
        'Key' => $key,
        'SourceFile' => $file_path,
      ]);
      return TRUE;
    }
    catch (S3Exception $e) {
      $this->logError('S3 upload error: ' . $e->getMessage());
      return FALSE;
    }
  }

  /**
   * Delete a folder (prefix) in an S3 bucket.
   *
   * @param string $bucket_name
   *   The name of the S3 bucket.
   * @param string $folder_path
   *   The path of the folder to delete.
   *
   * @return bool
   *   True if the folder was deleted successfully, false otherwise.
   */
  public function deleteFolder($bucket_name, $folder_path) {
    $s3 = $this->initializeS3Client();

    // List objects under the specified folder path (prefix).
    try {
      $objects = $s3->listObjects([
        'Bucket' => $bucket_name,
        'Prefix' => rtrim($folder_path, '/') . '/',
      ]);

      if ($objects && !empty($objects['Contents'])) {
        $deleteKeys = [];
        foreach ($objects['Contents'] as $object) {
          $deleteKeys[] = ['Key' => $object['Key']];
        }

        // Delete the objects.
        $s3->deleteObjects([
          'Bucket' => $bucket_name,
          'Delete' => ['Objects' => $deleteKeys],
        ]);

        return TRUE;
      }

      // No objects found to delete.
      return FALSE;
    }
    catch (S3Exception $e) {
      $this->logError('S3 delete folder error: ' . $e->getMessage());
      return FALSE;
    }
  }

}
