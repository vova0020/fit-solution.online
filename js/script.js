// console.log('script.js загружен 001', new Date().toISOString());

// ========================
// Dynamic Content Loading
// ========================
class ContentLoader {
    constructor() {
        this.loadContent();
    }

    async loadContent() {
        try {
            const response = await fetch('/api/content');
            const data = await response.json();
            
            this.renderNews(data.news || []);
            this.renderPartners(data.partners || []);
            this.renderReviews(data.reviews || []);
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
            this.showError();
        }
    }

    renderNews(news) {
        const newsContainer = document.querySelector('.news-grid');
        if (!newsContainer) return;

        if (news.length === 0) {
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">Новостей пока нет</p>';
            return;
        }

        // Создаем горизонтальный слайдер
        newsContainer.innerHTML = `
            <div class="news-slider-container">
                <button class="news-slider-nav prev" id="newsSliderPrev">‹</button>
                <div class="news-slider" id="newsSlider">
                    <div class="news-slider-track">
                        ${news.map(item => {
                            const date = new Date(item.eventDate || item.createdAt).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                            });

                            return `
                                <article class="news-slider-item news-card">
                                    <div class="news-image">
                                        ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${this.escapeHtml(item.title)}" loading="lazy">` : ''}
                                        <div class="news-date">${date}</div>
                                    </div>
                                    <div class="news-content">
                                        <h3>${this.escapeHtml(item.title)}</h3>
                                        <p>${this.escapeHtml(item.text)}</p>
                                        <a href="#" class="news-link" data-news-id="${item.id}">Читать далее</a>
                                    </div>
                                </article>
                            `;
                        }).join('')}
                    </div>
                </div>
                <button class="news-slider-nav next" id="newsSliderNext">›</button>
            </div>
        `;

        // Привязываем обработчики для модальных окон новостей
        this.bindNewsModals(news);
        this.initNewsSlider();
    }

    renderPartners(partners) {
        const partnersContainer = document.querySelector('.partners-grid');
        if (!partnersContainer) return;

        if (partners.length === 0) {
            partnersContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">Партнеров пока нет</p>';
            return;
        }

        partnersContainer.innerHTML = partners.map(partner => {
            const partnerElement = `
                <div class="partner-item" ${partner.isClickable ? `data-partner="${partner.id}"` : ''}>
                    <div class="logo-wrap">
                        <img src="${partner.logoUrl}" class="${partner.logoClass}" alt="${this.escapeHtml(partner.name)}">
                    </div>
                    <div class="partner-name">${this.escapeHtml(partner.name)}</div>
                </div>
            `;

            // Если партнер не кликабельный и есть внешняя ссылка, оборачиваем в ссылку
            if (!partner.isClickable && partner.websiteUrl) {
                return `<a href="${partner.websiteUrl}" target="_blank" rel="noopener noreferrer" class="no-underline">${partnerElement}</a>`;
            }

            return partnerElement;
        }).join('');

        // Привязываем обработчики для модальных окон партнеров
        this.bindPartnerModals(partners);
    }

    renderReviews(reviews) {
        const reviewsContainer = document.querySelector('.reviews-grid');
        if (!reviewsContainer) return;

        if (reviews.length === 0) {
            reviewsContainer.innerHTML = '<p style="text-align: center; color: var(--text-light);">Отзывов пока нет</p>';
            return;
        }

        reviewsContainer.innerHTML = reviews.map(review => `
            <div class="review-card">
                ${review.imageUrl ? `<div class="review-image"><img src="${review.imageUrl}" alt="${this.escapeHtml(review.company)}"></div>` : ''}
                <div class="review-header">
                    <h3>${this.escapeHtml(review.company)}</h3>
                </div>
                <p>${this.escapeHtml(review.text)}</p>
            </div>
        `).join('');
    }

