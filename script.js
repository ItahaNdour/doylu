"use strict";

/*
 Doylu V1 – Usage Based Ranking (B)
 - Classement selon usage (data / appels / mixte)
 - Intègre durée + restriction nuit + promo
 - Admin persistant (localStorage)
*/

const ADMIN_PASSWORD = "doyluadmin";
const STORAGE_KEY = "doylu_v1_usageB";

function $(id){ return document.getElementById(id); }
function nowHHmm(){
  const d = new Date();
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}

let OFFERS = [];
let selectedBudget = null;
let selectedUsage = "data";
let selectedValidity = "any";
let selectedCategory = "any";

/* ================= DATA SEED ================= */

function seedOffers(){
  return [
    {id:"o1",operator:"Orange",name:"Pass Jour 300Mo",price:200,data:300,days:1,category:"jour",promo:false},
    {id:"o2",operator:"Orange",name:"Pass Jour 1,5Go",price:500,data:1536,days:1,category:"jour",promo:false},
    {id:"o3",operator:"Orange",name:"Pass Jour 5Go",price:1000,data:5120,days:1,category:"jour",promo:false},
    {id:"o4",operator:"Orange",name:"Pass Nuit 5Go",price:500,data:5120,days:1,category:"nuit",promo:false},
    {id:"o5",operator:"Orange",name:"Pass Semaine 2Go",price:1000,data:2048,days:7,category:"semaine",promo:false},
    {id:"o6",operator:"Orange",name:"Pass Mois 10Go Promo",price:2000,data:10240,days:30,category:"mois",promo:true},
    {id:"o7",operator:"Orange",name:"Pass Mois 25Go",price:5000,data:25600,days:30,category:"mois",promo:false}
  ];
}

function loadData(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(!raw){
    OFFERS = seedOffers();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFERS));
  }else{
    OFFERS = JSON.parse(raw);
  }
}

function saveData(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(OFFERS));
}

/* ================= SCORING ================= */

function scoreOffer(o){
  let base = (o.data || 0) / o.price;

  // bonus durée
  if(o.days === 7) base *= 1.1;
  if(o.days === 30) base *= 1.2;

  // pénalité nuit
  if(o.category === "nuit") base *= 0.8;

  // bonus promo
  if(o.promo) base *= 1.05;

  return base;
}

/* ================= UI ================= */

function renderBudgets(){
  const budgets=[500,1000,2000,3000,5000];
  $("budgetGrid").innerHTML = budgets.map(b =>
    `<button class="budget-btn" data-b="${b}">${b}</button>`
  ).join("");

  document.querySelectorAll(".budget-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      setBudget(Number(btn.dataset.b));
    });
  });
}

function setBudget(b){
  selectedBudget = b;
  $("budgetInput").value = b;
  renderResults();
}

function renderResults(){
  if(!selectedBudget) return;

  let filtered = OFFERS.filter(o=>o.price<=selectedBudget);

  if(selectedCategory!=="any")
    filtered = filtered.filter(o=>o.category===selectedCategory);

  if(selectedValidity!=="any")
    filtered = filtered.filter(o=>o.days===Number(selectedValidity));

  filtered.sort((a,b)=>scoreOffer(b)-scoreOffer(a));

  $("results").innerHTML = filtered.map(o=>{
    return `
      <div class="offer-card">
        <div class="bold">${o.operator} — ${o.name}</div>
        <div class="price">${o.price} FCFA</div>
        <div class="meta-line">${formatData(o.data)} • ${o.days} jour(s)</div>
        ${o.promo?'<span class="badge promo">Promo</span>':''}
        <div class="row-actions">
          <button class="btn gray" onclick="copyCode('#1234#')">Afficher le code</button>
        </div>
      </div>
    `;
  }).join("");
}

function formatData(mb){
  if(mb>=1024) return (mb/1024)+" Go";
  return mb+" Mo";
}

function copyCode(code){
  navigator.clipboard.writeText(code);
  const t=$("toast");
  t.style.display="block";
  setTimeout(()=>t.style.display="none",2000);
}

/* ================= INIT ================= */

function init(){
  loadData();
  renderBudgets();
  $("findBtn").addEventListener("click",()=>{
    const b=Number($("budgetInput").value);
    if(b) setBudget(b);
  });
  $("lastUpdate").innerText="aujourd’hui "+nowHHmm();
}

init();
