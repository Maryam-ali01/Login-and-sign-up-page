const USERS_KEY = "lamp_users";
const SESSION_KEY = "lamp_session";

function readJSON(store, key, fallback) {
    try {
        const raw = store.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
        return fallback;
    }
}

function writeJSON(store, key, value) {
    try {
        store.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        return false;
    }
}

function getUsers() {
    return readJSON(localStorage, USERS_KEY, []);
}

function findUser(email) {
    const wanted = email.trim().toLowerCase();
    return getUsers().find((user) => user.email === wanted) || null;
}

async function hashPassword(password) {
    if (window.crypto && window.crypto.subtle) {
        const bytes = new TextEncoder().encode("lamp:" + password);
        const digest = await window.crypto.subtle.digest("SHA-256", bytes);
        return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    let hash = 5381;
    const text = "lamp:" + password;
    for (let i = 0; i < text.length; i++) {
        hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
    }
    return "x" + String(hash);
}

async function createUser(name, email, password) {
    const users = getUsers();
    const user = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: await hashPassword(password),
        createdAt: new Date().toISOString()
    };
    users.push(user);
    return writeJSON(localStorage, USERS_KEY, users) ? user : null;
}

async function checkLogin(email, password) {
    const user = findUser(email);
    if (!user) {
        return { ok: false, field: "email", message: "No account found with this email" };
    }
    if (user.password !== (await hashPassword(password))) {
        return { ok: false, field: "password", message: "Incorrect password" };
    }
    return { ok: true, user: user };
}

function setSession(user, remember) {
    const data = { name: user.name, email: user.email, at: Date.now() };
    clearSession();
    writeJSON(remember ? localStorage : sessionStorage, SESSION_KEY, data);
}

function getSession() {
    return readJSON(sessionStorage, SESSION_KEY, null) || readJSON(localStorage, SESSION_KEY, null);
}

function clearSession() {
    try {
        sessionStorage.removeItem(SESSION_KEY);
        localStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error(error);
    }
}

function resetPassword(email, password) {
    return hashPassword(password).then((hashed) => {
        const users = getUsers();
        const user = users.find((u) => u.email === email.trim().toLowerCase());
        if (!user) {
            return false;
        }
        user.password = hashed;
        return writeJSON(localStorage, USERS_KEY, users);
    });
}
