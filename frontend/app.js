// 多语言配置
const i18n = {
  'zh-CN': {
    title: 'AI 解决方案生成器',
    subtitle: '描述您的业务痛点，AI 为您定制专属技术方案',
    placeholder: '例如：我经营一家连锁餐厅，每天排队等位时间长，顾客流失严重，需要一个智能排队和预约系统...',
    generateBtn: '生成解决方案',
    generating: '生成中...',
    loading: 'AI 正在分析您的需求',
    industries: ['零售', '餐饮', '物流', '医疗', '教育', '金融', '美容', '酒店', '制造', '更多'],
    more: '更多',
    noResults: '暂无生成结果',
    noResultsTip: '请重试，或检查网络与 API 配置',
    painPointLabel: '解决痛点：',
    coreFeatures: '✦ 核心功能',
    devQuote: '📦 开发报价',
    devPrice: '开发价格',
    devDuration: '开发周期',
    techStack: '技术栈',
    resources: '所需资源',
    humanResources: '人力配置',
    maintenance: '🔧 运维成本',
    maintenanceDuration: '维护周期',
    monthlyFee: '每月维护费用',
    month: '月',
    person: '人',
    emptyInput: '请输入您的业务痛点',
    error: '错误：',
    requestFailed: '请求失败：',
    followTitle: '关注我们获取方案',
    followDesc: '扫描下方二维码关注我们的 Facebook 专页，即可免费查看完整解决方案',
    followBtn: '我已关注，查看方案',
    followSkip: '稍后再说'
  },
  'zh-TW': {
    title: 'AI 解決方案生成器',
    subtitle: '描述您的業務痛點，AI 為您定制專屬技術方案',
    placeholder: '例如：我經營一家連鎖餐廳，每天排隊等位時間長，顧客流失嚴重，需要一個智能排隊和預約系統...',
    generateBtn: '生成解決方案',
    generating: '生成中...',
    loading: 'AI 正在分析您的需求',
    industries: ['零售', '餐飲', '物流', '醫療', '教育', '金融', '美容', '酒店', '製造', '更多'],
    more: '更多',
    noResults: '暫無生成結果',
    noResultsTip: '請重試，或檢查網絡與 API 配置',
    painPointLabel: '解決痛點：',
    coreFeatures: '✦ 核心功能',
    devQuote: '📦 開發報價',
    devPrice: '開發價格',
    devDuration: '開發週期',
    techStack: '技術棧',
    resources: '所需資源',
    humanResources: '人力配置',
    maintenance: '🔧 運維成本',
    maintenanceDuration: '維護週期',
    monthlyFee: '每月維護費用',
    month: '月',
    person: '人',
    emptyInput: '請輸入您的業務痛點',
    error: '錯誤：',
    requestFailed: '請求失敗：',
    followTitle: '關注我們獲取方案',
    followDesc: '掃描下方二維碼關注我們的 Facebook 專頁，即可免費查看完整解決方案',
    followBtn: '我已關注，查看方案',
    followSkip: '稍後再說'
  },
  'en': {
    title: 'AI Solution Generator',
    subtitle: 'Describe your business pain points, AI will customize solutions for you',
    placeholder: 'E.g.: I run a chain restaurant, long waiting times every day, losing customers, need a smart queuing and reservation system...',
    generateBtn: 'Generate Solution',
    generating: 'Generating...',
    loading: 'AI is analyzing your requirements',
    industries: ['Retail', 'F&B', 'Logistics', 'Healthcare', 'Education', 'Finance', 'Beauty', 'Hotel', 'Manufacturing', 'More'],
    more: 'More',
    noResults: 'No result generated',
    noResultsTip: 'Please retry or check network and API configuration',
    painPointLabel: 'Pain Point: ',
    coreFeatures: '✦ Core Features',
    devQuote: '📦 Development Quote',
    devPrice: 'Development Price',
    devDuration: 'Development Duration',
    techStack: 'Tech Stack',
    resources: 'Resources Required',
    humanResources: 'Human Resources',
    maintenance: '🔧 Maintenance Cost',
    maintenanceDuration: 'Maintenance Duration',
    monthlyFee: 'Monthly Fee',
    month: 'mo',
    person: '',
    emptyInput: 'Please enter your business pain point',
    error: 'Error: ',
    requestFailed: 'Request failed: ',
    followTitle: 'Follow Us to View Solution',
    followDesc: 'Scan the QR code below to follow our Facebook page and unlock your free solution',
    followBtn: 'I\'ve Followed, Show Solution',
    followSkip: 'Maybe Later'
  }
};

// 当前语言
let currentLang = localStorage.getItem('lang') || 'zh-CN';

// 获取翻译
function t(key) {
  return i18n[currentLang][key] || key;
}

// 切换语言
function switchLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('lang', lang);
  updateUI();
}

// 更新界面语言
function updateUI() {
  document.querySelector('[data-i18n="title"]').textContent = t('title');
  document.querySelector('[data-i18n="subtitle"]').textContent = t('subtitle');
  document.querySelector('[data-i18n="generateBtn"]').textContent = t('generateBtn');
  document.querySelector('[data-i18n="loading"]').textContent = t('loading');
  document.getElementById('painPointInput').placeholder = t('placeholder');

  const footerTags = document.getElementById('footerTags');
  footerTags.innerHTML = t('industries').map(ind => `<span>${ind}</span>`).join('');

  document.title = t('title') + ' | YuniTech';
  document.documentElement.lang = currentLang;
}

