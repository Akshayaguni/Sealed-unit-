// Global variables
let currentTab = "single";
// Auto-detect current tab based on URL
if (typeof window !== "undefined") {
  const path = window.location.pathname.toLowerCase();
  if (path.includes("doubleglazed")) {
    currentTab = "double";
  } else if (path.includes("tripleglazed")) {
    currentTab = "triple";
  } else {
    currentTab = "single";
  }
}
let cart = [];
let currentPrice = 0;
let currentShapeTarget = "";
let selectedShape = null;
let shapeData = {
  currentShape: null,
  rotation: 0,
  widthA: 0,
  heightA: 0,
  lengthC: 0,
  customName: "",
  reference: "",
  templateFile: null,
};

const singleUnitPricing = {
  "4mm": {
    clear: 93.3,
    "low-iron": 122.49,
    satin: 123.0,
    "painted-ral-9010": 192.3, // Assuming White
    "painted-ral-9016": 192.3, // Assuming White
    "painted-custom-white": 192.3, // Assuming White
    "painted-custom-black": 192.3, // Assuming Black
    black: 192.3, // Direct mapping for black glass type
  },
  "6mm": {
    clear: 111.6,
    "low-iron": 138.53,
    satin: 167.7,
    "tinted-bronze": 186.8,
    "tinted-grey": 186.8,
    "painted-ral-9010": 207.3, // Assuming White
    "painted-ral-9016": 207.3, // Assuming White
    "painted-custom-white": 207.3, // Assuming White
    "painted-custom-black": 207.3, // Assuming Black
    black: 207.3,
  },
  "8mm": {
    clear: 132.5,
    "low-iron": 197.08,
    satin: 207.3,
    "painted-ral-9010": 266.7, // Assuming White
    "painted-ral-9016": 266.7, // Assuming White
    "painted-custom-white": 266.7, // Assuming White
    "painted-custom-black": 266.7, // Assuming Black
    black: 266.7,
  },
  "10mm": {
    clear: 149.0,
    "low-iron": 228.97,
    satin: 227.1,
    "tinted-bronze": 263.4,
    "tinted-grey": 263.4,
    "painted-ral-9010": 298.6, // Assuming White
    "painted-ral-9016": 298.6, // Assuming White
    "painted-custom-white": 298.6, // Assuming White
    "painted-custom-black": 298.6, // Assuming Black
    black: 298.6,
  },
};
const doubleGlazedPricing = {
  external: {
    "4mm-clear": 39.75,
    "4mm-pattern": 45.05,
    "4mm-satin": 99.6,
    "6mm-clear": 65.25,
    "6.4mm-clear-laminate": 95.0,
    "6.8mm-acoustic": 111.3,
  },
  internal: {
    "4mm-clear": 39.75,
    "4mm-planitherm": 45.05,
    "4mm-planitherm-1": 65.4,
    "6mm-clear": 65.25,
    "6mm-planitherm": 89.7,
    "6mm-planitherm-laminate": 106.0,
  },
};
const tripleGlazedPricing = {
  external: {
    "4mm-clear": 39.75,
    "4mm-pattern": 45.05,
    "4mm-satin": 99.6,
    "6mm-clear": 65.25,
    "6.4mm-clear-laminate": 95.0,
    "6.8mm-acoustic": 111.3,
  },
  centre: {
    "4mm-clear": 39.75,
    "4mm-planitherm": 45.05,
    "4mm-planitherm-1": 65.4,
    "6mm-clear": 65.25,
    "6mm-planitherm": 89.7,
    "6mm-planitherm-laminate": 106.0,
  },
  internal: {
    "4mm-clear": 39.75,
    "4mm-planitherm": 45.05,
    "4mm-planitherm-1": 65.4,
    "6mm-clear": 65.25,
    "6mm-planitherm": 89.7,
    "6mm-planitherm-laminate": 106.0,
  },
};
// Initialize the calculator
document.addEventListener("DOMContentLoaded", function () {
  cart = JSON.parse(localStorage.getItem("glassCart")) || [];
  updateNavCartCount();
  initializeTabs();
  initializeEventListeners();
  initializeShapeModalListeners();
  setupFormStatePersistence();
  // Clear saved form state on every load
  localStorage.removeItem(getFormStateKey());
  restoreFormState();
  calculatePrice();
});

const FORM_STATE_KEY_PREFIX = "glassFormState_";

function getFormStateKey() {
  return FORM_STATE_KEY_PREFIX + currentTab;
}

function setupFormStatePersistence() {
  const fields = document.querySelectorAll("input, select, textarea");
  fields.forEach((field) => {
    if (field.type === "file") return;
    field.addEventListener("input", saveFormState);
    field.addEventListener("change", saveFormState);
  });
  window.addEventListener("beforeunload", saveFormState);
}

function saveFormState() {
  const state = {
    inputs: {},
    checks: {},
    radios: {},
    selects: {},
    textareas: {},
    shape: {
      value: "",
      target: currentTab,
      data: { ...shapeData },
    },
  };

  document.querySelectorAll("input").forEach((input) => {
    if (!input.id && !input.name) return;
    if (input.type === "file") return;
    if (input.type === "radio") {
      if (input.checked && input.name) {
        state.radios[input.name] = input.value;
      }
      return;
    }
    if (input.type === "checkbox") {
      if (input.id) state.checks[input.id] = input.checked;
      return;
    }
    if (input.id) state.inputs[input.id] = input.value;
  });

  document.querySelectorAll("select").forEach((select) => {
    if (select.id) state.selects[select.id] = select.value;
  });

  document.querySelectorAll("textarea").forEach((textarea) => {
    if (textarea.id) state.textareas[textarea.id] = textarea.value;
  });

  const shapeInput = document.getElementById(currentTab + "Shape");
  if (shapeInput) state.shape.value = shapeInput.value || "";

  localStorage.setItem(getFormStateKey(), JSON.stringify(state));
}

function restoreFormState() {
  const raw = localStorage.getItem(getFormStateKey());
  if (!raw) return;
  let state = null;
  try {
    state = JSON.parse(raw);
  } catch (error) {
    return;
  }
  if (!state) return;

  Object.keys(state.inputs || {}).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = state.inputs[id];
  });
  Object.keys(state.selects || {}).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = state.selects[id];
  });
  Object.keys(state.textareas || {}).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.value = state.textareas[id];
  });
  Object.keys(state.checks || {}).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.checked = state.checks[id];
  });
  Object.keys(state.radios || {}).forEach((name) => {
    const el = document.querySelector(
      `input[type="radio"][name="${name}"][value="${state.radios[name]}"]`,
    );
    if (el) el.checked = true;
  });

  if (state.shape && state.shape.data) {
    shapeData = { ...shapeData, ...state.shape.data };
  }

  const shapeValue = state.shape ? state.shape.value : "";
  const target = currentTab;
  if (shapeValue) {
    const shapeInput = document.getElementById(target + "Shape");
    const shapeText = document.getElementById(target + "ShapeText");
    const detailsDiv = document.getElementById(target + "ShapeDetails");
    if (shapeInput) shapeInput.value = shapeValue;
    if (shapeText) {
      const shapeItem = shapes.find((item) => item.value === shapeValue);
      shapeText.textContent = shapeItem ? shapeItem.name : shapeValue;
      shapeText.classList.remove("text-gray-500");
      shapeText.classList.add("text-gray-800");
      selectedShape = shapeItem || null;
    }
    if (detailsDiv) detailsDiv.classList.remove("hidden");

    const rotationInput = document.getElementById("shapeRotation");
    if (rotationInput) rotationInput.value = String(shapeData.rotation || 0);
    updateShapeDetailsDisplay();
  }
}

function initializeShapeModalListeners() {
  // Rotation button listeners
  document.querySelectorAll(".rotation-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      // Clear active state from all rotation buttons
      document.querySelectorAll(".rotation-btn").forEach((b) => {
        b.classList.remove("border-blue-500", "bg-blue-50");
      });
      // Set active state on clicked button
      this.classList.add("border-blue-500", "bg-blue-50");

      // set rotation value in hidden input and shapeData
      const rotation = this.dataset.rotation;
      document.getElementById("shapeRotation").value = rotation;
      shapeData.rotation = parseInt(rotation) || 0;

      // update preview to the corresponding rotation image
      if (selectedShape) {
        const rotKey = "rot" + rotation; // rot0, rot90, rot180, rot270
        const imgUrl = selectedShape.dataset[rotKey];
        if (imgUrl) {
          updateShapePreview(imgUrl, selectedShape.dataset.name);
          // ALSO update the summary image to reflect the rotation
          if (currentShapeTarget) {
            setSummaryShapeImage(
              currentShapeTarget,
              imgUrl,
              selectedShape.dataset.name,
            );
          }
        }
      }

      validateShapeForm();
    });
  });

  // Input field listeners for real-time validation and calculation
  ["shapeWidthA", "shapeHeightA", "shapeLengthC", "customShapeName"].forEach(
    (id) => {
      const element = document.getElementById(id);
      if (element) {
        element.addEventListener("input", function () {
          updateShapeCalculations();
          validateShapeForm();
        });
      }
    },
  );
}

// Tab functionality
function initializeTabs() {
  console.log("Tabs initialized - Page specific mode");
  // Tab switching is now handled by direct links (<a> tags)
  // This function is kept to prevent errors if it's called elsewhere

  // Highlight the current tab based on currentTab variable (redundant if HTML is set correct, but good for safety)
  if (currentTab) {
    const activeBtn = document.getElementById(currentTab + "Tab");
    if (activeBtn) activeBtn.classList.add("tab-active");

    const content = document.getElementById(
      currentTab === "single"
        ? "singleUnit"
        : currentTab === "double"
          ? "doubleGlazed"
          : "tripleGlazed",
    );
    if (content) content.classList.remove("hidden");
  }
}

function switchTab(tabId) {
  // Remove active class from all tabs
  document
    .querySelectorAll(".tab-btn")
    .forEach((btn) => btn.classList.remove("tab-active"));
  document
    .querySelectorAll(".tab-content")
    .forEach((content) => content.classList.add("hidden"));

  // Add active class to selected tab
  document.getElementById(tabId + "Tab").classList.add("tab-active");

  // Show corresponding content
  if (tabId === "single") {
    document.getElementById("singleUnit").classList.remove("hidden");
    currentTab = "single";
  } else if (tabId === "double") {
    document.getElementById("doubleGlazed").classList.remove("hidden");
    currentTab = "double";
  } else if (tabId === "triple") {
    document.getElementById("tripleGlazed").classList.remove("hidden");
    currentTab = "triple";
  }

  // Clear any error messages when switching tabs
  document
    .querySelectorAll(".error-message")
    .forEach((error) => error.classList.add("hidden"));

  calculatePrice();
  saveFormState();
}

// Event listeners
function initializeEventListeners() {
  // Shape selection
  document.querySelectorAll(".shape-option").forEach((option) => {
    option.addEventListener("click", function () {
      const shape = this.dataset.shape;
      const tabType = currentTab;

      // Remove selection from all shapes in current tab
      document.querySelectorAll(".shape-option").forEach((opt) => {
        opt.classList.remove("shape-selected");
      });

      // Add selection to clicked shape
      this.classList.add("shape-selected");

      // Set hidden input value
      document.getElementById(tabType + "Shape").value = shape;

      // Show/hide custom shape input
      const customContainer = document.getElementById(
        tabType + "CustomShapeContainer",
      );
      if (shape === "other") {
        customContainer.classList.remove("hidden");
      } else {
        customContainer.classList.add("hidden");
        document.getElementById(tabType + "CustomShape").value = "";
      }

      calculatePrice();
    });
  });

  // Dimension inputs
  ["single", "double", "triple"].forEach((type) => {
    const widthInput = document.getElementById(type + "Width");
    const heightInput = document.getElementById(type + "Height");

    if (widthInput)
      widthInput.addEventListener("input", () => updateArea(type));
    if (heightInput)
      heightInput.addEventListener("input", () => updateArea(type));
  });

  // Color preview functionality
  const doubleColorSelect = document.getElementById("doubleSpacerColor");
  const tripleColorSelect = document.getElementById("tripleSpacerColor");

  if (doubleColorSelect) {
    doubleColorSelect.addEventListener("change", function () {
      updateColorPreview("doubleColorPreview", this.value);
    });
  }

  if (tripleColorSelect) {
    tripleColorSelect.addEventListener("change", function () {
      updateColorPreview("tripleColorPreview", this.value);
    });
  }

  const doubleExtrasEl = document.getElementById("doubleExtras");
  const doublePetFlapEl = document.getElementById("doublePetFlap");
  if (doubleExtrasEl) {
    doubleExtrasEl.addEventListener("change", updateDoubleExtrasSummary);
  }
  if (doublePetFlapEl) {
    doublePetFlapEl.addEventListener("change", updateDoubleExtrasSummary);
  }

  const tripleExtrasEl = document.getElementById("tripleExtras");
  const triplePetFlapEl = document.getElementById("triplePetFlap");
  if (tripleExtrasEl) {
    tripleExtrasEl.addEventListener("change", updateTripleExtrasSummary);
  }
  if (triplePetFlapEl) {
    triplePetFlapEl.addEventListener("change", updateTripleExtrasSummary);
  }

  // All other inputs
  document.addEventListener("change", calculatePrice);
  document.addEventListener("input", calculatePrice);

  // Add to cart button
  document.getElementById("addToCart").addEventListener("click", addToCart);

  // Double shape change button (redundant to inline handler, but more reliable)
  const doubleShapeChangeBtn = document.getElementById("doubleShapeChangeBtn");
  if (doubleShapeChangeBtn) {
    doubleShapeChangeBtn.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      openShapeModal("double");
    });
  }

  // Single Corners Listener
  document.querySelectorAll('input[name="singleCorners"]').forEach((radio) => {
    radio.addEventListener("change", toggleSingleCornerOptions);
  });

  // Initialize state
  toggleSingleCornerOptions();
  updateDoubleExtrasSummary();
  updateTripleExtrasSummary();
}

// Toggle Single Corner Options
function toggleSingleCornerOptions() {
  const corners = document.querySelector(
    'input[name="singleCorners"]:checked',
  )?.value;
  const container = document.getElementById("singleCornerSizeContainer");
  const radiusDisplay = document.getElementById("singleRadiusSizeDisplay");
  const clippedDisplay = document.getElementById("singleClippedSizeDisplay");
  const radiusSelect = document.getElementById("singleRadiusSize");
  const clippedSelect = document.getElementById("singleClippedSize");

  if (!container) return;

  // Reset display
  container.classList.add("hidden");
  radiusDisplay.classList.add("hidden");
  clippedDisplay.classList.add("hidden");

  if (corners === "radius") {
    container.classList.remove("hidden");
    radiusDisplay.classList.remove("hidden");
  } else if (corners === "clipped") {
    container.classList.remove("hidden");
    clippedDisplay.classList.remove("hidden");
  } else {
    // clear selection when hidden to ensure cleaner data
    if (radiusSelect) radiusSelect.value = "";
    if (clippedSelect) clippedSelect.value = "";
  }
}

// Update area calculation
function updateArea(type) {
  const width = parseFloat(document.getElementById(type + "Width").value) || 0;
  const height =
    parseFloat(document.getElementById(type + "Height").value) || 0;
  const area = (width * height) / 1000000; // Convert mm² to m²

  document.getElementById(type + "Area").textContent = area.toFixed(3) + " m²";
  calculatePrice();
}

// Configuration validation (price calculations removed)
function calculatePrice() {
  // Price calculations removed - configuration validation only
  currentPrice = 0;
}

// Price calculation functions removed - configuration only

