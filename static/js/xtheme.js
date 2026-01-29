    //This handles the time calculation, the 12/24-hour toggle, and the automatic theme logic for "Dynamic Mode."
    let is24Hour = true;
    let currentTheme = 'dark';
    let isDynamicMode = false;

    function updateClock() {
        const now = new Date();
        
        // Update Date
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('date-display').innerText = now.toLocaleDateString('en-US', options).toUpperCase();

        // Update Time
        let hours = now.getHours();
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        
        // Check for Dynamic Mode Theme Switching
        if (isDynamicMode) {
            if (hours >= 6 && hours < 18) {
                applyTheme('light');
            } else {
                applyTheme('dark');
            }
        }

        if (!is24Hour) {
            const ampm = hours >= 12 ? ' PM' : ' AM';
            hours = hours % 12 || 12;
            document.getElementById('time-display').innerText = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}${ampm}`;
        } else {
            document.getElementById('time-display').innerText = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
        }
    }

    function setTheme(theme) {
        if (isDynamicMode) return; // Prevent manual override if in Dynamic mode
        
        if (theme === 'system') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            applyTheme(prefersDark ? 'dark' : 'light');
        } else {
            applyTheme(theme);
        }
    }

    function applyTheme(theme) {
        document.body.className = `theme-${theme}`;
    }

    function toggleMode() {
        isDynamicMode = document.getElementById('mode-switch').checked;
    }

    // Click time to toggle format
    document.getElementById('time-display').addEventListener('click', () => {
        is24Hour = !is24Hour;
    });

    setInterval(updateClock, 1000);
    updateClock();
