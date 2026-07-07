document.addEventListener('DOMContentLoaded', () => {
    const surahSelect = document.getElementById('surah-select');
    const surahInfo = document.getElementById('surah-info');
    const ayahList = document.getElementById('ayah-list');
    
    // ডোমেইন বা লোকাল পাথ অনুযায়ী পরিবর্তন করে নিতে পারেন
    const BN_JSON_PATH = 'data/quran-bn.json'; 
    const AR_JSON_PATH = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranic.json'; // উদাহরণ হিসেবে একটি পাবলিক ডোমেইন আরবি API

    let quranBanglaData = [];
    let quranArabicData = [];

    // ডেটা লোড করার ফাংশন
    async function loadQuranData() {
        try {
            // দুটি জেসন ফাইল একসাথে লোড করা হচ্ছে
            const [resBn, resAr] = await Promise.all([
                fetch(BN_JSON_PATH),
                fetch(AR_JSON_PATH)
            ]);

            quranBanglaData = await resBn.json();
            const arDataRaw = await resAr.json();
            
            // পাবলিক জেসন স্ট্রাকচার অনুযায়ী ডেটা প্রসেস (যদি প্রয়োজন হয়)
            // এখানে সাধারণ এরে ফরম্যাট ধরে নেওয়া হয়েছে
            quranArabicData = arDataRaw.quran || arDataRaw; 

            // ড্রপডাউনে সূরাগুলোর নাম যোগ করা
            initSurahSelect();
        } catch (error) {
            console.error('ডেটা লোড করতে সমস্যা হয়েছে:', error);
            ayahList.innerHTML = '<div class="welcome-msg" style="color:red;">কুরআন ডেটা লোড করতে ব্যর্থ হয়েছে। দয়া করে পাথ চেক করুন।</div>';
        }
    }

    // ড্রপডাউন পপুলেট করা
    function initSurahSelect() {
        quranBanglaData.forEach(surah => {
            const option = document.createElement('option');
            option.value = surah.surah;
            option.textContent = `${surah.surah}. ${surah.name_bn} (${surah.name_ar})`;
            surahSelect.appendChild(option);
        });
    }

    // সূরা সিলেক্ট করলে যা ঘটবে
    surahSelect.addEventListener('change', (e) => {
        const surahId = parseInt(e.target.value);
        if (!surahId) {
            surahInfo.classList.add('hidden');
            ayahList.innerHTML = '<div class="welcome-msg">দয়া করে পড়ার জন্য একটি সূরা নির্বাচন করুন।</div>';
            return;
        }

        const selectedSurahBn = quranBanglaData.find(s => s.surah === surahId);
        
        if (selectedSurahBn) {
            displaySurah(selectedSurahBn);
        }
    });

    // স্ক্রিনে সূরা ও আয়াত প্রদর্শন
    function displaySurah(surah) {
        // সূরার সাধারণ তথ্য আপডেট
        document.getElementById('surah-title-bn').textContent = surah.name_bn;
        document.getElementById('surah-title-ar').textContent = surah.name_ar;
        document.getElementById('surah-revelation').textContent = surah.revelation === 'Makki' ? 'মক্কী' : 'মাদানী';
        document.getElementById('surah-total-ayah').textContent = `মোট আয়াত: ${surah.total_ayah}`;

        // সূরা ফাতিহা এবং সূরা তাওবা বাদে বাকিগুলোর জন্য বিসমিল্লাহ দেখানো
        const bismillahBox = document.getElementById('bismillah-text');
        if (surah.surah === 1 || surah.surah === 9) {
            bismillahBox.classList.add('hidden');
        } else {
            bismillahBox.classList.remove('hidden');
        }

        surahInfo.classList.remove('hidden');
        ayahList.innerHTML = ''; // আগের আয়াত মুছে ফেলা

        // আয়াতগুলো লুপ করে তৈরি করা
        surah.ayahs.forEach((ayahBn, index) => {
            const ayahCard = document.createElement('div');
            ayahCard.className = 'ayah-card';

            // পাবলিক আরবি জেসন থেকে সংশ্লিষ্ট আয়াতটি খুঁজে বের করার লজিক 
            // (আপনার সংগৃহীত আরবি জেসনের স্ট্রাকচার ভেদে এই ফিল্টারিং সামান্য বদলাতে পারে)
            let arabicText = 'আরবি টেক্সট পাওয়া যায়নি';
            
            if (quranArabicData && quranArabicData[surah.surah]) {
                // উদাহরণ: যদি জেসন অবজেক্ট ভিত্তিক হয়
                arabicText = quranArabicData[surah.surah][ayahBn.ayah] || '';
            } else {
                // বিকল্প বা ব্যাকআপ (অথবা আপনার ডেকোরেশন অনুযায়ী ডাইরেক্ট ইমপোর্ট)
                // এখানে ডামি হিসেবে বা আপনার নিজের আরবি ফাইল স্ট্রাকচার বসিয়ে নিতে পারেন
                arabicText = `এখানে সূরা ${surah.surah}, আয়াত ${ayahBn.ayah}-এর আরবি টেক্সট বসবে।`;
            }

            ayahCard.innerHTML = `
                <div class="ayah-number">${ayahBn.ayah}</div>
                <div class="arabic-text">${arabicText}</div>
                <div class="bangla-text">${ayahBn.translation_bn}</div>
            `;

            ayahList.appendChild(ayahCard);
        });

        // স্ক্রল করে উপরে নিয়ে যাওয়া
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // শুরুতে ডেটা লোড কল করা
    loadQuranData();
});

