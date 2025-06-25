// main.js - Project showcase logic

// CONFIG: Set your Google Sheets published CSV or JSON URL here (or leave blank for local only)
const GOOGLE_SHEET_URL = ""; // e.g. "https://docs.google.com/spreadsheets/d/xxx/gviz/tq?tqx=out:json" or CSV link

function fetchProjectsFromLocal() {
  return fetch('projects.json').then(r => {
    if (!r.ok) throw new Error('Failed to load local projects.json');
    return r.json();
  });
}

function fetchProjectsFromGoogleSheet(url) {
  if (url.includes('/gviz/tq?tqx=out:json')) {
    // Google Sheets published as JSON
    return fetch(url)
      .then(r => r.text())
      .then(txt => {
        const json = JSON.parse(txt.match(/google\.visualization\.Query\.setResponse\((.*)\)/)[1]);
        const cols = json.table.cols.map(col => col.label.toLowerCase());
        return json.table.rows.map(row => {
          const obj = {};
          row.c.forEach((cell, i) => {
            obj[cols[i]] = cell ? cell.v : '';
          });
          if (obj.badges) obj.badges = JSON.parse(obj.badges);
          if (obj.categories) obj.categories = obj.categories.split(',').map(s => s.trim());
          return obj;
        });
      });
  } else if (url.endsWith('.csv')) {
    return fetch(url)
      .then(r => r.text())
      .then(csv => csvToProjects(csv));
  } else {
    throw new Error('Unsupported Google Sheets URL format. Use published CSV or JSON.');
  }
}

function csvToProjects(csv) {
  const [header, ...lines] = csv.trim().split(/\r?\n/);
  const keys = header.split(',').map(k => k.trim().toLowerCase());
  return lines.map(line => {
    const values = line.split(',');
    const obj = {};
    keys.forEach((k, i) => {
      obj[k] = values[i] ? values[i].trim() : '';
    });
    if (obj.badges) obj.badges = JSON.parse(obj.badges);
    if (obj.categories) obj.categories = obj.categories.split(',').map(s => s.trim());
    return obj;
  });
}

function fetchProjectsAuto() {
  if (!GOOGLE_SHEET_URL) return fetchProjectsFromLocal();
  return fetchProjectsFromGoogleSheet(GOOGLE_SHEET_URL)
    .then(projects => {
      const disablesLocal = projects.some(p => p.disablelocal && (p.disablelocal === '1' || p.disablelocal === 'true'));
      if (disablesLocal) return projects;
      return fetchProjectsFromLocal()
        .then(localProjects => [...projects, ...localProjects])
        .catch(() => projects);
    })
    .catch(() => fetchProjectsFromLocal());
}

