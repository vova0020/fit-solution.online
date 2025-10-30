class AdminPanel {
    constructor() {
        this.currentSection = 'news';
        this.editingId = null;
        this.init();
    }

    init() {
        this.checkAuth();
        this.bindEvents();
        this.initPasswordToggle();
    }

    async checkAuth() {
        try {
            const response = await fetch('/api/check-auth');
            const data = await response.json();
            
            if (data.authenticated) {
                this.showAdminPanel();
                this.loadContent();
            } else {
                this.showLoginForm();
            }
        } catch (error) {
            console.error('Ошибка проверки авторизации:', error);
            this.showLoginForm();
        }
    }

    bindEvents() {
        // Авторизация
        document.getElementById('authForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.login();
        });

        // Выход
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Навигация
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchSection(e.target.dataset.section);
            });
        });

        // Новости
        document.getElementById('addNewsBtn').addEventListener('click', () => {
            this.showNewsForm();
        });

        document.getElementById('newsForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveNews();
        });

        document.getElementById('cancelNewsBtn').addEventListener('click', () => {
            this.hideNewsForm();
        });

        // Партнеры
        document.getElementById('addPartnerBtn').addEventListener('click', () => {
            this.showPartnerForm();
        });

        document.getElementById('partnersForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.savePartner();
        });

        document.getElementById('cancelPartnerBtn').addEventListener('click', () => {
            this.hidePartnerForm();
        });
        
        // Обработчики загрузки изображений
        this.bindImageUploadEvents();
    }
    
    initPasswordToggle() {
        const showPasswordBtn = document.getElementById('showPassword');
        const passwordInput = document.getElementById('password');
        
        if (showPasswordBtn && passwordInput) {
            showPasswordBtn.addEventListener('click', () => {
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    showPasswordBtn.textContent = '🙈';
                } else {
                    passwordInput.type = 'password';
                    showPasswordBtn.textContent = '👁';
                }
            });
        }
    }
    
    bindImageUploadEvents() {
        // Загрузка изображений для новостей
        document.getElementById('newsImageFile').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'news');
        });
        
        // Предварительный просмотр по URL для новостей
        document.getElementById('newsImage').addEventListener('input', (e) => {
            this.showImagePreview(e.target.value, 'newsPreviewImg', 'newsImagePreview');
        });
        
        // Загрузка логотипов для партнеров
        document.getElementById('partnerLogoFile').addEventListener('change', (e) => {
            this.handleImageUpload(e, 'partners');
        });
        
        // Предварительный просмотр по URL для партнеров
        document.getElementById('partnerLogo').addEventListener('input', (e) => {
            this.showImagePreview(e.target.value, 'partnerPreviewImg', 'partnerLogoPreview');
        });
    }

    showLoginForm() {
        document.getElementById('loginForm').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
    }

    showAdminPanel() {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
    }

    async login() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.showAdminPanel();
                this.loadContent();
                errorDiv.textContent = '';
            } else {
                errorDiv.textContent = data.error || 'Ошибка авторизации';
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            errorDiv.textContent = 'Ошибка соединения с сервером';
        }
    }

    async logout() {
        try {
            await fetch('/api/logout', { method: 'POST' });
            this.showLoginForm();
            document.getElementById('authForm').reset();
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
    }

    switchSection(section) {
        // Обновляем активную кнопку навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${section}"]`).classList.add('active');

        // Показываем нужную секцию
        document.querySelectorAll('.content-section').forEach(sec => {
            sec.style.display = 'none';
        });
        document.getElementById(`${section}Section`).style.display = 'block';

        this.currentSection = section;
        this.loadContent();
    }

    async loadContent() {
        if (this.currentSection === 'news') {
            await this.loadNews();
        } else if (this.currentSection === 'partners') {
            await this.loadPartners();
        }
    }

    async loadNews() {
        try {
            const response = await fetch('/api/admin/news');
            const news = await response.json();
            this.renderNewsList(news);
        } catch (error) {
            console.error('Ошибка загрузки новостей:', error);
            this.showNotification('Ошибка загрузки новостей', 'error');
        }
    }

    renderNewsList(news) {
        const container = document.getElementById('newsList');
        
        if (news.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">Новостей пока нет</p>';
            return;
        }

        container.innerHTML = news.map(item => `
            <div class="list-item">
                <div class="item-header ${item.imageUrl ? 'item-header-with-image' : ''}">
                    ${item.imageUrl ? `<img src="${item.imageUrl}" alt="Новость" class="item-image">` : ''}
                    <div>
                        <div class="item-title">${this.escapeHtml(item.title)}</div>
                        <div class="item-date">${new Date(item.eventDate || item.createdAt).toLocaleDateString('ru-RU')}</div>
                        <div class="item-meta">Порядок: ${item.order || 'не указан'}</div>
                    </div>
                </div>
                <div class="item-content">${this.escapeHtml(item.text.substring(0, 150))}${item.text.length > 150 ? '...' : ''}</div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="adminPanel.editNews('${item.id}')">Редактировать</button>
                    <button class="delete-btn" onclick="adminPanel.deleteNews('${item.id}')">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    async loadPartners() {
        try {
            const response = await fetch('/api/admin/partners');
            const partners = await response.json();
            this.renderPartnersList(partners);
        } catch (error) {
            console.error('Ошибка загрузки партнеров:', error);
            this.showNotification('Ошибка загрузки партнеров', 'error');
        }
    }

    renderPartnersList(partners) {
        const container = document.getElementById('partnersList');
        
        if (partners.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-light);">Партнеров пока нет</p>';
            return;
        }

        container.innerHTML = partners.map(item => `
            <div class="list-item">
                <div class="item-header ${item.logoUrl ? 'item-header-with-image' : ''}">
                    ${item.logoUrl ? `<img src="${item.logoUrl}" alt="Логотип" class="item-image">` : ''}
                    <div>
                        <div class="item-title">${this.escapeHtml(item.name)}</div>
                    </div>
                </div>
                <div class="item-content">${this.escapeHtml(item.description.substring(0, 150))}${item.description.length > 150 ? '...' : ''}</div>
                <div class="item-meta">
                    ${item.websiteUrl ? `Сайт: ${item.websiteUrl}<br>` : ''}
                    Класс: ${item.logoClass}<br>
                    Кликабельный: ${item.isClickable ? 'Да' : 'Нет'}<br>
                    Порядок: ${item.order || 'не указан'}
                </div>
                <div class="item-actions">
                    <button class="edit-btn" onclick="adminPanel.editPartner('${item.id}')">Редактировать</button>
                    <button class="delete-btn" onclick="adminPanel.deletePartner('${item.id}')">Удалить</button>
                </div>
            </div>
        `).join('');
    }

    showNewsForm(newsData = null) {
        const form = document.getElementById('newsForm');
        const submitBtn = document.getElementById('saveNewsBtn');
        
        if (newsData) {
            // Редактирование
            document.getElementById('newsId').value = newsData.id;
            document.getElementById('newsTitle').value = newsData.title;
            document.getElementById('newsText').value = newsData.text;
            document.getElementById('newsImage').value = newsData.imageUrl || '';
            document.getElementById('newsImageFile').value = '';
            document.getElementById('newsDate').value = newsData.eventDate || new Date().toISOString().split('T')[0];
            document.getElementById('newsOrder').value = newsData.order || '';
            
            // Показываем предварительный просмотр
            this.showImagePreview(newsData.imageUrl, 'newsPreviewImg', 'newsImagePreview');
            
            submitBtn.textContent = 'Обновить';
            this.editingId = newsData.id;
        } else {
            // Добавление
            form.reset();
            document.getElementById('newsId').value = '';
            document.getElementById('newsDate').value = new Date().toISOString().split('T')[0];
            document.getElementById('newsImagePreview').style.display = 'none';
            submitBtn.textContent = 'Добавить';
            this.editingId = null;
        }
        
        form.style.display = 'block';
        document.getElementById('newsTitle').focus();
    }

    hideNewsForm() {
        document.getElementById('newsForm').style.display = 'none';
        document.getElementById('newsForm').reset();
        document.getElementById('newsImagePreview').style.display = 'none';
        this.editingId = null;
    }

    async saveNews() {
        const title = document.getElementById('newsTitle').value.trim();
        const text = document.getElementById('newsText').value.trim();
        const imageUrl = document.getElementById('newsImage').value.trim();
        const eventDate = document.getElementById('newsDate').value;
        const order = document.getElementById('newsOrder').value;

        if (!title || !text || !eventDate) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        const newsData = { title, text, imageUrl, eventDate };
        if (order) newsData.order = parseInt(order);

        try {
            let response;
            if (this.editingId) {
                response = await fetch(`/api/admin/news/${this.editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newsData),
                });
            } else {
                response = await fetch('/api/admin/news', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newsData),
                });
            }

            if (response.ok) {
                this.showNotification(this.editingId ? 'Новость обновлена' : 'Новость добавлена', 'success');
                this.hideNewsForm();
                this.loadNews();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка сохранения новости:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    async editNews(id) {
        try {
            const response = await fetch('/api/admin/news');
            const news = await response.json();
            const newsItem = news.find(item => item.id === id);
            
            if (newsItem) {
                this.showNewsForm(newsItem);
            }
        } catch (error) {
            console.error('Ошибка загрузки новости для редактирования:', error);
        }
    }

    async deleteNews(id) {
        if (!confirm('Вы уверены, что хотите удалить эту новость?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/news/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.showNotification('Новость удалена', 'success');
                this.loadNews();
            } else {
                this.showNotification('Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления новости:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    showPartnerForm(partnerData = null) {
        const form = document.getElementById('partnersForm');
        const submitBtn = document.getElementById('savePartnerBtn');
        
        if (partnerData) {
            // Редактирование
            document.getElementById('partnerId').value = partnerData.id;
            document.getElementById('partnerName').value = partnerData.name;
            document.getElementById('partnerDescription').value = partnerData.description;
            document.getElementById('partnerLogo').value = partnerData.logoUrl || '';
            document.getElementById('partnerLogoFile').value = '';
            document.getElementById('partnerLogoClass').value = partnerData.logoClass || 'logo-standard';
            document.getElementById('partnerWebsite').value = partnerData.websiteUrl || '';
            document.getElementById('partnerClickable').checked = partnerData.isClickable !== false;
            document.getElementById('partnerOrder').value = partnerData.order || '';
            
            // Показываем предварительный просмотр
            this.showImagePreview(partnerData.logoUrl, 'partnerPreviewImg', 'partnerLogoPreview');
            
            submitBtn.textContent = 'Обновить';
            this.editingId = partnerData.id;
        } else {
            // Добавление
            form.reset();
            document.getElementById('partnerId').value = '';
            document.getElementById('partnerLogoClass').value = 'logo-standard';
            document.getElementById('partnerClickable').checked = true;
            document.getElementById('partnerLogoPreview').style.display = 'none';
            submitBtn.textContent = 'Добавить';
            this.editingId = null;
        }
        
        form.style.display = 'block';
        document.getElementById('partnerName').focus();
    }

    hidePartnerForm() {
        document.getElementById('partnersForm').style.display = 'none';
        document.getElementById('partnersForm').reset();
        document.getElementById('partnerLogoPreview').style.display = 'none';
        this.editingId = null;
    }

    async savePartner() {
        const name = document.getElementById('partnerName').value.trim();
        const description = document.getElementById('partnerDescription').value.trim();
        const logoUrl = document.getElementById('partnerLogo').value.trim();
        const logoClass = document.getElementById('partnerLogoClass').value;
        const websiteUrl = document.getElementById('partnerWebsite').value.trim();
        const isClickable = document.getElementById('partnerClickable').checked;
        const order = document.getElementById('partnerOrder').value;

        if (!name || !description) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        const partnerData = { name, description, logoUrl, logoClass, websiteUrl, isClickable };
        if (order) partnerData.order = parseInt(order);

        try {
            let response;
            if (this.editingId) {
                response = await fetch(`/api/admin/partners/${this.editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partnerData),
                });
            } else {
                response = await fetch('/api/admin/partners', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(partnerData),
                });
            }

            if (response.ok) {
                this.showNotification(this.editingId ? 'Партнер обновлен' : 'Партнер добавлен', 'success');
                this.hidePartnerForm();
                this.loadPartners();
            } else {
                const error = await response.json();
                this.showNotification(error.error || 'Ошибка сохранения', 'error');
            }
        } catch (error) {
            console.error('Ошибка сохранения партнера:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    async editPartner(id) {
        try {
            const response = await fetch('/api/admin/partners');
            const partners = await response.json();
            const partnerItem = partners.find(item => item.id === id);
            
            if (partnerItem) {
                this.showPartnerForm(partnerItem);
            }
        } catch (error) {
            console.error('Ошибка загрузки партнера для редактирования:', error);
        }
    }

    async deletePartner(id) {
        if (!confirm('Вы уверены, что хотите удалить этого партнера?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/partners/${id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                this.showNotification('Партнер удален', 'success');
                this.loadPartners();
            } else {
                this.showNotification('Ошибка удаления', 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления партнера:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }

    async handleImageUpload(event, type) {
        const file = event.target.files[0];
        if (!file) return;
        
        // Проверяем размер файла (5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.showNotification('Файл слишком большой (максимум 5MB)', 'error');
            return;
        }
        
        // Проверяем тип файла
        if (!file.type.startsWith('image/')) {
            this.showNotification('Можно загружать только изображения', 'error');
            return;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        formData.append('uploadType', type);
        
        try {
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                // Обновляем поле URL
                if (type === 'news') {
                    document.getElementById('newsImage').value = result.imageUrl;
                    this.showImagePreview(result.imageUrl, 'newsPreviewImg', 'newsImagePreview');
                } else {
                    document.getElementById('partnerLogo').value = result.imageUrl;
                    this.showImagePreview(result.imageUrl, 'partnerPreviewImg', 'partnerLogoPreview');
                }
                
                this.showNotification('Изображение успешно загружено', 'success');
            } else {
                this.showNotification(result.error || 'Ошибка загрузки', 'error');
            }
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            this.showNotification('Ошибка соединения с сервером', 'error');
        }
    }
    
    showImagePreview(imageUrl, imgId, containerId) {
        if (imageUrl) {
            document.getElementById(imgId).src = imageUrl;
            document.getElementById(containerId).style.display = 'block';
        } else {
            document.getElementById(containerId).style.display = 'none';
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация админ-панели
const adminPanel = new AdminPanel();