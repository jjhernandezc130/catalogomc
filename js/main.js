
        // CONFIGURACIÓN: Cambia esto por el número total de tus imágenes y la ruta
        const totalPages = 136; // <--- AJUSTA ESTE NÚMERO
        const imagePath = 'img/paginas/'; // <--- AJUSTA LA RUTA DE TUS IMÁGENES
        const imagePrefix = 'catalogo-'; // Ejemplo: pagina_1.webp, pagina_2.webp...
        
        let pageFlip;
        let zoomLevel = 1;
        let isDragging = false;
        let startX, startY;
        let translateX = 0, translateY = 0;

        // Cargar el catálogo con imágenes
        async function loadBook() {
            try {
                document.getElementById('loader').innerText = 'Cargando imágenes...';

                // 1. Detectar el tamaño real de la primera imagen para ajustar el libro
                const firstImgUrl = `${imagePath}${imagePrefix}1.webp`;
                const dimensions = await getImageDimensions(firstImgUrl);
                const imgAspectRatio = dimensions.width / dimensions.height;
                
                console.log(`Dimensiones detectadas: ${dimensions.width}x${dimensions.height} (Ratio: ${imgAspectRatio})`);

                const bookContainer = document.getElementById('flip-book');
                bookContainer.innerHTML = '';

                // Crear contenedores para todas las páginas con imágenes
                for (let i = 1; i <= totalPages; i++) {
                    const pageDiv = document.createElement('div');
                    pageDiv.className = 'page';
                    
                    if (i === 1 || i === totalPages) {
                        pageDiv.setAttribute('data-density', 'hard');
                    } else {
                        pageDiv.setAttribute('data-density', 'soft');
                    }

                    const img = document.createElement('img');
                    img.src = `${imagePath}${imagePrefix}${i}.webp`;
                    img.alt = `Página ${i}`;
                    img.loading = "lazy";
                    
                    pageDiv.appendChild(img);
                    bookContainer.appendChild(pageDiv);
                }

                // Inicializar el flipbook con el ratio detectado
                initFlipBook(imgAspectRatio);
                
                // Inicializar eventos de arrastre para el zoom
                initDragEvents();

            } catch (error) {
                console.error('Error al cargar las imágenes:', error);
                document.getElementById('loader').innerHTML = `<span style="color: #ff6b6b;">Error: ${error.message}</span>`;
            }
        }

        // Inicializar eventos de arrastre (Pan)
        function initDragEvents() {
            const wrapper = document.querySelector('.book-wrapper');
            const book = document.getElementById('flip-book');

            wrapper.addEventListener('mousedown', (e) => {
                if (zoomLevel > 1) {
                    isDragging = true;
                    startX = e.clientX - translateX;
                    startY = e.clientY - translateY;
                }
            });

            window.addEventListener('mousemove', (e) => {
                if (!isDragging || zoomLevel <= 1) return;
                
                e.preventDefault();
                translateX = e.clientX - startX;
                translateY = e.clientY - startY;
                
                updateTransform();
            });

            window.addEventListener('mouseup', () => {
                isDragging = false;
            });

            // Soporte para touch (móviles)
            wrapper.addEventListener('touchstart', (e) => {
                if (zoomLevel > 1) {
                    isDragging = true;
                    startX = e.touches[0].clientX - translateX;
                    startY = e.touches[0].clientY - translateY;
                }
            }, { passive: false });

            wrapper.addEventListener('touchmove', (e) => {
                if (!isDragging || zoomLevel <= 1) return;
                
                translateX = e.touches[0].clientX - startX;
                translateY = e.touches[0].clientY - startY;
                
                updateTransform();
            }, { passive: false });

            wrapper.addEventListener('touchend', () => {
                isDragging = false;
            });
        }

        function updateTransform() {
            const book = document.getElementById('flip-book');
            // Aplicar escala y traslación
            book.style.transform = `translate(${translateX}px, ${translateY}px) scale(${zoomLevel})`;
        }

        // Función para obtener dimensiones de imagen
        function getImageDimensions(url) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
                img.onerror = reject;
                img.src = url;
            });
        }

        // Configuración del FlipBook
        async function initFlipBook(aspectRatio) {
            try {
                const availableHeight = window.innerHeight;
                const availableWidth = window.innerWidth;
                const isMobile = availableWidth < 768;

                let pageWidth, pageHeight;

                if (isMobile) {
                    // En móvil, maximizar ancho y calcular alto según la imagen real
                    pageWidth = availableWidth;
                    pageHeight = pageWidth / aspectRatio;
                    
                    // Si el alto resultante es mayor que la pantalla, ajustamos por alto
                    if (pageHeight > availableHeight) {
                        pageHeight = availableHeight;
                        pageWidth = pageHeight * aspectRatio;
                    }
                } else {
                    // En desktop, maximizar alto y calcular ancho según la imagen real
                    pageHeight = availableHeight;
                    pageWidth = pageHeight * aspectRatio;

                    // Si el ancho total (2 páginas) es mayor que la pantalla, ajustamos por ancho
                    if (pageWidth * 2 > availableWidth) {
                        pageWidth = availableWidth / 2;
                        pageHeight = pageWidth / aspectRatio;
                    }
                }

                pageFlip = new St.PageFlip(document.getElementById('flip-book'), {
                    width: Math.round(pageWidth),
                    height: Math.round(pageHeight),
                    size: 'fixed',
                    minWidth: 200,
                    maxWidth: 2500,
                    minHeight: 200,
                    maxHeight: 2500,
                    maxShadowOpacity: 0.5,
                    showCover: true,
                    mobileScrollSupport: false,
                    usePortrait: isMobile,
                    drawShadow: true,
                    flippingTime: 400,
                    swipeDistance: 30,
                    useMouseEvents: true
                });

                pageFlip.loadFromHTML(document.querySelectorAll('.page'));

                pageFlip.on('flip', (e) => {
                    updatePageInfo();
                    const welcomeMsg = document.getElementById('welcome-msg');
                    if (welcomeMsg && e.data > 0) {
                        welcomeMsg.classList.remove('visible');
                    } else if (welcomeMsg && e.data === 0) {
                        welcomeMsg.classList.add('visible');
                    }
                });

                document.getElementById('loader').style.display = 'none';
                document.getElementById('flip-book').style.display = 'block';

                const welcomeMsg = document.getElementById('welcome-msg');
                if (welcomeMsg) welcomeMsg.classList.add('visible');

                updatePageInfo();
                updateZoomButtonStates();
            } catch (error) {
                console.error('Error inicializando flipbook:', error);
                document.getElementById('loader').innerHTML = `<span style="color: #ff6b6b;">Error al inicializar: ${error.message}</span>`;
            }
        }

        // Funciones de control (deben estar definidas)
        function prevPage() { if (pageFlip) pageFlip.flipPrev(); }
        function nextPage() { if (pageFlip) pageFlip.flipNext(); }
        function updatePageInfo() {
            if (pageFlip) {
                const total = pageFlip.getPageCount();
                const current = pageFlip.getCurrentPageIndex() + 1;
                document.getElementById('page-count').innerText = `${current} / ${total}`;
            }
        }
        function updateZoomButtonStates() {
            const resetBtn = document.getElementById('zoom-reset-btn');
            if (zoomLevel <= 1) {
                resetBtn.style.opacity = '0.3';
                resetBtn.style.cursor = 'not-allowed';
                resetBtn.style.pointerEvents = 'none';
            } else {
                resetBtn.style.opacity = '1';
                resetBtn.style.cursor = 'pointer';
                resetBtn.style.pointerEvents = 'auto';
            }
        }

        function resetZoom() {
            if (zoomLevel <= 1) return;
            zoomLevel = 1;
            translateX = 0;
            translateY = 0;
            updateTransform();
            
            const pageInfo = document.getElementById('page-count');
            pageInfo.innerText = `Zoom: 100%`;
            setTimeout(() => updatePageInfo(), 1000);
            updateZoomButtonStates();
        }

        function toggleZoom() {
            if (zoomLevel === 1) zoomLevel = 1.5;
            else if (zoomLevel === 1.5) zoomLevel = 2;
            else if (zoomLevel === 2) zoomLevel = 2.5;
            else return;

            // Al hacer zoom, mantenemos la traslación actual o la reseteamos si prefieres
            // Para una mejor UX, si estaba en 1 y pasa a 1.5, centramos
            if (zoomLevel === 1.5) {
                translateX = 0;
                translateY = 0;
            }
            
            updateTransform();
            const pageInfo = document.getElementById('page-count');
            pageInfo.innerText = `Zoom: ${Math.round(zoomLevel * 100)}%`;
            setTimeout(() => updatePageInfo(), 1000);
            updateZoomButtonStates();
        }

        // Iniciar carga al cargar la ventana
        window.onload = loadBook;
