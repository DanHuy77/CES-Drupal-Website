<?php

declare(strict_types=1);

namespace Drupal\freshteam\Form;

use Drupal\Core\Ajax\AjaxResponse;
use Drupal\Core\Ajax\CssCommand;
use Drupal\Core\Ajax\HtmlCommand;
use Drupal\Core\Ajax\ReplaceCommand;
use Drupal\Core\Database\Connection;
use Drupal\Core\Form\FormBase;
use Drupal\Core\Form\FormStateInterface;
use Psr\Container\ContainerInterface;

/**
 * Provides a Freshteam Career Synchronization form.
 */
final class RegisterInternshipForm extends FormBase {

  /**
   * The file URL generator.
   *
   * @var \Drupal\Core\Database\Connection
   */
  protected $database;

  /**
   * {@inheritdoc}
   */
  public function getFormId(): string {
    return 'freshteam_register_internship';
  }

  /**
   * {@inheritdoc}
   *
   * @param Drupal\Core\Database\Connection $database
   *   The database.
   */
  public function __construct(Connection $database) {
    $this->database = $database;
  }

  /**
   * {@inheritdoc}
   */
  public static function create(ContainerInterface $container) {
    return new static(
      $container->get('database'),
    );
  }

  /**
   * {@inheritdoc}
   */
  public function buildForm(array $form, FormStateInterface $form_state): array {

    $form['email'] = [
      '#type' => 'textfield',
      '#title' => 'Email',
      '#attributes' => [
        'placeholder' => $this->t('Email'),
      ],
      '#id' => 'edit-freshteam-email',
    ];

    $form['message'] = [
      '#type' => 'markup',
      '#markup' => '<div class="result_message"></div>',
    ];

    $form['actions'] = [
      '#type' => 'submit',
      '#value' => $this->t('Send'),
      '#ajax' => [
        'callback' => '::ajaxSubmitForm',
      ],
      '#attributes' => [
        'class' => ['ces-btn'],
      ],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function validateForm(array &$form, FormStateInterface $form_state): void {

  }

  /**
   * {@inheritdoc}
   */
  public function submitForm(array &$form, FormStateInterface $form_state) {

  }

  /**
   * {@inheritdoc}
   */
  public function ajaxSubmitForm(array &$form, FormStateInterface $form_state) {

    $response = new AjaxResponse();
    $email = $form_state->getValue('email');
    $query = $this->database->select('ces_entity_internship', 'ces');
    $query->condition('ces.label', $email);
    $query->fields('ces', ['label']);
    $result = $query->execute()->fetchAll();
    if (empty($email)) {
      $response->addCommand(
        new HtmlCommand(
          '.result_message',
          '<strong id="edit-name-error" class="error form-item--error-message">This field is required.</strong>'),
      );
    }
    elseif ($result) {
      $response->addCommand(
        new HtmlCommand(
          '.result_message',
          '<strong id="edit-name-error" class="error form-item--error-message">Email is already exist</strong>'),
      );
    }
    else {
      $this->database->insert('ces_entity_internship')
        ->fields([
          'label' => $email,
          'status' => 0,
          'created' => \Drupal::time()->getRequestTime(),
          'uuid' => \Drupal::service('uuid')->generate(),
          'uid' => 1,
        ])
        ->execute();
      $css = ['display' => 'none'];
      $response->addCommand(new CssCommand('.freshteam_register_internship', $css));
      $response->addCommand(new ReplaceCommand('.notification h4', '<h4>Submit Successfully</h4>'));
    }

    return $response;
  }

}