function createProjectCard(project) {
  // Deduplicate categories and badges by label
  const seenCats = new Set();
  const uniqueCategories = (project.categories || []).filter(cat => {
    const key = cat.toLowerCase();
    if (seenCats.has(key)) return false;
    seenCats.add(key);
    return true;
  });

  // Only show categories as tags (plain style), no badges except 'Featured' overlay
  const badges = (project.badges || []);
  const featuredBadge = badges.find(b => b.label.toLowerCase() === 'featured');

  return `<article class="project-card glass-morphism rounded-3xl p-6 shadow-lg hover:shadow-2xl group cursor-pointer transition-all duration-300 border-2 border-transparent hover:border-brand-primary focus-within:border-brand-accent focus-within:ring-4 focus-within:ring-brand-primary/30 outline-none" tabindex="0" data-categories="${uniqueCategories.join(' ')}">
    <div class="relative mb-4">
      <div class="w-full h-48 bg-gradient-to-br from-brand-primary/20 to-brand-secondary/20 rounded-2xl flex items-center justify-center overflow-hidden">
        <img src="${project.image}" alt="Project preview for ${project.title}" class="object-cover w-full h-full rounded-2xl transition-transform duration-300 group-hover:scale-105" loading="lazy" />
        ${featuredBadge ? `<span class="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-pink-500 to-yellow-500 text-white text-xs font-bold rounded-full uppercase shadow">${featuredBadge.label}</span>` : ''}
      </div>
    </div>
    <h3 class="text-xl font-bold mb-2 group-hover:text-brand-primary transition-colors">${project.title}</h3>
    <div class="flex flex-wrap gap-2 mb-2">
      ${uniqueCategories.map(cat => `<span class="px-2 py-0.5 text-xs rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 dark:bg-brand-secondary/20 dark:text-brand-secondary">${cat}</span>`).join('')}
    </div>
    <p class="text-gray-700 dark:text-gray-300 mb-4 min-h-[56px]">${project.description}</p>
    <div class="flex flex-wrap items-center justify-between gap-2 mb-2 text-xs text-gray-500 dark:text-gray-400">
      <div class="flex items-center gap-3 flex-wrap">
        <span class="flex items-center gap-1"><i class="fas fa-calendar-alt"></i> <span class="font-medium">${project.updated || ''}</span></span>
        <span class="flex items-center gap-1"><i class="fas fa-eye"></i> ${project.views || ''}</span>
        <span class="flex items-center gap-1"><i class="fas fa-code-branch"></i> ${project.forks || ''}</span>
      </div>
    </div>
    <div class="flex items-center justify-between mt-4 gap-2">
      <a href="${project.source || '#'}" class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-brand-primary/80 to-brand-secondary/80 text-white font-semibold shadow hover:from-brand-secondary hover:to-brand-primary transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-50" target="_blank" rel="noopener" aria-label="View source code" ${project.source ? '' : 'tabindex="-1" aria-disabled="true"'}><i class="fab fa-github"></i> Source</a>
      <a href="${project.demo || '#'}" class="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/80 dark:bg-gray-900/80 text-brand-primary dark:text-brand-secondary font-semibold shadow hover:bg-brand-primary hover:text-white dark:hover:bg-brand-secondary dark:hover:text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/40 disabled:opacity-50" target="_blank" rel="noopener" aria-label="View live demo" ${project.demo && project.demo !== '#' ? '' : 'tabindex="-1" aria-disabled="true"'}><i class="fas fa-external-link-alt"></i> Demo</a>
    </div>
  </article>`;
}

function renderProjects(projects) {
  const grid = document.getElementById('projectGrid');
  const loading = document.getElementById('loadingState');
  const noResults = document.getElementById('noResultsMsg');
  if (loading) loading.style.display = 'none';
  const { projects: paged, totalPages } = paginateProjects(projects, currentPage);
  if (paged.length) {
    grid.innerHTML = paged.map(createProjectCard).join('');
    grid.classList.remove('hidden');
    if (noResults) noResults.classList.add('hidden');
  } else {
    grid.innerHTML = '';
    grid.classList.add('hidden');
    if (noResults) {
      noResults.classList.remove('hidden');
      noResults.querySelector('span.text-xl').textContent = `No projects found in this category.`;
      noResults.querySelector('span.text-gray-500').textContent = `Try another category or see all projects.`;
    }
  }
  renderPagination(totalPages, currentPage);
}

// --- UI/DOM Elements ---
const searchToggleBtn = document.querySelector('.search-toggle');
const searchBar = document.querySelector('.search-bar');
const searchInput = searchBar ? searchBar.querySelector('input[type="search"]') : null;
const searchClearBtn = searchBar ? searchBar.querySelector('.search-clear') : null;
const filterBtns = document.querySelectorAll('.filter-btn');
const themeToggleBtn = document.querySelector('.theme-toggle');
const backToTopBtn = document.getElementById('backToTopBtn');
const backBtn = document.querySelector('nav button[onclick="goBack()"]');
const noResultsMsgId = 'noResultsMsg';

let allProjects = [];
let currentFilter = 'all';
let currentSearch = '';

