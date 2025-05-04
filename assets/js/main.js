(() => {
    let objects = [];
    let i18n = {};

    const params = new URLSearchParams(location.search);
    const detailId = params.get("id");

    const lang = localStorage.getItem("language") || "ua";
    document.documentElement.setAttribute("lang", lang);

    function applyTranslations() {
        document.querySelectorAll("[data-i18n]").forEach(el => {
            const key = el.getAttribute("data-i18n");
            if (i18n.hasOwnProperty(key)) {
                el.innerText = i18n[key];
            }
        });

        document.querySelectorAll("[data-i18n-html]").forEach(el => {
            const key = el.getAttribute("data-i18n-html");
            if (i18n.hasOwnProperty(key)) {
                el.innerHTML = i18n[key];
            }
        });
    }

    Promise.all([
        fetch(`lang/${lang}.json`).then(res => res.json()),
        fetch("data/objects.json").then(res => res.json())
    ])
        .then(([translations, data]) => {
            i18n = translations;
            objects = data;
            applyTranslations();
            init();
        })
        .catch(err => {
            console.error("Ошибка при загрузке данных или переводов:", err);
        });



    // Подсветка активного языка + переключение языка
    document.addEventListener("DOMContentLoaded", () => {
        const langButtons = document.querySelectorAll('[data-lang]');

        langButtons.forEach(btn => {
            if (btn.getAttribute('data-lang') === lang) {
                btn.classList.add('active');
            }

            btn.addEventListener('click', () => {
                const selectedLang = btn.getAttribute('data-lang');
                localStorage.setItem('language', selectedLang);
                location.reload();
            });
        });
    });

    // Загрузка объектов недвижимости
    fetch("data/objects.json")
        .then(res => {
            if (!res.ok) throw new Error(res.status);
            return res.json();
        })
        .then(data => {
            objects = data;
        })
        .catch(err => {
            console.error("Не удалось загрузить data/objects.json:", err);
        });

    // Основной вход после загрузки переводов
    function init() {
        if (detailId && document.getElementById("detail-container")) {
            renderDetail(detailId);
        } else {
            renderCatalog();
        }
    }

    // Каталог недвижимости
    function renderCatalog() {
        const container = document.getElementById("cards-container");
        const filterStatus = document.getElementById("filter-status");
        const filterType = document.getElementById("filter-type");

        filterStatus?.addEventListener("change", renderCards);
        filterType?.addEventListener("change", renderCards);

        renderCards();
        window.addEventListener("resize", equalizeCardHeights);

        function renderCards() {
            if (!container) return;
            container.innerHTML = "";

            objects
                .filter(o => filterStatus?.value === "all" || o.status === filterStatus?.value)
                .filter(o => filterType?.value === "all" || o.type === filterType?.value)
                .forEach(o => {
                    const card = document.createElement("div");
                    card.className = "card";

                    const prefix = o.status === "rent" ? `${i18n.rent}: `
                        : o.status === "sale" ? `${i18n.sale}: `
                            : "";

                    const badge = (o.status === "rented" || o.status === "sold")
                        ? `<div class="status">${i18n[o.status]}</div>` : "";

                    card.innerHTML = `
                        ${badge}
                        <a href="detail.html?id=${o.id}" style="text-decoration:none; color:inherit;">
                          <img src="${o.images[0]}" alt="${o.title[lang]}">
                          <div class="info">
                            <h3>${o.title[lang]}</h3>
                            <p><strong>${prefix}</strong>${o.price.amount.toLocaleString()} ${o.price.currency}</p>
                          </div>
                        </a>`;
                    container.appendChild(card);
                });

            setTimeout(() => {
                document.querySelectorAll('.card').forEach(c => c.classList.add('visible'));
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

    // Детальная страница объекта
    function renderDetail(id) {
        const obj = objects.find(o => String(o.id) === id);
        const container = document.getElementById("detail-container");

        if (!obj) {
            container.textContent = i18n.notFound;
            return;
        }

        const gallery = `
            <div class="detail-photo-block">
                <img id="main-photo" class="detail-photo" src="${obj.images[0]}" alt="${obj.title[lang]}">
                ${obj.images.length > 1 ? `
                    <button id="prev-btn" class="arrow-btn prev">←</button>
                    <button id="next-btn" class="arrow-btn next">→</button>
                ` : ``}
            </div>`;

        const infoBlock = `
  <div class="detail-info-block">
    <h1 class="detail-title">${obj.title[lang]}</h1>
    <p class="detail-status">${getStatusText(obj.status)}</p>
    <p class="detail-price"><strong>${i18n.price}: ${obj.price.amount.toLocaleString()} ${obj.price.currency}</strong></p>
    <p class="detail-description">${obj.description[lang].replace(/\n/g, "<br>")}</p>
    <div class="navigation-buttons">
      <a href="catalog.html" class="btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd"
            d="M5.854 4.146a.5.5 0 0 1 0 .708L2.707 8l3.147 3.146a.5.5 0 0 1-.708.708l-3.5-3.5a.5.5 0 0 1 0-.708l3.5-3.5a.5.5 0 0 1 .708 0z" />
          <path fill-rule="evenodd" d="M13.5 8a.5.5 0 0 1-.5.5H3a.5.5 0 0 1 0-1h10a.5.5 0 0 1 .5.5z" />
        </svg>
        <span data-i18n="backToCatalog">${i18n.backToCatalog}</span>
      </a>

      <a href="index.html" class="btn">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8 .5l6 6V15H2V6.5l6-6zM1 7.707V16h5v-5h4v5h5V7.707l-7-7-7 7z" />
        </svg>
        <span data-i18n="homePage">${i18n.homePage}</span>
      </a>
    </div>
  </div>`;

        container.innerHTML = `
            <div class="detail-wrapper">
                ${gallery}
                ${infoBlock}
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

    // Получить текст статуса с переводом
    function getStatusText(status) {
        return i18n[status] || status;
    }

    // Сброс фильтров в каталоге
    document.addEventListener("DOMContentLoaded", () => {
        const statusFilter = document.getElementById("filter-status");
        const typeFilter = document.getElementById("filter-type");
        const resetBtn = document.getElementById("reset-filters");

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                statusFilter.value = "all";
                typeFilter.value = "all";
                statusFilter.dispatchEvent(new Event("change"));
                typeFilter.dispatchEvent(new Event("change"));
            });
        }
    });
})();
