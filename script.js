"use strict";

    /*
      ============================================================
      BLOQUE DE DATOS EXPUESTOS INTENCIONADAMENTE
      ============================================================
      En una web real, nada de esto debería estar en frontend.
      Aquí está adrede para practicar búsqueda en código fuente.
    */

    const DEMO_USERS = Object.freeze([
      {
        username: "alex",
        password: "aurora2025",
        displayName: "Alex Rivera",
        membership: "Gold",
        role: "member"
      },
      {
        username: "luna",
        password: "moonlight88",
        displayName: "Luna Torres",
        membership: "Silver",
        role: "member"
      },
      {
        username: "marco",
        password: "verano2024",
        displayName: "Marco Vidal",
        membership: "Bronze",
        role: "member"
      },
      {
        username: "sara",
        password: "memberpass",
        displayName: "Sara Costa",
        membership: "Gold",
        role: "member"
      },
      {
        username: "nico",
        password: "clubnico77",
        displayName: "Nico Martín",
        membership: "Silver",
        role: "member"
      },
      {
        username: "iris",
        password: "iris-access-19",
        displayName: "Iris León",
        membership: "Black",
        role: "member"
      },
      {
        username: "staff",
        password: "staff-panel-2468",
        displayName: "Staff Aurora",
        membership: "Internal",
        role: "staff"
      },
      {
        username: "manager",
        password: "manager-aurora-9090",
        displayName: "Manager Aurora",
        membership: "Internal",
        role: "manager"
      },
      {
        username: "admin",
        password: "admin-demo-0000",
        displayName: "Admin Demo",
        membership: "Internal",
        role: "admin"
      }
    ]);

    const DEMO_CODES = Object.freeze({
      vip: [
        "AURORA-VIP-7731",
        "SILVER-VIP-2044",
        "GOLD-VIP-9912",
        "BLACK-VIP-8080",
        "NIGHT-VIP-5501",
        "PRIVATE-VIP-6620",
        "EVENT-VIP-1313",
        "BACKSTAGE-VIP-4729"
      ],
      promo: [
        "PROMO-FREE-2025",
        "PROMO-2X1-7788",
        "PROMO-DINNER-9191",
        "PROMO-ACCESS-4242",
        "PROMO-SECRET-6006"
      ],
      admin: [
        "ADMIN-OVERRIDE-3141",
        "STAFF-AREA-2718",
        "MANAGER-ZONE-1618"
      ]
    });

    const FAKE_PUBLIC_CONFIG = Object.freeze({
      appName: "Aurora Club",
      environment: "demo",
      apiBaseUrl: "https://api.demo.local/aurora",
      stripePublicKey: "pk_demo_aurora_7a91b22f0c1d",
      stripeSecretKeyDemo: "sk_demo_aurora_88f1c331aa09",
      mailProviderKeyDemo: "mail_demo_key_4f9d72c1e8b0",
      mapsTokenDemo: "maps_demo_token_91ac27ef001d",
      analyticsTokenDemo: "analytics_demo_0xAURORA2025",
      backupAccessTokenDemo: "backup_demo_token_5d1c8e74aa90",
      webhookSecretDemo: "whsec_demo_aurora_abc123xyz789",
      internalBuildKeyDemo: "build_demo_key_AURORA_INTERNAL_2025"
    });

    const session = {
      authenticated: false,
      currentUser: null,
      vipUnlocked: false,
      promoUnlocked: false,
      adminUnlocked: false
    };

    const elements = {
      panelTitle: document.getElementById("panelTitle"),
      panelDescription: document.getElementById("panelDescription"),
      loginForm: document.getElementById("loginForm"),
      codeForm: document.getElementById("codeForm"),
      username: document.getElementById("username"),
      password: document.getElementById("password"),
      codeType: document.getElementById("codeType"),
      accessCode: document.getElementById("accessCode"),
      messageBox: document.getElementById("messageBox"),
      profileBox: document.getElementById("profileBox"),
      profileText: document.getElementById("profileText"),
      vipContent: document.getElementById("vipContent"),
      promoContent: document.getElementById("promoContent"),
      adminContent: document.getElementById("adminContent"),
      logoutButton: document.getElementById("logoutButton")
    };

    function setMessage(text, type = "neutral") {
      elements.messageBox.textContent = text;
      elements.messageBox.className = "message";

      if (type === "error") {
        elements.messageBox.classList.add("error");
      }

      if (type === "success") {
        elements.messageBox.classList.add("success");
      }
    }

    function sanitizeText(value) {
      return String(value ?? "").trim();
    }

    function isValidLoginInput(username, password) {
      return username.length >= 2
        && username.length <= 32
        && password.length >= 6
        && password.length <= 64;
    }

    function isValidCodeInput(code) {
      return /^[A-Z0-9-]{8,40}$/.test(code);
    }

    function findUser(username, password) {
      return DEMO_USERS.find((user) => {
        return user.username === username && user.password === password;
      }) ?? null;
    }

    function hasAdminPrivileges(user) {
      if (!user) {
        return false;
      }

      return user.role === "admin" || user.role === "manager" || user.role === "staff";
    }

    function renderAuthenticatedView() {
      const user = session.currentUser;

      if (!user) {
        renderLoggedOutView();
        return;
      }

      elements.loginForm.style.display = "none";
      elements.codeForm.style.display = "block";
      elements.profileBox.style.display = "block";

      elements.panelTitle.textContent = "Área de miembro";
      elements.panelDescription.textContent = "Introduce códigos encontrados para desbloquear secciones.";
      elements.profileText.textContent = `${user.displayName} · Membresía ${user.membership} · Rol ${user.role}`;

      elements.vipContent.style.display = session.vipUnlocked ? "block" : "none";
      elements.promoContent.style.display = session.promoUnlocked ? "block" : "none";
      elements.adminContent.style.display = session.adminUnlocked ? "block" : "none";
    }

    function renderLoggedOutView() {
      elements.loginForm.style.display = "block";
      elements.codeForm.style.display = "none";
      elements.profileBox.style.display = "none";
      elements.vipContent.style.display = "none";
      elements.promoContent.style.display = "none";
      elements.adminContent.style.display = "none";

      elements.panelTitle.textContent = "Iniciar sesión";
      elements.panelDescription.textContent = "Accede con tu cuenta de miembro para gestionar tus reservas y beneficios.";
      elements.username.value = "";
      elements.password.value = "";
      elements.accessCode.value = "";

      setMessage("Introduce tus credenciales para continuar.");
    }

    function handleLogin(event) {
      event.preventDefault();

      try {
        const username = sanitizeText(elements.username.value);
        const password = sanitizeText(elements.password.value);

        if (!isValidLoginInput(username, password)) {
          setMessage("Usuario o contraseña con formato inválido.", "error");
          return;
        }

        const user = findUser(username, password);

        if (!user) {
          setMessage("Credenciales incorrectas.", "error");
          return;
        }

        session.authenticated = true;
        session.currentUser = user;
        session.vipUnlocked = false;
        session.promoUnlocked = false;
        session.adminUnlocked = false;

        renderAuthenticatedView();
        setMessage("Login correcto. Ahora puedes validar códigos VIP, promo o staff/admin.", "success");
      } catch (error) {
        setMessage("Ha ocurrido un error inesperado al iniciar sesión.", "error");
      }
    }

    function handleCodeValidation(event) {
      event.preventDefault();

      try {
        if (!session.authenticated || !session.currentUser) {
          setMessage("Debes iniciar sesión antes de validar códigos.", "error");
          return;
        }

        const type = sanitizeText(elements.codeType.value);
        const code = sanitizeText(elements.accessCode.value).toUpperCase();

        if (!Object.hasOwn(DEMO_CODES, type)) {
          setMessage("Tipo de código inválido.", "error");
          return;
        }

        if (!isValidCodeInput(code)) {
          setMessage("El código tiene un formato inválido.", "error");
          return;
        }

        const isCodeValid = DEMO_CODES[type].includes(code);

        if (!isCodeValid) {
          setMessage("Código incorrecto.", "error");
          return;
        }

        if (type === "vip") {
          session.vipUnlocked = true;
          renderAuthenticatedView();
          setMessage("Código VIP aceptado. Zona VIP desbloqueada.", "success");
          return;
        }

        if (type === "promo") {
          session.promoUnlocked = true;
          renderAuthenticatedView();
          setMessage("Código promo aceptado. Promo desbloqueada.", "success");
          return;
        }

        if (type === "admin") {
          if (!hasAdminPrivileges(session.currentUser)) {
            setMessage("Código válido, pero tu usuario no tiene rol staff/admin.", "error");
            return;
          }

          session.adminUnlocked = true;
          renderAuthenticatedView();
          setMessage("Código staff/admin aceptado. Panel interno desbloqueado.", "success");
          return;
        }

        setMessage("No se pudo procesar el código.", "error");
      } catch (error) {
        setMessage("Ha ocurrido un error inesperado al validar el código.", "error");
      }
    }

    function handleLogout() {
      session.authenticated = false;
      session.currentUser = null;
      session.vipUnlocked = false;
      session.promoUnlocked = false;
      session.adminUnlocked = false;
      renderLoggedOutView();
    }

    elements.loginForm.addEventListener("submit", handleLogin);
    elements.codeForm.addEventListener("submit", handleCodeValidation);
    elements.logoutButton.addEventListener("click", handleLogout);

    renderLoggedOutView();