// --- Search Bar Toggle ---
if (searchToggleBtn && searchBar) {
  searchToggleBtn.addEventListener('click', () => {
    const expanded = searchBar.classList.toggle('hidden') ? false : true;
    searchBar.setAttribute('aria-expanded', expanded);
    if (!searchBar.classList.contains('hidden')) {
      setTimeout(() => searchInput && searchInput.focus(), 100);
    }
  });
}
if (searchClearBtn && searchInput) {
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    currentSearch = '';
    renderProjects(filterAndSearchProjects());
    searchInput.focus();
  });
}
if (searchInput) {
  searchInput.addEventListener('input', e => {
    currentSearch = e.target.value;
    renderProjects(filterAndSearchProjects());
  });
}

// --- Filter Buttons ---
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderProjects(filterAndSearchProjects());
  });
});

function filterAndSearchProjects() {
  let filtered = allProjects;
  if (currentFilter && currentFilter !== 'all') {
    filtered = filtered.filter(p => (p.categories || []).map(c => c.toLowerCase()).includes(currentFilter));
  }
  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q)) ||
      (p.badges && p.badges.some(b => b.label.toLowerCase().includes(q)))
    );
  }
  return filtered;
}

// --- Category Tag Click Filtering & Indicator ---
function handleCategoryClick(e) {
  if (e.target.classList.contains('category-tag')) {
    const cat = e.target.dataset.category;
    currentFilter = cat;
    // Update filter indicator
    const filterStatus = document.querySelector('.filter-status');
    if (filterStatus) {
      filterStatus.innerHTML = `Showing: <span class=\"font-bold text-brand-primary gradient-text\">${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>`;
    }
    // Remove active from all, add to clicked
    document.querySelectorAll('.category-tag').forEach(tag => tag.classList.remove('ring-2', 'ring-brand-primary', 'bg-brand-primary/10', 'text-brand-primary'));
    e.target.classList.add('ring-2', 'ring-brand-primary', 'bg-brand-primary/10', 'text-brand-primary');
    // Render filtered
    currentPage = 1;
    const filtered = filterAndSearchProjects();
    renderProjects(filtered);
  }
}

document.addEventListener('DOMContentLoaded', function() {
  fetchProjectsAuto().then(projects => {
    allProjects = projects;
    renderProjects(filterAndSearchProjects());
  });
  document.getElementById('projectGrid').addEventListener('click', handleCategoryClick);
});

// --- Pagination ---
let currentPage = 1;
const pageSize = 6;

function paginateProjects(projects, page = 1) {
  const total = projects.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return {
    projects: projects.slice(start, end),
    totalPages,
    currentPage: page
  };
}

function renderPagination(totalPages, currentPage) {
  const container = document.getElementById('paginationContainer');
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  let html = '<div class="flex justify-center gap-2 mt-8">';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="px-3 py-1 rounded-lg font-semibold ${i === currentPage ? 'bg-brand-primary text-white' : 'bg-white dark:bg-gray-800 text-brand-primary dark:text-brand-secondary'} shadow transition-all duration-200" data-page="${i}">${i}</button>`;
  }
  html += '</div>';
  container.innerHTML = html;
  // Add click listeners
  container.querySelectorAll('button[data-page]').forEach(btn => {
    btn.onclick = () => {
      currentPage = parseInt(btn.dataset.page);
      renderProjects(filterAndSearchProjects());
    };
  });
}

// --- Theme Toggle ---
if (themeToggleBtn) {
  function updateThemeIcon() {
    if (document.documentElement.classList.contains('dark')) {
      themeToggleBtn.querySelector('.light-icon').classList.add('hidden');
      themeToggleBtn.querySelector('.dark-icon').classList.remove('hidden');
    } else {
      themeToggleBtn.querySelector('.light-icon').classList.remove('hidden');
      themeToggleBtn.querySelector('.dark-icon').classList.add('hidden');
    }
  }
  themeToggleBtn.addEventListener('click', () => {
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    updateThemeIcon();
  });
  // On load, set theme from localStorage
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
  }
  updateThemeIcon();
}

// --- Back to Top Button ---
if (backToTopBtn) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 300) {
      backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
    } else {
      backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
    }
  });
  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// --- Back Button ---
if (backBtn) {
  window.goBack = function() { window.history.back(); };
}
