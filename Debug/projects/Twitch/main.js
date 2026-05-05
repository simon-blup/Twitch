window.onload = function () {
    let currentFocusIndex = 1; // Inizia su Home
    const menuItems = document.querySelectorAll('.menu-item');
    const indicator = document.getElementById('nav-indicator');

    function updateNav() {
        const activeItem = menuItems[currentFocusIndex];
        
        // Calcola posizione e larghezza rispetto al menu
        const itemWidth = activeItem.offsetWidth;
        const itemLeft = activeItem.offsetLeft;

        // Muovi la pillola
        indicator.style.width = itemWidth + 'px';
        indicator.style.left = itemLeft + 'px';

        // Aggiorna colori testo
        menuItems.forEach(item => item.classList.remove('active-text'));
        activeItem.classList.add('active-text');
    }

    updateNav();

    document.addEventListener('keydown', function(event) {
        if (event.keyCode === 39 || event.key === "ArrowRight") {
            if (currentFocusIndex < menuItems.length - 1) {
                currentFocusIndex++;
                updateNav();
            }
        }
        else if (event.keyCode === 37 || event.key === "ArrowLeft") {
            if (currentFocusIndex > 0) {
                currentFocusIndex--;
                updateNav();
            }
        }
    });
};