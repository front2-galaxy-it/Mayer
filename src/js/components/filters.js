import { slideDown, slideUp } from '../utils/slideIn';

export function initFilters() {
  // Detect presence of filter containers on the page
  const hasContainers =
    document.getElementById('filter-selects') ||
    document.getElementById('filter-checkboxes') ||
    document.getElementById('filter-ranges') ||
    document.querySelector('.filter');

  if (!hasContainers) {
    return; // No filters markup on this page
  }

  // Check if this is a land page by looking for specific elements
  const isLandPage = document
    .querySelector('.filter__title')
    ?.textContent.includes('POZEMKOV');
  // Check if this is a floor page by looking for specific class
  const isFloorPage = document.querySelector('.filter_floor');

  let dataFile;
  if (isLandPage) {
    dataFile = '/data/land-plots.json';
  } else if (isFloorPage) {
    dataFile = '/data/apartments.json';
  } else {
    dataFile = '/data/apartments.json';
  }

  fetch(dataFile)
    .then((res) => res.json())
    .then((data) => {
      if (isLandPage) {
        renderLandFilters(data);
      } else if (isFloorPage) {
        renderFloorFilters(data);
      } else {
        renderFilters(data);
      }
    })
    .catch((err) => console.error(`Ошибка загрузки ${dataFile}:`, err));
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
  let sortState = { key: null, dir: 'asc' };

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

  // If core containers are missing, do not proceed
  if (
    !selectsContainer ||
    !checkboxesContainer ||
    !rangesContainer ||
    !listBody
  ) {
    console.warn(
      '[filters] Missing filter containers on this page. Skipping render.',
    );
    return;
  }

  // ====================== HELPERS ======================
  const uniqueArray = (arr) => Array.from(new Set(arr.filter(val => val !== undefined && val !== null && val !== '')));

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
    if (!selectsContainer) return;
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

    if (!checkboxesContainer) return;
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
    if (!rangesContainer) return;
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
    let filtered = data.filter((item) => {
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

    // Apply sorting if set
    if (sortState.key) {
      const key = sortState.key;
      const dir = sortState.dir === 'asc' ? 1 : -1;
      filtered = filtered.slice().sort((a, b) => {
        const va = normalizeValue(a[key]);
        const vb = normalizeValue(b[key]);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }

    if (!listBody) return;

    if (filtered.length === 0) {
      listBody.innerHTML = `
        <div class="filter__list-empty">
          <span>Nenašli sa žiadne výsledky podľa zvolených filtrov.</span>
        </div>
      `;
      if (filteredCount) filteredCount.textContent = '0';
      if (totalCount) totalCount.textContent = String(data.length);
      if (totalCountBottom) totalCountBottom.textContent = String(data.length);
      if (showedCount) showedCount.textContent = '0';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

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

    if (filteredCount) filteredCount.textContent = filtered.length;
    if (totalCount) totalCount.textContent = data.length;
    if (totalCountBottom) totalCountBottom.textContent = data.length;
    if (showedCount)
      showedCount.textContent = Math.min(itemsToShow, filtered.length);

    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        itemsToShow >= filtered.length ? 'none' : 'block';
    }
  }

  function normalizeValue(value) {
    const v = value ?? 0;
    if (typeof v === 'number') return v;
    
    // Special handling for status sorting
    if (typeof v === 'string') {
      const statusOrder = {
        'volny': 1,
        'voľný': 1,
        'rezervovany': 2,
        'rezervovaný': 2,
        'v priprave': 3,
        'v príprave': 3,
        'predany': 4,
        'predaný': 4
      };
      
      const lowerValue = v.toLowerCase();
      if (statusOrder.hasOwnProperty(lowerValue)) {
        return statusOrder[lowerValue];
      }
    }
    
    // Try numeric parse from string (e.g., price strings)
    const num = Number(
      String(v)
        .toString()
        .replace(/[^0-9.-]+/g, ''),
    );
    if (!Number.isNaN(num) && String(v).trim() !== '') return num;
    return String(v).toLowerCase();
  }

  // ====================== INIT FILTERS ======================
  createSelectFilter(
    'Typ',
    'type',
    [
      { value: 'all', label: 'Všetky' },
      ...uniqueArray(data.map((d) => d.Typ.toLowerCase())),
    ].map((t) => ({
      value: t.value || t,
      label: t.label || t.charAt(0).toUpperCase() + t.slice(1),
    })),
  );
  createSelectFilter(
    'Dostupnosť',
    'status',
    [
      { value: 'all', label: 'Všetky' },
      ...uniqueArray(data.map((d) => d.Stav.toLowerCase())),
    ].map((s) => ({
      value: s.value || s,
      label: s.label || s.charAt(0).toUpperCase() + s.slice(1),
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
  if (clearBtn)
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

      if (filtersBody) {
        filtersBody
          .querySelectorAll('.filter__trigger-text')
          .forEach((el) => (el.textContent = 'Všetky'));

        filtersBody
          .querySelectorAll('.filter__trigger')
          .forEach((el) => el.classList.remove('selected'));

        filtersBody
          .querySelectorAll('.filter__checkbox-input')
          .forEach((el) => (el.checked = false));

        filtersBody
          .querySelectorAll('.filter__range-body')
          .forEach((rangeBody) => {
            const minInput = rangeBody.querySelector(
              '.range-slider__input--min',
            );
            const maxInput = rangeBody.querySelector(
              '.range-slider__input--max',
            );
            const minLabel = rangeBody.querySelector('[data-range="min"]');
            const maxLabel = rangeBody.querySelector('[data-range="max"]');

            if (minInput && maxInput) {
              minInput.value = minInput.min;
              maxInput.value = maxInput.max;
            }

            if (minLabel && minInput) minLabel.textContent = minInput.value;
            if (maxLabel && maxInput) maxLabel.textContent = maxInput.value;
          });
      }

      itemsToShow = 10;

      renderList();
    });

  // ====================== LOAD MORE ======================
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      itemsToShow += 10;
      renderList();
    });
  }

  renderList();

  document.dispatchEvent(new CustomEvent('filters:ready'));

  // ====================== SORTING (LIST HEADER) ======================
  const header = document.querySelector('.filter__list-heading');
  if (header) {
    const headerButtons = header.querySelectorAll('button');
    const indexToKey = [
      'Blok',
      'Typ',
      'Podlazie',
      'Pocet_izieb',
      'Plocha',
      'Balkon_Lodzia_Terasa',
      'Zahradka',
      'Plocha_spolu',
      'Cena_s_DPH',
      'Stav',
    ];

    // Ensure sort icons exist
    headerButtons.forEach((btn) => {
      if (!btn.querySelector('.sort_icon')) {
        const icon = document.createElement('img');
        icon.className = 'sort_icon';
        icon.alt = '';
        icon.decoding = 'async';
        icon.src = './images/sort_arrow.svg';
        btn.appendChild(icon);
      }
    });

    function updateSortIcons() {
      headerButtons.forEach((btn, idx) => {
        const icon = btn.querySelector('.sort_icon');
        const key = indexToKey[idx];
        const isActive = sortState.key === key;
        btn.classList.toggle('sort-active', isActive);
        if (icon) {
          icon.classList.toggle('asc', isActive && sortState.dir === 'asc');
          icon.classList.toggle('desc', isActive && sortState.dir === 'desc');
          icon.style.visibility = isActive ? 'visible' : 'hidden';
        }
      });
    }

    headerButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const key = indexToKey[idx];
        if (!key) return;
        if (sortState.key === key) {
          sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.key = key;
          sortState.dir = 'asc';
        }
        itemsToShow = 10; // reset pagination on new sort
        renderList();
        updateSortIcons();
      });
    });

    // Initialize icons state
    updateSortIcons();
  }
}

