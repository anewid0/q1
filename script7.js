document.addEventListener("DOMContentLoaded", () => {
    const audio = document.getElementById("recitationAudio");
    const repeatBtn = document.getElementById("repeatBtn");
    const scrollTopBtn = document.getElementById("scrollTopBtn");
    const gridItems = Array.from(document.querySelectorAll(".grid-item"));
    
    let isRepeatEnabled = false;
    let wakeLock = null;

    // 1. Setup Audio Timing Metadata Structures (Sorted chronologically)
    gridItems.sort((a, b) => parseFloat(a.dataset.time) - parseFloat(b.dataset.time));

    // 2. Safe Auto-Play Handler (Bypasses rigid browser interactions blocks)
    const startAutoplay = () => {
        audio.play().then(() => {
            requestWakeLock();
        }).catch(() => {
            // If the browser blocks auto-playback, start it gracefully upon first user touch/click
            document.body.addEventListener('click', () => {
                audio.play();
                requestWakeLock();
            }, { once: true });
        });
    };
    
    startAutoplay();

    // 3. Audio Time Update Engine (Controls Active Highlight & Auto Scroll)
    audio.addEventListener("timeupdate", () => {
        const currentTime = audio.currentTime;
        let currentActiveItem = null;

        // Trace current timestamp position matching the grid map
        for (let i = 0; i < gridItems.length; i++) {
            const itemTime = parseFloat(gridItems[i].dataset.time);
            const nextItemTime = gridItems[i + 1] ? parseFloat(gridItems[i + 1].dataset.time) : Infinity;

            if (currentTime >= itemTime && currentTime < nextItemTime) {
                currentActiveItem = gridItems[i];
                break;
            }
        }

        // Apply visual zoom and automatically smooth-scroll to it
        gridItems.forEach(item => item.classList.remove("active"));
        if (currentActiveItem) {
            currentActiveItem.classList.add("active");
            currentActiveItem.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });
        }
    });

    // 4. Manual Matrix Navigation Clicking
    gridItems.forEach(item => {
        item.addEventListener("click", () => {
            const targetTime = parseFloat(item.dataset.time);
            audio.currentTime = targetTime;
            if (audio.paused) {
                audio.play();
            }
        });
    });

    // 5. Seamless Looping and Toggle Engine (No Alerts)
    repeatBtn.addEventListener("click", () => {
        isRepeatEnabled = !isRepeatEnabled;
        repeatBtn.textContent = isRepeatEnabled ? "دوبارہ چلائیں: آن" : "دوبارہ چلائیں: بند";
    });

    audio.addEventListener("ended", () => {
        if (isRepeatEnabled) {
            audio.currentTime = 0;
            audio.play();
        } else {
            // Default loop behavior request met silently
            audio.currentTime = 0;
            audio.play();
        }
    });

    // 6. Page Visibility Listener (Pause on inactivity / Resume on focus)
    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            audio.pause();
            releaseWakeLock();
        } else {
            audio.play().then(() => {
                requestWakeLock();
            });
        }
    });

    // 7. Screen Wake Lock API (Inhibits system Screen Savers or Dimming)
    async function requestWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                wakeLock = await navigator.wakeLock.request('screen');
            } catch (err) {
                console.warn(`Wake Lock request failed: ${err.message}`);
            }
        }
    }

    function releaseWakeLock() {
        if (wakeLock !== null) {
            wakeLock.release();
            wakeLock = null;
        }
    }

    // Re-verify Wake Lock permissions if focus moves back to viewport windows
    document.addEventListener('visibilitychange', async () => {
        if (wakeLock !== null && document.visibilityState === 'visible') {
            requestWakeLock();
        }
    });

    // 8. Back To Top Component Operations
    window.addEventListener("scroll", () => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add("show");
        } else {
            scrollTopBtn.classList.remove("show");
        }
    });

    scrollTopBtn.addEventListener("click", () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    });
});
