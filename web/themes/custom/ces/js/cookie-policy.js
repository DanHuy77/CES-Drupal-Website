/**
 * @file
 * Ces Website behaviors.
 */
(function (Drupal, $) {
  Drupal.behaviors.cookiePolicy = {
    attach: function (context, settings) {
      $('.cookie-policy__body a').on('click', function () {
        const distance = $('table').offset().top - 200;
        $('html, body').animate(
          {
            scrollTop: distance
          },
          300,
          'linear'
        );
      });
    }
  };
})(Drupal, jQuery);
