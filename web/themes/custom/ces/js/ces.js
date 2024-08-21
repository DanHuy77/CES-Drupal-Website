/**
 * @file
 * Ces Website behaviors.
 */
(function ($) {
  if ($(document).scrollTop() < $(window).height()) {
    $('#back-to-top').removeClass('button-show');
  } else {
    $('#back-to-top').addClass('button-show');
  }

  $(window).scroll(function () {
    const screenHeight = $(window).height();
    const pageOffset = $(document).scrollTop();
    if (pageOffset > screenHeight) {
      $('#back-to-top').addClass('button-show');
    } else {
      $('#back-to-top').removeClass('button-show');
    }
  });

  function handleValidateWebForms() {
    $('.validate-custom-webform').remove();
    $('.webform-ajax-form-wrapper').prepend(
      '<div class="validate-custom-webform"><p class="validate-custom-webform-message">There was a problem with your submission. Please review the fields below.</p></div>'
    );
  }

  const targetNodes = $('.js-form-item');

  function callback(mutationsList, observer) {
    mutationsList.forEach(function (mutation) {
      if (mutation.type === 'childList') {
        const strongElement = $(mutation.target).find('strong.error');
        const labelElement = $(mutation.target).find('label');
        if (strongElement.length && labelElement.length) {
          labelElement.after(strongElement);
        }
      }
    });
    observer.disconnect();
  }

  targetNodes.each(function (index, targetNode) {
    const observer = new MutationObserver(callback);
    observer.observe(targetNode, { childList: true });
  });

  // Show warning message when submit form.
  $('.block-form__wrapper .webform-button--submit').on('click', function () {
    $('.block-form__wrapper').each(function () {
      let message = 1;

      if ($(this).find("textarea[name='message']").length) {
        message = $(this).find("textarea[name='message']").val().length;
      }

      const name = $(this).find("input[name='name']").val().length;
      const email = $(this).find("input[name='email_address']").val().length;

      if (name === 0 || email === 0 || message === 0) {
        handleValidateWebForms();
      }
    });
  });

  $(document).ready(function () {
    $('.simplelogin-wrapper .simplelogin-form .simplelogin-link').remove();
  });
})(jQuery);