export function renderFloorFilters(data) {
  // Filter only apartments (not land plots)
  const floorData = data.filter((item) => item.Typ !== 'Pozemok');

  // ====================== PRECALC MAX VALUES ======================
  const maxPlocha = Math.max(...floorData.map((d) => d.Plocha));
  const maxCena = Math.max(...floorData.map((d) => d.Cena_s_DPH || 0));

  let filters = {
    status: 'all',
    rooms: [],
    floors: [],
    plocha: [0, maxPlocha],
    cena: [0, maxCena],
  };

  let itemsToShow = 10;
  let sortState = { key: null, dir: 'asc' };

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

  // If core containers are missing, do not proceed
  if (
    !selectsContainer ||
    !checkboxesContainer ||
    !rangesContainer ||
    !listBody
  ) {
    console.warn(
      '[floor filters] Missing filter containers on this page. Skipping render.',
    );
    return;
  }

  // ====================== HELPERS ======================
  const uniqueArray = (arr) => Array.from(new Set(arr.filter(val => val !== undefined && val !== null && val !== '')));

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
    if (!selectsContainer) return;
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

    if (!checkboxesContainer) return;
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
    if (!rangesContainer) return;
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
    let filtered = floorData.filter((item) => {
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

    // Apply sorting if set
    if (sortState.key) {
      const key = sortState.key;
      const dir = sortState.dir === 'asc' ? 1 : -1;
      filtered = filtered.slice().sort((a, b) => {
        const va = normalizeValue(a[key]);
        const vb = normalizeValue(b[key]);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }

    if (!listBody) return;

    if (filtered.length === 0) {
      listBody.innerHTML = `
        <div class="filter__list-empty">
          <span>Nenašli sa žiadne výsledky podľa zvolených filtrov.</span>
        </div>
      `;
      if (filteredCount) filteredCount.textContent = '0';
      if (totalCount) totalCount.textContent = String(floorData.length);
      if (totalCountBottom) totalCountBottom.textContent = String(floorData.length);
      if (showedCount) showedCount.textContent = '0';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

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
          <div class="filter__list-col">${item.Cislo || '-'}</div>
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

    if (filteredCount) filteredCount.textContent = filtered.length;
    if (totalCount) totalCount.textContent = floorData.length;
    if (totalCountBottom) totalCountBottom.textContent = floorData.length;
    if (showedCount)
      showedCount.textContent = Math.min(itemsToShow, filtered.length);

    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        itemsToShow >= filtered.length ? 'none' : 'block';
    }
  }

  function normalizeValue(value) {
    const v = value ?? 0;
    if (typeof v === 'number') return v;
    
    // Special handling for status sorting
    if (typeof v === 'string') {
      const statusOrder = {
        'volny': 1,
        'voľný': 1,
        'rezervovany': 2,
        'rezervovaný': 2,
        'v priprave': 3,
        'v príprave': 3,
        'predany': 4,
        'predaný': 4
      };
      
      const lowerValue = v.toLowerCase();
      if (statusOrder.hasOwnProperty(lowerValue)) {
        return statusOrder[lowerValue];
      }
    }
    
    // Try numeric parse from string (e.g., price strings)
    const num = Number(
      String(v)
        .toString()
        .replace(/[^0-9.-]+/g, ''),
    );
    if (!Number.isNaN(num) && String(v).trim() !== '') return num;
    return String(v).toLowerCase();
  }

  // ====================== INIT FILTERS ======================
  // Note: Excluding 'Typ' filter as requested
  createSelectFilter(
    'Dostupnosť',
    'status',
    [
      { value: 'all', label: 'Všetky' },
      ...uniqueArray(floorData.map((d) => d.Stav.toLowerCase())),
    ].map((s) => ({
      value: s.value || s,
      label: s.label || s.charAt(0).toUpperCase() + s.slice(1),
    })),
  );

  createCheckboxFilter(
    'Izby',
    'rooms',
    uniqueArray(floorData.map((d) => d.Pocet_izieb)),
  );
  createCheckboxFilter(
    'Podlažie',
    'floors',
    uniqueArray(floorData.map((d) => d.Podlazie)),
  );

  createRangeFilter('Plocha', 'plocha', 0, maxPlocha, 'm²');
  createRangeFilter('Cena', 'cena', 0, maxCena, 'EUR');

  // ====================== CLEAR FILTERS ======================
  if (clearBtn)
    clearBtn.addEventListener('click', () => {
      filters = {
        status: 'all',
        rooms: [],
        floors: [],
        plocha: [0, maxPlocha],
        cena: [0, maxCena],
      };

      const filtersBody = document.querySelector('.filter');

      if (filtersBody) {
        filtersBody
          .querySelectorAll('.filter__trigger-text')
          .forEach((el) => (el.textContent = 'Všetky'));

        filtersBody
          .querySelectorAll('.filter__trigger')
          .forEach((el) => el.classList.remove('selected'));

        filtersBody
          .querySelectorAll('.filter__checkbox-input')
          .forEach((el) => (el.checked = false));

        filtersBody
          .querySelectorAll('.filter__range-body')
          .forEach((rangeBody) => {
            const minInput = rangeBody.querySelector(
              '.range-slider__input--min',
            );
            const maxInput = rangeBody.querySelector(
              '.range-slider__input--max',
            );
            const minLabel = rangeBody.querySelector('[data-range="min"]');
            const maxLabel = rangeBody.querySelector('[data-range="max"]');

            if (minInput && maxInput) {
              minInput.value = minInput.min;
              maxInput.value = maxInput.max;
            }

            if (minLabel && minInput) minLabel.textContent = minInput.value;
            if (maxLabel && maxInput) maxLabel.textContent = maxInput.value;
          });
      }

      itemsToShow = 10;

      renderList();
    });

  // ====================== LOAD MORE ======================
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      itemsToShow += 10;
      renderList();
    });
  }

  renderList();

  document.dispatchEvent(new CustomEvent('filters:ready'));

  // ====================== SORTING (LIST HEADER) ======================
  const header = document.querySelector('.filter__list-heading');
  if (header) {
    const headerButtons = header.querySelectorAll('button');
    const indexToKey = [
      'Blok',
      'Typ',
      'Cislo',
      'Podlazie',
      'Pocet_izieb',
      'Plocha',
      'Balkon_Lodzia_Terasa',
      'Zahradka',
      'Plocha_spolu',
      'Cena_s_DPH',
      'Stav',
    ];

    // Ensure sort icons exist
    headerButtons.forEach((btn) => {
      if (!btn.querySelector('.sort_icon')) {
        const icon = document.createElement('img');
        icon.className = 'sort_icon';
        icon.alt = '';
        icon.decoding = 'async';
        icon.src = './images/sort_arrow.svg';
        btn.appendChild(icon);
      }
    });

    function updateSortIcons() {
      headerButtons.forEach((btn, idx) => {
        const icon = btn.querySelector('.sort_icon');
        const key = indexToKey[idx];
        const isActive = sortState.key === key;
        btn.classList.toggle('sort-active', isActive);
        if (icon) {
          icon.classList.toggle('asc', isActive && sortState.dir === 'asc');
          icon.classList.toggle('desc', isActive && sortState.dir === 'desc');
          icon.style.visibility = isActive ? 'visible' : 'hidden';
        }
      });
    }

    headerButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const key = indexToKey[idx];
        if (!key) return;
        if (sortState.key === key) {
          sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.key = key;
          sortState.dir = 'asc';
        }
        itemsToShow = 10; // reset pagination on new sort
        renderList();
        updateSortIcons();
      });
    });

    // Initialize icons state
    updateSortIcons();
  }
}