// Form validation
/*function validateForm() {
            let isValid = true;
            const shapeDetails = document.getElementById(currentTab + 'ShapeDetails');
            
            // Clear all error messages first
            document.querySelectorAll('.error-message').forEach(error => error.classList.add('hidden'));
            
            if (currentTab === 'single') {
                // Glass type validation
                const glassType = document.getElementById('singleGlassType');
                if (!glassType || !glassType.value) {
                    showError('singleGlassTypeError', 'Please select a glass type');
                    isValid = false;
                }

                // Shape validation
                const shape = document.getElementById('singleShape');
                if (!shape || !shape.value) {
                    showError('singleShapeError', 'Please select a shape');
                    isValid = false;
                }

                // Dimensions validation
                const widthInput = document.getElementById('singleWidth');
                const heightInput = document.getElementById('singleHeight');
                const width = widthInput ? parseFloat(widthInput.value) : 0;
                const height = heightInput ? parseFloat(heightInput.value) : 0;
                
                if (!width || width < 100 || width > 2800) {
                    showError('singleWidthError', 'Width must be between 100-2800mm');
                    isValid = false;
                }
                
                if (!height || height < 100 || height > 2800) {
                    showError('singleHeightError', 'Height must be between 100-2800mm');
                    isValid = false;
                }

                // Custom shape validation
                if (shape && shape.value === 'other') {
                    const customShapeInput = document.getElementById('singleCustomShape');
                    const customShape = customShapeInput ? customShapeInput.value : '';
                    if (!customShape || customShape.trim() === '') {
                        showError('singleCustomShapeError', 'Please describe the custom shape');
                        isValid = false;
                    }
                }
            } else if (currentTab === 'double') {
                // Glass validation
                const outerGlass = document.getElementById('doubleOuterGlass');
                const innerGlass = document.getElementById('doubleInnerGlass');
                const spacerWidth = document.getElementById('doubleSpacerWidth');
                
                if (!outerGlass || !outerGlass.value) {
                    showError('doubleOuterGlassError', 'Please select external glass');
                    isValid = false;
                }
                
                if (!innerGlass || !innerGlass.value) {
                    showError('doubleInnerGlassError', 'Please select internal glass');
                    isValid = false;
                }
                
                if (!spacerWidth || !spacerWidth.value) {
                    showError('doubleSpacerWidthError', 'Please select spacer bar width');
                    isValid = false;
                }

                // Toughened glass validation
                const toughened = document.querySelector('input[name="doubleToughened"]:checked');
                if (!toughened) {
                    showError('doubleToughenedError', 'Please select toughened glass option');
                    isValid = false;
                }

                // Shape validation
                const shape = document.getElementById('doubleShape');
                if (!shape || !shape.value) {
                    showError('doubleShapeError', 'Please select a shape');
                    isValid = false;
                }

                // Dimensions validation
                const widthInput = document.getElementById('doubleWidth');
                const heightInput = document.getElementById('doubleHeight');
                const width = widthInput ? parseFloat(widthInput.value) : 0;
                const height = heightInput ? parseFloat(heightInput.value) : 0;
                
                if (!width || width < 100 || width > 2800) {
                    showError('doubleWidthError', 'Width must be between 100-2800mm');
                    isValid = false;
                }
                
                if (!height || height < 100 || height > 2800) {
                    showError('doubleHeightError', 'Height must be between 100-2800mm');
                    isValid = false;
                }

                // Custom shape validation
                if (shape && shape.value === 'other') {
                    const customShapeInput = document.getElementById('doubleCustomShape');
                    const customShape = customShapeInput ? customShapeInput.value : '';
                    if (!customShape || customShape.trim() === '') {
                        showError('doubleCustomShapeError', 'Please describe the custom shape');
                        isValid = false;
                    }
                }
            } else if (currentTab === 'triple') {
                // Glass validation
                const outerGlass = document.getElementById('tripleOuterGlass');
                const centreGlass = document.getElementById('tripleCentreGlass');
                const innerGlass = document.getElementById('tripleInnerGlass');
                const spacer1Width = document.getElementById('tripleSpacer1Width');
                const spacer2Width = document.getElementById('tripleSpacer2Width');
                
                if (!outerGlass || !outerGlass.value) {
                    showError('tripleOuterGlassError', 'Please select external glass');
                    isValid = false;
                }
                
                if (!centreGlass || !centreGlass.value) {
                    showError('tripleCentreGlassError', 'Please select centre glass');
                    isValid = false;
                }
                
                if (!innerGlass || !innerGlass.value) {
                    showError('tripleInnerGlassError', 'Please select internal glass');
                    isValid = false;
                }
                
                if (!spacer1Width || !spacer1Width.value) {
                    showError('tripleSpacer1WidthError', 'Please select spacer bar 1 width');
                    isValid = false;
                }
                
                if (!spacer2Width || !spacer2Width.value) {
                    showError('tripleSpacer2WidthError', 'Please select spacer bar 2 width');
                    isValid = false;
                }

                // Toughened glass validation
                const toughened = document.querySelector('input[name="tripleToughened"]:checked');
                if (!toughened) {
                    showError('tripleToughenedError', 'Please select toughened glass option');
                    isValid = false;
                }

                // Shape validation
                const shape = document.getElementById('tripleShape');
                if (!shape || !shape.value) {
                    showError('tripleShapeError', 'Please select a shape');
                    isValid = false;
                }

                // Dimensions validation
                const widthInput = document.getElementById('tripleWidth');
                const heightInput = document.getElementById('tripleHeight');
                const width = widthInput ? parseFloat(widthInput.value) : 0;
                const height = heightInput ? parseFloat(heightInput.value) : 0;
                
                if (!width || width < 100 || width > 2800) {
                    showError('tripleWidthError', 'Width must be between 100-2800mm');
                    isValid = false;
                }
                
                if (!height || height < 100 || height > 2800) {
                    showError('tripleHeightError', 'Height must be between 100-2800mm');
                    isValid = false;
                }

                // Custom shape validation
                if (shape && shape.value === 'other') {
                    const customShapeInput = document.getElementById('tripleCustomShape');
                    const customShape = customShapeInput ? customShapeInput.value : '';
                    if (!customShape || customShape.trim() === '') {
                        showError('tripleCustomShapeError', 'Please describe the custom shape');
                        isValid = false;
                    }
                }
            }

            return isValid;
        }*/
function validateForm() {
  let isValid = true;
  const shapeDetails = document.getElementById(currentTab + "ShapeDetails");
  if (currentTab === "single") {
    // Glass thickness validation
    const glassThickness = document.getElementById("singleGlassThickness");
    if (!glassThickness || !glassThickness.value) {
      showError("singleGlassThicknessError", "Please select glass thickness");
      isValid = false;
    }

    // Glass type validation
    const glassType = document.getElementById("singleGlassType");
    if (!glassType || !glassType.value) {
      showError("singleGlassTypeError", "Please select a glass type");
      isValid = false;
    }
    if (!glassType) {
      showError("singleGlassTypeError", "Please select a glass type");
      isValid = false;
    }
    // Shape validation
    if (!shapeDetails || shapeDetails.classList.contains("hidden")) {
      showError("singleShapeError", "Please select and configure a shape");
      isValid = false;
    }

    // Corner validation
    const corners = document.querySelector(
      'input[name="singleCorners"]:checked',
    );
    if (corners) {
      if (
        corners.value === "radius" &&
        !document.getElementById("singleRadiusSize").value
      ) {
        showError("singleCornerSizeError", "Please select radius size");
        isValid = false;
      } else if (
        corners.value === "clipped" &&
        !document.getElementById("singleClippedSize").value
      ) {
        showError("singleCornerSizeError", "Please select clipped size");
        isValid = false;
      }
    }
  } else if (currentTab === "double") {
    // Glass validation
    const outerGlass = document.getElementById("doubleOuterGlass");
    const innerGlass = document.getElementById("doubleInnerGlass");
    const spacerWidth = document.getElementById("doubleSpacerWidth");
    const spacerColor = document.getElementById("doubleSpacerColor");

    if (!outerGlass || !outerGlass.value) {
      showError("doubleOuterGlassError", "Please select external glass");
      isValid = false;
    }

    if (!innerGlass || !innerGlass.value) {
      showError("doubleInnerGlassError", "Please select internal glass");
      isValid = false;
    }
    if (!spacerWidth || !spacerWidth.value) {
      showError("doubleSpacerWidthError", "Please select spacer width");
      isValid = false;
    }

    if (!spacerColor || !spacerColor.value) {
      showError("doubleSpacerColorError", "Please select spacer color");
      isValid = false;
    }

    // Shape validation
    if (!shapeDetails || shapeDetails.classList.contains("hidden")) {
      showError("doubleShapeError", "Please select and configure a shape");
      isValid = false;
    }
  } else if (currentTab === "triple") {
    // Glass validation
    const outerGlass = document.getElementById("tripleOuterGlass");
    const centreGlass = document.getElementById("tripleCentreGlass");
    const innerGlass = document.getElementById("tripleInnerGlass");
    const spacerWidth = document.getElementById("tripleSpacerWidth");
    const spacerColor = document.getElementById("tripleSpacerColor");

    if (!outerGlass || !outerGlass.value) {
      showError("tripleOuterGlassError", "Please select external glass");
      isValid = false;
    }

    if (!centreGlass || !centreGlass.value) {
      showError("tripleCentreGlassError", "Please select centre glass");
      isValid = false;
    }

    if (!innerGlass || !innerGlass.value) {
      showError("tripleInnerGlassError", "Please select internal glass");
      isValid = false;
    }
    if (!spacerWidth || !spacerWidth.value) {
      showError("tripleSpacerWidthError", "Please select spacer width");
      isValid = false;
    }

    if (!spacerColor || !spacerColor.value) {
      showError("tripleSpacerColorError", "Please select spacer color");
      isValid = false;
    }

    // Shape validation
    if (!shapeDetails || shapeDetails.classList.contains("hidden")) {
      showError("tripleShapeError", "Please select and configure a shape");
      isValid = false;
    }
  }

  return isValid;
}
function showError(elementId, message) {
  const errorElement = document.getElementById(elementId);
  if (errorElement) {
    errorElement.textContent = message;
    errorElement.classList.remove("hidden");
  }
}

// Add to cart functionality
function addToCart() {
  if (!validateForm()) {
    alert("Please complete all required fields before adding to cart.");
    return;
  }

  const item = collectFormData();
  if (!item) return;

  cart.push(item);
  localStorage.setItem("glassCart", JSON.stringify(cart));

  updateNavCartCount();
  showSuccessPopup();

  // Reset form after successful add
  //resetCurrentForm();
}
function collectFormData() {
  const getTextById = (id, fallback = "-") => {
    const el = document.getElementById(id);
    if (!el || !el.textContent) return fallback;
    return el.textContent.trim() || fallback;
  };

  const getSelectText = (id, fallback = "-") => {
    const select = document.getElementById(id);
    if (!select) return fallback;
    const option = select.options[select.selectedIndex];
    if (!option || !option.value) return fallback;
    return option.textContent.trim();
  };

  const getPatternName = (value) => {
    if (!value) return "-";
    const match = patternGlassOptions.find((pattern) => pattern.value === value);
    return match ? match.name : value;
  };

  const item = {
    id: Date.now(),
    type: currentTab,
    quantity: 1,
    details: [],
    price: 0,
    image: "",
  };

  const shapeName = getTextById(currentTab + "ConfigShapeSummary", "Shape");
  const width = getTextById(currentTab + "SelectedWidth");
  const height = getTextById(currentTab + "SelectedHeight");
  item.description = `${shapeName} (${width} x ${height})`;

  // Add the unit type to the details
  let unitTypeDescription = "";
  if (item.type === "single") {
    unitTypeDescription = "Single Unit";
  } else if (item.type === "double") {
    unitTypeDescription = "Double Glazed Unit";
  } else if (item.type === "triple") {
    unitTypeDescription = "Triple Glazed Unit";
  }
  if (unitTypeDescription) {
    item.details.push(`Unit Type: ${unitTypeDescription}`);
  }

  // Set image based on tab
  if (currentTab === "single") {
    item.image = "/views/single unit.jpeg";
  } else if (currentTab === "double") {
    item.image = "/views/double.jpeg";
  } else if (currentTab === "triple") {
    item.image = "/views/triple.jpeg";
  }

  // --- Common Shape Details (from shapeData object) ---
  item.details.push(`Rotation: ${shapeData.rotation}°`);
  if (shapeData.lengthC > 0) {
    item.details.push(`Length C: ${shapeData.lengthC}mm`);
  }
  if (shapeData.customName) {
    item.details.push(`Custom Name: ${shapeData.customName}`);
  }
  if (shapeData.reference) {
    item.details.push(`Reference: ${shapeData.reference}`);
  }
  if (shapeData.templateFile) {
    item.details.push(`Template File: ${shapeData.templateFile.name}`);
  }
  // --- Add calculated metrics ---
  const area = getTextById(currentTab + "ShapeArea");
  const linear = getTextById(currentTab + "ShapeLinear");
  const weight = getTextById(currentTab + "ShapeWeight");

  item.details.push(`Area: ${area}`);
  item.details.push(`Linear Metre: ${linear}`);
  item.details.push(`Weight: ${weight}`);
  // --- Tab-Specific Details ---
  let itemPrice = parseFloat(
    getTextById(currentTab + "ShapeCost", "0").replace("£", ""),
  );

  if (currentTab === "single") {
    // Step 1: Glass Configuration
    const thickness = document.getElementById("singleGlassThickness").value;
    const glassType = document.getElementById("singleGlassType").value;
    item.details.push(`Glass: ${thickness} ${glassType}`);

    if (glassType === "tinted") {
      const tint = document.querySelector(
        'input[name="singleTintColor"]:checked',
      )?.value;
      if (tint)
        item.details.push(
          `Tint: ${tint.charAt(0).toUpperCase() + tint.slice(1)}`,
        );
    }
    if (glassType === "painted") {
      const colorType = document.querySelector(
        'input[name="singleColorType"]:checked',
      )?.value;
      if (colorType === "ral") {
        const ralColor = document.getElementById("singleRALColor").value;
        if (ralColor) item.details.push(`Color: ${ralColor}`);
      } else if (colorType === "custom") {
        const customColor = document.getElementById("singleCustomColor").value;
        if (customColor) item.details.push(`Custom Color: ${customColor}`);
      }
    }
    // Add Polished and Toughened details for Single Unit
    item.details.push("Polished Glass (P.A.R)");
    item.details.push("Toughened Glass");
    // Step 3: Optional Extras
    const cornersEl = document.querySelector(
      'input[name="singleCorners"]:checked',
    );
    if (cornersEl && cornersEl.value) {
      item.details.push(
        `Corners: ${cornersEl.value.charAt(0).toUpperCase() + cornersEl.value.slice(1)}`,
      );
    }

    const holes = document.getElementById("singleHoles").value;
    if (holes) {
      item.details.push(`Holes: ${holes}`);
      if (holes === "custom") {
        const holeSize = document.getElementById("singleCustomHoleSize").value;
        if (holeSize) item.details.push(`- Hole Size: ${holeSize}`);
      }
    }
    /*
    if (document.getElementById("singlePetFlap").checked) {
      const petFlapPrice = parseFloat(
        document.getElementById("singlePetFlap").dataset.price
      );
      item.details.push("Pet Flap/Vent Hole");
      itemPrice += petFlapPrice;
    }*/
  } else if (currentTab === "double" || currentTab === "triple") {
    // Step 1: Glass Configuration
    const outerText = getSelectText(currentTab + "OuterGlass");
    item.details.push(`Outer: ${outerText}`);
    if (document.getElementById(currentTab + "OuterGlass")?.value === "4mm-pattern") {
      const patternValue = document.getElementById(currentTab + "OuterPattern")?.value;
      const patternName = getPatternName(patternValue);
      if (patternValue) item.details.push(`- Pattern: ${patternName}`);
    }
    item.details.push("Toughened Glass");
    if (currentTab === "triple") {
      item.details.push(`Centre: ${getSelectText("tripleCentreGlass")}`);
    }
    item.details.push(`Inner: ${getSelectText(currentTab + "InnerGlass")}`);
    // Add Spacer details from dropdowns
    const spacerWidth = document.getElementById(
      currentTab + "SpacerWidth",
    ).value;
    const spacerColor = document.getElementById(
      currentTab + "SpacerColor",
    ).value;
    if (spacerWidth && spacerColor) {
      item.details.push(
        `Spacer: ${spacerWidth}mm, ${spacerColor.charAt(0).toUpperCase() + spacerColor.slice(1)}`,
      );
    }

    // Step 3: Optional Extras
    const extrasSelect = document.getElementById(currentTab + "Extras");
    const selectedExtra = extrasSelect.options[extrasSelect.selectedIndex];
    const extraPrice = parseFloat(selectedExtra.dataset.price);

    if (extraPrice > 0) {
      item.details.push(`Feature: ${selectedExtra.textContent}`);
      itemPrice += extraPrice;
    }

    if (document.getElementById(currentTab + "PetFlap").checked) {
      const petFlapPrice = parseFloat(
        document.getElementById(currentTab + "PetFlap").dataset.price,
      );
      item.details.push("Pet Flap/Vent Hole");
      itemPrice += petFlapPrice;
    }
  }

  item.price = itemPrice;
  return item;
}

