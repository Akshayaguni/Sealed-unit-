
        // Global variables
        let currentTab = 'single';
        let cart = [];
        let currentPrice = 0;
        let selectedDeliveryArea = null;
        let deliveryCharge = 0;
        let pendingCartItem = null;
        let selectedPattern = null;
        let pendingPatternSelection = null;
        let pendingGlassConfigSelection = null;
        let pendingShapeSelection = null;
        let selectedShapeData = {
            shape: null,
            customShape: '',
            width: null,
            height: null,
            reference: '',
            uploadedFiles: []
        };
        let selectedGlassConfig = {
            thickness: null,
            tintedColor: null,
            corner: null
        };

        // Helper functions for shape data
        function getShapePriceModifier(shape) {
            const priceMap = {
                'square': '0',
                'triangle': '15',
                'rake': '20',
                'arched': '25',
                'circle': '20',
                'other': '30'
            };
            return priceMap[shape] || '0';
        }

        function getTypeThumbnail(type) {
            const thumbnailMap = {
                'single': 'https://cdn-icons-png.flaticon.com/512/2593/2593549.png',
                'double': 'https://cdn-icons-png.flaticon.com/512/2593/2593551.png',
                'triple': 'https://cdn-icons-png.flaticon.com/512/2593/2593553.png'
            };
            return thumbnailMap[type] || thumbnailMap['single'];
        }

        function getShapeDisplayName(shape) {
            const nameMap = {
                'square': 'Square',
                'triangle': 'Right Angle Triangle',
                'rake': 'Rake',
                'arched': 'Arched-Top',
                'circle': 'Circle',
                'other': 'Other'
            };
            return nameMap[shape] || 'Square';
        }

        function getShapeImage(shape) {
            const imageMap = {
                'square': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&h=120&fit=crop&crop=center',
                'triangle': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=120&h=120&fit=crop&crop=center',
                'rake': 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=120&h=120&fit=crop&crop=center',
                'arched': 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=120&h=120&fit=crop&crop=center',
                'circle': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=120&h=120&fit=crop&crop=center',
                'other': 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=120&h=120&fit=crop&crop=center'
            };
            return imageMap[shape] || imageMap['square'];
        }

        // Initialize the calculator
        document.addEventListener('DOMContentLoaded', function() {
            initializeTabs();
            initializeEventListeners();
            initializeShapeDimensionsModal();
            calculatePrice();
        });

        // Initialize extras dropdowns
        function initializeExtrasDropdowns() {
            ['single', 'double', 'triple'].forEach(type => {
                const extrasSelect = document.getElementById(type + 'Extras');
                if (extrasSelect) {
                    extrasSelect.addEventListener('change', function() {
                        const value = this.value;
                        
                        // Hide all option containers
                        const georgianOptions = document.getElementById(type + 'GeorgianOptions');
                        const duplexOptions = document.getElementById(type + 'DuplexOptions');
                        
                        if (georgianOptions) georgianOptions.classList.add('hidden');
                        if (duplexOptions) duplexOptions.classList.add('hidden');
                        
                        // Show relevant option container
                        if (value === 'georgian' && georgianOptions) {
                            georgianOptions.classList.remove('hidden');
                        } else if (value === 'duplex' && duplexOptions) {
                            duplexOptions.classList.remove('hidden');
                        }
                        
                        calculatePrice();
                    });
                }
            });
        }

        // Tab functionality
        function initializeTabs() {
            const tabButtons = document.querySelectorAll('.tab-btn');
            const tabContents = document.querySelectorAll('.tab-content');

            tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    const tabId = this.id.replace('Tab', '');
                    switchTab(tabId);
                });
            });
        }

        function switchTab(tabId) {
            // Remove active class from all tabs
            document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('tab-active'));
            document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));

            // Add active class to selected tab
            document.getElementById(tabId + 'Tab').classList.add('tab-active');
            
            // Show corresponding content
            if (tabId === 'single') {
                document.getElementById('singleUnit').classList.remove('hidden');
                currentTab = 'single';
            } else if (tabId === 'double') {
                document.getElementById('doubleGlazed').classList.remove('hidden');
                currentTab = 'double';
            } else if (tabId === 'triple') {
                document.getElementById('tripleGlazed').classList.remove('hidden');
                currentTab = 'triple';
            }

            // Clear any error messages when switching tabs
            document.querySelectorAll('.error-message').forEach(error => error.classList.add('hidden'));
            
            calculatePrice();
        }

        // Event listeners
        function initializeEventListeners() {
            // Dimension inputs
            ['single', 'double', 'triple'].forEach(type => {
                const widthInput = document.getElementById(type + 'Width');
                const heightInput = document.getElementById(type + 'Height');
                
                if (widthInput) widthInput.addEventListener('input', () => updateArea(type));
                if (heightInput) heightInput.addEventListener('input', () => updateArea(type));
            });

            // Shape selection - separate handlers for each tab
            document.querySelectorAll('.single-shape-option').forEach(option => {
                option.addEventListener('click', function() {
                    pendingShapeSelection = 'single';
                    showShapeDimensionsModal(this);
                });
            });

            document.querySelectorAll('.double-shape-option').forEach(option => {
                option.addEventListener('click', function() {
                    pendingShapeSelection = 'double';
                    showShapeDimensionsModal(this);
                });
            });

            document.querySelectorAll('.triple-shape-option').forEach(option => {
                option.addEventListener('click', function() {
                    pendingShapeSelection = 'triple';
                    showShapeDimensionsModal(this);
                });
            });

            // Edit shape buttons for all tabs
            document.addEventListener('click', function(e) {
                if (e.target.id === 'singleEditShape' || e.target.id === 'doubleEditShape' || e.target.id === 'tripleEditShape') {
                    let tabType;
                    if (e.target.id === 'singleEditShape') tabType = 'single';
                    else if (e.target.id === 'doubleEditShape') tabType = 'double';
                    else if (e.target.id === 'tripleEditShape') tabType = 'triple';
                    
                    pendingShapeSelection = tabType;
                    
                    // Get the stored shape value
                    const storedShape = selectedShapeData.shape || document.getElementById(tabType + 'Shape').value;
                    
                    // Create a mock shape element with the stored data
                    const mockShapeElement = {
                        dataset: {
                            shape: storedShape,
                            price: getShapePriceModifier(storedShape)
                        },
                        querySelector: () => ({ textContent: getShapeDisplayName(storedShape) }),
                        querySelector: () => ({ src: getShapeImage(storedShape) })
                    };
                    
                    showShapeDimensionsModal(mockShapeElement);
                }
            });

            // All other inputs
            document.addEventListener('change', function(e) {
                // Check if pattern glass is selected
                if (e.target.tagName === 'SELECT' && e.target.value === '4mm-pattern') {
                    showPatternModal(e.target);
                } else if (e.target.id === 'singleGlassType' && e.target.value && e.target.value !== '') {
                    // Show glass configuration modal for single unit glass types
                    showGlassConfigModal(e.target);
                } else {
                    calculatePrice();
                }
            });
            document.addEventListener('input', calculatePrice);

            // Extras dropdown functionality
            initializeExtrasDropdowns();

            // File upload functionality
            initializeFileUploads();

            // Add to cart button
            document.getElementById('addToCart').addEventListener('click', addToCart);

            // Delivery modal listeners
            initializeDeliveryModal();

            // Pattern modal listeners
            initializePatternModal();

            // Glass configuration modal listeners
            initializeGlassConfigModal();
        }

        // File upload functionality
        function initializeFileUploads() {
            ['single', 'double', 'triple'].forEach(type => {
                const fileInput = document.getElementById(type + 'DrawingFile');
                if (fileInput) {
                    fileInput.addEventListener('change', function(e) {
                        handleFileUpload(e, type);
                    });
                }
            });
        }

        function handleFileUpload(event, type) {
            const files = Array.from(event.target.files);
            const fileListContainer = document.getElementById(type + 'FileList');
            
            if (files.length === 0) return;
            
            // Validate files
            const validFiles = [];
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            
            files.forEach(file => {
                if (file.size > maxSize) {
                    alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                    return;
                }
                
                if (!allowedTypes.includes(file.type)) {
                    alert(`File "${file.name}" is not a supported format. Please use PNG, JPG, PDF, or DOCX.`);
                    return;
                }
                
                validFiles.push(file);
            });
            
            if (validFiles.length === 0) {
                event.target.value = ''; // Clear the input
                return;
            }
            
            // Store files in a global object for later use
            if (!window.uploadedFiles) {
                window.uploadedFiles = {};
            }
            if (!window.uploadedFiles[type]) {
                window.uploadedFiles[type] = [];
            }
            
            // Add new files to existing ones
            window.uploadedFiles[type] = [...window.uploadedFiles[type], ...validFiles];
            
            // Update display
            updateFileDisplay(type);
            
            // Clear the input so the same file can be selected again if needed
            event.target.value = '';
        }

        function updateFileDisplay(type) {
            const fileListContainer = document.getElementById(type + 'FileList');
            if (!fileListContainer) return; //4261 (added extra)
            const files = window.uploadedFiles && window.uploadedFiles[type] ? window.uploadedFiles[type] : [];
            
            if (files.length === 0) {
                fileListContainer.classList.add('hidden');
                return;
            }
            
            fileListContainer.classList.remove('hidden');
            
            let html = '';
            files.forEach((file, index) => {
                const fileSize = formatFileSize(file.size);
                const fileIcon = getFileIcon(file.type);
                
                html += `
                    <div class="file-item">
                        ${fileIcon}
                        <div class="file-info">
                            <div class="file-name" title="${file.name}">${file.name}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <svg class="file-remove" onclick="removeFile('${type}', ${index})" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                `;
            });
            
            fileListContainer.innerHTML = html;
        }

        function removeFile(type, index) {
            if (window.uploadedFiles && window.uploadedFiles[type]) {
                window.uploadedFiles[type].splice(index, 1);
                updateFileDisplay(type);
            }
        }

        function clearUploadedFiles(type) {
            if (window.uploadedFiles && window.uploadedFiles[type]) {
                window.uploadedFiles[type] = [];
                updateFileDisplay(type);
            }
        }

        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            const k = 1024;
            const sizes = ['Bytes', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        }

        function getFileIcon(fileType) {
            if (fileType.startsWith('image/')) {
                return `<svg class="file-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path>
                </svg>`;
            } else if (fileType === 'application/pdf') {
                return `<svg class="file-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clip-rule="evenodd"></path>
                </svg>`;
            } else {
                return `<svg class="file-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"></path>
                </svg>`;
            }
        }

        // Update area calculation
        function updateArea(type) {
            const width = parseFloat(document.getElementById(type + 'Width').value) || 0;
            const height = parseFloat(document.getElementById(type + 'Height').value) || 0;
            const areaInSquareMeters = (width / 1000) * (height / 1000);
            
            document.getElementById(type + 'Area').textContent = areaInSquareMeters.toFixed(3) + ' m²';
            calculatePrice();
        }

        // Price calculation
        function calculatePrice() {
            let price = 0;

            if (currentTab === 'single') {
                price = calculateSinglePrice();
            } else if (currentTab === 'double') {
                price = calculateDoublePrice();
            } else if (currentTab === 'triple') {
                price = calculateTriplePrice();
            }

            currentPrice = price; // Store price for cart
            
            // Update current price display (excludes VAT)
            document.getElementById('currentPrice').textContent = price.toFixed(2);
        }

        /*function calculateSinglePrice() {
            const width = parseFloat(document.getElementById('singleWidth').value) || 0;
            const height = parseFloat(document.getElementById('singleHeight').value) || 0;
            
            if (width === 0 || height === 0) return 0;

            // Convert mm to meters and calculate area
            const areaInSquareMeters = (width / 1000) * (height / 1000);
            
            // Apply minimum charge of 0.3 square meters
            const chargeableArea = Math.max(areaInSquareMeters, 0.3);

            let price = 0;

            // Glass type price (per square meter)
            const glassTypeSelect = document.getElementById('singleGlassType');
            const glassTypePrice = parseFloat(glassTypeSelect.options[glassTypeSelect.selectedIndex].dataset.price) || 0;
            price = chargeableArea * glassTypePrice;

            // Shape modifier (percentage)
            const shapeModifier = parseFloat(document.querySelector('.single-shape-option.shape-selected')?.dataset.price) || 0;
            price *= (1 + shapeModifier / 100);

            // Polished glass (always yes for single panel, +30%)
            const polishedRadio = document.querySelector('input[name="singlePolished"]:checked');
            if (polishedRadio) {
                const polishedModifier = parseFloat(polishedRadio.dataset.price) || 0;
                price *= (1 + polishedModifier / 100);
            }

            // Toughened glass (always yes for single panel, +30%)
            const toughenedRadio = document.querySelector('input[name="singleToughened"]:checked');
            if (toughenedRadio) {
                const toughenedModifier = parseFloat(toughenedRadio.dataset.price) || 0;
                price *= (1 + toughenedModifier / 100);
            }

            // Pet flap (fixed price)
            const petFlapCheckbox = document.getElementById('singlePetFlap');
            if (petFlapCheckbox && petFlapCheckbox.checked) {
                const petFlapPrice = parseFloat(petFlapCheckbox.dataset.price) || 0;
                price += petFlapPrice;
            }

            // Optional extras (fixed price)
            const extrasSelect = document.getElementById('singleExtras');
            const extrasPrice = parseFloat(extrasSelect.options[extrasSelect.selectedIndex].dataset.price) || 0;
            price += extrasPrice;

            return price;
        }*/
       // ...existing code...

