/**
 * @file
 * Leadership Team behaviors.
 */
(function ($) {
  function clickOnLeadershipTeam() {
    const hash = window.location.hash;
    if (hash !== '') {
      const memberId = hash.substring(1);
      setTimeout(function () {
        $(`#${memberId}`).click();
      }, 800);
    }
  }

  $(document).ready(function () {
    if ($('.items-leadership').length) {
      clickOnLeadershipTeam();
    }
  });
})(jQuery);
