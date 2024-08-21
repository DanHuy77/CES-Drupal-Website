/**
 * @file
 * Ces Website behaviors.
 */
(function (Drupal, $) {
  const section = '.section-content .case-study-component';
  const anchor = '.section-menu .section-anchors .case-study-anchor';

  function changeColorOfMenuIndex() {
    $(section).each(function () {
      const elemTop = $(this).offset().top;
      const elemBottom = $(this).offset().top + $(this).outerHeight();
      const scrollThreshold = $(window).scrollTop() + $(window).height() / 3.5;

      // Change color of active section anchor.
      if (elemTop <= scrollThreshold && elemBottom > scrollThreshold) {
        const sectionIndex = $(this).attr('block-index');

        $(anchor).each(function () {
          if ($(this).attr('block-index') === sectionIndex) {
            $(this).addClass('active');
          } else {
            $(this).removeClass('active');
          }
        });
      }
    });
  }

  // Change color of anchor matching the block being shown.
  window.addEventListener('scroll', changeColorOfMenuIndex);

  $(anchor).on('click', function () {
    const anchorIndex = $(this).attr('block-index');

    $(section).each(function () {
      if ($(this).attr('block-index') === anchorIndex) {
        $('html, body').animate(
          {
            scrollTop: $(this).offset().top - 70
          },
          200,
          'linear'
        );
      }
    });
  });

  Drupal.behaviors.scroll_block = {
    attach: function (context, settings) {
      changeColorOfMenuIndex();
    }
  };
})(Drupal, jQuery);
