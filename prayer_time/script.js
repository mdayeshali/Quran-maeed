let userLat, userLon;

// 🚀 Page load হলে auto run
window.onload = function () {
    loadSavedData();   // আগে পুরাতন data দেখাবে
    getUserGPS();      // তারপর নতুন data fetch করার চেষ্টা করবে
};

// 📦 LocalStorage থেকে data load
function loadSavedData() {
    const saved = localStorage.getItem("prayerData");

    if (saved) {
        const data = JSON.parse(saved);
        showPrayer(data);
    }
}

// 📡 Auto Location
function getUserGPS() {
    if (!navigator.geolocation) {
        console.log("GPS নেই");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            userLat = pos.coords.latitude;
            userLon = pos.coords.longitude;

            try {
                // 🌍 Location name
                const geoRes = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLon}&format=json`
                );
                const geoData = await geoRes.json();

                const addr = geoData.address;

                const city =
                    addr.city ||
                    addr.town ||
                    addr.village ||
                    "Unknown";

                const state = addr.state || "";
                const country = addr.country || "";

                const locationText = `📍 ${city}, ${state}, ${country}`;
                document.getElementById("locationText").innerText = locationText;

                // 🕌 Prayer API
                const res = await fetch(
                    `https://api.aladhan.com/v1/timings?latitude=${userLat}&longitude=${userLon}`
                );

                const result = await res.json();

                // 👉 data save করুন
                localStorage.setItem("prayerData", JSON.stringify(result.data));
                localStorage.setItem("locationName", locationText);

                showPrayer(result.data);

            } catch (err) {
                console.log("API error", err);
            }
        },
        () => {
            console.log("লোকেশন বন্ধ");

            // ❗ Location না পেলে পুরাতন location নাম দেখান
            const savedLoc = localStorage.getItem("locationName");
            if (savedLoc) {
                document.getElementById("locationText").innerText = savedLoc;
            }
        }
    );
}

// 🕌 Show Prayer
function showPrayer(data) {
    const t = data.timings;

    document.getElementById("hijriDate").innerText =
        data.date.hijri.date + " হিজরি";

    document.getElementById("prayerList").innerHTML = `
        <div class="prayer"><span>ফজর</span><span>${t.Fajr}</span></div>
        <div class="prayer"><span>যোহর</span><span>${t.Dhuhr}</span></div>
        <div class="prayer"><span>আসর</span><span>${t.Asr}</span></div>
        <div class="prayer"><span>মাগরিব</span><span>${t.Maghrib}</span></div>
        <div class="prayer"><span>ইশা</span><span>${t.Isha}</span></div>
    `;

    updateNextPrayer(t);
}

// ⏳ Next Prayer + Countdown
function updateNextPrayer(timings) {

    const now = new Date();

    const prayerTimes = [
        {name: "ফজর", time: timings.Fajr},
        {name: "যোহর", time: timings.Dhuhr},
        {name: "আসর", time: timings.Asr},
        {name: "মাগরিব", time: timings.Maghrib},
        {name: "ইশা", time: timings.Isha}
    ];

    let next = null;
    let current = null;

    for (let i = 0; i < prayerTimes.length; i++) {

        let [h, m] = prayerTimes[i].time.split(":");
        let prayerDate = new Date();
        prayerDate.setHours(h, m, 0);

        if (now < prayerDate) {
            next = { ...prayerTimes[i], date: prayerDate };
            current = prayerTimes[i - 1] || prayerTimes[prayerTimes.length - 1];
            break;
        }
    }

    if (!next) {
        next = prayerTimes[0];
        current = prayerTimes[prayerTimes.length - 1];

        let [h, m] = next.time.split(":");
        let prayerDate = new Date();
        prayerDate.setDate(now.getDate() + 1);
        prayerDate.setHours(h, m, 0);
        next.date = prayerDate;
    }

    document.getElementById("currentPrayer").innerText =
        `বর্তমান: ${current.name} (${current.time})`;

    document.getElementById("nextPrayer").innerText =
        `👉 পরবর্তী: ${next.name} (${next.time})`;

    // ⏳ Countdown
    setInterval(() => {
        const diff = next.date - new Date();

        let h = Math.floor(diff / (1000 * 60 * 60));
        let m = Math.floor((diff / (1000 * 60)) % 60);
        let s = Math.floor((diff / 1000) % 60);

        document.getElementById("countdown").innerText =
            `⏳ ${h}h ${m}m ${s}s`;
    }, 1000);
}
