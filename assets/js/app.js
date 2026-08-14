
(function(){
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const byId=id=>FESTIVALS.find(x=>x.id===id);
  const urlFor=f=>f.url;

  function initMenu(){
    const btn=$("#menuBtn"), nav=$("#navMenu");
    if(!btn||!nav)return;
    btn.setAttribute("aria-expanded","false");
    btn.addEventListener("click",()=>{
      const open=nav.classList.toggle("open");
      btn.setAttribute("aria-expanded",String(open));
    });
    // Only close if menu is actually open (avoids no-op on desktop)
    $$("#navMenu a").forEach(a=>a.addEventListener("click",()=>{
      if(nav.classList.contains("open")){
        nav.classList.remove("open");
        btn.setAttribute("aria-expanded","false");
      }
    }));
  }

  function initSearch(){
    const input=$("#festivalSearch"); if(!input)return;
    const btn=input.closest(".search")?.querySelector(".btn");
    const cards=$$(".fest-card");
    function doSearch(){
      const q=input.value.toLowerCase().trim();
      cards.forEach(c=>c.hidden=q && !c.textContent.toLowerCase().includes(q));
    }
    input.addEventListener("input",doSearch);
    // Fix B6: attach click listener to search button
    if(btn) btn.addEventListener("click",doSearch);
    input.addEventListener("keydown",e=>{if(e.key==="Enter")doSearch();});
  }

  function renderCards(){
    const box=$("#festivalGrid"); if(!box)return;
    // Fix B9: clear any static HTML first, then render from JS data
    box.innerHTML=FESTIVALS.map(f=>`
      <article class="card fest-card">
        <div class="icon" aria-hidden="true">${f.icon}</div>
        <h3>${f.name}</h3>
        <span class="fest-date">${f.displayDate} · ${f.day}</span>
        <p>${f.description}</p>
        <a class="btn" href="${urlFor(f)}">View Details</a>
      </article>`).join("");
  }

  function initCountdown(){
    const name=$("#nextFestivalName"), timer=$("#countdown"); if(!timer)return;
    function tick(){
      const now=Date.now();
      const future=FESTIVALS.map(f=>({...f,ts:new Date(f.date+"T00:00:00+05:30").getTime()}))
        .filter(f=>f.ts>now).sort((a,b)=>a.ts-b.ts)[0];
      if(!future){name.textContent="No upcoming festival available";timer.textContent="—";return;}
      name.textContent=future.name;
      let d=future.ts-now;
      const days=Math.floor(d/86400000); d%=86400000;
      const h=Math.floor(d/3600000); d%=3600000;
      const m=Math.floor(d/60000); const s=Math.floor((d%60000)/1000);
      timer.textContent=`${days}d : ${String(h).padStart(2,"0")}h : ${String(m).padStart(2,"0")}m : ${String(s).padStart(2,"0")}s`;
    }
    tick(); setInterval(tick,1000);
  }

  function initCity(){
    const select=$("#citySelect"), result=$("#cityResult");
    if(!select||!result)return;
    const slug=document.body.dataset.festival;
    // Only run on festival pages (where data-festival is set)
    if(!slug)return;
    CITIES.forEach(c=>select.insertAdjacentHTML("beforeend",`<option value="${c}">${c}</option>`));
    select.addEventListener("change",()=>{
      const city=select.value, data=VERIFIED_TIMINGS[slug]||{};
      const timing=data.cities && data.cities[city];
      result.innerHTML=timing
        ? `<strong>${city}:</strong> ${timing}`
        : city
          ? `<strong>${city}:</strong> Verified city-specific timing has not been added yet. Please verify the local Panchang before publishing a timing claim.`
          : "Choose a city to check verified timing data.";
    });
  }

  function initFaq(){
    $$(".faq-q").forEach(btn=>{
      btn.setAttribute("aria-expanded","false");
      btn.addEventListener("click",()=>{
        const answer=btn.nextElementSibling;
        const open=btn.getAttribute("aria-expanded")==="true";
        btn.setAttribute("aria-expanded",String(!open));
        answer.classList.toggle("open",!open);
      });
    });
  }

  function initShare(){
    const copy=$("#copyLink"), whats=$("#whatsappShare"), native=$("#nativeShare");
    const url=location.href, text=document.title;
    copy?.addEventListener("click",async()=>{
      try{await navigator.clipboard.writeText(url);copy.textContent="Copied!";setTimeout(()=>copy.textContent="Copy Link",1400)}
      catch(e){alert("Copy failed. Please copy the URL from your browser.");}
    });
    whats?.addEventListener("click",()=>window.open("https://wa.me/?text="+encodeURIComponent(text+" "+url),"_blank","noopener,noreferrer"));
    native?.addEventListener("click",async()=>{
      if(navigator.share) await navigator.share({title:text,url});
      else {try{await navigator.clipboard.writeText(url);native.textContent="Link Copied!";}catch(e){}}
    });
  }

  function initDateFinder(){
    const sel=$("#festivalSelect"), yearSel=$("#yearSelect"), out=$("#finderResult");
    if(!sel||!out)return;
    FESTIVALS.forEach(f=>sel.insertAdjacentHTML("beforeend",`<option value="${f.id}">${f.name}</option>`));
    function show(){
      const f=byId(sel.value); if(!f){out.innerHTML="Select a festival.";return;}
      const yr=yearSel?yearSel.value:"2026";
      if(yr==="2026") out.innerHTML=`<strong>${f.name}</strong><br>${f.displayDate} (${f.day})`;
      else out.innerHTML=`Verified ${yr} data is not included yet. Add verified dates before publishing.`;
    }
    sel.addEventListener("change",show);
    if(yearSel) yearSel.addEventListener("change",show);
  }

  // Muhurat Finder page — separate from per-festival city checker
  function initMuhuratFinder(){
    const festSel=$("#festivalSelect"), citySel=$("#citySelect"), out=$("#finderResult");
    // Only run on the muhurat-finder page (has both selects but no data-festival)
    if(!festSel||!citySel||!out||document.body.dataset.festival)return;
    FESTIVALS.forEach(f=>festSel.insertAdjacentHTML("beforeend",`<option value="${f.id}">${f.name}</option>`));
    CITIES.forEach(c=>citySel.insertAdjacentHTML("beforeend",`<option value="${c}">${c}</option>`));
    function show(){
      if(!festSel.value||!citySel.value){out.textContent="Choose a festival and city.";return;}
      const d=VERIFIED_TIMINGS[festSel.value]||{};
      const v=d.cities&&d.cities[citySel.value];
      out.innerHTML=v
        ? `<strong>${citySel.value}:</strong> ${v}`
        : `Verified timing for <strong>${citySel.value}</strong> has not been added for this festival yet. Please verify the local Panchang.`;
    }
    festSel.addEventListener("change",show);
    citySel.addEventListener("change",show);
  }

  function initCalendar(){
    const box=$("#calendarRows"), months=$("#months"); if(!box)return;
    const monthNames=["January","February","March","April","May","June","July","August","September","October","November","December"];
    // Fix B4: default to current month instead of January
    const currentMonth=new Date().getMonth();
    function render(m){
      months.querySelectorAll(".chip").forEach((b,i)=>b.classList.toggle("active",i===m));
      const list=FESTIVALS.filter(f=>new Date(f.date).getMonth()===m);
      box.innerHTML=list.length
        ?list.map(f=>`<tr><td>${new Date(f.date+"T00:00:00").getDate()} ${monthNames[m]}</td><td>${f.name}</td><td><a href="${f.url}" style="color:var(--primary);font-weight:700">View</a></td></tr>`).join("")
        :`<tr><td colspan="3">No featured festival added for this month.</td></tr>`;
    }
    months.innerHTML=monthNames.map((m,i)=>`<button class="chip" type="button">${m}</button>`).join("");
    months.querySelectorAll(".chip").forEach((b,i)=>b.addEventListener("click",()=>render(i)));
    render(currentMonth);
  }

  function initBackTop(){
    const b=$("#backTop"); if(!b)return;
    // Fix B12: use window.addEventListener + window.scrollY
    window.addEventListener("scroll",()=>b.style.display=window.scrollY>500?"block":"none",{passive:true});
    b.addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  }

  document.addEventListener("DOMContentLoaded",()=>{
    initMenu();
    renderCards();
    initSearch();
    initCountdown();
    initCity();
    initMuhuratFinder();
    initFaq();
    initShare();
    initDateFinder();
    initCalendar();
    initBackTop();
  });
})();
