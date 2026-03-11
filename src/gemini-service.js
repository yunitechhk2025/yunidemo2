// AI 服务 - 支持 OpenAI 协议和原生 Gemini
const OpenAI = require('openai');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

class GeminiService {
  constructor() {
    // 优先使用 OpenAI 兼容协议
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here') {
      this.initOpenAIMode();
    } 
    // 其次使用原生 Gemini
    else if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'your_gemini_api_key_here') {
      this.initGeminiMode();
    } 
    // 都没有则禁用 AI
    else {
      console.warn('⚠️  警告: 未配置 API Key，将使用关键词匹配模式');
      this.enabled = false;
      this.mode = 'keyword';
    }
  }

  initOpenAIMode() {
    try {
      this.client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      });
      this.defaultModel = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      this.model = this.defaultModel;
      this.mode = 'openai';
      this.enabled = true;
      console.log(`✅ AI 已启用 (OpenAI 协议模式)`);
      console.log(`   默认模型: ${this.model}`);
      console.log(`   接口: ${process.env.OPENAI_BASE_URL || 'OpenAI 官方'}`);
    } catch (error) {
      console.error('❌ OpenAI 初始化失败:', error.message);
      this.enabled = false;
      this.mode = 'keyword';
    }
  }

  // 动态切换模型
  setModel(modelName) {
    if (modelName && this.mode === 'openai') {
      this.model = modelName;
      console.log(`🔄 切换模型: ${modelName}`);
    }
  }

  // 重置为默认模型
  resetModel() {
    if (this.defaultModel) {
      this.model = this.defaultModel;
    }
  }

  initGeminiMode() {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
      this.mode = 'gemini';
      this.enabled = true;
      console.log('✅ AI 已启用 (Gemini 原生模式)');
    } catch (error) {
      console.error('❌ Gemini 初始化失败:', error.message);
      this.enabled = false;
      this.mode = 'keyword';
    }
  }

  // 分析用户输入，映射到行业
  async analyzeAndMapIndustry(userInput, industries) {
    if (!this.enabled) {
      return null;
    }

    const industryList = industries.map(ind => 
      `- ${ind.id}: ${ind.name} (关键词: ${ind.keywords.join('、')})`
    ).join('\n');

    const prompt = `你是一个专业的行业分析助手。请分析用户的业务痛点，并将其映射到最合适的行业。

可选行业列表：
${industryList}

用户输入：
"${userInput}"

请分析用户描述的痛点属于哪个行业，并返回JSON格式：
{
  "industry_id": "行业ID",
  "confidence": 0.95,
  "reasoning": "简短的分析理由"
}

要求：
1. 必须从上述行业列表中选择一个最匹配的
2. confidence 是匹配置信度 (0-1)
3. reasoning 用中文简要说明为什么选择这个行业
4. 只返回JSON，不要其他文字`;

    try {
      let responseText;

      if (this.mode === 'openai') {
        // OpenAI 协议模式
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: '你是一个专业的行业分析助手，擅长分析业务痛点并推荐解决方案。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        });
        
        console.log('🔍 API 原始响应:', JSON.stringify(completion, null, 2));
        
        if (completion.choices && completion.choices.length > 0 && completion.choices[0].message) {
          responseText = completion.choices[0].message.content;
        } else {
          console.error('❌ API 响应格式异常:', completion);
          return null;
        }
      } else {
        // Gemini 原生模式
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
      }

      // 提取 JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        console.log('🤖 AI 分析结果:', analysis);
        return analysis;
      }

      return null;
    } catch (error) {
      console.error(`❌ AI API 调用失败 (${this.mode}):`, error.message);
      return null;
    }
  }

  // 生成个性化的方案建议
  async generateCustomRecommendation(userInput, solution) {
    if (!this.enabled) {
      return null;
    }

    const prompt = `基于用户的具体痛点，为以下解决方案生成个性化建议。

用户痛点：
"${userInput}"

解决方案：
名称: ${solution.name}
描述: ${solution.description}

请生成一段简短的个性化建议（50-80字），说明这个方案如何解决用户的具体问题。
只返回建议文字，不要其他内容。`;

    try {
      let responseText;

      if (this.mode === 'openai') {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: '你是一个专业的解决方案顾问。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 200
        });
        responseText = completion.choices[0].message.content;
      } else {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
      }

      return responseText.trim();
    } catch (error) {
      console.error('❌ 生成建议失败:', error.message);
      return null;
    }
  }

  // 强制开发周期必须大于4周（后端校验）
  enforceMinDuration(solution, targetLang) {
    const isChinese = targetLang.includes('Chinese');
    const minDuration = isChinese ? '6-8周' : '6-8 weeks';
    const dev = solution?.solution?.development;
    if (!dev?.duration) return;

    // 判断周期字符串的最小值是否不超过4周（即 ≤ 4 均视为不合规）
    const isBelowMinWeeks = (str) => {
      // 匹配"周"单位：取范围中的第一个数字（最小值）
      const weekMatch = str.match(/(\d+)\s*(?:[-~到]\s*\d+\s*)?周/);
      if (weekMatch) return parseInt(weekMatch[1]) <= 4;
      // 匹配"weeks/week"单位
      const weeksMatch = str.match(/(\d+)\s*(?:[-~]\s*\d+\s*)?weeks?/i);
      if (weeksMatch) return parseInt(weeksMatch[1]) <= 4;
      // 月份单位：1个月 ≈ 4周，也需检查
      const monthMatch = str.match(/([\d.]+)\s*(?:[-~到]\s*[\d.]+\s*)?个?月/);
      if (monthMatch) return parseFloat(monthMatch[1]) * 4 <= 4;
      return false;
    };

    const d = dev.duration;
    if (isBelowMinWeeks(d)) {
      dev.duration = minDuration;
      // 同步修正所有人力资源周期
      if (dev.humanResources) {
        dev.humanResources.forEach(r => { r.duration = minDuration; });
      }
      console.log(`⚠️ 周期已修正: "${d}" → "${minDuration}"`);
    }
  }

  // AI 自主生成完整解决方案
  async generateFullSolution(userInput, lang = 'zh-CN') {
    if (!this.enabled) {
      return null;
    }

    // 语言映射
    const langMap = {
      'zh-CN': 'Simplified Chinese (简体中文)',
      'zh-TW': 'Traditional Chinese (繁體中文)',
      'en': 'English'
    };
    const targetLang = langMap[lang] || 'Simplified Chinese (简体中文)';

    const prompt = `You are a professional IT solution architect. Analyze the user's business pain point and generate a software solution.

IMPORTANT - OUTPUT LANGUAGE:
- You MUST reply ALL text fields in ${targetLang}
- This is mandatory regardless of what language the user writes in

IMPORTANT CONSTRAINTS:
- Maximum budget: LESS than 100,000 HKD (max 95,000 HKD)
- Minimum development duration: STRICTLY MORE THAN 4 weeks (minimum 5 weeks). NEVER use 1/2/3/4 weeks or any range starting at 4 or below. Use 6-8 weeks, 8-10 weeks, 10-12 weeks etc.
- Team size: ONLY 1 full-stack developer
- If the requirement is too complex for this budget, simplify the solution to fit within constraints

User's pain point:
"${userInput}"

Generate a JSON response following this structure (DO NOT copy example values, calculate based on complexity):
{
  "industry": "[Industry name in user's language]",
  "isSimplified": false,
  "simplificationNote": "",
  "solution": {
    "id": "solution-001",
    "name": "[Solution name in user's language]",
    "painPoint": "[Pain point summary in user's language]",
    "description": "[Solution description 100-150 chars in user's language]",
    "features": ["[Feature 1]", "[Feature 2]", "[Feature 3]"],
    "development": {
      "price": "[USE ROUND: 30000/35000/40000/45000/50000/55000/60000/65000/70000/75000/80000/85000/90000/95000, MAX 95000]",
      "currency": "HKD",
      "duration": "[MUST be MORE THAN 4 weeks, e.g. 6-8 weeks / 6-8周, 8-10 weeks / 8-10周. FORBIDDEN: 1/2/3/4 weeks, 4-6 weeks, 1-4周, 2-4周, 4周]",
      "techStack": ["React/Vue", "Node.js", "PostgreSQL/MySQL"],
      "resources": [
        {"type": "Cloud Service", "name": "[Service name]", "specs": "[Config]", "link": "/platform/services/cloud"},
        {"type": "Yuni AI Service", "name": "[AI service name]", "link": "/platform/services/ai"}
      ],
      "humanResources": [
        {"role": "[Full-stack Developer in user's language]", "count": 1, "duration": "[Same as dev duration]", "link": "/platform/talents/fullstack"}
      ]
    },
    "maintenance": {
      "monthlyPrice": "[USE: 3000/3500/4000/4500/5000/5500/6000]",
      "currency": "HKD",
      "resources": [
        {"type": "[Cloud Server]", "name": "[Server name]", "monthlyCost": "[USE: 500/800/1000/1200/1500]", "link": "/platform/services/cloud"},
        {"type": "[Database]", "name": "[DB name]", "monthlyCost": "[USE: 300/500/800]", "link": "/platform/services/database"},
        {"type": "[Yuni AI Service Fee]", "monthlyCost": "[USE: 500/800/1000/1500/2000]", "link": "/platform/services/ai"},
        {"type": "[Tech Support]", "monthlyCost": "[USE: 500/800/1000]", "link": "/platform/services/support"}
      ]
    }
  },
  "reasoning": "[Why this solution fits - 50-80 chars in user's language]"
}

RULES:
1. CRITICAL: Reply ALL text fields in ${targetLang} - this is mandatory
2. Price MUST be less than 100,000 HKD (max 95,000). Use ROUND numbers:
   - Simple (landing page, basic CRUD): 30000/35000/40000/45000/50000 HKD
   - Medium (small app, basic features): 50000/55000/60000/65000/70000 HKD  
   - Complex (full system, AI features): 70000/75000/80000/85000/90000/95000 HKD
3. Development duration: FORBIDDEN to use any value ≤ 4 weeks (including 4周/4 weeks/4-6周/1-4周). Minimum start is 5 weeks. ONLY use: 6-8周、8-10周、10-12周 (or 6-8 weeks, 8-10 weeks in English)
4. Human resources MUST be exactly 1 full-stack developer
5. If requirement is too complex for 95,000 HKD budget:
   - Set "isSimplified": true
   - Add "simplificationNote" in user's language explaining the simplification
   - Reduce features to core MVP (3-4 features max)
6. Monthly maintenance: Use ROUND numbers only (3000, 3500, 4000, 4500, 5000, 5500, 6000 HKD)
7. Return ONLY valid JSON with actual number values (not strings or placeholders)`;

    try {
      let responseText;

      if (this.mode === 'openai') {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: 'You are a professional IT solution architect. Detect the language of user input and always reply in the SAME language. Always return valid JSON format.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
          max_tokens: 2000
        });
        responseText = completion.choices[0].message.content;
      } else {
        const result = await this.model.generateContent(prompt);
        const response = await result.response;
        responseText = response.text();
      }

      // 提取 JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const solution = JSON.parse(jsonMatch[0]);
        // 强制校验：开发周期不少于4周
        this.enforceMinDuration(solution, targetLang);
        console.log('🤖 AI 生成方案:', solution.solution?.name);
        return solution;
      }

      return null;
    } catch (error) {
      console.error('❌ AI 生成方案失败:', error.message);
      return null;
    }
  }
}

module.exports = GeminiService;
