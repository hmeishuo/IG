// IG 留言抽獎工具 - ig02.js (優化版)

let allEntries = [];

// 解析 CSV（支援含逗號的欄位）
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = [];
    let inQuotes = false;
    let cur = '';
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// 上傳 CSV 後即時顯示有效人數
document.getElementById('csvFile').addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const rows = parseCSV(e.target.result);
    // 跳過標題列
    const dataRows = rows.slice(1).filter(r => r.length >= 2 && r[0]);
    allEntries = dataRows;
    updateCount();
    showStatus(`已載入 ${dataRows.length} 筆留言資料`, 'info');
  };
  reader.readAsText(file, 'UTF-8');
});

function updateCount() {
  const noRepeat = document.getElementById('noRepeat').checked;
  const keyword = document.getElementById('keyword').value.trim();
  let entries = [...allEntries];

  if (keyword) {
    entries = entries.filter(r => (r[1] || '').includes(keyword));
  }
  if (noRepeat) {
    const seen = new Set();
    entries = entries.filter(r => {
      if (seen.has(r[0])) return false;
      seen.add(r[0]);
      return true;
    });
  }
  const countEl = document.getElementById('participantCount');
  if (countEl) countEl.textContent = `符合資格參與者：${entries.length} 人`;
  return entries;
}

document.getElementById('noRepeat').addEventListener('change', updateCount);
document.getElementById('keyword').addEventListener('input', updateCount);

function showStatus(msg, type) {
  const el = document.getElementById('status');
  el.textContent = msg;
  el.style.color = type === 'error' ? '#e74c3c' : '#bc1888';
}

function startDraw() {
  if (allEntries.length === 0) {
    showStatus('⚠️ 請先上傳 CSV 檔案！', 'error');
    return;
  }

  const entries = updateCount();
  if (entries.length === 0) {
    showStatus('⚠️ 符合條件的留言數為 0，請確認關鍵字或資料。', 'error');
    return;
  }

  const count = parseInt(document.getElementById('winnerCount').value) || 1;
  if (count > entries.length) {
    showStatus(`⚠️ 抽出人數（${count}）超過符合資格人數（${entries.length}）！`, 'error');
    return;
  }

  // Fisher-Yates 洗牌後取前 N 名
  const shuffled = [...entries];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  const winners = shuffled.slice(0, count);

  displayResults(winners);
  showStatus(`🎉 抽獎完成！共抽出 ${winners.length} 位得獎者`, 'info');
}

function displayResults(winners) {
  const box = document.getElementById('resultBox');
  const list = document.getElementById('winnerList');
  box.style.display = 'block';
  list.innerHTML = '';

  winners.forEach((w, i) => {
    const item = document.createElement('div');
    item.className = 'winner-item';
    item.innerHTML = `
      <span class="winner-account">🏆 第 ${i + 1} 名：@${w[0]}</span>
      <div class="winner-comment">${escapeHtml(w[1] || '')}</div>
    `;
    list.appendChild(item);
  });

  // 捲動至結果區
  box.scrollIntoView({ behavior: 'smooth' });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function copyResults() {
  const list = document.getElementById('winnerList');
  const items = list.querySelectorAll('.winner-item');
  if (items.length === 0) return;

  let text = '🎉 IG 抽獎得獎名單\n';
  items.forEach(item => {
    const account = item.querySelector('.winner-account').textContent;
    const comment = item.querySelector('.winner-comment').textContent;
    text += `${account}\n留言：${comment}\n---\n`;
  });

  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('copyBtn');
    btn.textContent = '✅ 已複製！';
    setTimeout(() => { btn.textContent = '📋 複製得獎名單'; }, 2000);
  }).catch(() => {
    showStatus('複製失敗，請手動選取名單', 'error');
  });
}
