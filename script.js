const stage = document.getElementById("stage");
const card = document.getElementById("card");
const cord = document.getElementById("cord");
const hint = document.getElementById("hint");
const toast = document.getElementById("toast");
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

let lampOn = false;
let toastTimer = null;

function showToast(text, type) {
    toast.textContent = text;
    toast.className = "toast show " + (type || "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
        toast.classList.remove("show");
    }, 3200);
}

function setLamp(on) {
    lampOn = on;
    stage.classList.toggle("on", on);
    cord.setAttribute("aria-pressed", String(on));
    card.inert = !on;
    hint.textContent = on ? "Pull the cord again to turn off the light" : "Pull the cord to turn on the light";
}

function pullCord() {
    cord.classList.remove("pulled");
    void cord.getBoundingClientRect();
    cord.classList.add("pulled");
    setLamp(!lampOn);
    if (lampOn) {
        const first = document.querySelector(".form.active input");
        if (first) {
            setTimeout(() => first.focus({ preventScroll: true }), 600);
        }
    }
}

cord.addEventListener("click", pullCord);
cord.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        pullCord();
    }
});

function makeDust() {
    const dust = document.getElementById("dust");
    for (let i = 0; i < 26; i++) {
        const speck = document.createElement("span");
        speck.style.left = 8 + Math.random() * 60 + "%";
        speck.style.top = 22 + Math.random() * 62 + "%";
        speck.style.animationDelay = Math.random() * 8 + "s";
        speck.style.animationDuration = 6 + Math.random() * 8 + "s";
        speck.style.width = speck.style.height = 1 + Math.random() * 2.5 + "px";
        dust.appendChild(speck);
    }
}

const tabs = document.querySelectorAll(".tab");
const indicator = document.getElementById("indicator");
const titleEl = document.getElementById("title");
const subEl = document.getElementById("subtitle");

const TEXT = {
    login: ["Welcome Back", "Please enter your details to sign in"],
    signup: ["Create Account", "Join us by filling in the details below"]
};

function moveIndicator() {
    const active = document.querySelector(".tab.active");
    indicator.style.width = active.offsetWidth + "px";
    indicator.style.transform = "translateX(" + active.offsetLeft + "px)";
}

function switchTab(name) {
    tabs.forEach((tab) => {
        const on = tab.dataset.tab === name;
        tab.classList.toggle("active", on);
        tab.setAttribute("aria-selected", String(on));
    });
    document.getElementById("login-form").classList.toggle("active", name === "login");
    document.getElementById("signup-form").classList.toggle("active", name === "signup");
    titleEl.textContent = TEXT[name][0];
    subEl.textContent = TEXT[name][1];
    clearErrors();
    moveIndicator();
}

tabs.forEach((tab) => tab.addEventListener("click", () => switchTab(tab.dataset.tab)));
window.addEventListener("resize", moveIndicator);

function setError(id, message) {
    const box = document.getElementById(id + "-error");
    if (!box) {
        return;
    }
    box.textContent = message || "";
    const input = document.getElementById(id);
    if (input) {
        input.closest(".input-wrap") && input.closest(".input-wrap").classList.toggle("invalid", Boolean(message));
    }
}

function clearErrors() {
    document.querySelectorAll(".error").forEach((box) => {
        box.textContent = "";
    });
    document.querySelectorAll(".input-wrap.invalid").forEach((wrap) => wrap.classList.remove("invalid"));
}

document.querySelectorAll(".input-wrap input").forEach((input) => {
    input.addEventListener("input", () => setError(input.id, ""));
});

document.querySelectorAll(".eye").forEach((button) => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        button.classList.toggle("shown", show);
        button.setAttribute("aria-label", show ? "Hide password" : "Show password");
    });
});

function strength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
}

document.getElementById("signup-password").addEventListener("input", (event) => {
    const value = event.target.value;
    const score = value ? Math.max(1, strength(value)) : 0;
    const bar = document.getElementById("strength-bar");
    const text = document.getElementById("strength-text");
    const labels = ["Use letters, numbers and symbols", "Weak password", "Fair password", "Good password", "Strong password"];
    bar.style.width = score * 25 + "%";
    bar.dataset.level = score;
    text.textContent = labels[score];
});

