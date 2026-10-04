const API="https://cdn.jsdelivr.net/gh/md-rifatkhan/hadithbangla@main/";
const SITE_URL="https://islamiclight.in/hadith/hadith.html";

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
bookKey:null,
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


/* ================================
   STATUS
================================ */

function showStatus(message="",loading=false){

if(!message){
statusBox.innerHTML="";
return;
}

if(loading){
statusBox.innerHTML=`
<div class="loader"></div>
<div>${escapeHTML(message)}</div>
`;
}else{
statusBox.innerHTML=`
<div class="error">${escapeHTML(message)}</div>
`;
}

}


/* ================================
   HTML SECURITY
================================ */

function escapeHTML(value=""){

return String(value)
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");

}


/* ================================
   API REQUEST
================================ */

async function getJSON(url){

const response=await fetch(url,{
cache:"no-cache"
});

if(!response.ok){
throw new Error("HTTP "+response.status);
}

return await response.json();

}


/* ================================
   HADITH URL
================================ */

function createHadithUrl(bookKey,id){

return `${SITE_URL}?book=${encodeURIComponent(bookKey)}&id=${encodeURIComponent(id)}`;

}


/* ================================
   CHAPTER URL
================================ */

function createChapterUrl(bookKey,chapter){

return `${SITE_URL}?book=${encodeURIComponent(bookKey)}&chapter=${encodeURIComponent(chapter)}`;

}


/* ================================
   UPDATE BROWSER URL
================================ */

function updateURL(params,replace=false){

const url=new URL(SITE_URL);

Object.entries(params).forEach(([key,value])=>{

if(value!==undefined&&value!==null&&value!==""){
url.searchParams.set(key,value);
}

});

if(replace){
history.replaceState({}, "", url.toString());
}else{
history.pushState({}, "", url.toString());
}

}


/* ================================
   SHOW VIEW
================================ */

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

if(view==="chapters"&&state.book){
breadcrumb.textContent=
state.book.name+" › অধ্যায়";
}

if(view==="hadiths"&&state.book){

if(state.chapter){

breadcrumb.textContent=
state.book.name+" › "+state.chapter.title;

}else{

breadcrumb.textContent=
state.book.name+" › হাদিস";

}

}

window.scrollTo({
top:0,
behavior:"smooth"
});

}


/* ================================
   BOOK LIST
================================ */

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

loadChapters(key,true);

});

booksGrid.appendChild(card);

});

}


/* ================================
   LOAD CHAPTERS
================================ */

async function loadChapters(bookKey,pushURL=false){

const book=BOOKS[bookKey];

if(!book){
return;
}

state.bookKey=bookKey;
state.book=book;
state.chapter=null;
state.meta=null;

showView("chapters");

bookTitle.textContent=book.name;

chaptersGrid.innerHTML="";

showStatus("অধ্যায় লোড হচ্ছে...",true);

if(pushURL){
updateURL({
book:bookKey
});
}

try{

const meta=await getJSON(API+book.meta);

state.meta=meta;

const entries=Object.entries(meta);

if(!entries.length){
throw new Error("No chapters found");
}

chaptersGrid.innerHTML="";

entries.forEach(([number,data])=>{

const card=document.createElement("div");

card.className="chapter-card";

const title=data.title||"অধ্যায়";
const range=data.hadis_range||"";

card.innerHTML=`
<div class="chapter-number">
${escapeHTML(number)}
</div>

<div class="chapter-info">
<h3>${escapeHTML(title)}</h3>
<span>
হাদিস: ${escapeHTML(range)}
</span>
</div>
`;

card.addEventListener("click",()=>{

loadHadiths(
bookKey,
number,
title,
range,
true
);

});

chaptersGrid.appendChild(card);

});

showStatus("");

}catch(error){

console.error("Chapter Error:",error);

showStatus(
"অধ্যায় লোড করা সম্ভব হচ্ছে না। কিছুক্ষণ পরে আবার চেষ্টা করুন।"
);

}

}


/* ================================
   LOAD HADITHS
================================ */

