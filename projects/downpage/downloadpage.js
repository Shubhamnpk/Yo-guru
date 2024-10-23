document.addEventListener('DOMContentLoaded', function() {
    const mainContainer = document.getElementById('mainContainer');
    const downloadBtn = document.getElementById('downloadBtn');
    const versionHistoryBtn = document.getElementById('versionHistoryBtn');
    const betaTesterLink = document.getElementById('betaTesterLink');
    const redirectMessage = document.getElementById('redirectMessage');
    const betaTesterMenu = document.getElementById('betaTesterMenu');
    const internetMessage = document.getElementById('internetMessage');

    function checkInternetConnection() {
        if (!navigator.onLine) {
            showMessage(internetMessage);
            mainContainer.classList.add('blur-effect');
            setTimeout(checkInternetConnection, 3000);
        } else {
            hideMessage(internetMessage);
            mainContainer.classList.remove('blur-effect');
        }
    }

    function showMessage(messageElement) {
        gsap.to(messageElement, { duration: 0.3, opacity: 1, display: 'block', ease: 'power2.out' });
    }

    function hideMessage(messageElement) {
        gsap.to(messageElement, { duration: 0.3, opacity: 0, display: 'none', ease: 'power2.in' });
    }

    function showToast(message, icon = 'fa-info-circle') {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.innerHTML = `<i class="fas ${icon}"></i>${message}`;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    }

    downloadBtn.addEventListener('click', function(event) {
        event.preventDefault();
        showMessage(redirectMessage);
        mainContainer.classList.add('blur-effect');

        let progress = 0;
        const progressElement = redirectMessage.querySelector('.progress');
        const countdownElement = document.getElementById('countdown');

        const progressInterval = setInterval(() => {
            progress += 1;
            progressElement.style.width = `${progress}%`;
            countdownElement.textContent = `${Math.ceil(3 - (progress / 100) * 3)} seconds remaining`;

            if (progress >= 100) {
                clearInterval(progressInterval);
                window.location.href = "https://github.com/Shubhamnpk/Yo-guru/releases/download/0.0.1.23/app2493596-ft3z8p.apk";
            }
        }, 30);
    });

    versionHistoryBtn.addEventListener('click', function(event) {
        event.preventDefault();
        showToast('Redirecting to version history...', 'fa-history');
        setTimeout(() => {
            window.location.href = "https://github.com/Shubhamnpk/Yo-guru/releases";
        }, 1500);
    });

    betaTesterLink.addEventListener('click', function(event) {
        event.preventDefault();
        showMessage(betaTesterMenu);
        mainContainer.classList.add('blur-effect');
    });

    document.getElementById('yesBtn').addEventListener('click', function(event) {
        event.preventDefault();
        hideMessage(betaTesterMenu);
        mainContainer.classList.remove('blur-effect');
        showToast('Welcome to the Beta Program!', 'fa-flask');
        setTimeout(() => {
            window.location.href = "/betatester.html";
        }, 1500);
    });

    document.getElementById('noBtn').addEventListener('click', function(event) {
        event.preventDefault();
        hideMessage(betaTesterMenu);
        mainContainer.classList.remove('blur-effect');
        showToast('Maybe next time!', 'fa-thumbs-up');
    });

    document.getElementById('retryBtn').addEventListener('click', function(event) {
        event.preventDefault();
        hideMessage(redirectMessage);
        mainContainer.classList.remove('blur-effect');
        showToast('Retrying download...', 'fa-redo');
    });

    document.getElementById('closeBtn').addEventListener('click', function(event) {
        event.preventDefault();
        hideMessage(redirectMessage);
        mainContainer.classList.remove('blur-effect');
    });

    // Animate cards on page load
    gsap.from('.card', {
        duration: 0.8,
        opacity: 0,
        y: 50,
        stagger: 0.2,
        ease: 'power3.out'
    });

    // Animate header on scroll
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const header = document.querySelector('header');

        if (scrollTop > lastScrollTop) {
            // Scrolling down
            gsap.to(header, { duration: 0.3, y: '-100%', ease: 'power2.inOut' });
        } else {
            // Scrolling up
            gsap.to(header, { duration: 0.3, y: '0%', ease: 'power2.inOut' });
        }

        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
    }, false);

    checkInternetConnection();
});
