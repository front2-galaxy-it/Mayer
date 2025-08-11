import Swiper from 'swiper';
import { Navigation, Pagination, EffectCube, Controller } from 'swiper/modules';
import WOW from './wow';
import { Tabs } from './components/tabs';
import { Accordion } from './components/accordion';
import { slideDown, slideUp } from './utils/slideIn';

new WOW().init();

new Tabs('.tabs_map');
new Tabs('.tabs_house');

new Accordion('#low', 'single');

window.addEventListener('load', () => {
  setupHeaderScrollListener();
  initSwiperQualities();
  initSwiperPlan();
  handleAccordionResize();
  setScrollCenter();
  initCustomScrollbar();
  openHeaderMenu();
  showHiddenText();
  initModalGalleries();
  initCustomSelects();
  initCustomRangeSliders();
  addFilterListResizeClass();
  initfloorSliders();
});

window.addEventListener('resize', () => {
  setupHeaderScrollListener();
  initSwiperQualities();
  initSwiperPlan();
  handleAccordionResize();
  setScrollCenter();
  initCustomScrollbar();
  openHeaderMenu();
  showHiddenText();
  initModalGalleries();
  initCustomSelects();
  initCustomRangeSliders();
  addFilterListResizeClass();
  initfloorSliders();
});

new Swiper('.gallery-swiper', {
  slidesPerView: 'auto',
  modules: [Navigation, Pagination],
  spaceBetween: 8,
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  pagination: {
    el: '.swiper-pagination',
    type: 'fraction',
    renderFraction: function (currentClass, totalClass) {
      return (
        '<span class="' +
        currentClass +
        '"></span> — <span class="' +
        totalClass +
        '"></span>'
      );
    },
  },
  breakpoints: {
    320: {
      slidesPerView: 1.2,
    },
    640: {
      slidesPerView: 1.8,
    },
    980: {
      slidesPerView: 2.1,
    },
    1200: {
      slidesPerView: 'auto',
    },
  },
});

new Swiper('.text-section-swiper', {
  slidesPerView: 'auto',
  breakpoints: {
    320: {
      spaceBetween: 16,
    },
    1024: {
      spaceBetween: 24,
    },
  },
});

new Swiper('.blog-swiper', {
  slidesPerView: 'auto',
  spaceBetween: 24,
  modules: [Navigation],
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
});

new Swiper('.mob-menu_swiper', {
  slidesPerView: 'auto',
});

new Swiper('.house-swiper', {
  slidesPerView: 'auto',
  centeredSlides: true,
  breakpoints: {
    320: {
      initialSlide: 0,
      centeredSlides: false,
    },
    1024: {
      initialSlide: 3,
      centeredSlides: true,
    },
  },
});

let floorSwiper;

function initfloorSliders() {
  const prevBtn = document.querySelector('.floor_count-btn.prev');
  const nextBtn = document.querySelector('.floor_count-btn.next');
  const currentEl = document.querySelector('.floor-current');
  const totalEl = document.querySelector('.floor-total');

  if (!prevBtn || !nextBtn || !currentEl || !totalEl) return;

  const floorSwiper = new Swiper('.floor-swiper', {
    slidesPerView: 1,
    centeredSlides: true,
    modules: [Navigation, EffectCube, Controller],
    effect: 'cube',
    cubeEffect: { shadow: false, slideShadows: false },
    direction: 'vertical',
    allowTouchMove: false,
  });

  const floorTitleSwiper = new Swiper('.floor-title-swiper', {
    slidesPerView: 1,
    centeredSlides: true,
    modules: [Navigation, EffectCube, Controller],
    effect: 'cube',
    cubeEffect: { shadow: false, slideShadows: false },
    direction: 'vertical',
    allowTouchMove: false,
  });

  floorSwiper.controller.control = floorTitleSwiper;
  floorTitleSwiper.controller.control = floorSwiper;

  function updatePagination() {
    const currentIndex = floorSwiper.realIndex + 1;
    const total = floorSwiper.slides.length;

    currentEl.textContent = currentIndex;
    totalEl.textContent = total;

    prevBtn.disabled = currentIndex <= 1;
    nextBtn.disabled = currentIndex >= total;

    prevBtn.classList.toggle('disabled', prevBtn.disabled);
    nextBtn.classList.toggle('disabled', nextBtn.disabled);
  }

  updatePagination();

  floorSwiper.on('slideChange', updatePagination);

  prevBtn.addEventListener('click', () => {
    floorSwiper.slidePrev();
  });

  nextBtn.addEventListener('click', () => {
    floorSwiper.slideNext();
  });
}

let swiperQualities = null;
let swiperPlan = null;

function initSwiperQualities() {
  if (window.innerWidth <= 768 && !swiperQualities) {
    swiperQualities = new Swiper('.qualities-swiper', {
      slidesPerView: 1.25,
      modules: [Pagination],
      spaceBetween: 64,
      pagination: {
        el: '.swiper-pagination',
        type: 'fraction',
        renderFraction: function (currentClass, totalClass) {
          return (
            '<span class="' +
            currentClass +
            '"></span> — <span class="' +
            totalClass +
            '"></span>'
          );
        },
      },
    });
  } else if (window.innerWidth > 768 && swiperQualities) {
    swiperQualities.destroy(true, true);
    swiperQualities = null;
  }
}

function initSwiperPlan() {
  if (window.innerWidth >= 768 && !swiperPlan) {
    swiperPlan = new Swiper('.plan-swiper', {
      slidesPerView: 3.1,
      modules: [Navigation],
      spaceBetween: 32,
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
    });
  } else if (window.innerWidth < 768 && swiperPlan) {
    swiperPlan.destroy(true, true);
    swiperPlan = null;
  }
}

function setupHeaderScrollListener() {
  const header = document.getElementById('header');
  if (!header) return;

  const onScroll = () => {
    if (window.scrollY > 0) {
      header.classList.add('active');
    } else {
      header.classList.remove('active');
    }
  };

  window.addEventListener('scroll', onScroll);
}

function openHeaderMenu() {
  const header = document.getElementById('header');
  if (!header) return;

  const menu = document.querySelector('.header_mob-menu');
  const viberLink = document.querySelector('.viber-link');
  const menuButton = document.querySelector('.menu_btn');

  if (!menuButton) return;

  const openText = menuButton.getAttribute('data-open');
  const closeText = menuButton.getAttribute('data-close');

  menuButton.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    header.classList.toggle('active');
    viberLink?.classList.toggle('hide');
    document.body.classList.toggle('lock', isOpen);
    menuButton.textContent = isOpen ? closeText : openText;
  });
}

let footerAccordionInitialized = false;

function initFooterAccordion() {
  if (footerAccordionInitialized) return;
  footerAccordionInitialized = true;

  const items = document.querySelectorAll('.dropdown');

  items.forEach((item) => {
    const button = item.querySelector('.dropdown_title_wrap');

    const handler = () => {
      const isActive = item.classList.contains('active');

      items.forEach((i) => {
        i.classList.remove('active');
        i.querySelector('.dropdown_content').style.maxHeight = null;
      });

      if (!isActive) {
        item.classList.add('active');
        item.querySelector('.dropdown_content').style.maxHeight =
          item.querySelector('.dropdown_content').scrollHeight + 'px';
      }
    };

    button._accordionHandler = handler;
    button.addEventListener('click', handler);
  });
}

function destroyFooterAccordion() {
  if (!footerAccordionInitialized) return;
  footerAccordionInitialized = false;

  const items = document.querySelectorAll('.dropdown');

  items.forEach((item) => {
    const button = item.querySelector('.dropdown_title_wrap');
    const content = item.querySelector('.dropdown_content');

    if (button._accordionHandler) {
      button.removeEventListener('click', button._accordionHandler);
      delete button._accordionHandler;
    }

    item.classList.remove('active');
    content.style.maxHeight = null;
  });
}

function handleAccordionResize() {
  if (window.innerWidth < 768) {
    initFooterAccordion();
  } else {
    destroyFooterAccordion();
  }
}

function showHiddenText() {
  const sections = document.querySelectorAll('.text-section');

  sections.forEach((section) => {
    const button = section.querySelector('.show_more_btn');
    const hiddenTexts = section.querySelectorAll('.hidden_text');

    if (!button) return;

    button.addEventListener('click', () => {
      const isOpen = button.classList.contains('active');
      button.classList.toggle('active');

      hiddenTexts.forEach((hiddenText) => {
        hiddenText.classList.toggle('show');

        if (isOpen) {
          hiddenText.style.maxHeight = null;
        } else {
          hiddenText.style.maxHeight = hiddenText.scrollHeight + 'px';
        }
      });
    });
  });
}

function setScrollCenter() {
  const scrollContainers = document.querySelectorAll('.scroll_wrapper');
  const scrollImages = document.querySelectorAll('.scrollable_item');

  if (!scrollContainers.length || !scrollImages.length) return;

  scrollContainers.forEach((container, index) => {
    const image = scrollImages[index];
    if (!image) return;

    const scrollTo = (image.offsetWidth - container.clientWidth) / 2;
    container.scrollLeft = scrollTo;
  });
}

function initCustomScrollbar() {
  const customScrollbar = document.querySelector('.custom-scrollbar');
  const customThumb = document.querySelector('.custom-thumb');
  let scrollContainer = null;

  if (!customScrollbar || !customThumb) return;

  function getActiveScrollContainer() {
    const activeTab = document.querySelector(
      '.tab-content.scroll_wrapper.active',
    );
    if (activeTab) return activeTab;

    const activeSlide = document.querySelector(
      '.floor-swiper .swiper-slide-active .scroll_wrapper',
    );
    if (activeSlide) return activeSlide;

    return document.querySelector('.scroll_wrapper');
  }

  function updateThumb() {
    if (!scrollContainer) {
      customScrollbar.style.display = 'none';
      return;
    }

    const scrollbarWidth = customScrollbar.offsetWidth;
    const scrollWidth = scrollContainer.scrollWidth;
    const visibleWidth = scrollContainer.clientWidth;

    if (scrollWidth <= visibleWidth) {
      customScrollbar.style.display = 'none';
      return;
    } else {
      customScrollbar.style.display = 'block';
    }

    const thumbWidth = Math.max(
      (visibleWidth / scrollWidth) * scrollbarWidth,
      20,
    );
    customThumb.style.width = `${thumbWidth}px`;

    const scrollLeft = scrollContainer.scrollLeft;
    const maxScroll = scrollWidth - visibleWidth;
    const maxThumbMove = scrollbarWidth - thumbWidth;

    const thumbLeft = (scrollLeft / maxScroll) * maxThumbMove;
    customThumb.style.left = `${thumbLeft}px`;
  }

  function attachScrollListener() {
    document.querySelectorAll('.scroll_wrapper').forEach((el) => {
      el.removeEventListener('scroll', updateThumb);
    });

    scrollContainer = getActiveScrollContainer();
    if (scrollContainer) {
      scrollContainer.addEventListener('scroll', updateThumb);
      updateThumb();
    }
  }

  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        attachScrollListener();
      }, 500);
    });
  });

  if (window.floorSwiper) {
    floorSwiper.on('slideChange', attachScrollListener);
  }

  window.addEventListener('resize', updateThumb);

  attachScrollListener();
}

// function initCustomScrollbar() {
//   const customScrollbar = document.querySelector('.custom-scrollbar');
//   const customThumb = document.querySelector('.custom-thumb');

//   if (!customScrollbar || !customThumb) return;