    bindNewsModals(news) {
        // Создаем модальные окна для новостей
        news.forEach(item => {
            const existingModal = document.getElementById(`newsModal_${item.id}`);
            if (existingModal) {
                existingModal.remove();
            }

            const modal = document.createElement('div');
            modal.id = `newsModal_${item.id}`;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" id="closeNewsModal_${item.id}">&times;</span>
                    <h2>${this.escapeHtml(item.title)}</h2>
                    <p>${this.escapeHtml(item.text).replace(/\n/g, '<br>')}</p>
                </div>
            `;
            document.body.appendChild(modal);

            // Привязываем обработчики
            const newsLink = document.querySelector(`[data-news-id="${item.id}"]`);
            const closeBtn = document.getElementById(`closeNewsModal_${item.id}`);
            const nav = document.querySelector('nav');

            if (newsLink) {
                newsLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    modal.classList.add('show');
                    if (nav) nav.classList.add('modal-open');
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                    if (nav) nav.classList.remove('modal-open');
                });
            }

            // Закрытие при клике вне модального окна
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    if (nav) nav.classList.remove('modal-open');
                }
            });
        });
    }

    bindPartnerModals(partners) {
        // Удаляем старые модальные окна партнеров
        document.querySelectorAll('[id^="partnerModal_"]').forEach(modal => modal.remove());

        partners.forEach(partner => {
            if (!partner.isClickable) return;

            const modal = document.createElement('div');
            modal.id = `partnerModal_${partner.id}`;
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close" id="closePartnerModal_${partner.id}">&times;</span>
                    <h2>${this.escapeHtml(partner.name)}</h2>
                    <p>${this.escapeHtml(partner.description)}</p>
                    ${partner.websiteUrl ? `<button class="site-button" onclick="window.open('${partner.websiteUrl}', '_blank')">Сайт</button>` : ''}
                </div>
            `;
            document.body.appendChild(modal);

            // Привязываем обработчики
            const partnerCard = document.querySelector(`[data-partner="${partner.id}"]`);
            const closeBtn = document.getElementById(`closePartnerModal_${partner.id}`);
            const nav = document.querySelector('nav');

            if (partnerCard) {
                partnerCard.addEventListener('click', () => {
                    modal.classList.add('show');
                    if (nav) nav.classList.add('modal-open');
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', () => {
                    modal.classList.remove('show');
                    if (nav) nav.classList.remove('modal-open');
                });
            }

            // Закрытие при клике вне модального окна
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('show');
                    if (nav) nav.classList.remove('modal-open');
                }
            });
        });
    }

    showError() {
        const newsContainer = document.querySelector('.news-grid');
        const partnersContainer = document.querySelector('.partners-grid');
        const reviewsContainer = document.querySelector('.reviews-grid');
        
        if (newsContainer) {
            newsContainer.innerHTML = '<p style="text-align: center; color: var(--danger-color);">Не удалось загрузить новости</p>';
        }
        
        if (partnersContainer) {
            partnersContainer.innerHTML = '<p style="text-align: center; color: var(--danger-color);">Не удалось загрузить партнеров</p>';
        }
        
        if (reviewsContainer) {
            reviewsContainer.innerHTML = '<p style="text-align: center; color: var(--danger-color);">Не удалось загрузить отзывы</p>';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    initNewsSlider() {
        const slider = document.getElementById('newsSlider');
        const prevBtn = document.getElementById('newsSliderPrev');
        const nextBtn = document.getElementById('newsSliderNext');
        
        if (!slider || !prevBtn || !nextBtn) return;
        
        const scrollToNextCard = () => {
            const cards = slider.querySelectorAll('.news-slider-item');
            const scrollLeft = slider.scrollLeft;
            const containerWidth = slider.clientWidth;
            
            // Находим следующую карточку
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const cardLeft = card.offsetLeft - slider.offsetLeft;
                
                if (cardLeft > scrollLeft + 10) {
                    slider.scrollTo({ left: cardLeft, behavior: 'smooth' });
                    return;
                }
            }
        };
        
        const scrollToPrevCard = () => {
            const cards = slider.querySelectorAll('.news-slider-item');
            const scrollLeft = slider.scrollLeft;
            
            // Находим предыдущую карточку
            for (let i = cards.length - 1; i >= 0; i--) {
                const card = cards[i];
                const cardLeft = card.offsetLeft - slider.offsetLeft;
                
                if (cardLeft < scrollLeft - 10) {
                    slider.scrollTo({ left: cardLeft, behavior: 'smooth' });
                    return;
                }
            }
        };
        
        const updateButtons = () => {
            prevBtn.disabled = slider.scrollLeft <= 0;
            nextBtn.disabled = slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 10;
        };
        
        prevBtn.addEventListener('click', () => {
            scrollToPrevCard();
            setTimeout(updateButtons, 300);
        });
        
        nextBtn.addEventListener('click', () => {
            scrollToNextCard();
            setTimeout(updateButtons, 300);
        });
        
        slider.addEventListener('scroll', updateButtons);
        window.addEventListener('resize', updateButtons);
        updateButtons();
        
        // Touch поддержка
        let isDown = false;
        let startX;
        let scrollLeft;
        
        slider.addEventListener('mousedown', (e) => {
            isDown = true;
            startX = e.pageX - slider.offsetLeft;
            scrollLeft = slider.scrollLeft;
        });
        
        slider.addEventListener('mouseleave', () => {
            isDown = false;
        });
        
        slider.addEventListener('mouseup', () => {
            isDown = false;
        });
        
        slider.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - slider.offsetLeft;
            const walk = (x - startX) * 2;
            slider.scrollLeft = scrollLeft - walk;
        });
    }
}

