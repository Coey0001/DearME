const $ = (selector) => document.querySelector(selector);
const entriesEl = $('#entries');
const countEl = $('#entry-count');
const searchInput = $('#search-input');
const clearSearch = $('#clear-search');
const form = $('#entry-form');
const toggleForm = $('#toggle-form');
const contentInput = $('#entry-content');
const photoInput = $('#entry-photo');
const todayLabel = $('#today-date');

let entries = [];
let manifest = { entries: [] };

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}
function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
function filenameFor(entry) {
  return entry.filename || entry.file || `${entry.date}.json`;
}
function normalizeManifest(data) {
  if (Array.isArray(data)) return { entries: data };
  if (data && Array.isArray(data.entries)) return data;
  return { entries: [] };
}
async function loadEntries() {
  try {
    const manifestResponse = await fetch('./index.json', { cache: 'no-store' });
    if (!manifestResponse.ok) throw new Error('找不到 index.json');
    manifest = normalizeManifest(await manifestResponse.json());
    const loaded = await Promise.all(manifest.entries.map(async item => {
      const file = typeof item === 'string' ? item : (item.file || item.filename);
      if (!file) return null;
      const response = await fetch(`./${file.split('/').pop()}`, { cache: 'no-store' });
      if (!response.ok) return null;
      const data = await response.json();
      return { ...data, filename: file.split('/').pop() };
    }));
    entries = loaded.filter(Boolean).sort((a,b) => (b.date || '').localeCompare(a.date || ''));
    renderEntries();
  } catch (error) {
    countEl.textContent = '—';
    entriesEl.innerHTML = `<p class="status-message">目前無法載入文章：${escapeHTML(error.message)}。請確認 index.json 與文章 JSON 都已放在 GitHub 專案根目錄。</p>`;
  }
}
function renderEntries() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filtered = entries.filter(entry => `${entry.content || ''} ${entry.date || ''}`.toLowerCase().includes(keyword));
  countEl.textContent = entries.length;
  if (!filtered.length) {
    entriesEl.innerHTML = `<p class="status-message">${keyword ? '沒有找到符合的記錄。' : '還沒有記錄，寫下第一篇吧。'}</p>`;
    return;
  }
  entriesEl.innerHTML = filtered.map(entry => {
    const photoHTML = (entry.images || []).map(src => `<img class="entry-photo" src="${escapeHTML(src)}" alt="日記照片">`).join('');
    return `<article class="entry-card">
      <p class="entry-date">${escapeHTML(entry.date || '')}</p>
      <p class="entry-content">${escapeHTML(entry.content || '')}</p>
      ${photoHTML}
      <button class="entry-delete" type="button" data-delete="${escapeHTML(entry.filename)}">刪除此篇（需同步更新 GitHub）</button>
    </article>`;
  }).join('');
}
function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
toggleForm.addEventListener('click', () => {
  form.hidden = !form.hidden;
  toggleForm.textContent = form.hidden ? '＋ 寫下一篇' : '－ 收起';
  todayLabel.textContent = `日期：${todayISO()}`;
});
$('#cancel-form').addEventListener('click', () => {
  form.reset(); form.hidden = true; toggleForm.textContent = '＋ 寫下一篇';
});
form.addEventListener('submit', async event => {
  event.preventDefault();
  const content = contentInput.value.trim();
  if (!content) return;
  const date = todayISO();
  const photoFile = photoInput.files[0];
  const saveEntry = async (images=[]) => {
    const used = new Set(entries.map(e => e.filename));
    let filename = `${date}.json`, n = 2;
    while (used.has(filename)) filename = `${date}-${n++}.json`;
    const newEntry = { date, content, images };
    const updatedFiles = [filename, ...manifest.entries.map(item => typeof item === 'string' ? item : (item.file || item.filename)).filter(Boolean)];
    downloadJSON(filename, newEntry);
    downloadJSON('index.json', { entries: updatedFiles });
    alert('已下載兩個檔案：文章 JSON 和 index.json。請把兩個檔案上傳到 GitHub 專案根目錄並 Commit，網站才會正式新增這篇。');
    form.reset(); form.hidden = true; toggleForm.textContent = '＋ 寫下一篇';
  };
  if (photoFile) {
    const reader = new FileReader();
    reader.onload = () => saveEntry([reader.result]);
    reader.readAsDataURL(photoFile);
  } else {
    saveEntry([]);
  }
});
searchInput.addEventListener('input', () => { clearSearch.hidden = !searchInput.value; renderEntries(); });
clearSearch.addEventListener('click', () => { searchInput.value = ''; clearSearch.hidden = true; renderEntries(); });
entriesEl.addEventListener('click', event => {
  const button = event.target.closest('[data-delete]');
  if (!button) return;
  const filename = button.dataset.delete;
  if (!confirm(`確定要從網站清單移除 ${filename}？接著仍要到 GitHub 刪除該篇 JSON，並上傳新的 index.json。`)) return;
  const updated = manifest.entries.filter(item => {
    const file = typeof item === 'string' ? item : (item.file || item.filename);
    return file && file.split('/').pop() !== filename;
  });
  downloadJSON('index.json', { entries: updated });
  alert('已下載更新後的 index.json。請到 GitHub 刪除該篇文章 JSON，再上傳這份 index.json 並 Commit。');
});
loadEntries();