function calculateSinglePrice() {
    const width = parseFloat(document.getElementById('singleWidth').value) || 0;
    const height = parseFloat(document.getElementById('singleHeight').value) || 0;
    if (width === 0 || height === 0) return 0;

    // Area in m²
    const areaInSquareMeters = (width / 1000) * (height / 1000);
    const chargeableArea = Math.max(areaInSquareMeters, 0.3);

    // Get selected thickness (from glass config modal)
    const glassTypeSelect = document.getElementById('singleGlassType');
    const glassThicknessStr = glassTypeSelect.dataset.selectedThickness || '4mm';
    const thickness_mm = parseFloat(glassThicknessStr.replace('mm', '')) || 4;
    const thickness_m = thickness_mm / 1000;

    // Glass density (kg/m³)
    const density = 2500;

    // Calculate weight
    const weight_kg = chargeableArea * thickness_m * density;

    // Price per kg (set your value, e.g. £2.5 per kg)
    const price_per_kg = 2.5;

    let price = weight_kg * price_per_kg;

    // Shape modifier (percentage)
    const shapeModifier = parseFloat(document.querySelector('.single-shape-option.shape-selected')?.dataset.price) || 0;
    price *= (1 + shapeModifier / 100);

    // Polished glass (always yes for single panel, +30%)
    const polishedRadio = document.querySelector('input[name="singlePolished"]:checked');
    if (polishedRadio) {
        const polishedModifier = parseFloat(polishedRadio.dataset.price) || 0;
        price *= (1 + polishedModifier / 100);
    }

    // Toughened glass (always yes for single panel, +30%)
    const toughenedRadio = document.querySelector('input[name="singleToughened"]:checked');
    if (toughenedRadio) {
        const toughenedModifier = parseFloat(toughenedRadio.dataset.price) || 0;
        price *= (1 + toughenedModifier / 100);
    }

    // Pet flap (fixed price)
    const petFlapCheckbox = document.getElementById('singlePetFlap');
    if (petFlapCheckbox && petFlapCheckbox.checked) {
        const petFlapPrice = parseFloat(petFlapCheckbox.dataset.price) || 0;
        price += petFlapPrice;
    }

    // Optional extras (fixed price)
    const extrasSelect = document.getElementById('singleExtras');
    const extrasPrice = parseFloat(extrasSelect.options[extrasSelect.selectedIndex].dataset.price) || 0;
    price += extrasPrice;

    return price;
}
function calculateSingleWeight() {
    const width = parseFloat(document.getElementById('singleWidth').value) || 0;
    const height = parseFloat(document.getElementById('singleHeight').value) || 0;
    const area = Math.max((width / 1000) * (height / 1000), 0.3);

    // Get selected thickness
    const glassTypeSelect = document.getElementById('singleGlassType');
    const glassThicknessStr = glassTypeSelect.dataset.selectedThickness || '4mm';
    const thickness_mm = parseFloat(glassThicknessStr.replace('mm', '')) || 4;
    const thickness_m = thickness_mm / 1000;

    // Glass density (kg/m³)
    const density = 2500;

    // Calculate weight
    const weight_kg = area * thickness_m * density;
    return weight_kg;
}
        /*function calculateDoublePrice() {
            const width = parseFloat(document.getElementById('doubleWidth').value) || 0;
            const height = parseFloat(document.getElementById('doubleHeight').value) || 0;
            
            if (width === 0 || height === 0) return 0;

            // Convert mm to meters and calculate area
            const areaInSquareMeters = (width / 1000) * (height / 1000);
            
            // Apply minimum charge of 0.3 square meters
            const chargeableArea = Math.max(areaInSquareMeters, 0.3);

            let price = 0;

            // External glass
            const outerGlassSelect = document.getElementById('doubleOuterGlass');
            const outerGlassPrice = parseFloat(outerGlassSelect.options[outerGlassSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * outerGlassPrice;

            // Internal glass
            const innerGlassSelect = document.getElementById('doubleInnerGlass');
            const innerGlassPrice = parseFloat(innerGlassSelect.options[innerGlassSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * innerGlassPrice;

            // Spacer bar type (per sqm)
            const spacerTypeSelect = document.getElementById('doubleSpacerType');
            const spacerTypePrice = parseFloat(spacerTypeSelect.options[spacerTypeSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * spacerTypePrice;

            // Shape modifier (percentage)
            const shapeModifier = parseFloat(document.querySelector('.double-shape-option.shape-selected')?.dataset.price) || 0;
            price *= (1 + shapeModifier / 100);

            // Toughened glass (percentage)
            const toughenedRadio = document.querySelector('input[name="doubleToughened"]:checked');
            if (toughenedRadio) {
                const toughenedModifier = parseFloat(toughenedRadio.dataset.price) || 0;
                price *= (1 + toughenedModifier / 100);
            }

            // Pet flap (fixed price)
            const petFlapCheckbox = document.getElementById('doublePetFlap');
            if (petFlapCheckbox && petFlapCheckbox.checked) {
                const petFlapPrice = parseFloat(petFlapCheckbox.dataset.price) || 0;
                price += petFlapPrice;
            }

            // Optional extras (per sqm)
            const extrasSelect = document.getElementById('doubleExtras');
            const extrasPrice = parseFloat(extrasSelect.options[extrasSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * extrasPrice;

            return price;
        }*/
