(function(){
    'use strict';
    // Aplica tema guardado antes de render para evitar flash
    if(localStorage.getItem('rv4-theme')==='dark') document.documentElement.classList.add('dark-pre');

    function applyTheme(dark){
        document.body.classList.toggle('dark', dark);
        document.documentElement.classList.remove('dark-pre');
        const btn = document.getElementById('btn-theme');
        if(btn) btn.textContent = dark ? '🌙' : '☀️';
    }

    window.toggleTheme = function(){
        const isDark = !document.body.classList.contains('dark');
        applyTheme(isDark);
        localStorage.setItem('rv4-theme', isDark ? 'dark' : 'light');
    };

    document.addEventListener('DOMContentLoaded', function(){
        const saved = localStorage.getItem('rv4-theme') === 'dark';
        applyTheme(saved);
    });
})();