/*function collectFormData() {
  const item = {
    id: Date.now(),
    type: currentTab,
    quantity: 1,
    details: [],
    price: 0,
    image: "",
  };
  const shapeName = document.getElementById(
    currentTab + "SelectedShape"
  ).textContent;
  const width = document.getElementById(
    currentTab + "SelectedWidth"
  ).textContent;
  const height = document.getElementById(
    currentTab + "SelectedHeight"
  ).textContent;
  item.description = `${shapeName} (${width} x ${height})`;

  // Set image based on tab
  if (currentTab === "single") {
    item.image = "/views/single unit.jpeg";
  } else if (currentTab === "double") {
    item.image = "/views/double.jpeg";
  } else if (currentTab === "triple") {
    item.image = "/views/triple.jpeg";
  }

  // Common Shape Details
  item.details.push(
    `Rotation: ${
      document.getElementById(currentTab + "SelectedRotation").textContent
    }`
  );
  if (shapeData.reference)
    item.details.push(`Reference: ${shapeData.reference}`);
  if (shapeData.templateFile)
    item.details.push(`Template: ${shapeData.templateFile.name}`);

  let itemPrice = parseFloat(
    document
      .getElementById(currentTab + "ShapeCost")
      .textContent.replace("£", "")
  );
  if (currentTab === "single") {
    const thickness = document.getElementById("singleGlassThickness").value;
    const glassType = document.querySelector(
      'input[name="singleGlassType"]:checked'
    ).value;
    item.details.push(`Glass: ${thickness} ${glassType}`);

    // Tuckbox Extras
    document.querySelectorAll('input[name="singleTuckboxExtras"]:checked').forEach(checkbox => {
      item.details.push(`Extra: ${checkbox.value}`);
    });

    if (glassType === "tinted") {
      const tint = document.querySelector(
        'input[name="singleTintColor"]:checked'
      ).value;
      item.details.push(
        `Tint: ${tint.charAt(0).toUpperCase() + tint.slice(1)}`
      );
    }
    if (glassType === "painted") {
      const colorType = document.querySelector(
        'input[name="singleColorType"]:checked'
      ).value;
      if (colorType === "ral") {
        item.details.push(
          `Color: ${document.getElementById("singleRALColor").value}`
        );
      } else {
        item.details.push(
          `Color: ${document.getElementById("singleCustomColor").value}`
        );
      }
    }
    const corners = document.querySelector(
      'input[name="singleCorners"]:checked'
    ).value;
    item.details.push(
      `Corners: ${corners.charAt(0).toUpperCase() + corners.slice(1)}`
    );

    if (corners === "radius") {
      const rSize = document.getElementById("singleRadiusSize").value;
      if (rSize) item.details.push(`Radius Size: ${rSize}`);
    } else if (corners === "clipped") {
      const cSize = document.getElementById("singleClippedSize").value;
      if (cSize) item.details.push(`Clipped Size: ${cSize}`);
    }

    const holes = document.querySelector('input[name="singleHoles"]:checked');
    if (holes) {
      item.details.push(`Holes: ${holes.value}`);
    }

    if (document.getElementById("singlePetFlap").checked) {
      const petFlapPrice = parseFloat(
        document.getElementById("singlePetFlap").dataset.price
      );
      item.details.push("Pet Flap/Vent Hole");
      itemPrice += petFlapPrice;
    }
  } else if (currentTab === "double" || currentTab === "triple") {
    const extrasSelect = document.getElementById(currentTab + "Extras");
    const selectedExtra = extrasSelect.options[extrasSelect.selectedIndex];
    const extraPrice = parseFloat(selectedExtra.dataset.price);

    if (extraPrice > 0) {
      item.details.push(`Feature: ${selectedExtra.textContent}`);
      itemPrice += extraPrice;
    }

    if (document.getElementById(currentTab + "PetFlap").checked) {
      const petFlapPrice = parseFloat(
        document.getElementById(currentTab + "PetFlap").dataset.price
      );
      item.details.push("Pet Flap/Vent Hole");
      itemPrice += petFlapPrice;
    }

    item.details.push(
      `Outer: ${
        document.getElementById(currentTab + "OuterGlassText").textContent
      }`
    );
    if (currentTab === "triple") {
      item.details.push(
        `Centre: ${
          document.getElementById(currentTab + "CentreGlassText").textContent
        }`
      );
    }
    item.details.push(
      `Inner: ${
        document.getElementById(currentTab + "InnerGlassText").textContent
      }`
    );
    item.details.push(
      `Spacer: ${
        document.getElementById(currentTab + "SpacerWidthText").textContent
      }, ${document.getElementById(currentTab + "SpacerColorText").textContent}`
    );
  }

  item.price = itemPrice;
  return item;
}*/

/*            if (currentTab === 'single') {
                const glassTypeEl = document.getElementById('singleGlassType');
                const shapeEl = document.getElementById('singleShape');
                const widthEl = document.getElementById('singleWidth');
                const heightEl = document.getElementById('singleHeight');
                const customShapeEl = document.getElementById('singleCustomShape');
                const referenceEl = document.getElementById('singleReference');
                const petFlapEl = document.getElementById('singlePetFlap');
                
                item.glassType = glassTypeEl ? glassTypeEl.value : '';
                item.shape = shapeEl ? shapeEl.value : '';
                item.width = widthEl ? widthEl.value : '';
                item.height = heightEl ? heightEl.value : '';
                item.customShape = customShapeEl ? customShapeEl.value : '';
                item.reference = referenceEl ? referenceEl.value : '';
                item.petFlap = petFlapEl ? petFlapEl.checked : false;
            } else if (currentTab === 'double') {
                const outerGlassEl = document.getElementById('doubleOuterGlass');
                const innerGlassEl = document.getElementById('doubleInnerGlass');
                const spacerWidthEl = document.getElementById('doubleSpacerWidth');
                const spacerTypeEl = document.getElementById('doubleSpacerType');
                const toughenedEl = document.querySelector('input[name="doubleToughened"]:checked');
                const shapeEl = document.getElementById('doubleShape');
                const widthEl = document.getElementById('doubleWidth');
                const heightEl = document.getElementById('doubleHeight');
                const customShapeEl = document.getElementById('doubleCustomShape');
                const referenceEl = document.getElementById('doubleReference');
                const extrasEl = document.getElementById('doubleExtras');
                const petFlapEl = document.getElementById('doublePetFlap');
                
                item.outerGlass = outerGlassEl ? outerGlassEl.value : '';
                item.innerGlass = innerGlassEl ? innerGlassEl.value : '';
                item.spacerWidth = spacerWidthEl ? spacerWidthEl.value : '';
                item.spacerType = spacerTypeEl ? spacerTypeEl.value : '';
                item.toughened = toughenedEl ? toughenedEl.value : '';
                item.shape = shapeEl ? shapeEl.value : '';
                item.width = widthEl ? widthEl.value : '';
                item.height = heightEl ? heightEl.value : '';
                item.customShape = customShapeEl ? customShapeEl.value : '';
                item.reference = referenceEl ? referenceEl.value : '';
                item.extras = extrasEl ? extrasEl.value : '';
                item.petFlap = petFlapEl ? petFlapEl.checked : false;
            } else if (currentTab === 'triple') {
                const outerGlassEl = document.getElementById('tripleOuterGlass');
                const centreGlassEl = document.getElementById('tripleCentreGlass');
                const innerGlassEl = document.getElementById('tripleInnerGlass');
                const spacer1WidthEl = document.getElementById('tripleSpacer1Width');
                const spacer2WidthEl = document.getElementById('tripleSpacer2Width');
                const spacerTypeEl = document.getElementById('tripleSpacerType');
                const toughenedEl = document.querySelector('input[name="tripleToughened"]:checked');
                const shapeEl = document.getElementById('tripleShape');
                const widthEl = document.getElementById('tripleWidth');
                const heightEl = document.getElementById('tripleHeight');
                const customShapeEl = document.getElementById('tripleCustomShape');
                const referenceEl = document.getElementById('tripleReference');
                const extrasEl = document.getElementById('tripleExtras');
                const petFlapEl = document.getElementById('triplePetFlap');
                
                item.outerGlass = outerGlassEl ? outerGlassEl.value : '';
                item.centreGlass = centreGlassEl ? centreGlassEl.value : '';
                item.innerGlass = innerGlassEl ? innerGlassEl.value : '';
                item.spacer1Width = spacer1WidthEl ? spacer1WidthEl.value : '';
                item.spacer2Width = spacer2WidthEl ? spacer2WidthEl.value : '';
                item.spacerType = spacerTypeEl ? spacerTypeEl.value : '';
                item.toughened = toughenedEl ? toughenedEl.value : '';
                item.shape = shapeEl ? shapeEl.value : '';
                item.width = widthEl ? widthEl.value : '';
                item.height = heightEl ? heightEl.value : '';
                item.customShape = customShapeEl ? customShapeEl.value : '';
                item.reference = referenceEl ? referenceEl.value : '';
                item.extras = extrasEl ? extrasEl.value : '';
                item.petFlap = petFlapEl ? petFlapEl.checked : false;
            }

            return item;
        }*/
function resetCurrentForm() {
  if (currentTab === "single") {
    const elements = {
      singleGlassType: "",
      singleShape: "",
      singleWidth: "",
      singleHeight: "",
      singleCustomShape: "",
      singleReference: "",
      singleExtras: "none",
    };

    Object.keys(elements).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = elements[id];
    });

    const petFlap = document.getElementById("singlePetFlap");
    if (petFlap) petFlap.checked = false;

    const customContainer = document.getElementById(
      "singleCustomShapeContainer",
    );
    if (customContainer) customContainer.classList.add("hidden");
  } else if (currentTab === "double") {
    const elements = {
      doubleOuterGlass: "",
      doubleInnerGlass: "",
      doubleSpacerWidth: "",
      doubleSpacerColor: "",
      doubleShape: "",
      doubleWidth: "",
      doubleHeight: "",
      doubleCustomShape: "",
      doubleReference: "",
      doubleExtras: "none",
    };

    Object.keys(elements).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = elements[id];
    });

    document
      .querySelectorAll('input[name="doubleToughened"]')
      .forEach((radio) => (radio.checked = false));

    const petFlap = document.getElementById("doublePetFlap");
    if (petFlap) petFlap.checked = false;

    const customContainer = document.getElementById(
      "doubleCustomShapeContainer",
    );
    if (customContainer) customContainer.classList.add("hidden");
  } else if (currentTab === "triple") {
    const elements = {
      tripleOuterGlass: "",
      tripleCentreGlass: "",
      tripleInnerGlass: "",
      tripleSpacerWidth: "",
      tripleSpacerColor: "",
      tripleShape: "",
      tripleWidth: "",
      tripleHeight: "",
      tripleCustomShape: "",
      tripleReference: "",
      tripleExtras: "none",
    };

    Object.keys(elements).forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = elements[id];
    });

    document
      .querySelectorAll('input[name="tripleToughened"]')
      .forEach((radio) => (radio.checked = false));

    const petFlap = document.getElementById("triplePetFlap");
    if (petFlap) petFlap.checked = false;

    const customContainer = document.getElementById(
      "tripleCustomShapeContainer",
    );
    if (customContainer) customContainer.classList.add("hidden");
  }

  // Clear shape selections
  document.querySelectorAll(".shape-option").forEach((opt) => {
    opt.classList.remove("shape-selected");
  });

  // Update area display
  updateArea(currentTab);
  window.location.reload();
}
function updateNavCartCount() {
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);
  document.getElementById("navCartCount").textContent = count;
}

function updateCartDisplay() {
  const cartItemsContainer = document.getElementById("cartItems");
  const cartSummary = document.getElementById("cartSummary");
  const cartItemCountEl = document.getElementById("cartItemCount");
  const cartTotalEl = document.getElementById("cartTotal"); // New element for total price

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
    cartSummary.classList.add("hidden");
    return;
  }

  let html = "";
  let totalItems = 0;
  let totalPrice = 0;
  cart.forEach((item, index) => {
    const itemTotal = item.price * item.quantity;
    totalItems += item.quantity;
    totalPrice += itemTotal;
    html += `
                    <div class="cart-item">
                        <div class="flex justify-between items-start mb-3">
                            <div class="flex-1">
                                <h4 class="font-semibold text-gray-800">${
                                  item.description
                                }</h4>
                                <ul class="text-xs text-gray-600 list-disc list-inside mt-1">
                                    ${item.details
                                      .map((detail) => `<li>${detail}</li>`)
                                      .join("")}
                                </ul>
                            </div>
                            <button onclick="removeFromCart(${index})" class="text-red-500 hover:text-red-700 ml-4 flex-shrink-0">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path>
                                </svg>
                            </button>
                        </div>
                        <div class="flex justify-between items-center mt-4">
                            <div class="quantity-controls">
                                <button class="quantity-btn" onclick="updateQuantity(${index}, -1)" ${
                                  item.quantity <= 1 ? "disabled" : ""
                                }>-</button>
                                <span class="quantity-display">${
                                  item.quantity
                                }</span>
                                <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                            </div>
                            <div class="text-right">
                                <p class="text-lg font-bold text-blue-600">£${itemTotal.toFixed(
                                  2,
                                )}</p>
                                <p class="text-xs text-gray-500">£${item.price.toFixed(
                                  2,
                                )} each</p>
                            </div>
                        </div>
                    </div>
                `;
  });

  cartItemsContainer.innerHTML = html;

  // Update cart summary
  cartItemCountEl.textContent = totalItems;
  if (cartTotalEl) {
    cartTotalEl.textContent = `£${totalPrice.toFixed(2)}`;
  }

  cartSummary.classList.remove("hidden");
}

function removeFromCart(index) {
  cart.splice(index, 1);
  updateCartDisplay();
}

function updateQuantity(index, change) {
  cart[index].quantity += change;
  if (cart[index].quantity < 1) {
    cart[index].quantity = 1;
  }
  updateCartDisplay();
}

function showSuccessPopup() {
  const popup = document.getElementById("successPopup");
  popup.classList.add("show");

  setTimeout(() => {
    popup.classList.remove("show");
  }, 1000);
}

// When glass thickness is selected, open the glass type modal
const singleGlassThicknessEl = document.getElementById("singleGlassThickness");
if (singleGlassThicknessEl) {
  singleGlassThicknessEl.addEventListener("change", function () {
    if (this.value) {
      openGlassTypeModal(this.value);
    }
  });
}

// Glass type modal logic
function openGlassTypeModal(thickness) {
  // Populate glass type options based on thickness if needed
  // Show modal
  document.getElementById("glassTypeModal").classList.remove("hidden");
  // Populate options...
}

function closeGlassTypeModal() {
  document.getElementById("glassTypeModal").classList.add("hidden");
}