async function loadHadiths(
bookKey,
chapterNumber,
title,
range,
pushURL=false
){

const book=BOOKS[bookKey];

if(!book){
return;
}

state.bookKey=bookKey;

state.book=book;

state.chapter={
number:String(chapterNumber),
title:title,
range:range
};

showView("hadiths");

chapterTitle.textContent=title;

chapterRange.textContent=range
?`হাদিস নম্বর: ${range}`
:"";

hadithList.innerHTML="";

showStatus("হাদিস লোড হচ্ছে...",true);

if(pushURL){

updateURL({
book:bookKey,
chapter:chapterNumber
});

}

try{

const url=
`${API}${book.path}/Chapter/${chapterNumber}.json`;

const data=await getJSON(url);

const hadiths=extractHadiths(data);

if(!hadiths.length){
throw new Error("No hadith found");
}

renderHadiths(hadiths);

showStatus("");

}catch(error){

console.error("Hadith Error:",error);

showStatus(
"এই অধ্যায়ের হাদিস লোড করা সম্ভব হচ্ছে না।"
);

}

}


/* ================================
   EXTRACT HADITH DATA
================================ */

function extractHadiths(data){

if(Array.isArray(data)){
return data;
}

if(Array.isArray(data.hadiths)){
return data.hadiths;
}

if(data.hadith){
return [data.hadith];
}

if(data.data&&Array.isArray(data.data)){
return data.data;
}

if(data.data&&data.data.hadith){
return [data.data.hadith];
}

return[];

}


/* ================================
   NORMALIZE HADITH
================================ */

function normalizeHadith(item){

if(item.hadith){
return item.hadith;
}

if(item.data&&item.data.hadith){
return item.data.hadith;
}

return item;

}


/* ================================
   CREATE COMPLETE SHARE/COPY TEXT
================================ */

function createShareText(hadith,id){

const narrator=hadith.narrator||"";
const bangla=hadith.bn||hadith.bangla||"";
const arabic=hadith.ar||hadith.arabic||"";
const grade=hadith.grade||"";
const note=hadith.note||"";

let text="";


/* বর্ণনাকারী */

if(narrator){

text+=
"বর্ণনাকারী: "+
narrator+
"\n\n";

}


/* আরবি */

if(arabic){

text+=
arabic+
"\n\n";

}


/* বাংলা */

if(bangla){

text+=
bangla+
"\n\n";

}


/* হাদিসের মান */

if(grade){

text+=
"হাদিসের মান: "+
grade+
"\n\n";

}


/* নোট */

if(note){

text+=
"নোট: "+
note+
"\n\n";

}


/* শুধু সরাসরি হাদিসের লিংক */

text+=createHadithUrl(
state.bookKey,
id
);

return text.trim();

}


/* ================================
   RENDER HADITHS
================================ */

