let quranLocalData = null;

// DOM Elements
const surahSelect = document.getElementById('surahSelect');
const ayahContainer = document.getElementById('ayahContainer');
const loading = document.getElementById('loading');
const surahBanner = document.getElementById('surahBanner');
const surahArabicName = document.getElementById('surahArabicName');
const surahBanglaName = document.getElementById('surahBanglaName');
const surahType = document.getElementById('surahType');
const surahAyahCount = document.getElementById('surahAyahCount');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.getElementById('themeIcon');

// সংখ্যা বাংলায় রূপান্তর
function toBengaliNumber(num) {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, d => bnDigits[d]);
}

// থিম ইনিশিয়ালাইজেশন (Dark/Light mode)
function setupTheme() {
  const savedTheme = localStorage.getItem('quran_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeIcon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('quran_theme', newTheme);
    themeIcon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });
}

// ১. লোকাল Tanzil JSON থেকে আরবি লোড
async function loadLocalQuranData() {
  try {
    const response = await fetch('../data/quran-uthmani.json');
    if (!response.ok) throw new Error('data/quran-uthmani.json ফাইল পাওয়া যায়নি।');
    quranLocalData = await response.json();
    populateSurahDropdown();
  } catch (error) {
    loading.innerHTML = `<p style="color: #ef4444;">ত্রুটি: ${error.message}</p>`;
  }
}

// ২. ড্রপডাউনে সূরা সেট করা
function populateSurahDropdown() {
  surahSelect.innerHTML = '';
  quranLocalData.surahs.forEach(surah => {
    const option = document.createElement('option');
    option.value = surah.number;
    option.textContent = `${toBengaliNumber(surah.number)}. ${surah.name}`;
    surahSelect.appendChild(option);
  });

  loading.style.display = 'none';
  loadSurah(1); // ডিফল্ট সূরা ফাতিহা
}

// ৩. API থেকে বাংলা উচ্চারণ ও অনুবাদ লোড
async function loadSurah(surahNumber) {
  loading.style.display = 'block';
  ayahContainer.innerHTML = '';
  surahBanner.style.display = 'none';

  const localSurah = quranLocalData.surahs.find(s => s.number == surahNumber);

  try {
    // API থেকে বাংলা উচ্চারণ ও আল-বায়ান বাংলা অনুবাদ ফেচ
    const [pronounceRes, translateRes] = await Promise.all([
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ben-muhiuddinkhan-la/${surahNumber}.json`),
      fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/ben-muhiuddinkhan/${surahNumber}.json`)
    ]);

    const pronounceData = await pronounceRes.json();
    const translateData = await translateRes.json();

    const pronunciations = pronounceData.verse || [];
    const translations = translateData.verse || [];

    // ব্যানার আপডেট
    surahArabicName.textContent = localSurah.name;
    surahBanglaName.textContent = `সূরা নং: ${toBengaliNumber(surahNumber)}`;
    surahType.textContent = localSurah.loc === 'مكية' ? 'মাক্কী' : 'মাদানী';
    surahAyahCount.textContent = `আয়াত: ${toBengaliNumber(localSurah.ayahs.length)}`;
    surahBanner.style.display = 'block';

    // কার্ড রেন্ডার
    localSurah.ayahs.forEach((ayah, index) => {
      const card = document.createElement('article');
      card.className = 'ayah-card';

      const prText = pronunciations[index] ? pronunciations[index].text : 'উচ্চারণ পাওয়া যায়নি';
      const bnText = translations[index] ? translations[index].text : 'অনুবাদ পাওয়া যায়নি';

      card.innerHTML = `
        <div class="ayah-header">
          <span class="ayah-badge">আয়াত: ${toBengaliNumber(ayah.number)}</span>
        </div>
        <div class="arabic-block">${ayah.text}</div>
        <div class="pronunciation-block">
          <span class="field-label">উচ্চারণ:</span> ${prText}
        </div>
        <div class="translation-block">
          <span class="field-label">অনুবাদ:</span> ${bnText}
        </div>
      `;

      ayahContainer.appendChild(card);
    });

  } catch (error) {
    ayahContainer.innerHTML = `<p style="color: #ef4444; text-align: center;">অনুবাদ ফেচ করতে সমস্যা হয়েছে: ${error.message}</p>`;
  } finally {
    loading.style.display = 'none';
  }
}

// ইভেন্ট লিসেনার
surahSelect.addEventListener('change', (e) => {
  if (e.target.value) {
    loadSurah(e.target.value);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  setupTheme();
  loadLocalQuranData();
});
    
