document.addEventListener('DOMContentLoaded', () => {
    const searchBtn = document.getElementById('searchBtn');
    const aspectRatioSelect = document.getElementById('aspectRatio');
    const resolutionSelect = document.getElementById('resolution');
    const searchQueryInput = document.getElementById('searchQuery');
    const imageGallery = document.getElementById('imageGallery');

    // API Key de Pexels desde el archivo de configuración
    const PEXELS_API_KEY = config.PEXELS_API_KEY;

    // Estado de la aplicación
    let currentPhotos = [];

    // Función para calcular dimensiones basadas en la proporción y resolución
    const calculateDimensions = (aspectRatio, resolution) => {
        if (resolution === 'todos') return null;
        
        const [width, height] = aspectRatio.split(':').map(Number);
        let targetWidth;

        switch(resolution) {
            case '4k':
                targetWidth = 3840;
                break;
            case '2k':
                targetWidth = 2560;
                break;
            case '1080':
                targetWidth = 1920;
                break;
            case '720':
                targetWidth = 1280;
                break;
            default:
                return null;
        }

        const targetHeight = Math.round(targetWidth * (height / width));
        return { width: targetWidth, height: targetHeight };
    };

    // Función para verificar si una imagen cumple con la proporción requerida
    const checkAspectRatio = (imageWidth, imageHeight, targetRatio) => {
        if (targetRatio === 'todos') return true;
        
        const [targetWidth, targetHeight] = targetRatio.split(':').map(Number);
        const imageRatio = imageWidth / imageHeight;
        const targetRatioNum = targetWidth / targetHeight;
        const tolerance = 0.05;
        return Math.abs(imageRatio - targetRatioNum) <= tolerance;
    };

    // Función para construir la consulta de búsqueda
    const buildSearchQuery = (query) => {
        const translations = {
            'tigre': 'tiger',
            'tigre blanco': 'white tiger',
            'leon': 'lion',
            'perro': 'dog',
            'gato': 'cat',
            'playa': 'beach',
            'montaña': 'mountain',
            'ciudad': 'city',
            'naturaleza': 'nature',
            'blanco': 'white',
            'negro': 'black',
            'rojo': 'red',
            'azul': 'blue',
            'verde': 'green',
            'amarillo': 'yellow'
        };

        let searchTerms = query.toLowerCase().split(' ');
        let englishTerms = [];

        searchTerms.forEach((term, i) => {
            if (translations[term]) {
                englishTerms.push(translations[term]);
            }
            if (i < searchTerms.length - 1) {
                const twoWords = term + ' ' + searchTerms[i + 1];
                if (translations[twoWords]) {
                    englishTerms.push(translations[twoWords]);
                }
            }
        });

        return `${query} ${englishTerms.join(' ')}`;
    };

    // Función para crear un elemento de imagen en la galería
    const createGalleryItem = (photo) => {
        const item = document.createElement('div');
        item.className = 'gallery-item';
        
        const img = document.createElement('img');
        img.src = photo.src.medium;
        img.alt = photo.alt || 'Imagen de galería';
        img.loading = 'lazy';

        // Agregar evento click para abrir la imagen en una nueva pestaña
        item.addEventListener('click', () => {
            window.open(photo.src.original, '_blank');
        });

        item.appendChild(img);
        return item;
    };

    // Función para actualizar la galería
    const updateGallery = (photos) => {
        imageGallery.innerHTML = '';
        photos.forEach(photo => {
            imageGallery.appendChild(createGalleryItem(photo));
        });
    };

    // Función para buscar imágenes
    const searchImages = async () => {
        try {
            searchBtn.disabled = true;
            searchBtn.innerHTML = 'Buscando... <span class="loading"></span>';
            
            const aspectRatio = aspectRatioSelect.value;
            const searchQuery = searchQueryInput.value.trim();
            
            const query = searchQuery ? buildSearchQuery(searchQuery) : 'random';
            currentPhotos = [];
            
            // Obtener las primeras 3 páginas de resultados
            for (let page = 1; page <= 3; page++) {
                const response = await fetch(
                    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=80&page=${page}`,
                    {
                        headers: {
                            'Authorization': PEXELS_API_KEY
                        }
                    }
                );

                if (!response.ok) throw new Error('Error en la respuesta de la API');

                const data = await response.json();
                
                if (!data.photos || data.photos.length === 0) {
                    if (page === 1) {
                        throw new Error('No se encontraron imágenes para: ' + searchQuery);
                    }
                    break;
                }

                // Filtrar fotos que cumplan con la proporción requerida
                const matchingPhotos = data.photos.filter(photo => 
                    checkAspectRatio(photo.width, photo.height, aspectRatio)
                );

                currentPhotos = [...currentPhotos, ...matchingPhotos];
            }

            if (currentPhotos.length === 0) {
                throw new Error('No se encontraron imágenes con la proporción requerida para: ' + searchQuery);
            }

            // Mostrar todos los resultados
            updateGallery(currentPhotos);

        } catch (error) {
            console.error('Error:', error);
            alert(error.message || 'Error al buscar imágenes. Por favor, intenta de nuevo.');
            imageGallery.innerHTML = '';
        } finally {
            searchBtn.disabled = false;
            searchBtn.textContent = 'Buscar';
        }
    };

    // Event Listeners
    searchBtn.addEventListener('click', searchImages);

    searchQueryInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchImages();
        }
    });
});
