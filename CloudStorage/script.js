let page = 1;
let selectedCategory = "Random";
const exploreContainer = document.getElementById("explore-container");
const loader = document.getElementById("loader");

async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.text();
  } catch (error) {
    throw error;
  }
}

async function loadImages(category) {
  loader.style.display = "block";
  try {
    const imagesUrl = await Promise.all(
      Array.from({ length: 15 }).map(async () => {
        const result = await fetchData(
          `http://localhost:3000/img/${category}`
        ).catch(() => null);
        return { url: result };
      })
    );

    imagesUrl.forEach((image) => {
      if (!image.url) return;
      const imageItem = document.createElement("div");
      imageItem.className = "explore-item";
      imageItem.innerHTML = `<img src="${image.url}" alt="${category} Image">`;
      exploreContainer.appendChild(imageItem);
    });

    page += 1;
  } finally {
    loader.style.display = "none";
  }
}

async function filterImages(category) {
  selectedCategory = category;
  exploreContainer.innerHTML = `<div class="loading-placeholder">Loading...</div>`;
  try {
    await loadImages(selectedCategory);
  } finally {
    const placeholder = document.querySelector(".loading-placeholder");
    if (placeholder) placeholder.remove();
  }
}

let isLoading = false;

window.addEventListener("scroll", () => {
  if (isLoading) return;
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    isLoading = true;
    loadImages(selectedCategory).finally(() => (isLoading = false));
  }
});

loadImages(selectedCategory);