function calculateDoublePrice() {
    const width = parseFloat(document.getElementById('doubleWidth').value) || 0;
    const height = parseFloat(document.getElementById('doubleHeight').value) || 0;
    if (width === 0 || height === 0) return 0;

    // Area in m²
    const areaInSquareMeters = (width / 1000) * (height / 1000);
    const chargeableArea = Math.max(areaInSquareMeters, 0.3);

    // Get selected thicknesses from glass names
    const outerGlassSelect = document.getElementById('doubleOuterGlass');
    const innerGlassSelect = document.getElementById('doubleInnerGlass');
    const outerThicknessMatch = outerGlassSelect.options[outerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);
    const innerThicknessMatch = innerGlassSelect.options[innerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);

    const outerThickness_mm = outerThicknessMatch ? parseFloat(outerThicknessMatch[1]) : 4;
    const innerThickness_mm = innerThicknessMatch ? parseFloat(innerThicknessMatch[1]) : 4;

    // Glass density (kg/m³)
    const density = 2500;

    // Calculate total weight for both panes
    const totalThickness_m = (outerThickness_mm + innerThickness_mm) / 1000;
    const weight_kg = chargeableArea * totalThickness_m * density;

    // Price per kg (set your value, e.g. £2.5 per kg)
    const price_per_kg = 2.5;

    let price = weight_kg * price_per_kg;

    // Shape modifier (percentage)
    const shapeModifier = parseFloat(document.querySelector('.double-shape-option.shape-selected')?.dataset.price) || 0;
    price *= (1 + shapeModifier / 100);

    // Toughened glass (percentage)
    const toughenedRadio = document.querySelector('input[name="doubleToughened"]:checked');
    if (toughenedRadio) {
        const toughenedModifier = parseFloat(toughenedRadio.dataset.price) || 0;
        price *= (1 + toughenedModifier / 100);
    }

    // Pet flap (fixed price)
    const petFlapCheckbox = document.getElementById('doublePetFlap');
    if (petFlapCheckbox && petFlapCheckbox.checked) {
        const petFlapPrice = parseFloat(petFlapCheckbox.dataset.price) || 0;
        price += petFlapPrice;
    }

    // Optional extras (per sqm)
    const extrasSelect = document.getElementById('doubleExtras');
    const extrasPrice = parseFloat(extrasSelect.options[extrasSelect.selectedIndex].dataset.price) || 0;
    price += chargeableArea * extrasPrice;

    return price;
}
function calculateDoubleWeight() {
    const width = parseFloat(document.getElementById('doubleWidth').value) || 0;
    const height = parseFloat(document.getElementById('doubleHeight').value) || 0;
    const area = Math.max((width / 1000) * (height / 1000), 0.3);

    // Get selected thicknesses
    const outerGlassSelect = document.getElementById('doubleOuterGlass');
    const innerGlassSelect = document.getElementById('doubleInnerGlass');
    const outerThicknessStr = outerGlassSelect.options[outerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);
    const innerThicknessStr = innerGlassSelect.options[innerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);

    const outerThickness_mm = outerThicknessStr ? parseFloat(outerThicknessStr[1]) : 4;
    const innerThickness_mm = innerThicknessStr ? parseFloat(innerThicknessStr[1]) : 4;

    // Spacer bar thickness (optional, usually not counted in weight)
    // If you want to include, get from spacer width select

    // Glass density (kg/m³)
    const density = 2500;

    // Calculate weight for both panes
    const weight_kg = area * ((outerThickness_mm + innerThickness_mm) / 1000) * density;
    return weight_kg;
}

        

        /*function calculateTriplePrice() {
            const width = parseFloat(document.getElementById('tripleWidth').value) || 0;
            const height = parseFloat(document.getElementById('tripleHeight').value) || 0;
            
            if (width === 0 || height === 0) return 0;

            // Convert mm to meters and calculate area
            const areaInSquareMeters = (width / 1000) * (height / 1000);
            
            // Apply minimum charge of 0.3 square meters
            const chargeableArea = Math.max(areaInSquareMeters, 0.3);

            let price = 0;

            // External glass
            const outerGlassSelect = document.getElementById('tripleOuterGlass');
            const outerGlassPrice = parseFloat(outerGlassSelect.options[outerGlassSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * outerGlassPrice;

            // Centre glass
            const centreGlassSelect = document.getElementById('tripleCentreGlass');
            const centreGlassPrice = parseFloat(centreGlassSelect.options[centreGlassSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * centreGlassPrice;

            // Internal glass
            const innerGlassSelect = document.getElementById('tripleInnerGlass');
            const innerGlassPrice = parseFloat(innerGlassSelect.options[innerGlassSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * innerGlassPrice;

            // Spacer bar type (per sqm)
            const spacerTypeSelect = document.getElementById('tripleSpacerType');
            const spacerTypePrice = parseFloat(spacerTypeSelect.options[spacerTypeSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * spacerTypePrice;

            // Shape modifier (percentage)
            const shapeModifier = parseFloat(document.querySelector('.triple-shape-option.shape-selected')?.dataset.price) || 0;
            price *= (1 + shapeModifier / 100);

            // Toughened glass (percentage)
            const toughenedRadio = document.querySelector('input[name="tripleToughened"]:checked');
            if (toughenedRadio) {
                const toughenedModifier = parseFloat(toughenedRadio.dataset.price) || 0;
                price *= (1 + toughenedModifier / 100);
            }

            // Pet flap (fixed price)
            const petFlapCheckbox = document.getElementById('triplePetFlap');
            if (petFlapCheckbox && petFlapCheckbox.checked) {
                const petFlapPrice = parseFloat(petFlapCheckbox.dataset.price) || 0;
                price += petFlapPrice;
            }

            // Optional extras (per sqm)
            const extrasSelect = document.getElementById('tripleExtras');
            const extrasPrice = parseFloat(extrasSelect.options[extrasSelect.selectedIndex].dataset.price) || 0;
            price += chargeableArea * extrasPrice;

            return price;
        }*/
