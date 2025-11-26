const MSGID_PREFIX = "msgid";
const MSGSTR_PREFIX = "msgstr";
const QUOTE_PATTERN = /^msg(?:id|str)\s+"([\s\S]*)"$/;
const PAGE_SIZES = [10, 20, 30, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

const fileInput = document.getElementById("po-input");
const tableBody = document.getElementById("po-table-body");
const pageSizeSelect = document.getElementById("page-size");
const paginationInfo = document.getElementById("pagination-info");
const prevBtn = document.getElementById("prev-page");
const nextBtn = document.getElementById("next-page");
const fileNameLabel = document.getElementById("file-name");
const detailModal = document.getElementById("detail-modal");
const detailModalCard = document.getElementById("detail-modal-card");
const detailType = document.getElementById("detail-type");
const detailText = document.getElementById("detail-text");
const closeModalBtn = document.getElementById("close-modal");
const closeModalFooter = document.getElementById("close-modal-footer");

let parsedEntries = [];
let currentPage = 1;
let currentPageSize = PAGE_SIZES[0];

initializePageSizeOptions();
updatePaginationInfo();

fileInput.addEventListener("change", handleFileSelection);
pageSizeSelect.addEventListener("change", handlePageSizeChange);
prevBtn.addEventListener("click", () => changePage(currentPage - 1));
nextBtn.addEventListener("click", () => changePage(currentPage + 1));
closeModalBtn.addEventListener("click", closeDetailModal);
closeModalFooter.addEventListener("click", closeDetailModal);
detailModal.addEventListener("click", (event) => {
  if (event.target === detailModal) {
    closeDetailModal();
  }
});
detailModalCard.addEventListener("click", (event) => {
  event.stopPropagation();
});

function initializePageSizeOptions() {
  pageSizeSelect.innerHTML = PAGE_SIZES.map(
    (size) => `<option value="${size}">${size} dòng</option>`
  ).join("");
  pageSizeSelect.value = String(currentPageSize);
}

function handleFileSelection(event) {
  const [file] = event.target.files;
  if (!file) {
    return;
  }

  if (!file.name.endsWith(".po")) {
    renderEmptyState("Tệp phải có đuôi .po");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const content = reader.result;
    parsedEntries = parsePo(content);
    currentPage = 1;
    fileNameLabel.textContent = `Đã tải: ${file.name}`;
    renderTable();
  };
  reader.onerror = () => renderEmptyState("Không thể đọc tệp đã chọn");
  reader.readAsText(file, "utf-8");
}

function handlePageSizeChange(event) {
  currentPageSize = Number(event.target.value);
  currentPage = 1;
  renderTable();
}

function changePage(targetPage) {
  const maxPage = Math.max(1, Math.ceil(parsedEntries.length / currentPageSize));
  currentPage = Math.min(Math.max(1, targetPage), maxPage);
  renderTable();
}

function renderTable() {
  if (!parsedEntries.length) {
    renderEmptyState("Không tìm thấy cặp msgid/msgstr nào");
    return;
  }

  const start = (currentPage - 1) * currentPageSize;
  const end = Math.min(start + currentPageSize, parsedEntries.length);
  const visibleRows = parsedEntries.slice(start, end);

  tableBody.innerHTML = "";

  visibleRows.forEach((row, idx) => {
    const tr = document.createElement("tr");
    tr.className = "hover:bg-slate-50 transition";

    const msgidCell = document.createElement("td");
    msgidCell.className = "w-[600px] cursor-pointer px-6 py-4 text-sm text-slate-900 truncate";
    msgidCell.textContent = row.id;
    msgidCell.title = row.id;
    msgidCell.addEventListener("click", () => openDetailModal("msgid", row.id));

    const msgstrCell = document.createElement("td");
    msgstrCell.className = "w-[600px] cursor-pointer px-6 py-4 text-sm text-slate-600 truncate";
    msgstrCell.textContent = row.value;
    msgstrCell.title = row.value;
    msgstrCell.addEventListener("click", () => openDetailModal("msgstr", row.value));

    const actionCell = document.createElement("td");
    actionCell.className = "w-[200px] px-6 py-4";
    actionCell.innerHTML = `
      <button
        type="button"
        class="inline-flex rounded-full border border-primary-200 bg-primary-50 px-4 py-1 text-xs font-semibold text-primary-600 hover:bg-primary-100"
      >
        Chi tiết #${start + idx + 1}
      </button>
    `;

    tr.appendChild(msgidCell);
    tr.appendChild(msgstrCell);
    tr.appendChild(actionCell);
    tableBody.appendChild(tr);
  });

  updatePaginationInfo(start, end);
}

function renderEmptyState(message) {
  tableBody.innerHTML = `
    <tr>
      <td colspan="3" class="px-6 py-10 text-center text-sm text-slate-500">${sanitize(message)}</td>
    </tr>
  `;
  updatePaginationInfo(0, 0);
}

function updatePaginationInfo(start = 0, end = 0) {
  const total = parsedEntries.length;
  if (!total) {
    paginationInfo.textContent = "Hiển thị 0-0 / 0 bản ghi";
  } else {
    paginationInfo.textContent = `Hiển thị ${start + 1}-${end} / ${total} bản ghi`;
  }

  const maxPage = Math.max(1, Math.ceil(total / currentPageSize));
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= maxPage;
}

function parsePo(content) {
  if (!content) {
    return [];
  }

  const lines = content.split(/\r?\n/);
  const entries = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index].trim();

    if (!line.startsWith(MSGID_PREFIX)) {
      continue;
    }

    const msgid = extractValue(line);

    let msgstr = "";
    let seekIndex = index + 1;
    while (seekIndex < lines.length) {
      const candidate = lines[seekIndex].trim();
      if (!candidate) {
        seekIndex += 1;
        continue;
      }
      if (candidate.startsWith(MSGSTR_PREFIX)) {
        msgstr = extractValue(candidate);
      }
      break;
    }

    if (msgid !== null && msgstr !== null) {
      entries.push({
        id: msgid,
        value: msgstr,
      });
    }
  }

  return entries;
}

function extractValue(line) {
  const match = line.match(QUOTE_PATTERN);
  if (!match) {
    return null;
  }
  return match[1];
}

function sanitize(value) {
  if (typeof value !== "string") {
    return "";
  }
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function openDetailModal(type, value) {
  detailType.textContent = type === "msgid" ? "msgid" : "msgstr";
  detailText.value = value;
  detailModal.classList.remove("hidden");
  detailModal.classList.add("flex");
  document.body.classList.add("overflow-hidden");
}

function closeDetailModal() {
  detailModal.classList.add("hidden");
  detailModal.classList.remove("flex");
  document.body.classList.remove("overflow-hidden");
}

