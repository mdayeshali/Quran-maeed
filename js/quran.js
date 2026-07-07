document.addEventListener('DOMContentLoaded', () => {
    const surahSelect = document.getElementById('surah-select');
    const surahInfo = document.getElementById('surah-info');
    const ayahList = document.getElementById('ayah-list');
    
    // GitHub Pages-এর জন্য রিলেটিভ পাথ নিশ্চিত করা হলো
    const BN_JSON_PATH = './data/quran-bn.json'; 
    const AR_JSON_PATH = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ara-quranic.json'; 

    let quranBanglaData = [];
    let quranArabicData = [];

    // ডেটা লোড করার আপডেট করা ফাংশন
    async function loadQuranData() {
        try {
            // ১. প্রথমে আপনার লোকাল বাংলা জেসন ডেটা লোড করার চেষ্টা করি
            const resBn = await fetch(BN_JSON_PATH);
            if (!resBn.ok) {
                throw new Error(`বাংলা জেসন ফাইল পাওয়া যায়নি! স্ট্যাটাস: ${resBn.status}`);
            }
            quranBanglaData = await resBn.json();

            // ২. বাংলা ডেটা সফলভাবে লোড হলে সূরার লিস্ট ড্রপডাউনে পাঠিয়ে দেওয়া হবে
            initSurahSelect();

            // ৩. এবার ব্যাকগ্রাউন্ডে এক্সটার্নাল আরবি ডেটা লোড করার চেষ্টা করি
            try {
                const resAr = await fetch(AR_JSON_PATH);
                if (resAr.ok) {
                    const arDataRaw = await resAr.json();
                    quranArabicData = arDataRaw.quran || arDataRaw;
                    console.log('আরবি ডেটা সফলভাবে ব্যাকগ্রাউন্ডে লোড হয়েছে।');
                } else {
                    console.warn('আরবি API থেকে রেসপন্স পাওয়া যায়নি, তবে বাংলা ডেটা প্রস্তুত।');
                }
            } catch (arError) {
                // আরবি এপিআই ফেইল করলেও অ্যাপ যেন ক্র্যাশ না করে
                console.error('আরবি ডেটা নেটওয়ার্ক বা অন্য সমস্যার কারণে লোড করা যায়নি:', arError);
            }

        } catch (error) {
            // যদি মূল বাংলা জেসন ফাইলটিই রিড করতে না পারে তবে এই এরর দেখাবে
            console.error('মূল ডেটা লোড করতে সমস্যা হয়েছে:', error);
            ayahList.innerHTML = `
                <div class="welcome-msg" style="color:#d32f2f; font-weight:600;">
                    কুরআন ডেটা লোড করতে ব্যর্থ হয়েছে!<br>
                    <span style="font-size:14px; color:#777; font-weight:normal;">
                        দয়া করে নিশ্চিত করুন আপনার ফোল্ডারের নাম 'data' এবং ফাইলের নাম 'quran-bn.json' হুবহু ছোট হাতের অক্ষরে আছে কি না।
                    </span>
                </div>`;
        }
    }

    // ড্রপডাউন পপুলেট করা
    function initSurahSelect() {
        // আগের অপশনগুলো সাফ করে শুধু ডিফল্টটি রাখা
        surahSelect.innerHTML = '<option value="">সূরা নির্বাচন করুন...</option>';
        
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
        surah.ayahs.forEach((ayahBn) => {
            const ayahCard = document.createElement('div');
            ayahCard.className = 'ayah-card';

            // আরবি জেসন স্ট্রাকচার চেক করে আয়াত ম্যাচ করার লজিক
            let arabicText = '';
            
            if (quranArabicData && quranArabicData.length > 0) {
                // যদি আরবি ডেটা একটি ফ্ল্যাট বা সাধারণ অ্যারে হয়, তবে সুরা এবং আয়াত নম্বর দিয়ে খোঁজা
                const matchedArabic = quranArabicData.find(a => a.surah === surah.surah && a.ayah === ayahBn.ayah);
                if (matchedArabic) {
                    arabicText = matchedArabic.text;
                } else if (quranArabicData[surah.surah] && quranArabicData[surah.surah][ayahBn.ayah]) {
                    // বিকল্প অবজেক্ট ফরম্যাট স্ট্রাকচার হলে
                    arabicText = quranArabicData[surah.surah][ayahBn.ayah];
                }
            }

            // যদি কোনো কারণে আরবি টেক্সট না পাওয়া যায় তবে সুন্দর একটি মেসেজ সেট করা
            if (!arabicText) {
                arabicText = '⚠️ আরবি টেক্সট লোড হচ্ছে বা পাওয়া যায়নি';
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