// Инициализируем загрузчик контента
const contentLoader = new ContentLoader();

// ========================
// Loading screen
// ========================
window.addEventListener('load', () => {
    const loading = document.getElementById('loading');
    setTimeout(() => loading.classList.add('hidden'), 1000);
});

// ========================
// Scroll animations с fallback
// ========================
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('visible');
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
} else {
    // Fallback для старых браузеров
    function checkVisibility() {
        document.querySelectorAll('.fade-in:not(.visible)').forEach(el => {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight || document.documentElement.clientHeight;
            
            if (rect.top <= windowHeight - 50) {
                el.classList.add('visible');
            }
        });
    }
    
    window.addEventListener('scroll', checkVisibility);
    window.addEventListener('resize', checkVisibility);
    checkVisibility(); // Проверяем при загрузке
}

// ========================
// Header & nav scroll
// ========================
const header = document.querySelector('header');
const nav = document.querySelector('nav');

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    header.style.boxShadow = scrollTop > 100 ? '0 2px 20px rgba(44, 62, 80, 0.2)' : '0 2px 20px rgba(44, 62, 80, 0.1)';
    nav.classList.toggle('scrolled', scrollTop > 200);
});

// ========================
// Smooth nav scrolling с fallback для старых браузеров
// ========================
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) {
            const targetTop = target.offsetTop - 120;
            
            // Проверяем поддержку smooth scrolling
            if ('scrollBehavior' in document.documentElement.style) {
                window.scrollTo({ top: targetTop, behavior: 'smooth' });
            } else {
                // Fallback для старых браузеров
                const startTop = window.pageYOffset;
                const distance = targetTop - startTop;
                const duration = 800;
                let start = null;
                
                function step(timestamp) {
                    if (!start) start = timestamp;
                    const progress = Math.min((timestamp - start) / duration, 1);
                    const ease = progress * (2 - progress); // easeOutQuad
                    window.scrollTo(0, startTop + distance * ease);
                    
                    if (progress < 1) {
                        requestAnimationFrame(step);
                    }
                }
                
                requestAnimationFrame(step);
            }
        }
    });
});

