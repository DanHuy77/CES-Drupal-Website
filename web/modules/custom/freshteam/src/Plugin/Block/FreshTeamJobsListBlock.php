<?php

declare(strict_types=1);

namespace Drupal\freshteam\Plugin\Block;

use Drupal\Core\Block\BlockBase;
use Drupal\Core\Form\FormBuilderInterface;
use Drupal\Core\Form\FormStateInterface;
use Drupal\Core\Plugin\ContainerFactoryPluginInterface;
use Drupal\freshteam\Services\FreshTeamService;
use Symfony\Component\DependencyInjection\ContainerInterface;

/**
 * Provides a Freshteam career synchronization.
 *
 * @Block(
 *   id = "freshteam_career_synchronization",
 *   admin_label = @Translation("Freshteam career synchronization"),
 *   category = @Translation("Custom"),
 * )
 */
class FreshTeamJobsListBlock extends BlockBase implements ContainerFactoryPluginInterface {
  /**
   * Freshteam Service.
   *
   * @var \Drupal\freshteam\Services\FreshTeamService
   */
  protected $freshteamService;

  /**
   * Drupal\Core\Form\FormBuilderInterface definition.
   *
   * @var formBuilder
   */
  protected $formBuilder;

  /**
   * Constructs a new FreshTeamService instance.
   *
   * @param \Drupal\freshteam\Services\FreshTeamService $freshteam_service
   *   The service for interacting with job lists.
   * @param array $configuration
   *   The block configuration.
   * @param string $plugin_id
   *   The plugin ID for the block.
   * @param mixed $plugin_definition
   *   The plugin definition.
   * @param \Drupal\Core\Form\FormBuilderInterface $form_builder
   *   The form builder.
   */
  public function __construct(
    FreshTeamService $freshteam_service,
    array $configuration,
    $plugin_id,
    $plugin_definition,
    FormBuilderInterface $form_builder,
  ) {
    parent::__construct($configuration, $plugin_id, $plugin_definition);
    $this->freshteamService = $freshteam_service;
    $this->formBuilder = $form_builder;
  }

  /**
   * Creates a new instance of the FreshteamBlock class.
   *
   * @param \Symfony\Component\DependencyInjection\ContainerInterface $container
   *   The service container.
   * @param array $configuration
   *   An array of configuration options.
   * @param mixed $plugin_id
   *   The ID of the plugin.
   * @param mixed $plugin_definition
   *   The definition of the plugin.
   *
   * @return static
   *   A new instance of the FreshteamBlock class.
   */
  public static function create(
    ContainerInterface $container,
    array $configuration,
    $plugin_id,
    $plugin_definition,
  ) {
    return new static(
      $container->get('freshteam.service'),
      $configuration,
      $plugin_id,
      $plugin_definition,
      $container->get('form_builder')
    );
  }

  /**
   * {@inheritdoc}
   */
  public function blockForm($form, FormStateInterface $form_state) {
    // Init variables.
    $freshteam_type = '#type';
    $freshteam_title = '#title';
    $freshteam_required = '#required';
    $freshteam_default_value = '#default_value';

    $form['content_title'] = [
      $freshteam_type => 'textfield',
      $freshteam_title  => $this->t('Content Title'),
      $freshteam_required => FALSE,
      $freshteam_default_value => $this->configuration['content_title'],
    ];

    $form['content_sub_title'] = [
      $freshteam_type => 'textfield',
      $freshteam_title  => $this->t('Content Sub Title'),
      $freshteam_required => FALSE,
      $freshteam_default_value => $this->configuration['content_sub_title'],
    ];

    $form['job_type'] = [
      $freshteam_type => 'select',
      $freshteam_title  => $this->t('Job Type'),
      $freshteam_required => TRUE,
      '#options' => [
        'full_time' => $this->t('Full Time'),
        'intern' => $this->t('Intern'),
      ],
      $freshteam_default_value => $this->configuration['job_type'],
    ];

    return $form;
  }

  /**
   * {@inheritdoc}
   */
  public function blockSubmit($form, FormStateInterface $form_state) {
    $values = $form_state->getValues();
    $this->configuration['job_type'] = $values['job_type'];
    $this->configuration['content_title'] = $values['content_title'];
    $this->configuration['content_sub_title'] = $values['content_sub_title'];
  }

  /**
   * Implements hook_build().
   *
   * Builds and returns the renderable array representing the block content.
   *
   * @return array
   *   A renderable array representing the block content.
   */
  public function build() {
    $jobType = $this->configuration['job_type'];
    $contentTitle = $this->configuration['content_title'];
    $contentSubTitle = $this->configuration['content_sub_title'];
    $jobsList = json_decode($this->freshteamService->getJobsList());

    // Remove jobs that are not of the specified type or are deleted.
    foreach ($jobsList as $key => $job) {
      if ($job->type !== $jobType && $job->type != "fixed_term_contract") {
        unset($jobsList[$key]);
      }
      if ($job->deleted) {
        unset($jobsList[$key]);
      }
      if ($job->type == "fixed_term_contract" && $jobType == 'intern') {
        unset($jobsList[$key]);
      }

    }

    $form = $this->formBuilder->getForm('Drupal\freshteam\Form\RegisterInternshipForm');

    return [
      '#theme' => 'jobs_list',
      '#data' => [
        "jobType" => $jobType,
        "jobsList" => $jobsList,
        "contentTitle" => $contentTitle,
        "contentSubTitle" => $contentSubTitle,
        "form" => $form,
      ],
      '#attached' => [
        'library' => ['freshteam/freshteam'],
      ],
    ];
  }

}
