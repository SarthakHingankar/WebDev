let page = 1;
const exploreContainer = document.getElementById("explore-container");
const loader = document.getElementById("loader");

// Function to fetch and display images
async function loadImages() {
  loader.style.display = "block";
  try {
    const images = Array.from({ length: 15 }).map((_, index) => ({
      url: `https://picsum.photos/300?random=${
        Math.floor(Math.random() * 1000) + index
      }`,
    }));

    images.forEach((image) => {
      const imageItem = document.createElement("div");
      imageItem.className = "explore-item";
      imageItem.innerHTML = `<img src="${image.url}" alt="Explore Image">`;
      exploreContainer.appendChild(imageItem);
    });

    page += 1;
  } finally {
    loader.style.display = "none";
  }
}

// Scroll event listener for infinite scroll
window.addEventListener("scroll", () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 200) {
    loadImages();
  }
});

// Initial load
loadImages();
