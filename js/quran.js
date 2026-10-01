let quranLocalData = null;

const surahSelect = document.getElementById('surahSelect');
const ayahList = document.getElementById('ayahList');
const loading = document.getElementById('loading');
const surahInfo = document.getElementById('surahInfo');
const surahTitle = document.getElementById('surahTitle');
const surahMeta = document.getElementById('surahMeta');

// ১. লোকাল Tanzil JSON ডাটা লোড করা
async function loadLocalQuranData() {
  try {
    const response = await fetch('../data/quran-uthmani.json');
    if (!response.ok) throw new Error('লোকাল JSON ফাইল পাওয়া যায়নি');
    quranLocalData = await response.json();
    populateSurahDropdown();
  } catch (error) {
    loading.innerText = 'ফাইল লোড করতে সমস্যা হয়েছে: ' + error.message;
  }
}

// ২. ড্রপডাউনে ১১৪টি সূরা সেট করা
function populateSurahDropdown() {
  surahSelect.innerHTML = '';
  quranLocalData.surahs.forEach(surah => {
    const option = document.createElement('option');
    option.value = surah.number;
    option.textContent = `${surah.number}. ${surah.name}`;
    surahSelect.appendChild(option);
  });

  loading.style.display = 'none';
  // ডিফল্টভাবে সূরা ফাতিহা (১) লোড করা
  loadSurah(1);
}

// ৩. API থেকে বাংলা অনুবাদ ও উচ্চারণ এনে রেন্ডার করা
async function loadSurah(surahNumber) {
  loading.style.display = 'block';
  loading.innerText = 'সূরা লোড হচ্ছে...';
  ayahList.innerHTML = '';
  surahInfo.style.display = 'none';

  // লোকাল ডাটা থেকে সংশ্লিষ্ট সূরা খুঁজে বের করা
  const localSurah = quranLocalData.surahs.find(s => s.number == surahNumber);

  try {
    // AlQuran Cloud API থেকে বাংলা অনুবাদ (bn.bengali) এবং উচ্চারণ (en.transliteration)
    const [transRes, bengaliRes] = await Promise.all([
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/en.transliteration`),
      fetch(`https://api.alquran.cloud/v1/surah/${surahNumber}/bn.bengali`)
    ]);

    const transData = await transRes.json();
    const bengaliData = await bengaliRes.json();

    const transliterations = transData.data.ayahs;
    const translations = bengaliData.data.ayahs;

    // সূরার বিবরণ প্রদর্শন
    surahTitle.textContent = `${localSurah.name} (${transData.data.englishName})`;
    surahMeta.textContent = `অবতীর্ণ: ${localSurah.loc === 'مكية' ? 'মক্কী' : 'মাদানী'} | মোট আয়াত: ${localSurah.ayahs.length}`;
    surahInfo.style.display = 'block';

    // প্রতি আয়াত রেন্ডার
    localSurah.ayahs.forEach((ayah, index) => {
      const card = document.createElement('div');
      card.className = 'ayah-card';

      const transText = transliterations[index] ? transliterations[index].text : '';
      const bnText = translations[index] ? translations[index].text : '';

      card.innerHTML = `
        <div class="ayah-header">
          <span class="ayah-badge">আয়াত: ${ayah.number}</span>
        </div>
        <div class="arabic-text">${ayah.text}</div>
        <div class="transliteration"><strong>উচ্চারণ:</strong> ${transText}</div>
        <div class="bengali-text"><strong>অর্থ:</strong> ${bnText}</div>
      `;

      ayahList.appendChild(card);
    });

  } catch (error) {
    ayahList.innerHTML = `<p style="color:red; text-align:center;">অনুবাদ লোড করতে সমস্যা হয়েছে: ${error.message}</p>`;
  } finally {
    loading.style.display = 'none';
  }
}

// ড্রপডাউন পরিবর্তন হলে সূরা রিলোড
surahSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    loadSurah(e.target.value);
  }
});

// পেজ লোড হলে শুরু
document.addEventListener('DOMContentLoaded', loadLocalQuranData);
          