function selectGlassTypeOption() {
  // Get selected glass type and sub-option
  const selectedType = document.querySelector(
    'input[name="modalGlassType"]:checked',
  );
  if (!selectedType) return;

  let glassTypeValue = selectedType.value;

  // Handle sub-options for painted/tinted
  if (glassTypeValue === "tinted") {
    const tint = document.querySelector('input[name="modalTintColor"]:checked');
    if (tint) glassTypeValue += "-" + tint.value;
  }
  if (glassTypeValue === "painted") {
    const colorType = document.querySelector(
      'input[name="modalPaintedType"]:checked',
    );
    if (colorType && colorType.value === "ral") {
      const ralColor = document.getElementById("modalRALColor").value;
      glassTypeValue += "-" + ralColor.replace(/\s+/g, "-").toLowerCase();
    } else if (colorType && colorType.value === "custom") {
      const customColor = document.getElementById("modalCustomColor").value;
      glassTypeValue +=
        "-custom-" + customColor.replace(/\s+/g, "-").toLowerCase();
    }
  }

  // Update hidden input in main form
  document.getElementById("singleGlassType").value = glassTypeValue;

  // Optionally update a summary display if you have one

  closeGlassTypeModal();
}

function handleGlassTypeSelection(type) {
  const subOptions = document.getElementById("glassTypeSubOptions");
  if (type === "painted") {
    subOptions.innerHTML = `
      <div class="mb-2">
        <label class="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="radio" name="modalPaintedType" value="ral" checked>
          <span>RAL/BS Color:</span>
          <select id="modalRALColor" class="input-field ml-2">
            <option value="">Select RAL/BS Color</option>
                                        <option value="ral-9010">RAL 9010 - Pure White</option>
                                        <option value="ral-9016">RAL 9016 - Traffic White</option>
                                        <option value="ral-7016">RAL 7016 - Anthracite Grey</option>
                                        <option value="ral-6005">RAL 6005 - Moss Green</option>
                                        <option value="ral-3020">RAL 3020 - Traffic Red</option>
                                        <option value="bs-18b25">BS 18B25 - Dark Blue</option>
          </select>
        </label>
        <label class="flex items-center gap-2 mb-2 cursor-pointer">
          <input type="radio" name="modalPaintedType" value="custom">
          <span>Custom Color:</span>
          <input type="text" id="modalCustomColor" class="input-field ml-2" placeholder="Enter custom color">
        </label>
      </div>
    `;
    subOptions.classList.remove("hidden");
  } else if (type === "tinted") {
    subOptions.innerHTML = `
      <div class="flex gap-4">
        <label class="glass-type-option flex flex-col items-center cursor-pointer border-2 border-gray-200 rounded-lg p-2 hover:border-blue-400 transition-all">
          <input type="radio" name="modalTintColor" value="grey" class="sr-only">
          <img src="/views/tint-grey.jpg" alt="Grey" class="h-12 w-24 object-contain mb-2" onerror="this.style.display='none'">
          <span class="text-sm font-medium">Grey</span>
        </label>
        <label class="glass-type-option flex flex-col items-center cursor-pointer border-2 border-gray-200 rounded-lg p-2 hover:border-blue-400 transition-all">
          <input type="radio" name="modalTintColor" value="bronze" class="sr-only">
          <img src="/views/tint-bronze.jpg" alt="Bronze" class="h-12 w-24 object-contain mb-2" onerror="this.style.display='none'">
          <span class="text-sm font-medium">Bronze</span>
        </label>
      </div>
    `;
    subOptions.classList.remove("hidden");

    // Add selection highlight for image radio buttons
    subOptions
      .querySelectorAll('input[name="modalTintColor"]')
      .forEach((radio) => {
        radio.addEventListener("change", function () {
          subOptions.querySelectorAll(".glass-type-option").forEach((opt) => {
            opt.classList.remove("border-blue-500", "bg-blue-50");
          });
          this.closest(".glass-type-option").classList.add(
            "border-blue-500",
            "bg-blue-50",
          );
        });
      });
  } else {
    subOptions.classList.add("hidden");
    subOptions.innerHTML = "";
  }
}

function openGlassTypeModal(thickness) {
  document.getElementById("glassTypeModal").classList.remove("hidden");

  // Example images for each glass type (replace with your own)
  const glassTypes = [
    {
      value: "clear",
      label: "Clear",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "low-iron",
      label: "Low Iron",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "satin",
      label: "Satin",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "tinted",
      label: "Tinted",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "black",
      label: "Black",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "painted",
      label: "Painted",
      img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
  ];

  const container = document.getElementById("glassTypeOptionsContainer");
  container.innerHTML = ""; // Clear previous options

  glassTypes.forEach((type) => {
    const option = document.createElement("label");
    option.className =
      "glass-type-option flex flex-col items-center cursor-pointer border-2 border-gray-200 rounded-lg p-2 mb-2 hover:border-blue-400 transition-all";
    option.innerHTML = `
      <input type="radio" name="modalGlassType" value="${type.value}" class="sr-only">
      <img src="${type.img}" alt="${type.label}" class="h-16 w-16 object-contain mb-2" onerror="this.style.display='none'">
      <span class="text-sm font-medium">${type.label}</span>
    `;
    option.querySelector("input").addEventListener("change", function () {
      handleGlassTypeSelection(type.value);
      document.getElementById("selectGlassTypeBtn").disabled = false;

      // Highlight selected
      document.querySelectorAll(".glass-type-option").forEach((opt) => {
        opt.classList.remove("border-blue-500", "bg-blue-50");
      });
      option.classList.add("border-blue-500", "bg-blue-50");
    });
    container.appendChild(option);
  });

  // Reset sub-options
  document.getElementById("glassTypeSubOptions").classList.add("hidden");
  document.getElementById("glassTypeSubOptions").innerHTML = "";
  document.getElementById("selectGlassTypeBtn").disabled = true;
}

// Pattern glass data
const patternGlassOptions = [
  {
    value: "pattern1",
    name: "Autumn Leaves",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Elegant leaf pattern",
  },
  {
    value: "pattern2",
    name: "Cathedral",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Classic cathedral style",
  },
  {
    value: "pattern3",
    name: "Contora",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Modern contora pattern",
  },
  {
    value: "pattern4",
    name: "Cotswold",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Rural cotswold design",
  },
  {
    value: "pattern5",
    name: "Everglade",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Nature-inspired everglade",
  },
  {
    value: "pattern6",
    name: "Florielle",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Floral florielle pattern",
  },
  {
    value: "pattern7",
    name: "Mayflower",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Delicate mayflower style",
  },
  {
    value: "pattern8",
    name: "Minster",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Traditional minster design",
  },
  {
    value: "pattern9",
    name: "Oak",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Natural oak pattern",
  },
  {
    value: "pattern10",
    name: "Pelerine",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Soft pelerine texture",
  },
  {
    value: "pattern11",
    name: "Reeded",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Linear reeded style",
  },
  {
    value: "pattern12",
    name: "Sycamore",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Sycamore leaf pattern",
  },
  {
    value: "pattern13",
    name: "Taffeta",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Smooth taffeta finish",
  },
  {
    value: "pattern14",
    name: "Warwick",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Classic warwick design",
  },
  {
    value: "pattern15",
    name: "Arctic",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Frosted arctic style",
  },
  {
    value: "pattern16",
    name: "Chantilly",
    img: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    desc: "Elegant chantilly lace",
  },
];

let currentPatternTarget = null;
let selectedPatternValue = null;

// Handle Double Outer Glass change
function handleDoubleOuterGlassChange() {
  const glassSelect = document.getElementById("doubleOuterGlass");
  const patternDisplay = document.getElementById("doubleOuterPatternDisplay");

  if (glassSelect.value === "4mm-pattern") {
    patternDisplay.classList.remove("hidden");
    // Auto-open the pattern modal for convenience
    openPatternModal("doubleOuter");
  } else {
    patternDisplay.classList.add("hidden");
    // Clear pattern selection
    document.getElementById("doubleOuterPattern").value = "";
    document.getElementById("doubleOuterPatternName").textContent =
      "No pattern selected";
    document.getElementById("doubleOuterPatternDesc").textContent = "";
    document.getElementById("doubleOuterPatternImg").classList.add("hidden");
  }
}

// Handle Triple Outer Glass change
function handleTripleOuterGlassChange() {
  const glassSelect = document.getElementById("tripleOuterGlass");
  const patternDisplay = document.getElementById("tripleOuterPatternDisplay");

  if (glassSelect.value === "4mm-pattern") {
    patternDisplay.classList.remove("hidden");
    // Auto-open the pattern modal for convenience
    openPatternModal("tripleOuter");
  } else {
    patternDisplay.classList.add("hidden");
    // Clear pattern selection
    document.getElementById("tripleOuterPattern").value = "";
    document.getElementById("tripleOuterPatternName").textContent =
      "No pattern selected";
    document.getElementById("tripleOuterPatternDesc").textContent = "";
    document.getElementById("tripleOuterPatternImg").classList.add("hidden");
  }
}

// Open Pattern Modal
function openPatternModal(target) {
  currentPatternTarget = target;
  selectedPatternValue = null;

  const modal = document.getElementById("patternModal");
  const container = document.getElementById("patternOptionsContainer");
  const selectBtn = document.getElementById("selectPatternBtn");

  // Reset button state
  selectBtn.disabled = true;

  // Populate pattern options
  container.innerHTML = "";
  patternGlassOptions.forEach((pattern) => {
    const option = document.createElement("div");
    option.className =
      "pattern-option cursor-pointer border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-400 transition-all";
    option.dataset.value = pattern.value;
    option.innerHTML = `
      <div class="w-16 h-16 bg-gray-100 rounded mx-auto mb-2 flex items-center justify-center overflow-hidden">
        <img src="${pattern.img}" alt="${pattern.name}" class="w-full h-full object-cover" onerror="this.style.display='none'">
      </div>
      <p class="text-sm font-medium text-gray-800">${pattern.name}</p>
      <p class="text-xs text-gray-500">${pattern.desc}</p>
    `;

    option.addEventListener("click", function () {
      // Remove selection from all
      container.querySelectorAll(".pattern-option").forEach((opt) => {
        opt.classList.remove("border-blue-500", "bg-blue-50");
      });
      // Add selection to clicked
      this.classList.add("border-blue-500", "bg-blue-50");
      selectedPatternValue = pattern.value;
      selectBtn.disabled = false;
    });

    container.appendChild(option);
  });

  modal.classList.remove("hidden");
}

// Close Pattern Modal
function closePatternModal() {
  document.getElementById("patternModal").classList.add("hidden");
  currentPatternTarget = null;
  selectedPatternValue = null;
}

// Select Pattern Option
function selectPatternOption() {
  if (!selectedPatternValue || !currentPatternTarget) return;

  const selectedPattern = patternGlassOptions.find(
    (p) => p.value === selectedPatternValue,
  );
  if (!selectedPattern) return;

  // Update the hidden input and display for the target
  const patternInput = document.getElementById(
    currentPatternTarget + "Pattern",
  );
  const patternImg = document.getElementById(
    currentPatternTarget + "PatternImg",
  );
  const patternName = document.getElementById(
    currentPatternTarget + "PatternName",
  );
  const patternDesc = document.getElementById(
    currentPatternTarget + "PatternDesc",
  );

  if (patternInput) patternInput.value = selectedPatternValue;
  if (patternImg) {
    patternImg.src = selectedPattern.img;
    patternImg.alt = selectedPattern.name;
    patternImg.classList.remove("hidden");
  }
  if (patternName) patternName.textContent = selectedPattern.name;
  if (patternDesc) patternDesc.textContent = selectedPattern.desc;

  closePatternModal();
}

// =========================================
// Single Glass Configuration Modal Functions
// =========================================

let selectedSingleGlassType = null;
let selectedSingleThickness = null;
let selectedSingleColour = null;
let selectedPaintedColourType = "stock";

// Stock colours data
const stockColours = [
  { value: "amber", name: "Amber", color: "#C88A3D" },
  { value: "light-cream", name: "Light Cream", color: "#E6E1C6" },
  { value: "sand", name: "Sand", color: "#D6C07A" },
  { value: "brown", name: "Brown", color: "#9C7A5A" },
  { value: "bright-yellow", name: "Bright Yellow", color: "#FFD23A" },
  { value: "golden-yellow", name: "Golden Yellow", color: "#F2B705" },
  { value: "soft-pink", name: "Soft Pink", color: "#F3B6C6" },
  { value: "red-orange", name: "Red Orange", color: "#E84C2A" },
  { value: "bright-red", name: "Bright Red", color: "#E53935" },
  { value: "dark-red", name: "Dark Red", color: "#A51E2D" },
];

const cfteColours = [
  { value: "dark-teal", name: "Dark Teal", color: "#1F3A3A" },
  { value: "teal-blue", name: "Teal Blue", color: "#4F8F8B" },
  { value: "light-mint", name: "Light Mint", color: "#C9E3B4" },
  { value: "olive-grey", name: "Olive Grey", color: "#9AA37C" },
  { value: "dark-olive", name: "Dark Olive", color: "#2F3B1F" },
  { value: "forest-green", name: "Forest Green", color: "#1F2F1A" },
  { value: "lime-green", name: "Lime Green", color: "#B9D948" },
  { value: "apple-green", name: "Apple Green", color: "#9ACD32" },
  { value: "fresh-green", name: "Fresh Green", color: "#6FBF3A" },
  { value: "pale-green", name: "Pale Green", color: "#C9CFA5" },
];

const ralColours = [
  { value: "ivory", name: "Ivory", color: "#FFF7D6" },
  { value: "light-yellow", name: "Light Yellow", color: "#FFF1B3" },
  { value: "apricot", name: "Apricot", color: "#F7C27A" },
  { value: "peach", name: "Peach", color: "#F4B183" },
  { value: "beige", name: "Beige", color: "#C6A57A" },
  { value: "brown-beige", name: "Brown Beige", color: "#9B7B4A" },
  { value: "orange", name: "Orange", color: "#F4A032" },
  { value: "light-pink", name: "Light Pink", color: "#F6C1CC" },
  { value: "coral-red", name: "Coral Red", color: "#E24B4B" },
  { value: "orange-red", name: "Orange Red", color: "#F05A28" },
];

// Open Single Glass Configuration Modal
function openSingleGlassConfigModal() {
  const glassTypeSelect = document.getElementById("singleGlassTypeSelect");
  const glassType = glassTypeSelect.value;

  if (!glassType) return; // Do nothing if no type selected

  selectedSingleGlassType = glassType;
  selectedSingleThickness = null;
  selectedSingleColour = null;

  // Update modal title with glass type
  const typeNames = {
    clear: "Clear Glass",
    "low-iron": "Low Iron Glass",
    satin: "Satin Glass",
    tinted: "Tinted Glass",
    black: "Black Glass",
    painted: "Painted Glass",
  };
  document.getElementById("glassConfigModalTitle").textContent =
    typeNames[glassType] || "Glass Configuration";

  // Reset thickness selection
  document.querySelectorAll('input[name="modalThickness"]').forEach((radio) => {
    radio.checked = false;
    radio
      .closest("label")
      .querySelector(".thickness-option")
      .classList.remove("border-blue-500", "bg-blue-50");
  });

  // Filter thickness options based on glass type
  // For tinted glass, only show 6mm and 10mm
  const tintedOnlyThicknesses = ["6mm", "10mm"];
  document.querySelectorAll('input[name="modalThickness"]').forEach((radio) => {
    const label = radio.closest("label");
    if (glassType === "tinted") {
      if (tintedOnlyThicknesses.includes(radio.value)) {
        label.classList.remove("hidden");
      } else {
        label.classList.add("hidden");
      }
    } else {
      label.classList.remove("hidden");
    }
  });

  // Show/hide colour sections based on glass type
  document
    .getElementById("tintedColourSection")
    .classList.toggle("hidden", glassType !== "tinted");
  document
    .getElementById("paintedColourSection")
    .classList.toggle("hidden", glassType !== "painted");

  // Reset tint colour selection
  document
    .querySelectorAll('input[name="modalTintColour"]')
    .forEach((radio) => {
      radio.checked = false;
      radio
        .closest("label")
        .querySelector(".tint-option")
        .classList.remove("border-blue-500", "bg-blue-50");
    });

  // Populate painted colour grids if painted
  if (glassType === "painted") {
    populateColourGrid("stockColoursGrid", stockColours);
    populateColourGrid("cfteColoursGrid", cfteColours);
    populateColourGrid("ralColoursGrid", ralColours);
    switchPaintedColourTab("stock");
  }

  // Reset button state
  document.getElementById("confirmGlassConfigBtn").disabled = true;

  // Show modal
  document.getElementById("glassConfigModal").classList.remove("hidden");

  // Add event listeners for thickness selection
  setupThicknessListeners();
  setupTintColourListeners();
}

// Populate colour grid with labelled swatches like the screenshot
function populateColourGrid(containerId, colours) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";

  colours.forEach((colour) => {
    const swatch = document.createElement("label");
    swatch.className = "cursor-pointer";

    // Calculate if text should be dark or light based on background
    const isLightColour = isLight(colour.color);
    const textColour = isLightColour ? "#333333" : "#FFFFFF";

    swatch.innerHTML = `
      <input type="radio" name="modalPaintColour" value="${colour.value}" class="sr-only">
      <div class="colour-swatch w-20 h-20 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all flex flex-col items-center justify-center p-1" 
           style="background-color: ${colour.color};">

        <span class="text-xs text-center leading-tight mt-0.5" style="color: ${textColour}; text-shadow: 0 1px 2px rgba(0,0,0,0.3);">${colour.name}</span>
      </div>
    `;

    swatch.querySelector("input").addEventListener("change", function () {
      // Remove selection from all
      document.querySelectorAll(".colour-swatch").forEach((s) => {
        s.classList.remove("border-blue-500", "ring-2", "ring-blue-300");
      });
      // Add selection
      swatch
        .querySelector(".colour-swatch")
        .classList.add("border-blue-500", "ring-2", "ring-blue-300");
      selectedSingleColour = colour.value;
      updateConfirmButtonState();
    });

    container.appendChild(swatch);
  });
}