function setBusy(form, busy) {
    const button = form.querySelector(".submit");
    button.disabled = busy;
    button.classList.toggle("busy", busy);
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

document.getElementById("login-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    clearErrors();

    let ok = true;
    if (!emailPattern.test(email)) {
        setError("login-email", "Enter a valid email address");
        ok = false;
    }
    if (!password) {
        setError("login-password", "Enter your password");
        ok = false;
    }
    if (!ok) {
        return;
    }

    setBusy(form, true);
    await wait(500);
    const result = await checkLogin(email, password);
    setBusy(form, false);

    if (!result.ok) {
        setError("login-" + result.field, result.message);
        showToast(result.message, "error");
        return;
    }
    setSession(result.user, document.getElementById("remember").checked);
    form.reset();
    document.getElementById("remember").checked = true;
    showWelcome();
    showToast("Signed in successfully", "success");
});

document.getElementById("signup-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const name = document.getElementById("signup-name").value.trim();
    const email = document.getElementById("signup-email").value.trim();
    const password = document.getElementById("signup-password").value;
    const confirm = document.getElementById("signup-confirm").value;
    const terms = document.getElementById("terms").checked;
    clearErrors();
    document.getElementById("terms-error").textContent = "";

    let ok = true;
    if (name.length < 2) {
        setError("signup-name", "Enter your full name");
        ok = false;
    }
    if (!emailPattern.test(email)) {
        setError("signup-email", "Enter a valid email address");
        ok = false;
    } else if (findUser(email)) {
        setError("signup-email", "This email is already registered");
        ok = false;
    }
    if (password.length < 8) {
        setError("signup-password", "Password must be at least 8 characters");
        ok = false;
    }
    if (confirm !== password) {
        setError("signup-confirm", "Passwords do not match");
        ok = false;
    }
    if (!terms) {
        document.getElementById("terms-error").textContent = "Please accept the terms to continue";
        ok = false;
    }
    if (!ok) {
        return;
    }

    setBusy(form, true);
    await wait(600);
    const user = await createUser(name, email, password);
    setBusy(form, false);

    if (!user) {
        showToast("Could not save your account in this browser", "error");
        return;
    }
    form.reset();
    document.getElementById("strength-bar").style.width = "0";
    document.getElementById("strength-text").textContent = "Use letters, numbers and symbols";
    switchTab("login");
    document.getElementById("login-email").value = user.email;
    document.getElementById("login-password").focus();
    showToast("Account created. Please sign in.", "success");
});

function showWelcome() {
    const session = getSession();
    const welcome = document.getElementById("welcome");
    const auth = document.getElementById("auth");
    if (!session) {
        welcome.hidden = true;
        auth.hidden = false;
        return;
    }
    document.getElementById("avatar").textContent = session.name.charAt(0).toUpperCase();
    document.getElementById("welcome-name").textContent = "Hello, " + session.name.split(" ")[0];
    document.getElementById("welcome-email").textContent = session.email;
    welcome.hidden = false;
    auth.hidden = true;
}

document.getElementById("logout").addEventListener("click", () => {
    clearSession();
    showWelcome();
    switchTab("login");
    showToast("You have been signed out", "success");
});

document.getElementById("forgot").addEventListener("click", () => {
    const email = document.getElementById("login-email").value.trim();
    if (!emailPattern.test(email)) {
        setError("login-email", "Enter your email first, then press Forgot password");
        return;
    }
    if (!findUser(email)) {
        setError("login-email", "No account found with this email");
        return;
    }
    const next = window.prompt("Enter a new password (at least 8 characters) for " + email);
    if (next === null) {
        return;
    }
    if (next.length < 8) {
        showToast("Password must be at least 8 characters", "error");
        return;
    }
    resetPassword(email, next).then((done) => {
        showToast(done ? "Password updated. You can sign in now." : "Could not update the password", done ? "success" : "error");
    });
});

document.querySelectorAll(".social-btn").forEach((button) => {
    button.addEventListener("click", () => {
        showToast(button.dataset.provider + " sign in is a demo and is not connected", "");
    });
});

makeDust();
moveIndicator();
showWelcome();
if (getSession()) {
    setLamp(true);
}
