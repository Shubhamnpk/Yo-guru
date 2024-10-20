        const themeToggle = document.getElementById('themeToggle');
        const html = document.documentElement;
        const backToTop = document.getElementById('backToTop');
        const loading = document.getElementById('loading');

        // Theme toggle functionality
        themeToggle.addEventListener('change', () => {
            html.setAttribute('data-theme', themeToggle.checked ? 'light' : 'dark');
        });

        // Back to top functionality
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        });

        backToTop.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        // Network connection check
        function checkNetworkConnection() {
            var overlay = document.getElementById('overlay');
            var content = document.getElementById('content');

            if (navigator.onLine) {
                overlay.style.display = 'none';
                content.style.filter = 'none';
            } else {
                overlay.style.display = 'flex';
                content.style.filter = 'blur(5px)';
            }
        }

        // Loading indicator
        window.addEventListener('load', function () {
            checkNetworkConnection();
            window.addEventListener('online', checkNetworkConnection);
            window.addEventListener('offline', checkNetworkConnection);

            // Hide loading indicator after a short delay
            setTimeout(() => {
                loading.style.display = 'none';
            }, 2000);
        });

        function handleOfflineClick() {
            alert('You are currently offline. Please connect to the Internet to access this Web page.');
        }

        // Search functionality (placeholder)
        const searchButton = document.querySelector('.search-button');
        searchButton.addEventListener('click', () => {
            alert('Comming soon.');
        });

        // Category selection (placeholder)
        const categories = document.querySelectorAll('.category');
        categories.forEach(category => {
            category.addEventListener('click', () => {
                alert(`You selected the ${category.textContent} category. ()Comming soon `);
            });
        });

        // Simulated weather widget
        const weatherWidget = document.querySelector('.weather-widget p');
        setTimeout(() => {
            weatherWidget.innerHTML = '🌤️ 22°C | Partly Cloudy (Comming soon)';
        }, 1500);