// Helper function to determine if a colour is light or dark
function isLight(hexColor) {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness > 155;
}

// Setup thickness selection listeners
function setupThicknessListeners() {
  document.querySelectorAll('input[name="modalThickness"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      // Remove selection from all
      document.querySelectorAll(".thickness-option").forEach((opt) => {
        opt.classList.remove("border-blue-500", "bg-blue-50");
      });
      // Add selection
      this.closest("label")
        .querySelector(".thickness-option")
        .classList.add("border-blue-500", "bg-blue-50");
      selectedSingleThickness = this.value;
      updateConfirmButtonState();
    });
  });
}

// Setup tint colour listeners
function setupTintColourListeners() {
  document
    .querySelectorAll('input[name="modalTintColour"]')
    .forEach((radio) => {
      radio.addEventListener("change", function () {
        // Remove selection from all
        document.querySelectorAll(".tint-option").forEach((opt) => {
          opt.classList.remove("border-blue-500", "bg-blue-50");
        });
        // Add selection
        this.closest("label")
          .querySelector(".tint-option")
          .classList.add("border-blue-500", "bg-blue-50");
        selectedSingleColour = this.value;
        updateConfirmButtonState();
      });
    });
}

// Switch painted colour tab
function switchPaintedColourTab(tabName) {
  selectedPaintedColourType = tabName;

  // Update tab button styles
  document.querySelectorAll(".painted-tab").forEach((tab) => {
    tab.classList.remove("bg-blue-600", "text-white");
    tab.classList.add("bg-gray-200", "text-gray-700");
  });

  const activeTab = document.getElementById(
    "tab" + tabName.charAt(0).toUpperCase() + tabName.slice(1),
  );
  if (activeTab) {
    activeTab.classList.remove("bg-gray-200", "text-gray-700");
    activeTab.classList.add("bg-blue-600", "text-white");
  }

  // Show/hide tab content
  document.querySelectorAll(".paint-tab-content").forEach((content) => {
    content.classList.add("hidden");
  });

  const contentId = tabName + "ColoursContainer";
  const content = document.getElementById(contentId);
  if (content) content.classList.remove("hidden");

  // For custom tab, handle input
  if (tabName === "custom") {
    const customInput = document.getElementById("customColourInput");
    const customPreview = document.getElementById("customColourPreviewBox");

    // Use oninput to prevent stacking listeners and handle preview
    customInput.oninput = function () {
      const val = this.value.trim();
      selectedSingleColour = "custom:" + val;

      if (customPreview) {
        if (val) {
          customPreview.style.backgroundColor = val;
          // If the color is invalid, the browser will ignore the assignment,
          // but we can't easily detect that without more logic.
          // For now, this is sufficient for a preview.
        } else {
          customPreview.style.backgroundColor = "#f3f4f6"; // Match bg-gray-100
        }
      }
      updateConfirmButtonState();
    };
  }
}

// Update confirm button state
function updateConfirmButtonState() {
  const btn = document.getElementById("confirmGlassConfigBtn");

  // Thickness is always required
  if (!selectedSingleThickness) {
    btn.disabled = true;
    return;
  }

  // For tinted/painted, also need colour
  if (
    selectedSingleGlassType === "tinted" ||
    selectedSingleGlassType === "painted"
  ) {
    if (!selectedSingleColour) {
      btn.disabled = true;
      return;
    }
  }

  btn.disabled = false;
}

// Close Glass Config Modal
function closeGlassConfigModal() {
  document.getElementById("glassConfigModal").classList.add("hidden");
}

// Confirm Glass Configuration
function confirmGlassConfiguration() {
  if (!selectedSingleThickness) return;

  // Update hidden inputs
  document.getElementById("singleGlassThickness").value =
    selectedSingleThickness;
  document.getElementById("singleGlassType").value = selectedSingleGlassType;

  const colourInput = document.getElementById("singleGlassColour");
  if (colourInput) colourInput.value = selectedSingleColour || "";

  // Update display
  const configDisplay = document.getElementById("singleGlassConfigDisplay");
  configDisplay.classList.remove("hidden");

  const typeNames = {
    clear: "Clear",
    "low-iron": "Low Iron",
    satin: "Satin",
    tinted: "Tinted",
    black: "Black",
    painted: "Painted",
  };

  // Set thickness image
  const thicknessImg = document.getElementById("singleConfigThicknessImg");
  const thicknessValue = selectedSingleThickness.replace("mm", "");
  thicknessImg.src = `views/${thicknessValue}mm.png`;
  thicknessImg.alt = selectedSingleThickness;

  // Handle colour image/swatch
  const colourImgContainer = document.getElementById(
    "singleConfigColourImgContainer",
  );
  const colourImg = document.getElementById("singleConfigColourImg");
  const colourSwatch = document.getElementById("singleConfigColourSwatch");

  let summaryText = `${selectedSingleThickness} ${typeNames[selectedSingleGlassType]} Glass`;
  let detailsText = "";

  if (selectedSingleGlassType === "tinted") {
    // Show tint image
    colourImgContainer.classList.remove("hidden");
    colourImg.classList.remove("hidden");
    colourSwatch.classList.add("hidden");

    const tintName = selectedSingleColour === "grey" ? "Grey" : "Bronze";
    colourImg.src = `views/tint-${selectedSingleColour}.jpg`;
    colourImg.alt = tintName;
    detailsText = `Tint: ${tintName}`;
  } else if (selectedSingleGlassType === "painted") {
    // Show colour swatch
    colourImgContainer.classList.remove("hidden");
    colourImg.classList.add("hidden");
    colourSwatch.classList.remove("hidden");

    if (selectedSingleColour && selectedSingleColour.startsWith("custom:")) {
      detailsText = `Custom colour: ${selectedSingleColour.replace("custom:", "")}`;
      colourSwatch.style.backgroundColor = "#cccccc";
    } else {
      // Find the colour in our arrays
      const allColours = [...stockColours, ...cfteColours, ...ralColours];
      const foundColour = allColours.find(
        (c) => c.value === selectedSingleColour,
      );
      if (foundColour) {
        colourSwatch.style.backgroundColor = foundColour.color;
        detailsText = `Colour: ${foundColour.name}`;
      } else {
        detailsText = `Colour: ${selectedSingleColour || "Selected"}`;
        colourSwatch.style.backgroundColor = "#cccccc";
      }
    }
  } else {
    // No colour selection for clear, low-iron, satin, black
    colourImgContainer.classList.add("hidden");
  }

  document.getElementById("singleConfigSummary").textContent = summaryText;
  document.getElementById("singleConfigDetails").textContent = detailsText;

  closeGlassConfigModal();
}

const shapes = [
  // Replace these example URLs with your real image paths.
  // Each shape provides a 0°, 90°, 180° and 270° image. 0° is the main image.
  {
    value: "square",
    name: "Square/Rectangle",
    images: {
      0: "/views/Square.jpg",
      90: "/views/cnr-dubbed.jpg",
      180: "/views/cnr-none.jpg",
      270: "/views/cnr-radius.jpg",
    },
    needsLength: false,
  },
  {
    value: "triangle",
    name: "Right Angle Triangle",
    images: {
      0: "/views/right angle.jpg",
      90: "/images/shapes/triangle_90.png",
      180: "/images/shapes/triangle_180.png",
      270: "/images/shapes/triangle_270.png",
    },
    needsLength: false,
  },
  {
    value: "rake1",
    name: "Rake 1",
    images: {
      0: "/views/Qad.jpg",
      90: "/images/shapes/rake1_90.png",
      180: "/images/shapes/rake1_180.png",
      270: "/images/shapes/rake1_270.png",
    },
    needsLength: true,
  },
  {
    value: "rake2",
    name: "Rake 2",
    images: {
      0: "/views/right trapezoid.jpg",
      90: "/images/shapes/rake2_90.png",
      180: "/images/shapes/rake2_180.png",
      270: "/images/shapes/rake2_270.png",
    },
    needsLength: true,
  },
  {
    value: "rake3",
    name: "Rake 3",
    images: {
      0: "/views/2.jpg",
      90: "/images/shapes/rake3_90.png",
      180: "/images/shapes/rake3_180.png",
      270: "/images/shapes/rake3_270.png",
    },
    needsLength: true,
  },
  {
    value: "rake4",
    name: "Rake 4",
    images: {
      0: "/views/6.jpg",
      90: "/images/shapes/rake4_90.png",
      180: "/images/shapes/rake4_180.png",
      270: "/images/shapes/rake4_270.png",
    },
    needsLength: true,
  },
  {
    value: "circle",
    name: "Circle",
    images: {
      0: "/views/circle.jpg",
      90: "/images/shapes/circle_90.png",
      180: "/images/shapes/circle_180.png",
      270: "/images/shapes/circle_270.png",
    },
    needsLength: false,
  },
  {
    value: "arched",
    name: "Arched-Top",
    images: {
      0: "/views/7.jpg",
      90: "/images/shapes/arched_90.png",
      180: "/images/shapes/arched_180.png",
      270: "/images/shapes/arched_270.png",
    },
    needsLength: true,
  },
  {
    value: "quarter-circle",
    name: "1/4 Circle",
    images: {
      0: "/views/10.jpg",
      90: "/images/shapes/qcircle_90.png",
      180: "/images/shapes/qcircle_180.png",
      270: "/images/shapes/qcircle_270.png",
    },
    needsLength: false,
  },
  {
    value: "trapezium",
    name: "Trapezium",
    images: {
      0: "/views/11.jpg",
      90: "/images/shapes/trapezium_90.png",
      180: "/images/shapes/trapezium_180.png",
      270: "/images/shapes/trapezium_270.png",
    },
    needsLength: true,
  },
  {
    value: "parallelogram",
    name: "Parallelogram",
    images: {
      0: "/views/8.jpg",
      90: "/images/shapes/parallelogram_90.png",
      180: "/images/shapes/parallelogram_180.png",
      270: "/images/shapes/parallelogram_270.png",
    },
    needsLength: true,
  },
  {
    value: "custom",
    name: "Custom",
    images: {
      0: "/views/12.jpg",
      90: "/images/shapes/custom_90.png",
      180: "/images/shapes/custom_180.png",
      270: "/images/shapes/custom_270.png",
    },
    needsLength: false,
  },
];

// Shape descriptions
const shapeDescriptions = {
  square: "A standard rectangular shape with 90-degree angles",
  triangle: "A triangular shape with one right angle",
  rake1: "A sloped roof top design - Rake style 1",
  rake2: "A sloped roof top design - Rake style 2",
  rake3: "A sloped roof top design - Rake style 3",
  rake4: "A sloped roof top design - Rake style 4",
  circle: "A perfect circular shape",
  arched: "A rectangular shape with an arched top",
  "quarter-circle": "A quarter circular shape",
  trapezium: "A four-sided shape with one pair of parallel sides",
  parallelogram: "A four-sided shape with opposite sides parallel",
  custom: "Define your own custom shape",
};

// Glass and spacer data (prices removed)
const glassData = {
  external: [
    {
      value: "4mm-clear",
      name: "4mm Clear Glass",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "4mm-pattern",
      name: "4mm Pattern Glass",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    },
    {
      value: "4mm-satin",
      name: "4mm Satin Glass",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=200&fit=crop",
    },
    {
      value: "6mm-clear",
      name: "6mm Clear Glass",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "6.4mm-clear-laminate",
      name: "6.4mm Clear Laminate",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "6.8mm-acoustic",
      name: "6.8mm Acoustic Glass",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=200&fit=crop",
    },
  ],
  internal: [
    {
      value: "4mm-clear",
      name: "4mm Clear Glass",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "4mm-planitherm",
      name: "4mm Planitherm",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "4mm-planitherm-1",
      name: "4mm Planitherm 1.0",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=200&fit=crop",
    },
    {
      value: "6mm-clear",
      name: "6mm Clear Glass",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "6mm-planitherm",
      name: "6mm Planitherm",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "6mm-planitherm-laminate",
      name: "6mm Planitherm Laminate",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=200&fit=crop",
    },
  ],
};

