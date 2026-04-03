let userLat, userLon;
let school = localStorage.getItem("madhab") || "1";

// 🚀 Load
window.onload = function () {
    loadSavedData();
    document.getElementById("madhabSelect").value = school;
    getUserGPS();
};

// 📦 Old Data
function loadSavedData() {
    const saved = localStorage.getItem("prayerData");
    const loc = localStorage.getItem("locationName");

    if (saved) showPrayer(JSON.parse(saved));
    if (loc) document.getElementById("locationText").innerText = loc;
}

// 📡 GPS
function getUserGPS() {
    navigator.geolocation.getCurrentPosition(
        async (pos) => {
            userLat = pos.coords.latitude;
            userLon = pos.coords.longitude;

            try {
                const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${userLat}&lon=${userLon}&format=json`);
                const g = await geo.json();

                const addr = g.address;
                const locText = `📍 ${addr.city || addr.town || addr.village || ""}, ${addr.state || ""}, ${addr.country || ""}`;

                document.getElementById("locationText").innerText = locText;
                localStorage.setItem("locationName", locText);

                const res = await fetch(`https://api.aladhan.com/v1/timings?latitude=${userLat}&longitude=${userLon}&school=${school}`);
                const data = await res.json();

                localStorage.setItem("prayerData", JSON.stringify(data.data));
                showPrayer(data.data);

            } catch {}
        },
        () => {}
    );
}

// 🕌 Show
function showPrayer(data) {
    const t = data.timings;

    const h = data.date.hijri;
    document.getElementById("hijriDate").innerText =
        `${h.day} ${h.month.en} ${h.year} হিজরি`;

    document.getElementById("banglaDate").innerText = getBanglaDate();

    document.getElementById("prayerList").innerHTML = `
        <div class="prayer"><span>ফজর</span><span>${t.Fajr}</span></div>
        <div class="prayer"><span>যোহর</span><span>${t.Dhuhr}</span></div>
        <div class="prayer"><span>আসর</span><span>${t.Asr}</span></div>
        <div class="prayer"><span>মাগরিব</span><span>${t.Maghrib}</span></div>
        <div class="prayer"><span>ইশা</span><span>${t.Isha}</span></div>
    `;

    updateNextPrayer(t);
}

// ⏳ Next Prayer
function updateNextPrayer(t) {
    const now = new Date();

    const list = [
        {name:"ফজর",time:t.Fajr},
        {name:"যোহর",time:t.Dhuhr},
        {name:"আসর",time:t.Asr},
        {name:"মাগরিব",time:t.Maghrib},
        {name:"ইশা",time:t.Isha}
    ];

    let next, current;

    for (let i=0;i<list.length;i++) {
        let [h,m]=list[i].time.split(":");
        let d=new Date();
        d.setHours(h,m,0);

        if(now<d){
            next={...list[i],date:d};
            current=list[i-1]||list[list.length-1];
            break;
        }
    }

    if(!next){
        next=list[0];
        current=list[list.length-1];
        let [h,m]=next.time.split(":");
        let d=new Date();
        d.setDate(now.getDate()+1);
        d.setHours(h,m,0);
        next.date=d;
    }

    document.getElementById("currentPrayer").innerText =
        `বর্তমান: ${current.name} (${current.time})`;

    document.getElementById("nextPrayer").innerText =
        `👉 পরবর্তী: ${next.name} (${next.time})`;

    setInterval(()=>{
        const diff=next.date-new Date();
        let h=Math.floor(diff/3600000);
        let m=Math.floor((diff/60000)%60);
        let s=Math.floor((diff/1000)%60);

        document.getElementById("countdown").innerText =
            `⏳ ${h}h ${m}m ${s}s`;
    },1000);
}

// ⚖️ Madhab
function changeMadhab(){
    school=document.getElementById("madhabSelect").value;
    localStorage.setItem("madhab",school);
    getUserGPS();
}

// 🇧🇩 Bangla Date
function getBanglaDate(){
    const d=new Date();
    const months=["বৈশাখ","জ্যৈষ্ঠ","আষাঢ়","শ্রাবণ","ভাদ্র","আশ্বিন","কার্তিক","অগ্রহায়ণ","পৌষ","মাঘ","ফাল্গুন","চৈত্র"];
    const start=new Date(d.getFullYear(),3,14);
    let diff=Math.floor((d-start)/86400000);
    if(diff<0) diff+=365;
    return `${(diff%30)+1} ${months[Math.floor(diff/30)]}`;
}
