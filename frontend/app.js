// 前端逻辑
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

document.getElementById('matchBtn').addEventListener('click', async () => {
  const painPoint = document.getElementById('painPointInput').value.trim();

  if (!painPoint) {
    alert('请输入您的业务痛点');
    return;
  }

  showLoading(true);

  try {
    const response = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ painPoint, lang: 'zh-CN' })
    });

    const result = await response.json();

    if (result.success) {
      displayResults(result.data);
    } else {
      alert('错误：' + result.error);
    }
  } catch (error) {
    alert('请求失败：' + error.message);
  } finally {
    showLoading(false);
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
    ? '<span class="btn-text">生成中...</span>'
    : '<span class="btn-text">生成解决方案</span><span class="btn-icon">→</span>';
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
        <h3>未找到匹配的解决方案</h3>
        <p>请尝试使用不同的关键词描述您的痛点</p>
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
          <strong>解决痛点：</strong>${solution.painPoint}
        </div>

        <div class="description">${solution.description}</div>

        <div class="features">
          <h4>✦ 核心功能</h4>
          <ul>
            ${solution.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <div class="section-divider"></div>

        <div class="development-section">
          <h4>📦 开发报价</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">开发价格</span>
              <span class="value price">HKD ${formatPrice(dev.price)}</span>
            </div>
            <div class="info-item">
              <span class="label">开发周期</span>
              <span class="value">${dev.duration}</span>
            </div>
          </div>

          <div class="tech-stack">
            <strong>技术栈</strong>
            ${dev.techStack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
          </div>

          <div class="resources">
            <strong>所需资源</strong>
            <ul>
              ${dev.resources.map(r => `
                <li><span><span class="resource-type">${r.type}</span>${r.name || r.specs || ''}</span></li>
              `).join('')}
            </ul>
          </div>

          <div class="human-resources">
            <strong>人力配置</strong>
            <ul>
              ${dev.humanResources.map(hr => `
                <li>
                  <span>${hr.role}</span>
                  <span style="color: var(--text-muted);">${hr.count}人 · ${hr.duration}</span>
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="maintenance-section">
          <h4>🔧 运维成本</h4>
          <div class="info-item" style="margin-bottom: 20px;">
            <span class="label">每月维护费用</span>
            <span class="value price">HKD ${formatPrice(maint.monthlyPrice)}/月</span>
          </div>

          <div class="resources">
            <strong>所需资源</strong>
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