// ========================
// Card hover с поддержкой touch
// ========================
document.querySelectorAll('.card').forEach(card => {
    const applyHover = () => {
        card.style.transform = 'translateY(-10px) scale(1.02)';
        card.style.webkitTransform = 'translateY(-10px) scale(1.02)';
        card.style.msTransform = 'translateY(-10px) scale(1.02)';
    };
    const removeHover = () => {
        card.style.transform = 'translateY(0) scale(1)';
        card.style.webkitTransform = 'translateY(0) scale(1)';
        card.style.msTransform = 'translateY(0) scale(1)';
    };
    
    card.addEventListener('mouseenter', applyHover);
    card.addEventListener('mouseleave', removeHover);
    
    // Touch support для мобильных устройств
    if ('ontouchstart' in window) {
        card.addEventListener('touchstart', applyHover, { passive: true });
        card.addEventListener('touchend', removeHover, { passive: true });
    }
});

// ========================
// Modal & Form
// ========================
const modalBtns = document.querySelectorAll(".cta-button");
const modal = document.getElementById("feedbackModal");
const close = document.getElementById("closeModal");

const form = document.getElementById("feedbackForm");
const fields = {
    firstname: { el: document.getElementById("firstname"), error: document.getElementById("firstnameError"), label: "Имя" },
    lastname:  { el: document.getElementById("lastname"), error: document.getElementById("lastnameError"), label: "Фамилия" },
    email:     { el: document.getElementById("email"), error: document.getElementById("emailError") },
    phone:     { el: document.getElementById("phone"), error: document.getElementById("phoneError") },
    city:      { el: document.getElementById("city") },
    company:   { el: document.getElementById("company") },
    consent: { el: document.getElementById("consent"), error: document.getElementById("consentError") }
};

const successMessage = document.getElementById("successMessage");

// ------------------------
// Phone formatting & validation
// ------------------------
function formatPhone(value) {
    let digits = value.replace(/\D/g, "");
    if (digits.startsWith("8")) digits = "7" + digits.slice(1);
    if (!digits.startsWith("7")) digits = "7" + digits;
    let formatted = "+7";
    if (digits.length > 1) formatted += " (" + digits.substring(1, 4);
    if (digits.length >= 4) formatted += ")";
    if (digits.length >= 5) formatted += " " + digits.substring(4, 7);
    if (digits.length >= 7) formatted += "-" + digits.substring(7, 9);
    if (digits.length >= 9) formatted += "-" + digits.substring(9, 11);
    return formatted;
}

function validatePhone() {
    const regex = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
    const value = fields.phone.el.value.trim();
    if (!regex.test(value)) {
        fields.phone.el.classList.add("error-field");
        fields.phone.error.textContent = "Введите телефон в формате +7 (XXX) XXX-XX-XX";
        return false;
    }
    fields.phone.el.classList.remove("error-field");
    fields.phone.error.textContent = "";
    return true;
}

// ------------------------
// Name validation
// ------------------------
function validateName(field) {
    const regex = /^[a-zA-Zа-яА-ЯёЁ\s-']+$/;
    const value = field.el.value.trim();
    if (!regex.test(value)) {
        field.el.classList.add("error-field");
        field.error.textContent = field.label + " должно содержать только буквы";
        return false;
    }
    field.el.classList.remove("error-field");
    field.error.textContent = "";
    return true;
}

// ------------------------
// Email validation
// ------------------------
function validateEmail() {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const value = fields.email.el.value.trim();
    if (!regex.test(value)) {
        fields.email.el.classList.add("error-field");
        fields.email.error.textContent = "Введите корректный email";
        return false;
    }
    fields.email.el.classList.remove("error-field");
    fields.email.error.textContent = "";
    return true;
}

function validateConsent() {
    if (!fields.consent.el.checked) {
        fields.consent.error.textContent = "Необходимо согласие на обработку данных";
        return false;
    }
    fields.consent.error.textContent = "";
    return true;
}

// ------------------------
// Form clear
// ------------------------
function clearForm() {
    form.reset();
    Object.values(fields).forEach(f => f.el.classList.remove("error-field"));
    [fields.firstname, fields.lastname, fields.email, fields.phone].forEach(f => f.error.textContent = "");
    form.style.display = "block";
    successMessage.style.display = "none";
}

// ------------------------
// Event listeners
// ------------------------
fields.phone.el.addEventListener("input", () => {
    fields.phone.el.value = formatPhone(fields.phone.el.value);
    validatePhone();
});

fields.firstname.el.addEventListener("input", () => validateName(fields.firstname));
fields.lastname.el.addEventListener("input", () => validateName(fields.lastname));
fields.email.el.addEventListener("input", validateEmail);

document.querySelectorAll('.cta-button').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = document.getElementById('feedbackModal');
        modal.classList.add('show');
        document.querySelector('nav').classList.add('modal-open');
    });
});

