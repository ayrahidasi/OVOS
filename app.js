// Controle de Ovos — PWA simples
// Armazena em localStorage e calcula totais

const STORAGE_KEY = 'ovos_registros_v1';

// Utilidades de data
function todayStr() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function parseDate(str) {
  // str esperado yyyy-mm-dd
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDateBR(str) {
  const d = parseDate(str);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    // garantir formato mínimo {data:"yyyy-mm-dd", ovos:Number, obs:String}
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    console.error('Erro ao carregar entradas', e);
    return [];
  }
}

function saveEntries(entries) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function addEntry(entry) {
  const entries = loadEntries();
  entries.push(entry);
  // ordenar decrescente por data
  entries.sort((a, b) => parseDate(b.data) - parseDate(a.data));
  saveEntries(entries);
}

function deleteEntry(index) {
  const entries = loadEntries();
  entries.splice(index, 1);
  saveEntries(entries);
}

// Cálculos
function sumByDate(dateStr) {
  const entries = loadEntries();
  return entries.filter(e => e.data === dateStr).reduce((s, e) => s + (Number(e.ovos) || 0), 0);
}

function getWeekBounds(dateStr) {
  const d = parseDate(dateStr);
  // segunda-feira como início (ISO): weekday 1..7 (Mon..Sun)
  const day = (d.getDay() + 6) % 7; // 0=Mon ... 6=Sun
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  return { start: fmt(start), end: fmt(end) };
}

function sumBetween(startStr, endStr) {
  const s = parseDate(startStr);
  const e = parseDate(endStr);
  const entries = loadEntries();
  return entries.filter(x => {
    const d = parseDate(x.data);
    return d >= s && d <= e;
  }).reduce((acc, x) => acc + (Number(x.ovos) || 0), 0);
}

function sumByMonth(dateStr) {
  const d = parseDate(dateStr);
  const m = d.getMonth();
  const y = d.getFullYear();
  return loadEntries().filter(x => {
    const dx = parseDate(x.data);
    return dx.getMonth() === m && dx.getFullYear() === y;
  }).reduce((acc, x) => acc + (Number(x.ovos) || 0), 0);
}

function sumByYear(dateStr) {
  const y = parseDate(dateStr).getFullYear();
  return loadEntries().filter(x => parseDate(x.data).getFullYear() === y)
    .reduce((acc, x) => acc + (Number(x.ovos) || 0), 0);
}

// UI
const el = {
  tabRegistrar: document.getElementById('tabRegistrar'),
  tabResumo: document.getElementById('tabResumo'),
  tabDados: document.getElementById('tabDados'),
  registrar: document.getElementById('registrar'),
  resumo: document.getElementById('resumo'),
  dados: document.getElementById('dados'),
  form: document.getElementById('formEntrada'),
  data: document.getElementById('data'),
  ovos: document.getElementById('ovos'),
  obs: document.getElementById('obs'),
  btnLimpar: document.getElementById('btnLimpar'),
  totalHoje: document.getElementById('totalHoje'),
  tabelaRegistros: document.getElementById('tabelaRegistros').querySelector('tbody'),
  diaSel: document.getElementById('diaSel'),
  totalDia: document.getElementById('totalDia'),
  semanaSel: document.getElementById('semanaSel'),
  inicioSemana: document.getElementById('inicioSemana'),
  fimSemana: document.getElementById('fimSemana'),
  totalSemana: document.getElementById('totalSemana'),
  mesSel: document.getElementById('mesSel'),
  totalMes: document.getElementById('totalMes'),
  anoSel: document.getElementById('anoSel'),
  totalAno: document.getElementById('totalAno'),
  btnExportar: document.getElementById('btnExportar'),
  btnApagarTudo: document.getElementById('btnApagarTudo'),
};

function switchTab(tab) {
  const tabs = [el.registrar, el.resumo, el.dados];
  tabs.forEach(t => t.classList.add('hidden'));
  tab.classList.remove('hidden');
  [el.tabRegistrar, el.tabResumo, el.tabDados].forEach(b => b.classList.remove('active'));
  if (tab === el.registrar) el.tabRegistrar.classList.add('active');
  if (tab === el.resumo) el.tabResumo.classList.add('active');
  if (tab === el.dados) el.tabDados.classList.add('active');
}

