// yonews.js
class NewsFeed {
    constructor() {
         this.currentCategory = 'all';  
        this.contentDiv = document.getElementById('content');
        this.articles = [];
        this.settings = this.loadSettings();
        this.currentPage = 1;
        this.selectedDate = null;
        this.searchQuery = '';
        this.isLoading = false;
        this.feedUrls = this.initializeFeedUrls();
        this.initializeComponents();
        this.setupEventListeners();
        this.loadNews('all');
    }

    initializeComponents() {
        this.setupCategoryListeners();
        this.setupSearchListeners();
        this.setupThemeToggle();
        this.setupBackToTop();
        this.setupOfflineDetection();
        this.setupSettingsPanel();
        this.setupLanguageSelector();
        this.setupDateFilter();
        this.setupInfiniteScroll();
        this.setupSourceIndicators();
        
        const allCategory = document.querySelector('.category[data-category="all"]');
        if (allCategory) {
            allCategory.classList.add('active');
        }
    }

    initializeFeedUrls() {
        return {
            international: {
                all: [
                    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
                    'https://feeds.feedburner.com/TechCrunch',
                    'https://www.thenation.com/subject/politics/feed/',
                    'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
                    'https://variety.com/feed/',
                    'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml'
                ],
                World: 'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
                Technology: 'https://feeds.feedburner.com/TechCrunch',
                politics: 'https://www.thenation.com/subject/politics/feed/',
                Sports: 'https://rss.nytimes.com/services/xml/rss/nyt/Sports.xml',
                Entertainment: 'https://variety.com/feed/',
                Health: 'https://rss.nytimes.com/services/xml/rss/nyt/Health.xml'
            },
            domestic: {
                all: [
                    'https://english.onlinekhabar.com/feed',
                    'https://english.onlinekhabar.com/category/political/feed',
                    'https://techpana.com/feed/',
                    'https://goalnepal.com/feed/',
                    'https://www.nepalisansar.com/entertainment/feed/',
                    'https://swasthyakhabar.com/feed/'
                ],
                World: 'https://english.onlinekhabar.com/feed',
                politics: 'https://english.onlinekhabar.com/category/political/feed',
                Technology: 'https://techpana.com/feed/',
                Sports: 'https://goalnepal.com/feed/',
                Entertainment: 'https://www.nepalisansar.com/entertainment/feed/',
                Health: 'https://swasthyakhabar.com/feed/'
            }
        };
    }

    loadSettings() {
        const defaultSettings = {
            newsSources: ['international', 'domestic'],
            articlesPerPage: 10,
            defaultLanguage: 'en',
            theme: 'dark',
            notifications: true,
            autoRefresh: false,
            refreshInterval: 300000 // 5 minutes
        };
        
        return JSON.parse(localStorage.getItem('newsSettings')) || defaultSettings;
    }

    saveSettings() {
        localStorage.setItem('newsSettings', JSON.stringify(this.settings));
        this.updateSourceIndicators();
    }

    setupLanguageSelector() {
        const languageSelect = document.getElementById('languageSelect');
        if (languageSelect) {
            languageSelect.value = this.settings.defaultLanguage;
            languageSelect.addEventListener('change', (e) => {
                this.settings.defaultLanguage = e.target.value;
                this.saveSettings();
                this.updateUILanguage();
                this.loadNews(this.currentCategory);
            });
        }
    }

    updateUILanguage() {
        const translations = {
            en: {
                searchPlaceholder: 'Search news...',
                loadingText: 'Loading news feed...',
                noResults: 'No results found',
                readMore: 'Read More'
                // Add more translations as needed
            },
            np: {
                searchPlaceholder: 'समाचार खोज्नुहोस्...',
                loadingText: 'समाचार लोड हुँदैछ...',
                noResults: 'कुनै नतिजा फेला परेन',
                readMore: 'थप पढ्नुहोस्'
                // Add more translations as needed
            }
        };

        const currentLang = translations[this.settings.defaultLanguage];
        document.querySelector('.search-input').placeholder = currentLang.searchPlaceholder;
        // Update other UI elements with translations
    }

