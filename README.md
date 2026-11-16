# DearME

個人心情記錄網站，使用原生 HTML、CSS、JavaScript，可部署至 GitHub Pages。

## 本機預覽
由於網站透過 `fetch()` 讀取 JSON，請使用本機靜態伺服器預覽，不要直接雙擊 `index.html`。

例如在專案資料夾執行：

```bash
python -m http.server 8000
```

然後開啟 `http://localhost:8000`。

## 新增文章
1. 在 `data/entries/` 新增一個 JSON 檔案。
2. 依照 `AGENT.md` 的格式填入 `date`、`content`、`images`。
3. 將檔案路徑加入 `data/index.json` 的 `entries` 陣列。
4. 如有圖片，放入 `assets/images/` 並在 JSON 中填入相對路徑。
5. 將變更提交至 GitHub。

## 部署
將專案推送至 GitHub Repository，並在 Repository 的 Settings → Pages 設定部署來源。可選擇部署 `main` 分支的根目錄。
