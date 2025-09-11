import { slideDown, slideUp } from '../utils/slideIn';

export function initFilters() {
  fetch('/data/data.json')
    .then((res) => res.json())
    .then((data) => {
      renderFilters(data);
    })
    .catch((err) => console.error('Ошибка загрузки data.json:', err));
}

export function renderFilters(data) {
  // ====================== PRECALC MAX VALUES ======================
  const maxPlocha = Math.max(...data.map((d) => d.Plocha));
  const maxCena = Math.max(...data.map((d) => d.Cena_s_DPH || 0));

  let filters = {
    type: 'all',
    status: 'all',
    rooms: [],
    floors: [],
    plocha: [0, maxPlocha],
    cena: [0, maxCena],
  };

  let itemsToShow = 10;

  // ====================== DOM ELEMENTS ======================
  const selectsContainer = document.getElementById('filter-selects');
  const checkboxesContainer = document.getElementById('filter-checkboxes');
  const rangesContainer = document.getElementById('filter-ranges');
  const listBody = document.querySelector('.filter__list-body');
  const filteredCount = document.querySelector(
    '.filter__info-counts span:first-child',
  );
  const totalCount = document.querySelector(
    '.filter__info-counts span:last-child',
  );
  const showedCount = document.querySelector(
    '.filter__list-count span:first-child',
  );
  const totalCountBottom = document.querySelector(
    '.filter__list-count span:last-child',
  );
  const clearBtn = document.querySelector('.link_underline');
  const loadMoreBtn = document.querySelector('.filter__list-show-more');

  // ====================== HELPERS ======================
  const uniqueArray = (arr) => Array.from(new Set(arr));

  // ====================== CREATE FILTER FUNCTIONS ======================
  function createSelectFilter(title, key, options) {
    const wrapper = document.createElement('div');
    wrapper.className = 'filter__select-body';
    wrapper.innerHTML = `
      <span class="filter__tip">${title}</span>
      <div class="filter__select">
        <div class="filter__trigger">
          <span class="filter__trigger-text">Všetky</span>
          <svg class="filter__arrow" width="14" height="8" viewBox="0 0 14 8" fill="none">
            <path d="M0.875 0.985352L5.46079 5.57114C6.24183 6.35219 7.50816 6.35219 8.28921 5.57114L12.875 0.985352" stroke="" stroke-width="2"/>
          </svg>
        </div>
        <div class="filter__options">
          ${options
            .map(
              (opt) =>
                `<div class="filter__option" data-filter-type="${key}" data-value="${opt.value}">${opt.label}</div>`,
            )
            .join('')}
        </div>
      </div>
    `;
    selectsContainer.appendChild(wrapper);

    const selectEl = wrapper.querySelector('.filter__select');
    const trigger = wrapper.querySelector('.filter__trigger');
    const optionsWrap = wrapper.querySelector('.filter__options');
    const triggerText = wrapper.querySelector('.filter__trigger-text');
    const duration = 300;

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
        filters[key] = opt.dataset.value;
        triggerText.textContent = opt.textContent;
        selectEl.classList.remove('open');
        trigger.classList.add('selected');
        slideUp(optionsWrap, duration);
        renderList();
      });
    });

    document.addEventListener('click', (e) => {
      if (selectEl.classList.contains('open') && !selectEl.contains(e.target)) {
        selectEl.classList.remove('open');
        slideUp(optionsWrap, duration);
      }
    });
  }

  function createCheckboxFilter(title, key, values) {
    const wrapper = document.createElement('div');
    wrapper.className = 'filter__checkbox-body';
    wrapper.innerHTML = `<span class="filter__tip">${title}</span><div class="filter__checkboxes"></div>`;
    const inner = wrapper.querySelector('.filter__checkboxes');

    values
      .slice()
      .sort((a, b) => Number(a) - Number(b))
      .forEach((val) => {
        const label = document.createElement('label');
        label.className = 'filter__checkbox';
        label.innerHTML = `<input type="checkbox" class="filter__checkbox-input" data-filter-type="${key}" value="${val}"><span class="filter__custom-checkbox">${val}</span>`;
        inner.appendChild(label);
      });

    inner.querySelectorAll('input').forEach((ch) => {
      ch.addEventListener('change', () => {
        filters[key] = Array.from(inner.querySelectorAll('input:checked')).map(
          (i) => i.value,
        );
        renderList();
      });
    });

    checkboxesContainer.appendChild(wrapper);
  }

  function createRangeFilter(title, key, min, max, unit = '') {
    const wrapper = document.createElement('div');
    wrapper.className = 'filter__range-body';
    wrapper.innerHTML = `
      <span class="filter__tip">${title}</span>
      <div class="filter__range-inner">
        <div class="filter__range">
          <div class="range-slider__track"></div>
          <div class="range-slider__range"></div>
          <input type="range" class="range-slider__input range-slider__input--min" min="${min}" max="${max}" value="${min}" step="1">
          <input type="range" class="range-slider__input range-slider__input--max" min="${min}" max="${max}" value="${max}" step="1">
        </div>
        <div class="range-slider__labels">
          <div class="range-slider__label"><span data-range="min" data-range-type="${key}">${min}</span><span>${unit}</span></div>
          <div class="range-slider__label"><span data-range="max" data-range-type="${key}">${max}</span><span>${unit}</span></div>
        </div>
      </div>
    `;
    rangesContainer.appendChild(wrapper);

    const minInput = wrapper.querySelector('.range-slider__input--min');
    const maxInput = wrapper.querySelector('.range-slider__input--max');
    const minLabel = wrapper.querySelector('[data-range="min"]');
    const maxLabel = wrapper.querySelector('[data-range="max"]');

    minInput.addEventListener('input', () => {
      filters[key][0] = Number(minInput.value);
      minLabel.textContent = minInput.value;
      renderList();
    });
    maxInput.addEventListener('input', () => {
      filters[key][1] = Number(maxInput.value);
      maxLabel.textContent = maxInput.value;
      renderList();
    });
  }

  // ====================== RENDER LIST ======================
  function renderList() {
    const filtered = data.filter((item) => {
      if (filters.type !== 'all' && item.Typ.toLowerCase() !== filters.type)
        return false;
      if (
        filters.status !== 'all' &&
        item.Stav.toLowerCase() !== filters.status
      )
        return false;
      if (
        filters.rooms.length &&
        !filters.rooms.includes(String(item.Pocet_izieb))
      )
        return false;
      if (
        filters.floors.length &&
        !filters.floors.includes(String(item.Podlazie))
      )
        return false;
      if (item.Plocha < filters.plocha[0] || item.Plocha > filters.plocha[1])
        return false;
      const price = item.Cena_s_DPH || 0;
      if (price < filters.cena[0] || price > filters.cena[1]) return false;
      return true;
    });

    listBody.innerHTML = filtered
      .slice(0, itemsToShow)
      .map((item) => {
        let rowClass = 'filter__list-row';
        if (item.Stav === 'Rezervovany') rowClass += ' reserv';
        if (item.Stav === 'Predany') rowClass += ' sold';
        if (item.Stav === 'V priprave') rowClass += ' prepare';

        return `
        <a href="floor.html" target="_blank" class="${rowClass}">
          <div class="filter__list-col">${item.Blok}</div>
          <div class="filter__list-col">${item.Typ}</div>
          <div class="filter__list-col">${item.Podlazie}</div>
          <div class="filter__list-col">${item.Pocet_izieb}</div>
          <div class="filter__list-col">${item.Plocha}</div>
          <div class="filter__list-col">${item.Balkon_Lodzia_Terasa}</div>
          <div class="filter__list-col">${item.Zahradka}</div>
          <div class="filter__list-col">${item.Plocha_spolu}</div>
          <div class="filter__list-col">${item.Cena_s_DPH ?? '-'}</div>
          <div class="filter__list-col">${item.Stav}</div>
        </a>
      `;
      })
      .join('');

    filteredCount.textContent = filtered.length;
    totalCount.textContent = data.length;
    totalCountBottom.textContent = data.length;
    showedCount.textContent = Math.min(itemsToShow, filtered.length);

    loadMoreBtn.style.display =
      itemsToShow >= filtered.length ? 'none' : 'block';
  }

  // ====================== INIT FILTERS ======================
  createSelectFilter(
    'Typ',
    'type',
    ['all', ...uniqueArray(data.map((d) => d.Typ.toLowerCase()))].map((t) => ({
      value: t,
      label: t.charAt(0).toUpperCase() + t.slice(1),
    })),
  );
  createSelectFilter(
    'Dostupnosť',
    'status',
    ['all', ...uniqueArray(data.map((d) => d.Stav.toLowerCase()))].map((s) => ({
      value: s,
      label: s.charAt(0).toUpperCase() + s.slice(1),
    })),
  );

  createCheckboxFilter(
    'Izby',
    'rooms',
    uniqueArray(data.map((d) => d.Pocet_izieb)),
  );
  createCheckboxFilter(
    'Podlažie',
    'floors',
    uniqueArray(data.map((d) => d.Podlazie)),
  );

  createRangeFilter('Plocha', 'plocha', 0, maxPlocha, 'm²');
  createRangeFilter('Cena', 'cena', 0, maxCena, 'EUR');

  // ====================== CLEAR FILTERS ======================
  clearBtn.addEventListener('click', () => {
    filters = {
      type: 'all',
      status: 'all',
      rooms: [],
      floors: [],
      plocha: [0, maxPlocha],
      cena: [0, maxCena],
    };

    const filtersBody = document.querySelector('.filter');

    filtersBody
      .querySelectorAll('.filter__trigger-text')
      .forEach((el) => (el.textContent = 'Všetky'));

    filtersBody
      .querySelectorAll('.filter__trigger')
      .forEach((el) => el.classList.remove('selected'));

    filtersBody
      .querySelectorAll('.filter__checkbox-input')
      .forEach((el) => (el.checked = false));

    filtersBody.querySelectorAll('.filter__range-body').forEach((rangeBody) => {
      const minInput = rangeBody.querySelector('.range-slider__input--min');
      const maxInput = rangeBody.querySelector('.range-slider__input--max');
      const minLabel = rangeBody.querySelector('[data-range="min"]');
      const maxLabel = rangeBody.querySelector('[data-range="max"]');

      if (minInput && maxInput) {
        minInput.value = minInput.min;
        maxInput.value = maxInput.max;
      }

      if (minLabel && minInput) minLabel.textContent = minInput.value;
      if (maxLabel && maxInput) maxLabel.textContent = maxInput.value;
    });

    itemsToShow = 10;

    renderList();
  });

  // ====================== LOAD MORE ======================
  loadMoreBtn.addEventListener('click', () => {
    itemsToShow += 10;
    renderList();
  });

  renderList();
}
