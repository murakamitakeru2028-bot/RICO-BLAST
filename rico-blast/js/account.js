const AccountManager = {
  accountsKey: "ricoBlast_accounts",
  currentAccountKey: "ricoBlast_currentAccountId",
  localClientIdKey: "ricoBlast_googleClientId",
  initializedClientId: null,
  googleScriptPromise: null,

  getClientId() {
    const configured = typeof window !== "undefined" && window.RICO_BLAST_GOOGLE_CLIENT_ID
      ? String(window.RICO_BLAST_GOOGLE_CLIENT_ID).trim()
      : "";
    const local = localStorage.getItem(this.localClientIdKey) || "";
    return configured || local.trim();
  },

  isConfigured() {
    const clientId = this.getClientId();
    return clientId.length > 0 && clientId !== "YOUR_GOOGLE_CLIENT_ID";
  },

  saveLocalClientId(clientId) {
    const clean = String(clientId || "").trim();
    if (clean) localStorage.setItem(this.localClientIdKey, clean);
    else localStorage.removeItem(this.localClientIdKey);
    this.initializedClientId = null;
    return clean;
  },

  getAccounts() {
    try {
      const accounts = JSON.parse(localStorage.getItem(this.accountsKey) || "{}");
      return accounts && typeof accounts === "object" ? accounts : {};
    } catch (error) {
      return {};
    }
  },

  saveAccounts(accounts) {
    localStorage.setItem(this.accountsKey, JSON.stringify(accounts));
  },

  getCurrentAccountId() {
    return localStorage.getItem(this.currentAccountKey) || "";
  },

  getCurrentAccount() {
    const id = this.getCurrentAccountId();
    if (!id) return null;
    return this.getAccounts()[id] || null;
  },

  setCurrentAccountId(id) {
    if (id) localStorage.setItem(this.currentAccountKey, id);
    else localStorage.removeItem(this.currentAccountKey);
  },

  decodeCredential(credential) {
    if (!credential || typeof credential !== "string") return null;
    const parts = credential.split(".");
    if (parts.length < 2) return null;
    try {
      const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
      const bytes = Uint8Array.from(atob(padded), (char) => char.charCodeAt(0));
      const json = new TextDecoder().decode(bytes);
      return JSON.parse(json);
    } catch (error) {
      return null;
    }
  },

  defaultUsername(profile) {
    const source = profile && (profile.name || profile.email) ? profile.name || profile.email : "PLAYER";
    const clean = String(source)
      .split("@")[0]
      .replace(/[^a-zA-Z0-9_-]/g, "")
      .slice(0, 12)
      .toUpperCase();
    return clean || "PLAYER";
  },

  createOrUpdateFromCredential(credential) {
    const profile = this.decodeCredential(credential);
    if (!profile || !profile.sub) {
      throw new Error("Invalid Google credential");
    }
    const id = `google:${profile.sub}`;
    const accounts = this.getAccounts();
    const now = new Date().toISOString();
    const previous = accounts[id] || {};
    accounts[id] = {
      id,
      provider: "google",
      googleSub: profile.sub,
      email: profile.email || previous.email || "",
      googleName: profile.name || previous.googleName || "",
      picture: profile.picture || previous.picture || "",
      username: previous.username || this.defaultUsername(profile),
      highScore: Number(previous.highScore || 0),
      bestBlocks: Number(previous.bestBlocks || 0),
      bestRun: previous.bestRun || null,
      createdAt: previous.createdAt || now,
      updatedAt: now
    };
    this.saveAccounts(accounts);
    this.setCurrentAccountId(id);
    return accounts[id];
  },

  saveUsername(username) {
    const account = this.getCurrentAccount();
    if (!account) throw new Error("No account");
    const clean = String(username || "").trim().replace(/\s+/g, " ").slice(0, 16);
    if (clean.length < 2) throw new Error("Username too short");
    const accounts = this.getAccounts();
    accounts[account.id] = {
      ...account,
      username: clean,
      updatedAt: new Date().toISOString()
    };
    this.saveAccounts(accounts);
    return accounts[account.id];
  },

  signOut() {
    this.setCurrentAccountId("");
    if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
      google.accounts.id.disableAutoSelect();
    }
  },

  recordRun(run) {
    const account = this.getCurrentAccount();
    if (!account || !run) return null;
    const score = Math.floor(Number(run.score || 0));
    const blocksDestroyed = Math.floor(Number(run.blocksDestroyed || 0));
    const accounts = this.getAccounts();
    const previous = accounts[account.id] || account;
    const isBest = score >= Number(previous.highScore || 0);
    accounts[account.id] = {
      ...previous,
      highScore: Math.max(Number(previous.highScore || 0), score),
      bestBlocks: Math.max(Number(previous.bestBlocks || 0), blocksDestroyed),
      bestRun: isBest
        ? {
          score,
          blocksDestroyed,
          date: run.date || new Date().toISOString(),
          skills: run.skills || null
        }
        : previous.bestRun || null,
      updatedAt: new Date().toISOString()
    };
    this.saveAccounts(accounts);
    return accounts[account.id];
  },

  loadGoogleSignIn() {
    if (typeof google !== "undefined" && google.accounts && google.accounts.id) {
      return Promise.resolve(true);
    }
    if (this.googleScriptPromise) return this.googleScriptPromise;

    this.googleScriptPromise = new Promise((resolve, reject) => {
      if (typeof document === "undefined") {
        reject(new Error("Google sign-in script is unavailable"));
        return;
      }

      const existing = document.querySelector('script[data-rico-google-signin="true"]');
      if (existing) {
        existing.addEventListener("load", () => resolve(true), { once: true });
        existing.addEventListener("error", () => reject(new Error("Google sign-in script failed to load")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.ricoGoogleSignin = "true";
      script.onload = () => resolve(true);
      script.onerror = () => {
        this.googleScriptPromise = null;
        reject(new Error("Google sign-in script failed to load"));
      };
      document.head.appendChild(script);
    });

    return this.googleScriptPromise;
  },

  renderGoogleButton(container, onSuccess, onError) {
    if (!container || !this.isConfigured()) return false;
    if (typeof google === "undefined" || !google.accounts || !google.accounts.id) {
      this.loadGoogleSignIn()
        .then(() => this.renderGoogleButton(container, onSuccess, onError))
        .catch((error) => {
          if (onError) onError(error.message);
        });
      if (onError) onError("Loading Google");
      return false;
    }
    const clientId = this.getClientId();
    if (this.initializedClientId !== clientId) {
      google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => {
          try {
            const account = this.createOrUpdateFromCredential(response.credential);
            if (onSuccess) onSuccess(account);
          } catch (error) {
            if (onError) onError(error.message);
          }
        }
      });
      this.initializedClientId = clientId;
    }
    container.innerHTML = "";
    google.accounts.id.renderButton(container, {
      theme: "filled_black",
      size: "large",
      shape: "rectangular",
      text: "signin_with",
      width: Math.min(300, Math.max(220, container.clientWidth || 260))
    });
    return true;
  }
};
