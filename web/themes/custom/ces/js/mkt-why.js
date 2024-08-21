/**
 * @file
 * Ces Website behaviors.
 */

(function (Drupal, $) {
  $(document).ready(function () {
    // Toggle ul after p tag.
    $('.marketing-why-wrapper .body p').on('click', function (event) {
      $(this).toggleClass('expand');
      $(this).next('ul').slideToggle();
    });
  });
})(Drupal, jQuery);