function calculateTriplePrice() {
    const width = parseFloat(document.getElementById('tripleWidth').value) || 0;
    const height = parseFloat(document.getElementById('tripleHeight').value) || 0;
    if (width === 0 || height === 0) return 0;

    // Area in m²
    const areaInSquareMeters = (width / 1000) * (height / 1000);
    const chargeableArea = Math.max(areaInSquareMeters, 0.3);

    // Get selected thicknesses from glass names
    const outerGlassSelect = document.getElementById('tripleOuterGlass');
    const centreGlassSelect = document.getElementById('tripleCentreGlass');
    const innerGlassSelect = document.getElementById('tripleInnerGlass');
    const outerThicknessMatch = outerGlassSelect.options[outerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);
    const centreThicknessMatch = centreGlassSelect.options[centreGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);
    const innerThicknessMatch = innerGlassSelect.options[innerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);

    const outerThickness_mm = outerThicknessMatch ? parseFloat(outerThicknessMatch[1]) : 4;
    const centreThickness_mm = centreThicknessMatch ? parseFloat(centreThicknessMatch[1]) : 4;
    const innerThickness_mm = innerThicknessMatch ? parseFloat(innerThicknessMatch[1]) : 4;

    // Glass density (kg/m³)
    const density = 2500;

    // Calculate total weight for all panes
    const totalThickness_m = (outerThickness_mm + centreThickness_mm + innerThickness_mm) / 1000;
    const weight_kg = chargeableArea * totalThickness_m * density;

    // Price per kg (set your value, e.g. £2.5 per kg)
    const price_per_kg = 2.5;

    let price = weight_kg * price_per_kg;

    // Shape modifier (percentage)
    const shapeModifier = parseFloat(document.querySelector('.triple-shape-option.shape-selected')?.dataset.price) || 0;
    price *= (1 + shapeModifier / 100);

    // Toughened glass (percentage)
    const toughenedRadio = document.querySelector('input[name="tripleToughened"]:checked');
    if (toughenedRadio) {
        const toughenedModifier = parseFloat(toughenedRadio.dataset.price) || 0;
        price *= (1 + toughenedModifier / 100);
    }

    // Pet flap (fixed price)
    const petFlapCheckbox = document.getElementById('triplePetFlap');
    if (petFlapCheckbox && petFlapCheckbox.checked) {
        const petFlapPrice = parseFloat(petFlapCheckbox.dataset.price) || 0;
        price += petFlapPrice;
    }

    // Optional extras (per sqm)
    const extrasSelect = document.getElementById('tripleExtras');
    const extrasPrice = parseFloat(extrasSelect.options[extrasSelect.selectedIndex].dataset.price) || 0;
    price += chargeableArea * extrasPrice;

    return price;
}
function calculateTripleWeight() {
    const width = parseFloat(document.getElementById('tripleWidth').value) || 0;
    const height = parseFloat(document.getElementById('tripleHeight').value) || 0;
    const area = Math.max((width / 1000) * (height / 1000), 0.3);

    // Get selected thicknesses from glass names
    const outerGlassSelect = document.getElementById('tripleOuterGlass');
    const centreGlassSelect = document.getElementById('tripleCentreGlass');
    const innerGlassSelect = document.getElementById('tripleInnerGlass');
    const outerThicknessMatch = outerGlassSelect.options[outerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);
    const centreThicknessMatch = centreGlassSelect.options[centreGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);
    const innerThicknessMatch = innerGlassSelect.options[innerGlassSelect.selectedIndex].text.match(/(\d+(\.\d+)?)mm/);

    const outerThickness_mm = outerThicknessMatch ? parseFloat(outerThicknessMatch[1]) : 4;
    const centreThickness_mm = centreThicknessMatch ? parseFloat(centreThicknessMatch[1]) : 4;
    const innerThickness_mm = innerThicknessMatch ? parseFloat(innerThicknessMatch[1]) : 4;

    const density = 2500;
    const totalThickness_m = (outerThickness_mm + centreThickness_mm + innerThickness_mm) / 1000;
    const weight_kg = area * totalThickness_m * density;
    return weight_kg;
}

        // Validation
        function validateForm() {
            let isValid = true;

            // Clear previous errors
            document.querySelectorAll('.error-message').forEach(error => error.classList.add('hidden'));

            if (currentTab === 'single') {
                isValid = validateSingleForm() && isValid;
            } else if (currentTab === 'double') {
                isValid = validateDoubleForm() && isValid;
            } else if (currentTab === 'triple') {
                isValid = validateTripleForm() && isValid;
            }

            return isValid;
        }

        function validateSingleForm() {
            let isValid = true;

            // Validate glass type selection
            const glassTypeSelect = document.getElementById('singleGlassType');
            if (!glassTypeSelect.value) {
                alert('Please select a glass type');
                isValid = false;
            }

            // Validate shape selection first - check both selectedShapeData and form value
            const shapeValue = selectedShapeData.shape || document.getElementById('singleShape').value;
            if (!shapeValue) {
                alert('Please select and configure a shape');
                isValid = false;
            }

            // Validate dimensions - check both selectedShapeData and form values
            const width = selectedShapeData.width || parseFloat(document.getElementById('singleWidth').value);
            const height = selectedShapeData.height || parseFloat(document.getElementById('singleHeight').value);

            if (!width || width < 100 || width > 2800) {
                alert('Please configure the shape dimensions (width must be between 100-2800mm)');
                isValid = false;
            }

            if (!height || height < 100 || height > 2800) {
                alert('Please configure the shape dimensions (height must be between 100-2800mm)');
                isValid = false;
            }

            // Validate custom shape if "Other" is selected
            if (shapeValue === 'other') {
                const customShape = selectedShapeData.customShape || document.getElementById('singleCustomShape').value.trim();
                if (!customShape) {
                    alert('Please describe the custom shape');
                    isValid = false;
                }
            }

            return isValid;
        }

        function validateDoubleForm() {
            let isValid = true;

            // Validate dimensions - check both selectedShapeData and form values
            const width = selectedShapeData.width || parseFloat(document.getElementById('doubleWidth').value);
            const height = selectedShapeData.height || parseFloat(document.getElementById('doubleHeight').value);

            if (!width || width < 100 || width > 2800) {
                alert('Please configure the shape dimensions (width must be between 100-2800mm)');
                isValid = false;
            }

            if (!height || height < 100 || height > 2800) {
                alert('Please configure the shape dimensions (height must be between 100-2800mm)');
                isValid = false;
            }

            // Validate shape - check both selectedShapeData and form value
            const shapeValue = selectedShapeData.shape || document.getElementById('doubleShape').value;
            if (!shapeValue) {
                alert('Please select and configure a shape');
                isValid = false;
            }

            // Validate custom shape if "Other" is selected
            if (shapeValue === 'other') {
                const customShape = selectedShapeData.customShape || document.getElementById('doubleCustomShape').value.trim();
                if (!customShape) {
                    alert('Please describe the custom shape');
                    isValid = false;
                }
            }

            // Validate toughened glass
            if (!document.querySelector('input[name="doubleToughened"]:checked')) {
                alert('Please select toughened glass option');
                isValid = false;
            }

            // Pet flap is now optional (toggle switch), no validation needed

            return isValid;
        }

        function validateTripleForm() {
            let isValid = true;

            // Validate dimensions - check both selectedShapeData and form values
            const width = selectedShapeData.width || parseFloat(document.getElementById('tripleWidth').value);
            const height = selectedShapeData.height || parseFloat(document.getElementById('tripleHeight').value);

            if (!width || width < 100 || width > 2800) {
                alert('Please configure the shape dimensions (width must be between 100-2800mm)');
                isValid = false;
            }

            if (!height || height < 100 || height > 2800) {
                alert('Please configure the shape dimensions (height must be between 100-2800mm)');
                isValid = false;
            }

            // Validate shape - check both selectedShapeData and form value
            const shapeValue = selectedShapeData.shape || document.getElementById('tripleShape').value;
            if (!shapeValue) {
                alert('Please select and configure a shape');
                isValid = false;
            }

            // Validate custom shape if "Other" is selected
            if (shapeValue === 'other') {
                const customShape = selectedShapeData.customShape || document.getElementById('tripleCustomShape').value.trim();
                if (!customShape) {
                    alert('Please describe the custom shape');
                    isValid = false;
                }
            }

            // Validate toughened glass
            if (!document.querySelector('input[name="tripleToughened"]:checked')) {
                alert('Please select toughened glass option');
                isValid = false;
            }

            // Pet flap is now optional (toggle switch), no validation needed

            return isValid;
        }

        // Cart functionality
        function addToCart() {
            if (!validateForm()) {
                alert('Please fill in all required fields correctly.');
                return;
            }

            // Store the pending item details
            pendingCartItem = {
                id: Date.now(),
                type: currentTab,
                unitPrice: currentPrice,
                quantity: 1,
                details: getItemDetails()
            };

            console.log('Pending cart item:', pendingCartItem); // Debug log

            // Only show delivery modal if no delivery area has been selected yet
            if (!selectedDeliveryArea) {
                showDeliveryModal();
            } else {
                // Use existing delivery area selection for all subsequent orders
                addItemToCart();
            }
        }

        function getItemDetails() {
            let details = {};
            
            if (currentTab === 'single') {
                // Get shape data from selectedShapeData or fallback to form values
                const shapeValue = selectedShapeData.shape || document.getElementById('singleShape').value;
                const customShape = shapeValue === 'other' ? (selectedShapeData.customShape || document.getElementById('singleCustomShape').value) : '';
                const width = selectedShapeData.width || document.getElementById('singleWidth').value;
                const height = selectedShapeData.height || document.getElementById('singleHeight').value;
                const reference = selectedShapeData.reference || document.getElementById('singleReference').value;
                
                const extrasSelect = document.getElementById('singleExtras');
                const glassTypeSelect = document.getElementById('singleGlassType');
                
                // Get radio button values safely
                const polishedRadio = document.querySelector('input[name="singlePolished"]:checked');
                const toughenedRadio = document.querySelector('input[name="singleToughened"]:checked');
                
                details = {
                    width: width || '0',
                    height: height || '0',
                    reference: reference || '',
                    glassType: glassTypeSelect.selectedIndex > 0 ? glassTypeSelect.options[glassTypeSelect.selectedIndex].text : 'Not selected',
                    glassThickness: glassTypeSelect.dataset.selectedThickness || 'Not specified',
                    glassCorner: glassTypeSelect.dataset.selectedCorner || 'Not specified',
                    glassTintedColor: glassTypeSelect.dataset.selectedTintedColor || null,
                    shape: getShapeDisplayName(shapeValue) || 'Not selected',
                    customShape: customShape,
                    polished: polishedRadio ? (polishedRadio.value === 'yes' ? 'Yes' : 'No') : 'Yes',
                    toughened: toughenedRadio ? (toughenedRadio.value === 'yes' ? 'Yes' : 'No') : 'Yes',
                    petFlap: document.getElementById('singlePetFlap').checked ? 'Yes' : 'No',
                    extras: extrasSelect.selectedIndex > 0 ? extrasSelect.options[extrasSelect.selectedIndex].text : 'None',
                    uploadedFiles: selectedShapeData.uploadedFiles || []
                };
            } else if (currentTab === 'double') {
                const shapeValue = document.getElementById('doubleShape').value;
                const customShape = shapeValue === 'other' ? document.getElementById('doubleCustomShape').value : '';
                const extrasSelect = document.getElementById('doubleExtras');
                
                const outerGlassSelect = document.getElementById('doubleOuterGlass');
                const innerGlassSelect = document.getElementById('doubleInnerGlass');
                const spacerWidthSelect = document.getElementById('doubleSpacerWidth');
                const spacerTypeSelect = document.getElementById('doubleSpacerType');
                
                // Get radio button values safely
                const toughenedRadio = document.querySelector('input[name="doubleToughened"]:checked');
                
                details = {
                    width: document.getElementById('doubleWidth').value || '0',
                    height: document.getElementById('doubleHeight').value || '0',
                    reference: document.getElementById('doubleReference').value || '',
                    outerGlass: outerGlassSelect.selectedIndex > 0 ? outerGlassSelect.options[outerGlassSelect.selectedIndex].text : 'Not selected',
                    outerGlassPattern: outerGlassSelect.dataset.selectedPattern || null,
                    innerGlass: innerGlassSelect.selectedIndex > 0 ? innerGlassSelect.options[innerGlassSelect.selectedIndex].text : 'Not selected',
                    innerGlassPattern: innerGlassSelect.dataset.selectedPattern || null,
                    spacerWidth: spacerWidthSelect.selectedIndex > 0 ? spacerWidthSelect.options[spacerWidthSelect.selectedIndex].text : 'Not selected',
                    spacerColor: spacerTypeSelect.selectedIndex >= 0 ? spacerTypeSelect.options[spacerTypeSelect.selectedIndex].text : 'Silver',
                    shape: getShapeDisplayName(shapeValue) || 'Not selected',
                    customShape: customShape,
                    toughened: toughenedRadio ? (toughenedRadio.value === 'yes' ? 'Yes' : 'No') : 'Not selected',
                    petFlap: document.getElementById('doublePetFlap').checked ? 'Yes' : 'No',
                    extras: extrasSelect.selectedIndex > 0 ? extrasSelect.options[extrasSelect.selectedIndex].text : 'None',
                    uploadedFiles: window.uploadedFiles && window.uploadedFiles['double'] ? [...window.uploadedFiles['double']] : []
                };
            } else if (currentTab === 'triple') {
                const shapeValue = document.getElementById('tripleShape').value;
                const customShape = shapeValue === 'other' ? document.getElementById('tripleCustomShape').value : '';
                const extrasSelect = document.getElementById('tripleExtras');
                
                const outerGlassSelect = document.getElementById('tripleOuterGlass');
                const centreGlassSelect = document.getElementById('tripleCentreGlass');
                const innerGlassSelect = document.getElementById('tripleInnerGlass');
                const spacer1WidthSelect = document.getElementById('tripleSpacer1Width');
                const spacer2WidthSelect = document.getElementById('tripleSpacer2Width');
                const spacerTypeSelect = document.getElementById('tripleSpacerType');
                
                // Get radio button values safely
                const toughenedRadio = document.querySelector('input[name="tripleToughened"]:checked');
                
                details = {
                    width: document.getElementById('tripleWidth').value || '0',
                    height: document.getElementById('tripleHeight').value || '0',
                    reference: document.getElementById('tripleReference').value || '',
                    outerGlass: outerGlassSelect.selectedIndex > 0 ? outerGlassSelect.options[outerGlassSelect.selectedIndex].text : 'Not selected',
                    outerGlassPattern: outerGlassSelect.dataset.selectedPattern || null,
                    centreGlass: centreGlassSelect.selectedIndex > 0 ? centreGlassSelect.options[centreGlassSelect.selectedIndex].text : 'Not selected',
                    centreGlassPattern: centreGlassSelect.dataset.selectedPattern || null,
                    innerGlass: innerGlassSelect.selectedIndex > 0 ? innerGlassSelect.options[innerGlassSelect.selectedIndex].text : 'Not selected',
                    innerGlassPattern: innerGlassSelect.dataset.selectedPattern || null,
                    spacer1Width: spacer1WidthSelect.selectedIndex > 0 ? spacer1WidthSelect.options[spacer1WidthSelect.selectedIndex].text : 'Not selected',
                    spacer2Width: spacer2WidthSelect.selectedIndex > 0 ? spacer2WidthSelect.options[spacer2WidthSelect.selectedIndex].text : 'Not selected',
                    spacerColor: spacerTypeSelect.selectedIndex >= 0 ? spacerTypeSelect.options[spacerTypeSelect.selectedIndex].text : 'Silver',
                    shape: getShapeDisplayName(shapeValue) || 'Not selected',
                    customShape: customShape,
                    toughened: toughenedRadio ? (toughenedRadio.value === 'yes' ? 'Yes' : 'No') : 'Not selected',
                    petFlap: document.getElementById('triplePetFlap').checked ? 'Yes' : 'No',
                    extras: extrasSelect.selectedIndex > 0 ? extrasSelect.options[extrasSelect.selectedIndex].text : 'None',
                    uploadedFiles: window.uploadedFiles && window.uploadedFiles['triple'] ? [...window.uploadedFiles['triple']] : []
                };
            }
            
            console.log('Item details for', currentTab, ':', details); // Debug log
            return details;
        }

        function addItemToCart() {
            if (!pendingCartItem) return;

            cart.push(pendingCartItem);
            updateCartDisplay();
            showSuccessPopup();
            clearForm();
            pendingCartItem = null;
        }

        function clearForm() {
            // Clear form inputs for current tab
            if (currentTab === 'single') {
                document.getElementById('singleWidth').value = '';
                document.getElementById('singleHeight').value = '';
                document.getElementById('singleReference').value = '';
                document.getElementById('singleShape').value = '';
                document.getElementById('singleCustomShape').value = '';
                document.getElementById('singleGlassType').selectedIndex = 0;
                document.getElementById('singleExtras').selectedIndex = 0;
                // Reset radio buttons to default checked state for single unit
                document.querySelectorAll('input[name="singlePolished"]').forEach(radio => {
                    radio.checked = radio.value === 'yes';
                });
                document.querySelectorAll('input[name="singleToughened"]').forEach(radio => {
                    radio.checked = radio.value === 'yes';
                });
                document.getElementById('singlePetFlap').checked = false;
                document.querySelectorAll('.single-shape-option').forEach(opt => opt.classList.remove('shape-selected'));
                document.getElementById('singleArea').textContent = '0.000 m²';
                document.getElementById('singleShapeSummary').classList.add('hidden');
                clearUploadedFiles('single');
            } else if (currentTab === 'double') {
                document.getElementById('doubleWidth').value = '';
                document.getElementById('doubleHeight').value = '';
                document.getElementById('doubleReference').value = '';
                document.getElementById('doubleShape').value = '';
                document.getElementById('doubleCustomShape').value = '';
                document.getElementById('doubleOuterGlass').selectedIndex = 0;
                document.getElementById('doubleInnerGlass').selectedIndex = 0;
                document.getElementById('doubleSpacerWidth').selectedIndex = 0;
                document.getElementById('doubleSpacerType').selectedIndex = 0;
                document.getElementById('doubleExtras').selectedIndex = 0;
                document.querySelectorAll('input[name="doubleToughened"]').forEach(radio => radio.checked = false);
                document.getElementById('doublePetFlap').checked = false;
                document.querySelectorAll('.double-shape-option').forEach(opt => opt.classList.remove('shape-selected'));
                document.getElementById('doubleArea').textContent = '0.000 m²';
                document.getElementById('doubleShapeSummary').classList.add('hidden');
                clearUploadedFiles('double');
            } else if (currentTab === 'triple') {
                document.getElementById('tripleWidth').value = '';
                document.getElementById('tripleHeight').value = '';
                document.getElementById('tripleReference').value = '';
                document.getElementById('tripleShape').value = '';
                document.getElementById('tripleCustomShape').value = '';
                document.getElementById('tripleOuterGlass').selectedIndex = 0;
                document.getElementById('tripleCentreGlass').selectedIndex = 0;
                document.getElementById('tripleInnerGlass').selectedIndex = 0;
                document.getElementById('tripleSpacer1Width').selectedIndex = 0;
                document.getElementById('tripleSpacer2Width').selectedIndex = 0;
                document.getElementById('tripleSpacerType').selectedIndex = 0;
                document.getElementById('tripleExtras').selectedIndex = 0;
                document.querySelectorAll('input[name="tripleToughened"]').forEach(radio => radio.checked = false);
                document.getElementById('triplePetFlap').checked = false;
                document.querySelectorAll('.triple-shape-option').forEach(opt => opt.classList.remove('shape-selected'));
                document.getElementById('tripleArea').textContent = '0.000 m²';
                document.getElementById('tripleShapeSummary').classList.add('hidden');
                clearUploadedFiles('triple');
            }
            
            // Clear the global shape data
            selectedShapeData = {
                shape: null,
                customShape: '',
                width: null,
                height: null,
                reference: '',
                uploadedFiles: []
            };
            
            calculatePrice();
        }

        function updateCartDisplay() {
            const cartItemsContainer = document.getElementById('cartItems');
            const cartSummary = document.getElementById('cartSummary');
            
            if (cart.length === 0) {
                cartItemsContainer.innerHTML = `
                    <div class="cart-empty">
                        <svg fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
                        </svg>
                        <p class="text-lg font-medium">Your cart is empty</p>
                        <p class="text-sm mt-2">Add some glass units to get started</p>
                    </div>
                `;
                cartSummary.classList.add('hidden');
                return;
            }
            
            let cartHTML = '';
            cart.forEach((item, index) => {
                const totalPrice = item.unitPrice * item.quantity;
                const area = (parseFloat(item.details.width) / 1000) * (parseFloat(item.details.height) / 1000);
                
                // Get thumbnail image based on type
                const thumbnailImage = getTypeThumbnail(item.type);
                
                cartHTML += `
                    <div class="cart-item">
                        <div class="flex gap-4 mb-3">
                            <div class="flex-shrink-0">
                                <img src="${thumbnailImage}" alt="${item.type} glass" class="w-16 h-16 object-cover rounded-lg border-2 border-gray-200">
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-start">
                                    <div>
                                        <h4 class="font-semibold text-gray-800 capitalize">${item.type} ${item.type === 'single' ? 'Unit' : 'Glazed'}</h4>
                                        <p class="text-sm text-gray-600">${item.details.width}mm × ${item.details.height}mm (${area.toFixed(3)} m²)</p>
                                        ${item.details.reference ? `<p class="text-sm text-gray-500">Ref: ${item.details.reference}</p>` : ''}
                                    </div>
                                    <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700 ml-2">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="text-sm text-gray-600 space-y-1 mb-3">
                            ${getItemDisplayDetails(item)}
                        </div>
                        
                        <div class="flex justify-between items-center">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)" ${item.quantity <= 1 ? 'disabled' : ''}>-</button>
                                <span class="quantity-display">${item.quantity}</span>
                                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-bold text-blue-600">£${totalPrice.toFixed(2)}</p>
                                <p class="text-xs text-gray-500">excl. VAT</p>
                            </div>
                        </div>
                    </div>
                `;
            });
            
            cartItemsContainer.innerHTML = cartHTML;
            cartSummary.classList.remove('hidden');
            updateCartSummary();
        }

        function getItemDisplayDetails(item) {
            let details = [];
            
            if (item.type === 'single') {
                // Glass type with configuration details - avoid duplication
                let glassInfo = item.details.glassType;
                const width = parseFloat(item.details.width) || 0;
    const height = parseFloat(item.details.height) || 0;
    const area = Math.max((width / 1000) * (height / 1000), 0.3);
    const thickness_mm = parseFloat(item.details.glassThickness) || 4;
    const thickness_m = thickness_mm / 1000;
    const density = 2500;
    const weight_kg = area * thickness_m * density;
    details.push(`Weight: ${weight_kg.toFixed(2)} kg`);
                // Check if configuration is already in the glass type name
                if (!glassInfo.includes('(') && item.details.glassThickness && item.details.glassThickness !== 'Not specified') {
                    glassInfo += ` (${item.details.glassThickness}`;
                    if (item.details.glassCorner && item.details.glassCorner !== 'Not specified') {
                        glassInfo += `, ${item.details.glassCorner}`;
                    }
                    if (item.details.glassTintedColor) {
                        glassInfo += `, ${item.details.glassTintedColor}`;
                    }
                    glassInfo += ')';
                }
                details.push(`Glass: ${glassInfo}`);
                
                // Shape
                const shapeDisplay = item.details.customShape && item.details.customShape.trim() ? 
                    item.details.customShape : item.details.shape;
                details.push(`Shape: ${shapeDisplay}`);
                
                // Polished and Toughened
                details.push(`Polished (P.A.R): ${item.details.polished}`);
                details.push(`Toughened: ${item.details.toughened}`);
                
                // Pet Flap
                if (item.details.petFlap === 'Yes') {
                    details.push(`Pet Flap: Yes`);
                }
                
                // Extras
                if (item.details.extras && item.details.extras !== 'None') {
                    details.push(`Extras: ${item.details.extras}`);
                }
            } else {
                // Double/Triple glazed details - check if pattern is already in the glass name
                if (item.type === 'double') {
    const width = parseFloat(item.details.width) || 0;
    const height = parseFloat(item.details.height) || 0;
    const area = Math.max((width / 1000) * (height / 1000), 0.3);

    const outerThicknessMatch = item.details.outerGlass.match(/(\d+(\.\d+)?)mm/);
    const innerThicknessMatch = item.details.innerGlass.match(/(\d+(\.\d+)?)mm/);

    const outerThickness_mm = outerThicknessMatch ? parseFloat(outerThicknessMatch[1]) : 4;
    const innerThickness_mm = innerThicknessMatch ? parseFloat(innerThicknessMatch[1]) : 4;

    const density = 2500;
    const totalThickness_m = (outerThickness_mm + innerThickness_mm) / 1000;
    const weight_kg = area * totalThickness_m * density;
    details.push(`Weight: ${weight_kg.toFixed(2)} kg`);
} else if (item.type === 'triple') {
    const width = parseFloat(item.details.width) || 0;
    const height = parseFloat(item.details.height) || 0;
    const area = Math.max((width / 1000) * (height / 1000), 0.3);

    const outerThicknessMatch = item.details.outerGlass.match(/(\d+(\.\d+)?)mm/);
    const centreThicknessMatch = item.details.centreGlass.match(/(\d+(\.\d+)?)mm/);
    const innerThicknessMatch = item.details.innerGlass.match(/(\d+(\.\d+)?)mm/);

    const outerThickness_mm = outerThicknessMatch ? parseFloat(outerThicknessMatch[1]) : 4;
    const centreThickness_mm = centreThicknessMatch ? parseFloat(centreThicknessMatch[1]) : 4;
    const innerThickness_mm = innerThicknessMatch ? parseFloat(innerThicknessMatch[1]) : 4;

    const density = 2500;
    const totalThickness_m = (outerThickness_mm + centreThickness_mm + innerThickness_mm) / 1000;
    const weight_kg = area * totalThickness_m * density;
    details.push(`Weight: ${weight_kg.toFixed(2)} kg`);
}

                const outerGlassDisplay = item.details.outerGlass.includes('(') ? 
                    item.details.outerGlass : 
                    `${item.details.outerGlass}${item.details.outerGlassPattern ? ` (${item.details.outerGlassPattern})` : ''}`;
                details.push(`Outer: ${outerGlassDisplay}`);
                
                if (item.details.centreGlass && item.details.centreGlass !== 'Not selected') {
                    const centreGlassDisplay = item.details.centreGlass.includes('(') ? 
                        item.details.centreGlass : 
                        `${item.details.centreGlass}${item.details.centreGlassPattern ? ` (${item.details.centreGlassPattern})` : ''}`;
                    details.push(`Centre: ${centreGlassDisplay}`);
                }
                
                const innerGlassDisplay = item.details.innerGlass.includes('(') ? 
                    item.details.innerGlass : 
                    `${item.details.innerGlass}${item.details.innerGlassPattern ? ` (${item.details.innerGlassPattern})` : ''}`;
                details.push(`Inner: ${innerGlassDisplay}`);
                
                // Spacer information
                if (item.details.spacerWidth && item.details.spacerWidth !== 'Not selected') {
                    details.push(`Spacer: ${item.details.spacerWidth} ${item.details.spacerColor}`);
                } else if (item.details.spacer1Width && item.details.spacer1Width !== 'Not selected') {
                    details.push(`Spacers: ${item.details.spacer1Width} & ${item.details.spacer2Width} ${item.details.spacerColor}`);
                }
                
                // Shape
                const shapeDisplay = item.details.customShape && item.details.customShape.trim() ? 
                    item.details.customShape : item.details.shape;
                details.push(`Shape: ${shapeDisplay}`);
                
                // Toughened
                details.push(`Toughened: ${item.details.toughened}`);
                
                // Pet Flap
                if (item.details.petFlap === 'Yes') {
                    details.push(`Pet Flap: Yes`);
                }
                
                // Extras
                if (item.details.extras && item.details.extras !== 'None') {
                    details.push(`Extras: ${item.details.extras}`);
                }
            }
            
            // Add reference if available
            if (item.details.reference && item.details.reference.trim()) {
                details.push(`Reference: ${item.details.reference}`);
            }
            
            // Add file count if files uploaded
            if (item.details.uploadedFiles && item.details.uploadedFiles.length > 0) {
                details.push(`Files: ${item.details.uploadedFiles.length} uploaded`);
            }
            
            return details.map(detail => `<p>• ${detail}</p>`).join('');
        }

        function updateQuantity(index, change) {
            if (cart[index]) {
                cart[index].quantity = Math.max(1, cart[index].quantity + change);
                updateCartDisplay();
            }
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCartDisplay();
        }

        function updateCartSummary() {
            const subtotal = cart.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0);
            const vat = subtotal * 0.2;
            const total = subtotal + vat + deliveryCharge;
            
            document.getElementById('cartSubtotal').textContent = subtotal.toFixed(2);
            document.getElementById('cartVAT').textContent = vat.toFixed(2);
            document.getElementById('cartTotal').textContent = total.toFixed(2);
            
            // Show/hide shipping row
            const shippingRow = document.getElementById('cartShippingRow');
            const shippingLabel = document.getElementById('cartShippingLabel');
            const shippingAmount = document.getElementById('cartShipping');
            
            if (deliveryCharge > 0) {
                shippingRow.classList.remove('hidden');
                shippingLabel.textContent = selectedDeliveryArea === 1 ? 'Delivery (Area 1):' : 'Delivery (Area 2):';
                shippingAmount.textContent = deliveryCharge.toFixed(2);
            } else {
                shippingRow.classList.add('hidden');
            }
        }

        // Delivery modal functionality
        function initializeDeliveryModal() {
            const modal = document.getElementById('deliveryModal');
            const closeBtn = document.getElementById('closeDeliveryModal');
            const cancelBtn = document.getElementById('cancelDelivery');
            const confirmBtn = document.getElementById('confirmDelivery');
            
            closeBtn.addEventListener('click', hideDeliveryModal);
            cancelBtn.addEventListener('click', hideDeliveryModal);
            confirmBtn.addEventListener('click', confirmDeliverySelection);
            
            // Delivery area selection
            document.querySelectorAll('.delivery-area').forEach(area => {
                area.addEventListener('click', function() {
                    document.querySelectorAll('.delivery-area').forEach(a => a.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    const areaNumber = parseInt(this.dataset.area);
                    const charge = parseFloat(this.dataset.charge);
                    
                    selectedDeliveryArea = areaNumber;
                    deliveryCharge = charge;
                    
                    confirmBtn.disabled = false;
                });
            });
        }

        function showDeliveryModal() {
            document.getElementById('deliveryModal').classList.remove('hidden');
        }

        function hideDeliveryModal() {
            document.getElementById('deliveryModal').classList.add('hidden');
            //pendingCartItem = null; #4261 (make it as comment)
        }

        function confirmDeliverySelection() {
            hideDeliveryModal();
            addItemToCart();
        }

        // Pattern modal functionality
        function initializePatternModal() {
            const modal = document.getElementById('patternModal');
            const closeBtn = document.getElementById('closePatternModal');
            const cancelBtn = document.getElementById('cancelPattern');
            const confirmBtn = document.getElementById('confirmPattern');
            
            closeBtn.addEventListener('click', hidePatternModal);
            cancelBtn.addEventListener('click', hidePatternModal);
            confirmBtn.addEventListener('click', confirmPatternSelection);
            
            // Pattern selection
            document.querySelectorAll('.pattern-option').forEach(option => {
                option.addEventListener('click', function() {
                    document.querySelectorAll('.pattern-option').forEach(opt => opt.classList.remove('selected'));
                    this.classList.add('selected');
                    
                    selectedPattern = this.dataset.pattern;
                    confirmBtn.disabled = false;
                });
            });
        }

        function showPatternModal(selectElement) {
            pendingPatternSelection = selectElement;
            selectedPattern = null;
            document.querySelectorAll('.pattern-option').forEach(opt => opt.classList.remove('selected'));
            document.getElementById('confirmPattern').disabled = true;
            document.getElementById('patternModal').classList.remove('hidden');
        }

        function hidePatternModal() {
            document.getElementById('patternModal').classList.add('hidden');
            if (pendingPatternSelection && !selectedPattern) {
                // Reset the select to previous value if no pattern was selected
                pendingPatternSelection.selectedIndex = 0;
            }
            pendingPatternSelection = null;
            selectedPattern = null;
        }

        function confirmPatternSelection() {
            if (pendingPatternSelection && selectedPattern) {
                // Store the selected pattern in the select element's dataset
                pendingPatternSelection.dataset.selectedPattern = selectedPattern;
                
                // Update the display text to show pattern selection
                const selectedOption = pendingPatternSelection.options[pendingPatternSelection.selectedIndex];
                const baseText = selectedOption.text.split(' (')[0];
                selectedOption.text = `${baseText} (${selectedPattern})`;
            }
            
            hidePatternModal();
            calculatePrice();
        }

        // Shape dimensions modal functionality
        function initializeShapeDimensionsModal() {
            const modal = document.getElementById('shapeDimensionsModal');
            const closeBtn = document.getElementById('closeShapeDimensionsModal');
            const cancelBtn = document.getElementById('cancelShapeDimensions');
            const confirmBtn = document.getElementById('confirmShapeDimensions');
            
            if (closeBtn) closeBtn.addEventListener('click', hideShapeDimensionsModal);
            if (cancelBtn) cancelBtn.addEventListener('click', hideShapeDimensionsModal);
            if (confirmBtn) confirmBtn.addEventListener('click', confirmShapeDimensionsSelection);
            
            // Modal dimension inputs
            const modalWidth = document.getElementById('modalWidth');
            const modalHeight = document.getElementById('modalHeight');
            
            if (modalWidth) modalWidth.addEventListener('input', updateModalArea);
            if (modalHeight) modalHeight.addEventListener('input', updateModalArea);
            
            // Modal file upload
            const modalFileInput = document.getElementById('modalDrawingFile');
            if (modalFileInput) {
                modalFileInput.addEventListener('change', function(e) {
                    handleModalFileUpload(e);
                });
            }
        }

        function showShapeDimensionsModal(shapeElement) {
            const modal = document.getElementById('shapeDimensionsModal');
            
            // Extract shape data from the clicked element
            const shapeData = {
                shape: shapeElement.dataset.shape,
                price: shapeElement.dataset.price,
                name: shapeElement.querySelector('p.text-sm.font-medium').textContent,
                image: shapeElement.querySelector('img').src
            };
            
            // Store the current shape being configured
            selectedShapeData.shape = shapeData.shape;
            
            // Populate modal with shape info
            document.getElementById('modalShapeImage').src = shapeData.image;
            document.getElementById('modalShapeImage').alt = shapeData.name + ' Shape';
            document.getElementById('modalShapeName').textContent = shapeData.name;
            document.getElementById('modalShapePrice').textContent = `+${shapeData.price}% price modifier`;
            
            // Show/hide custom shape input
            const customShapeContainer = document.getElementById('modalCustomShapeContainer');
            if (shapeData.shape === 'other') {
                customShapeContainer.classList.remove('hidden');
            } else {
                customShapeContainer.classList.add('hidden');
            }
            
            // Pre-fill with existing data if editing the same shape
            const existingWidth = document.getElementById(pendingShapeSelection + 'Width').value;
            const existingHeight = document.getElementById(pendingShapeSelection + 'Height').value;
            const existingReference = document.getElementById(pendingShapeSelection + 'Reference').value;
            const existingCustomShape = document.getElementById(pendingShapeSelection + 'CustomShape').value;
            
            if (existingWidth && existingHeight) {
                document.getElementById('modalWidth').value = existingWidth;
                document.getElementById('modalHeight').value = existingHeight;
                document.getElementById('modalReference').value = existingReference || '';
                document.getElementById('modalCustomShape').value = existingCustomShape || '';
                
                // Restore uploaded files for this tab
                selectedShapeData.uploadedFiles = window.uploadedFiles && window.uploadedFiles[pendingShapeSelection] ? [...window.uploadedFiles[pendingShapeSelection]] : [];
                
                updateModalArea();
                updateModalFileDisplay();
            } else {
                // Clear form for new selection
                document.getElementById('modalWidth').value = '';
                document.getElementById('modalHeight').value = '';
                document.getElementById('modalReference').value = '';
                document.getElementById('modalCustomShape').value = '';
                document.getElementById('modalArea').textContent = '0.000 m²';
                selectedShapeData.uploadedFiles = [];
                updateModalFileDisplay();
            }
            
            // Clear error messages
            document.querySelectorAll('#shapeDimensionsModal .error-message').forEach(error => error.classList.add('hidden'));
            
            modal.classList.remove('hidden');
        }

        function hideShapeDimensionsModal() {
            document.getElementById('shapeDimensionsModal').classList.add('hidden');
            pendingShapeSelection = null;
        }

        function confirmShapeDimensionsSelection() {
            // Validate form
            let isValid = true;
            const width = parseFloat(document.getElementById('modalWidth').value);
            const height = parseFloat(document.getElementById('modalHeight').value);
            const customShape = document.getElementById('modalCustomShape').value.trim();
            
            // Clear previous errors
            document.querySelectorAll('#shapeDimensionsModal .error-message').forEach(error => error.classList.add('hidden'));
            
            if (!width || width < 100 || width > 2800) {
                document.getElementById('modalWidthError').classList.remove('hidden');
                isValid = false;
            }
            
            if (!height || height < 100 || height > 2800) {
                document.getElementById('modalHeightError').classList.remove('hidden');
                isValid = false;
            }
            
            // Check custom shape if "Other" is selected
            if (selectedShapeData.shape === 'other' && !customShape) {
                document.getElementById('modalCustomShapeError').classList.remove('hidden');
                isValid = false;
            }
            
            if (!isValid) return;
            
            // Store the complete shape data
            selectedShapeData = {
                shape: selectedShapeData.shape,
                customShape: customShape,
                width: width,
                height: height,
                reference: document.getElementById('modalReference').value,
                uploadedFiles: [...(selectedShapeData.uploadedFiles || [])]
            };
            
            // Update the main form
            updateMainFormFromModal();
            
            // Close the modal automatically
            hideShapeDimensionsModal();
        }

        function updateMainFormFromModal() {
            if (!pendingShapeSelection) return;
            
            const tabType = pendingShapeSelection;
            
            // Update hidden inputs and displays
            document.getElementById(tabType + 'Shape').value = selectedShapeData.shape;
            document.getElementById(tabType + 'Width').value = selectedShapeData.width;
            document.getElementById(tabType + 'Height').value = selectedShapeData.height;
            document.getElementById(tabType + 'Reference').value = selectedShapeData.reference;
            
            if (selectedShapeData.shape === 'other') {
                document.getElementById(tabType + 'CustomShape').value = selectedShapeData.customShape;
            }
            
            // Update area display
            updateArea(tabType);
            
            // Update shape summary
            const shapeSummary = document.getElementById(tabType + 'ShapeSummary');
            if (shapeSummary) {
                const shapeName = document.getElementById(tabType + 'SelectedShapeName');
                const shapeDimensions = document.getElementById(tabType + 'SelectedDimensions');
                const shapeArea = document.getElementById(tabType + 'SelectedArea');
                const referenceElement = document.getElementById(tabType + 'SelectedReference');
                const referenceText = document.getElementById(tabType + 'SelectedReferenceText');
                
                if (shapeName) {
                    const displayName = selectedShapeData.shape === 'other' ? selectedShapeData.customShape : getShapeDisplayName(selectedShapeData.shape);
                    shapeName.textContent = displayName;
                }
                
                if (shapeDimensions) {
                    shapeDimensions.textContent = `${selectedShapeData.width}mm × ${selectedShapeData.height}mm`;
                }
                
                if (shapeArea) {
                    const area = (selectedShapeData.width / 1000) * (selectedShapeData.height / 1000);
                    shapeArea.textContent = area.toFixed(3) + ' m²';
                }
                // Update weight display
const weightSpan = document.getElementById(tabType + 'SelectedWeight');
if (weightSpan) {
    let weight = 0;
    if (tabType === 'single') weight = calculateSingleWeight();
    else if (tabType === 'double') weight = calculateDoubleWeight();
    else if(tabType === 'triple') weight = calculateTripleWeight();
    weightSpan.textContent = weight.toFixed(2) + ' kg';
}
                
                if (selectedShapeData.reference && referenceElement && referenceText) {
                    referenceText.textContent = selectedShapeData.reference;
                    referenceElement.style.display = 'block';
                } else if (referenceElement) {
                    referenceElement.style.display = 'none';
                }
                
                shapeSummary.classList.remove('hidden');
            }
            
            // Update uploaded files for the tab
            if (!window.uploadedFiles) window.uploadedFiles = {};
            window.uploadedFiles[tabType] = [...selectedShapeData.uploadedFiles];
            updateFileDisplay(tabType);
            
            // Mark shape as selected visually - use correct class names
            const shapeClassMap = {
                'single': 'single-shape-option',
                'double': 'double-shape-option', 
                'triple': 'triple-shape-option'
            };
            
            const shapeClass = shapeClassMap[tabType];
            if (shapeClass) {
                // Clear all selections for this tab
                document.querySelectorAll(`.${shapeClass}`).forEach(opt => opt.classList.remove('shape-selected'));
                
                // Mark the selected shape
                const selectedShapeElement = document.querySelector(`.${shapeClass}[data-shape="${selectedShapeData.shape}"]`);
                if (selectedShapeElement) {
                    selectedShapeElement.classList.add('shape-selected');
                }
            }
            
            calculatePrice();
        }

        function updateModalArea() {
            const width = parseFloat(document.getElementById('modalWidth').value) || 0;
            const height = parseFloat(document.getElementById('modalHeight').value) || 0;
            const areaInSquareMeters = (width / 1000) * (height / 1000);
            
            document.getElementById('modalArea').textContent = areaInSquareMeters.toFixed(3) + ' m²';
        }

        function handleModalFileUpload(event) {
            const files = Array.from(event.target.files);
            
            if (files.length === 0) return;
            
            // Validate files
            const validFiles = [];
            const maxSize = 10 * 1024 * 1024; // 10MB
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
            
            files.forEach(file => {
                if (file.size > maxSize) {
                    alert(`File "${file.name}" is too large. Maximum size is 10MB.`);
                    return;
                }
                
                if (!allowedTypes.includes(file.type)) {
                    alert(`File "${file.name}" is not a supported format. Please use PNG, JPG, PDF, or DOCX.`);
                    return;
                }
                
                validFiles.push(file);
            });
            
            if (validFiles.length === 0) {
                event.target.value = '';
                return;
            }
            
            // Add to selectedShapeData
            selectedShapeData.uploadedFiles = [...selectedShapeData.uploadedFiles, ...validFiles];
            
            // Update display
            updateModalFileDisplay();
            
            // Clear the input
            event.target.value = '';
        }

        function updateModalFileDisplay() {
            const fileListContainer = document.getElementById('modalFileList');
            const files = selectedShapeData.uploadedFiles || [];
            
            if (files.length === 0) {
                fileListContainer.classList.add('hidden');
                return;
            }
            
            fileListContainer.classList.remove('hidden');
            
            let html = '';
            files.forEach((file, index) => {
                const fileSize = formatFileSize(file.size);
                const fileIcon = getFileIcon(file.type);
                
                html += `
                    <div class="file-item">
                        ${fileIcon}
                        <div class="file-info">
                            <div class="file-name" title="${file.name}">${file.name}</div>
                            <div class="file-size">${fileSize}</div>
                        </div>
                        <svg class="file-remove" onclick="removeModalFile(${index})" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                `;
            });
            
            fileListContainer.innerHTML = html;
        }

        function removeModalFile(index) {
            selectedShapeData.uploadedFiles.splice(index, 1);
            updateModalFileDisplay();
        }

        // Glass configuration modal functionality
        function initializeGlassConfigModal() {
            const modal = document.getElementById('glassConfigModal');
            const closeBtn = document.getElementById('closeGlassConfigModal');
            const cancelBtn = document.getElementById('cancelGlassConfig');
            const confirmBtn = document.getElementById('confirmGlassConfig');
            
            closeBtn.addEventListener('click', hideGlassConfigModal);
            cancelBtn.addEventListener('click', hideGlassConfigModal);
            confirmBtn.addEventListener('click', confirmGlassConfigSelection);
            
            // Thickness selection
            document.addEventListener('click', function(e) {
                if (e.target.closest('.thickness-option')) {
                    document.querySelectorAll('.thickness-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.closest('.thickness-option').classList.add('selected');
                    selectedGlassConfig.thickness = e.target.closest('.thickness-option').dataset.thickness;
                    updateConfirmButton();
                }
            });
            
            // Tinted color selection
            document.addEventListener('click', function(e) {
                if (e.target.closest('.tinted-color-option')) {
                    document.querySelectorAll('.tinted-color-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.closest('.tinted-color-option').classList.add('selected');
                    selectedGlassConfig.tintedColor = e.target.closest('.tinted-color-option').dataset.color;
                    updateConfirmButton();
                }
            });
            
            // Corner selection
            document.addEventListener('click', function(e) {
                if (e.target.closest('.corner-option')) {
                    document.querySelectorAll('.corner-option').forEach(opt => opt.classList.remove('selected'));
                    e.target.closest('.corner-option').classList.add('selected');
                    selectedGlassConfig.corner = e.target.closest('.corner-option').dataset.corner;
                    updateConfirmButton();
                }
            });
        }

        function showGlassConfigModal(selectElement) {
            pendingGlassConfigSelection = selectElement;
            selectedGlassConfig = {
                thickness: null,
                tintedColor: null,
                corner: null
            };
            
            const glassType = selectElement.value;
            
            // Clear previous selections
            document.querySelectorAll('.thickness-option, .tinted-color-option, .corner-option').forEach(opt => opt.classList.remove('selected'));
            
            // Populate thickness options based on glass type
            populateThicknessOptions(glassType);
            
            // Show/hide tinted color section
            const tintedColorSection = document.getElementById('tintedColorSection');
            if (glassType === 'tinted-tgh') {
                tintedColorSection.classList.remove('hidden');
            } else {
                tintedColorSection.classList.add('hidden');
                selectedGlassConfig.tintedColor = null; // Reset tinted color if not tinted glass
            }
            
            updateConfirmButton();
            document.getElementById('glassConfigModal').classList.remove('hidden');
        }

        function populateThicknessOptions(glassType) {
            const thicknessContainer = document.getElementById('thicknessOptions');
            let thicknesses = [];
            
            // Define available thicknesses based on glass type
            if (glassType === 'tinted-tgh') {
                thicknesses = ['6mm', '10mm'];
            } else {
                thicknesses = ['4mm', '6mm', '8mm', '10mm'];
            }
            
            // Define different images for each thickness
            const thicknessImages = {
                '4mm': 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=150&h=150&fit=crop&crop=center',
                '6mm': 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&h=150&fit=crop&crop=center',
                '8mm': 'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=150&h=150&fit=crop&crop=center',
                '10mm': 'https://images.unsplash.com/photo-1572021335469-31706a17aaef?w=150&h=150&fit=crop&crop=center'
            };
            
            let html = '';
            thicknesses.forEach(thickness => {
                html += `
                    <div class="pattern-option thickness-option" data-thickness="${thickness}">
                        <img src="${thicknessImages[thickness]}" 
                             alt="${thickness} Thickness" class="glass-config-image">
                        <h4 class="text-md font-semibold text-gray-800">${thickness}</h4>
                        <p class="text-sm text-gray-600 mt-2">${thickness} thickness</p>
                    </div>
                `;
            });
            
            thicknessContainer.innerHTML = html;
        }

        function updateConfirmButton() {
            const confirmBtn = document.getElementById('confirmGlassConfig');
            const glassType = pendingGlassConfigSelection ? pendingGlassConfigSelection.value : '';
            
            // Check if all required selections are made
            let isValid = selectedGlassConfig.thickness && selectedGlassConfig.corner;
            
            // For tinted glass, also require color selection
            if (glassType === 'tinted-tgh') {
                isValid = isValid && selectedGlassConfig.tintedColor;
            }
            
            confirmBtn.disabled = !isValid;
        }

        function hideGlassConfigModal() {
            document.getElementById('glassConfigModal').classList.add('hidden');
            if (pendingGlassConfigSelection && (!selectedGlassConfig.thickness || !selectedGlassConfig.corner)) {
                // Reset the select to previous value if configuration was not completed
                pendingGlassConfigSelection.selectedIndex = 0;
            }
            pendingGlassConfigSelection = null;
            selectedGlassConfig = {
                thickness: null,
                tintedColor: null,
                corner: null
            };
        }

        function confirmGlassConfigSelection() {
            if (pendingGlassConfigSelection && selectedGlassConfig.thickness && selectedGlassConfig.corner) {
                // Store the selected configuration in the select element's dataset
                pendingGlassConfigSelection.dataset.selectedThickness = selectedGlassConfig.thickness;
                pendingGlassConfigSelection.dataset.selectedCorner = selectedGlassConfig.corner;
                
                if (selectedGlassConfig.tintedColor) {
                    pendingGlassConfigSelection.dataset.selectedTintedColor = selectedGlassConfig.tintedColor;
                }
                
                // Update the display text to show configuration
                const selectedOption = pendingGlassConfigSelection.options[pendingGlassConfigSelection.selectedIndex];
                let configText = ` (${selectedGlassConfig.thickness}, ${selectedGlassConfig.corner}`;
                
                if (selectedGlassConfig.tintedColor) {
                    configText += `, ${selectedGlassConfig.tintedColor}`;
                }
                
                configText += ')';
                
                // Remove any existing configuration text and add new one
                selectedOption.text = selectedOption.text.split(' (')[0] + configText;
            }
            
            hideGlassConfigModal();
            calculatePrice();
        }

        // Success popup
        function showSuccessPopup() {
            const popup = document.getElementById('successPopup');
            popup.classList.add('show');
            
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }