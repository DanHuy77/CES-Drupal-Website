/**
 * @file
 * Ces Website behaviors.
 */

(function (Drupal, $) {
  let previousWindowWidth = $(window).width();

  function counterInitiate(elem) {
    let startTimestamp = null;

    const options = $(elem).data('options');
    const startVal = options.startVal || 0; // Start value of the counter.
    const endVal = options.endVal; // End value of the counter.
    const duration = options.duration || 2000; // Duration of the animation in milliseconds.

    const higherVal = Math.max(startVal, endVal);
    const lowerVal = Math.min(startVal, endVal);

    const largeScreen = 992;
    const mediumScreen = 768;
    const smallScreen = 576;

    const windowWidth = $(window).width();
    let widthCounter = 40;

    if (windowWidth < largeScreen && windowWidth >= mediumScreen) {
      widthCounter = 28;
    } else if (windowWidth < mediumScreen && windowWidth >= smallScreen) {
      widthCounter = 24;
    }

    $(elem).width(String(higherVal).trim().length * widthCounter);

    function startCounter(timestamp) {
      if (!startTimestamp) {
        startTimestamp = timestamp;
      }

      const progress = timestamp - startTimestamp;
      const percentage = Math.min(progress / duration, 1);
      $(elem).text(Math.floor(percentage * (endVal - startVal) + startVal));

      if (progress < duration) {
        requestAnimationFrame(startCounter.bind(elem));
      } else {
        $(elem).width(String(startVal > endVal ? lowerVal : higherVal).trim().length * widthCounter);
      }
    }
    requestAnimationFrame(startCounter.bind(elem));
  }

  $(window).on('resize', function () {
    // This check is necessary since iOS devices trigger resize event when user scrolls.
    // Make sure there's actual screensize change.
    if (previousWindowWidth !== $(window).width()) {
      previousWindowWidth = $(window).width();
      $('.abt-counter__block-counter-value').each(function () {
        counterInitiate(this);
      });
    }
  });

  $(document).ready(function () {
    $('.abt-counter__block-counter-value').each(function () {
      counterInitiate(this);
    });
  });
})(Drupal, jQuery);
