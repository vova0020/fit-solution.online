const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Настройка multer для загрузки файлов
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadType = req.body.uploadType || 'news';
        const dir = uploadType === 'partners' ? './images/Partners/' : './images/baner/';
        
        // Создаем папку если не существует
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        // Генерируем уникальное имя файла
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB лимит
    },
    fileFilter: function (req, file, cb) {
        // Проверяем тип файла
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения разрешены!'), false);
        }
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('.'));

// Загрузка конфигурации
let config;
try {
    config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
} catch (error) {
    console.error('Ошибка загрузки config.json:', error);
    process.exit(1);
}

// Настройка сессий
app.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // для HTTP
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// Middleware для проверки авторизации
const checkAuth = (req, res, next) => {
    if (req.session.isLoggedIn) {
        next();
    } else {
        res.status(401).json({ error: 'Необходима авторизация' });
    }
};

// Функции для работы с данными
const readContent = () => {
    try {
        const data = fs.readFileSync('./data/content.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Ошибка чтения content.json:', error);
        return { news: [], partners: [] };
    }
};

const writeContent = (content) => {
    try {
        fs.writeFileSync('./data/content.json', JSON.stringify(content, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка записи content.json:', error);
        return false;
    }
};

const deleteImageFile = (imageUrl) => {
    if (!imageUrl || !imageUrl.startsWith('/images/')) return;
    
    try {
        const filePath = '.' + imageUrl;
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Удален файл:', filePath);
        }
    } catch (error) {
        console.error('Ошибка удаления файла:', error);
    }
};

const reorderItems = (items, newOrder, currentId = null) => {
    // Если порядок не указан, ставим в конец
    if (!newOrder) {
        return Math.max(0, ...items.map(item => item.order || 0)) + 1;
    }
    
    // Проверяем конфликты порядка
    const conflictItems = items.filter(item => 
        item.order === newOrder && item.id !== currentId
    );
    
    if (conflictItems.length > 0) {
        // Сдвигаем все элементы с таким же или большим порядком на +1
        items.forEach(item => {
            if (item.id !== currentId && item.order >= newOrder) {
                item.order = (item.order || 0) + 1;
            }
        });
    }
    
    return newOrder;
};

// Маршрут для админ-панели
app.get('/admin', (req, res) => {
    res.redirect('/admin/admin.html');
});

// Публичные API маршруты
app.get('/api/content', (req, res) => {
    const content = readContent();
    // Сортируем по порядку перед отправкой
    if (content.news) {
        content.news.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    if (content.partners) {
        content.partners.sort((a, b) => (a.order || 0) - (b.order || 0));
    }
    res.json(content);
});

// Маршруты аутентификации
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    
    if (username === config.adminUser) {
        try {
            const isValid = await bcrypt.compare(password, config.adminPassHash);
            if (isValid) {
                req.session.isLoggedIn = true;
                res.json({ success: true, message: 'Успешная авторизация' });
            } else {
                res.status(401).json({ error: 'Неверный пароль' });
            }
        } catch (error) {
            res.status(500).json({ error: 'Ошибка сервера' });
        }
    } else {
        res.status(401).json({ error: 'Неверный логин' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            res.status(500).json({ error: 'Ошибка при выходе' });
        } else {
            res.json({ success: true, message: 'Успешный выход' });
        }
    });
});

app.get('/api/check-auth', (req, res) => {
    res.json({ authenticated: !!req.session.isLoggedIn });
});

// Админ API для новостей
app.get('/api/admin/news', checkAuth, (req, res) => {
    const content = readContent();
    res.json(content.news);
});

