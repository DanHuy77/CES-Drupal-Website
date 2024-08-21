<?php

declare(strict_types=1);

namespace Drupal\s3_aggregated_assets\File;

use Drupal\Component\Utility\UrlHelper;
use Drupal\Core\Extension\ModuleHandlerInterface;
use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\PrivateKey;
use Drupal\Core\Site\Settings;
use Drupal\Core\StreamWrapper\StreamWrapperManager;
use Drupal\Core\StreamWrapper\StreamWrapperManagerInterface;
use Drupal\Core\Url;
use Drupal\s3_aggregated_assets\S3ServiceProvider;
use Symfony\Component\HttpFoundation\RequestStack;

/**
 * Class FileUrlGenerator.
 *
 * Generates CDN file URLs for local files that are mapped to a CDN.
 * Implements the FileUrlGeneratorInterface.
 */
class FileUrlGenerator implements FileUrlGeneratorInterface {

  final public const RELATIVE = ':relative:';

  /**
   * Constructs a new CDN file URL generator object.
   *
   * @param \Drupal\Core\File\FileUrlGeneratorInterface $decorated
   *   The decorated file URL generator.
   * @param string $root
   *   The app root.
   * @param \Drupal\Core\StreamWrapper\StreamWrapperManagerInterface $streamWrapperManager
   *   The stream wrapper manager.
   * @param \Drupal\Core\Extension\ModuleHandlerInterface $moduleHandler
   *   The module handler.
   * @param \Symfony\Component\HttpFoundation\RequestStack $requestStack
   *   The request stack.
   * @param \Drupal\Core\PrivateKey $privateKey
   *   The private key service.
   * @param \Drupal\domain_alter\S3ServiceProvider $s3Service
   *   The S3 service.
   */
  public function __construct(
    protected FileUrlGeneratorInterface $decorated,
    protected readonly string $root,
    protected StreamWrapperManagerInterface $streamWrapperManager,
    protected readonly ModuleHandlerInterface $moduleHandler,
    protected RequestStack $requestStack,
    protected PrivateKey $privateKey,
    protected S3ServiceProvider $s3Service,
  ) {
  }

  /**
   * {@inheritdoc}
   */
  public function generateString(string $uri): string {
    return $this->doGenerate($uri) ?? $this->decorated->generateString($uri);
  }

  /**
   * {@inheritdoc}
   */
  public function generateAbsoluteString(string $uri): string {
    return $this->doGenerate($uri) ?? $this->decorated->generateAbsoluteString($uri);
  }

  /**
   * {@inheritdoc}
   */
  public function generate(string $uri): Url {
    $result = $this->doGenerate($uri);
    return $result ? Url::fromUri($result) : $this->decorated->generate($uri);
  }

  /**
   * {@inheritdoc}
   */
  public function transformRelative(string $file_url, bool $root_relative = TRUE): string {
    return $this->decorated->transformRelative($file_url, $root_relative);
  }

