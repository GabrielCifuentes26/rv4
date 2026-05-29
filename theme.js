(function(){
    'use strict';
    var saved = localStorage.getItem('rv4-theme') === 'dark';

    // Aplica dark class al html INMEDIATAMENTE (antes de que body exista)
    // para evitar flash al cargar y al regresar con botón atrás
    if(saved) {
        document.documentElement.classList.add('dark-pre');
        document.documentElement.classList.add('dark');
    }

    function applyTheme(dark){
        document.documentElement.classList.remove('dark');
        document.body.classList.toggle('dark', dark);
        document.documentElement.classList.remove('dark-pre');
        var btn = document.getElementById('btn-theme');
        if(btn) btn.textContent = dark ? '🌙' : '☀️';
    }

    window.toggleTheme = function(){
        var isDark = !document.body.classList.contains('dark');
        applyTheme(isDark);
        localStorage.setItem('rv4-theme', isDark ? 'dark' : 'light');
    };

    document.addEventListener('DOMContentLoaded', function(){
        var s = localStorage.getItem('rv4-theme') === 'dark';
        applyTheme(s);
    });

    // Restaurar tema al usar botón atrás/adelante (bfcache)
    window.addEventListener('pageshow', function(e){
        if(e.persisted){
            var s = localStorage.getItem('rv4-theme') === 'dark';
            document.body.classList.toggle('dark', s);
            document.documentElement.classList.remove('dark');
            var btn = document.getElementById('btn-theme');
            if(btn) btn.textContent = s ? '🌙' : '☀️';
        }
    });
})();