close.addEventListener("click", () => {
    modal.classList.remove("show");
    clearForm();
    nav.classList.remove("modal-open");
});

window.addEventListener("click", e => {
    if (e.target === modal) {
        modal.classList.remove("show");
        clearForm();
        nav.classList.remove("modal-open");
    }
});

window.addEventListener("keydown", e => {
    if (e.key === "Escape") {
        modal.classList.remove("show");
        clearForm();
        nav.classList.remove("modal-open");
    }
});

// ------------------------
// Form submission
// ------------------------
// ------------------------
// Form submission - ДИАГНОСТИЧЕСКАЯ ВЕРСИЯ
// ------------------------
form.addEventListener("submit", e => {
    e.preventDefault();
   // console.log("🔍 Форма вызвала submit событие");
    
    const valid = validateName(fields.firstname) &&
                  validateName(fields.lastname) &&
                  validateEmail() &&
                  validatePhone() &&
                  validateConsent();

   // console.log("✅ Валидация пройдена:", valid);

    if (valid) {
        // Показываем индикатор загрузки
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Отправка...';
        submitBtn.disabled = true;

        // Собираем данные формы
        const formData = new FormData(form);
      //  console.log("📦 Данные формы:", Object.fromEntries(formData));
        
        // Пробуем разные пути к скрипту
        const scriptPaths = [
            '/send-mail.php',
            'send-mail.php',
            './send-mail.php',
            window.location.pathname.replace(/\/[^\/]*$/, '') + '/send-mail.php'
        ];
        
        let currentPathIndex = 0;
        
        function trySend(path) {
        //    console.log("🔄 Пробуем путь:", path);
            
            fetch(path, {
                method: 'POST',
                body: formData
            })
            .then(response => {
                console.log("📨 Ответ сервера:", {
                    status: response.status,
                    statusText: response.statusText,
                    url: response.url,
                    ok: response.ok
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
            //    console.log("✅ Успешный ответ:", data);
                
                if (data.success) {
                    form.style.display = "none";
                    successMessage.textContent = data.message;
                    successMessage.style.display = "block";
                    setTimeout(() => {
                        clearForm();
                        modal.classList.remove("show");
                        nav.classList.remove("modal-open");
                    }, 3000);
                } else {
                    alert('❌ ' + data.message);
                }
            })
            .catch(error => {
             //   console.error('❌ Ошибка при отправке:', error);
                
                // Пробуем следующий путь
                currentPathIndex++;
                if (currentPathIndex < scriptPaths.length) {
                    console.log("🔄 Пробуем следующий путь...");
                    trySend(scriptPaths[currentPathIndex]);
                } else {
                    alert('❌ Не удалось отправить форму. Все пути провалились. Проверьте консоль для подробностей.');
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            })
            .finally(() => {
                if (currentPathIndex >= scriptPaths.length) {
                    submitBtn.textContent = originalText;
                    submitBtn.disabled = false;
                }
            });
        }
        
        // Начинаем с первого пути
        trySend(scriptPaths[currentPathIndex]);
    } else {
        console.log("❌ Валидация не пройдена");
    }
});
// ========================
// Карусель
// ========================
const track = document.querySelector('.carousel-track');
const items = Array.from(track.children);
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');
const dots = Array.from(document.querySelectorAll('.carousel-dots .dot'));

let index = 0;
const itemCount = items.length;
const slideInterval = 5000;
let autoSlideTimer;

function updateCarousel() {
    // Сдвигаем трек на индекс текущего слайда
    track.style.transform = `translateX(-${index * 100}%)`;

    // Активная точка
    dots.forEach((dot, i) => dot.classList.toggle('active', i === index));

    // Управление видео
    items.forEach((item, i) => {
        const video = item.querySelector('video');
        if (video) {
            if (i === index) video.play().catch(() => {});
            else {
                video.pause();
                video.currentTime = 0;
            }
        }
    });
}

// Навигация
function prevSlide() {
    index = (index - 1 + itemCount) % itemCount;
    updateCarousel();
    resetAutoSlide();
}

function nextSlide() {
    index = (index + 1) % itemCount;
    updateCarousel();
    resetAutoSlide();
}

// Клики по точкам
dots.forEach((dot, i) => dot.addEventListener('click', () => {
    index = i;
    updateCarousel();
    resetAutoSlide();
}));

// Автопрокрутка
function startAutoSlide() {
    autoSlideTimer = setInterval(() => {
        const video = items[index].querySelector('video');
        if (video && !video.ended) return; // не листаем пока видео не закончено
        nextSlide();
    }, slideInterval);
}

function resetAutoSlide() {
    clearInterval(autoSlideTimer);
    startAutoSlide();
}

prevBtn.addEventListener('click', prevSlide);
nextBtn.addEventListener('click', nextSlide);

// Инициализация
updateCarousel();
startAutoSlide();


// Увеличение изображений по клику с улучшенной доступностью
const imageModal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const modalClose = document.querySelector('.image-modal-close');

// открытие: клики по миниатюрам
document.querySelectorAll('.image-item img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.setAttribute('tabindex', '0');
  img.setAttribute('role', 'button');
  img.setAttribute('aria-label', 'Увеличить изображение');
  
  const openModal = () => {
    modalImg.src = img.src;
    modalImg.alt = img.alt || '';
    imageModal.classList.add('show');
    imageModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    modalClose.focus(); // Фокус на кнопку закрытия
  };
  
  img.addEventListener('click', openModal);
  img.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openModal();
    }
  });
});