const spacerData = {
  widths: [
    {
      value: "6",
      name: "6mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "8",
      name: "8mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "10",
      name: "10mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "12",
      name: "12mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "14",
      name: "14mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "16",
      name: "16mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "18",
      name: "18mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
    {
      value: "24",
      name: "24mm Width",
      image:
        "https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=200&fit=crop",
    },
  ],
  colors: [
    {
      value: "silver",
      name: "Silver",
      color: "#C0C0C0",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=200&fit=crop",
    },
    {
      value: "gold",
      name: "Gold",
      color: "#FFD700",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
    {
      value: "white",
      name: "White WarmEdge",
      color: "#FFFFFF",
      image:
        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop",
    },
    {
      value: "grey",
      name: "Grey WarmEdge",
      color: "#6B7280",
      image:
        "https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?w=300&h=200&fit=crop",
    },
    {
      value: "black",
      name: "Black WarmEdge",
      color: "#000000",
      image:
        "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=300&h=200&fit=crop",
    },
  ],
};

// Modal functionality
let currentModalTarget = "";
let selectedOption = null;

// Shape Modal Functions
function openShapeModal(target) {
  currentShapeTarget = target;
  selectedShape = null;

  const modal = document.getElementById("shapeModal");
  const title = document.getElementById("shapeModalTitle");
  const container = document.getElementById("shapeOptionsContainer");
  const configPanel = document.getElementById("shapeConfigPanel");

  // Check if there's an existing shape selection
  const existingShapeInput = document.getElementById(target + "Shape");
  const existingShapeValue = existingShapeInput
    ? existingShapeInput.value
    : null;

  if (existingShapeValue) {
    title.textContent = "Edit Shape Configuration";
  } else {
    title.textContent = "Select Shape";
  }

  configPanel.classList.add("hidden");

  // Reset selected shape text and description
  const selectedShapeText = document.getElementById("selectedShapeText");
  const selectedShapeDescription = document.getElementById(
    "selectedShapeDescription",
  );
  if (selectedShapeText) {
    selectedShapeText.textContent = "Select a shape";
  }
  if (selectedShapeDescription) {
    selectedShapeDescription.textContent = "Choose a shape to see details";
  }

  // Initialize shape data - don't reset if editing existing
  if (!existingShapeValue) {
    shapeData = {
      currentShape: null,
      rotation: 0,
      widthA: 0,
      heightA: 0,
      lengthC: 0,
      customName: "",
      reference: "",
      templateFile: null,
    };
  }

  // Populate shape options
  container.innerHTML = "";
  shapes.forEach((shape) => {
    const option = document.createElement("div");
    option.className =
      "shape-option cursor-pointer border-2 border-gray-200 rounded-lg p-3 text-center hover:border-blue-400 transition-all";
    option.dataset.value = shape.value;
    option.dataset.name = shape.name;
    option.dataset.needsLength = shape.needsLength;

    // store per-rotation image URLs on dataset
    option.dataset.rot0 = shape.images["0"];
    option.dataset.rot90 = shape.images["90"];
    option.dataset.rot180 = shape.images["180"];
    option.dataset.rot270 = shape.images["270"];

    // Highlight currently selected shape
    if (existingShapeValue && shape.value === existingShapeValue) {
      option.classList.add("shape-selected");
      option.classList.remove("border-gray-200");
      option.classList.add("border-blue-500");
    }

    option.innerHTML = `
                    <div class="mb-2">
                        <img src="${shape.images["0"]}" alt="${shape.name}" class="mx-auto h-20 object-contain" onerror="this.style.display='none'">
                    </div>
                    <p class="text-sm font-medium">${shape.name}</p>
                `;

    option.addEventListener("click", function () {
      selectShapeType(this);
    });

    container.appendChild(option);
  });

  // If editing existing shape, pre-populate the form
  if (existingShapeValue) {
    // Find the existing shape option and select it
    const existingOption = container.querySelector(
      `[data-value="${existingShapeValue}"]`,
    );
    if (existingOption) {
      selectShapeType(existingOption);
    }

    // Pre-populate form fields with existing values after a short delay to ensure DOM is ready
    setTimeout(() => {
      let widthA = document.getElementById(
        target + "SelectedWidth",
      ).textContent;
      let heightA = document.getElementById(
        target + "SelectedHeight",
      ).textContent;
      let rotation = document.getElementById(
        target + "SelectedRotation",
      ).textContent;
      let reference = document.getElementById(target + "ShapeRef").textContent;
      const lengthCElement = document.getElementById(
        target + "SelectedLengthC",
      );
      let lengthC = lengthCElement ? lengthCElement.textContent : "";

      // Clean up values (remove units)
      widthA = widthA ? widthA.replace(/mm$/i, "").trim() : "";
      heightA = heightA ? heightA.replace(/mm$/i, "").trim() : "";
      rotation = rotation ? rotation.replace(/°$/i, "").trim() : "0";
      reference = reference && reference !== "-" ? reference : "";
      lengthC =
        lengthC && lengthC !== "-" ? lengthC.replace(/mm$/i, "").trim() : "";

      // Populate form fields
      if (widthA && widthA !== "-") {
        document.getElementById("shapeWidthA").value = widthA;
      }
      if (heightA && heightA !== "-") {
        document.getElementById("shapeHeightA").value = heightA;
      }
      if (lengthC && lengthC !== "-") {
        document.getElementById("shapeLengthC").value = lengthC;
        // Show length container if needed
        const lengthContainer = document.getElementById("shapeLengthContainer");
        if (lengthContainer) lengthContainer.classList.remove("hidden");
      }
      if (reference) {
        document.getElementById("shapeReference").value = reference;
      }

      // Set rotation value and update display
      document.getElementById("shapeRotation").value = rotation || "0";
      updateRotationDisplay(rotation || "0");

      // Trigger validation and calculation
      validateShapeForm();
      updateShapeCalculations();
    }, 100);
  }

  modal.classList.remove("hidden");
}

// set/update image shown in the summary for the current target (single|double|triple)
function setSummaryShapeImage(targetPrefix, imageUrl, name) {
  if (!targetPrefix) return;
  const imgEl = document.getElementById(targetPrefix + "SelectedShapeImg");
  const nameEl = document.getElementById(targetPrefix + "SelectedShape");
  if (!imgEl) return;
  if (imageUrl) {
    imgEl.src = imageUrl;
    imgEl.alt = name || "";
    imgEl.classList.remove("hidden");
  } else {
    imgEl.src = "";
    imgEl.alt = "";
    imgEl.classList.add("hidden");
  }
  if (nameEl && name) nameEl.textContent = name;
}

// Update rotation button display to show selected rotation
function toggleExtrasCutouts(show) {
  const options = document.getElementById("extrasCutoutsOptions");
  if (options) {
    if (show) options.classList.remove("hidden");
    else options.classList.add("hidden");
  }
  updateSingleExtrasSummary();
}

function toggleCutoutCount(type, checked) {
  const mapping = {
    boxcut: "countBoxcut",
    cornerNotch: "countCornerNotch",
    edgeNotch: "countEdgeNotch",
    hinge: "countHinge",
  };
  Object.values(mapping).forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  });
  if (checked && mapping[type]) {
    const el = document.getElementById(mapping[type]);
    if (el) el.classList.remove("hidden");
  }
  updateSingleExtrasSummary();
}

function updateRotationDisplay(rotation) {
  // clear active state from all rotation buttons
  document.querySelectorAll(".rotation-btn").forEach((b) => {
    b.classList.remove("border-blue-500", "bg-blue-50");
  });

  // set active state on the correct rotation button
  const rotationBtn = document.querySelector(
    `.rotation-btn[data-rotation="${rotation}"]`,
  );
  if (rotationBtn) {
    rotationBtn.classList.add("border-blue-500", "bg-blue-50");
  }

  // Update shapeData rotation
  shapeData.rotation = parseInt(rotation) || 0;
}
function selectShapeType(element) {
  // Remove selection from all shapes
  document.querySelectorAll(".shape-option").forEach((opt) => {
    opt.classList.remove("border-blue-500", "bg-blue-50");
  });

  // Add selection to clicked shape
  element.classList.add("border-blue-500", "bg-blue-50");
  selectedShape = element;

  // Update shape data
  shapeData.currentShape = element.dataset.value;

  // Show configuration panel
  const configPanel = document.getElementById("shapeConfigPanel");
  configPanel.classList.remove("hidden");

  // Update preview
  const mainImg = element.dataset.rot0 || element.dataset.rot0;
  updateShapePreview(mainImg, element.dataset.name);

  // Update selected shape text and description
  const selectedShapeText = document.getElementById("selectedShapeText");
  const selectedShapeDescription = document.getElementById(
    "selectedShapeDescription",
  );
  if (selectedShapeText) {
    selectedShapeText.textContent = element.dataset.name;
  }
  if (selectedShapeDescription) {
    selectedShapeDescription.textContent =
      shapeDescriptions[element.dataset.value] || "No description available";
  }

  updateRotationIcons({
    rot0: element.dataset.rot0,
    rot90: element.dataset.rot90,
    rot180: element.dataset.rot180,
    rot270: element.dataset.rot270,
  });

  // update the summary image for the currently-targeted form
  if (currentShapeTarget) {
    setSummaryShapeImage(currentShapeTarget, mainImg, element.dataset.name);
  }

  // Show/hide length field based on shape
  const lengthContainer = document.getElementById("shapeLengthContainer");
  const customContainer = document.getElementById("customShapeContainer");
  const templateContainer = document.getElementById("templateUploadContainer");

  if (lengthContainer) {
    if (element.dataset.needsLength === "true") {
      lengthContainer.classList.remove("hidden");
    } else {
      lengthContainer.classList.add("hidden");
    }
  }

  // Always show the template upload option
  if (templateContainer) {
    templateContainer.classList.remove("hidden");
  }

  if (customContainer) {
    if (element.dataset.value === "custom") {
      customContainer.classList.remove("hidden");
    } else {
      customContainer.classList.add("hidden");
    }
  }

  // Reset form fields only if selecting a different shape (not editing existing)
  const existingShapeInput = document.getElementById(
    currentShapeTarget + "Shape",
  );
  const isEditingExisting =
    existingShapeInput && existingShapeInput.value === element.dataset.value;

  if (!isEditingExisting) {
    document.getElementById("shapeWidthA").value = "";
    document.getElementById("shapeHeightA").value = "";
    document.getElementById("shapeLengthC").value = "";
    document.getElementById("customShapeName").value = "";
    document.getElementById("shapeReference").value = "";
    document.getElementById("shapeRotation").value = "0";

    // Reset rotation buttons
    document.querySelectorAll(".rotation-btn").forEach((btn) => {
      btn.classList.remove("border-blue-500", "bg-blue-50");
    });
    document
      .querySelector('.rotation-btn[data-rotation="0"]')
      .classList.add("border-blue-500", "bg-blue-50");
  }

  // Update rotation icons
  updateRotationIcons({
    rot0: element.dataset.rot0,
    rot90: element.dataset.rot90,
    rot180: element.dataset.rot180,
    rot270: element.dataset.rot270,
  });

  // Clear calculations
  updateShapeCalculations();

  // Enable/disable select button
  validateShapeForm();
}

function updateShapePreview(imageUrl, name) {
  const previewEl = document.getElementById("shapePreview");
  if (!previewEl) return;

  // replace content with an <img> using the 0° image
  previewEl.innerHTML = `<img src="${imageUrl}" alt="${name}" class="mx-auto max-h-44 object-contain" onerror="this.style.display='none'">`;
  document.getElementById("shapePreviewName").textContent = name;
}

function updateRotationIcons(images) {
  // images: { rot0, rot90, rot180, rot270 } - each may be undefined
  const rotMap = {
    rotation0: images.rot0,
    rotation90: images.rot90,
    rotation180: images.rot180,
    rotation270: images.rot270,
  };

  Object.keys(rotMap).forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const src = rotMap[id];
    if (src) {
      el.innerHTML = `<img src="${src}" alt="" class="mx-auto h-6 object-contain" onerror="this.style.display='none'">`;
    } else {
      // fallback to a simple square if rotation image not provided
      el.textContent = "⬜";
    }
  });
}

function closeShapeModal() {
  document.getElementById("shapeModal").classList.add("hidden");
  currentShapeTarget = "";
  selectedShape = null;
}

function selectShapeOption() {
  if (!selectedShape || !validateShapeForm()) {
    return;
  }

  // Store values before closing modal (since closeShapeModal resets them)
  const target = currentShapeTarget;
  const shape = selectedShape;

  // Close modal immediately after validation
  closeShapeModal();

  // Collect form data
  shapeData.widthA =
    parseFloat(document.getElementById("shapeWidthA").value) || 0;
  shapeData.heightA =
    parseFloat(document.getElementById("shapeHeightA").value) || 0;
  const lengthEl = document.getElementById("shapeLengthC");
  shapeData.lengthC = lengthEl ? parseFloat(lengthEl.value) || 0 : 0;
  const customNameEl = document.getElementById("customShapeName");
  shapeData.customName = customNameEl ? customNameEl.value || "" : "";
  const referenceEl = document.getElementById("shapeReference");
  shapeData.reference = referenceEl ? referenceEl.value || "" : "";
  shapeData.rotation =
    parseInt(document.getElementById("shapeRotation").value) || 0;

  // Update the target elements using stored target
  const hiddenInput = document.getElementById(target + "Shape");
  const textSpan = document.getElementById(target + "ShapeText");
  const detailsDiv = document.getElementById(target + "ShapeDetails");

  if (hiddenInput && textSpan) {
    hiddenInput.value = shape.dataset.value;
    textSpan.textContent = shape.dataset.name;
    textSpan.classList.remove("text-gray-500");
    textSpan.classList.add("text-gray-800");
  }

  // Show shape details
  if (detailsDiv) {
    detailsDiv.classList.remove("hidden");
    // Temporarily set currentShapeTarget and selectedShape for updateShapeDetailsDisplay
    const originalTarget = currentShapeTarget;
    const originalShape = selectedShape;
    currentShapeTarget = target;
    selectedShape = shape;
    updateShapeDetailsDisplay();
    currentShapeTarget = originalTarget;
    selectedShape = originalShape;
  }

  calculatePrice();
}

function validateShapeForm() {
  const widthEl = document.getElementById("shapeWidthA");
  const heightEl = document.getElementById("shapeHeightA");
  const lengthEl = document.getElementById("shapeLengthC");
  const customNameEl = document.getElementById("customShapeName");
  const widthA = widthEl ? parseFloat(widthEl.value) || 0 : 0;
  const heightA = heightEl ? parseFloat(heightEl.value) || 0 : 0;
  const lengthC = lengthEl ? parseFloat(lengthEl.value) || 0 : 0;
  const customName = customNameEl ? customNameEl.value || "" : "";

  let isValid = true;

  if (!selectedShape) {
    isValid = false;
  }

  if (widthA < 100 || widthA > 2800) {
    isValid = false;
  }

  if (heightA < 100 || heightA > 2800) {
    isValid = false;
  }

  if (
    selectedShape &&
    selectedShape.dataset.needsLength === "true" &&
    (lengthC < 100 || lengthC > 2800)
  ) {
    isValid = false;
  }

  if (
    selectedShape &&
    selectedShape.dataset.value === "custom" &&
    !customName.trim()
  ) {
    isValid = false;
  }

  // Update select button state
  const selectBtn = document.getElementById("selectShapeBtn");
  if (selectBtn) {
    selectBtn.disabled = !isValid;
  }

  return isValid;
}

function getSingleUnitGlassCost(area) {
  const thickness = document.getElementById("singleGlassThickness").value;
  const glassType = document.querySelector(
    'input[name="singleGlassType"]:checked',
  )?.value;

  if (!thickness || !glassType || !singleUnitPricing[thickness]) {
    return 0;
  }

  let priceKey = glassType;

  if (glassType === "tinted") {
    const tintColor = document.querySelector(
      'input[name="singleTintColor"]:checked',
    )?.value;
    if (!tintColor) return 0;
    priceKey = `tinted-${tintColor}`;
  } else if (glassType === "painted") {
    // Simplified logic for painted glass pricing based on your data
    // This assumes 'White' and 'Black' are the primary priced custom colors.
    const colorType = document.querySelector(
      'input[name="singleColorType"]:checked',
    )?.value;
    if (colorType === "ral") {
      const ralColor = document.getElementById("singleRALColor").value;
      if (ralColor.includes("9010") || ralColor.includes("9016")) {
        priceKey = "painted-ral-9010"; // Use a generic white key
      }
    } else if (colorType === "custom") {
      const customColor = document
        .getElementById("singleCustomColor")
        .value.toLowerCase();
      if (customColor.includes("white")) {
        priceKey = "painted-custom-white";
      } else if (customColor.includes("black")) {
        priceKey = "painted-custom-black";
      }
    }
  } else if (glassType === "black") {
    priceKey = "black";
  }

  const pricePerSqm = singleUnitPricing[thickness][priceKey] || 0;

  // Minimum area charge of 0.3 m²
  const chargeableArea = Math.max(area, 0.3);

  return chargeableArea * pricePerSqm;
}
function getDoubleGlazedGlassCost(area) {
  const outerGlassType = document.getElementById("doubleOuterGlass").value;
  const innerGlassType = document.getElementById("doubleInnerGlass").value;

  if (!outerGlassType || !innerGlassType) {
    return 0;
  }

  const outerPricePerSqm = doubleGlazedPricing.external[outerGlassType] || 0;
  const innerPricePerSqm = doubleGlazedPricing.internal[innerGlassType] || 0;

  const totalGlassPricePerSqm = outerPricePerSqm + innerPricePerSqm;

  // Minimum area charge of 0.3 m²
  const chargeableArea = Math.max(area, 0.3);

  return chargeableArea * totalGlassPricePerSqm;
}
function getTripleGlazedGlassCost(area) {
  const outerGlassType = document.getElementById("tripleOuterGlass").value;
  const centreGlassType = document.getElementById("tripleCentreGlass").value;
  const innerGlassType = document.getElementById("tripleInnerGlass").value;

  if (!outerGlassType || !centreGlassType || !innerGlassType) {
    return 0;
  }

  const outerPricePerSqm = tripleGlazedPricing.external[outerGlassType] || 0;
  const centrePricePerSqm = tripleGlazedPricing.centre[centreGlassType] || 0;
  const innerPricePerSqm = tripleGlazedPricing.internal[innerGlassType] || 0;

  const totalGlassPricePerSqm =
    outerPricePerSqm + centrePricePerSqm + innerPricePerSqm;

  // Minimum area charge of 0.3 m²
  const chargeableArea = Math.max(area, 0.3);

  return chargeableArea * totalGlassPricePerSqm;
}

