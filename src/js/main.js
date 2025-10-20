import Swiper from 'swiper';
import {
  Navigation,
  Pagination,
  EffectCreative,
  Controller,
  Thumbs,
} from 'swiper/modules';
import WOW from './wow';
import { Tabs } from './components/tabs';
import { Accordion } from './components/accordion';
import { slideDown, slideUp } from './utils/slideIn';
import { initFilters } from './components/filters';

new WOW().init();

new Tabs('.tabs_map');
new Tabs('.tabs_house');

new Accordion('.accordion', 'single');

document.addEventListener('DOMContentLoaded', () => {
  initFilters();
  addFilterListResizeClass();
});

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
  initGenericFilterSelects();
  addFilterListResizeClass();
  openFormPopup();
  initFloorSelect();
  // closeHeaderLabel();
  showCookies();
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
  initGenericFilterSelects();
  addFilterListResizeClass();
  openFormPopup();
  initFloorSelect();
  // closeHeaderLabel();
});

document.addEventListener('filters:ready', () => {
  initCustomRangeSliders();
});

document.querySelectorAll('.gallery-swiper').forEach((galleryEl) => {
  const counterEl = galleryEl.querySelector('.gallery-counter');
  const currentEl = counterEl ? counterEl.querySelector('.current') : null;
  const totalEl = counterEl ? counterEl.querySelector('.total') : null;
  const wrapperEl = galleryEl.querySelector('.swiper-wrapper');

  const swiper = new Swiper(galleryEl, {
    slidesPerView: 'auto',
    modules: [Navigation],
    spaceBetween: 8,
    navigation: {
      nextEl: galleryEl.querySelector('.swiper-button-next'),
      prevEl: galleryEl.querySelector('.swiper-button-prev'),
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

  function updateCounter() {
    if (!counterEl || !currentEl || !totalEl) return;
    const scope = wrapperEl || galleryEl;
    const total = scope.querySelectorAll(
      '.swiper-slide:not(.swiper-slide-duplicate)',
    ).length;
    const currentIndex =
      (typeof swiper.realIndex === 'number'
        ? swiper.realIndex
        : swiper.activeIndex) + 1;
    currentEl.textContent = String(currentIndex);
    totalEl.textContent = String(total);
  }

  swiper.on('afterInit', updateCounter);
  swiper.on('slideChange', updateCounter);
  swiper.on('resize', updateCounter);

  // If Swiper version does not emit afterInit, call once
  setTimeout(updateCounter, 0);

  // Observe dynamic slide changes (add/remove) and keep counter in sync
  if (wrapperEl && !galleryEl._galleryCounterObserver) {
    const observer = new MutationObserver(() => {
      if (typeof swiper.update === 'function') swiper.update();
      updateCounter();
    });
    observer.observe(wrapperEl, { childList: true });
    galleryEl._galleryCounterObserver = observer;
  }
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
});

function closeHeaderLabel() {
  const headerLabel = document.querySelector('.header_label-wrap');
  const headerLabelCloseBtn = document.querySelector('.label-wrap-close-btn');

  const body = document.body;

  const duration = 500;

  if (!headerLabel || !headerLabelCloseBtn) return;

  let visibleLabel = true;

  function updatePadding() {
    if (body.classList.contains('transparent_header')) return;
    if (window.innerWidth <= 480) {
      body.style.paddingTop = visibleLabel ? '90px' : '50px';
    } else {
      body.style.paddingTop = visibleLabel ? '120px' : '80px';
    }
  }

  updatePadding();

  headerLabelCloseBtn.addEventListener('click', () => {
    slideUp(headerLabel, duration);
    visibleLabel = false;
    updatePadding();
  });

  window.addEventListener('resize', updatePadding);
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

function initGenericFilterSelects() {
  const selects = document.querySelectorAll('.filter__select');
  selects.forEach((selectEl) => {
    if (selectEl.dataset.enhanced === '1') return;
    const trigger = selectEl.querySelector('.filter__trigger');
    const optionsWrap = selectEl.querySelector('.filter__options');
    const triggerText = selectEl.querySelector('.filter__trigger-text');
    const duration = 300;
    if (!trigger || !optionsWrap) return;

    trigger.addEventListener('click', () => {
      if (selectEl.classList.contains('open')) {
        selectEl.classList.remove('open');
        slideUp(optionsWrap, duration);
      } else {
        selectEl.classList.add('open');
        slideDown(optionsWrap, duration);
      }
    });

    optionsWrap.querySelectorAll('.filter__option').forEach((opt) => {
      opt.addEventListener('click', () => {
        if (triggerText && opt.textContent) {
          triggerText.textContent = opt.textContent;
        }
        selectEl.classList.remove('open');
        const trg = selectEl.querySelector('.filter__trigger');
        if (trg) trg.classList.add('selected');
        slideUp(optionsWrap, duration);
      });
    });

    document.addEventListener('click', (e) => {
      if (selectEl.classList.contains('open') && !selectEl.contains(e.target)) {
        selectEl.classList.remove('open');
        slideUp(optionsWrap, duration);
      }
    });

    selectEl.dataset.enhanced = '1';
  });
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
  onScroll();
}

function hideHeaderOnScroll(selector, offset = 150) {
  const header = document.querySelector(selector);
  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY && currentScrollY > offset) {
      header.classList.add('hidden');
    } else {
      header.classList.remove('hidden');
    }

    lastScrollY = currentScrollY;
  });
}

hideHeaderOnScroll('#header', 80);

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
      const nowOpen = !isOpen;

      hiddenTexts.forEach((hiddenText) => {
        hiddenText.classList.toggle('show');

        if (isOpen) {
          hiddenText.style.maxHeight = null;
        } else {
          hiddenText.style.maxHeight = hiddenText.scrollHeight + 'px';
        }
      });

      const moreLabel = 'Čitať viac';
      const lessLabel = 'Čitať menej';
      const desired = nowOpen ? lessLabel : moreLabel;
      const statusBox = button.querySelector('.status_box');
      button.textContent = desired;
      if (statusBox) {
        button.prepend(statusBox);
        statusBox.insertAdjacentText('afterend', ' ');
      }
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

function initModalGalleries() {
  const modals = document.querySelectorAll('.gallery-modal');
  const galleries = document.querySelectorAll('.gallery-swiper');

  // Bind a single global Escape handler once
  if (!document.documentElement.dataset.galleryEscapeBound) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const opened = document.querySelector('.gallery-modal:not(.hidden)');
      if (!opened) return;
      opened.classList.add('hidden');
      opened.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lock');
      const opener = opened.__lastOpener || null;
      if (opener && typeof opener.focus === 'function') opener.focus();
    });
    document.documentElement.dataset.galleryEscapeBound = 'true';
  }

  const galleriesByIndex = Array.from(galleries);

  modals.forEach((modal, index) => {
    if (modal.dataset.initialized === 'true') return;
    modal.dataset.initialized = 'true';

    // ARIA defaults
    modal.setAttribute('role', modal.getAttribute('role') || 'dialog');
    modal.setAttribute(
      'aria-modal',
      modal.getAttribute('aria-modal') || 'true',
    );
    modal.setAttribute(
      'aria-hidden',
      modal.classList.contains('hidden') ? 'true' : 'false',
    );

    const galleryId = modal.getAttribute('data-modal-gallery-id');
    const gallery = galleryId
      ? document.querySelector(
          `.gallery-swiper[data-gallery-id="${galleryId}"]`,
        )
      : galleriesByIndex[index];
    if (!gallery) return;

    const modalClose = modal.querySelector('.gallery-modal_close-btn');
    const modalBackdrop = modal.querySelector('.gallery-modal_backdrop');
    const swiperSelector = modal.querySelector('.gallery-modal-swiper');
    if (!swiperSelector) return;
    const modalWrapper = swiperSelector.querySelector('.swiper-wrapper');
    if (!modalWrapper) return;

    // Prepare source slides from linked gallery
    const sourceSlides = gallery.querySelectorAll(
      '.swiper-slide:not(.swiper-slide-duplicate)',
    );

    // If modal wrapper is empty, populate it from the source gallery
    if (modalWrapper.children.length === 0 && sourceSlides.length > 0) {
      const fragment = document.createDocumentFragment();
      sourceSlides.forEach((slide) => {
        const img = slide.querySelector('img');
        const slideEl = document.createElement('div');
        slideEl.className = 'swiper-slide';

        const inner = document.createElement('div');
        inner.className = 'gallery-modal_slide';

        const modalImg = document.createElement('img');
        if (img) {
          modalImg.src = img.currentSrc || img.src;
          modalImg.alt = img.alt || '';
        }

        inner.appendChild(modalImg);
        slideEl.appendChild(inner);
        fragment.appendChild(slideEl);
      });
      modalWrapper.appendChild(fragment);
    }

    const modalSwiper = new Swiper(swiperSelector, {
      slidesPerView: 1,
      centeredSlides: true,
      autoHeight: true,
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

    const gallerySlides = sourceSlides;

    function openAt(targetIndex, openerEl) {
      if (!modal.classList.contains('hidden')) return;
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
      if (typeof modalSwiper.slideToLoop === 'function') {
        modalSwiper.slideToLoop(targetIndex, 0);
      } else {
        modalSwiper.slideTo(targetIndex, 0);
      }
      document.body.classList.add('lock');
      modal.__lastOpener = openerEl || null;
      const focusable = modal.querySelector(
        '[tabindex], button, a, [role="button"]',
      );
      if (focusable && typeof focusable.focus === 'function') focusable.focus();
    }

    function closeModal() {
      if (modal.classList.contains('hidden')) return;
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lock');
      const opener = modal.__lastOpener || null;
      if (opener && typeof opener.focus === 'function') opener.focus();
    }

    gallerySlides.forEach((slide, slideIndex) => {
      slide.setAttribute('tabindex', '0');
      slide.setAttribute('role', 'button');
      slide.addEventListener('click', () => openAt(slideIndex, slide));
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openAt(slideIndex, slide);
        }
      });
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
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

function openFormPopup() {
  const openFormBtn = document.querySelectorAll('.open-form-btn');
  const closeFormBtn = document.querySelector('.form-popup_close-btn');
  const popupForm = document.querySelector('.form-popup');

  if (!popupForm) return;

  openFormBtn.forEach((btn) => {
    btn.addEventListener('click', () => {
      popupForm.classList.add('show');
      document.body.classList.add('lock');
    });
  });

  closeFormBtn.addEventListener('click', () => {
    popupForm.classList.remove('show');
    document.body.classList.remove('lock');
  });
}

function showCookies() {
  const cookiesWrap = document.querySelector('.cookies');
  if (!cookiesWrap) return;

  const cookiesButtons = cookiesWrap.querySelectorAll('.btn');
  const duration = 500;

  setTimeout(() => {
    slideDown(cookiesWrap, duration);
  }, 3000);

  cookiesButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      slideUp(cookiesWrap, duration);
    });
  });
}

