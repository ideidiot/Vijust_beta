(function () {
  if (document.getElementById("cs-extension-popup")) return;

  // HTMLの注入
  const popupHTML = `
      <div id="cs-extension-popup">
        <div class="cs-header" id="cs-popupHeader">
          <div class="cs-title">
            Vijust
          </div>
          <button id="cs-closePopupBtn" class="cs-close-btn">
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/></svg>
          </button>
        </div>
  
        <!-- S1: 選択画面 -->
        <div id="cs-screenSelect" class="cs-body">
          <p style="margin: 0 0 12px 0; font-size: 13px; color: #64748b;">見づらい文章をクリックして選択し、色や縁取りを調整します。</p>
          <button id="cs-startSelectionBtn" class="cs-btn-primary">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M14 1a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h12zM2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2H2z"/><path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/></svg>
            文章を選択する
          </button>
          <div id="cs-selectionStatus" class="cs-status-text cs-hidden">画面内の文字をクリックしてください...</div>
        </div>
  
        <!-- S2: 編集画面 -->
        <div id="cs-screenEdit" class="cs-hidden">
          <div class="cs-body">
            <div class="cs-row">
              <span class="cs-label">文字の縁取り</span>
              <label class="cs-switch">
                <input type="checkbox" id="cs-outlineToggle">
                <span class="cs-slider"></span>
              </label>
            </div>
  
            <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 12px 0;">
  
            <div class="cs-row" style="margin-bottom: 4px;">
              <span class="cs-label">文字色を変更</span>
              <span id="cs-hexDisplay" class="cs-hex-code">#000000</span>
            </div>
  
            <div class="cs-picker-group">
              <div id="cs-previewBox" class="cs-preview-box" title="クリックして色を変更">A</div>
              <div class="cs-color-input-wrapper">
                <input type="color" id="cs-nativeColorPicker" value="#000000">
              </div>
            </div>
          </div>
  
          <div class="cs-footer">
            <button id="cs-backToSelectBtn" class="cs-btn-secondary">選択解除</button>
          </div>
        </div>
      </div>
    `;

  document.body.insertAdjacentHTML("beforeend", popupHTML);

  // UI要素
  const popup = document.getElementById("cs-extension-popup");
  const btnClosePopup = document.getElementById("cs-closePopupBtn");
  const popupHeader = document.getElementById("cs-popupHeader");

  const screenSelect = document.getElementById("cs-screenSelect");
  const screenEdit = document.getElementById("cs-screenEdit");
  const btnStartSelection = document.getElementById("cs-startSelectionBtn");
  const selectionStatus = document.getElementById("cs-selectionStatus");
  const btnBackToSelect = document.getElementById("cs-backToSelectBtn");

  const outlineToggle = document.getElementById("cs-outlineToggle");
  const nativeColorPicker = document.getElementById("cs-nativeColorPicker");
  const hexDisplay = document.getElementById("cs-hexDisplay");
  const previewBox = document.getElementById("cs-previewBox");

  let isSelectMode = false;
  let currentTarget = null;

  // 拡張機能アイコンのクリック受信
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "toggle_popup") {
      if (popup.style.display === "block") {
        closePopup();
      } else {
        openPopup();
      }
    }
  });

  function openPopup() {
    popup.style.display = "block";
    showSelectScreen();
  }

  function closePopup() {
    popup.style.display = "none";
    disableSelectMode();
    clearTarget();
  }

  btnClosePopup.addEventListener("click", closePopup);

  // ドラッグ移動処理
  let isDragging = false;
  let offsetX, offsetY;

  popupHeader.addEventListener("mousedown", (e) => {
    isDragging = true;
    offsetX = e.clientX - popup.getBoundingClientRect().left;
    offsetY = e.clientY - popup.getBoundingClientRect().top;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    popup.style.left = `${e.clientX - offsetX}px`;
    popup.style.top = `${e.clientY - offsetY}px`;
    popup.style.right = "auto";
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  // 画面遷移
  function showSelectScreen() {
    screenSelect.classList.remove("cs-hidden");
    screenEdit.classList.add("cs-hidden");
  }

  function showEditScreen() {
    screenSelect.classList.add("cs-hidden");
    screenEdit.classList.remove("cs-hidden");
  }

  // 要素選択モード
  btnStartSelection.addEventListener("click", enableSelectMode);
  btnBackToSelect.addEventListener("click", () => {
    clearTarget();
    showSelectScreen();
  });

  function enableSelectMode() {
    isSelectMode = true;
    document.body.classList.add("cs-select-mode");
    btnStartSelection.classList.add("cs-hidden");
    selectionStatus.classList.remove("cs-hidden");
    document.addEventListener("click", handleElementSelection, true);
  }

  function disableSelectMode() {
    isSelectMode = false;
    document.body.classList.remove("cs-select-mode");
    btnStartSelection.classList.remove("cs-hidden");
    selectionStatus.classList.add("cs-hidden");
    document.removeEventListener("click", handleElementSelection, true);
  }

  function handleElementSelection(e) {
    if (popup.contains(e.target)) return;

    e.preventDefault();
    e.stopPropagation();

    disableSelectMode();
    setTarget(e.target);
    showEditScreen();
  }

  // デザイン系の処理
  function setTarget(element) {
    clearTarget();
    currentTarget = element;
    currentTarget.classList.add("cs-selected-element-highlight");

    const computedStyle = window.getComputedStyle(currentTarget);
    const hasOutline = currentTarget.style.textShadow.includes("black") || currentTarget.style.textShadow.includes("rgb(0, 0, 0)");
    outlineToggle.checked = hasOutline;

    const rgbColor = computedStyle.color;
    const hexColor = rgbToHex(rgbColor);
    nativeColorPicker.value = hexColor;
    hexDisplay.textContent = hexColor.toUpperCase();

    const bgColor = getActualBackgroundColor(currentTarget);
    previewBox.style.backgroundColor = bgColor;
    previewBox.style.color = hexColor;
    previewBox.style.textShadow = hasOutline ? "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000" : "none";
  }

  function clearTarget() {
    if (currentTarget) {
      currentTarget.classList.remove("cs-selected-element-highlight");
      currentTarget = null;
    }
  }

  outlineToggle.addEventListener("change", (e) => {
    if (!currentTarget) return;
    const outlineStyle = "-1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
    if (e.target.checked) {
      currentTarget.style.textShadow = outlineStyle;
      previewBox.style.textShadow = outlineStyle;
    } else {
      currentTarget.style.textShadow = "none";
      previewBox.style.textShadow = "none";
    }
  });

  previewBox.addEventListener("click", () => {
    nativeColorPicker.click();
  });

  nativeColorPicker.addEventListener("input", (e) => {
    const newColor = e.target.value;
    hexDisplay.textContent = newColor.toUpperCase();

    if (currentTarget) {
      currentTarget.style.color = newColor;
      previewBox.style.color = newColor;
    }
  });

  function getActualBackgroundColor(elem) {
    let currentElem = elem;
    while (currentElem && currentElem !== document) {
      const bg = window.getComputedStyle(currentElem).backgroundColor;
      if (bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent") {
        return bg;
      }
      currentElem = currentElem.parentElement;
    }
    return "#ffffff";
  }

  function rgbToHex(rgbStr) {
    const rgb = rgbStr.match(/^rgba?[\s+]?\([\s+]?(\d+)[\s+]?,[\s+]?(\d+)[\s+]?,[\s+]?(\d+)/i);
    return rgb && rgb.length === 4 ? "#" + ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) + ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2) : "#000000";
  }
})();
