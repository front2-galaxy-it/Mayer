/**
 * SVG Tooltips Component
 * Управляет показом тултипов для элементов SVG карты
 */

export default class SvgTooltips {
  constructor(config = {}) {
    this.tooltip = null;
    this.currentElement = null;
    this.hideTimeout = null;
    this.tooltipData = {};

    // Конфигурация
    this.config = {
      tooltipSelector: '.tooltip', // Значение по умолчанию
      ...config, // Остальные настройки должны быть переданы при создании экземпляра
    };

    // Проверяем, является ли устройство сенсорным
    this.isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Если это сенсорное устройство, не инициализируем тултипы
    if (this.isTouchDevice) {
      return;
    }

    this.loadTooltipData();
  }

  async loadTooltipData() {
    // Проверяем, что путь к файлу указан
    if (!this.config.dataFile) {
      console.error('dataFile is required in config');
      this.init();
      return;
    }

    // Сначала пробуем загрузить данные из JSON файла
    try {
      const response = await fetch(this.config.dataFile, {
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();

      // Проверяем, что ответ действительно JSON, а не HTML
      if (
        text.trim().startsWith('<!doctype') ||
        text.trim().startsWith('<html')
      ) {
        throw new Error('Received HTML instead of JSON');
      }

      this.tooltipData = JSON.parse(text);

      // Инициализируем тултипы только после загрузки данных
      this.init();
    } catch (error) {
      console.error('Error loading tooltip data:', error);
      console.log('Falling back to embedded data...');

      this.init();
    }
  }

  init() {
    // Если это сенсорное устройство, не инициализируем тултипы
    if (this.isTouchDevice) {
      return;
    }

    this.createTooltip();
    this.bindEvents();
    this.bindWindowEvents();
  }

  createTooltip() {
    // Создаем тултип если его еще нет
    if (!document.querySelector(this.config.tooltipSelector)) {
      this.tooltip = document.createElement('div');
      this.tooltip.className = 'tooltip';
      this.tooltip.style.display = 'none';

      this.tooltip.innerHTML = `
                <span class="tooltip_text element_name"></span>
                <div class="divider"></div>
                <div class="tooltip_close status">
                    <span class="status-text"></span>
                    <span class="count-text"></span>
                </div>
            `;

      // Добавляем тултип в body для правильного позиционирования
      document.body.appendChild(this.tooltip);
    } else {
      this.tooltip = document.querySelector(this.config.tooltipSelector);
    }
  }

  bindEvents() {
    // Проверяем, что селекторы указаны
    if (!this.config.svgSelector || !this.config.pathSelector) {
      console.error('svgSelector and pathSelector are required in config');
      return;
    }

    const svg = document.querySelector(this.config.svgSelector);
    if (!svg) {
      console.error(`SVG element not found with selector: ${this.config.svgSelector}`);
      return;
    }

    // Находим все пути элементов
    const elementPaths = svg.querySelectorAll(this.config.pathSelector);

    elementPaths.forEach((path, index) => {
      path.addEventListener('mouseenter', (e) => this.showTooltip(e));
      path.addEventListener('mousemove', (e) => this.updateTooltipPosition(e));
      path.addEventListener('mouseleave', (e) => this.hideTooltip(e));
    });
  }

  bindWindowEvents() {
    // Скрываем тултип при изменении размера окна
    window.addEventListener('resize', () => {
      if (this.tooltip && this.tooltip.style.display !== 'none') {
        // Отменяем любое запланированное скрытие
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.hideTooltip();
      }
    });

    // Скрываем тултип при скролле
    window.addEventListener('scroll', () => {
      if (this.tooltip && this.tooltip.style.display !== 'none') {
        // Отменяем любое запланированное скрытие
        if (this.hideTimeout) {
          clearTimeout(this.hideTimeout);
          this.hideTimeout = null;
        }
        this.hideTooltip();
      }
    });
  }

  showTooltip(event) {
    // Если это сенсорное устройство, не показываем тултип
    if (this.isTouchDevice) {
      return;
    }

    const path = event.target;

    // Отменяем скрытие тултипа, если оно было запланировано
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }

    // Не показываем тултип для отключенных элементов
    if (path.classList.contains('disabled')) {
      return;
    }

    const elementClass = this.getElementClass(path);

    if (!elementClass || !this.tooltipData[elementClass]) {
      return;
    }

    const elementInfo = this.tooltipData[elementClass];
    this.currentElement = elementClass;

    // Обновляем содержимое тултипа
    this.tooltip.querySelector('.element_name').textContent = elementInfo.name;
    this.tooltip.querySelector('.status-text').textContent = elementInfo.status;
    this.tooltip.querySelector('.count-text').textContent = elementInfo.count;

    // Показываем тултип с анимацией
    this.tooltip.style.display = 'block';
    this.updateTooltipPosition(event);

    // Добавляем класс для анимации
    requestAnimationFrame(() => {
      this.tooltip.classList.add('show');
    });
  }

  updateTooltipPosition(event) {
    if (!this.tooltip || this.tooltip.style.display === 'none') return;

    // Позиционируем тултип относительно курсора в окне браузера
    const x = event.clientX + 10; // 10px справа от курсора
    const y = event.clientY - 10; // 10px выше курсора

    // Проверяем, не выходит ли тултип за границы экрана
    const tooltipWidth = this.tooltip.offsetWidth || 280;
    const tooltipHeight = this.tooltip.offsetHeight || 100;

    let finalX = x;
    let finalY = y;

    // Если тултип выходит за правую границу экрана
    if (x + tooltipWidth > window.innerWidth) {
      finalX = event.clientX - tooltipWidth - 10; // показываем слева от курсора
    }

    // Если тултип выходит за нижнюю границу экрана
    if (y + tooltipHeight > window.innerHeight) {
      finalY = event.clientY - tooltipHeight - 10; // показываем выше курсора
    }

    // Если тултип выходит за верхнюю границу экрана
    if (finalY < 0) {
      finalY = event.clientY + 20; // показываем ниже курсора
    }

    // Если тултип выходит за левую границу экрана
    if (finalX < 0) {
      finalX = 10; // минимальный отступ от левого края
    }

    this.tooltip.style.left = `${finalX}px`;
    this.tooltip.style.top = `${finalY}px`;
  }

  hideTooltip(event) {
    // Если это сенсорное устройство, не скрываем тултип
    if (this.isTouchDevice) {
      return;
    }

    if (!this.tooltip) return;
    this.tooltip.style.display = 'none';
    this.currentElement = null;
  }

  getElementClass(path) {
    // Получаем класс элемента из атрибута class
    const classList = path.className.baseVal || path.className;
    const classes = classList.split(' ');

    // Ищем класс, который содержит информацию об элементе
    for (const className of classes) {
      if (this.tooltipData[className]) {
        return className;
      }
    }

    return null;
  }

  // Метод для обновления данных элемента
  updateElementData(elementClass, newData) {
    if (this.tooltipData[elementClass]) {
      this.tooltipData[elementClass] = {
        ...this.tooltipData[elementClass],
        ...newData,
      };
    }
  }

  // Метод для добавления нового элемента
  addElementData(elementClass, data) {
    this.tooltipData[elementClass] = data;
  }
}