// 初始化语言选择器
document.getElementById('langSelect').value = currentLang;
document.getElementById('langSelect').addEventListener('change', (e) => {
  switchLanguage(e.target.value);
});

updateUI();

// ===== 前端逻辑 =====
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

const FB_PAGE_URL = 'https://www.facebook.com/yuniaifreelance';
const FB_QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(FB_PAGE_URL)}`;

let pendingResultData = null;

function showFbModal() {
  const modal = document.getElementById('fbModal');
  document.getElementById('fbModalTitle').textContent = t('followTitle');
  document.getElementById('fbModalDesc').textContent = t('followDesc');
  document.getElementById('fbConfirmBtn').textContent = t('followBtn');
  document.getElementById('fbSkipBtn').textContent = t('followSkip');
  document.getElementById('fbQrCode').src = FB_QR_API;
  modal.style.display = 'flex';
}

function hideFbModal() {
  document.getElementById('fbModal').style.display = 'none';
}

document.getElementById('fbConfirmBtn').addEventListener('click', () => {
  hideFbModal();
  if (pendingResultData) {
    displayResults(pendingResultData);
    pendingResultData = null;
  }
});

document.getElementById('fbSkipBtn').addEventListener('click', () => {
  hideFbModal();
  pendingResultData = null;
});

document.getElementById('fbCloseBtn').addEventListener('click', () => {
  hideFbModal();
  pendingResultData = null;
});

document.getElementById('matchBtn').addEventListener('click', async () => {
  const painPoint = document.getElementById('painPointInput').value.trim();

  if (!painPoint) {
    alert(t('emptyInput'));
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ painPoint, lang: currentLang })
    });

    const result = await response.json();

    if (result.success) {
      pendingResultData = result.data;
      showLoading(false);
      showFbModal();
    } else {
      showLoading(false);
      alert(t('error') + result.error);
    }
  } catch (error) {
    showLoading(false);
    alert(t('requestFailed') + error.message);
  }
});

// Ctrl+Enter 提交
document.getElementById('painPointInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && e.ctrlKey) {
    document.getElementById('matchBtn').click();
  }
});

// ===== 加载状态 =====
function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'flex' : 'none';
  document.getElementById('results').style.display = show ? 'none' : 'block';
  const btn = document.getElementById('matchBtn');
  btn.disabled = show;
  btn.innerHTML = show
    ? `<span class="btn-text">${t('generating')}</span>`
    : `<span class="btn-text" data-i18n="generateBtn">${t('generateBtn')}</span><span class="btn-icon">→</span>`;
}

// ===== 格式化价格 =====
function formatPrice(price) {
  return new Intl.NumberFormat('zh-HK').format(price);
}

// ===== 展示结果 =====
function displayResults(data) {
  const resultsDiv = document.getElementById('results');

  if (data.solutions.length === 0) {
    resultsDiv.innerHTML = `
      <div class="no-results">
        <h3>${t('noResults')}</h3>
        <p>${t('noResultsTip')}</p>
      </div>
    `;
    return;
  }

  let html = '';

  data.solutions.forEach((match, index) => {
    const solution = match.solution;
    const dev = solution.development;
    const maint = solution.maintenance;

    html += `
      <div class="solution-card" style="animation-delay: ${index * 0.1}s">
        <div class="solution-header">
          <h3>${solution.name}</h3>
          <span class="industry-tag">${match.industry}</span>
        </div>

        <div class="pain-point">
          <strong>${t('painPointLabel')}</strong>${solution.painPoint}
        </div>

        <div class="description">${solution.description}</div>

        <div class="features">
          <h4>${t('coreFeatures')}</h4>
          <ul>
            ${solution.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <div class="section-divider"></div>

        <div class="development-section">
          <h4>${t('devQuote')}</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">${t('devPrice')}</span>
              <span class="value price">HKD ${formatPrice(dev.price)}</span>
            </div>
            <div class="info-item">
              <span class="label">${t('devDuration')}</span>
              <span class="value">${dev.duration}</span>
            </div>
          </div>

          <div class="tech-stack">
            <strong>${t('techStack')}</strong>
            ${dev.techStack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
          </div>

          <div class="resources">
            <strong>${t('resources')}</strong>
            <ul>
              ${dev.resources.map(r => `
                <li><span><span class="resource-type">${r.type}</span>${r.name || r.specs || ''}</span></li>
              `).join('')}
            </ul>
          </div>

          <div class="human-resources">
            <strong>${t('humanResources')}</strong>
            <ul>
              ${dev.humanResources.map(hr => `
                <li>
                  <span>${hr.role}</span>
                  <span style="color: var(--text-muted);">${hr.count}${t('person')} · ${hr.duration}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="maintenance-section">
          <h4>${t('maintenance')}</h4>
          <div class="info-grid" style="margin-bottom: 20px;">
            <div class="info-item">
              <span class="label">${t('monthlyFee')}</span>
              <span class="value price">HKD ${formatPrice(maint.monthlyPrice)}/${t('month')}</span>
            </div>
            <div class="info-item">
              <span class="label">${t('maintenanceDuration')}</span>
              <span class="value">${maint.duration || '-'}</span>
            </div>
          </div>

          <div class="resources">
            <strong>${t('resources')}</strong>
            <ul>
              ${maint.resources.map(r => `
                <li><span><span class="resource-type">${r.type}</span>${r.name || ''}</span></li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  });

  resultsDiv.innerHTML = html;
}
