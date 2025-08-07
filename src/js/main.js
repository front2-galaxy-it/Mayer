import { Fancybox } from '@fancyapps/ui/dist/fancybox/';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
import { fadeIn, fadeOut } from './fade';
import WOW from './wow';

new WOW().init();

setupHeaderScrollListener();
initTabs();

window.addEventListener('load', () => {
  initSwiperQualities();
  initSwiperPlan();
  handleAccordionResize();
});

window.addEventListener('resize', () => {
  initSwiperQualities();
  initSwiperPlan();
  handleAccordionResize();
});

function setupHeaderScrollListener() {
  const wrapper = document.querySelector('.transparent_header');

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

Fancybox.bind("[data-fancybox='gallery']", {
  Thumbs: false,
  Toolbar: {
    display: ['close'],
  },
  Image: {
    zoom: true,
    click: 'toggleZoom',
    wheel: 'zoom',
  },
});

openHeaderMenu();

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

destroyFooterAccordion();

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

function initTabs() {
  const buttons = document.querySelectorAll('.tab-button');
  const contents = document.querySelectorAll('.tab-content');

  const savedTabId = localStorage.getItem('activeTabId');
  if (savedTabId) {
    const savedButton = document.querySelector(
      `.tab-button[data-tab="${savedTabId}"]`,
    );
    const savedContent = document.getElementById(savedTabId);

    if (savedButton && savedContent) {
      buttons.forEach((btn) => btn.classList.remove('active'));
      contents.forEach((content) => content.classList.remove('active'));

      savedButton.classList.add('active');
      savedContent.classList.add('active');
    }
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      const activeTab = document.getElementById(tabId);

      if (activeTab.classList.contains('active')) return;

      localStorage.setItem('activeTabId', tabId);

      buttons.forEach((btn) => btn.classList.remove('active'));
      button.classList.add('active');

      contents.forEach((content) => {
        if (content.classList.contains('active')) {
          fadeOut(content, 300, () => {
            content.classList.remove('active');
            activeTab.classList.add('active');
            fadeIn(activeTab, 300);
          });
        }
      });
    });
  });
}

showHiddenText();

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
