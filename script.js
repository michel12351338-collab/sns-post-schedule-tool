const STORAGE_KEY = "sns_post_manager_v1";

const STATUSES = [
  "未予約",
  "予約済み",
  "投稿済み",
  "分析済み"
];

const PLATFORMS = [
  "Instagram",
  "TikTok",
  "YouTube Shorts",
  "その他"
];

const LEGACY_STATUS_MAP = {
  "企画中": "未予約",
  "撮影待ち": "未予約",
  "編集待ち": "未予約",
  "確認待ち": "未予約",
  "投稿予定": "未予約",
  "未予約": "未予約",
  "予約済み": "予約済み",
  "投稿済み": "投稿済み",
  "分析済み": "分析済み"
};

const form = document.getElementById("postForm");
const clientNameInput = document.getElementById("clientName");
const planNameInput = document.getElementById("planName");
const postDateInput = document.getElementById("postDate");
const postTimeInput = document.getElementById("postTime");
const platformInput = document.getElementById("platform");
const statusInput = document.getElementById("status");
const memoInput = document.getElementById("memo");
const submitButton = document.getElementById("submitButton");
const cancelEditButton = document.getElementById("cancelEditButton");
const clientFilterInput = document.getElementById("clientFilter");
const platformFilterInput = document.getElementById("platformFilter");
const statusFilterInput = document.getElementById("statusFilter");
const resetFilterButton = document.getElementById("resetFilterButton");
const exportCsvButton = document.getElementById("exportCsvButton");
const calendarMonthText = document.getElementById("calendarMonthText");
const calendarGrid = document.getElementById("calendarGrid");
const prevMonthButton = document.getElementById("prevMonthButton");
const currentMonthButton = document.getElementById("currentMonthButton");
const nextMonthButton = document.getElementById("nextMonthButton");
const monthlySummaryText = document.getElementById("monthlySummaryText");
const monthlySummary = document.getElementById("monthlySummary");
const postList = document.getElementById("postList");
const listCountText = document.getElementById("listCountText");

const lateCount = document.getElementById("lateCount");
const todayCount = document.getElementById("todayCount");
const weekCount = document.getElementById("weekCount");
const unscheduledCount = document.getElementById("unscheduledCount");
const reservedCount = document.getElementById("reservedCount");
const analysisCount = document.getElementById("analysisCount");

let posts = loadPosts();
let editingId = null;
let displayedMonth = new Date();

displayedMonth.setDate(1);
displayedMonth.setHours(0, 0, 0, 0);

// 保存済みデータを読み込み、旧ステータスは投稿スケジュール用の4種類へ寄せます。
function loadPosts() {
  const savedText = localStorage.getItem(STORAGE_KEY);

  if (!savedText) {
    return [];
  }

  try {
    const savedPosts = JSON.parse(savedText);

    if (!Array.isArray(savedPosts)) {
      return [];
    }

    return savedPosts
      .filter((post) => post && post.id)
      .map(normalizePost);
  } catch (error) {
    return [];
  }
}

function normalizePost(post) {
  return {
    id: post.id,
    clientName: post.clientName || "",
    planName: post.planName || "",
    postDate: post.postDate || "",
    postTime: post.postTime || "",
    platform: normalizePlatform(post.platform),
    status: normalizeStatus(post.status),
    memo: post.memo || "",
    createdAt: post.createdAt || new Date().toISOString()
  };
}

function normalizeStatus(status) {
  return LEGACY_STATUS_MAP[status] || "未予約";
}