function initFloorSelect() {
  const triggers = document.querySelectorAll('.open_floor_select');
  const wraps = Array.from(document.querySelectorAll('.floor_list-wrap'));

  if (!triggers.length || !wraps.length) return;

  function anyOpen() {
    return document.querySelector('.floor_list-wrap.open');
  }

  function setBodyLock() {
    if (anyOpen()) {
      document.body.classList.add('lock');
    } else {
      document.body.classList.remove('lock');
    }
  }

  function closeAll() {
    wraps.forEach((w) => w.classList.remove('open'));
    setBodyLock();
  }

  wraps.forEach((wrap) => {
    if (wrap.dataset.floorListInited === '1') return;
    const overlay = wrap.querySelector('.floor_list-overlay');

    if (overlay) {
      overlay.addEventListener('click', () => {
        wrap.classList.remove('open');
        setBodyLock();
      });
    }

    // Клик вне области
    document.addEventListener('click', (e) => {
      if (!wrap.classList.contains('open')) return;
      const isInsideWrap = wrap.contains(e.target);
      const isTrigger = (e.target.closest && !!e.target.closest('.open_floor_select'));
      if (!isInsideWrap && !isTrigger) {
        wrap.classList.remove('open');
        setBodyLock();
      }
    });

    wrap.dataset.floorListInited = '1';
  });

  // Escape закрывает любой открытый список (однократно навешиваем)
  if (!document.documentElement.dataset.floorListEscapeBound) {
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const opened = document.querySelector('.floor_list-wrap.open');
      if (!opened) return;
      opened.classList.remove('open');
      setBodyLock();
    });
    document.documentElement.dataset.floorListEscapeBound = 'true';
  }

  function resolveTarget(trigger) {
    const selector = trigger.getAttribute('data-floor-target');
    if (selector) {
      try {
        const el = document.querySelector(selector);
        if (el) return el;
      } catch (_) {
        // ignore invalid selector
      }
    }
    const scope = trigger.closest('main') || document;
    const found = scope.querySelector('.floor_list-wrap');
    return found || wraps[0] || null;
  }

  triggers.forEach((trigger) => {
    if (trigger.dataset.floorTriggerInited === '1') return;

    const targetWrap = resolveTarget(trigger);
    if (!targetWrap) return;

    trigger.addEventListener('click', (e) => {
      e.preventDefault();
      // Закрываем другие открытые
      wraps.forEach((w) => {
        if (w !== targetWrap) w.classList.remove('open');
      });
      targetWrap.classList.add('open');
      setBodyLock();
    });

    trigger.dataset.floorTriggerInited = '1';
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const skipLoaderKey = 'skipLoader';
  const navEntries =
    window.performance && performance.getEntriesByType
      ? performance.getEntriesByType('navigation')
      : [];
  const isBackForward =
    navEntries && navEntries[0] && navEntries[0].type === 'back_forward';
  const shouldSkipLoader =
    isBackForward || localStorage.getItem(skipLoaderKey) === '1';
  const mainEl = document.querySelector('main');

  if (mainEl) {
    if (!shouldSkipLoader) {
      mainEl.classList.add('fade-in');
    } else {
      localStorage.removeItem(skipLoaderKey);
      mainEl.classList.remove('fade-in');
    }
  }

  window.addEventListener('pageshow', (event) => {
    if (event.persisted && mainEl) {
      mainEl.classList.remove('fade-in');
    }
  });

  window.addEventListener('popstate', () => {
    localStorage.setItem(skipLoaderKey, '1');
  });

  document.querySelectorAll('a[href]').forEach((link) => {
    link.addEventListener('click', function (e) {
      const hrefAttr = this.getAttribute('href') || '';
      const href = hrefAttr.trim();

      // Ignore modified/middle/right clicks or already prevented
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Block empty and placeholder links
      if (!href || href === '#' || href.toLowerCase() === '#!') {
        e.preventDefault();
        return;
      }

      // Block javascript pseudo-links
      if (/^javascript:/i.test(href)) {
        e.preventDefault();
        return;
      }

      // Allow special schemes without transition
      const specialSchemes = [
        'mailto:',
        'tel:',
        'sms:',
        'callto:',
        'geo:',
        'skype:',
        'viber:',
        'whatsapp:',
        'tg:',
        'fax:',
      ];
      if (specialSchemes.some((s) => href.toLowerCase().startsWith(s))) {
        return;
      }

      // In-page anchors (hash only) — let browser handle, no transition
      if (href.startsWith('#')) {
        return;
      }

      // Respect attributes that imply non-navigation
      if (
        this.target === '_blank' ||
        this.hasAttribute('download') ||
        this.getAttribute('rel') === 'external' ||
        this.getAttribute('data-no-transition') === 'true'
      ) {
        return;
      }

      let url = this.href;
      let toUrl;
      try {
        toUrl = new URL(url);
      } catch (_) {
        // Malformed URL — do nothing
        e.preventDefault();
        return;
      }

      // External origins — no interception
      if (toUrl.origin !== location.origin) {
        return;
      }

      // Hash-only change on same page — skip transition
      if (
        toUrl.pathname === location.pathname &&
        toUrl.search === location.search
      ) {
        return;
      }

      // Navigating to the same full URL — skip
      if (toUrl.href === location.href) {
        e.preventDefault();
        return;
      }

      e.preventDefault();
      if (mainEl) {
        mainEl.classList.remove('fade-in');
        mainEl.classList.add('fade-out');
        document.body.classList.remove('transparent_header');
      }

      setTimeout(() => {
        window.location.href = url;
      }, 500);
    });
  });

  window.addEventListener('beforeunload', () => {
    if (mainEl) {
      mainEl.classList.remove('fade-in');
      mainEl.classList.add('fade-out');
    }
  });
});
