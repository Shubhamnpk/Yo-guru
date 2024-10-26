// Configuration
const config = {
downloadUrl: 'https://github.com/Shubhamnpk/Yo-guru/releases/download/0.0.1.23/app2493596-ft3z8p.apk',
betaUrl: 'https://example.com/beta',
countdownDuration: 3,
toastDuration: 3000,
isBetaAvailable: false, // set this value true when we have beta project 
};

// Utility functions
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const showElement = (element) => element.style.display = 'block';
const hideElement = (element) => element.style.display = 'none';

const toggleBlur = (shouldBlur) => {
$('#mainContainer').classList.toggle('blur-effect', shouldBlur);
};

// Internet connection check
function checkInternetConnection() {
const isOnline = navigator.onLine;
toggleBlur(!isOnline);
$('#internetMessage').style.display = isOnline ? 'none' : 'block';
return isOnline;
}

// Event listeners for online/offline events
['online', 'offline'].forEach(event => {
window.addEventListener(event, checkInternetConnection);
});

// Download functionality
$('#downloadBtn').addEventListener('click', (e) => {
e.preventDefault();
if (checkInternetConnection()) {
toggleBlur(true);
showElement($('#redirectMessage'));
startCountdown();
} else {
showToast('Please check your internet connection', 'error');
}
});

// Close button for redirect message
$('#closeBtn').addEventListener('click', () => {
toggleBlur(false);
hideElement($('#redirectMessage'));
});

// Retry button functionality
$('#retryBtn').addEventListener('click', startCountdown);

// Countdown functionality
function startCountdown() {
let timeLeft = config.countdownDuration;
const countdownElement = $('#countdown');
const progressBar = $('.progress');

const updateCountdown = () => {
if (timeLeft <= 0) {
    clearInterval(countdownInterval);
    try {
        window.location.href = config.downloadUrl;
    } catch (error) {
        console.error('Error redirecting:', error);
        showToast('Error starting download. Please try again.', 'error');
    }
} else {
    countdownElement.textContent = `${timeLeft} second${timeLeft !== 1 ? 's' : ''} remaining`;
    progressBar.style.width = `${(config.countdownDuration - timeLeft) / config.countdownDuration * 100}%`;
    timeLeft--;
}
};

const countdownInterval = setInterval(updateCountdown, 1000);
updateCountdown(); // Initial call to avoid delay
}

// Beta tester functionality
$('#betaTesterLink').addEventListener('click', (e) => {
e.preventDefault();
if (config.isBetaAvailable) {
if (checkInternetConnection()) {
    toggleBlur(true);
    showElement($('#betaTesterMenu'));
} else {
    showToast('Please check your internet connection', 'error');
}
} else {
showToast('Beta program is not available yet. Stay tuned!', 'info');
}
});

$('#yesBtn').addEventListener('click', () => {
if (config.isBetaAvailable) {
try {
    window.location.href = config.betaUrl;
} catch (error) {
    console.error('Error redirecting to beta:', error);
    showToast('Error joining beta program. Please try again.', 'error');
}
} else {
showToast('Beta program is not available yet. Stay tuned!', 'info');
}
toggleBlur(false);
hideElement($('#betaTesterMenu'));
});

$('#noBtn').addEventListener('click', () => {
toggleBlur(false);
hideElement($('#betaTesterMenu'));
});

// Toast notification
function showToast(message, type = 'info') {
const toast = document.createElement('div');
toast.className = `toast ${type}`;
toast.innerHTML = `<i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>${message}`;
document.body.appendChild(toast);

setTimeout(() => toast.classList.add('show'), 100);

setTimeout(() => {
toast.classList.remove('show');
setTimeout(() => document.body.removeChild(toast), 300);
}, config.toastDuration);
}

// GSAP animations
gsap.from('.card', {
duration: 1,
y: 50,
opacity: 0,
stagger: 0.2,
ease: 'power3.out'
});

// Version history button functionality
$('#versionHistoryBtn').addEventListener('click', (e) => {
e.preventDefault();
showToast('Version history coming soon!', 'info');
});

// Initialize
window.addEventListener('load', () => {
checkInternetConnection();
// You can add more initialization logic here if needed
});
