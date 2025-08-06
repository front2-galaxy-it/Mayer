import { Fancybox } from '@fancyapps/ui/dist/fancybox/';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
new WOW().init();

setupHeaderScrollListener();

window.addEventListener('load', () => {
  initSwiperQualities();
  initSwiperPlan();
});

window.addEventListener('resize', () => {
  initSwiperQualities();
  initSwiperPlan();
  handleAccordionResize();
});

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

    // Добавляем ссылку на обработчик, чтобы потом снять
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
