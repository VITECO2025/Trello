const STAGES = [
  "Cơ hội","1.Báo giá","2.Kiểm tra","3.Làm thầu","4.Nộp thầu","5.Hợp đồng",
  "6.Đặt hàng","7.Giao hàng","8.Nghiệm thu","9.Xuất hóa đơn","9a.Hoàn tất","9b.Thất bại","Có bảo trì","Ký quỹ thu lại"
];

const seed = [
  { OrderCode:"KD416", Stage:"1.Báo giá", Value:0, SaleOwner:"Thiếu sale", CustomerName:"BVĐK Sóc Trăng", OrderName:"Mua sắm vật tư, linh kiện theo máy năm 2026", ProgressPct:10, Deadline:"2026-02-15" },
  { OrderCode:"KD329", Stage:"1.Báo giá", Value:0, SaleOwner:"Anh Chí", CustomerName:"BV Mắt TPHCM", OrderName:"Danh mục thiết bị 2026", ProgressPct:10, Deadline:"2026-02-10" },
  { OrderCode:"KT418", Stage:"4.Nộp thầu", Value:95000000, SaleOwner:"Huỳnh Long", CustomerName:"BV Quận Gò Vấp", OrderName:"Bảo trì, sửa chữa thay thế linh kiện", ProgressPct:40, Deadline:"2026-01-20" },
  { OrderCode:"KD332", Stage:"9b.Thất bại", Value:0, SaleOwner:"Anh Chí", CustomerName:"BV Tâm Trí", OrderName:"Máy hấp nhiệt độ thấp", ProgressPct:0, Deadline:"2026-01-12" },
  { OrderCode:"KD155", Stage:"9a.Hoàn tất", Value:1778000000, SaleOwner:"Tân - Sago", CustomerName:"TTYT Bình Thạnh", OrderName:"Danh mục thiết bị", ProgressPct:100, Deadline:"2025-12-30" }
];

const LS_KEY = "KANBAN_DEMO_V1";

function loadData() {
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw);
  const init = seed.map(x => ({...x, Comments: [], Attachments: [] }));
  localStorage.setItem(LS_KEY, JSON.stringify(init));
  return init;
}
function saveData(items){ localStorage.setItem(LS_KEY, JSON.stringify(items)); }

let items = loadData();
let selected = null;

const elBoard = document.getElementById("board");
const elQ = document.getElementById("q");
const elSale = document.getElementById("sale");
const elDeadline = document.getElementById("deadline");
const elPct = document.getElementById("pct");
const elReset = document.getElementById("reset");

const elModal = document.getElementById("modal");
const elClose = document.getElementById("close");
const elMTitle = document.getElementById("mTitle");
const elMMeta = document.getElementById("mMeta");
const elNote = document.getElementById("note");
const elSaveNote = document.getElementById("saveNote");
const elQuick = document.getElementById("quick");

function uniq(arr){ return [...new Set(arr)].filter(Boolean); }

