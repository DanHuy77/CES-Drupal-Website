/**
 * @file
 * Ces Website behaviors.
 */
(function (Drupal, $) {
  Drupal.behaviors.our_team = {
    attach: function (context, settings) {
      // Show triangle top left image staff.
      $(document).ready(function () {
        $('.staff-items .item').each(function () {
          const height = $(this).find('.right-wrapper .avatar').height();
          $(this)
            .find('.right-wrapper .triangle-top-left')
            .css('border-top', height + 'px solid #f5f5f5');
        });
      });
    }
  };

  // Debounce function.
  function debounce(callback, delay) {
    let timerId;

    return function () {
      const context = this;
      const args = arguments;

      // If there's a timeout set, clear it to prevent the callback from executing.
      if (timerId) {
        clearTimeout(timerId);
      } else {
        // If no timeout is set, execute the callback immediately.
        callback.apply(context, args);
      }

      // Set a new timeout
      timerId = setTimeout(function () {
        timerId = null;
      }, delay);
    };
  }

  // Show expanded leadership content.
  $('.items-leadership .item .item-wrapper').on(
    'click',
    debounce(function () {
      const $itemWrapper = $(this);
      const id = $itemWrapper.attr('id');
      const $currentItem = $itemWrapper.parent('.item');
      const isActive = $currentItem.hasClass('active');
      const top = $currentItem.offset().top;

      // Hide currently expanded content.
      $('.items-leadership .item').each(function () {
        const $item = $(this);
        if ($item.find('.item-wrapper').attr('id') !== id) {
          $item.find('.content-scrollbar').scrollTop(0);
          $item.find('.item-wrapper').removeClass('active');
          $item.find('.grid-show, .content-top').hide();
          $item.removeClass('active');
          $item.toggleClass('row-active', !isActive && $item.offset().top === top);
        }
      });

      if (isActive) {
        $currentItem.find('.content-scrollbar').scrollTop(0);
      }

      $currentItem.toggleClass('row-active', !isActive);
      $currentItem.toggleClass('active');
      $currentItem.find('.grid-show').slideToggle(300, function () {
        // Scroll expanded content into view.
        const topAfterSlide = $currentItem.offset().top;
        if (topAfterSlide !== top) {
          $('html, body').animate({ scrollTop: topAfterSlide - 80 }, 100, 'linear');
        }
      });
      $currentItem.find('.content-top').slideToggle(300);
      $itemWrapper.toggleClass('active');
    }, 300)
  );

  // Hide leadership content when click close button.
  $('.items-leadership .item .grid-navigation-close').on('click', function () {
    const $item = $(this).closest('.item');
    $item.find('.content-scrollbar').scrollTop(0);
    $('.items-leadership .item').removeClass('row-active');
    $item.removeClass('active');
    $item.find('.grid-show, .content-top').slideUp(300);
    $item.find('.item-wrapper').removeClass('active');
  });

  // Update row active status when resize window.
  $(window).on('resize', function () {
    const $activeItem = $('.items-leadership .item.active');
    const top = $activeItem.length ? $activeItem.offset().top : null;

    $('.items-leadership .item').each(function () {
      if (!$(this).hasClass('active')) {
        $(this).toggleClass('row-active', top !== null && $(this).offset().top === top);
      }
    });
  });
})(Drupal, jQuery);
