<?php

declare(strict_types=1);

namespace Drupal\freshteam\Services;

use Drupal\Core\Database\Connection;
use Drupal\Core\Mail\MailManagerInterface;
use Drupal\Core\Site\Settings;
use GuzzleHttp\ClientInterface;
use Http\Client\Exception;
use Symfony\Component\DependencyInjection\ContainerInterface;
use Symfony\Component\Dotenv\Dotenv;

/**
 * Contains all the method to handle request of the site.
 *
 * @category Service
 *
 * @package Custom
 */
class FreshTeamService {
  /**
   * Guzzle\Client instance.
   *
   * @var \GuzzleHttp\ClientInterface
   */
  protected $httpClient;

  /**
   * The file URL generator.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * The mail manager.
   *
   * @var \Drupal\Core\Mail\MailManagerInterface
   */
  protected $mailManager;

  /**
   * {@inheritdoc}
   */
  public function __construct(ClientInterface $http_client, Connection $database, MailManagerInterface $mailManager) {
    $this->httpClient = $http_client;
    $this->database = $database;
    $this->mailManager = $mailManager;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('http_client'),
      $container->get('database'),
      $container->get('plugin.manager.mail'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function getJobsList() {

    if (file_exists(DRUPAL_ROOT . '/sites/default/files/private/.env')) {
      (new Dotenv())->bootEnv(DRUPAL_ROOT . '/sites/default/files/private/.env');

      $fresh_apikey = $_ENV['FRESHTEAM_APIKEY'];
      $fresh_domain = $_ENV['FRESHTEAM_DOMAIN'];
    }
    else {

      $fresh_apikey = Settings::get("FRESHTEAM_APIKEY");
      $fresh_domain = Settings::get("FRESHTEAM_DOMAIN");
    }

    try {
      $headers = [
        'headers' => [
          'Authorization' => 'Bearer ' . $fresh_apikey,
          'accept' => 'application/json',
        ],
      ];
      $request = $this->httpClient->request(
        'GET',
        "https://" . $fresh_domain . "/api/job_postings?status=published" .
          "&sort_type=asc&sort=updated_at",
        $headers
      );

      // Return the response body contents.
      return $request->getBody()->getContents();

    }
    catch (Exception $e) {
      return $e->getMessage();
    }
  }

  /**
   * Get the list of all jobs from Freshteam.
   *
   * @param string $table
   *   The name of the database table.
   * @param string $condition
   *   The condition to apply to the query.
   * @param string $field
   *   The name of the field to retrieve.
   *
   * @return array
   *   An array of all values for the specified field that match the condition.
   */
  public function getAllFieldByStatus($table, $condition, $field) {
    $values = [];
    $query = $this->database->select($table, 'ces');
    $query->condition('ces.status', $condition);
    $query->fields('ces', [$field]);
    $result = $query->execute()->fetchAll();
    foreach ($result as $value) {
      array_push($values, $value->$field);
    }
    return $values;
  }

  /**
   * Sends an email using the mail manager.
   *
   * @param string $email
   *   The email address to send the email to.
   *
   * @return bool
   *   TRUE if the email was sent successfully, FALSE otherwise.
   */
  public function sendMail($email) {
    $jobs_list = json_decode($this->getJobsList());
    // Remove jobs that are not of the specified type or are deleted.
    foreach ($jobs_list as $key => $job) {
      if ($job->type !== 'intern') {
        unset($jobs_list[$key]);
      }
      if ($job->deleted) {
        unset($jobs_list[$key]);
      }

    }
    $params['jobs_list'] = $jobs_list;
    $result = $this->mailManager->mail('freshteam', 'internship_email', $email, 'en', $params, NULL, TRUE);
    return $result['result'];
  }

  /**
   * Updates the status of a record in the database table by email.
   *
   * @param string $table
   *   The name of the database table.
   * @param string $email
   *   The email address to use as the condition for the update.
   */
  public function updateStatusByEmail($table, $email) {
    $this->database->update($table)
      ->condition('label', $email)
      ->fields([
        'status' => 1,
        'changed' => \Drupal::time()->getRequestTime(),
      ])
      ->execute();
  }

  /**
   * Deletes a record from the database table by email.
   *
   * @param string $table
   *   The name of the database table.
   * @param string $email
   *   The email address to use as the condition for the delete.
   */
  public function deleteInternByEmail($table, $email) {
    $this->database->delete($table)
      ->condition('label', $email)
      ->execute();
  }

}
