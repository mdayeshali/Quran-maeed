const API="https://cdn.jsdelivr.net/gh/md-rifatkhan/hadithbangla@main/";

const BOOKS={
bukhari:{
name:"সহিহ বুখারী",
short:"Sahih Bukhari",
path:"Bukhari",
meta:"Bukhari/Meta/bukhari.json",
chapters:97
},
muslim:{
name:"সহিহ মুসলিম",
short:"Sahih Muslim",
path:"Muslim",
meta:"Muslim/Meta/muslim.json",
chapters:56
},
tirmidhi:{
name:"জামে' আত-তিরমিযী",
short:"Sunan At-Tirmidhi",
path:"At-tirmizi",
meta:"At-tirmizi/Meta/at-tirmizi.json",
chapters:46
},
nasai:{
name:"সুনানে নাসায়ী",
short:"Sunan An-Nasa'i",
path:"Al-Nasai",
meta:"Al-Nasai/Meta/nasa'i.json",
chapters:50
},
abudawud:{
name:"সুনানে আবু দাউদ",
short:"Sunan Abu Dawood",
path:"AbuDaud",
meta:"AbuDaud/Meta/abudaud.json",
chapters:43
},
ibnmajah:{
name:"সুনানে ইবনে মাজাহ",
short:"Sunan Ibn Majah",
path:"Ibne-Mazah",
meta:"Ibne-Mazah/Meta/ibnemajah.json",
chapters:37
}
};

const state={
view:"books",
book:null,
chapter:null,
meta:null
};

const booksView=document.getElementById("booksView");
const chaptersView=document.getElementById("chaptersView");
const hadithsView=document.getElementById("hadithsView");
const booksGrid=document.getElementById("booksGrid");
const chaptersGrid=document.getElementById("chaptersGrid");
const hadithList=document.getElementById("hadithList");
const statusBox=document.getElementById("status");
const backBtn=document.getElementById("backBtn");
const breadcrumb=document.getElementById("breadcrumb");
const bookTitle=document.getElementById("bookTitle");
const chapterTitle=document.getElementById("chapterTitle");
const chapterRange=document.getElementById("chapterRange");
const emptyState=document.getElementById("emptyState");
const searchInput=document.getElementById("searchInput");
const searchBtn=document.getElementById("searchBtn");
const scrollTopBtn=document.getElementById("scrollTopBtn");

function showStatus(message="",loading=false){
if(!message){
statusBox.innerHTML="";
return;
}

statusBox.innerHTML=loading
?`<div class="loader"></div><div>${message}</div>`
:`<div class="error">${message}</div>`;
}

function escapeHTML(value=""){
return String(value)
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}

async function getJSON(url){
const response=await fetch(url,{cache:"no-cache"});

if(!response.ok){
throw new Error("HTTP "+response.status);
}

return await response.json();
}

function showView(view){
booksView.hidden=view!=="books";
chaptersView.hidden=view!=="chapters";
hadithsView.hidden=view!=="hadiths";
emptyState.hidden=true;

state.view=view;

backBtn.hidden=view==="books";

if(view==="books"){
breadcrumb.textContent="হাদিস গ্রন্থ";
}

if(view==="chapters"){
breadcrumb.textContent=state.book.name+" › অধ্যায়";
}

if(view==="hadiths"){
breadcrumb.textContent=
state.book.name+" › "+state.chapter.title;
}

window.scrollTo({
top:0,
behavior:"smooth"
});
}

function renderBooks(){
booksGrid.innerHTML="";

Object.entries(BOOKS).forEach(([key,book])=>{
const card=document.createElement("div");

card.className="book-card";

card.innerHTML=`
<div class="book-icon">📖</div>
<div class="book-info">
<h3>${escapeHTML(book.name)}</h3>
<p>${escapeHTML(book.short)}</p>
</div>
<div class="book-arrow">›</div>
`;

card.addEventListener("click",()=>{
loadChapters(key);
});

booksGrid.appendChild(card);
});
}

async function loadChapters(bookKey){
const book=BOOKS[bookKey];

state.book=book;
state.chapter=null;
state.meta=null;

showView("chapters");

bookTitle.textContent=book.name;
showStatus("অধ্যায় লোড হচ্ছে...",true);

chaptersGrid.innerHTML="";

try{
const meta=await getJSON(API+book.meta);

state.meta=meta;

const entries=Object.entries(meta);

if(!entries.length){
throw new Error("No chapters");
}

chaptersGrid.innerHTML="";

entries.forEach(([number,data])=>{
const card=document.createElement("div");

card.className="chapter-card";

const title=data.title||"অধ্যায়";
const range=data.hadis_range||"";

card.innerHTML=`
<div class="chapter-number">${escapeHTML(number)}</div>
<div class="chapter-info">
<h3>${escapeHTML(title)}</h3>
<span>হাদিস: ${escapeHTML(range)}</span>
</div>
`;

card.addEventListener("click",()=>{
loadHadiths(bookKey,number,title,range);
});

chaptersGrid.appendChild(card);
});

showStatus("");

}catch(error){
console.error(error);
showStatus(
"অধ্যায় লোড করা সম্ভব হচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
);
}
}

