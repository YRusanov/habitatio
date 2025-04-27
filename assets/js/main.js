// assets/js/main.js

(() => {
    // ---- вместо жёсткого массива ставим пустой
    let objects = [];

    const params = new URLSearchParams(location.search);
    const detailId = params.get("id");

    // ---- подгружаем данные из файла data/objects.json
    fetch("data/objects.json")
        .then(res => {
            if (!res.ok) throw new Error(res.status);
            return res.json();
        })
        .then(data => {
            objects = data;
            init();            // только после загрузки
        })
        .catch(err => {
            console.error("Не удалось загрузить data/objects.json:", err);
            // можно раскомментировать и вернуть жестко прописанный массив как fallback
            // objects = [ /* ...ваши объекты... */ ];
            init();
        });

    // ---- точка входа после загрузки объектов
    function init() {
        if (detailId && document.getElementById("detail-container")) {
            renderDetail(detailId);
        } else {
            renderCatalog();
        }
    }

    // ====== Рендер каталога ======
    function renderCatalog() {
        const container = document.getElementById("cards-container");
        const filterStatus = document.getElementById("filter-status");
        const filterType = document.getElementById("filter-type");

        filterStatus.addEventListener("change", renderCards);
        filterType.addEventListener("change", renderCards);

        renderCards();
        window.addEventListener("resize", equalizeCardHeights);

        function renderCards() {
            container.innerHTML = "";
            objects
                .filter(o => filterStatus.value === "all" || o.status === filterStatus.value)
                .filter(o => filterType.value === "all" || o.type === filterType.value)
                .forEach(o => {
                    let badge = "";
                    if (o.status === "rented") badge = `<div class="status">Сдано</div>`;
                    if (o.status === "sold") badge = `<div class="status">Продано</div>`;

                    const prefix = o.status === "rent" ? "Аренда: "
                        : o.status === "sale" ? "Продажа: "
                            : "";

                    const card = document.createElement("div");
                    card.className = "card";
                    card.innerHTML = `
                        ${badge}
                        <a href="detail.html?id=${o.id}" style="text-decoration:none; color:inherit;">
                          <img src="${o.images[0]}" alt="${o.title}">
                          <div class="info">
                            <h3>${o.title}</h3>
                            <p><strong>${prefix}</strong>${o.price}</p>
                          </div>
                        </a>`;
                    container.appendChild(card);
                });

            // анимация появления
            setTimeout(() => {
                document.querySelectorAll('.card')
                    .forEach(c => c.classList.add('visible'));
            }, 100);

            equalizeCardHeights();
        }

        function equalizeCardHeights() {
            const cards = container.querySelectorAll(".card");
            let maxH = 0;
            cards.forEach(c => {
                c.style.height = "auto";
                maxH = Math.max(maxH, c.offsetHeight);
            });
            cards.forEach(c => c.style.height = maxH + "px");
        }
    }

    // ====== Рендер детальной страницы ======
    function renderDetail(id) {
        const obj = objects.find(o => String(o.id) === id);
        const container = document.getElementById("detail-container");
        if (!obj) {
            container.textContent = "Об’єкт не знайдено.";
            return;
        }

        let gallery = "";
        if (obj.images.length > 1) {
            gallery = `
                <div class="detail-photo-block" style="position:relative;">
                  <img id="main-photo" class="detail-photo" src="${obj.images[0]}" alt="${obj.title}">
                  <button id="prev-btn" class="arrow-btn prev"></button>
                  <button id="next-btn" class="arrow-btn next"></button>
                </div>`;
        } else {
            gallery = `
                <div style="text-align:center;">
                  <img class="detail-photo" src="${obj.images[0]}" alt="${obj.title}">
                </div>`;
        }

        const statusText = obj.status === "rent" ? "Оренда"
            : obj.status === "sale" ? "Продажа"
                : obj.status === "rented" ? "Сдано"
                    : "Продано";

        const statusHTML = (statusText === "Сдано" || statusText === "Продано")
            ? `<span class="detail-status-badge">${statusText}</span>`
            : statusText;

        container.innerHTML = `
            <div class="detail-wrapper">
              ${gallery}
              <div class="detail-info-block">
                <h1 class="detail-title">${obj.title}</h1>
                <p class="detail-status">${statusHTML}</p>
                <p class="detail-price"><strong>${obj.price}</strong></p>
                <p class="detail-description">
                  Тут буде детальний опис об’єкта: площа, поверх, ремонт, комунікації тощо.
                </p>
                <p class="detail-contacts">
                  <strong>Контакти агента:</strong><br>
                  +380 XX XXX XXXX<br>
                  email@example.com
                </p>
                <div style="text-align:center; margin-top:20px;">
                  <button class="btn" onclick="history.back()">← Назад</button>
                  <a href="index.html" class="btn">Главная</a>
                </div>
              </div>
            </div>`;

        if (obj.images.length > 1) {
            let currentIndex = 0;
            const mainPhoto = document.getElementById("main-photo");
            const prevBtn = document.getElementById("prev-btn");
            const nextBtn = document.getElementById("next-btn");

            prevBtn.addEventListener("click", () => {
                currentIndex = (currentIndex - 1 + obj.images.length) % obj.images.length;
                fadeTo(currentIndex);
            });
            nextBtn.addEventListener("click", () => {
                currentIndex = (currentIndex + 1) % obj.images.length;
                fadeTo(currentIndex);
            });

            function fadeTo(i) {
                mainPhoto.style.opacity = 0;
                setTimeout(() => {
                    mainPhoto.src = obj.images[i];
                    mainPhoto.style.opacity = 1;
                }, 250);
            }
        }
    }

})();
