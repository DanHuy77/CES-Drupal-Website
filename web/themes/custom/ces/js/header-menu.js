/**
 * @file
 * Ces Website behaviors.
 */
(function (Drupal, $) {
  Drupal.behaviors.headerMenu = {
    attach: function (context, settings) {
      const mainNavigation = 'body #block-ces-mainnavigationwebsite';
      let menuExpanded = false;

      // Expand menu when clicking on the symbol on header.

      $(once('expand-menu', '.content-header .mobile-menu-button')).on('click', function () {
        if (!$(mainNavigation).hasClass('expanded')) {
          $(mainNavigation).addClass('expanded');
          $('body .main-page-content, body .content-header, body .footer').addClass('retracted');
          $('body').addClass('prevent-interaction');
        } else {
          $(mainNavigation).removeClass('expanded');
          $('body .main-page-content, body .content-header, body .footer').removeClass('retracted');
          $('body').removeClass('prevent-interaction');
        }

        if (!$(mainNavigation).hasClass('clicked')) {
          $(mainNavigation).addClass('clicked');
          $(mainNavigation + ' #superfish-main-navigation-website-toggle').trigger('click');
        }

        // If menu is currently retracted, wait for it to fully expand before setting its state.
        if (!menuExpanded) {
          setTimeout(function () {
            menuExpanded = true;
          }, 600);
        } else {
          menuExpanded = false;
        }
      });

      // Close menu if click outside or on the close button.
      $(document).on('click', function (e) {
        if (menuExpanded) {
          if (
            (!$('#block-ces-mainnavigationwebsite').has(e.target).length &&
              !e.target.classList.contains('mobile-side-menu')) ||
            e.target.classList.contains('sf-accordion-toggle') ||
            e.target.classList.contains('contact-us')
          ) {
            $('.content-header .mobile-menu-button').trigger('click');
          }
        }
      });

      window.addEventListener('resize', function () {
        const menu = $('.content-header .region-header #block-ces-mainnavigationwebsite');
        const menuMobile = $('body #block-ces-mainnavigationwebsite');

        // Show mobile/tablet open menu button if the page has menu.
        if (menuMobile.length !== 0) {
          if ($('.content-header .mobile-menu-button').hasClass('hide-on-marketing')) {
            $('.content-header .mobile-menu-button').removeClass('hide-on-marketing');
          }
        }

        // Detach the menu and attach it to body so that it can span then entire height of the screen
        // on devices with screen width <= 992px.
        setTimeout(function () {
          // Check if the hamburger icon has appeared.
          if ($('.content-header .mobile-menu-button').css('display') === 'block') {
            $(
              '.content-header .region-header #block-ces-mainnavigationwebsite #superfish-main-navigation-website'
            ).addClass('sf-hidden');

            $('body #block-ces-mainnavigationwebsite #superfish-main-navigation-website-accordion')
              .removeClass('sf-hidden')
              .css('display', 'block');

            $('body').append(menu.addClass('mobile-side-menu').detach());

            if (!$('body .main-page-content .overlay').length && !$('body .footer .overlay').length) {
              $('body .main-page-content, body .footer').append('<div class="overlay"></div>');
            }
          } else {
            $('body #block-ces-mainnavigationwebsite #superfish-main-navigation-website').removeClass('sf-hidden');

            $('body #block-ces-mainnavigationwebsite #superfish-main-navigation-website-accordion')
              .addClass('sf-hidden')
              .css('display', 'none');

            $('.content-header .region-header').append(menuMobile.removeClass('mobile-side-menu').detach());

            if ($('body .main-page-content .overlay').length && $('body .footer .overlay').length) {
              $('body .main-page-content .overlay, body .footer .overlay').detach();
            }
          }
        }, 200);
      });

      window.dispatchEvent(new Event('resize'));

      // If the page doesn't load at the top, prevent header menu from being transparent.
      if ($(document).scrollTop() > 0) {
        $('body .content-header.header-homepage').addClass('scrolled-down');
      }

      // Show/hide header menu while scrolling.
      let lastScrollTop = 0;
      $(window).on('scroll', function (event) {
        const position = $(this).scrollTop();
        const bottom = $(window).scrollTop() + $(window).height();

        if (!$(mainNavigation).hasClass('expanded')) {
          if (position > lastScrollTop && bottom !== $(document).height() && $(window).scrollTop() >= 50) {
            $('body .content-header').addClass('header-menu-retracted');
            $('body .main-page-content .section.section__case-study .section-menu__inner').removeClass(
              'header-menu-retracted'
            );
          } else {
            $('body .content-header').removeClass('header-menu-retracted');
            $('body .main-page-content .section.section__case-study .section-menu__inner').addClass(
              'header-menu-retracted'
            );
          }
          lastScrollTop = position;
        }

        // Change background to white if header menu is not at top of the page.
        if (position > 0 || bottom === $(document).height()) {
          $('body .content-header.header-homepage').addClass('scrolled-down');
        } else {
          $('body .content-header.header-homepage').removeClass('scrolled-down');
        }
      });

      // Add modal attributes to the contact us button.
      function addModalAttributes() {
        const modalBtn = '#block-ces-mainnavigationwebsite .contact-us';

        if ($(modalBtn).length && $(modalBtn).hasClass('ces-modal-btn')) {
          $(modalBtn).attr('data-bs-toggle', 'modal');
          $(modalBtn).attr('data-bs-target', '#contactUsOverlay');
        }
      }

      $(document).ready(function () {
        addModalAttributes();
      });
    }
  };
})(Drupal, jQuery);
