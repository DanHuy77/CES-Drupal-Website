/**
 * @file
 * Slider behaviors.
 */
(function ($) {
  const breakpoints = {
    md: 768,
    lg: 1300
  };

  const slidesToShow = {
    desktopDefault: 4,
    lgDefault: 3,
    lgCaseStudies: 2,
    mdDefault: 1
  };

  const slickList = '.slick-list';
  let defaultCursor = '';

  // --------------- Create custom cursor and handle its events. ---------------

  /**
   * Create custom cursor if screen is larger than 1024px.
   */
  function createCustomCursor() {
    if (window.matchMedia('(min-width: 1025px)').matches) {
      const cursorContainer = $("<div class='cursor-container'></div>");
      const circle = $("<div class='circle'></div>");
      const leftArrow = $("<div class='arrow left-arrow'></div>");
      const rightArrow = $("<div class='arrow right-arrow'></div>");

      cursorContainer.append(circle, leftArrow, rightArrow);
      $(slickList).append(cursorContainer);

      $(slickList).each(function () {
        // Check if testimonial slide and add dark cursor if so.
        if ($(this).find('.slick-track .tes__wrap').length > 0) {
          const darkCursor = $(this).find('.cursor-container');
          darkCursor.find('.circle').addClass('dark');
          darkCursor.find('.arrow').addClass('dark');
        }
      });
    }
  }

  /**
   * Attach mouse event listeners to the slider element.
   */
  function handleMouseEvents() {
    $(slickList).hover(
      function () {
        // Show and expand cursor on mouse enter.
        const itemQuantity = $(this).find('.slick-slide').length;
        if (itemQuantity >= slidesToShow.desktopDefault) {
          const cursorContainer = $(this).find('.cursor-container');
          const cursor = cursorContainer.find('.circle');

          $(cursorContainer).addClass('show');
          setTimeout(function () {
            $(cursor).addClass('expand');
          }, 10);
        }
      },
      function () {
        // Speed up transistion and hide cursor on mouse leave.
        const cursorContainer = $(this).find('.cursor-container');
        const cursor = cursorContainer.find('.circle');

        $(cursor).css('transition', '0.1s');
        $(cursor).removeClass('expand');

        setTimeout(function () {
          $(cursorContainer).removeClass('show');
          $(cursor).removeAttr('style');
        }, 100);
      }
    );

    // Set slick list as offset and move custom cursor when mouse move on slider inner.
    $('.block-slider__inner').on('mousemove', function (e) {
      const offset = $(this).find(slickList).offset();
      $(this)
        .find('.cursor-container')
        .css({
          left: e.pageX - offset.left,
          top: e.pageY - offset.top
        });
    });

    // Get default cursor and change it to grabbing on mouse down.
    $(slickList).on('mousedown', function () {
      defaultCursor = window.getComputedStyle($(this)[0]).cursor;
      const cursorContainer = $(this).find('.cursor-container');
      const cursor = cursorContainer.find('.circle');
      $(cursor).addClass('clicked');
      $(this).css('cursor', 'grabbing');
    });

    // Reset cursor and remove class 'clicked' on mouse up.
    $(slickList).on('mouseup', function () {
      const cursorContainer = $(this).find('.cursor-container');
      const cursor = cursorContainer.find('.circle');
      $(cursor).removeClass('clicked');
      $(this).css('cursor', defaultCursor);
    });
  }

  // --------------- Create slide bar and handle its events. ---------------

  /**
   * Set the width of the slidebar based on the number of slides and dots.
   *
   * @param {number} index - The index of the slidebar.
   * @return {void} This function does not return anything.
   */
  function setSlidebarWidth(index) {
    const slidebarMaxWidth = $(`#slidebar-${index}`).width();
    const totalPages = $(`#dots-${index}`).children().length;
    const slidebarWidth = slidebarMaxWidth / totalPages;
    const slidebarWidthPercent = (slidebarWidth / slidebarMaxWidth) * 100;
    $(`#slidebar-${index} span`).css({
      width: slidebarWidthPercent + '%'
    });

    // Hide case studies slidebar when not having enough item to slide.
    $(`.case-studies#slidebar-${index}`).toggle(slidebarWidthPercent !== 100);
  }

  /**
   * Move the slidebar to a specific position based on the current dot and the number of slides to show.
   *
   * @param {jQuery} element - The slidebar element to move.
   * @param {number} currentDot - The current dot index.
   * @param {number} slideToShow - The number of slides to show.
   * @return {void} This function does not return anything.
   */
  function moveSlidebar(element, currentDot, slideToShow) {
    const slidebarWidth = element.width();
    element.css({
      // currentDot devided by slideToShow because slick returns them equal.
      transform: `translate(${(currentDot / slideToShow) * slidebarWidth + 'px'}, 0px)`
    });
  }

  /**
   * Set slide to show based on screen width and slide type.
   *
   * @param {number} screenWidth - The width of the screen.
   * @param {jQuery element} element - The element to determine the slide type.
   * @return {number} The number of slides to show based on the screen width and element type.
   */
  function getSlideToShow(screenWidth, element) {
    const isImages = element.hasClass('images');
    const isCaseStudies = element.hasClass('case-studies');
    const isTestimonial = element.hasClass('testimonial');

    if (screenWidth < breakpoints.md) {
      return slidesToShow.mdDefault;
    }

    if (screenWidth < breakpoints.lg) {
      if (isTestimonial) {
        return slidesToShow.mdDefault;
      }

      if (isCaseStudies) {
        return slidesToShow.lgCaseStudies;
      }

      return slidesToShow.lgDefault;
    }

    if (isImages) {
      return slidesToShow.desktopDefault;
    }

    if (isCaseStudies) {
      return slidesToShow.lgDefault;
    }

    return slidesToShow.mdDefault;
  }

  /**
   * Create the slidebar for each slide box.
   */
  function createSlidebar() {
    $('.slide-box').each(function (index) {
      $(this).attr('id', `slide-box-${index}`);

      const imageLinks = $(this).find('a');
      imageLinks.each(function () {
        // Check if images has data-fancybox attribute.
        const attr = $(this).attr('data-fancybox');
        if (typeof attr !== 'undefined' && attr !== false) {
          // Modify attribute value to group images by index.
          // Show them together when images clicked.
          $(this).attr('data-fancybox', 'gallery-' + index);
        }
      });

      // Reset slidebar width on slick breakpoint.
      $(this).on('breakpoint', function (event, slick, currentSlide, breakpoint) {
        const slickDots = $(this).find('.slick-dots');
        slickDots.attr('id', `dots-${index}`);
        setSlidebarWidth(index);
      });
    });

    // Set id for slick dots to get their length easily in function setSlidebarWidth.
    $('.slick-dots').each(function (index) {
      $(this).attr('id', `dots-${index}`);
    });

    $('.block-slider__slidebar').each(function (index) {
      $(this).attr('id', `slidebar-${index}`);
      setSlidebarWidth(index);
    });

    // Handle resize event for responsive.
    window.addEventListener('resize', function () {
      $('.block-slider__slidebar').each(function (index) {
        // On window resize, move slidebar along with slide width.
        const slideBar = $(`#slidebar-${index}`);
        const screenWidth = $(window).width();
        const slideToShow = getSlideToShow(screenWidth, $(slideBar));
        const currentDot = $(`#slide-box-${index}`).slick('slickCurrentSlide');
        moveSlidebar(slideBar.find('span'), currentDot, slideToShow);
      });
    });
  }

  // --------------- Add events handlers for slide. ---------------

  // Move slidebar on slide before change based on slick next slide.
  $('.slide-box').on('beforeChange', function (event, slick, currentSlide, nextSlide) {
    const screenWidth = $(window).width();
    const currentDot = nextSlide;
    const slideBar = $(this).closest('.block-slider__content').next('.block-slider__slidebar');
    const slideToShow = getSlideToShow(screenWidth, $(slideBar));
    moveSlidebar($(slideBar).find('span'), currentDot, slideToShow);
  });

  // Handle wheel event for touchpad horizontal sliding.
  $('.slide-box').on('wheel', function (event) {
    const deltaX = event.originalEvent.deltaX;
    if (deltaX > 0) {
      $(this).slick('slickNext');
    } else if (deltaX < 0) {
      $(this).slick('slickPrev');
    }
  });

  // eslint-disable-next-line
  Fancybox.bind('[data-fancybox]', {
    Images: {
      animated: true
    }
  });

  /**
   * Create containers using the Slick carousel plugin for different elements.
   */
  function createContainer() {
    $('.images-container').slick({
      slidesToShow: slidesToShow.desktopDefault,
      slidesToScroll: slidesToShow.desktopDefault,
      arrows: false,
      infinite: false,
      dots: true,
      responsive: [
        {
          breakpoint: breakpoints.lg,
          settings: {
            slidesToShow: slidesToShow.lgDefault,
            slidesToScroll: slidesToShow.lgDefault
          }
        },
        {
          breakpoint: breakpoints.md,
          settings: {
            centerMode: true,
            slidesToShow: slidesToShow.mdDefault,
            slidesToScroll: slidesToShow.mdDefault
          }
        }
      ]
    });

    $('.tes__container').slick({
      slidesToShow: slidesToShow.mdDefault,
      slidesToScroll: slidesToShow.mdDefault,
      arrows: false,
      infinite: false,
      dots: true
    });

    $('.case-studies__container').slick({
      slidesToShow: slidesToShow.lgDefault,
      slidesToScroll: slidesToShow.lgDefault,
      arrows: false,
      infinite: false,
      dots: true,
      variableWidth: true,
      responsive: [
        {
          breakpoint: breakpoints.lg,
          settings: {
            slidesToShow: slidesToShow.lgCaseStudies,
            slidesToScroll: slidesToShow.lgCaseStudies,
            variableWidth: true
          }
        },
        {
          breakpoint: breakpoints.md,
          settings: {
            slidesToShow: slidesToShow.mdDefault,
            slidesToScroll: slidesToShow.mdDefault,
            variableWidth: false
          }
        }
      ]
    });
  }

  if ($('.block-slider__outer').length) {
    createContainer();
    createSlidebar();
    createCustomCursor();
    handleMouseEvents();
  }
})(jQuery);
