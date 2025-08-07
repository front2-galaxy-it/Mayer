import { fadeIn, fadeOut } from '../utils/fade';

export class Tabs {
  constructor(containerSelector) {
    this.container = document.querySelector(containerSelector);
    if (!this.container) return;

    this.buttons = this.container.querySelectorAll('.tab-button');
    this.contents = this.container.querySelectorAll('.tab-content');

    this.init();
  }

  init() {
    this.loadSavedTab();

    this.buttons.forEach((button) => {
      button.addEventListener('click', () => {
        const tabId = button.getAttribute('data-tab');
        this.activateTab(tabId);
      });
    });
  }

  loadSavedTab() {
    const savedTabId = localStorage.getItem('activeTabId');
    if (!savedTabId) return;

    const savedButton = this.container.querySelector(
      `.tab-button[data-tab="${savedTabId}"]`,
    );
    const savedContent = this.container.querySelector(`#${savedTabId}`);

    if (savedButton && savedContent) {
      this.buttons.forEach((btn) => btn.classList.remove('active'));
      this.contents.forEach((content) => content.classList.remove('active'));

      savedButton.classList.add('active');
      savedContent.classList.add('active');
    }
  }

  activateTab(tabId) {
    const activeTab = this.container.querySelector(`#${tabId}`);
    if (!activeTab || activeTab.classList.contains('active')) return;

    localStorage.setItem('activeTabId', tabId);

    const currentContent = [...this.contents].find((content) =>
      content.classList.contains('active'),
    );

    this.buttons.forEach((btn) => btn.classList.remove('active'));
    this.container
      .querySelector(`.tab-button[data-tab="${tabId}"]`)
      .classList.add('active');

    if (currentContent) {
      fadeOut(currentContent, 300, () => {
        currentContent.classList.remove('active');
        activeTab.classList.add('active');
        fadeIn(activeTab, 300);
      });
    }
  }
}