//   let scrollContainer = getActiveScrollContainer();
//   if (!scrollContainer) {
//     customScrollbar.style.display = 'none';
//     return;
//   }

//   const updateThumb = () => {
//     scrollContainer = getActiveScrollContainer();
//     if (!scrollContainer) {
//       customScrollbar.style.display = 'none';
//       return;
//     }

//     const scrollbarWidth = customScrollbar.offsetWidth;
//     const scrollWidth = scrollContainer.scrollWidth;
//     const visibleWidth = scrollContainer.clientWidth;

//     if (scrollWidth <= visibleWidth) {
//       customScrollbar.style.display = 'none';
//       return;
//     } else {
//       customScrollbar.style.display = 'block';
//     }

//     const thumbWidth = Math.max(
//       (visibleWidth / scrollWidth) * scrollbarWidth,
//       20,
//     );
//     customThumb.style.width = `${thumbWidth}px`;

//     const scrollLeft = scrollContainer.scrollLeft;
//     const maxScroll = scrollWidth - visibleWidth;
//     const maxThumbMove = scrollbarWidth - thumbWidth;

//     const thumbLeft = (scrollLeft / maxScroll) * maxThumbMove;
//     customThumb.style.left = `${thumbLeft}px`;
//   };

//   const observeScroll = () => {
//     document.querySelectorAll('.scroll_wrapper').forEach((el) => {
//       el.removeEventListener('scroll', updateThumb);
//     });

//     scrollContainer = getActiveScrollContainer();
//     if (scrollContainer) {
//       scrollContainer.addEventListener('scroll', updateThumb);
//     }
//   };

//   const tabButtons = document.querySelectorAll('.tab-button');
//   if (tabButtons.length) {
//     tabButtons.forEach((btn) => {
//       btn.addEventListener('click', () => {
//         const tabId = btn.getAttribute('data-tab');
//         const newActive = document.getElementById(tabId);

//         document
//           .querySelectorAll('.tab-button')
//           .forEach((b) => b.classList.remove('active'));
//         document
//           .querySelectorAll('.tab-content')
//           .forEach((c) => c.classList.remove('active'));

//         btn.classList.add('active');
//         newActive.classList.add('active');

//         setTimeout(() => {
//           setScrollCenter();
//           observeScroll();
//           updateThumb();
//         }, 500);
//       });
//     });
//   }

//   observeScroll();
//   updateThumb();
//   window.addEventListener('resize', updateThumb);

//   function getActiveScrollContainer() {
//     const active = document.querySelector('.tab-content.scroll_wrapper.active');
//     return active || document.querySelector('.scroll_wrapper');
//   }
// }

function initModalGalleries() {
  const modals = document.querySelectorAll('.gallery-modal');
  const galleries = document.querySelectorAll('.gallery-swiper');

  modals.forEach((modal, index) => {
    const gallery = galleries[index];
    if (!gallery) return;

    const modalClose = modal.querySelector('.gallery-modal_close-btn');
    const modalBackdrop = modal.querySelector('.gallery-modal_backdrop');
    const swiperSelector = modal.querySelector('.gallery-modal-swiper');
    if (!swiperSelector) return;

    const modalSwiper = new Swiper(swiperSelector, {
      slidesPerView: 1,
      centeredSlides: true,
      modules: [Navigation, Pagination],
      navigation: {
        nextEl: modal.querySelector('.swiper-button-next'),
        prevEl: modal.querySelector('.swiper-button-prev'),
      },
      pagination: {
        el: modal.querySelector('.swiper-pagination'),
        clickable: true,
      },
    });

    const gallerySlides = gallery.querySelectorAll(
      '.swiper-slide:not(.swiper-slide-duplicate)',
    );

    gallerySlides.forEach((slide, slideIndex) => {
      slide.addEventListener('click', () => {
        if (!modal.classList.contains('hidden')) return;

        modal.classList.remove('hidden');
        modalSwiper.slideTo(slideIndex);
        document.body.classList.add('lock');
      });
    });

    function closeModal() {
      modal.classList.add('hidden');
      document.body.classList.remove('lock');
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
        closeModal();
      }
    });
  });
}

