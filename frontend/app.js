// 前端逻辑
// 自动检测环境：本地开发使用 localhost，部署后使用相对路径
const API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api'
  : '/api';

document.getElementById('matchBtn').addEventListener('click', async () => {
  const painPoint = document.getElementById('painPointInput').value.trim();
  
  if (!painPoint) {
    alert('请输入您的行业痛点');
    return;
  }

  showLoading(true);
  
  try {
    const response = await fetch(`${API_BASE}/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ painPoint })
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

function showLoading(show) {
  document.getElementById('loading').style.display = show ? 'block' : 'none';
  document.getElementById('results').style.display = show ? 'none' : 'block';
}

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

  let html = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
      <h2>为您找到 ${data.matchCount} 个解决方案</h2>
      ${data.aiEnabled ? '<span style="background: #3498db; color: white; padding: 5px 12px; border-radius: 3px; font-size: 14px;">🤖 AI 智能分析</span>' : '<span style="background: #95a5a6; color: white; padding: 5px 12px; border-radius: 3px; font-size: 14px;">📝 关键词匹配</span>'}
    </div>
  `;

  data.solutions.forEach((match, index) => {
    const solution = match.solution;
    const dev = solution.development;
    const maint = solution.maintenance;

    html += `
      <div class="solution-card">
        <div class="solution-header">
          <h3>方案 ${index + 1}：${solution.name}</h3>
          <span class="industry-tag">${match.industry}</span>
        </div>

        ${match.aiAnalysis ? `
          <div style="background: #e8f4f8; padding: 15px; border-radius: 4px; margin-bottom: 15px; border-left: 3px solid #3498db;">
            <strong>🤖 AI 分析：</strong>${match.aiAnalysis.reasoning}
            ${match.aiAnalysis.customRecommendation ? `<br><br><strong>💡 个性化建议：</strong>${match.aiAnalysis.customRecommendation}` : ''}
          </div>
        ` : ''}

        <div class="pain-point">
          <strong>解决痛点：</strong>${solution.painPoint}
        </div>

        <div class="description">
          ${solution.description}
        </div>

        <div class="features">
          <h4>核心功能</h4>
          <ul>
            ${solution.features.map(f => `<li>${f}</li>`).join('')}
          </ul>
        </div>

        <div class="section-divider"></div>

        <div class="development-section">
          <h4>📦 开发部分</h4>
          
          <div class="info-grid">
            <div class="info-item">
              <span class="label">开发价格</span>
              <span class="value price">HKD ${dev.price.toLocaleString()}</span>
            </div>
            <div class="info-item">
              <span class="label">开发周期</span>
              <span class="value">${dev.duration}</span>
            </div>
          </div>

          <div class="tech-stack">
            <strong>技术栈：</strong>
            ${dev.techStack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
          </div>

          <div class="resources">
            <strong>需要的资源：</strong>
            <ul>
              ${dev.resources.map(r => `
                <li>
                  <span class="resource-type">${r.type}</span> - ${r.name || r.specs}
                </li>
              `).join('')}
            </ul>
          </div>

          <div class="human-resources">
            <strong>人力需求：</strong>
            <ul>
              ${dev.humanResources.map(hr => `
                <li>
                  ${hr.role} × ${hr.count}人 (${hr.duration})
                </li>
              `).join('')}
            </ul>
          </div>
        </div>

        <div class="section-divider"></div>

        <div class="maintenance-section">
          <h4>🔧 维护部分</h4>
          
          <div class="info-item">
            <span class="label">每月维护费用</span>
            <span class="value price">HKD ${maint.monthlyPrice.toLocaleString()}/月</span>
          </div>

          <div class="resources">
            <strong>维护资源明细：</strong>
            <ul>
              ${maint.resources.map(r => `
                <li>
                  <span class="resource-type">${r.type}</span> - 
                  HKD ${r.monthlyCost.toLocaleString()}/月
                </li>
              `).join('')}
            </ul>
          </div>
        </div>
      </div>
    `;
  });

  resultsDiv.innerHTML = html;
}