export function renderLandFilters(data) {
  // Filter only land plots
  const landData = data.filter((item) => item.Typ === 'Pozemok');

  // ====================== PRECALC MAX VALUES ======================
  const maxPlocha = Math.max(...landData.map((d) => d.Plocha_spolu));
  const maxCena = Math.max(...landData.map((d) => d.Cena_s_DPH || 0));

  let filters = {
    status: 'all',
    plocha: [0, maxPlocha],
    cena: [0, maxCena],
  };

  let itemsToShow = 10;
  let sortState = { key: null, dir: 'asc' };

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

  // If core containers are missing, do not proceed
  if (!selectsContainer || !rangesContainer || !listBody) {
    console.warn(
      '[land filters] Missing filter containers on this page. Skipping render.',
    );
    return;
  }

  // ====================== HELPERS ======================
  const uniqueArray = (arr) => Array.from(new Set(arr.filter(val => val !== undefined && val !== null && val !== '')));

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
    if (!selectsContainer) return;
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
    if (!rangesContainer) return;
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
    let filtered = landData.filter((item) => {
      if (
        filters.status !== 'all' &&
        item.Stav.toLowerCase() !== filters.status
      )
        return false;
      if (
        item.Plocha_spolu < filters.plocha[0] ||
        item.Plocha_spolu > filters.plocha[1]
      )
        return false;
      const price = item.Cena_s_DPH || 0;
      if (price < filters.cena[0] || price > filters.cena[1]) return false;
      return true;
    });

    // Apply sorting if set
    if (sortState.key) {
      const key = sortState.key;
      const dir = sortState.dir === 'asc' ? 1 : -1;
      filtered = filtered.slice().sort((a, b) => {
        const va = normalizeValue(a[key]);
        const vb = normalizeValue(b[key]);
        if (va < vb) return -1 * dir;
        if (va > vb) return 1 * dir;
        return 0;
      });
    }

    if (!listBody) return;

    if (filtered.length === 0) {
      listBody.innerHTML = `
        <div class="filter__list-empty">
          <span>Nenašli sa žiadne výsledky podľa zvolených filtrov.</span>
        </div>
      `;
      if (filteredCount) filteredCount.textContent = '0';
      if (totalCount) totalCount.textContent = String(landData.length);
      if (totalCountBottom)
        totalCountBottom.textContent = String(landData.length);
      if (showedCount) showedCount.textContent = '0';
      if (loadMoreBtn) loadMoreBtn.style.display = 'none';
      return;
    }

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
          <div class="filter__list-col">${item.Cislo}</div>
          <div class="filter__list-col">${item.Plocha_spolu} m²</div>
          <div class="filter__list-col">${
            item.Cena_s_DPH ? item.Cena_s_DPH.toLocaleString() + ' €' : '-'
          }</div>
          <div class="filter__list-col">${item.Stav}</div>
        </a>
      `;
      })
      .join('');

    if (filteredCount) filteredCount.textContent = filtered.length;
    if (totalCount) totalCount.textContent = landData.length;
    if (totalCountBottom) totalCountBottom.textContent = landData.length;
    if (showedCount)
      showedCount.textContent = Math.min(itemsToShow, filtered.length);

    if (loadMoreBtn) {
      loadMoreBtn.style.display =
        itemsToShow >= filtered.length ? 'none' : 'block';
    }
  }

  function normalizeValue(value) {
    const v = value ?? 0;
    if (typeof v === 'number') return v;
    
    // Special handling for status sorting
    if (typeof v === 'string') {
      const statusOrder = {
        'volny': 1,
        'voľný': 1,
        'rezervovany': 2,
        'rezervovaný': 2,
        'v priprave': 3,
        'v príprave': 3,
        'predany': 4,
        'predaný': 4
      };
      
      const lowerValue = v.toLowerCase();
      if (statusOrder.hasOwnProperty(lowerValue)) {
        return statusOrder[lowerValue];
      }
    }
    
    // Try numeric parse from string (e.g., price strings)
    const num = Number(
      String(v)
        .toString()
        .replace(/[^0-9.-]+/g, ''),
    );
    if (!Number.isNaN(num) && String(v).trim() !== '') return num;
    return String(v).toLowerCase();
  }

  // ====================== INIT FILTERS ======================
  createSelectFilter(
    'Dostupnosť',
    'status',
    [
      { value: 'all', label: 'Všetky' },
      ...uniqueArray(landData.map((d) => d.Stav.toLowerCase())),
    ].map((s) => ({
      value: s.value || s,
      label: s.label || s.charAt(0).toUpperCase() + s.slice(1),
    })),
  );

  createRangeFilter('Plocha', 'plocha', 0, maxPlocha, 'm²');
  createRangeFilter('Cena', 'cena', 0, maxCena, 'EUR');

  // ====================== CLEAR FILTERS ======================
  if (clearBtn)
    clearBtn.addEventListener('click', () => {
      filters = {
        status: 'all',
        plocha: [0, maxPlocha],
        cena: [0, maxCena],
      };

      const filtersBody = document.querySelector('.filter');

      if (filtersBody) {
        filtersBody
          .querySelectorAll('.filter__trigger-text')
          .forEach((el) => (el.textContent = 'Všetky'));

        filtersBody
          .querySelectorAll('.filter__trigger')
          .forEach((el) => el.classList.remove('selected'));

        filtersBody
          .querySelectorAll('.filter__range-body')
          .forEach((rangeBody) => {
            const minInput = rangeBody.querySelector(
              '.range-slider__input--min',
            );
            const maxInput = rangeBody.querySelector(
              '.range-slider__input--max',
            );
            const minLabel = rangeBody.querySelector('[data-range="min"]');
            const maxLabel = rangeBody.querySelector('[data-range="max"]');

            if (minInput && maxInput) {
              minInput.value = minInput.min;
              maxInput.value = maxInput.max;
            }

            if (minLabel && minInput) minLabel.textContent = minInput.value;
            if (maxLabel && maxInput) maxLabel.textContent = maxInput.value;
          });
      }

      itemsToShow = 10;

      renderList();
    });

  // ====================== LOAD MORE ======================
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', () => {
      itemsToShow += 10;
      renderList();
    });
  }

  renderList();

  document.dispatchEvent(new CustomEvent('filters:ready'));

  // ====================== SORTING (LIST HEADER) ======================
  const header = document.querySelector('.filter__list-heading');
  if (header) {
    const headerButtons = header.querySelectorAll('button');
    const indexToKey = [
      'Blok',
      'Typ',
      'Cislo',
      'Plocha_spolu',
      'Cena_s_DPH',
      'Stav',
    ];

    // Ensure sort icons exist
    headerButtons.forEach((btn) => {
      if (!btn.querySelector('.sort_icon')) {
        const icon = document.createElement('img');
        icon.className = 'sort_icon';
        icon.alt = '';
        icon.decoding = 'async';
        icon.src = './images/sort_arrow.svg';
        btn.appendChild(icon);
      }
    });

    function updateSortIcons() {
      headerButtons.forEach((btn, idx) => {
        const icon = btn.querySelector('.sort_icon');
        const key = indexToKey[idx];
        const isActive = sortState.key === key;
        btn.classList.toggle('sort-active', isActive);
        if (icon) {
          icon.classList.toggle('asc', isActive && sortState.dir === 'asc');
          icon.classList.toggle('desc', isActive && sortState.dir === 'desc');
          icon.style.visibility = isActive ? 'visible' : 'hidden';
        }
      });
    }

    headerButtons.forEach((btn, idx) => {
      btn.addEventListener('click', () => {
        const key = indexToKey[idx];
        if (!key) return;
        if (sortState.key === key) {
          sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
        } else {
          sortState.key = key;
          sortState.dir = 'asc';
        }
        itemsToShow = 10; // reset pagination on new sort
        renderList();
        updateSortIcons();
      });
    });

    // Initialize icons state
    updateSortIcons();
  }
}