function renderHadiths(items){

hadithList.innerHTML="";

if(!items||!items.length){

emptyState.hidden=false;

return;

}

items.forEach((item,index)=>{

const hadith=normalizeHadith(item);

const id=
hadith.hadith_id||
hadith.id||
index+1;

const narrator=
hadith.narrator||
"";

const bangla=
hadith.bn||
hadith.bangla||
"";

const arabic=
hadith.ar||
hadith.arabic||
"";

const grade=
hadith.grade||
"";

const note=
hadith.note||
"";


const card=document.createElement("article");

card.className="hadith-card";


/* সম্পূর্ণ কপি/শেয়ার টেক্সট */

const shareText=
createShareText(
hadith,
id
);


/* হাদিস HTML */

card.innerHTML=`

<div class="hadith-head">

<span class="hadith-number">
হাদিস নং: ${escapeHTML(id)}
</span>

${
grade
?
`<span class="hadith-grade">
${escapeHTML(grade)}
</span>`
:""
}

</div>


<div class="hadith-body">

${
narrator
?
`
<div class="narrator">
বর্ণনাকারী: ${escapeHTML(narrator)}
</div>
`
:""
}


${
arabic
?
`
<div class="arabic-text">
${escapeHTML(arabic)}
</div>
`
:""
}


<div class="bangla-text">
${escapeHTML(bangla)}
</div>


${
note
?
`
<div class="note">
<strong>নোট:</strong>
${escapeHTML(note)}
</div>
`
:""
}


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


const copyBtn=
card.querySelector(".copy-btn");

const shareBtn=
card.querySelector(".share-btn");


/* ================================
   COPY
================================ */

copyBtn.addEventListener(
"click",
async()=>{

try{

await navigator.clipboard.writeText(
shareText
);

copyBtn.textContent=
"কপি হয়েছে ✓";

setTimeout(()=>{

copyBtn.textContent="কপি";

},1800);

}catch(error){

console.error(error);

copyBtn.textContent=
"কপি করা যায়নি";

setTimeout(()=>{

copyBtn.textContent="কপি";

},1800);

}

});


/* ================================
   SHARE
================================ */

shareBtn.addEventListener(
"click",
async()=>{

try{

if(navigator.share){

await navigator.share({

title:
`${state.book.name} - হাদিস ${id}`,

text:shareText

});

}else{

await navigator.clipboard.writeText(
shareText
);

shareBtn.textContent=
"লিংকসহ কপি হয়েছে ✓";

setTimeout(()=>{

shareBtn.textContent="শেয়ার";

},2000);

}

}catch(error){

/*
ব্যবহারকারী Share window বন্ধ করলে
কোনো error message দেখানোর দরকার নেই।
*/

console.log(
"Share cancelled or unavailable"
);

}

});


/* ================================
   ADD CARD
================================ */

hadithList.appendChild(card);

});

}


/* ================================
   SEARCH HADITH
================================ */

async function searchHadith(){

const value=
searchInput.value.trim();

if(!value){

searchInput.focus();

return;

}


/* গ্রন্থ নির্বাচন করা না থাকলে */

if(!state.bookKey){

showStatus(
"প্রথমে একটি হাদিস গ্রন্থ নির্বাচন করুন।"
);

return;

}


const id=
parseInt(value,10);

if(!Number.isInteger(id)||id<1){

showStatus(
"সঠিক হাদিস নম্বর লিখুন।"
);

return;

}


showView("hadiths");

hadithList.innerHTML="";

showStatus(
"হাদিস খোঁজা হচ্ছে...",
true
);


/* URL পরিবর্তন */

updateURL({
book:state.bookKey,
id:id
});


try{

const url=
`${API}${state.book.path}/hadith/${id}.json`;

const data=
await getJSON(url);


const hadith=
data.hadith||
(data.data&&data.data.hadith)||
data;


if(!hadith){

throw new Error(
"Hadith not found"
);

}


if(!hadith.hadith_id&&!hadith.id){

throw new Error(
"Invalid hadith"
);

}


const chapterNumber=
hadith.chapter?.chapter_number;


if(
chapterNumber!==undefined&&
state.meta&&
state.meta[chapterNumber]
){

const chapterData=
state.meta[chapterNumber];


state.chapter={
number:String(chapterNumber),
title:chapterData.title,
range:chapterData.hadis_range
};


chapterTitle.textContent=
chapterData.title;


chapterRange.textContent=
chapterData.hadis_range
?
`হাদিস নম্বর: ${chapterData.hadis_range}`
:"";


breadcrumb.textContent=
`${state.book.name} › ${chapterData.title}`;

}else{

state.chapter=null;

chapterTitle.textContent=
"হাদিস "+(hadith.hadith_id||hadith.id);

chapterRange.textContent="";

breadcrumb.textContent=
`${state.book.name} › হাদিস`;

}


renderHadiths([hadith]);

showStatus("");

}catch(error){

console.error(
"Search Error:",
error
);

showStatus(
"এই নম্বরের হাদিস পাওয়া যায়নি। হাদিস নম্বরটি সঠিক কিনা দেখুন।"
);

}

}


/* ================================
   BACK BUTTON
================================ */

backBtn.addEventListener(
"click",
()=>{

if(state.view==="hadiths"){

if(state.bookKey){

loadChapters(
state.bookKey,
true
);

}

return;

}


if(state.view==="chapters"){

state.bookKey=null;
state.book=null;
state.chapter=null;
state.meta=null;

history.pushState(
{},
"",
SITE_URL
);

showView("books");

return;

}

});


/* ================================
   SEARCH BUTTON
================================ */

searchBtn.addEventListener(
"click",
searchHadith
);


/* ================================
   ENTER SEARCH
================================ */

searchInput.addEventListener(
"keydown",
event=>{

if(event.key==="Enter"){

searchHadith();

}

});


/* ================================
   SCROLL TOP
================================ */

window.addEventListener(
"scroll",
()=>{

scrollTopBtn.style.display=
window.scrollY>400
?"block"
:"none";

});


scrollTopBtn.addEventListener(
"click",
()=>{

window.scrollTo({
top:0,
behavior:"smooth"
});

});


/* ================================
   BROWSER BACK/FORWARD
================================ */

window.addEventListener(
"popstate",
()=>{

openFromURL();

});


/* ================================
   OPEN HADITH FROM URL
================================ */

async function openHadithFromURL(
bookKey,
hadithId
){

const book=BOOKS[bookKey];

if(!book){
return;
}

state.bookKey=bookKey;
state.book=book;
state.chapter=null;


/* আগে Meta লোড */

try{

const meta=
await getJSON(
API+book.meta
);

state.meta=meta;

}catch(error){

console.error(
"Meta Error:",
error
);

state.meta=null;

}


showView("hadiths");

hadithList.innerHTML="";

showStatus(
"হাদিস লোড হচ্ছে...",
true
);


try{

const url=
`${API}${book.path}/hadith/${hadithId}.json`;

const data=
await getJSON(url);


const hadith=
data.hadith||
(data.data&&data.data.hadith)||
data;


if(!hadith){

throw new Error(
"Hadith not found"
);

}


const realId=
hadith.hadith_id||
hadith.id||
hadithId;


const chapterNumber=
hadith.chapter?.chapter_number;


if(
chapterNumber!==undefined&&
state.meta&&
state.meta[chapterNumber]
){

const chapterData=
state.meta[chapterNumber];


state.chapter={
number:String(chapterNumber),
title:chapterData.title,
range:chapterData.hadis_range
};


chapterTitle.textContent=
chapterData.title;


chapterRange.textContent=
chapterData.hadis_range
?
`হাদিস নম্বর: ${chapterData.hadis_range}`
:"";


breadcrumb.textContent=
`${book.name} › ${chapterData.title}`;

}else{

chapterTitle.textContent=
"হাদিস "+realId;

chapterRange.textContent="";

breadcrumb.textContent=
`${book.name} › হাদিস ${realId}`;

}


renderHadiths([hadith]);

showStatus("");

}catch(error){

console.error(
"Direct Hadith Error:",
error
);

showStatus(
"এই হাদিসটি পাওয়া যায়নি। লিংকটি সঠিক কিনা দেখুন।"
);

}

}


/* ================================
   OPEN CHAPTER FROM URL
================================ */

async function openChapterFromURL(
bookKey,
chapterNumber
){

const book=BOOKS[bookKey];

if(!book){
return;
}


state.bookKey=bookKey;
state.book=book;


showView("chapters");

chaptersGrid.innerHTML="";

showStatus(
"অধ্যায় লোড হচ্ছে...",
true
);


try{

const meta=
await getJSON(
API+book.meta
);

state.meta=meta;


const chapter=
meta[chapterNumber];


if(!chapter){

throw new Error(
"Chapter not found"
);

}


bookTitle.textContent=
book.name;


const title=
chapter.title||
"অধ্যায়";


const range=
chapter.hadis_range||
"";


/*
অধ্যায় তালিকা দেখানো
*/

const entries=
Object.entries(meta);

entries.forEach(
([number,data])=>{

const card=
document.createElement("div");

card.className=
"chapter-card";

card.innerHTML=`

<div class="chapter-number">
${escapeHTML(number)}
</div>

<div class="chapter-info">

<h3>
${escapeHTML(
data.title||"অধ্যায়"
)}
</h3>

<span>
হাদিস:
${escapeHTML(
data.hadis_range||""
)}
</span>

</div>
`;

card.addEventListener(
"click",
()=>{

loadHadiths(
bookKey,
number,
data.title||"অধ্যায়",
data.hadis_range||"",
true
);

});

chaptersGrid.appendChild(
card
);

});


/*
URL থেকে আসা নির্দিষ্ট অধ্যায়
স্বয়ংক্রিয়ভাবে খুলবে
*/

setTimeout(()=>{

loadHadiths(
bookKey,
chapterNumber,
title,
range,
false
);

},0);

}catch(error){

console.error(
"Chapter URL Error:",
error
);

showStatus(
"এই অধ্যায়টি লোড করা সম্ভব হচ্ছে না।"
);

}

}


/* ================================
   OPEN PAGE FROM URL
================================ */

async function openFromURL(){

const params=
new URLSearchParams(
window.location.search
);

const bookKey=
params.get("book");

const hadithId=
params.get("id");

const chapterNumber=
params.get("chapter");


/*
কোনো URL parameter নেই
*/

if(
!bookKey||
!BOOKS[bookKey]
){

state.bookKey=null;
state.book=null;
state.chapter=null;

showView("books");

renderBooks();

return;

}


/*
Direct Hadith
*/

if(hadithId){

await openHadithFromURL(
bookKey,
hadithId
);

return;

}


/*
Direct Chapter
*/

if(chapterNumber){

await openChapterFromURL(
bookKey,
chapterNumber
);

return;

}


/*
শুধু Book
*/

await loadChapters(
bookKey,
false
);

}


/* ================================
   INITIAL LOAD
================================ */

renderBooks();

openFromURL();