async function loadHadiths(bookKey,chapterNumber,title,range){
const book=BOOKS[bookKey];

state.book=book;
state.chapter={
number:chapterNumber,
title,
range
};

showView("hadiths");

chapterTitle.textContent=title;
chapterRange.textContent=range
?`হাদিস নম্বর: ${range}`
:"";

showStatus("হাদিস লোড হচ্ছে...",true);

hadithList.innerHTML="";

try{
const url=
`${API}${book.path}/Chapter/${chapterNumber}.json`;

const data=await getJSON(url);

let hadiths=extractHadiths(data);

if(!hadiths.length){
throw new Error("No hadith found");
}

renderHadiths(hadiths);

showStatus("");

}catch(error){
console.error(error);

showStatus(
"এই অধ্যায়ের হাদিস লোড করা সম্ভব হচ্ছে না।"
);
}
}

function extractHadiths(data){
if(Array.isArray(data))return data;

if(Array.isArray(data.hadiths))return data.hadiths;

if(data.hadith)return[data.hadith];

if(data.data&&Array.isArray(data.data))return data.data;

if(data.data&&data.data.hadith)return[data.data.hadith];

return[];
}

function normalizeHadith(item){
if(item.hadith)return item.hadith;

if(item.data&&item.data.hadith){
return item.data.hadith;
}

return item;
}

function renderHadiths(items){
hadithList.innerHTML="";

items.forEach((item,index)=>{
const hadith=normalizeHadith(item);

const id=hadith.hadith_id||hadith.id||index+1;
const narrator=hadith.narrator||"";
const bangla=hadith.bn||hadith.bangla||"";
const arabic=hadith.ar||hadith.arabic||"";
const grade=hadith.grade||"";
const note=hadith.note||"";

const card=document.createElement("article");

card.className="hadith-card";

card.innerHTML=`
<div class="hadith-head">
<span class="hadith-number">
হাদিস নং: ${escapeHTML(id)}
</span>

${grade
?`<span class="hadith-grade">${escapeHTML(grade)}</span>`
:""}
</div>

<div class="hadith-body">

${narrator
?`<div class="narrator">
বর্ণনাকারী: ${escapeHTML(narrator)}
</div>`
:""}

${arabic
?`<div class="arabic-text">${escapeHTML(arabic)}</div>`
:""}

<div class="bangla-text">
${escapeHTML(bangla)}
</div>

${note
?`<div class="note">
<strong>নোট:</strong> ${escapeHTML(note)}
</div>`
:""}

<div class="hadith-actions">

<button
class="action-btn copy-btn"
type="button">
কপি
</button>

<button
class="action-btn share-btn"
type="button">
শেয়ার
</button>

</div>

</div>
`;

const copyBtn=card.querySelector(".copy-btn");
const shareBtn=card.querySelector(".share-btn");

const shareText=
`${state.book.name}
হাদিস নং: ${id}

${bangla}

উৎস: Islamic Light`;

copyBtn.addEventListener("click",async()=>{
try{
await navigator.clipboard.writeText(shareText);

copyBtn.textContent="কপি হয়েছে ✓";

setTimeout(()=>{
copyBtn.textContent="কপি";
},1500);

}catch{
copyBtn.textContent="কপি করা যায়নি";
}
});

shareBtn.addEventListener("click",async()=>{
if(navigator.share){
try{
await navigator.share({
title:`${state.book.name} - হাদিস ${id}`,
text:shareText
});
}catch{}
}else{
await navigator.clipboard.writeText(shareText);

shareBtn.textContent="কপি হয়েছে ✓";

setTimeout(()=>{
shareBtn.textContent="শেয়ার";
},1500);
}
});

hadithList.appendChild(card);
});
}

async function searchHadith(){
const value=searchInput.value.trim();

if(!value){
searchInput.focus();
return;
}

if(!state.book){
showStatus("প্রথমে একটি হাদিস গ্রন্থ নির্বাচন করুন।");
return;
}

const id=parseInt(value,10);

if(!Number.isInteger(id)||id<1){
showStatus("সঠিক হাদিস নম্বর লিখুন।");
return;
}

showStatus("হাদিস খোঁজা হচ্ছে...",true);

hadithList.innerHTML="";

showView("hadiths");

try{
const url=
`${API}${state.book.path}/hadith/${id}.json`;

const data=await getJSON(url);

const hadith=
data.hadith||
(data.data&&data.data.hadith)||
data;

if(!hadith||!hadith.hadith_id){
throw new Error("Hadith not found");
}

const chapterNumber=
hadith.chapter?.chapter_number;

if(chapterNumber!==undefined){
const chapterData=state.meta?.[chapterNumber];

if(chapterData){
state.chapter={
number:chapterNumber,
title:chapterData.title,
range:chapterData.hadis_range
};

chapterTitle.textContent=chapterData.title;
chapterRange.textContent=
`হাদিস নম্বর: ${chapterData.hadis_range||""}`;
}

breadcrumb.textContent=
state.book.name+" › হাদিস "+hadith.hadith_id;
}

renderHadiths([hadith]);

showStatus("");

}catch(error){
console.error(error);

showStatus(
"এই নম্বরের হাদিস পাওয়া যায়নি। হাদিস নম্বরটি সঠিক কিনা দেখুন।"
);
}
}

backBtn.addEventListener("click",()=>{
if(state.view==="hadiths"){
loadChapters(
Object.keys(BOOKS).find(
key=>BOOKS[key]===state.book
)
);
return;
}

if(state.view==="chapters"){
state.book=null;
showView("books");
return;
}
});

searchBtn.addEventListener("click",searchHadith);

searchInput.addEventListener("keydown",event=>{
if(event.key==="Enter"){
searchHadith();
}
});

window.addEventListener("scroll",()=>{
scrollTopBtn.style.display=
window.scrollY>400?"block":"none";
});

scrollTopBtn.addEventListener("click",()=>{
window.scrollTo({
top:0,
behavior:"smooth"
});
});

renderBooks();
