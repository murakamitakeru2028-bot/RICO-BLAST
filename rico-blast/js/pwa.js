const PWAInstall = {
  deferredPrompt: null,
  installButton: null,

  init() {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("./sw.js").catch(() => {});
    }

    window.addEventListener("beforeinstallprompt", (event) => {
      event.preventDefault();
      this.deferredPrompt = event;
      this.refreshInstallButton();
    });

    window.addEventListener("appinstalled", () => {
      this.deferredPrompt = null;
      this.refreshInstallButton();
      if (typeof UI !== "undefined") UI.showToast("APP INSTALLED");
    });
  },

  isStandalone() {
    return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
  },

  bindInstallButton(button) {
    this.installButton = button;
    if (!button) return;
    button.addEventListener("click", () => this.promptInstall());
    this.refreshInstallButton();
  },

  refreshInstallButton() {
    if (!this.installButton) return;
    const canInstall = Boolean(this.deferredPrompt) && !this.isStandalone();
    this.installButton.hidden = !canInstall;
    this.installButton.parentElement?.classList.toggle("install-ready", canInstall);
  },

  promptInstall() {
    if (!this.deferredPrompt) {
      if (typeof UI !== "undefined") UI.showToast("INSTALL FROM BROWSER MENU");
      return;
    }
    const promptEvent = this.deferredPrompt;
    this.deferredPrompt = null;
    promptEvent.prompt();
    promptEvent.userChoice.finally(() => this.refreshInstallButton());
  }
};

window.addEventListener("load", () => PWAInstall.init());