  /**
   * Generates a CDN file URL for local files that are mapped to a CDN.
   *
   * Compatibility: normal paths and stream wrappers.
   *
   * There are two kinds of local files:
   * - "managed files", i.e. those stored by a Drupal-compatible stream wrapper.
   *   These are files that have either been uploaded by users or were generated
   *   automatically (for example through CSS aggregation).
   * - "shipped files", i.e. those outside of the files directory, which ship as
   *   part of Drupal core or contributed modules or themes.
   *
   * @param string $uri
   *   The URI to a file for which we need a CDN URL, or the path to a shipped
   *   file.
   *
   * @return string|null
   *   A string containing the scheme-relative CDN file URI, or NULL if this
   *   file URI should not be served from a CDN.
   */
  public function doGenerate(string $uri): ?string {
    if ($this->shouldSkipGeneration($uri)) {
      return NULL;
    }

    // Allow the URI to be altered.
    $this->moduleHandler->alter('file_url', $uri);

    $cdn_domain = Settings::get(S3_AGGREGATED_ASSETS_CDN_NAME);
    $bucket_name = Settings::get(S3_AGGREGATED_ASSETS_S3_BUCKET);

    // Don't alter file URLs when not set value CDN or S3 bucket.
    if ($bucket_name == NULL || $cdn_domain == NULL) {
      return NULL;
    }

    $filePaths = $this->getFilePaths($uri);
    $relative_file_path = $filePaths['relative_file_path'];
    $absolute_file_path = $filePaths['absolute_file_path'];

    $file_name = basename($absolute_file_path);

    // Check the file's existence condition in local and s3 to push to s3.
    if (strpos($absolute_file_path, 'default/files') !== FALSE && file_exists($absolute_file_path)) {
      if ($this->processFile($absolute_file_path, $bucket_name, $file_name)) {
        return NULL;
      }
    }
    else {
      return NULL;
    }

    return $this->getCdnUrl($absolute_file_path, $relative_file_path, $cdn_domain);
  }

  /**
   * Retrieves the relative and absolute file paths based on the provided URI.
   *
   * This method checks the URI's scheme to determine
   * if it's a stream wrapper URI or a standard file path.
   * Depending on the scheme, it computes both the relative
   * and absolute file paths.
   *
   * If the URI does not use a recognized scheme, it assumes a relative path and
   * constructs the relative and absolute paths accordingly.
   * If it does use a scheme,the method retrieves
   * the external URL to derive the relative path.
   *
   * @param string $uri
   *   The URI to process, which can be a stream wrapper URI or a file path.
   *
   * @return array
   *   An associative array containing:
   *   -'relative_file_path' (string): The computed relative file path.
   *   -'absolute_file_path' (string): The computed absolute file path.
   *
   * @throws Exception
   *   If the URI is invalid or if there are issues retrieving the external URL.
   */
  public function getFilePaths($uri) {
    if (!$scheme = StreamWrapperManager::getScheme($uri)) {
      $relative_url = !str_starts_with($uri, $this->getBasePath() . '/')
        // Convert Drupal root-relative file URI to Drupal-root relative URL.
        ? '/' . $uri
        // Convert HTTP root-relative file URL to a Drupal root-relative URL.
        : str_replace($this->getBasePath(), '', $uri);
      $relative_file_path = parse_url($relative_url)['path'];
      $absolute_file_path = $this->root . $relative_file_path;
    }
    else {
      $relative_file_path = '/' . substr($uri, strlen($scheme . '://'));
      $absolute_file_path = $scheme . '://' . $relative_file_path;
    }

    return [
      'relative_file_path' => $relative_file_path,
      'absolute_file_path' => $absolute_file_path,
    ];
  }

  /**
   * Determines if the generation of a file should be skipped.
   *
   * This decision is based on specific conditions related to the file.
   *
   * @param string $uri
   *   The URI of the file.
   *
   * @return bool
   *   True if the generation should be skipped, false otherwise.
   */
  private function shouldSkipGeneration(string $uri): bool {
    // Don't alter file URLs when running update.php.
    if (
      defined('MAINTENANCE_MODE') ||
      stripos($_SERVER['PHP_SELF'], 'update.php') !== FALSE
    ) {
      return TRUE;
    }
    // Don't alter CSS file URLs while settings.php disable CSS aggregation.
    if (
      substr($uri, -4) === '.css' &&
      isset($GLOBALS['config']['system.performance']['css']['preprocess']) &&
      !$GLOBALS['config']['system.performance']['css']['preprocess']
    ) {
      return TRUE;
    }

    return FALSE;
  }

