const CONFIG = {
    defaultTheme: "default",
    themes: [
        { id: "default", name: "Default", color: "#b44242", video: "assets/default.mp4" },
        { id: "raven", name: "Raven", color: "#a995ff", video: "assets/raven.mp4" },
        { id: "higuruma", name: "Higuruma", color: "#fffd95", video: "assets/higuruma.mp4" },
        { id: "winter-25", name: "Winter 25", color: "#95fff1", video: "assets/winter.mp4" }
    ],
    lastFm: {
        username: "mettaneko",
        limit: 1
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const htmlEl = document.documentElement;
    const themeBtn = document.getElementById('themeToggleBtn');
    const bgVideo = document.getElementById('bgVideo');
    const bgVideoSource = document.getElementById('bgVideoSource');

    const savedTheme = localStorage.getItem("theme");
    const normalizedSavedTheme = savedTheme === "winter" ? "winter-25" : savedTheme;
    let currentThemeIndex = CONFIG.themes.findIndex(t => t.id === (normalizedSavedTheme || CONFIG.defaultTheme));
    if (currentThemeIndex === -1) currentThemeIndex = 0;

    function updateThemeOptionsUI(themeId) {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(opt => {
            if (opt.getAttribute('data-theme') === themeId) {
                opt.classList.add('active');
            } else {
                opt.classList.remove('active');
            }
        });
    }

    function renderThemeSelector() {
        const container = document.getElementById('themeSelector');
        if (!container) return;
        container.innerHTML = '';

        CONFIG.themes.forEach(theme => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = `theme-option ${theme.id === CONFIG.themes[currentThemeIndex].id ? 'active' : ''}`;
            btn.setAttribute('data-theme', theme.id);
            btn.innerHTML = `
                <span class="theme-dot" style="background-color: ${theme.color};"></span>
                <span>${theme.name}</span>
            `;
            btn.addEventListener('click', () => {
                const idx = CONFIG.themes.findIndex(t => t.id === theme.id);
                if (idx !== -1 && idx !== currentThemeIndex) {
                    currentThemeIndex = idx;
                    applyTheme(currentThemeIndex, true);
                }
            });
            container.appendChild(btn);
        });
    }

    function applyTheme(index, animateVideo = false) {
        const theme = CONFIG.themes[index];
        htmlEl.setAttribute("data-theme", theme.id);
        localStorage.setItem("theme", theme.id);
        updateThemeOptionsUI(theme.id);

        if (animateVideo) {
            bgVideo.classList.add("fade-out");
            setTimeout(() => {
                const wasMuted = bgVideo.muted;
                const wasPaused = bgVideo.paused;
                bgVideoSource.src = theme.video;
                bgVideo.load();
                bgVideo.muted = wasMuted;
                if (!wasPaused) bgVideo.play().catch(e => console.error(e));
                bgVideo.classList.remove("fade-out");
            }, 360);
        } else {
            bgVideoSource.src = theme.video;
            bgVideo.load();
        }
    }

    renderThemeSelector();
    applyTheme(currentThemeIndex, false);

    // Support quick toggle button if present
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            currentThemeIndex = (currentThemeIndex + 1) % CONFIG.themes.length;
            applyTheme(currentThemeIndex, true);
        });
    }

    const introOverlay = document.getElementById('introOverlay');
    const masterVolumeSlider = document.getElementById('masterVolume');

    let currentMasterVolume = parseFloat(localStorage.getItem('masterVolume')) || 0.5;
    masterVolumeSlider.value = currentMasterVolume;

    bgVideo.volume = currentMasterVolume;

    introOverlay.addEventListener('click', () => {
        introOverlay.classList.add('hidden');
        bgVideo.muted = false;
        bgVideo.play().catch(e => {
            bgVideo.muted = true;
            bgVideo.play();
        });
    });

    masterVolumeSlider.addEventListener('input', (e) => {
        currentMasterVolume = parseFloat(e.target.value);
        localStorage.setItem('masterVolume', currentMasterVolume);
        bgVideo.volume = currentMasterVolume;
    });

    let fadeInterval;
    function fadeVideoVolume(targetVolume) {
        clearInterval(fadeInterval);
        fadeInterval = setInterval(() => {
            if (Math.abs(bgVideo.volume - targetVolume) < 0.05) {
                bgVideo.volume = targetVolume;
                clearInterval(fadeInterval);
            } else {
                bgVideo.volume += (targetVolume > bgVideo.volume ? 0.05 : -0.05);
            }
        }, 50);
    }

    const trackPlayBtn = document.getElementById('trackPlayBtn');
    const playOverlay = document.getElementById('playOverlay');
    let currentTrackUrl = null;



    const trackEl = document.getElementById('lastfmTrack');
    const artistEl = document.getElementById('lastfmArtist');
    const coverEl = document.getElementById('lastfmCover');
    const statusEl = document.getElementById('lastfmStatus');
    const linkEl = document.getElementById('lastfmLink');



        function fetchLastFmData() {
        const { username, limit } = CONFIG.lastFm;
        const proxyUrl = `https://mettaneko-steam-proxy.vercel.app/api/lastfm?user=${username}&limit=${limit}`;

        fetch(proxyUrl)
            .then(res => res.json())
            .then(async data => {
                if (data?.recenttracks?.track?.length > 0) {
                    const track = data.recenttracks.track[0];
                    const artist = track.artist['#text'];
                    const songName = track.name;
                    const albumCover = track.image.find(img => img.size === 'large' && img['#text'])?.['#text'] || 'assets/on_off.png';
                    const isNowPlaying = track['@attr']?.nowplaying === 'true';

                    trackEl.textContent = songName;
                    artistEl.textContent = artist;
                    coverEl.src = albumCover;
                    statusEl.textContent = isNowPlaying ? '● Listening now' : '● Last played';

                    const query = encodeURIComponent(`${artist} ${songName}`);
                    linkEl.href = `https://music.yandex.ru/search?text=${query}`;

                    if (playOverlay) {
                        playOverlay.classList.add('hidden');
                    }
                } else {
                    trackEl.textContent = 'No recent tracks';
                    artistEl.textContent = '---';
                    coverEl.src = 'assets/on_off.png';
                    statusEl.textContent = '● Offline';
                    if (playOverlay) playOverlay.classList.add('hidden');
                }
            })
            .catch(err => {
                console.error('Last.fm fetch error:', err);
            });
    }


    fetchLastFmData();
    setInterval(fetchLastFmData, 15000);


    const musicCard = document.getElementById('cardMusic');
    if (musicCard) {
        musicCard.style.cursor = 'pointer';
        musicCard.addEventListener('click', (e) => {
            if (e.target.closest('a')) return; // don't double trigger if clicking the title link
            const url = document.getElementById('lastfmLink')?.href;
            if (url && url !== '#' && !url.endsWith('#')) {
                window.open(url, '_blank', 'noopener,noreferrer');
            }
        });
    }

    const steamGameEl = document.getElementById('steamGame');
    const steamHoursEl = document.getElementById('steamHours');
    const steamCoverEl = document.getElementById('steamCover');

    function fetchSteamData() {
        const proxyUrl = 'https://mettaneko-steam-proxy.vercel.app/api/steam/recent-games';
        if (!steamGameEl) return;

        fetch(proxyUrl)
            .then(res => {
                if (!res.ok) throw new Error('Steam API fetch failed');
                return res.json();
            })
            .then(data => {
                if (data?.response?.games?.length > 0) {
                    const game = data.response.games[0];
                    const gameName = game.name;
                    const playtimeHours = (game.playtime_2weeks / 60).toFixed(1);
                    const gameCoverUrl = `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${game.appid}/header.jpg`;

                    steamGameEl.textContent = gameName;
                    steamHoursEl.textContent = `● ${playtimeHours} hrs (past 2 weeks)`;
                    steamCoverEl.src = gameCoverUrl;
                } else {
                    steamGameEl.textContent = 'NO DATA';
                    steamHoursEl.textContent = 'Steam Profile Private / Empty';
                    steamCoverEl.src = 'assets/on_off.png';
                }
            })
            .catch(err => console.error('Steam Proxy error:', err));
    }

    fetchSteamData();
    setInterval(fetchSteamData, 5 * 60 * 1000);


    const filterTabsContainer = document.getElementById('filterTabsContainer');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const filterSlider = document.getElementById('filterSlider');
    const searchInput = document.getElementById('projectSearch');
    const projectItems = document.querySelectorAll('.project-item');
    const projectsList = document.querySelector('.projects-list');
    let currentTag = 'all';

    function updateSlider(tab) {
        if (!filterSlider || !filterTabsContainer) return;

        const left = tab.offsetLeft;
        const top = tab.offsetTop;
        const width = tab.offsetWidth;
        const height = tab.offsetHeight;

        filterSlider.style.transform = `translate(${left}px, ${top}px)`;
        filterSlider.style.width = `${width}px`;
        filterSlider.style.height = `${height}px`;


        const activeColor = tab.getAttribute('data-color');
        filterTabs.forEach(t => t.style.color = '');
        tab.style.color = activeColor;
    }

    function applyFilters() {
        if (!projectsList) return;
        const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

        projectsList.style.opacity = '0';

        setTimeout(() => {
            projectItems.forEach(item => {
                const rawTags = item.getAttribute('data-tag') || '';
                const tags = rawTags.toLowerCase().split(/\s+/);
                const title = item.querySelector('.card-title')?.textContent.toLowerCase() || '';
                const desc = item.querySelector('.card-desc')?.textContent.toLowerCase() || '';
                const badges = Array.from(item.querySelectorAll('.badge')).map(b => b.textContent.toLowerCase()).join(' ');

                const matchTag = (currentTag === 'all' || tags.includes(currentTag));
                const matchSearch = (!query || title.includes(query) || desc.includes(query) || badges.includes(query));

                if (matchTag && matchSearch) {
                    item.style.display = 'flex';
                } else {
                    item.style.display = 'none';
                    item.classList.remove('is-expanded');
                }
            });
            projectsList.style.opacity = '1';
        }, 250);
    }

    // Expandable Project Cards & Action Buttons
    projectItems.forEach(card => {
        card.addEventListener('click', (e) => {
            // Do not toggle expansion if user clicked an action button
            if (e.target.closest('.project-btn')) return;

            // Do not toggle expansion if user is selecting/copying text
            const selection = window.getSelection();
            if (selection && selection.toString().trim().length > 0) return;

            card.classList.toggle('is-expanded');
        });

        // Accessibility: allow Enter/Space to expand/collapse card
        card.addEventListener('keydown', (e) => {
            if ((e.key === 'Enter' || e.key === ' ') && e.target === card) {
                e.preventDefault();
                card.classList.toggle('is-expanded');
            }
        });
    });

    if (filterTabs.length > 0 && searchInput) {

        const activeTab = document.querySelector('.filter-tab.active') || filterTabs[0];

        setTimeout(() => updateSlider(activeTab), 50);

        filterTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                filterTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');

                updateSlider(tab);

                currentTag = tab.getAttribute('data-filter');
                applyFilters();
            });
        });
        searchInput.addEventListener('input', applyFilters);


        window.addEventListener('resize', () => {
            const currentTab = document.querySelector('.filter-tab.active');
            if (currentTab) updateSlider(currentTab);
        });
    }

    const defaultModules = [
        { id: 'cardProfile', name: 'Profile', toggleable: false, visible: true },
        { id: 'cardSocials', name: 'Social Links', toggleable: true, visible: true },
        { id: 'cardTech', name: 'Tech Stack', toggleable: true, visible: true },
        { id: 'cardProjects', name: 'Projects', toggleable: true, visible: true },
        { id: 'cardMusic', name: 'Yandex Music', toggleable: true, visible: true },
        { id: 'cardGame', name: 'Steam', toggleable: true, visible: true },
        { id: 'cardWebring', name: 'Webring', toggleable: true, visible: false },
        { id: 'cardBadges', name: 'Badges', toggleable: true, visible: false },
        { id: 'cardSettings', name: 'Settings', toggleable: false, visible: false }
    ];

    let modules = JSON.parse(localStorage.getItem('bentoModulesData_v4'));
    if (!modules || modules.length !== defaultModules.length) {
        modules = defaultModules;
    }

    const settingsContent = document.getElementById('settingsContent') || document.getElementById('settingsList');
    const settingsList = document.getElementById('settingsList');
    const settingsTitle = document.getElementById('settingsTitle');
    const settingsArrow = document.getElementById('settingsArrow');


    if (settingsTitle && settingsContent) {
        document.getElementById('settingsTitle').addEventListener('click', () => {
            const toggleAccordion = () => {
                settingsContent.classList.toggle('hidden-module');
                if (settingsContent.classList.contains('hidden-module')) {
                    settingsArrow.style.transform = 'rotate(0deg)';
                } else {
                    settingsArrow.style.transform = 'rotate(180deg)';
                }
            };

            if (document.startViewTransition) {
                document.startViewTransition(toggleAccordion);
            } else {
                toggleAccordion();
            }
        });
    }

    const resetSettingsBtn = document.getElementById('resetSettingsBtn');

    if (resetSettingsBtn) {
        resetSettingsBtn.addEventListener('click', (e) => {
            e.stopPropagation();

            // Keep Settings card open during reset!
            const isSettingsVisible = modules.find(m => m.id === 'cardSettings')?.visible || true;
            modules = JSON.parse(JSON.stringify(defaultModules));
            const settingsMod = modules.find(m => m.id === 'cardSettings');
            if (settingsMod) settingsMod.visible = isSettingsVisible;

            saveState();

            if (document.startViewTransition) {
                document.startViewTransition(() => {
                    renderDOMOrder();
                    renderDashboard();
                });
            } else {
                renderDOMOrder();
                renderDashboard();
            }
        });
    }

    const settingsBtn = document.getElementById('settingsBtn');
    if (settingsBtn) {
        settingsBtn.addEventListener('click', () => {
            const mod = modules.find(m => m.id === 'cardSettings');
            if (mod) {
                mod.visible = !mod.visible;
                saveState();

                if (mod.visible && settingsContent) {
                    settingsContent.classList.remove('hidden-module');
                    if (settingsArrow) settingsArrow.style.transform = 'rotate(180deg)';
                }

                if (document.startViewTransition) {
                    const transition = document.startViewTransition(() => renderDOMOrder());
                    if (mod.visible) {
                        transition.ready.then(() => {
                            const card = document.getElementById('cardSettings');
                            if (card) {
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                card.classList.remove('highlight-anim');
                                void card.offsetWidth;
                                card.classList.add('highlight-anim');
                                setTimeout(() => card.classList.remove('highlight-anim'), 1600);
                            }
                        });
                    }
                } else {
                    renderDOMOrder();
                    if (mod.visible) {
                        setTimeout(() => {
                            const card = document.getElementById('cardSettings');
                            if (card) {
                                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                card.classList.remove('highlight-anim');
                                void card.offsetWidth;
                                card.classList.add('highlight-anim');
                                setTimeout(() => card.classList.remove('highlight-anim'), 1600);
                            }
                        }, 50);
                    }
                }
            }});
    }

    function saveState() {
        localStorage.setItem('bentoModulesData_v4', JSON.stringify(modules));
    }

    function renderDOMOrder() {
        let contentVisibleCount = 0;
        let isProfileVisible = false;

        modules.forEach((mod, index) => {
            const el = document.getElementById(mod.id);
            if (el) {
                el.style.order = index;
                if (!mod.visible) {
                    el.classList.add('hidden-module');
                } else {
                    el.classList.remove('hidden-module');
                    if (mod.id !== 'cardSettings') {
                        contentVisibleCount++;
                    }
                    if (mod.id === 'cardProfile') {
                        isProfileVisible = true;
                    }
                }
            }
        });

        const bentoGrid = document.querySelector('.bento-grid');
        if (bentoGrid) {
            // Apply single-card-mode ONLY if Profile is the absolutely ONLY content card visible
            // We ignore settings in the count, so opening settings doesn't break the centering.
            if (contentVisibleCount === 1 && isProfileVisible) {
                bentoGrid.classList.add('single-card-mode');
            } else {
                bentoGrid.classList.remove('single-card-mode');
            }
        }
    }

    function renderDashboard() {
        if (!settingsList) return;
        settingsList.innerHTML = '';

        modules.forEach((mod, index) => {
            if (mod.id === 'cardProfile' || mod.id === 'cardSettings' || mod.id === 'cardBadges' || mod.id === 'cardWebring') return;

            const item = document.createElement('div');
            item.className = 'setting-item';
            item.draggable = true;

            let toggleHTML = '';
            if (mod.toggleable) {
                toggleHTML = `
                    <label class="custom-checkbox">
                        <input type="checkbox" ${mod.visible ? 'checked' : ''} onchange="toggleModule(${index}, this.checked)">
                        <span class="checkmark"></span>
                    </label>
                `;
            }

            item.innerHTML = `
                <div class="setting-info" style="cursor: grab;">
                    <span class="setting-name"></span>
                </div>
                <div class="setting-controls">
                    ${toggleHTML}
                </div>
            `;
            const nameEl = item.querySelector('.setting-name');
            if (nameEl) nameEl.textContent = `:: ${mod.name}`;


            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', index);
                item.classList.add('dragging');
            });

            item.addEventListener('dragend', () => {
                item.classList.remove('dragging');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                const fromIndex = parseInt(e.dataTransfer.getData('text/plain'));
                const toIndex = index;

                if (fromIndex !== toIndex && !isNaN(fromIndex)) {

                    const movedItem = modules.splice(fromIndex, 1)[0];
                    modules.splice(toIndex, 0, movedItem);

                    saveState();
                    if (document.startViewTransition) {
                        document.startViewTransition(() => {
                            renderDOMOrder();
                            renderDashboard();
                        });
                    } else {
                        renderDOMOrder();
                        renderDashboard();
                    }
                }
            });

            settingsList.appendChild(item);
        });
    }

    window.toggleModule = function(index, isVisible) {
        modules[index].visible = isVisible;
        saveState();

        if (document.startViewTransition) {
            document.startViewTransition(() => renderDOMOrder());
        } else {
            renderDOMOrder();
        }
    };

    renderDOMOrder();
    renderDashboard();

});
