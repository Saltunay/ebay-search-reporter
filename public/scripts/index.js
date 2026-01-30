let db = [];
let currentPage = 1;
let totalPages = 1;
let limit = 5;

async function loadLocalData() {
  try {
    const response = await fetch('./db.json', { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`db.json load failed (${response.status})`);
    }
    db = await response.json();
  } catch (error) {
    console.error('Failed to load local data:', error);
    db = [];
    throw error;
  }
}

function fetchSearchResultsFromLocal(page = 1) {
  const resultsBody = document.getElementById('results-body');
  resultsBody.innerHTML =
    '<tr><td colspan="6" class="loading">Loading...</td></tr>';

  try {
    if (!Array.isArray(db)) {
      throw new Error('Local data is not an array');
    }
    const results = db.slice((page - 1) * limit, page * limit);
    totalPages = Math.ceil(db.length / limit);
    currentPage = page;

    renderSearchResults(results);
    updatePaginationControls();
  } catch (error) {
    resultsBody.innerHTML = `<tr><td colspan="6" class="error">Error loading results: ${error.message}</td></tr>`;
    document.getElementById('showing-count').textContent = '0';
    totalPages = 1;
    currentPage = 1;
    updatePaginationControls();
  }
}

function renderSearchResults(reports) {
  const resultsBody = document.getElementById('results-body');
  const showingCount = document.getElementById('showing-count');
  resultsBody.innerHTML = '';

  if (!reports || reports.length === 0) {
    resultsBody.innerHTML =
      '<tr><td colspan="6" class="empty-state">No results found</td></tr>';
    showingCount.textContent = '0';
    return;
  }

  showingCount.textContent = reports.length;

  reports.forEach((report) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>
        <img src="${escapeHtml(report.inputPhotoUrl)}" alt="Item Image" onclick="openImageModal(this.src)" />
      </td>
      <td>${escapeHtml(report.query)}</td>
      <td class="price-value">$${escapeHtml(report.usdValue)}</td>
      <td class="price-value price-low">$${escapeHtml(report.lowestPrice)}</td>
      <td class="price-value price-high">$${escapeHtml(report.highestPrice)}</td>
      <td>
        <div class="action-group">
          <a href="${escapeHtml(report.ebayLink)}" target="_blank" rel="noopener noreferrer">
            View on eBay
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
          </a>
          <button class="compare-btn" type="button">Compare</button>
        </div>
      </td>
    `;
    const compareBtn = row.querySelector('.compare-btn');
    compareBtn.addEventListener('click', () => {
      openCompareModal(report);
    });
    resultsBody.appendChild(row);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDisplayValue(value) {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  return String(value);
}

function setCompareValue(elementId, value) {
  const el = document.getElementById(elementId);
  const display = formatDisplayValue(value);
  el.textContent = display === '-' ? '-' : `$${display}`;
}

function updatePaginationControls() {
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const currentPageSpan = document.getElementById('current-page');
  const totalPagesSpan = document.getElementById('total-pages');

  currentPageSpan.textContent = currentPage;
  totalPagesSpan.textContent = totalPages;

  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

function changePageSize(newLimit) {
  limit = newLimit;
  fetchSearchResultsFromLocal(1);
}

function goToPreviousPage() {
  if (currentPage > 1) {
    fetchSearchResultsFromLocal(currentPage - 1);
  }
}

function goToNextPage() {
  if (currentPage < totalPages) {
    fetchSearchResultsFromLocal(currentPage + 1);
  }
}

function openImageModal(src) {
  const modal = document.getElementById('image-modal');
  const modalImage = document.getElementById('modal-image');
  modalImage.src = src;
  modal.classList.add('active');
}

function closeImageModal() {
  const modal = document.getElementById('image-modal');
  modal.classList.remove('active');
}

function openCompareModal(report) {
  const modal = document.getElementById('compare-modal');
  const query = document.getElementById('compare-query');
  query.textContent = formatDisplayValue(report.query);

  setCompareValue('compare-actual-value', report.usdValue);
  setCompareValue('compare-actual-low', report.lowestPrice);
  setCompareValue('compare-actual-high', report.highestPrice);
  setCompareValue('compare-db-value', report.dbUsdValue);
  setCompareValue('compare-db-low', report.dbLowestPrice);
  setCompareValue('compare-db-high', report.dbHighestPrice);

  modal.classList.add('active');
}

function closeCompareModal() {
  const modal = document.getElementById('compare-modal');
  modal.classList.remove('active');
}

document.addEventListener('DOMContentLoaded', () => {
  document
    .getElementById('prev-btn')
    .addEventListener('click', goToPreviousPage);
  document.getElementById('next-btn').addEventListener('click', goToNextPage);
  document.getElementById('page-size').addEventListener('change', (e) => {
    changePageSize(parseInt(e.target.value, 10));
  });

  // Image modal event listeners
  const modal = document.getElementById('image-modal');
  modal.querySelector('.close-btn').addEventListener('click', closeImageModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeImageModal();
    }
  });

  // Compare modal event listeners
  const compareModal = document.getElementById('compare-modal');
  compareModal
    .querySelector('.close-btn')
    .addEventListener('click', closeCompareModal);
  compareModal.addEventListener('click', (e) => {
    if (e.target === compareModal) {
      closeCompareModal();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeImageModal();
      closeCompareModal();
    }
  });

  loadLocalData()
    .then(() => {
      fetchSearchResultsFromLocal(1);
    })
    .catch(() => {
      const resultsBody = document.getElementById('results-body');
      resultsBody.innerHTML =
        '<tr><td colspan="6" class="error">db.json couldnt load. Please run the page from a local server.</td></tr>';
      document.getElementById('showing-count').textContent = '0';
      currentPage = 1;
      totalPages = 1;
      updatePaginationControls();
    });
});
