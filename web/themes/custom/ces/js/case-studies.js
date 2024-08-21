/**
 * @file
 * Case studies behaviors.
 */
(function (Drupal, $) {
  const fieldSelect = '.case-studies__filters__section-item select';
  const defaultValue = $(fieldSelect)[0].options[0].value;
  const clearFiltersBtn = '#reset-btn';
  const searchInput =
    ".views-exposed-form #case-studies-filters input[data-drupal-selector='edit-search-api-fulltext']";
  const searchInputButton = '.views-exposed-form #case-studies-filters .case-studies__filters__search .button-overlay';

  let searchInputInteract = false;
  let searchInputValue = '';

  function resetFilters() {
    // Change all field select value to default value.
    $(fieldSelect).val($(defaultValue).val()).change();
  }

  function clearSearchValue() {
    $(searchInput).val('');
    searchInputInteract = true;
    searchInputValue = '';
  }

  function toggleClearFiltersBtn() {
    let isDefaultValue = true;
    // Show or hide clear filters button depend on field search and select value.
    $(fieldSelect).each(function () {
      if ($(this).val() !== defaultValue) {
        isDefaultValue = false;
      }
    });

    $(clearFiltersBtn).toggleClass('d-none', isDefaultValue);
  }

  Drupal.behaviors.caseStudies = {
    attach: function (context, settings) {
      // Set autocomplete dropdown width to be equal to search input.
      if ($('.views-exposed-form #case-studies-filters').length) {
        $('.ui-autocomplete').css('max-width', $(searchInput).outerWidth());
      }

      $(searchInput).on('input', function () {
        // Auto submit when user clear out search input.
        if ($(searchInput).val() === '' || $(searchInput).val() === null) {
          $('.views-exposed-form #case-studies-filters .form-submit').click();
          $(searchInput).removeClass('filled-in');
        } else {
          $(searchInput).addClass('filled-in');
        }

        searchInputInteract = true;
        searchInputValue = $(this).val();
      });

      // Maintain the focus state even if user spams the enter button.
      $(searchInput).on('keypress', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
          searchInputInteract = true;
        }
      });

      $('#reset-btn').on('click', function () {
        // Clear filters value.
        resetFilters();
      });

      $('.views-exposed-form #case-studies-filters .form-select').on('change', function () {
        $('.views-exposed-form #case-studies-filters .form-submit').click();
      });

      $('.views-exposed-form #case-studies-filters .case-studies__filters__search .button-overlay').on(
        'click',
        function () {
          // Clear button only works when search input has value.
          if ($(searchInput).hasClass('filled-in')) {
            clearSearchValue();
            $('.views-exposed-form #case-studies-filters .form-submit').click();
          }
        }
      );

      $(document).on('ajaxComplete', function () {
        toggleClearFiltersBtn();
      });

      // Update stored search input value everytime ajax starts.
      $(document).on('ajaxStart', function () {
        if (searchInputValue !== $(searchInput).val()) {
          searchInputValue = $(searchInput).val();
        }
      });

      $(document).on('click', function (e) {
        // Check if user is interacting with the search input.
        if (
          $(e.target).attr('data-drupal-selector') !== 'edit-search-api-fulltext' ||
          !$(e.target).hasClass('button-overlay') ||
          !$(e.target).hasClass('search-api-autocomplete-suggestion') ||
          !$(e.target).hasClass('autocomplete-suggestion-user-input') ||
          !$(e.target).hasClass('autocomplete-suggestion-suggestion-suffix')
        ) {
          searchInputInteract = false;
        }

        // Check if user select an option from suggestion.
        if (
          $(e.target).hasClass('search-api-autocomplete-suggestion') ||
          $(e.target).hasClass('autocomplete-suggestion-user-input') ||
          $(e.target).hasClass('autocomplete-suggestion-suggestion-suffix')
        ) {
          searchInputInteract = true;
        }
      });

      // Make sure the clickable area stay centered on the icon of search input.
      $('.views-exposed-form #case-studies-filters .case-studies__filters__search .claro-autocomplete').append(
        $(searchInputButton).detach()
      );

      // Refocus to search input if user triggers filter submission from it.
      // Also maintain correct icon display on search input between submissions.
      if ($(searchInput).val() !== '' && $(searchInput).val() !== null) {
        $(searchInput).addClass('filled-in');
      }

      if (searchInputInteract) {
        // Set input value based on user behavior.
        // If user select an option from suggestion, set input to that value.
        // If user keep entering, then set input to the value user is typing.
        if ($(searchInput).attr('value') !== searchInputValue) {
          $(searchInput).val(searchInputValue);
        }

        // Refocus on search input if it was the last element user interact with.
        // Multiply by 2 to ensure the cursor always ends up at the end.
        const strLength = $(searchInput).val().length * 2;
        $(searchInput)[0].setSelectionRange(strLength, strLength);
        $(searchInput).focus();
        searchInputInteract = false;
      }
    }
  };
})(Drupal, jQuery);