function renderList() {
  const entries = loadEntries().slice().sort((a, b) => parseDate(b.data) - parseDate(a.data));
  el.tabelaRegistros.innerHTML = '';
  entries.forEach((it, idx) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateBR(it.data)}</td>
      <td>${Number(it.ovos)}</td>
      <td>${it.obs ? it.obs.replace(/</g,'&lt;') : ''}</td>
      <td><button data-idx="${idx}" class="perigo">Excluir</button></td>
    `;
    el.tabelaRegistros.appendChild(tr);
  });
}

function updateTodayTotal() {
  el.totalHoje.textContent = sumByDate(todayStr());
}

function recalcResumo() {
  // Diário
  const dia = el.diaSel.value || todayStr();
  el.totalDia.textContent = sumByDate(dia);

  // Semanal
  const sem = el.semanaSel.value || todayStr();
  const { start, end } = getWeekBounds(sem);
  el.inicioSemana.textContent = formatDateBR(start);
  el.fimSemana.textContent = formatDateBR(end);
  el.totalSemana.textContent = sumBetween(start, end);

  // Mensal
  const mes = el.mesSel.value || todayStr();
  el.totalMes.textContent = sumByMonth(mes);

  // Anual
  const ano = el.anoSel.value || todayStr();
  el.totalAno.textContent = sumByYear(ano);
}

function clearForm() {
  el.data.value = todayStr();
  el.ovos.value = '';
  el.obs.value = '';
}

// Eventos UI
el.tabRegistrar.addEventListener('click', () => switchTab(el.registrar));
el.tabResumo.addEventListener('click', () => { switchTab(el.resumo); recalcResumo(); });
el.tabDados.addEventListener('click', () => switchTab(el.dados));

el.form.addEventListener('submit', (ev) => {
  ev.preventDefault();
  const data = el.data.value;
  const ovos = Number(el.ovos.value);
  const obs = el.obs.value.trim();

  if (!data) { alert('Informe uma data.'); return; }
  if (!Number.isInteger(ovos) || ovos < 0) { alert('Informe apenas números inteiros (>= 0) para ovos.'); return; }

  addEntry({ data, ovos, obs });
  renderList();
  updateTodayTotal();
  clearForm();
  alert('Registro salvo com sucesso!');
});

el.btnLimpar.addEventListener('click', clearForm);

el.tabelaRegistros.addEventListener('click', (ev) => {
  const btn = ev.target.closest('button');
  if (!btn) return;
  const idx = Number(btn.dataset.idx);
  if (!Number.isInteger(idx)) return;
  if (confirm('Confirma excluir este registro?')) {
    deleteEntry(idx);
    renderList();
    updateTodayTotal();
    recalcResumo();
  }
});

el.btnExportar.addEventListener('click', () => {
  const entries = loadEntries();
  const csv = ['Data,Ovos,Observacao'];
  entries.forEach(e => {
    const obs = (e.obs || '').replace(/"/g,'""');
    csv.push(`${e.data},${Number(e.ovos)},"${obs}"`);
  });
  const blob = new Blob([csv.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'controle_ovos.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
});

el.btnApagarTudo.addEventListener('click', () => {
  if (confirm('Tem certeza que deseja apagar TODOS os registros?')) {
    localStorage.removeItem(STORAGE_KEY);
    renderList();
    updateTodayTotal();
    recalcResumo();
  }
});

// Inicialização
window.addEventListener('load', () => {
  // Padrão hoje nos campos
  el.data.value = todayStr();
  el.diaSel.value = todayStr();
  el.semanaSel.value = todayStr();
  el.mesSel.value = todayStr();
  el.anoSel.value = todayStr();

  renderList();
  updateTodayTotal();
  recalcResumo();

  // Registrar service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW falhou', err));
  }
});
