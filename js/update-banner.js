async function loadPartials() {
  try {
    const headerReq = await fetch("/header.html");
    const footerReq = await fetch("/footer.html");

    if (headerReq.ok && footerReq.ok) {
      const headerHTML = await headerReq.text();
      const footerHTML = await footerReq.text();

      document.body.insertAdjacentHTML("afterbegin", headerHTML);
      document.body.insertAdjacentHTML("beforeend", footerHTML);

      initNavMenu();       
      initThemeToggle();   
      initInstallBtn();    
      initNavDropdown();
    }

    // 📢 Hero Update Banner লোড করার কোড
    const heroBox = document.getElementById("heroUpdateBox");
    if (heroBox) {
      const bannerReq = await fetch("/update-banner.html");
      if (bannerReq.ok) {
        heroBox.innerHTML = await bannerReq.text();
      }
    }

  } catch (err) {
    console.error("Partial loading failed:", err);
  }
}