function updateShapeDetailsDisplay() {
  const area = calculateShapeArea();
  const linear = calculateLinearMetre();
  const weight = calculateWeight(area);
  let glassCost = 0;
  if (currentTab === "single") {
    glassCost = getSingleUnitGlassCost(area);
  } else if (currentTab === "double") {
    glassCost = getDoubleGlazedGlassCost(area);
  } else if (currentTab === "triple") {
    glassCost = getTripleGlazedGlassCost(area);
  }
  const shapeCost = getShapeCost();
  const oversizeCost = getOversizeCost();
  const totalCost = glassCost + shapeCost + oversizeCost;

  // Update shape configuration details
  const summaryEl = document.getElementById(
    currentShapeTarget + "ConfigShapeSummary",
  );
  if (selectedShape && summaryEl) {
    summaryEl.textContent = selectedShape.dataset.name;
  } else if (summaryEl) {
    summaryEl.textContent = "Not configured";
  }

  // set summary image according to currently selected rotation
  if (selectedShape && currentShapeTarget) {
    const rot = shapeData.rotation || 0;
    const rotKey = "rot" + rot;
    const imgUrl = selectedShape.dataset[rotKey] || selectedShape.dataset.rot0;
    setSummaryShapeImage(
      currentShapeTarget,
      imgUrl,
      selectedShape.dataset.name,
    );
  } else if (currentShapeTarget) {
    setSummaryShapeImage(currentShapeTarget, "", "");
  }
  const rotationEl = document.getElementById(
    currentShapeTarget + "SelectedRotation",
  );
  if (rotationEl) rotationEl.textContent = shapeData.rotation + "°";
  const widthEl = document.getElementById(currentShapeTarget + "SelectedWidth");
  if (widthEl) widthEl.textContent = shapeData.widthA + "mm";
  const heightEl = document.getElementById(
    currentShapeTarget + "SelectedHeight",
  );
  if (heightEl) heightEl.textContent = shapeData.heightA + "mm";
  const weightEl = document.getElementById(currentShapeTarget + "ShapeWeight");
  if (weightEl) weightEl.textContent = weight.toFixed(2) + " kg";
  const costEl = document.getElementById(currentShapeTarget + "ShapeCost");
  if (costEl) costEl.textContent = "£" + totalCost.toFixed(2);

  // Show/hide Length C based on shape
  const lengthCDisplay = document.getElementById(
    currentShapeTarget + "LengthCDisplay",
  );
  if (lengthCDisplay) {
    if (selectedShape && selectedShape.dataset.needsLength === "true" && shapeData.lengthC > 0) {
      lengthCDisplay.classList.remove("hidden");
      const lengthEl = document.getElementById(
        currentShapeTarget + "SelectedLengthC",
      );
      if (lengthEl) lengthEl.textContent = shapeData.lengthC + "mm";
    } else {
      lengthCDisplay.classList.add("hidden");
    }
  }

  // Show/hide Custom Name based on shape
  const customNameDisplay = document.getElementById(
    currentShapeTarget + "CustomNameDisplay",
  );
  if (customNameDisplay) {
    if (selectedShape && selectedShape.dataset.value === "custom" && shapeData.customName) {
      customNameDisplay.classList.remove("hidden");
      const customNameEl = document.getElementById(
        currentShapeTarget + "SelectedCustomName",
      );
      if (customNameEl) customNameEl.textContent = shapeData.customName;
    } else {
      customNameDisplay.classList.add("hidden");
    }
  }

  // Update reference and template
  const shapeRefEl = document.getElementById(
    currentShapeTarget + "ShapeRef",
  );
  if (shapeRefEl) shapeRefEl.textContent = shapeData.reference || "-";
  const templateEl = document.getElementById(
    currentShapeTarget + "TemplateFile",
  );
  if (templateEl) {
    templateEl.textContent = shapeData.templateFile
      ? shapeData.templateFile.name
      : "-";
  }

  // Update calculated values
  const areaEl = document.getElementById(currentShapeTarget + "ShapeArea");
  if (areaEl) areaEl.textContent = area.toFixed(3) + " m²";
  const linearEl = document.getElementById(currentShapeTarget + "ShapeLinear");
  if (linearEl) linearEl.textContent = linear.toFixed(3) + " m";
  const weightEl2 = document.getElementById(currentShapeTarget + "ShapeWeight");
  if (weightEl2) weightEl2.textContent = weight.toFixed(2) + " kg";
  const costEl2 = document.getElementById(currentShapeTarget + "ShapeCost");
  if (costEl2) costEl2.textContent = "£" + totalCost.toFixed(2);
}

function updateShapeCalculations() {
  const area = calculateShapeArea();
  const linear = calculateLinearMetre();
  const weight = calculateWeight(area);

  // Update modal calculations
  const areaEl = document.getElementById("calculatedArea");
  if (areaEl) areaEl.textContent = area.toFixed(3);
  const linearEl = document.getElementById("calculatedLinear");
  if (linearEl) linearEl.textContent = linear.toFixed(3);
  const weightEl = document.getElementById("calculatedWeight");
  if (weightEl) weightEl.textContent = weight.toFixed(2);

  // Calculate costs (simplified)
  let glassCost = 0;
  if (currentTab === "single") {
    glassCost = getSingleUnitGlassCost(area);
  } else if (currentTab === "double") {
    glassCost = getDoubleGlazedGlassCost(area);
  } else if (currentTab === "triple") {
    glassCost = getTripleGlazedGlassCost(area);
  }
  const shapeCost = getShapeCost();
  const oversizeCost = getOversizeCost();

  const glassCostEl = document.getElementById("calculatedGlassCost");
  if (glassCostEl) glassCostEl.textContent = glassCost.toFixed(2);
  const shapeCostEl = document.getElementById("calculatedShapeCost");
  if (shapeCostEl) shapeCostEl.textContent = shapeCost.toFixed(2);
  const oversizeCostEl = document.getElementById("calculatedOversizeCost");
  if (oversizeCostEl) oversizeCostEl.textContent = oversizeCost.toFixed(2);
}

function calculateShapeArea() {
  const widthA = parseFloat(document.getElementById("shapeWidthA").value) || 0;
  const heightA =
    parseFloat(document.getElementById("shapeHeightA").value) || 0;
  const lengthC =
    parseFloat(document.getElementById("shapeLengthC").value) || 0;

  if (!selectedShape || widthA === 0 || heightA === 0) return 0;

  const widthM = widthA / 1000;
  const heightM = heightA / 1000;
  const lengthM = lengthC / 1000;

  switch (selectedShape.dataset.value) {
    case "square":
      return widthM * heightM;
    case "triangle":
      return (widthM * heightM) / 2;
    case "circle":
      const radius = Math.min(widthM, heightM) / 2;
      return Math.PI * radius * radius;
    case "quarter-circle":
      const qRadius = Math.min(widthM, heightM) / 2;
      return (Math.PI * qRadius * qRadius) / 4;
    case "trapezium":
      return ((widthM + lengthM) * heightM) / 2;
    case "parallelogram":
      return widthM * heightM;
    case "arched":
      const rectArea = widthM * heightM;
      const archRadius = widthM / 2;
      const archArea = (Math.PI * archRadius * archRadius) / 2;
      return rectArea + archArea;
    default:
      return widthM * heightM; // Default to rectangle
  }
}

function calculateLinearMetre() {
  const widthA = parseFloat(document.getElementById("shapeWidthA").value) || 0;
  const heightA =
    parseFloat(document.getElementById("shapeHeightA").value) || 0;
  const lengthC =
    parseFloat(document.getElementById("shapeLengthC").value) || 0;

  if (!selectedShape || widthA === 0 || heightA === 0) return 0;

  const widthM = widthA / 1000;
  const heightM = heightA / 1000;
  const lengthM = lengthC / 1000;

  switch (selectedShape.dataset.value) {
    case "square":
      return 2 * (widthM + heightM);
    case "triangle":
      return widthM + heightM + Math.sqrt(widthM * widthM + heightM * heightM);
    case "circle":
      const radius = Math.min(widthM, heightM) / 2;
      return 2 * Math.PI * radius;
    case "quarter-circle":
      const qRadius = Math.min(widthM, heightM) / 2;
      return (Math.PI * qRadius) / 2 + widthM + heightM;
    default:
      return 2 * (widthM + heightM); // Default to rectangle perimeter
  }
}

function calculateWeight(area) {
  // Simplified weight calculation: 25kg per m² for glass
  return area * 25;
}

function getShapeCost() {
  if (!selectedShape) return 0;

  const shapeCosts = {
    square: 10,
    triangle: 15,
    rake1: 20,
    rake2: 25,
    rake3: 30,
    rake4: 35,
    circle: 20,
    arched: 25,
    "quarter-circle": 20,
    trapezium: 25,
    parallelogram: 20,
    custom: 50,
  };

  return shapeCosts[selectedShape.dataset.value] || 0;
}

function getOversizeCost() {
  const widthA = parseFloat(document.getElementById("shapeWidthA").value) || 0;
  const heightA =
    parseFloat(document.getElementById("shapeHeightA").value) || 0;

  // Oversize cost for dimensions over 2000mm
  let cost = 0;
  if (widthA > 2000) cost += 25;
  if (heightA > 2000) cost += 25;

  return cost;
}

function handleTemplateUpload(input) {
  const file = input.files[0];
  const preview = document.getElementById("templatePreview");
  const fileName = document.getElementById("templateFileName");

  if (file) {
    preview.classList.remove("hidden");
    fileName.textContent = file.name;
    shapeData.templateFile = file;
  } else {
    preview.classList.add("hidden");
    fileName.textContent = "";
    shapeData.templateFile = null;
  }
}

function openGlassModal(target) {
  currentModalTarget = target;
  selectedOption = null;

  const modal = document.getElementById("glassModal");
  const title = document.getElementById("glassModalTitle");
  const container = document.getElementById("glassOptionsContainer");

  // Set title based on target
  if (target.includes("Outer")) {
    title.textContent = "Select External Glass";
  } else if (target.includes("Inner")) {
    title.textContent = "Select Internal Glass";
  } else if (target.includes("Centre")) {
    title.textContent = "Select Centre Glass";
  }

  // Determine which glass data to use
  let data = target.includes("Outer") ? glassData.external : glassData.internal;

  // Populate options
  container.innerHTML = "";
  data.forEach((glass) => {
    const option = document.createElement("div");
    option.className =
      "glass-option cursor-pointer border-2 border-gray-200 rounded-lg overflow-hidden hover:border-blue-400 transition-all";
    option.dataset.value = glass.value;
    option.dataset.name = glass.name;
    option.innerHTML = `
                    <img src="${glass.image}" alt="${glass.name}" class="w-full h-32 object-cover" onerror="this.src=''; this.alt='Image failed to load'; this.style.display='none';">
                    <div class="p-3">
                        <p class="font-medium text-gray-800">${glass.name}</p>
                        <p class="text-sm text-gray-600">Professional glass option</p>
                    </div>
                `;

    option.addEventListener("click", function () {
      document.querySelectorAll(".glass-option").forEach((opt) => {
        opt.classList.remove("border-blue-500", "bg-blue-50");
      });
      this.classList.add("border-blue-500", "bg-blue-50");
      selectedOption = this;
    });

    container.appendChild(option);
  });

  modal.classList.remove("hidden");
}

function closeGlassModal() {
  document.getElementById("glassModal").classList.add("hidden");
  currentModalTarget = "";
  selectedOption = null;
}

function selectGlassOption() {
  if (!selectedOption) {
    alert("Please select a glass type first");
    return;
  }

  const value = selectedOption.dataset.value;
  const name = selectedOption.dataset.name;

  // Update the appropriate elements based on currentModalTarget
  let hiddenInputId, textSpanId;

  if (currentModalTarget === "doubleOuter") {
    hiddenInputId = "doubleOuterGlass";
    textSpanId = "doubleOuterGlassText";
  } else if (currentModalTarget === "doubleInner") {
    hiddenInputId = "doubleInnerGlass";
    textSpanId = "doubleInnerGlassText";
  } else if (currentModalTarget === "tripleOuter") {
    hiddenInputId = "tripleOuterGlass";
    textSpanId = "tripleOuterGlassText";
  } else if (currentModalTarget === "tripleCentre") {
    hiddenInputId = "tripleCentreGlass";
    textSpanId = "tripleCentreGlassText";
  } else if (currentModalTarget === "tripleInner") {
    hiddenInputId = "tripleInnerGlass";
    textSpanId = "tripleInnerGlassText";
  }

  const hiddenInput = document.getElementById(hiddenInputId);
  const textSpan = document.getElementById(textSpanId);

  if (hiddenInput && textSpan) {
    hiddenInput.value = value;
    textSpan.textContent = name;
    textSpan.classList.remove("text-gray-500");
    textSpan.classList.add("text-gray-800");
  }

  // Handle pattern glass options visibility
  if (currentModalTarget === "doubleOuter") {
    const patternOptions = document.getElementById("doubleOuterPatternOptions");
    if (value === "4mm-pattern") {
      patternOptions.classList.remove("hidden");
    } else {
      patternOptions.classList.add("hidden");
      // Clear pattern selection when hiding
      document
        .querySelectorAll('input[name="doubleOuterPattern"]')
        .forEach((radio) => (radio.checked = false));
      document
        .querySelectorAll("#doubleOuterPatternOptions .glass-type-option")
        .forEach((option) => {
          option.classList.remove("border-blue-500", "bg-blue-50");
        });
    }
  } else if (currentModalTarget === "tripleOuter") {
    const patternOptions = document.getElementById("tripleOuterPatternOptions");
    if (value === "4mm-pattern") {
      patternOptions.classList.remove("hidden");
    } else {
      patternOptions.classList.add("hidden");
      // Clear pattern selection when hiding
      document
        .querySelectorAll('input[name="tripleOuterPattern"]')
        .forEach((radio) => (radio.checked = false));
      document
        .querySelectorAll("#tripleOuterPatternOptions .glass-type-option")
        .forEach((option) => {
          option.classList.remove("border-blue-500", "bg-blue-50");
        });
    }
  }

  calculatePrice();
  closeGlassModal();
}

// Add event listeners for glass options
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".glass-option").forEach((option) => {
    option.addEventListener("click", function () {
      // Remove selection from all options
      document.querySelectorAll(".glass-option").forEach((opt) => {
        opt.classList.remove("bg-blue-100", "border-blue-500");
      });

      // Add selection to clicked option
      this.classList.add("bg-blue-100", "border-blue-500");
      selectedGlassOption = this;
    });
  });

  // Add event listeners for radio button selections with visual feedback
  document.querySelectorAll('input[type="radio"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      if (this.closest(".glass-type-option")) {
        // Remove selection from all options in the same group
        const groupName = this.name;
        document.querySelectorAll(`input[name="${groupName}"]`).forEach((r) => {
          const option = r.closest("label").querySelector(".glass-type-option");
          if (option) {
            option.classList.remove("border-blue-500", "bg-blue-50");
          }
        });

        // Add selection to clicked option
        const option =
          this.closest("label").querySelector(".glass-type-option");
        if (option) {
          option.classList.add("border-blue-500", "bg-blue-50");
        }
      }
    });
  });
});

