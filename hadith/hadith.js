const API_BASE="https://hadeethenc.com/api/v1";
const LANGUAGE="bn";

let currentCategory="5";
let hadithList=[];
let currentIndex=0;

const statusBox=document.getElementById("status");
const hadithCard=document.getElementById("hadithCard");
const navigation=document.getElementById("navigation");
const categorySelect=document.getElementById("categorySelect");
const hadithIdInput=document.getElementById("hadithId");
const searchBtn=document.getElementById("searchBtn");
const previousBtn=document.getElementById("previousBtn");
const nextBtn=document.getElementById("nextBtn");
const positionText=document.getElementById("positionText");
const hadithNumber=document.getElementById("hadithNumber");
const hadithTitle=document.getElementById("hadithTitle");
const hadithText=document.getElementById("hadithText");
const explanationBox=document.getElementById("explanationBox");
const explanation=document.getElementById("explanation");
const hintsBox=document.getElementById("hintsBox");
const hints=document.getElementById("hints");

function showLoading(message){
statusBox.innerHTML=`
<div class="loader"></div>
<div>${message}</div>
`;
hadithCard.hidden=true;
navigation.hidden=true;
}

function showError(message){
statusBox.innerHTML=`
<div class="error">${message}</div>
`;
hadithCard.hidden=true;
navigation.hidden=true;
}

function clearStatus(){
statusBox.innerHTML="";
}

async function loadCategories(){
try{
const response=await fetch(
`${API_BASE}/categories/list/?language=${LANGUAGE}`
);

if(!response.ok){
throw new Error(`HTTP ${response.status}`);
}

const categories=await response.json();

categorySelect.innerHTML="";

const rootCategories=categories.filter(
category=>category.parent_id===null
);

rootCategories.forEach(category=>{
const option=document.createElement("option");
option.value=category.id;
option.textContent=`${category.title} (${category.hadeeths_count})`;
categorySelect.appendChild(option);
});

categorySelect.value=currentCategory;

}catch(error){
console.error("Category Error:",error);

categorySelect.innerHTML=`
<option value="5">বিষয় নির্বাচন করা যাচ্ছে না</option>
`;
}
}

async function loadHadithList(categoryId=currentCategory){
currentCategory=categoryId;

showLoading("বাংলা হাদিসের তালিকা লোড হচ্ছে...");

try{
const url=
`${API_BASE}/hadeeths/list/?language=${LANGUAGE}&category_id=${encodeURIComponent(categoryId)}&page=1&per_page=20`;

console.log("Hadith List API:",url);

const response=await fetch(url);

if(!response.ok){
throw new Error(`HTTP ${response.status}`);
}

const result=await response.json();

console.log("Hadith List:",result);

if(!result||!Array.isArray(result.data)){
throw new Error("Invalid API response");
}

hadithList=result.data.filter(
item=>
Array.isArray(item.translations)&&
item.translations.includes(LANGUAGE)
);

if(hadithList.length===0){
throw new Error("এই বিভাগে বাংলা হাদিস পাওয়া যায়নি।");
}

currentIndex=0;

await loadHadith(hadithList[0].id);

}catch(error){
console.error("Hadith List Error:",error);

showError(
"হাদিস লোড করা যাচ্ছে না। ইন্টারনেট সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।"
);
}
}

async function loadHadith(id){
showLoading("হাদিস লোড হচ্ছে...");

try{
const url=
`${API_BASE}/hadeeths/one/?language=${LANGUAGE}&id=${encodeURIComponent(id)}`;

console.log("Single Hadith API:",url);

const response=await fetch(url);

if(!response.ok){
throw new Error(`HTTP ${response.status}`);
}

const data=await response.json();

console.log("Hadith:",data);

if(!data||!data.id){
throw new Error("হাদিস পাওয়া যায়নি।");
}

displayHadith(data);

clearStatus();

hadithCard.hidden=false;
navigation.hidden=false;

updateNavigation();

}catch(error){
console.error("Single Hadith Error:",error);

showError(
"হাদিস লোড করা সম্ভব হচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
);
}
}

function displayHadith(data){
hadithNumber.textContent=`হাদিস নং ${data.id}`;

hadithTitle.textContent=
data.title||"হাদিস";

hadithText.textContent=
data.hadeeth||
"হাদিসের বক্তব্য পাওয়া যায়নি।";

if(data.explanation&&data.explanation.trim()){
explanation.textContent=data.explanation;
explanationBox.hidden=false;
}else{
explanationBox.hidden=true;
}

if(Array.isArray(data.hints)&&data.hints.length>0){
hints.textContent=data.hints.join("\n");
hintsBox.hidden=false;
}else if(typeof data.hints==="string"&&data.hints.trim()){
hints.textContent=data.hints;
hintsBox.hidden=false;
}else{
hintsBox.hidden=true;
}

hadithIdInput.value=data.id;
}

function updateNavigation(){
previousBtn.disabled=currentIndex<=0;

nextBtn.disabled=
currentIndex>=hadithList.length-1;

positionText.textContent=
`${currentIndex+1} / ${hadithList.length}`;
}

async function nextHadith(){
if(currentIndex>=hadithList.length-1){
return;
}

currentIndex++;

const id=hadithList[currentIndex].id;

await loadHadith(id);
}

async function previousHadith(){
if(currentIndex<=0){
return;
}

currentIndex--;

const id=hadithList[currentIndex].id;

await loadHadith(id);
}

async function searchHadith(){
const id=hadithIdInput.value.trim();

if(!id){
showError("হাদিস নম্বর লিখুন।");
return;
}

await loadHadith(id);

const index=hadithList.findIndex(
item=>String(item.id)===String(id)
);

if(index!==-1){
currentIndex=index;
updateNavigation();
}
}

searchBtn.addEventListener(
"click",
searchHadith
);

previousBtn.addEventListener(
"click",
previousHadith
);

nextBtn.addEventListener(
"click",
nextHadith
);

categorySelect.addEventListener(
"change",
function(){
loadHadithList(this.value);
}
);

hadithIdInput.addEventListener(
"keydown",
function(event){
if(event.key==="Enter"){
searchHadith();
}
}
);

async function startHadithPage(){
showLoading("হাদিস প্রস্তুত হচ্ছে...");
await loadCategories();
await loadHadithList(currentCategory);
}

startHadithPage();