app.post('/api/admin/news', checkAuth, (req, res) => {
    const { title, text, imageUrl, eventDate, order } = req.body;
    
    if (!title || !text) {
        return res.status(400).json({ error: 'Заголовок и текст обязательны' });
    }
    
    const content = readContent();
    const newOrder = reorderItems(content.news, order ? parseInt(order) : null);
    
    const newNews = {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        eventDate: eventDate || new Date().toISOString().split('T')[0],
        title,
        text,
        imageUrl: imageUrl || '',
        order: newOrder
    };
    
    content.news.push(newNews);
    content.news.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (writeContent(content)) {
        res.json(newNews);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

app.put('/api/admin/news/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const { title, text, imageUrl, eventDate, order } = req.body;
    
    if (!title || !text) {
        return res.status(400).json({ error: 'Заголовок и текст обязательны' });
    }
    
    const content = readContent();
    const newsIndex = content.news.findIndex(item => item.id === id);
    
    if (newsIndex === -1) {
        return res.status(404).json({ error: 'Новость не найдена' });
    }
    
    const oldImageUrl = content.news[newsIndex].imageUrl;
    const newImageUrl = imageUrl || '';
    
    // Удаляем старое изображение, если оно изменилось
    if (oldImageUrl && oldImageUrl !== newImageUrl && oldImageUrl.includes('/baner/')) {
        deleteImageFile(oldImageUrl);
    }
    
    const newOrder = order !== undefined ? reorderItems(content.news, parseInt(order), id) : (content.news[newsIndex].order || 0);
    
    content.news[newsIndex] = {
        ...content.news[newsIndex],
        title,
        text,
        imageUrl: newImageUrl,
        eventDate: eventDate || content.news[newsIndex].eventDate,
        order: newOrder
    };
    
    content.news.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (writeContent(content)) {
        res.json(content.news[newsIndex]);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

app.delete('/api/admin/news/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const content = readContent();
    
    const newsItem = content.news.find(item => item.id === id);
    if (newsItem && newsItem.imageUrl) {
        deleteImageFile(newsItem.imageUrl);
    }
    
    content.news = content.news.filter(item => item.id !== id);
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// Админ API для партнеров
app.get('/api/admin/partners', checkAuth, (req, res) => {
    const content = readContent();
    res.json(content.partners);
});

app.post('/api/admin/partners', checkAuth, (req, res) => {
    const { name, description, logoUrl, logoClass, websiteUrl, isClickable, order } = req.body;
    
    if (!name || !description) {
        return res.status(400).json({ error: 'Название и описание обязательны' });
    }
    
    const content = readContent();
    const newOrder = reorderItems(content.partners, order ? parseInt(order) : null);
    
    const newPartner = {
        id: 'partner_' + Date.now(),
        name,
        description,
        logoUrl: logoUrl || '',
        logoClass: logoClass || 'logo-standard',
        websiteUrl: websiteUrl || '',
        isClickable: isClickable !== false,
        order: newOrder
    };
    
    content.partners.push(newPartner);
    content.partners.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (writeContent(content)) {
        res.json(newPartner);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

app.put('/api/admin/partners/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const { name, description, logoUrl, logoClass, websiteUrl, isClickable, order } = req.body;
    
    if (!name || !description) {
        return res.status(400).json({ error: 'Название и описание обязательны' });
    }
    
    const content = readContent();
    const partnerIndex = content.partners.findIndex(item => item.id === id);
    
    if (partnerIndex === -1) {
        return res.status(404).json({ error: 'Партнер не найден' });
    }
    
    const oldLogoUrl = content.partners[partnerIndex].logoUrl;
    const newLogoUrl = logoUrl || '';
    
    // Удаляем старый логотип, если он изменился
    if (oldLogoUrl && oldLogoUrl !== newLogoUrl && oldLogoUrl.includes('/Partners/')) {
        deleteImageFile(oldLogoUrl);
    }
    
    const newOrder = order !== undefined ? reorderItems(content.partners, parseInt(order), id) : (content.partners[partnerIndex].order || 0);
    
    content.partners[partnerIndex] = {
        ...content.partners[partnerIndex],
        name,
        description,
        logoUrl: newLogoUrl,
        logoClass: logoClass || 'logo-standard',
        websiteUrl: websiteUrl || '',
        isClickable: isClickable !== false,
        order: newOrder
    };
    
    content.partners.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    if (writeContent(content)) {
        res.json(content.partners[partnerIndex]);
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

app.delete('/api/admin/partners/:id', checkAuth, (req, res) => {
    const { id } = req.params;
    const content = readContent();
    
    const partnerItem = content.partners.find(item => item.id === id);
    if (partnerItem && partnerItem.logoUrl) {
        deleteImageFile(partnerItem.logoUrl);
    }
    
    content.partners = content.partners.filter(item => item.id !== id);
    
    if (writeContent(content)) {
        res.json({ success: true });
    } else {
        res.status(500).json({ error: 'Ошибка сохранения' });
    }
});

// Загрузка изображений
app.post('/api/admin/upload', checkAuth, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }
        
        const uploadType = req.body.uploadType || 'news';
        const relativePath = uploadType === 'partners' 
            ? `/images/Partners/${req.file.filename}`
            : `/images/baner/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            imageUrl: relativePath,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

// Обработка ошибок multer
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'Файл слишком большой (максимум 5MB)' });
        }
    }
    if (error.message === 'Только изображения разрешены!') {
        return res.status(400).json({ error: error.message });
    }
    next(error);
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    // console.log(`Публичный сайт: http://localhost:${PORT}/`);
    // console.log(`Админ-панель: http://localhost:${PORT}/admin`);
    // console.log(`Логин: admin, Пароль: admin123`);
});