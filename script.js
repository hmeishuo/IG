// 正規表達式 CSV 解析器：精準處理換行與逗號
function parseCSV(text) {
    const regex = /("([^"]|"")*"|[^,"\r\n]*)(,|\r?\n|\r)/g;
    const rows = [];
    let currentRow = [];
    let match;

    while ((match = regex.exec(text + ",")) !== null) {
        let val = match[1];
        if (val.startsWith('"') && val.endsWith('"')) {
            val = val.substring(1, val.length - 1).replace(/""/g, '"');
        }
        currentRow.push(val.trim());
        if (match[3] !== ',') {
            if (currentRow.some(cell => cell !== "")) {
                rows.push(currentRow);
            }
            currentRow = [];
        }
    }
    return rows;
}

// 綁定按鈕點擊事件
document.getElementById('drawButton').addEventListener('click', function() {
    const fileInput = document.getElementById('csvFile');
    const status = document.getElementById('status');
    const winnerList = document.getElementById('winnerList');
    const resultBox = document.getElementById('resultBox');
    
    // 🌟 抓取關鍵字輸入框的值 (並去除前後空白)
    const keyword = document.getElementById('keywordFilter').value.trim();

    if (!fileInput.files[0]) {
        alert('請先選擇 CSV 檔案！');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const rows = parseCSV(e.target.result);
        if (rows.length < 2) {
            alert('檔案格式不正確或沒有留言資料！');
            return;
        }

        const headers = rows[0].map(h => h.toLowerCase().trim());
        
        let userIdx = headers.findIndex(h => h.includes('user_name') || h.includes('username') || h.includes('owner_username') || h === '帳號');
        let textIdx = headers.findIndex(h => h.includes('comment') || h.includes('text') || h === '留言');

        if (userIdx === -1) userIdx = 3; 
        if (textIdx === -1) textIdx = 4; 

        let pool = [];
        
        for (let i = 1; i < rows.length; i++) {
            if (rows[i].length > Math.max(userIdx, textIdx)) {
                const username = rows[i][userIdx];
                const comment = rows[i][textIdx];
                
                if (username && username !== "undefined") {
                    
                    // 🌟 關鍵字篩選邏輯
                    // 如果有輸入關鍵字，且留言內容不包含該關鍵字，則跳過這筆資料
                    if (keyword !== "" && (!comment || !comment.includes(keyword))) {
                        continue; 
                    }

                    const displayUser = username.startsWith('@') ? username : '@' + username;
                    pool.push({ 
                        user: displayUser, 
                        msg: comment || '(無內容)' 
                    });
                }
            }
        }

        if (pool.length === 0) {
            if (keyword !== "") {
                alert(`找不到包含關鍵字「${keyword}」的有效留言！`);
            } else {
                alert('找不到有效的帳號資料，請確認 CSV 格式。');
            }
            return;
        }

        if (document.getElementById('noRepeat').checked) {
            const unique = new Map();
            pool.forEach(item => {
                if (!unique.has(item.user)) unique.set(item.user, item);
            });
            pool = Array.from(unique.values());
        }

        const count = parseInt(document.getElementById('winnerCount').value);
        if (count > pool.length) {
            alert(`抽出人數 (${count}) 大於目前符合資格的留言人數 (${pool.length})！`);
            return;
        }

        const winners = pool.sort(() => 0.5 - Math.random()).slice(0, count);

        winnerList.innerHTML = '';
        winners.forEach(w => {
            winnerList.innerHTML += `
                <div class="winner-item">
                    <span class="winner-account"> ${w.user}</span>
                    <div class="winner-comment">${w.msg}</div>
                </div>
            `;
        });
        
        resultBox.style.display = 'block';
        status.innerText = `成功讀取！共從 ${pool.length} 位符合資格的參與者中抽出。`;
    };
    reader.readAsText(fileInput.files[0], 'UTF-8');
});