    setupDateFilter() {
        const dateFilter = document.getElementById('dateFilter');
        if (dateFilter) {
            dateFilter.addEventListener('change', (e) => {
                this.selectedDate = e.target.value;
                this.currentPage = 1;
                this.loadNews(this.currentCategory);
            });
        }
    }

    setupSourceIndicators() {
        const sourceIndicator = document.querySelector('.source-indicator');
        this.updateSourceIndicators();
    }

    updateSourceIndicators() {
        const international = document.querySelector('.source-badge.international');
        const domestic = document.querySelector('.source-badge.domestic');

        if (international && domestic) {
            international.style.opacity = this.settings.newsSources.includes('international') ? '1' : '0.5';
            domestic.style.opacity = this.settings.newsSources.includes('domestic') ? '1' : '0.5';
        }
    }

    setupInfiniteScroll() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 1.0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    this.loadMoreArticles();
                }
            });
        }, options);

        // Add sentinel element
        const sentinel = document.createElement('div');
        sentinel.className = 'scroll-sentinel';
        this.contentDiv.appendChild(sentinel);
        observer.observe(sentinel);
    }

    async loadMoreArticles() {
        if (this.isLoading) return;
        
        this.currentPage++;
        await this.loadNews(this.currentCategory, true);
    }

    setupSettingsPanel() {
        const settingsHTML = `
            <div class="settings-content">
                <h2><i class="fas fa-cog"></i> News Settings</h2>
                <div class="settings-section">
                    <h3>News Sources</h3>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" id="internationalNews" 
                                ${this.settings.newsSources.includes('international') ? 'checked' : ''}>
                            International News
                        </label>
                        <label>
                            <input type="checkbox" id="domesticNews" 
                                ${this.settings.newsSources.includes('domestic') ? 'checked' : ''}>
                            Nepali News
                        </label>
                    </div>
                </div>
                <div class="settings-section">
                    <h3>Display Settings</h3>
                    <div class="setting-item">
                        <label for="articlesPerPage">Articles per page:</label>
                        <select id="articlesPerPage">
                            <option value="5" ${this.settings.articlesPerPage === 5 ? 'selected' : ''}>5</option>
                            <option value="10" ${this.settings.articlesPerPage === 10 ? 'selected' : ''}>10</option>
                            <option value="20" ${this.settings.articlesPerPage === 20 ? 'selected' : ''}>20</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="autoRefresh" 
                                ${this.settings.autoRefresh ? 'checked' : ''}>
                            Auto-refresh feed
                        </label>
                    </div>
                    <div class="setting-item">
                        <label>
                            <input type="checkbox" id="notifications" 
                                ${this.settings.notifications ? 'checked' : ''}>
                            Show notifications
                        </label>
                    </div>
                </div>
                <div class="button-group">
                    <button class="save-settings">Save Settings</button>
                    <button class="close-settings">Cancel</button>
                </div>
            </div>
        `;

        const modal = document.createElement('div');
        modal.className = 'settings-modal';
        modal.innerHTML = settingsHTML;
        document.body.appendChild(modal);

        this.setupSettingsEventListeners(modal);
    }

    setupSettingsEventListeners(modal) {
        const settingsBtn = document.createElement('button');
        settingsBtn.innerHTML = '<i class="fas fa-cog"></i>';
        settingsBtn.className = 'settings-button';
        document.querySelector('.header-controls').appendChild(settingsBtn);

        settingsBtn.addEventListener('click', () => {
            modal.style.display = 'flex';
        });

        modal.querySelector('.close-settings').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.querySelector('.save-settings').addEventListener('click', () => {
            this.updateSettings(modal);
            modal.style.display = 'none';
            this.loadNews(this.currentCategory);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

     updateSettings(modal) {
        const previousSources = [...this.settings.newsSources];
        this.settings.newsSources = [];
        
        if (modal.querySelector('#internationalNews').checked) {
            this.settings.newsSources.push('international');
        }
        if (modal.querySelector('#domesticNews').checked) {
            this.settings.newsSources.push('domestic');
        }

        // Ensure at least one source is selected
        if (this.settings.newsSources.length === 0) {
            this.settings.newsSources = previousSources;
            this.showError('Please select at least one news source.');
            return;
        }

        this.settings.articlesPerPage = parseInt(modal.querySelector('#articlesPerPage').value);
        this.settings.autoRefresh = modal.querySelector('#autoRefresh').checked;
        this.settings.notifications = modal.querySelector('#notifications').checked;

        this.saveSettings();

        if (this.settings.autoRefresh) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }

        // Reload news with current category to reflect changes
        this.currentPage = 1;
        this.loadNews(this.currentCategory);
    }

    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        this.refreshInterval = setInterval(() => {
            this.loadNews(this.currentCategory);
        }, this.settings.refreshInterval);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
    }

    setupSearchListeners() {
        const searchInput = document.querySelector('.search-input');
        const searchButton = document.querySelector('.search-button');

        const performSearch = () => {
            this.searchQuery = searchInput.value.toLowerCase().trim();
            this.currentPage = 1;
            this.loadNews(this.currentCategory);
        };

        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        // Add debounced search for typing
        let debounceTimer;
        searchInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(performSearch, 500);
        });
    }

    setupCategoryListeners() {
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            category.addEventListener('click', (e) => {
                categories.forEach(cat => cat.classList.remove('active'));
                e.target.classList.add('active');
                this.currentCategory = e.target.dataset.category;
                this.currentPage = 1;
                this.loadNews(this.currentCategory);
            });
        });
    }

    getRssFeed(category) {
        const selectedFeeds = [];

        if (category === 'all') {
            // For 'all' category, get all feeds from selected sources
            this.settings.newsSources.forEach(source => {
                selectedFeeds.push(...this.feedUrls[source].all);
            });
        } else {
            // For specific categories, get relevant feeds from selected sources
            this.settings.newsSources.forEach(source => {
                if (this.feedUrls[source][category]) {
                    selectedFeeds.push(this.feedUrls[source][category]);
                }
            });
        }

        return selectedFeeds;
    }

    async loadNews(category, append = false) {
        if (this.isLoading) return;
        this.isLoading = true;

        if (!append) {
            this.showLoading();
        }

        try {
            const feeds = this.getRssFeed(category);
            if (feeds.length === 0) {
                this.showError('Please select at least one news source in settings.');
                return;
            }

            const apiKey = 'ezon9pyg8liyojj8woxldkqi7xs0tkibnumlgfox';
            const promises = feeds.map(feed => 
                fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feed)}&api_key=${apiKey}`)
                    .then(response => response.json())
            );

            const results = await Promise.all(promises);
            let allArticles = [];

            results.forEach(data => {
                if (data.status === 'ok') {
                    allArticles.push(...data.items.map(item => ({
                        ...item,
                        source: data.feed.title
                    })));
                }
            });

            // Remove duplicates based on title
            allArticles = this.removeDuplicates(allArticles, 'title');

            // Apply filters
            if (this.searchQuery) {
                allArticles = this.filterArticlesBySearch(allArticles);
            }

            if (this.selectedDate) {
                allArticles = this.filterArticlesByDate(allArticles);
            }

            // Sort articles by date
            allArticles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

            // Pagination
            const start = (this.currentPage - 1) * this.settings.articlesPerPage;
            const end = start + this.settings.articlesPerPage;
            const paginatedArticles = allArticles.slice(start, end);

            if (append) {
                this.articles.push(...paginatedArticles);
            } else {
                this.articles = paginatedArticles;
            }

            this.displayNews(this.articles, append);

            if (this.settings.notifications && !append && this.articles.length > 0) {
                this.showNotification('New articles available');
            }

        } catch (error) {
            this.showError('Failed to load news feed. Please try again later.');
            console.error('Error loading news:', error);
        } finally {
            this.isLoading = false;
        }
    }

    removeDuplicates(articles, key) {
        const seen = new Set();
        return articles.filter(article => {
            const value = article[key].toLowerCase();
            if (seen.has(value)) {
                return false;
            }
            seen.add(value);
            return true;
        });
    }
    filterArticlesBySearch(articles) {
        return articles.filter(article => {
            return article.title.toLowerCase().includes(this.searchQuery) ||
                   article.description.toLowerCase().includes(this.searchQuery);
        });
    }

    filterArticlesByDate(articles) {
        const selectedDate = new Date(this.selectedDate);
        return articles.filter(article => {
            const articleDate = new Date(article.pubDate);
            return articleDate.toDateString() === selectedDate.toDateString();
        });
    }

    showNotification(message) {
        if (!("Notification" in window)) return;

        if (Notification.permission === "granted") {
            new Notification("Yo News", { body: message });
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission().then(permission => {
                if (permission === "granted") {
                    new Notification("Yo News", { body: message });
                }
            });
        }
    }
//  displayNews method where it was cut off...
  displayNews(articles, append = false) {
    if (articles.length === 0) {
        this.showNoResults();
        return;
    }

    const newsHTML = articles.map(article => `
        <div class="news-card" data-source="${article.source}">
            ${article.thumbnail ? `
                <div class="news-image">
                    <img src="${article.thumbnail}" 
                         alt="${article.title}"
                         onerror="this.onerror=null;this.src='placeholder-news.jpg';">
                </div>
            ` : ''}
            <div class="news-content">
                <div class="news-meta">
                    <span class="news-source">
                        <i class="fas fa-newspaper"></i> ${article.source}
                    </span>
                    <span class="news-date">
                        <i class="far fa-clock"></i> ${this.formatDate(article.pubDate)}
                    </span>
                </div>
                <h3 class="news-title">${article.title}</h3>
                <p class="news-description">${article.description}</p>
                <div class="news-footer">
                    <a href="${article.link}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="read-more">
                        ${this.getTranslation('readMore')} <i class="fas fa-external-link-alt"></i>
                    </a>
                </div>
            </div>
        </div>
    `).join('');

    if (append) {
        this.contentDiv.insertAdjacentHTML('beforeend', newsHTML);
    } else {
        this.contentDiv.innerHTML = newsHTML;
    }
 }

 showLoading() {
    this.contentDiv.innerHTML = `
        <div class="notification-card">
            <div class="loading pulse">
                <i class="fas fa-spinner fa-spin"></i> ${this.getTranslation('loadingText')}
            </div>
        </div>
    `;
 }

 showNoResults() {
    this.contentDiv.innerHTML = `
        <div class="notification-card">
            <div class="no-results">
                <i class="fas fa-search"></i>
                <p>${this.getTranslation('noResults')}</p>
            </div>
        </div>
    `;
 }

 showError(message) {
    this.contentDiv.innerHTML = `
        <div class="notification-card error">
            <div class="error-message">
                <i class="fas fa-exclamation-circle"></i>
                <p>${message}</p>
            </div>
        </div>
    `;
 }

 formatDate(dateString) {
    const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(
        this.settings.defaultLanguage === 'np' ? 'ne-NP' : 'en-US', 
        options
    );
 }

 getTranslation(key) {
    const translations = {
        en: {
            searchPlaceholder: 'Search news...',
            loadingText: 'Loading news feed...',
            noResults: 'No results found',
            readMore: 'Read More'
        },
        np: {
            searchPlaceholder: 'समाचार खोज्नुहोस्...',
            loadingText: 'समाचार लोड हुँदैछ...',
            noResults: 'कुनै नतिजा फेला परेन',
            readMore: 'थप पढ्नुहोस्'
        }
    };
    return translations[this.settings.defaultLanguage][key];
 }

 setupThemeToggle() {
    const themeToggle = document.getElementById('themeToggle');
    const htmlElement = document.documentElement;
    
    // Set initial state
    themeToggle.checked = this.settings.theme === 'dark';
    htmlElement.setAttribute('data-theme', this.settings.theme);

    themeToggle.addEventListener('change', () => {
        this.settings.theme = themeToggle.checked ? 'dark' : 'light';
        htmlElement.setAttribute('data-theme', this.settings.theme);
        this.saveSettings();
    });
 }

 setupBackToTop() {
    const backToTop = document.getElementById('backToTop');
    
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 100) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });

    backToTop.addEventListener('click', (e) => {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
 }

 setupOfflineDetection() {
    const overlay = document.getElementById('overlay');

    window.addEventListener('online', () => {
        overlay.style.display = 'none';
        this.loadNews(this.currentCategory);
    });

    window.addEventListener('offline', () => {
        overlay.style.display = 'flex';
    });
 }
}
// Initialize the news feed
document.addEventListener('DOMContentLoaded', () => {
    const newsFeed = new NewsFeed();
});