  /**
   * Generates a CDN URL for a given file.
   *
   * This function checks if the specified absolute
   * file path contains certain predefined
   * paths for CSS and JS files. If a match is found,
   * it constructs and returns the full CDN URL.
   * If no match is found, it returns NULL.
   *
   * @param string $absolute_file_path
   *   The absolute path of the file on the server.
   * @param string $relative_file_path
   *   The relative path of the file to be used in the CDN URL.
   * @param string $cdn_domain
   *   The domain of the CDN where the file will be served from.
   *
   * @return string|null
   *   Returns the constructed CDN URL if the absolute path matches
   *   one of the predefined paths; otherwise, returns NULL.
   */
  private function getCdnUrl(string $absolute_file_path, string $relative_file_path, string $cdn_domain): ?string {
    // Define paths to check against the absolute file path.
    $paths_to_check = ['default/files/css', 'default/files/js'];
    foreach ($paths_to_check as $path) {
      // Check if the absolute file path contains one of the predefined paths.
      if (strpos($absolute_file_path, $path) !== FALSE) {
        // Remove the base directory from the relative file path.
        $relative_file_path = str_replace('/sites/default/files', '', $relative_file_path);
        // Construct and return the CDN URL.
        return 'https://' . $cdn_domain . $this->getBasePath() . UrlHelper::encodePath($relative_file_path);
      }
    }

    // Return NULL if no matching path is found.
    return NULL;
  }

  /**
   * Processes the file for a given folder (js or css).
   *
   * Checks its existence and uploads it to S3 if it doesn't already exist.
   *
   * @param string $absolute_file_path
   *   The absolute path of the file to upload.
   * @param string $bucket_name
   *   The name of the S3 bucket.
   * @param string $file_name
   *   The name of the file.
   *
   * @return bool
   *   Returns true if the file was uploaded, false otherwise.
   */
  private function processFile($absolute_file_path, $bucket_name, $file_name): bool {
    $folders_to_check = ['js', 'css'];

    foreach ($folders_to_check as $folder) {
      if (strpos($absolute_file_path, "default/files/$folder") !== FALSE) {
        if (!$this->s3Service->fileExists($bucket_name, "$folder/$file_name")) {
          $this->uploadFile($absolute_file_path, $bucket_name, $folder);
          // File was uploaded.
          return TRUE;
        }
        // File already exists in S3, no need to upload.
        return FALSE;
      }
    }

    // File was not uploaded (either it exists or path check failed).
    return FALSE;
  }

  /**
   * Checks and uploads a file to S3 if it doesn't already exist.
   *
   * The process to handle the file upload asynchronously.
   *
   * @param string $absolute_file_path
   *   The absolute path of the file to upload.
   * @param string $bucket_name
   *   The name of the S3 bucket.
   * @param string $folder
   *   The folder in the S3 bucket where the file should be uploaded.
   */
  private function uploadFile($absolute_file_path, $bucket_name, $folder) {
    // Create a new Fiber for the file upload process.
    $fiber = new \Fiber(function () use ($absolute_file_path, $bucket_name, $folder) {
      try {
          // Perform the file upload to S3.
          $this->s3Service->uploadFile($absolute_file_path, $bucket_name, $folder);
          // Log the successful upload.
          \Drupal::messenger()->addStatus("File uploaded successfully to $folder.");
      }
      catch (\Exception $e) {
          // Log any exceptions that occur during the file upload.
          \Drupal::messenger()->addError("Error uploading file to S3: " . $e->getMessage());
      }
    });

    try {
      // Start the Fiber.
      $fiber->start();
    }
    catch (\Exception $e) {
      // Log any exceptions that occur during the fiber creation or execution.
      \Drupal::messenger()->addError("Error in fiber process: " . $e->getMessage());
    }
  }

  /**
   * Retrieves the base path from the current request.
   *
   * This method uses the Symfony RequestStack to get the base path of the
   * current request.
   *
   * @see \Symfony\Component\HttpFoundation\Request::getBasePath()
   *
   * @return string
   *   The base path of the current request.
   */
  protected function getBasePath(): string {
    return $this->requestStack->getCurrentRequest()->getBasePath();
  }

}
