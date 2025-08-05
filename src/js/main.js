import { Fancybox } from '@fancyapps/ui/dist/fancybox/';
import Swiper from 'swiper';
import { Navigation, Pagination } from 'swiper/modules';
new WOW().init();

setupHeaderScrollListener();

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

window.addEventListener('load', () => {
  initSwiperQualities();
  initSwiperPlan();
});

window.addEventListener('resize', () => {
  initSwiperQualities();
  initSwiperPlan();
});

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
