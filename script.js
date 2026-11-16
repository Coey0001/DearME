const entriesContainer = document.querySelector("#entries");
const countElement = document.querySelector("#entry-count");
const searchInput = document.querySelector("#search-input");
const clearSearchButton = document.querySelector("#clear-search");

let allEntries = [];

function formatDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}.${month}.${day}`;
}

function createEntryElement(entry) {
  const article = document.createElement("article");
  article.className = "entry";

  const date = document.createElement("p");
  date.className = "entry-date";
  date.textContent = formatDate(entry.date);

  const content = document.createElement("p");
  content.className = "entry-content";
  content.textContent = entry.content;

  article.append(date, content);

  if (Array.isArray(entry.images) && entry.images.length > 0) {
    const imageGroup = document.createElement("div");
    imageGroup.className = "entry-images";
    entry.images.forEach((src) => {
      const image = document.createElement("img");
      image.src = src;
      image.alt = "心情記錄附圖";
      image.loading = "lazy";
      imageGroup.append(image);
    });
    article.append(imageGroup);
  }

  return article;
}

function renderEntries(query = "") {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const filteredEntries = allEntries.filter((entry) =>
    entry.content.toLocaleLowerCase().includes(normalizedQuery)
  );

  entriesContainer.replaceChildren();

  if (filteredEntries.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = normalizedQuery ? "沒有找到相關的記錄。" : "目前還沒有心情記錄。";
    entriesContainer.append(empty);
    return;
  }

  filteredEntries.forEach((entry) => {
    entriesContainer.append(createEntryElement(entry));
  });
}

async function loadEntries() {
  try {
    const manifestResponse = await fetch("./index.json");
    if (!manifestResponse.ok) throw new Error("無法讀取文章清單");
    const manifest = await manifestResponse.json();

    const loadedEntries = await Promise.all(
      manifest.entries.map(async (file) => {
        const response = await fetch(`./${file.split("/").pop()}`);
        if (!response.ok) throw new Error(`無法讀取文章：${file}`);
        return response.json();
      })
    );

    allEntries = loadedEntries.sort((a, b) => b.date.localeCompare(a.date));
    countElement.textContent = allEntries.length;
    renderEntries(searchInput.value);
  } catch (error) {
    entriesContainer.replaceChildren();
    const message = document.createElement("p");
    message.className = "status-message";
    message.textContent = "目前無法載入記錄，請稍後再試。";
    entriesContainer.append(message);
    console.error(error);
  }
}

searchInput.addEventListener("input", () => {
  clearSearchButton.hidden = searchInput.value.length === 0;
  renderEntries(searchInput.value);
});

clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchButton.hidden = true;
  renderEntries();
  searchInput.focus();
});

loadEntries();
