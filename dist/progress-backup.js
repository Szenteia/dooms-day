export const MAX_BACKUP_SIZE = 65536;
export class ProgressBackupError extends Error {}
const counters = ['best', 'shards', 'runs'];
const collections = ['creatures', 'fossils'];
const isCounter = value => Number.isSafeInteger(value) && value >= 0;
const isId = value => Number.isInteger(value) && value >= 0 && value < 5;
const ids = values => [...new Set(Array.isArray(values) ? values.filter(isId) : [])].sort((a,b)=>a-b);
const invalid = () => new ProgressBackupError('Hibás vagy nem támogatott Doom’s Day mentésfájl.');

function safeProgress(value = {}) {
  const progress = {};
  for (const key of counters) progress[key] = isCounter(value?.[key]) ? value[key] : 0;
  for (const key of collections) progress[key] = ids(value?.[key]);
  return progress;
}

export function exportProgress(value) {
  return JSON.stringify({game:'dooms-day', version:1, progress:safeProgress(value)}, null, 2);
}

export function parseProgressBackup(text) {
  if (typeof text !== 'string' || text.length > MAX_BACKUP_SIZE) throw invalid();
  let data;
  try { data = JSON.parse(text); } catch { throw invalid(); }
  if (data?.game !== 'dooms-day' || data.version !== 1) throw invalid();
  const value = data.progress;
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw invalid();
  for (const key of counters) if (!isCounter(value[key])) throw invalid();
  for (const key of collections) if (!Array.isArray(value[key]) || !value[key].every(isId)) throw invalid();
  // Copy only recognized progression fields; imported strings/extra properties never enter the save.
  return safeProgress(value);
}

export function mergeProgress(current, imported) {
  const before = safeProgress(current), after = safeProgress(imported), merged = {};
  for (const key of counters) merged[key] = Math.max(before[key], after[key]);
  for (const key of collections) merged[key] = ids([...before[key], ...after[key]]);
  return merged;
}

export function attachProgressBackup({getProgress, canRestore, commit, refresh}) {
  const download = document.querySelector('#backup-download');
  const restore = document.querySelector('#backup-restore');
  const fileInput = document.querySelector('#backup-file');
  const status = document.querySelector('#backup-status');
  restore.disabled = !canRestore();
  download.onclick = () => {
    let url, link;
    try {
      url = URL.createObjectURL(new Blob([exportProgress(getProgress())], {type:'application/json'}));
      link = document.createElement('a');
      link.href = url;
      link.download = 'dooms-day-progress.json';
      document.body.append(link);
      link.click();
      status.textContent = 'A mentés letöltését elindítottuk.';
    } catch {
      status.textContent = 'A letöltés nem indítható el ebben a böngészőben.';
    } finally {
      link?.remove();
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  };
  restore.onclick = () => { if (canRestore()) { fileInput.value = ''; fileInput.click(); } };
  fileInput.onchange = async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const runs = getProgress().runs;
    restore.disabled = true;
    fileInput.disabled = true;
    try {
      if (!canRestore()) throw new ProgressBackupError('Visszaállítás csak két futás között lehetséges.');
      if (file.size > MAX_BACKUP_SIZE) throw new ProgressBackupError('A mentésfájl legfeljebb 64 KiB lehet.');
      const imported = parseProgressBackup(await file.text());
      if (!canRestore() || getProgress().runs !== runs) throw new ProgressBackupError('Közben új futás indult. A mentést két kör között töltsd vissza.');
      commit(mergeProgress(getProgress(), imported));
      refresh();
      document.querySelector('#backup-status').textContent = 'A fejlődést egyesítettük. A feloldások a következő körben aktívak.';
    } catch (error) {
      status.textContent = error instanceof ProgressBackupError ? error.message : 'A művelet nem fejezhető be ebben a böngészőben. Próbáld újra.';
    } finally {
      restore.disabled = !canRestore();
      fileInput.disabled = false;
      fileInput.value = '';
    }
  };
}
