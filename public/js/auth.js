const signupForm = document.getElementById("signupForm");
const loginForm = document.getElementById("loginForm");

const showMessage = (message, success = false) => {
  const element = document.getElementById("authMessage");

  element.textContent = message;

  element.className = success ? "success" : "error";
};

// ===============================
// SIGNUP
// ===============================

if (signupForm) {
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          name,
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Signup failed");
      }

      showMessage("Account created successfully!", true);

      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    } catch (error) {
      showMessage(error.message);
    }
  });
}

// ===============================
// LOGIN
// ===============================

if (loginForm) {
  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Login failed");
      }

      showMessage("Login successful!", true);

      setTimeout(() => {
        window.location.href = "/chat";
      }, 500);
    } catch (error) {
      showMessage(error.message);
    }
  });
}
