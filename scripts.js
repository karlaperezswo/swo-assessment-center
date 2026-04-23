// Script para menú desplegable en el sidebar
document.addEventListener('DOMContentLoaded', function() {
    initMenuItems(document.querySelectorAll('.nav-menu > ul > li'));
});

function initMenuItems(items) {
    items.forEach(item => {
        const link = item.querySelector(':scope > a');
        const submenu = item.querySelector(':scope > .submenu');

        if (submenu) {
            item.classList.add('has-submenu');

            let arrow = link.querySelector('.submenu-arrow');
            if (!arrow) {
                arrow = document.createElement('span');
                arrow.className = 'submenu-arrow';
                arrow.innerHTML = '▼';
                link.appendChild(arrow);
            }

            const isActive = submenu.querySelector('.active') !== null;
            if (isActive) {
                item.classList.add('open');
                submenu.style.display = 'block';
                arrow.innerHTML = '▲';
            } else {
                submenu.style.display = 'none';
                arrow.innerHTML = '▼';
            }

            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                item.classList.toggle('open');

                if (item.classList.contains('open')) {
                    submenu.style.display = 'block';
                    arrow.innerHTML = '▲';
                } else {
                    submenu.style.display = 'none';
                    arrow.innerHTML = '▼';
                }
            });

            // Inicializar recursivamente los items del submenú
            initMenuItems(submenu.querySelectorAll(':scope > li'));
        }
    });
}
