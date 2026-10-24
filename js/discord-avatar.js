document.addEventListener('DOMContentLoaded', function() {
    const discordAvatar = document.getElementById('discordAvatar');
    const API_URL = 'https://mettaneko-steam-proxy.vercel.app/api/discord-avatar'; 

    async function loadDiscordAvatar() {
        try {
            const response = await fetch(API_URL);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown API Error' }));
                throw new Error('API request failed: ' + (errorData.error || response.statusText));
            }

            const data = await response.json(); 
            
            if (data.avatarUrl && typeof data.avatarUrl === 'string' && data.avatarUrl.startsWith('https://')) {
                discordAvatar.src = data.avatarUrl;
                console.log('Discord аватар загружен:', data.avatarUrl);
                return;
            }
        } catch (error) {
            console.error('Ошибка при загрузке Discord аватара:', error);
            
        }
    }
    
    loadDiscordAvatar();
    setInterval(loadDiscordAvatar, 1 * 60 * 1000); 

});
