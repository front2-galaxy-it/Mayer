import { slideDown, slideUp } from '../utils/slideIn';

export class Accordion {
  constructor(containerSelector, mode = 'single', animationDuration = 300) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.mode = mode;
    this.duration = animationDuration;
    this.items = this.container.querySelectorAll('.accordion_item');

    this.init();
  }

  init() {
    this.items.forEach((item) => {
      const trigger = item.querySelector('.accordion_trigger');
      const content = item.querySelector('.accordion_content');

      if (!item.classList.contains('active')) {
        content.style.display = 'none';
      }

      if (trigger) {
        trigger.addEventListener('click', () => {
          this.toggleItem(item);
        });
      }
    });
  }

  toggleItem(item) {
    const isActive = item.classList.contains('active');
    const content = item.querySelector('.accordion_content');

    if (this.mode === 'single') {
      this.items.forEach((el) => {
        const elContent = el.querySelector('.accordion_content');
        if (el !== item && el.classList.contains('active')) {
          el.classList.remove('active');
          slideUp(elContent, this.duration);
        }
      });
    }

    if (isActive) {
      item.classList.remove('active');
      slideUp(content, this.duration);
    } else {
      item.classList.add('active');
      slideDown(content, this.duration);
    }
  }
}
