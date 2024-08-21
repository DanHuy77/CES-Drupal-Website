<?php

declare(strict_types=1);

namespace Drupal\ces_entity;

use Drupal\Core\Entity\ContentEntityInterface;
use Drupal\Core\Entity\EntityChangedInterface;
use Drupal\user\EntityOwnerInterface;

/**
 * Provides an interface defining an internship entity type.
 */
interface InternshipInterface extends ContentEntityInterface, EntityOwnerInterface, EntityChangedInterface {

}
