const express = require('express');
const fs = require('fs');

const app = express();
const PORT = 3000;
const USERS_FILE = './users.json';

// Встроенный парсер JSON и URL-encoded данных
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Логирование запросов и очистка URL
app.use((req, res, next) => {
    // Убираем символы новой строки и другие лишние символы в URL
    req.url = req.url.replace(/%0A/g, '').replace(/\n/g, '').replace(/\r/g, '');
    // console.log(`Cleaned URL: "${req.url}"`); // Логируем очищенный URL
    next();
});

// Функция для чтения данных из файла
function readUsersFromFile() {
    try {
        const data = fs.readFileSync(USERS_FILE, 'utf-8');
        return JSON.parse(data); // Преобразование строки JSON в объект
    } catch (error) {
        console.error("Error reading file:", error);
        return [];
    }
}

// Функция для записи данных в файл
function writeUsersToFile(users) {
    try {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    } catch (error) {
        console.error("Error writing to file:", error);
    }
}

// GET: Получить всех пользователей
app.get('/users', (req, res) => {
    const users = readUsersFromFile();
    res.json(users);
});

// GET: Получить пользователя по ID
app.get('/users/:id', (req, res) => {
    const users = readUsersFromFile();
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (user) {
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

// POST: Создать нового пользователя
app.post('/users', (req, res) => {
    console.log("=== START POST /users ===");
    // console.log("Request Headers:", req.headers);
    console.log("Request Body:", req.body);

    const users = readUsersFromFile();
    // console.log("Current Users from File:", users);

    // Проверка обязательных полей
    if (!req.body.name || !req.body.age || !req.body.email) {
        console.log("Validation failed: Missing required fields");
        return res.status(400).json({ message: "All fields (name, age, email) are required." });
    }

    const newUser = {
        id: users.length > 0 ? users[users.length - 1].id + 1 : 1,
        name: req.body.name,
        age: req.body.age,
        email: req.body.email,
    };

    console.log("New User to Add:", newUser);

    users.push(newUser);
    // console.log("Updated Users List:", users);

    try {
        writeUsersToFile(users);
        console.log("Users successfully written to file.");
        res.status(201).json(newUser); // Отправляем новый объект как ответ
    } catch (error) {
        console.error("Error writing users to file:", error);
        res.status(500).json({ message: "Failed to write users to file." });
    }

    console.log("=== END POST /users ===");
});


app.put('/users/:id', (req, res) => {
    const users = readUsersFromFile();
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));

    if (userIndex !== -1) {
        // Обновляем данные пользователя
        users[userIndex] = {
            ...users[userIndex],
            ...req.body, // Обновление данных пользователя
        };

        // Записываем обновлённый список в файл
        try {
            writeUsersToFile(users);
            console.log(`User with ID ${req.params.id} successfully updated to file.`);
            res.json(users[userIndex]);
        } catch (error) {
            console.error("Error writing users to file:", error);
            res.status(500).json({ message: "Failed to write users to file." });
        }
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});


// DELETE: Удалить пользователя по ID
app.delete('/users/:id', (req, res) => {
    const users = readUsersFromFile();
    const userId = parseInt(req.params.id); // Получаем ID пользователя из URL

    // Находим индекс пользователя в массиве по ID
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        // Удаляем пользователя
        const deletedUser = users.splice(userIndex, 1);
        // Записываем обновленный список пользователей в файл
        writeUsersToFile(users);

        console.log(`User with ID ${userId} deleted.`);
        res.json(deletedUser); // Отправляем удаленного пользователя в ответе
    } else {
        console.log(`User with ID ${userId} not found.`);
        res.status(404).json({ message: 'User not found' });
    }
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

