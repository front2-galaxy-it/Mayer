import { slideDown, slideUp } from '../utils/slideIn';

export class Accordion {
  constructor(containerSelector, mode = 'single', animationDuration = 300) {
    this.containers = Array.from(document.querySelectorAll(containerSelector));
    if (!this.containers.length) return;

    this.mode = mode;
    this.duration = animationDuration;

    this.init();
  }

  init() {
    this.containers.forEach((container) => {
      const items = Array.from(container.querySelectorAll('.accordion_item'));
      items.forEach((item) => {
        const trigger = item.querySelector('.accordion_trigger');
        const content = item.querySelector('.accordion_content');

        if (content && !item.classList.contains('active')) {
          content.style.display = 'none';
        }

        if (trigger && content) {
          trigger.addEventListener('click', () => this.toggleItem(item, container));
        }
      });
    });
  }

  toggleItem(item, container) {
    const isActive = item.classList.contains('active');
    const content = item.querySelector('.accordion_content');
    if (!content) return;

    if (this.mode === 'single') {
      const activeItems = Array.from(container.querySelectorAll('.accordion_item.active'));
      activeItems.forEach((el) => {
        if (el !== item) {
          const elContent = el.querySelector('.accordion_content');
          el.classList.remove('active');
          if (elContent) slideUp(elContent, this.duration);
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