function normalizePlatform(platform) {
  if (platform === "Instagram / TikTok") {
    return "Instagram";
  }

  if (PLATFORMS.includes(platform)) {
    return platform;
  }

  return "Instagram";
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

function createPostId() {
  return `post-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getFormValues() {
  return {
    clientName: clientNameInput.value.trim(),
    planName: planNameInput.value.trim(),
    postDate: postDateInput.value,
    postTime: postTimeInput.value,
    platform: platformInput.value,
    status: statusInput.value,
    memo: memoInput.value.trim()
  };
}

function validatePost(values) {
  if (!values.clientName || !values.planName || !values.postDate) {
    alert("アカウント名、企画名、投稿日を入力してください。");
    return false;
  }

  if (!values.platform || !PLATFORMS.includes(values.platform)) {
    alert("投稿媒体を選択してください。");
    return false;
  }

  if (!STATUSES.includes(values.status)) {
    alert("ステータスを選択してください。");
    return false;
  }

  return true;
}

function resetForm() {
  form.reset();
  editingId = null;
  submitButton.textContent = "追加する";
  cancelEditButton.classList.add("hidden");
}

function handleFormSubmit(event) {
  event.preventDefault();

  const values = getFormValues();

  if (!validatePost(values)) {
    return;
  }

  if (editingId) {
    updatePost(editingId, values);
  } else {
    addPost(values);
  }

  resetForm();
  savePosts();
  render();
}

function addPost(values) {
  posts.push({
    id: createPostId(),
    ...values,
    createdAt: new Date().toISOString()
  });
}

function updatePost(id, values) {
  posts = posts.map((post) => (
    post.id === id
      ? { ...post, ...values }
      : post
  ));
}

function startEditPost(id) {
  const targetPost = posts.find((post) => post.id === id);

  if (!targetPost) {
    return;
  }

  editingId = id;
  clientNameInput.value = targetPost.clientName;
  planNameInput.value = targetPost.planName;
  postDateInput.value = targetPost.postDate;
  postTimeInput.value = targetPost.postTime || "";
  platformInput.value = normalizePlatform(targetPost.platform);
  statusInput.value = targetPost.status;
  memoInput.value = targetPost.memo;
  submitButton.textContent = "更新する";
  cancelEditButton.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function duplicatePost(id) {
  const targetPost = posts.find((post) => post.id === id);

  if (!targetPost) {
    return;
  }

  editingId = null;
  clientNameInput.value = targetPost.clientName;
  planNameInput.value = targetPost.planName;
  postDateInput.value = targetPost.postDate;
  postTimeInput.value = targetPost.postTime || "";
  platformInput.value = normalizePlatform(targetPost.platform);
  statusInput.value = "未予約";
  memoInput.value = targetPost.memo || "";
  submitButton.textContent = "複製して追加する";
  cancelEditButton.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function startAddPostForDate(dateText) {
  resetForm();
  editingId = null;
  postDateInput.value = dateText;
  statusInput.value = "未予約";
  submitButton.textContent = "この日に追加する";
  cancelEditButton.classList.remove("hidden");
  form.scrollIntoView({ behavior: "smooth", block: "start" });
  clientNameInput.focus();
}

function deletePost(id) {
  const targetPost = posts.find((post) => post.id === id);
  const targetName = targetPost ? `「${targetPost.planName}」` : "この投稿予定";

  if (!confirm(`${targetName}を削除しますか？`)) {
    return;
  }

  posts = posts.filter((post) => post.id !== id);

  if (editingId === id) {
    resetForm();
  }

  savePosts();
  render();
}

function getTodayText() {
  return formatDate(new Date());
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatMonth(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function parseDate(dateText) {
  return new Date(`${dateText}T00:00:00`);
}

// 月曜始まりで今週の範囲を判定します。
function getWeekRange() {
  const today = parseDate(getTodayText());
  const day = today.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;
  const sundayDiff = day === 0 ? 0 : 7 - day;
  const weekStart = new Date(today);
  const weekEnd = new Date(today);

  weekStart.setDate(today.getDate() + mondayDiff);
  weekEnd.setDate(today.getDate() + sundayDiff);

  return { weekStart, weekEnd };
}

function isToday(post) {
  return post.postDate === getTodayText();
}

function isPastDate(post) {
  return parseDate(post.postDate) < parseDate(getTodayText());
}

function isFutureThisWeek(post) {
  const { weekEnd } = getWeekRange();
  const targetDate = parseDate(post.postDate);
  const tomorrow = parseDate(getTodayText());

  tomorrow.setDate(tomorrow.getDate() + 1);

  return targetDate >= tomorrow && targetDate <= weekEnd;
}

function needsPostingWork(post) {
  return post.status === "未予約" || post.status === "予約済み";
}

function isLatePost(post) {
  return isPastDate(post) && needsPostingWork(post);
}

function isTodayPost(post) {
  return isToday(post) && needsPostingWork(post);
}

function isWeekPost(post) {
  return isFutureThisWeek(post) && needsPostingWork(post);
}

function getAutoLabel(post) {
  if (post.status === "分析済み") {
    return { text: "完了", className: "completed" };
  }

  if (post.status === "投稿済み") {
    return { text: "分析待ち", className: "needs-analysis" };
  }

  if (isLatePost(post)) {
    return { text: "投稿遅れ", className: "late-post" };
  }

  if (isTodayPost(post)) {
    return { text: "今日投稿", className: "today-post" };
  }

  if (isWeekPost(post)) {
    return { text: "今週投稿", className: "week-post" };
  }

  return null;
}

function getUrgencyRank(post) {
  if (isLatePost(post)) {
    return 1;
  }

  if (isTodayPost(post)) {
    return 2;
  }

  if (isWeekPost(post)) {
    return 3;
  }

  return 4;
}

function getUrgencyClass(post) {
  if (isLatePost(post)) {
    return "urgency-late";
  }

  if (isTodayPost(post)) {
    return "urgency-today";
  }

  return "";
}

function getStatusClass(status) {
  const classMap = {
    "未予約": "status-unscheduled",
    "予約済み": "status-reserved",
    "投稿済み": "status-posted",
    "分析済み": "status-analyzed"
  };

  return classMap[status] || "status-unscheduled";
}

function getCalendarItemClass(post) {
  const autoLabel = getAutoLabel(post);

  if (autoLabel) {
    return autoLabel.className;
  }

  return getStatusClass(post.status);
}

function getFilteredPostsOnly() {
  const clientKeyword = clientFilterInput.value.trim().toLowerCase();
  const platformKeyword = platformFilterInput.value;
  const statusKeyword = statusFilterInput.value;

  return posts.filter((post) => {
    const matchesClient = post.clientName.toLowerCase().includes(clientKeyword);
    const matchesPlatform = !platformKeyword || normalizePlatform(post.platform) === platformKeyword;
    const matchesStatus = !statusKeyword || post.status === statusKeyword;

    return matchesClient && matchesPlatform && matchesStatus;
  });
}

function getFilteredPosts() {
  return getFilteredPostsOnly().sort(comparePostsByUrgency);
}

function comparePostsByUrgency(a, b) {
  const urgencyDiff = getUrgencyRank(a) - getUrgencyRank(b);

  if (urgencyDiff !== 0) {
    return urgencyDiff;
  }

  return comparePostsByDateTime(a, b);
}

function comparePostsByDateTime(a, b) {
  if (a.postDate !== b.postDate) {
    return a.postDate.localeCompare(b.postDate);
  }

  const aTime = a.postTime || "99:99";
  const bTime = b.postTime || "99:99";

  if (aTime !== bTime) {
    return aTime.localeCompare(bTime);
  }

  return a.createdAt.localeCompare(b.createdAt);
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  const escapedText = text.replaceAll('"', '""');

  return `"${escapedText}"`;
}

function createCsvText(targetPosts) {
  const headers = [
    "アカウント名",
    "企画名",
    "投稿日",
    "投稿時間",
    "投稿媒体",
    "ステータス",
    "メモ",
    "作成日時"
  ];
  const rows = targetPosts.map((post) => [
    post.clientName,
    post.planName,
    post.postDate,
    post.postTime || "",
    normalizePlatform(post.platform),
    post.status,
    post.memo || "",
    post.createdAt || ""
  ]);

  return [
    headers.map(escapeCsvValue).join(","),
    ...rows.map((row) => row.map(escapeCsvValue).join(","))
  ].join("\n");
}

function downloadCsv() {
  if (posts.length === 0) {
    alert("エクスポートできる投稿予定がありません。");
    return;
  }

  const sortedPosts = [...posts].sort(comparePostsByDateTime);
  const csvText = createCsvText(sortedPosts);
  const blob = new Blob([`\uFEFF${csvText}`], {
    type: "text/csv;charset=utf-8;"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = getTodayText();

  link.href = url;
  link.download = `sns-post-schedule-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function updateSummary() {
  const summary = getFilteredPostsOnly().reduce((counts, post) => {
    if (isLatePost(post)) {
      counts.late += 1;
    }

    if (isTodayPost(post)) {
      counts.today += 1;
    }

    if (isWeekPost(post)) {
      counts.week += 1;
    }

    if (post.status === "未予約") {
      counts.unscheduled += 1;
    }

    if (post.status === "予約済み") {
      counts.reserved += 1;
    }

    if (post.status === "投稿済み") {
      counts.analysis += 1;
    }

    return counts;
  }, {
    late: 0,
    today: 0,
    week: 0,
    unscheduled: 0,
    reserved: 0,
    analysis: 0
  });

  lateCount.textContent = summary.late;
  todayCount.textContent = summary.today;
  weekCount.textContent = summary.week;
  unscheduledCount.textContent = summary.unscheduled;
  reservedCount.textContent = summary.reserved;
  analysisCount.textContent = summary.analysis;
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createPostCard(post) {
  const autoLabel = getAutoLabel(post);
  const labelHtml = autoLabel
    ? `<span class="auto-label ${autoLabel.className}">${autoLabel.text}</span>`
    : "";
  const timeHtml = post.postTime
    ? `<span><b>投稿時間：</b>${escapeHtml(post.postTime)}</span>`
    : "";
  const platformHtml = `<span><b>媒体：</b>${escapeHtml(normalizePlatform(post.platform))}</span>`;
  const memoHtml = post.memo
    ? `<p class="post-memo">${escapeHtml(post.memo)}</p>`
    : `<p class="post-memo muted">メモなし</p>`;

  return `
    <article class="post-card ${getStatusClass(post.status)} ${getUrgencyClass(post)}">
      <div class="post-main">
        <h3>${escapeHtml(post.planName)}</h3>
        <div class="post-meta">
          <span class="pill ${getStatusClass(post.status)}">${escapeHtml(post.status)}</span>
          ${labelHtml}
        </div>
        <div class="post-info">
          <span><b>アカウント：</b>${escapeHtml(post.clientName)}</span>
          ${platformHtml}
          <span><b>投稿日：</b>${escapeHtml(post.postDate)}</span>
          ${timeHtml}
        </div>
        ${memoHtml}
      </div>
      <div class="card-actions">
        <button type="button" class="secondary-button" data-action="duplicate" data-id="${post.id}">複製</button>
        <button type="button" class="secondary-button" data-action="edit" data-id="${post.id}">編集</button>
        <button type="button" class="danger-button" data-action="delete" data-id="${post.id}">削除</button>
      </div>
    </article>
  `;
}

function renderPostList() {
  const filteredPosts = getFilteredPosts();
  listCountText.textContent = `${filteredPosts.length}件の投稿予定`;

  if (filteredPosts.length === 0) {
    postList.innerHTML = '<p class="empty-message">表示できる投稿予定がありません。</p>';
    return;
  }

  postList.innerHTML = filteredPosts.map(createPostCard).join("");
}

function getCalendarStartDate(monthDate) {
  const firstDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const day = firstDate.getDay();
  const mondayDiff = day === 0 ? -6 : 1 - day;

  firstDate.setDate(firstDate.getDate() + mondayDiff);

  return firstDate;
}

function getPostsForDate(dateText) {
  return getFilteredPostsOnly()
    .filter((post) => post.postDate === dateText)
    .sort(comparePostsByDateTime);
}

function getPostsForDisplayedMonth() {
  return getFilteredPostsOnly().filter((post) => {
    const targetDate = parseDate(post.postDate);

    return (
      targetDate.getFullYear() === displayedMonth.getFullYear() &&
      targetDate.getMonth() === displayedMonth.getMonth()
    );
  });
}

function getMonthlySummary() {
  const monthPosts = getPostsForDisplayedMonth();
  const summary = {
    total: monthPosts.length,
    clients: {},
    platforms: {
      "Instagram": 0,
      "TikTok": 0,
      "YouTube Shorts": 0,
      "その他": 0
    }
  };

  monthPosts.forEach((post) => {
    const platform = normalizePlatform(post.platform);

    if (!summary.platforms[platform]) {
      summary.platforms[platform] = 0;
    }

    summary.platforms[platform] += 1;

    if (!summary.clients[post.clientName]) {
      summary.clients[post.clientName] = {
        total: 0,
        "未予約": 0,
        "予約済み": 0,
        "投稿済み": 0,
        "分析済み": 0,
        platforms: {
          "Instagram": 0,
          "TikTok": 0,
          "YouTube Shorts": 0,
          "その他": 0
        }
      };
    }

    summary.clients[post.clientName].total += 1;
    summary.clients[post.clientName][post.status] += 1;

    if (!summary.clients[post.clientName].platforms[platform]) {
      summary.clients[post.clientName].platforms[platform] = 0;
    }

    summary.clients[post.clientName].platforms[platform] += 1;
  });

  return summary;
}

function renderMonthlySummary() {
  const summary = getMonthlySummary();
  monthlySummaryText.textContent = `${formatMonth(displayedMonth)}の登録投稿数`;

  if (summary.total === 0) {
    monthlySummary.innerHTML = '<p class="empty-message">この月の投稿予定はありません。</p>';
    return;
  }

  const clientRows = Object.entries(summary.clients)
    .sort((a, b) => {
      if (b[1].total !== a[1].total) {
        return b[1].total - a[1].total;
      }

      return a[0].localeCompare(b[0], "ja");
    })
    .map(([clientName, counts]) => {
      const clientPlatformRows = Object.entries(counts.platforms)
        .map(([platform, count]) => `<span>${escapeHtml(platform)}：${count}</span>`)
        .join("");

      return `
        <article class="monthly-client-card">
          <h3>${escapeHtml(clientName)}</h3>
          <p class="monthly-total">登録合計：${counts.total}本</p>
          <p class="monthly-subtitle">ステータス別</p>
          <div class="monthly-breakdown">
            <span>未予約：${counts["未予約"]}</span>
            <span>予約済み：${counts["予約済み"]}</span>
            <span>投稿済み：${counts["投稿済み"]}</span>
            <span>分析済み：${counts["分析済み"]}</span>
          </div>
          <p class="monthly-subtitle">媒体別</p>
          <div class="monthly-breakdown">
            ${clientPlatformRows}
          </div>
        </article>
      `;
    })
    .join("");
  const platformRows = Object.entries(summary.platforms)
    .map(([platform, count]) => `<span>${escapeHtml(platform)}：${count}本</span>`)
    .join("");

  monthlySummary.innerHTML = `
    <div class="monthly-total-card">
      <span>${formatMonth(displayedMonth)}の登録合計</span>
      <strong>${summary.total}本</strong>
    </div>
    <div class="monthly-platform-card">
      <h3>媒体別</h3>
      <div class="monthly-breakdown">
        ${platformRows}
      </div>
    </div>
    <div class="monthly-client-grid">
      ${clientRows}
    </div>
  `;
}

function createCalendarPostButton(post) {
  const timeText = post.postTime ? `${escapeHtml(post.postTime)} ` : "";

  return `
    <button type="button" class="calendar-post ${getCalendarItemClass(post)}" data-id="${post.id}">
      ${timeText}${escapeHtml(post.clientName)}｜${escapeHtml(normalizePlatform(post.platform))}｜${escapeHtml(post.planName)}｜${escapeHtml(post.status)}
    </button>
  `;
}

function renderCalendar() {
  const startDate = getCalendarStartDate(displayedMonth);
  const todayText = getTodayText();
  const cells = [];

  calendarMonthText.textContent = `${formatMonth(displayedMonth)}の投稿予定`;

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(startDate);
    cellDate.setDate(startDate.getDate() + index);

    const dateText = formatDate(cellDate);
    const isCurrentMonth = cellDate.getMonth() === displayedMonth.getMonth();
    const dayPosts = isCurrentMonth ? getPostsForDate(dateText) : [];
    const currentMonthClass = isCurrentMonth ? "" : "outside-month";
    const todayClass = dateText === todayText ? "calendar-today" : "";
    const postButtons = dayPosts.map(createCalendarPostButton).join("");

    cells.push(`
      <div class="calendar-day ${currentMonthClass} ${todayClass}" data-date="${dateText}">
        <div class="calendar-date">
          <span>${cellDate.getDate()}</span>
        </div>
        <div class="calendar-posts">
          ${postButtons}
        </div>
      </div>
    `);
  }

  calendarGrid.innerHTML = cells.join("");
}

function moveCalendarMonth(diff) {
  displayedMonth.setMonth(displayedMonth.getMonth() + diff);
  displayedMonth.setDate(1);
  render();
}

function resetCalendarToCurrentMonth() {
  displayedMonth = new Date();
  displayedMonth.setDate(1);
  displayedMonth.setHours(0, 0, 0, 0);
  render();
}

function render() {
  updateSummary();
  renderCalendar();
  renderMonthlySummary();
  renderPostList();
}

form.addEventListener("submit", handleFormSubmit);

cancelEditButton.addEventListener("click", resetForm);

clientFilterInput.addEventListener("input", render);
platformFilterInput.addEventListener("change", render);
statusFilterInput.addEventListener("change", render);

resetFilterButton.addEventListener("click", () => {
  clientFilterInput.value = "";
  platformFilterInput.value = "";
  statusFilterInput.value = "";
  render();
});

exportCsvButton.addEventListener("click", downloadCsv);

prevMonthButton.addEventListener("click", () => moveCalendarMonth(-1));
currentMonthButton.addEventListener("click", resetCalendarToCurrentMonth);
nextMonthButton.addEventListener("click", () => moveCalendarMonth(1));

calendarGrid.addEventListener("click", (event) => {
  const postButton = event.target.closest(".calendar-post");

  if (postButton) {
    event.stopPropagation();
    startEditPost(postButton.dataset.id);
    return;
  }

  const dayCell = event.target.closest(".calendar-day");

  if (!dayCell || dayCell.classList.contains("outside-month")) {
    return;
  }

  const dateText = dayCell.dataset.date;

  if (!dateText) {
    return;
  }

  startAddPostForDate(dateText);
});

postList.addEventListener("click", (event) => {
  const button = event.target.closest("button");

  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const id = button.dataset.id;

  if (action === "duplicate") {
    duplicatePost(id);
  }

  if (action === "edit") {
    startEditPost(id);
  }

  if (action === "delete") {
    deletePost(id);
  }
});

render();
