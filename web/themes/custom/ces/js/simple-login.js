/**
 * @file
 * Simple Login Form behaviors.
 */
(function ($) {
  $(document).ready(function () {
    const loginForm = '#user-login-form';
    if ($(loginForm).length) {
      $(loginForm).removeAttr('novalidate');
    }
  });
})(jQuery);