function isOverdue(dateStr){
  if(!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  d.setHours(0,0,0,0); now.setHours(0,0,0,0);
  return d < now;
}
function in7Days(dateStr){
  if(!dateStr) return false;
  const d = new Date(dateStr);
  const now = new Date();
  const t = new Date(now); t.setDate(now.getDate()+7);
  return d >= now && d <= t;
}
function pctBucket(p){
  const n = Number(p||0);
  if (n <= 30) return "0-30";
  if (n <= 70) return "30-70";
  return "70-100";
}

function applyFilters(list){
  const q = (elQ.value || "").toLowerCase().trim();
  const sale = elSale.value;
  const dl = elDeadline.value;
  const pct = elPct.value;

  return list.filter(x=>{
    if (sale && x.SaleOwner !== sale) return false;
    if (pct && pctBucket(x.ProgressPct) !== pct) return false;
    if (dl === "overdue" && !isOverdue(x.Deadline)) return false;
    if (dl === "7days" && !in7Days(x.Deadline)) return false;
    if (q){
      const hay = `${x.OrderCode} ${x.CustomerName} ${x.OrderName} ${x.SaleOwner}`.toLowerCase();
      if(!hay.includes(q)) return false;
    }
    return true;
  });
}
function nowStr(){
  const d = new Date();
  const pad = (n)=> String(n).padStart(2,"0");
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function getUserName(){
  // demo: lưu tên người dùng trong localStorage
  const k = "KANBAN_DEMO_USER";
  let name = localStorage.getItem(k);
  if(!name){
    name = prompt("Nhập tên bạn (để hiển thị khi comment):","") || "Unknown";
    localStorage.setItem(k, name);
  }
  return name;
}
function render(){
  // sales dropdown
  const sales = uniq(items.map(x=>x.SaleOwner));
  elSale.innerHTML = `<option value="">Tất cả Sale</option>` + sales.map(s=>`<option>${s}</option>`).join("");

  const filtered = applyFilters(items);

  elBoard.innerHTML = "";
  STAGES.forEach(stage=>{
    const col = document.createElement("div");
    col.className = "col";
    col.dataset.stage = stage;

    const cards = filtered.filter(x=>x.Stage===stage);

    col.innerHTML = `<h3><span>${stage}</span><span>${cards.length}</span></h3><div class="list"></div>`;
    const list = col.querySelector(".list");

    col.addEventListener("dragover", (ev)=>ev.preventDefault());
    col.addEventListener("drop", (ev)=>{
      ev.preventDefault();
      const code = ev.dataTransfer.getData("text/orderCode");
      const idx = items.findIndex(i=>i.OrderCode===code);
      if (idx>=0){
        items[idx].Stage = stage;
        saveData(items);
        render();
      }
    });

    cards.forEach(card=>{
      const c = document.createElement("div");
      c.className = "card";
      c.draggable = true;

      const overdue = isOverdue(card.Deadline) && !["9a.Hoàn tất","9b.Thất bại"].includes(card.Stage);

      c.innerHTML = `
        <div class="t1">[${card.OrderCode}] ${card.CustomerName}</div>
        <div class="small" style="margin-top:4px">${card.OrderName}</div>
        <div class="meta">
          <span class="pill">${card.SaleOwner}</span>
          <span class="pill">${Number(card.ProgressPct||0)}%</span>
          <span class="pill ${overdue?'danger':''}">DL: ${card.Deadline||'—'}</span>
          ${card.Value ? `<span class="pill">₫${Number(card.Value).toLocaleString('vi-VN')}</span>` : ``}
        </div>
      `;

      c.addEventListener("dragstart",(ev)=>{
        ev.dataTransfer.setData("text/orderCode", card.OrderCode);
      });

      c.addEventListener("click",()=>openModal(card.OrderCode));
      list.appendChild(c);
    });

    elBoard.appendChild(col);
  });
}
// Cuộn ngang bằng con lăn chuột
elBoard.addEventListener("wheel", (e) => {
  // Nếu đang cuộn dọc thì chuyển thành cuộn ngang
  if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
    e.preventDefault();
    elBoard.scrollLeft += e.deltaY;
  }
}, { passive: false });
function openModal(orderCode){
  selected = items.find(x=>x.OrderCode===orderCode);
  if(!selected) return;
  elMTitle.textContent = `[${selected.OrderCode}] ${selected.CustomerName} - ${selected.OrderName}`;
  elMMeta.innerHTML = `
    <span class="pill">${selected.Stage}</span>
    <span class="pill">${selected.SaleOwner}</span>
    <span class="pill">${selected.ProgressPct||0}%</span>
    <span class="pill">DL: ${selected.Deadline||'—'}</span>
  `;
  elQuick.innerHTML = `
    <span class="pill">Value: ${selected.Value?`₫${Number(selected.Value).toLocaleString('vi-VN')}`:"—"}</span>
    <span class="pill">${isOverdue(selected.Deadline)?"Quá hạn":"Đúng hạn/Chưa tới"}</span>
  `;
  elNote.value = selected.Notes || "";
  elModal.classList.add("show");
}

elClose.onclick = ()=> elModal.classList.remove("show");
elModal.addEventListener("click",(e)=>{ if(e.target===elModal) elModal.classList.remove("show"); });

elSaveNote.onclick = ()=>{
  if(!selected) return;
  const idx = items.findIndex(x=>x.OrderCode===selected.OrderCode);
  items[idx].Notes = elNote.value;
  saveData(items);
  elModal.classList.remove("show");
  render();
};

[elQ, elSale, elDeadline, elPct].forEach(el=> el.addEventListener("input", render));
elReset.onclick = ()=>{
  localStorage.removeItem(LS_KEY);
  items = loadData();
  render();
};

render();
