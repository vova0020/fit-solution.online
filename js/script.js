// console.log('script.js загружен 001', new Date().toISOString());

// ========================
// Loading screen
// ========================
window.addEventListener('load', () => {
    const loading = document.getElementById('loading');
    setTimeout(() => loading.classList.add('hidden'), 1000);
});

// ========================
// Scroll animations
// ========================
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('visible');
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

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
// Smooth nav scrolling
// ========================
document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
        e.preventDefault();
        const target = document.querySelector(anchor.getAttribute('href'));
        if (target) window.scrollTo({ top: target.offsetTop - 120, behavior: 'smooth' });
    });
});

// ========================
// Card hover
// ========================
document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mouseenter', () => card.style.transform = 'translateY(-10px) scale(1.02)');
    card.addEventListener('mouseleave', () => card.style.transform = 'translateY(0) scale(1)');
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


// Увеличение изображений по клику
const imageModal = document.getElementById('imageModal');
const modalImg = document.getElementById('modalImg');
const modalClose = document.querySelector('.image-modal-close');

// открытие: клики по миниатюрам
document.querySelectorAll('.image-item img').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', () => {
    modalImg.src = img.src;
    modalImg.alt = img.alt || '';
    imageModal.classList.add('show');
    document.body.style.overflow = 'hidden'; // запрет скролла за модалкой
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
  document.body.style.overflow = '';
  modalImg.src = '';
  modalImg.alt = '';
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
// Модальные окна партнеров
// ========================
const partnerModals = {
    planplace: { modal: document.getElementById('planplaceModal'), close: document.getElementById('closePlanplaceModal') },
    imos: { modal: document.getElementById('imosModal'), close: document.getElementById('closeImosModal') },
    bsgroup: { modal: document.getElementById('bsgroupModal'), close: document.getElementById('closeBsgroupModal') },
    altendorf: { modal: document.getElementById('altendorfModal'), close: document.getElementById('closeAltendorfModal') }
};

// Открытие модальных окон
Object.keys(partnerModals).forEach(partner => {
    const card = document.querySelector(`[data-partner="${partner}"]`);
    if (card) {
        card.addEventListener('click', () => {
            partnerModals[partner].modal.classList.add('show');
            document.querySelector('nav').classList.add('modal-open');
        });
    }
});

// Закрытие модальных окон
Object.keys(partnerModals).forEach(partner => {
    const { modal, close } = partnerModals[partner];
    if (close) {
        close.addEventListener('click', () => {
            modal.classList.remove('show');
            document.querySelector('nav').classList.remove('modal-open');
        });
    }
});

// Закрытие при клике вне модального окна
window.addEventListener('click', (e) => {
    Object.values(partnerModals).forEach(({ modal }) => {
        if (e.target === modal) {
            modal.classList.remove('show');
            document.querySelector('nav').classList.remove('modal-open');
        }
    });
});

// Закрытие по ESC
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        Object.values(partnerModals).forEach(({ modal }) => {
            if (modal.classList.contains('show')) {
                modal.classList.remove('show');
                document.querySelector('nav').classList.remove('modal-open');
            }
        });
    }
});

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
// Модальное окно новости
// ========================
const newsModal = document.getElementById('newsModal');
const closeNewsModal = document.getElementById('closeNewsModal');

// Открытие модального окна новости
document.querySelectorAll('.news-link[data-news="exhibition"]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        newsModal.classList.add('show');
        document.querySelector('nav').classList.add('modal-open');
    });
});

// Закрытие модального окна новости
closeNewsModal.addEventListener('click', () => {
    newsModal.classList.remove('show');
    document.querySelector('nav').classList.remove('modal-open');
});

// Закрытие при клике вне модального окна
window.addEventListener('click', (e) => {
    if (e.target === newsModal) {
        newsModal.classList.remove('show');
        document.querySelector('nav').classList.remove('modal-open');
    }
});

// Закрытие по ESC
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && newsModal.classList.contains('show')) {
        newsModal.classList.remove('show');
        document.querySelector('nav').classList.remove('modal-open');
    }
});