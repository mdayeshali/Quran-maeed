
document.addEventListener("DOMContentLoaded",()=>{
  document.querySelectorAll(".copy-btn").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const text=btn.dataset.copy||"";
      try{
        await navigator.clipboard.writeText(text);
        const old=btn.textContent;
        btn.textContent="কপি হয়েছে";
        setTimeout(()=>btn.textContent=old,1200);
      }catch(e){btn.textContent="কপি করা যায়নি";}
    });
  });
});