// Color preview functionality
function updateColorPreview(previewId, colorValue) {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  const colorMap = {
    silver: "#C0C0C0",
    gold: "#FFD700",
    white: "#FFFFFF",
    grey: "#6B7280",
    black: "#000000",
  };

  if (colorValue && colorMap[colorValue]) {
    preview.style.backgroundColor = colorMap[colorValue];
    preview.classList.remove("hidden");

    // Add border for white color visibility
    if (colorValue === "white") {
      preview.style.border = "2px solid #D1D5DB";
    } else {
      preview.style.border = "1px solid #D1D5DB";
    }
  } else {
    preview.classList.add("hidden");
  }
}

// File upload functionality
function handleFileUpload(input, previewId) {
  const file = input.files[0];
  const preview = document.getElementById(previewId);
  const fileName = document.getElementById(
    previewId.replace("Preview", "FileName"),
  );

  if (file) {
    preview.classList.remove("hidden");
    if (fileName) {
      fileName.textContent = file.name;
    }
  } else {
    preview.classList.add("hidden");
    if (fileName) {
      fileName.textContent = "";
    }
  }
}

// Corner and hole option functionality
function toggleSingleHoleOptions() {
  const holesSelect = document.getElementById("singleHoles");
  const selectedHole = holesSelect.value;

  // Open appropriate modal based on selection
  if (selectedHole === "mounting-holes") {
    openHoleModal("mountingHolesModal");
  } else if (selectedHole === "centre-hole") {
    openHoleModal("centreHoleModal");
  } else if (selectedHole === "pet-flap") {
    openHoleModal("petFlapModal");
  } else if (selectedHole === "custom-hole") {
    openHoleModal("customHoleModal");
  }

  // Reset selection after opening modal
  setTimeout(() => {
    holesSelect.value = "";
  }, 100);
}

function openHoleTypeModal() {
  const modal = document.getElementById("holeTypeModal");
  if (modal) modal.classList.remove("hidden");
}

function closeHoleTypeModal() {
  const modal = document.getElementById("holeTypeModal");
  if (modal) modal.classList.add("hidden");
}

function chooseHoleType(value) {
  const holesSelect = document.getElementById("singleHoles");
  if (!holesSelect) return;
  holesSelect.value = value;
  closeHoleTypeModal();
  toggleSingleHoleOptions();
}

// Update the event listeners to include corner change handling
document.addEventListener("DOMContentLoaded", function () {
  // Existing corner option listeners
  document.querySelectorAll('input[name="singleCorners"]').forEach((radio) => {
    radio.addEventListener("change", function () {
      document.querySelectorAll(".corner-option").forEach((option) => {
        option.classList.remove("border-blue-500", "bg-blue-50");
      });

      if (this.checked) {
        this.closest("label")
          .querySelector(".corner-option")
          .classList.add("border-blue-500", "bg-blue-50");

        // Call toggleSingleHoleOptions when corner selection changes
        toggleSingleHoleOptions();
      }
      updateSingleExtrasSummary();
    });
  });

  // Existing hole option listener
  const singleHolesEl = document.getElementById("singleHoles");
  if (singleHolesEl) {
    singleHolesEl.addEventListener("change", toggleSingleHoleOptions);
    if (singleHolesEl.value === "mounting-holes") {
      toggleSingleHoleOptions();
    }
  }

  const radiusSizeEl = document.getElementById("singleRadiusSize");
  if (radiusSizeEl) {
    radiusSizeEl.addEventListener("change", updateSingleExtrasSummary);
  }
  const clippedSizeEl = document.getElementById("singleClippedSize");
  if (clippedSizeEl) {
    clippedSizeEl.addEventListener("change", updateSingleExtrasSummary);
  }
  document.querySelectorAll('input[name="extrasCutouts"]').forEach((radio) => {
    radio.addEventListener("change", updateSingleExtrasSummary);
  });
  document
    .querySelectorAll(
      "#extrasCutoutsOptions input[type=radio], #cutoutCounts input[type=number]",
    )
    .forEach((input) => {
      input.addEventListener("input", updateSingleExtrasSummary);
      input.addEventListener("change", updateSingleExtrasSummary);
    });

  document
    .querySelectorAll('input[name="singleTuckboxExtras"]')
    .forEach((checkbox) => {
      checkbox.addEventListener("change", updateSingleExtrasSummary);
    });

  updateSingleExtrasSummary();
});

// ...existing code...

// Pattern selection is now handled via the Pattern Glass Modal (openPatternModal, selectPatternOption functions)

// Hole modal functions
function openHoleModal(modalId) {
  document.getElementById(modalId).classList.remove("hidden");
}

function closeHoleModal(modalId) {
  document.getElementById(modalId).classList.add("hidden");
  // Reset form fields
  resetHoleModal(modalId);
}

function resetHoleModal(modalId) {
  if (modalId === "mountingHolesModal") {
    document
      .querySelectorAll(".location-btn")
      .forEach((btn) => btn.classList.remove("border-blue-500", "bg-blue-50"));
    document.getElementById("mountingHoleSize").value = "";
  } else if (modalId === "centreHoleModal") {
    document.getElementById("centreHoleSize").value = "";
  } else if (modalId === "petFlapModal") {
    document.getElementById("petFlapWidth").value = "";
    document.getElementById("petFlapHeight").value = "";
    document.getElementById("petFlapDiameter").value = "";
    document.getElementById("petFlapDiameterError").classList.add("hidden");
  } else if (modalId === "customHoleModal") {
    document.getElementById("customHoleWidth").value = "";
    document.getElementById("customHoleHeight").value = "";
    document.getElementById("customHoleDiameter").value = "";
    document.getElementById("customHoleDiameterError").classList.add("hidden");
  }
}

function updateHoleSummaryCard(summary, details) {
  const card = document.getElementById("singleHolesSummary");
  const title = document.getElementById("singleHolesSummaryTitle");
  const detailsEl = document.getElementById("singleHolesSummaryDetails");

  if (!card || !title || !detailsEl) return;

  title.textContent = summary || "Not selected";
  detailsEl.innerHTML = "";

  if (Array.isArray(details)) {
    details.forEach((detail) => {
      const p = document.createElement("p");
      p.textContent = detail;
      detailsEl.appendChild(p);
    });
  }

  card.classList.remove("hidden");
}

let singleHoleSelection = {
  title: "",
  details: [],
};

function updateSingleExtrasSummary() {
  const titleEl = document.getElementById("singleExtrasSummaryTitle");
  const detailsEl = document.getElementById("singleExtrasSummaryDetails");
  if (!titleEl || !detailsEl) return;

  const details = [];

  const cornerEl = document.querySelector('input[name="singleCorners"]:checked');
  if (cornerEl && cornerEl.value) {
    let cornerText = cornerEl.value;
    if (cornerEl.value === "radius") {
      const size = document.getElementById("singleRadiusSize")?.value;
      if (size) cornerText += ` (${size})`;
    }
    if (cornerEl.value === "clipped") {
      const size = document.getElementById("singleClippedSize")?.value;
      if (size) cornerText += ` (${size})`;
    }
    details.push(`Corners: ${cornerText}`);
  }

  const cutoutsYes = document.querySelector('input[name="extrasCutouts"][value="yes"]')?.checked;
  if (cutoutsYes) {
    const cutoutMap = [
      { id: "extrasBoxcut", label: "Boxcut", countId: "inputBoxcut" },
      { id: "extrasCornerNotch", label: "Corner Notch", countId: "inputCornerNotch" },
      { id: "extrasEdgeNotch", label: "Edge Notch", countId: "inputEdgeNotch" },
      { id: "extrasHinge", label: "Hinge", countId: "inputHinge" },
    ];
    const cutoutSelections = [];
    cutoutMap.forEach((cutout) => {
      const checked = document.getElementById(cutout.id)?.checked;
      if (checked) {
        const count = document.getElementById(cutout.countId)?.value;
        const countText = count ? ` x${count}` : "";
        cutoutSelections.push(`${cutout.label}${countText}`);
      }
    });
    if (cutoutSelections.length) {
      details.push(`Cut-Outs: ${cutoutSelections.join(", ")}`);
    }
  }

  if (singleHoleSelection.title) {
    details.push(`Holes: ${singleHoleSelection.title}`);
    singleHoleSelection.details.forEach((detail) => {
      details.push(`- ${detail}`);
    });
  }

  const tuckboxExtras = Array.from(
    document.querySelectorAll('input[name="singleTuckboxExtras"]:checked'),
  ).map((input) => input.value);
  if (tuckboxExtras.length) {
    details.push(`Tuckbox Extras: ${tuckboxExtras.join(", ")}`);
  }

  if (details.length === 0) {
    titleEl.textContent = "None selected";
    detailsEl.innerHTML = "";
    return;
  }

  titleEl.textContent = "Selected extras";
  detailsEl.innerHTML = "";
  details.forEach((detail) => {
    const li = document.createElement("li");
    li.textContent = detail;
    detailsEl.appendChild(li);
  });
}

function getSelectedOptionText(selectId) {
  const select = document.getElementById(selectId);
  if (!select) return "None";
  const option = select.options[select.selectedIndex];
  if (!option) return "None";
  return option.textContent.trim();
}

function updateDoubleExtrasSummary() {
  const card = document.getElementById("doubleExtrasSummary");
  const title = document.getElementById("doubleExtrasSummaryTitle");
  const detailsEl = document.getElementById("doubleExtrasSummaryDetails");
  if (!card || !title || !detailsEl) return;

  const extrasValue = document.getElementById("doubleExtras")?.value || "none";
  const extrasText = getSelectedOptionText("doubleExtras");
  const petFlap = document.getElementById("doublePetFlap")?.checked;
  const details = [];

  if (extrasValue && extrasValue !== "none") {
    details.push(`Feature: ${extrasText}`);
  }
  if (petFlap) {
    details.push("Pet Flap/Vent Hole");
  }

  if (details.length === 0) {
    title.textContent = "None selected";
    detailsEl.innerHTML = "";
    card.classList.remove("hidden");
    return;
  }

  title.textContent = "Selected extras";
  detailsEl.innerHTML = "";
  details.forEach((detail) => {
    const li = document.createElement("li");
    li.textContent = detail;
    detailsEl.appendChild(li);
  });
  card.classList.remove("hidden");
}

function updateTripleExtrasSummary() {
  const card = document.getElementById("tripleExtrasSummary");
  const title = document.getElementById("tripleExtrasSummaryTitle");
  const detailsEl = document.getElementById("tripleExtrasSummaryDetails");
  if (!card || !title || !detailsEl) return;

  const extrasValue = document.getElementById("tripleExtras")?.value || "none";
  const extrasText = getSelectedOptionText("tripleExtras");
  const petFlap = document.getElementById("triplePetFlap")?.checked;
  const details = [];

  if (extrasValue && extrasValue !== "none") {
    details.push(`Feature: ${extrasText}`);
  }
  if (petFlap) {
    details.push("Pet Flap/Vent Hole");
  }

  if (details.length === 0) {
    title.textContent = "None selected";
    detailsEl.innerHTML = "";
    card.classList.remove("hidden");
    return;
  }

  title.textContent = "Selected extras";
  detailsEl.innerHTML = "";
  details.forEach((detail) => {
    const li = document.createElement("li");
    li.textContent = detail;
    detailsEl.appendChild(li);
  });
  card.classList.remove("hidden");
}

// Diameter validation function - shows error if limit exceeded
function validateDiameter(inputId, maxValue) {
  const input = document.getElementById(inputId);
  const errorElementId = inputId.replace("Diameter", "DiameterError");
  const errorElement = document.getElementById(errorElementId);
  const value = parseFloat(input.value);

  if (value > maxValue) {
    errorElement.textContent = `Diameter cannot exceed ${maxValue}mm`;
    errorElement.classList.remove("hidden");
    // Auto-reset the input to max value
    input.value = maxValue;
  } else {
    errorElement.classList.add("hidden");
  }
}

function selectMountingLocation(location) {
  // Remove previous selection
  document.querySelectorAll(".location-btn").forEach((btn) => {
    btn.classList.remove("border-blue-500", "bg-blue-50");
  });
  // Add selection to clicked button
  event.target
    .closest(".location-btn")
    .classList.add("border-blue-500", "bg-blue-50");
}

function saveMountingHoles() {
  const location = document.querySelector(".location-btn.border-blue-500");
  const size = document.getElementById("mountingHoleSize").value;

  if (!location || !size) {
    alert("Please select both location and size");
    return;
  }

  const locationText = location.textContent.trim();
  // Here you can add logic to save the mounting holes data
  console.log("Mounting Holes saved:", { location: locationText, size: size });

  closeHoleModal("mountingHolesModal");
  updateHoleSummaryCard("Mounting Holes", [
    `Location: ${locationText}`,
    `Size: ${size}`,
  ]);
  singleHoleSelection = {
    title: "Mounting Holes",
    details: [`Location: ${locationText}`, `Size: ${size}`],
  };
  updateSingleExtrasSummary();
}

function saveCentreHole() {
  const size = document.getElementById("centreHoleSize").value;

  if (!size) {
    alert("Please select a hole size");
    return;
  }

  // Here you can add logic to save the centre hole data
  console.log("Centre Hole saved:", { size: size });

  closeHoleModal("centreHoleModal");
  updateHoleSummaryCard("Centre Hole", [`Size: ${size}`]);
  singleHoleSelection = {
    title: "Centre Hole",
    details: [`Size: ${size}`],
  };
  updateSingleExtrasSummary();
}

function savePetFlap() {
  const width = document.getElementById("petFlapWidth").value;
  const height = document.getElementById("petFlapHeight").value;
  const diameter = document.getElementById("petFlapDiameter").value;
  const maxDiameter = 150;

  if (!width || !height || !diameter) {
    alert("Please fill in all fields");
    return;
  }

  if (parseFloat(diameter) > maxDiameter) {
    alert(`Diameter cannot exceed ${maxDiameter}mm`);
    return;
  }

  // Here you can add logic to save the pet flap data
  console.log("Pet Flap saved:", {
    width: width,
    height: height,
    diameter: diameter,
  });

  closeHoleModal("petFlapModal");
  updateHoleSummaryCard("Pet Flap", [
    `Width: ${width}`,
    `Height: ${height}`,
    `Diameter: ${diameter}`,
  ]);
  singleHoleSelection = {
    title: "Pet Flap",
    details: [`Width: ${width}`, `Height: ${height}`, `Diameter: ${diameter}`],
  };
  updateSingleExtrasSummary();
}

function saveCustomHole() {
  const width = document.getElementById("customHoleWidth").value;
  const height = document.getElementById("customHoleHeight").value;
  const diameter = document.getElementById("customHoleDiameter").value;
  const maxDiameter = 150;

  if (!width || !height || !diameter) {
    alert("Please fill in all fields");
    return;
  }

  if (parseFloat(diameter) > maxDiameter) {
    alert(`Diameter cannot exceed ${maxDiameter}mm`);
    return;
  }

  // Here you can add logic to save the custom hole data
  console.log("Custom Hole saved:", {
    width: width,
    height: height,
    diameter: diameter,
  });

  closeHoleModal("customHoleModal");
  updateHoleSummaryCard("Custom Hole", [
    `Width: ${width}`,
    `Height: ${height}`,
    `Diameter: ${diameter}`,
  ]);
  singleHoleSelection = {
    title: "Custom Hole",
    details: [`Width: ${width}`, `Height: ${height}`, `Diameter: ${diameter}`],
  };
  updateSingleExtrasSummary();
}