// закрытие крестиком
modalClose.addEventListener('click', closeImageModal);

// закрытие кликом по фону (если клик по самому .image-modal)
imageModal.addEventListener('click', (e) => {
  if (e.target === imageModal) closeImageModal();
});

// закрытие клавишей ESC
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeImageModal();
});

function closeImageModal() {
  imageModal.classList.remove('show');
  imageModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  modalImg.src = '';
  modalImg.alt = '';
  
  // Возвращаем фокус на изображение, которое открыло модалку
  const activeImg = document.querySelector('.image-item img[tabindex="0"]:focus');
  if (activeImg) activeImg.focus();
}




// ========================
// Бургер-меню
// ========================
const burger = document.createElement('div');
burger.classList.add('burger');
burger.innerHTML = '<span></span><span></span><span></span>';
document.querySelector('nav').prepend(burger);

const navMenu = document.querySelector('nav ul');

burger.addEventListener('click', () => {
  navMenu.classList.toggle('open');
  burger.classList.toggle('active');
});

// закрытие меню при клике на пункт
navMenu.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navMenu.classList.remove('open');
    burger.classList.remove('active');
  });
});

// ========================
// Модальные окна партнеров (создаются динамически)
// ========================

// ========================
// Cookie Notice
// ========================
function initCookieNotice() {
    const cookieNotice = document.getElementById('cookieNotice');
    const acceptBtn = document.getElementById('acceptCookies');
    
    // Проверяем, принял ли пользователь cookies
    if (!localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            cookieNotice.classList.add('show');
        }, 1000);
    }
    
    // Обработчик принятия cookies
    acceptBtn.addEventListener('click', () => {
        localStorage.setItem('cookiesAccepted', 'true');
        cookieNotice.classList.remove('show');
    });
}

// Инициализируем уведомление о cookies после загрузки DOM
document.addEventListener('DOMContentLoaded', initCookieNotice);

// ========================
// Модальные окна новостей (создаются динамически)
// ========================