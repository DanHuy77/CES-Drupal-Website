<?php

namespace Drupal\ces_pages;

use Drupal\Core\File\FileUrlGeneratorInterface;
use Drupal\Core\Site\Settings;
use Drupal\node\Entity\Node;
use Drupal\taxonomy\Entity\Term;
use Twig\Extension\AbstractExtension;
use Twig\TwigFunction;

/**
 * Twig extension to hash an input string.
 */
class TwigExtension extends AbstractExtension {

  /**
   * The file URL generator.
   *
   * @var \Drupal\Core\File\FileUrlGeneratorInterface
   */
  protected $fileUrlGenerator;

  /**
   * Constructs a new MinorUnitsConverter object.
   *
   * @param \Drupal\Core\File\FileUrlGeneratorInterface $fileUrlGenerator
   *   The file URL generator.
   */
  public function __construct(FileUrlGeneratorInterface $fileUrlGenerator) {
    $this->fileUrlGenerator = $fileUrlGenerator;
  }

  /**
   * {@inheritdoc}
   */
  public function getFunctions(): array {
    return [
      new TwigFunction('get_term_info_by_id', [$this, 'getTermInfoById']),
      new TwigFunction('get_term_names_by_node_id',
      [$this, 'getTermNamesByNodeId']),
      new TwigFunction('get_server_url', [$this, 'getServerUrl']),
      new TwigFunction('get_environment', [$this, 'getEnvironment']),
    ];
  }

  /**
   * Get all term names by node Id.
   *
   * @return array
   *   An array of term names.
   */
  public function getTermNamesByNodeId(int $nid): array {
    if (empty($nid) && !is_numeric($nid)) {
      return NULL;
    }
    $node = Node::load($nid);
    if (empty($node)) {
      return NULL;
    }
    $term_names = [];
    $region_id = $node->get("field_region")->getValue()[0]['target_id'];
    $company_size_id = $node->get("field_company_size")->getValue()[0]['target_id'];
    $industry_id = $node->get("field_industry")->getValue()[0]['target_id'];
    $technology_ids = $node->get("field_technology")->getValue();
    $region_name = $this->getTermInfoById($region_id)['name'];
    $company_size_name = $this->getTermInfoById($company_size_id)['name'];
    $industry_name = $this->getTermInfoById($industry_id)['name'];
    array_push($term_names, $company_size_name);
    foreach (array_slice($technology_ids, 0, 3) as $technology_id) {
      $service_name = $this->getTermInfoById($technology_id['target_id'])['name'];
      array_push($term_names, $service_name);
    }
    array_push($term_names, $industry_name, $region_name);
    return $term_names;
  }

  /**
   * Get Term information by Id.
   *
   * @return array|null
   *   Term array.
   */
  public function getTermInfoById(int $tid): array | NULL {
    if (empty($tid) && !is_numeric($tid)) {
      return NULL;
    }

    $term = Term::load($tid);
    if (empty($term)) {
      return NULL;
    }

    $term_label = str_replace(
      "_",
      " ",
      $term->get("vid")->getValue()[0]['target_id']
    );
    $term_name = $term->label();
    if (
      $term->hasField("field_technology_link") &&
      !empty($term->get("field_technology_link")->getValue()[0])
    ) {
      $technology_link = $term->get("field_technology_link")->getValue()[0]['uri'];
      $term_info = [
        "label" => $term_label,
        "name" => $term_name,
        "link" => $technology_link,
      ];
    }
    else {
      $term_info = [
        "label" => $term_label,
        "name" => $term_name,
      ];
    }

    return $term_info;
  }

  /**
   * Retrieve the server URL from the settings.
   *
   * @return string
   *   The server URL, defaults to 'unknown'.
   */
  public function getServerUrl() {
    return Settings::get("server_url", 'unknown');
  }

  /**
   * Retrieves the "verenv" configuration setting representing the environment.
   *
   * @return string
   *   The value of the "verenv" setting or a default value if not defined.
   */
  public function getEnvironment() {
    return Settings::get("verenv", 'unknown');
  }

}
