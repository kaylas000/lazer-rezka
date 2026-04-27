/* Project calculator: tabs + project items + tube formulas + summary actions */
(function () {
  const STORAGE_KEY = "project_calc_v1";
  const CONTACTS_STORAGE_KEY = "calc_message";
  const data = window.__METAL_CALC__ || {};
  const densities = data.densities_kg_m3 || { steel: 7850, stainless: 8000, aluminum: 2700 };
  const presets = data.presets || {};

  const materialLabels = {
    steel: "Сталь",
    stainless: "Нержавейка",
    aluminum: "Алюминий",
  };

  const typeLabels = {
    sheet: "Лист",
    round: "Труба круглая",
    profile: "Труба профильная",
    sheet_cut: "Лист (резка)",
  };

  const state = loadState();

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.items)) return parsed;
      }
    } catch (e) {
      // ignore parse errors and reset state
    }
    return { pricePerKg: "", items: [] };
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function toNum(value) {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }

  function round1(num) {
    return Math.round(num * 10) / 10;
  }

  function round2(num) {
    return Math.round(num * 100) / 100;
  }

  function m3FromMm3(mm3) {
    return mm3 / 1000000000;
  }

  function calcRound(item) {
    const odMm = toNum(item.odMm);
    const tMm = toNum(item.tMm);
    const lengthM = toNum(item.lengthM);
    const qty = Math.max(1, toNum(item.quantity));
    const density = densities[item.material] || densities.steel;
    const innerMm = Math.max(0, odMm - 2 * tMm);
    const areaMm2 = (Math.PI / 4) * (odMm * odMm - innerMm * innerMm);
    const volumeM3 = m3FromMm3(areaMm2) * lengthM;
    const weightKg = volumeM3 * density * qty;
    const surfaceM2 = Math.PI * (odMm / 1000) * lengthM * qty;
    return { weightKg: round1(weightKg), surfaceM2: round2(surfaceM2) };
  }

  function calcProfile(item) {
    const aMm = toNum(item.aMm);
    const bMm = toNum(item.bMm);
    const tMm = toNum(item.tMm);
    const lengthM = toNum(item.lengthM);
    const qty = Math.max(1, toNum(item.quantity));
    const density = densities[item.material] || densities.steel;
    const inA = Math.max(0, aMm - 2 * tMm);
    const inB = Math.max(0, bMm - 2 * tMm);
    const areaMm2 = aMm * bMm - inA * inB;
    const volumeM3 = m3FromMm3(areaMm2) * lengthM;
    const weightKg = volumeM3 * density * qty;
    const surfaceM2 = (2 * ((aMm / 1000) + (bMm / 1000)) * lengthM) * qty;
    return { weightKg: round1(weightKg), surfaceM2: round2(surfaceM2) };
  }

  function calcSheet(item) {
    const lMm = toNum(item.lengthMm);
    const wMm = toNum(item.widthMm);
    const tMm = toNum(item.tMm);
    const qty = Math.max(1, toNum(item.quantity));
    const density = densities[item.material] || densities.steel;
    const volumeM3 = (lMm / 1000) * (wMm / 1000) * (tMm / 1000);
    const weightKg = volumeM3 * density * qty;
    const surfaceM2 = ((lMm / 1000) * (wMm / 1000)) * qty;
    return { weightKg: round1(weightKg), surfaceM2: round2(surfaceM2) };
  }

  function computeItem(item) {
    if (item.type === "round") return calcRound(item);
    if (item.type === "profile") return calcProfile(item);
    if (item.type === "sheet") return calcSheet(item);
    return { weightKg: 0, surfaceM2: 0 };
  }

  function totals() {
    return state.items.reduce(
      (acc, item) => {
        if (item.type === "sheet_cut") {
          acc.sheetCutTotal += toNum(item.cutCost || 0);
          return acc;
        }
        const c = computeItem(item);
        acc.weightKg += c.weightKg;
        acc.surfaceM2 += c.surfaceM2;
        return acc;
      },
      { weightKg: 0, surfaceM2: 0, sheetCutTotal: 0 }
    );
  }

  function parseCutResultFromDom() {
    const result = document.getElementById("result");
    if (!result || !result.querySelector(".result-content")) return null;
    const totalStrong = result.querySelector(".result-total strong");
    if (!totalStrong) return null;
    const totalText = totalStrong.textContent || "";
    const cost = Number(totalText.replace(/[^\d]/g, "")) || 0;
    if (!cost) return null;
    const materialEl = document.getElementById("material");
    const thicknessEl = document.getElementById("thickness");
    const lengthEl = document.getElementById("length");
    const qtyEl = document.getElementById("quantity");
    const materialValue = materialEl ? materialEl.value : "steel";
    const materialText = materialEl ? materialEl.options[materialEl.selectedIndex].text : "Сталь";
    const thickness = thicknessEl ? Number(thicknessEl.value) : 0;
    const length = lengthEl ? Number(lengthEl.value) : 0;
    const quantity = qtyEl ? Number(qtyEl.value) : 1;
    const description = `${materialText}, ${thickness} мм, длина ${length} м, ${quantity} шт`;
    return { material: materialValue, thickness, length, quantity, cutCost: cost, description };
  }

  function initTabs() {
    const buttons = Array.from(document.querySelectorAll("[data-tab-target]"));
    const panes = Array.from(document.querySelectorAll(".calc-tab-pane"));
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-tab-target");
        buttons.forEach((b) => b.classList.remove("is-active"));
        panes.forEach((p) => p.classList.remove("is-active"));
        btn.classList.add("is-active");
        const pane = document.getElementById(target);
        if (pane) pane.classList.add("is-active");
      });
    });
  }

  function renderProjectItems() {
    const wrap = document.getElementById("projectItems");
    if (!wrap) return;
    if (!state.items.length) {
      wrap.innerHTML = '<div class="result-placeholder"><p>Добавьте первую позицию проекта.</p></div>';
      return;
    }
    wrap.innerHTML = state.items
      .map((item, idx) => {
        const c = computeItem(item);
        const base = `
          <div class="project-item-grid">
            <div class="form-group">
              <label>Тип</label>
              <select data-field="type" data-index="${idx}" class="calc-input">
                <option value="sheet" ${item.type === "sheet" ? "selected" : ""}>Лист</option>
                <option value="round" ${item.type === "round" ? "selected" : ""}>Труба круглая</option>
                <option value="profile" ${item.type === "profile" ? "selected" : ""}>Труба профильная</option>
                <option value="sheet_cut" ${item.type === "sheet_cut" ? "selected" : ""}>Лист (резка)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Материал</label>
              <select data-field="material" data-index="${idx}" class="calc-input">
                <option value="steel" ${item.material === "steel" ? "selected" : ""}>Сталь</option>
                <option value="stainless" ${item.material === "stainless" ? "selected" : ""}>Нержавейка</option>
                <option value="aluminum" ${item.material === "aluminum" ? "selected" : ""}>Алюминий</option>
              </select>
            </div>
            <div class="form-group">
              <label>Количество</label>
              <input class="calc-input" data-field="quantity" data-index="${idx}" type="number" min="1" value="${item.quantity || 1}">
            </div>
          </div>`;
        let dims = "";
        if (item.type === "sheet") {
          dims = `
            <div class="project-item-grid">
              <div class="form-group"><label>Длина, мм</label><input class="calc-input" data-field="lengthMm" data-index="${idx}" type="number" min="1" value="${item.lengthMm || 1000}"></div>
              <div class="form-group"><label>Ширина, мм</label><input class="calc-input" data-field="widthMm" data-index="${idx}" type="number" min="1" value="${item.widthMm || 1000}"></div>
              <div class="form-group"><label>Толщина, мм</label><input class="calc-input" data-field="tMm" data-index="${idx}" type="number" min="0.1" step="0.1" value="${item.tMm || 3}"></div>
            </div>`;
        } else if (item.type === "round") {
          dims = `
            <div class="project-item-grid">
              <div class="form-group"><label>Диаметр, мм</label><input class="calc-input" data-field="odMm" data-index="${idx}" type="number" min="1" step="0.1" value="${item.odMm || 20}"></div>
              <div class="form-group"><label>Стенка, мм</label><input class="calc-input" data-field="tMm" data-index="${idx}" type="number" min="0.1" step="0.1" value="${item.tMm || 2}"></div>
              <div class="form-group"><label>Длина, м</label><input class="calc-input" data-field="lengthM" data-index="${idx}" type="number" min="0.01" step="0.01" value="${item.lengthM || 1}"></div>
            </div>`;
        } else if (item.type === "profile") {
          dims = `
            <div class="project-item-grid">
              <div class="form-group"><label>A, мм</label><input class="calc-input" data-field="aMm" data-index="${idx}" type="number" min="1" step="0.1" value="${item.aMm || 40}"></div>
              <div class="form-group"><label>B, мм</label><input class="calc-input" data-field="bMm" data-index="${idx}" type="number" min="1" step="0.1" value="${item.bMm || 20}"></div>
              <div class="form-group"><label>Стенка, мм</label><input class="calc-input" data-field="tMm" data-index="${idx}" type="number" min="0.1" step="0.1" value="${item.tMm || 2}"></div>
              <div class="form-group"><label>Длина, м</label><input class="calc-input" data-field="lengthM" data-index="${idx}" type="number" min="0.01" step="0.01" value="${item.lengthM || 1}"></div>
            </div>`;
        } else {
          dims = `
            <div class="result-row"><span>Описание:</span> <strong>${item.description || "Расчёт резки"}</strong></div>
            <div class="result-row"><span>Стоимость резки:</span> <strong>${Number(item.cutCost || 0).toLocaleString("ru-RU")} ₽</strong></div>`;
        }
        return `
          <div class="project-item-card" data-index="${idx}">
            ${base}
            ${dims}
            <div class="result-row">
              <span>Вес / площадь:</span>
              <strong>${c.weightKg.toFixed(1)} кг / ${c.surfaceM2.toFixed(2)} м²</strong>
            </div>
            <button class="btn btn-secondary project-delete-btn" data-remove="${idx}">Удалить</button>
          </div>`;
      })
      .join("");
  }

  function renderMetrics() {
    const totalsData = totals();
    const wrap = document.getElementById("projectMetrics");
    if (!wrap) return;
    const price = toNum(state.pricePerKg);
    const materialCost = price > 0 ? round1(totalsData.weightKg * price) : 0;
    wrap.innerHTML = `
      <div class="result-row"><span>Общий вес проекта:</span><strong>${totalsData.weightKg.toFixed(1)} кг</strong></div>
      <div class="result-row"><span>Общая наружная площадь:</span><strong>${totalsData.surfaceM2.toFixed(2)} м²</strong></div>
      <div class="result-row"><span>Сумма по расчётам резки:</span><strong>${totalsData.sheetCutTotal.toLocaleString("ru-RU")} ₽</strong></div>
      <div class="result-row"><span>Ориентир стоимости материала:</span><strong>${materialCost ? materialCost.toLocaleString("ru-RU") + " ₽" : "—"}</strong></div>`;
  }

  function summaryText() {
    const t = totals();
    const lines = state.items.map((item, idx) => {
      if (item.type === "sheet_cut") return `${idx + 1}. ${typeLabels[item.type]}: ${item.description} = ${Number(item.cutCost || 0).toLocaleString("ru-RU")} ₽`;
      const c = computeItem(item);
      const dims =
        item.type === "sheet"
          ? `${item.lengthMm}x${item.widthMm}x${item.tMm} мм`
          : item.type === "round"
            ? `D${item.odMm}x${item.tMm} мм, L=${item.lengthM} м`
            : `${item.aMm}x${item.bMm}x${item.tMm} мм, L=${item.lengthM} м`;
      return `${idx + 1}. ${typeLabels[item.type]} (${materialLabels[item.material] || item.material}): ${dims}, ${item.quantity} шт, ${c.weightKg.toFixed(1)} кг, ${c.surfaceM2.toFixed(2)} м²`;
    });
    const summary = [
      "Расчёт проекта",
      ...lines,
      `ИТОГО вес: ${t.weightKg.toFixed(1)} кг`,
      `ИТОГО площадь: ${t.surfaceM2.toFixed(2)} м²`,
      `Сумма по расчётам резки: ${t.sheetCutTotal.toLocaleString("ru-RU")} ₽`,
    ];
    if (toNum(state.pricePerKg) > 0) {
      summary.push(`Ориентир стоимости материала: ${(t.weightKg * toNum(state.pricePerKg)).toLocaleString("ru-RU")} ₽`);
    }
    return summary.join("\n");
  }

  function renderSummary() {
    const wrap = document.getElementById("projectSummary");
    if (!wrap) return;
    if (!state.items.length) {
      wrap.innerHTML = '<div class="result-placeholder"><p>Пока нет позиций проекта.</p></div>';
      return;
    }
    wrap.innerHTML = `<pre class="project-summary-pre">${summaryText()}</pre>`;
  }

  function rerender() {
    saveState();
    renderProjectItems();
    renderMetrics();
    renderSummary();
    updateTubePreviews();
  }

  function updateTypeDefaults(item) {
    if (item.type === "sheet") Object.assign(item, { lengthMm: item.lengthMm || 1000, widthMm: item.widthMm || 1000, tMm: item.tMm || 3 });
    if (item.type === "round") Object.assign(item, { odMm: item.odMm || 20, tMm: item.tMm || 2, lengthM: item.lengthM || 1 });
    if (item.type === "profile") Object.assign(item, { aMm: item.aMm || 40, bMm: item.bMm || 20, tMm: item.tMm || 2, lengthM: item.lengthM || 1 });
  }

  function bindProjectEvents() {
    const addBtn = document.getElementById("addProjectItemBtn");
    const priceInput = document.getElementById("projectPricePerKg");
    const itemsWrap = document.getElementById("projectItems");
    if (priceInput) {
      priceInput.value = state.pricePerKg || "";
      priceInput.addEventListener("input", () => {
        state.pricePerKg = priceInput.value;
        rerender();
      });
    }
    if (addBtn) {
      addBtn.addEventListener("click", () => {
        state.items.push({ type: "sheet", material: "steel", quantity: 1, lengthMm: 1000, widthMm: 1000, tMm: 3 });
        rerender();
      });
    }
    if (itemsWrap) {
      itemsWrap.addEventListener("click", (e) => {
        const removeIdx = e.target.getAttribute("data-remove");
        if (removeIdx !== null) {
          state.items.splice(Number(removeIdx), 1);
          rerender();
        }
      });
      itemsWrap.addEventListener("input", (e) => {
        const idx = Number(e.target.getAttribute("data-index"));
        const field = e.target.getAttribute("data-field");
        if (!Number.isFinite(idx) || !field || !state.items[idx]) return;
        state.items[idx][field] = e.target.value;
        if (field === "type") updateTypeDefaults(state.items[idx]);
        rerender();
      });
      itemsWrap.addEventListener("change", (e) => {
        const idx = Number(e.target.getAttribute("data-index"));
        const field = e.target.getAttribute("data-field");
        if (!Number.isFinite(idx) || !field || !state.items[idx]) return;
        state.items[idx][field] = e.target.value;
        if (field === "type") updateTypeDefaults(state.items[idx]);
        rerender();
      });
    }
  }

  function fillPresets() {
    const roundPreset = document.getElementById("roundPreset");
    const profilePreset = document.getElementById("profilePreset");
    if (roundPreset) {
      roundPreset.innerHTML = `<option value="">Выберите preset</option>${(presets.round || [])
        .map((p, i) => `<option value="${i}">${p.label}</option>`)
        .join("")}`;
      roundPreset.addEventListener("change", () => {
        const p = (presets.round || [])[Number(roundPreset.value)];
        if (!p) return;
        document.getElementById("roundOd").value = p.od_mm;
        document.getElementById("roundWall").value = p.t_mm;
        updateTubePreviews();
      });
    }
    if (profilePreset) {
      profilePreset.innerHTML = `<option value="">Выберите preset</option>${(presets.profile || [])
        .map((p, i) => `<option value="${i}">${p.label}</option>`)
        .join("")}`;
      profilePreset.addEventListener("change", () => {
        const p = (presets.profile || [])[Number(profilePreset.value)];
        if (!p) return;
        document.getElementById("profileA").value = p.a_mm;
        document.getElementById("profileB").value = p.b_mm;
        document.getElementById("profileWall").value = p.t_mm;
        updateTubePreviews();
      });
    }
  }

  function bindTubeQuickAdd() {
    const addRoundBtn = document.getElementById("addRoundToProjectBtn");
    const addProfileBtn = document.getElementById("addProfileToProjectBtn");
    if (addRoundBtn) {
      addRoundBtn.addEventListener("click", () => {
        state.items.push({
          type: "round",
          material: document.getElementById("roundMaterial").value,
          quantity: Number(document.getElementById("roundQuantity").value) || 1,
          odMm: Number(document.getElementById("roundOd").value) || 0,
          tMm: Number(document.getElementById("roundWall").value) || 0,
          lengthM: Number(document.getElementById("roundLength").value) || 0,
        });
        rerender();
      });
    }
    if (addProfileBtn) {
      addProfileBtn.addEventListener("click", () => {
        state.items.push({
          type: "profile",
          material: document.getElementById("profileMaterial").value,
          quantity: Number(document.getElementById("profileQuantity").value) || 1,
          aMm: Number(document.getElementById("profileA").value) || 0,
          bMm: Number(document.getElementById("profileB").value) || 0,
          tMm: Number(document.getElementById("profileWall").value) || 0,
          lengthM: Number(document.getElementById("profileLength").value) || 0,
        });
        rerender();
      });
    }
    ["roundMaterial", "roundQuantity", "roundOd", "roundWall", "roundLength", "profileMaterial", "profileQuantity", "profileA", "profileB", "profileWall", "profileLength"]
      .forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", updateTubePreviews);
        if (el) el.addEventListener("change", updateTubePreviews);
      });
  }

  function updateTubePreviews() {
    const roundPreview = document.getElementById("roundPreview");
    const profilePreview = document.getElementById("profilePreview");
    if (roundPreview) {
      const temp = {
        type: "round",
        material: document.getElementById("roundMaterial")?.value || "steel",
        quantity: Number(document.getElementById("roundQuantity")?.value) || 1,
        odMm: Number(document.getElementById("roundOd")?.value) || 0,
        tMm: Number(document.getElementById("roundWall")?.value) || 0,
        lengthM: Number(document.getElementById("roundLength")?.value) || 0,
      };
      const c = calcRound(temp);
      roundPreview.innerHTML = `<div class="result-content"><div class="result-row"><span>Вес:</span><strong>${c.weightKg.toFixed(1)} кг</strong></div><div class="result-row"><span>Площадь:</span><strong>${c.surfaceM2.toFixed(2)} м²</strong></div></div>`;
    }
    if (profilePreview) {
      const temp = {
        type: "profile",
        material: document.getElementById("profileMaterial")?.value || "steel",
        quantity: Number(document.getElementById("profileQuantity")?.value) || 1,
        aMm: Number(document.getElementById("profileA")?.value) || 0,
        bMm: Number(document.getElementById("profileB")?.value) || 0,
        tMm: Number(document.getElementById("profileWall")?.value) || 0,
        lengthM: Number(document.getElementById("profileLength")?.value) || 0,
      };
      const c = calcProfile(temp);
      profilePreview.innerHTML = `<div class="result-content"><div class="result-row"><span>Вес:</span><strong>${c.weightKg.toFixed(1)} кг</strong></div><div class="result-row"><span>Площадь:</span><strong>${c.surfaceM2.toFixed(2)} м²</strong></div></div>`;
    }
  }

  function bindSheetCutAdd() {
    const btn = document.getElementById("addSheetCutToProjectBtn");
    if (!btn) return;
    btn.addEventListener("click", () => {
      const cut = parseCutResultFromDom();
      if (!cut) {
        window.alert("Сначала нажмите 'Рассчитать'.");
        return;
      }
      state.items.push({
        type: "sheet_cut",
        material: cut.material,
        quantity: cut.quantity,
        thickness: cut.thickness,
        length: cut.length,
        cutCost: cut.cutCost,
        description: cut.description,
      });
      rerender();
      const projectTab = document.querySelector('[data-tab-target="project-tab"]');
      if (projectTab) projectTab.click();
    });
  }

  async function copySummary() {
    const text = summaryText();
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
      window.alert("Расчёт скопирован.");
    } catch (e) {
      window.alert("Не удалось скопировать. Выделите и скопируйте текст вручную.");
    }
  }

  function sendSummaryToContacts() {
    const text = summaryText();
    if (!text.trim()) return;
    const encoded = encodeURIComponent(text);
    if (encoded.length < 1500) {
      window.location.href = `/contacts/?message=${encoded}`;
      return;
    }
    localStorage.setItem(CONTACTS_STORAGE_KEY, text);
    window.location.href = "/contacts/?from_calc=1";
  }

  function bindSummaryActions() {
    const copyBtn = document.getElementById("copyProjectCalcBtn");
    const sendBtn = document.getElementById("sendProjectCalcBtn");
    if (copyBtn) copyBtn.addEventListener("click", copySummary);
    if (sendBtn) sendBtn.addEventListener("click", sendSummaryToContacts);
  }

  function init() {
    initTabs();
    fillPresets();
    bindProjectEvents();
    bindTubeQuickAdd();
    bindSheetCutAdd();
    bindSummaryActions();
    rerender();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
