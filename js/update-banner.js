/* =======================================================
   📢 Auto-load Update Banner from include/update-banner.html
========================================================= */
async function loadUpdateBanner() {
  const heroBox = document.getElementById("heroUpdateBox");
  if (!heroBox) return;

  try {
    const res = await fetch("/include/update-banner.html");
    if (!res.ok) {
      throw new Error(`Banner file load failed with status: ${res.status}`);
    }
    const htmlData = await res.text();
    heroBox.innerHTML = htmlData;
  } catch (err) {
    console.error("Update banner loading error:", err);
  }
}

// DOM লোড সম্পন্ন হলে ফাংশন চালু করা
document.addEventListener("DOMContentLoaded", loadUpdateBanner);