function initCustomSelects() {
  const selects = document.querySelectorAll('.filter__select');
  const duration = 300;

  selects.forEach((customSelect) => {
    const trigger = customSelect.querySelector('.filter__trigger');
    const triggerText = customSelect.querySelector('.filter__trigger span');
    const options = customSelect.querySelectorAll('.filter__option');
    const content = customSelect.querySelector('.filter__options');

    if (!trigger || !options.length || !content) return;

    trigger.addEventListener('click', () => {
      const isOpen = customSelect.classList.contains('open');

      if (isOpen) {
        customSelect.classList.remove('open');
        slideUp(content, duration);
      } else {
        customSelect.classList.add('open');
        slideDown(content, duration);
      }
    });

    options.forEach((option) => {
      option.addEventListener('click', () => {
        triggerText.textContent = option.textContent;
        trigger.classList.add('selected');
        customSelect.classList.remove('open');
        slideUp(content, duration);
      });
    });

    document.addEventListener('click', (e) => {
      const isOpen = customSelect.classList.contains('open');

      if (isOpen && !customSelect.contains(e.target)) {
        customSelect.classList.remove('open');
        slideUp(content, duration);
      }
    });
  });
}

function initCustomRangeSliders() {
  const sliders = document.querySelectorAll('.filter__range-inner');

  sliders.forEach((slider) => {
    const minInput = slider.querySelector('.range-slider__input--min');
    const maxInput = slider.querySelector('.range-slider__input--max');
    const rangeTrack = slider.querySelector('.range-slider__range');
    const minLabel = slider.querySelector('[data-range="min"]');
    const maxLabel = slider.querySelector('[data-range="max"]');

    if (!minInput || !maxInput || !rangeTrack || !minLabel || !maxLabel) return;

    const minLimit = parseInt(minInput.min);
    const maxLimit = parseInt(maxInput.max);
    const minGap = 32;

    function formatValue(val) {
      return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    }

    function updateRange() {
      const minVal = parseInt(minInput.value);
      const maxVal = parseInt(maxInput.value);

      const percentMin = ((minVal - minLimit) / (maxLimit - minLimit)) * 100;
      const percentMax = ((maxVal - minLimit) / (maxLimit - minLimit)) * 100;

      rangeTrack.style.left = percentMin + '%';
      rangeTrack.style.width = percentMax - percentMin + '%';

      minLabel.textContent = formatValue(minVal);
      maxLabel.textContent = formatValue(maxVal);
    }

    minInput.addEventListener('input', () => {
      let minVal = parseInt(minInput.value);
      const maxVal = parseInt(maxInput.value);

      if (minVal > maxVal - minGap) {
        minInput.value = maxVal - minGap;
      }
      updateRange();
    });

    maxInput.addEventListener('input', () => {
      const minVal = parseInt(minInput.value);
      let maxVal = parseInt(maxInput.value);

      if (maxVal < minVal + minGap) {
        maxInput.value = minVal + minGap;
      }
      updateRange();
    });

    updateRange();
  });
}

function addFilterListResizeClass() {
  const filterLists = document.querySelectorAll('.filter__list');

  filterLists.forEach((list) => {
    const filterHead = list.querySelector('.filter__list-heading');
    const filterBody = list.querySelectorAll('.filter__list-row');
    const parentWidth = list.parentElement.clientWidth;
    const contentWidth = list.scrollWidth;

    if (contentWidth > parentWidth) {
      filterHead.classList.add('compress');
      filterBody.forEach((body) => {
        body.classList.add('compress');
      });
    } else {
      filterHead.classList.remove('compress');
      filterBody.forEach((body) => {
        body.classList.remove('compress');
      });
    }
  });
}
