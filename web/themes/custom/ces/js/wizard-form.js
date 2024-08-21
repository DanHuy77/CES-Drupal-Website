/**
 * @file
 * Wizard Form behaviors.
 */

(function (Drupal, $) {
  const getStartedBtn = '#get-started';
  const formWrapper = '.wizard .webform-submission-form .form-wrapper';
  const landingPage = '.wizard .block-form__landing-page';
  const activeStep = '.wizard .webform-submission-form .is-active';
  const started = 'started';
  const backToLandingPage = '.back-to-landing-page';
  const nextBtn = '.wizard .webform-submission-form .webform-button--next';
  const submitBtn = '.wizard .webform-submission-form .webform-button--submit';
  const formElements = '.wizard .webform-submission-form .form-item .form-element';
  const previousBtn = '.wizard .webform-submission-form .webform-button--previous';
  const activeMarker = activeStep + ' .progress-marker';
  const firstMarker = '1';
  const formDateTime = '.wizard .webform-submission-form .form-type-datetime';
  const uiMenuMaxHeight = $(window).width() < 768 ? '190px' : '275px';
  const isIosDevice = navigator.userAgent.match(/(iPod|iPhone|iPad)/);
  const wizardFormConfirmation = '.wizard .webform-submission-form .wizard-form--confirmation';

  let defaultTimezone = '';
  let selectedTimezone = null;

  // eslint-disable-next-line
  const timezoneData = initTimeZoneData();

  /**
   * Fire data layer script.
   *
   * This function is a request from marketing team.
   *
   * @return {undefined} No return value.
   */
  function fireDataLayer() {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'formSubmission',
      formName: 'drupal migration form'
    });
  }

  /**
   * Returns the current time zone of the user's system.
   *
   * @return {string} The current time zone.
   */
  function getCurrentTimeZone() {
    const options = Intl.DateTimeFormat().resolvedOptions();
    return options.timeZone;
  }

  /**
   * Returns an object containing the minimum and maximum date limits.
   * The minimum date limit is the day after the current date.
   * The maximum date limit is two months after the minimum date.
   * The dates are formatted as 'YYYY-MM-DD' in the user's system time zone.
   *
   * @return {Object} An object with two properties: minDate and maxDate, both of type string.
   */
  function getDateLimits() {
    const timeZone = getCurrentTimeZone();
    const today = new Date();

    // Add one day to the current date
    const minDate = new Date(today);
    minDate.setDate(today.getDate() + 1);

    // Calculate tomorrow plus two months
    const maxDate = new Date(minDate);
    maxDate.setMonth(minDate.getMonth() + 2);

    // Create options to format the date in the desired time zone
    const options = {
      timeZone: timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    };

    // Format the date according to the options
    const formatter = new Intl.DateTimeFormat('en-US', options);
    const minParts = formatter.formatToParts(minDate);
    const maxParts = formatter.formatToParts(maxDate);

    // Extract the date parts and format them as 'YYYY-MM-DD'
    const minDateParts = {};
    minParts.forEach(({ type, value }) => {
      minDateParts[type] = value;
    });

    const maxDateParts = {};
    maxParts.forEach(({ type, value }) => {
      maxDateParts[type] = value;
    });

    return {
      minDate: `${minDateParts.year}-${minDateParts.month}-${minDateParts.day}`,
      maxDate: `${maxDateParts.year}-${maxDateParts.month}-${maxDateParts.day}`
    };
  }

  /**
   * Initializes the timezone autocomplete for the form elements.
   */
  function initTimezoneAutocomplete() {
    // --------- Init autocomplete + select input field. ---------
    let enterPressCount = 0;

    $(formElements).autocomplete({
      source: timezoneData,
      minLength: 1,
      select: function (event, ui) {
        $(formElements).val(ui.item.value).trigger('change');
        // If user changes timezone, reset defaultTimezone to newly selected value.
        // Prevents default timezone being set to the value got by getCurrentTimeZone() when user press back btn.
        defaultTimezone = ui.item.value;

        const matchFound = timezoneData.some((item) => item.includes($(this).val()));
        if (matchFound) {
          $(nextBtn).removeAttr('disabled');
        }
      },
      open: function () {
        // Find and highlight the selected item.
        const menuItems = $(this).autocomplete('widget').find('li');

        menuItems.each(function () {
          const item = $(this).text();
          if (item === defaultTimezone && item === $(formElements).val()) {
            $(this).addClass('ui-selected');
            selectedTimezone = $(this);
          } else {
            $(this).removeClass('ui-selected');
          }
        });

        // Scroll the selected item into view.
        // If there is no selected item, scroll the first item into view.
        if (selectedTimezone) {
          selectedTimezone[0].scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'nearest'
          });
        } else {
          menuItems[0].scrollIntoView({
            behavior: 'instant',
            block: 'nearest',
            inline: 'nearest'
          });
        }
      }
    });

    $(nextBtn).attr('disabled', 'disabled');

    // --------- Styling autocomplete ui menu. ---------
    $('.ui-menu').css('overflow-y', 'scroll');
    $('.ui-menu').css('overflow-x', 'hidden');
    $('.ui-menu').css('z-index', '1060');
    $('.ui-menu').css('max-height', uiMenuMaxHeight);
    $('.ui-menu').css('max-width', $(formElements).outerWidth() + 'px');

    window.addEventListener('resize', function () {
      const newMaxHeight = $(window).width() < 768 ? '175px' : '275px';
      const newElementWidth = $(formElements).outerWidth();

      $('.ui-menu').css('max-height', newMaxHeight);
      $('.ui-menu').css('max-width', newElementWidth + 'px');
    });

    // --------- Create event handler for field timezone. ---------

    // Open autocomplete ui menu on click.
    // Change matching operator to "contains" and search value " ".
    $(formElements).on('click', function () {
      $(this).trigger('select');
      $(this).autocomplete('search', ' ');
      $('.ui-menu').css('display', 'block');
      enterPressCount = 0;
    });

    $(formElements).on('input', function () {
      $(nextBtn).one().attr('disabled', 'disabled');
    });

    $(formElements).on('keydown', function (e) {
      // Make pressCount + 1 when enter is pressed.
      // Press next button if pressCount = 2.
      if (e.key === 'Enter') {
        enterPressCount++;
        if (enterPressCount === 2) {
          if ($(nextBtn).attr('disabled') !== 'disabled') {
            $(nextBtn).one().trigger('click');
          }
        }
      }

      // Trigger search when down arrow is pressed and input value is empty.
      if (e.key === 'ArrowDown' && $(formElements).val() === '') {
        $(formElements).one().trigger('click');
      }
    });

    // Remove ui-selected class on mouseenter.
    $(formElements)
      .autocomplete('widget')
      .on('mouseenter', '.ui-menu-item', function () {
        selectedTimezone.removeClass('ui-selected');
      });

    // --------- Get and set default timezone. ---------

    // Get current timezone city name.
    const currentTimezone = getCurrentTimeZone();
    let cityName = currentTimezone.split('/').pop().replace(/_/g, ' ');
    // Edge case for same city but different name (appears on Chrome).
    if (cityName === 'Saigon') {
      cityName = 'Ho Chi Minh';
    }

    // Check if city name is in the list.
    // If it is, set the default timezone.
    const matchingValues = timezoneData.filter((item) => item.toLowerCase().includes(cityName.toLowerCase()));

    // Prevents defaultTimezone being set to the value got by getCurrentTimeZone() when user press back btn.
    if (matchingValues.length > 0) {
      $(nextBtn).removeAttr('disabled');
      if (defaultTimezone === '') {
        defaultTimezone = matchingValues[0];
        $(formElements).val(defaultTimezone).change();
      }
      $(formElements).trigger('blur');
    }
  }

  /**
   * Initializes custom date and time pickers for form elements.
   */
  function initCustomDateTimePicker() {
    const dateLimits = getDateLimits();

    $(formElements).each(function () {
      if ($(this).hasClass('form-element--api-date')) {
        $(this).attr('placeholder', 'yyyy-mm-dd');
        $(this).flatpickr({
          minDate: dateLimits.minDate,
          maxDate: dateLimits.maxDate,
          enableTime: false
        });
      }

      if ($(this).hasClass('form-element--api-webform-time')) {
        if (!isIosDevice) {
          $(this).clockTimePicker();
        }
      }
    });
  }

  /**
   * Handle the Enter key press event for a given element.
   *
   * @param {Event} e - The Enter key press event.
   * @param {HTMLElement} element - The HTML element that triggered the event.
   * @return {void} This function does not return anything.
   */
  function handleEnterKey(e, element) {
    if (e.key === 'Enter') {
      e.preventDefault();

      if (element.classList.contains('timezone-select-autocomplete')) {
        return;
      }

      if ($(element).val() === '' || $(element).val() === null) {
        return;
      }

      if ($(submitBtn).length > 0 && $(submitBtn).attr('disabled') !== 'disabled') {
        $(submitBtn).one().trigger('click');
        return;
      }

      if ($(nextBtn).attr('disabled') !== 'disabled') {
        $(nextBtn).one().trigger('click');
      }
    }
  }

  /**
   * Focus on the first form element, set text cursor to the end.
   * Initialize custom elements and do not focus by several conditions.
   * @return {void}
   */
  function focusFormElement() {
    if ($(formElements).length > 0) {
      const isTimezone = $(formElements).hasClass('timezone-select-autocomplete');
      const isDateTime = $(formDateTime).length > 0;

      // Make text cursor at the end if it is the input field.
      if ($(formElements).attr('type') === 'text') {
        const strLength = $(formElements).val().length;
        $(formElements)[0].setSelectionRange(strLength, strLength);
      }

      if (isDateTime) {
        initCustomDateTimePicker();
      }

      if (isTimezone) {
        initTimezoneAutocomplete();
      }

      // Do not focus field by conditions below.
      if (isIosDevice || isTimezone || isDateTime) {
        return;
      }

      $(formElements)[0].focus();
    }
  }

  /**
   * Show landing page and hide Wizard Form when user clicks backToLandingPage.
   */
  function showLandingPage() {
    $(formWrapper).removeClass('opacity-100');
    $(backToLandingPage).removeClass('d-block');
    $(landingPage).removeClass('opacity-0 z-index-minus-100');
    $(activeStep).removeClass(started);
  }

  /**
   * Show Wizard Form and hide landing page when user clicks getStarted.
   * Add event listeners for form elements on ajax loading.
   */
  function getStarted() {
    // Add opacity transition effect.
    $(formWrapper).addClass('opa-trans-500ms');
    $(backToLandingPage).addClass('opa-trans-500ms');

    // Hide landing page and show Wizard Form.
    $(formWrapper).addClass('opacity-100');
    $(backToLandingPage).addClass('d-block');
    $(landingPage).addClass('opacity-0 z-index-minus-100');
    $(activeStep).addClass(started);
    focusFormElement();

    $(formElements).on('keydown', function (e) {
      handleEnterKey(e, this);
    });

    // Hide backToLandingPage button on ajax start.
    $(document).on('ajaxStart', function () {
      $(backToLandingPage).removeClass('d-block');
      $(previousBtn).addClass('d-none');
    });

    // Show backToLandingPage button when active marker is the first one on ajax complete.
    $(document).on('ajaxComplete', function () {
      $(previousBtn).removeClass('d-none');

      if ($(activeMarker).attr('data-text') === firstMarker) {
        $(backToLandingPage).addClass('d-block');
      }

      // Re-add class for elements after re-rendering by ajax reload.
      // Re-focus input field after re-rendering by ajax reload.
      $(activeStep).addClass(started);
      $(formWrapper).addClass('opacity-100');
      focusFormElement();

      $(formElements).on('keydown', function (e) {
        handleEnterKey(e, this);
      });

      // Check if confirmation message is rendered.
      // If yes, it means form is submitted, inject dataLayer script.
      if ($(wizardFormConfirmation).length > 0) {
        fireDataLayer();
      }
    });
  }

  $(document).ready(function () {
    $(landingPage).addClass('opa-trans-500ms');
  });

  $(backToLandingPage).on('click', showLandingPage);
  $(getStartedBtn).on('click', getStarted);
})(Drupal, jQuery);
