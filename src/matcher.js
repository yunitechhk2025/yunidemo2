// 痛点匹配引擎 - AI 自主生成模式
const fs = require('fs');
const path = require('path');
const GeminiService = require('./gemini-service');

class SolutionMatcher {
  constructor() {
    this.solutions = this.loadSolutions();
    this.showcases = this.loadShowcases();
    this.gemini = new GeminiService();
  }

  loadSolutions() {
    const dataPath = path.join(__dirname, '../data/solutions.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  }

  loadShowcases() {
    const dataPath = path.join(__dirname, '../data/showcases.json');
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
  }

  // 检查是否命中 showcase 固定结果
  matchShowcase(userInput) {
    const input = userInput.toLowerCase();
    for (const showcase of this.showcases) {
      const matchCount = showcase.triggers.filter(trigger => input.includes(trigger.toLowerCase())).length;
      if (matchCount >= 2) {
        console.log(`🎯 命中 Showcase: ${showcase.solution.name} (匹配关键词: ${matchCount}个)`);
        return showcase;
      }
    }
    return null;
  }

  // 主匹配函数 - AI 自主生成模式
  async matchSolutions(userInput, model = null, lang = 'zh-CN') {
    // 优先检查 showcase 固定结果
    const showcase = this.matchShowcase(userInput);
    if (showcase) {
      return [{
        score: 100,
        industry: showcase.industry,
        solution: showcase.solution,
        aiAnalysis: {
          reasoning: showcase.reasoning,
          confidence: 1.0,
          customRecommendation: showcase.reasoning,
          generatedByAI: false,
          isShowcase: true
        }
      }];
    }

    // 如果指定了模型，切换到该模型
    if (model) {
      this.gemini.setModel(model);
    }
    
    // 尝试使用 AI 自主生成完整解决方案
    console.log(`🤖 使用 AI 自主生成模式 (模型: ${this.gemini.model}, 语言: ${lang})...`);
    
    const aiResult = await this.gemini.generateFullSolution(userInput, lang);

    if (aiResult && aiResult.solution) {
      console.log(`✅ AI 生成方案成功: ${aiResult.solution.name}`);
      
      return [{
        score: 95,
        industry: aiResult.industry,
        solution: aiResult.solution,
        aiAnalysis: {
          reasoning: aiResult.reasoning,
          confidence: 0.95,
          customRecommendation: aiResult.reasoning,
          generatedByAI: true
        }
      }];
    }

    // 如果 AI 生成失败，使用传统关键词匹配作为备用
    console.log('📝 AI 生成失败，使用关键词匹配模式');
    return this.keywordMatch(userInput);
  }

  // 传统关键词匹配（备用方案）
  keywordMatch(userInput) {
    const normalizedInput = userInput.toLowerCase();
    const matches = [];

    // 遍历所有行业
    for (const industry of this.solutions.industries) {
      // 检查关键词匹配
      const keywordScore = this.calculateKeywordScore(normalizedInput, industry.keywords);
      
      if (keywordScore > 0) {
        // 为该行业的每个解决方案计算匹配度
        for (const solution of industry.solutions) {
          const painPointScore = this.calculatePainPointScore(normalizedInput, solution.painPoint);
          const totalScore = keywordScore + painPointScore;

          if (totalScore > 0) {
            matches.push({
              score: totalScore,
              industry: industry.name,
              solution: solution
            });
          }
        }
      }
    }

    // 如果没有匹配，返回所有行业的第一个方案（确保总有结果）
    if (matches.length === 0) {
      console.log('⚠️  无关键词匹配，返回默认方案');
      for (const industry of this.solutions.industries.slice(0, 3)) {
        if (industry.solutions.length > 0) {
          matches.push({
            score: 1,
            industry: industry.name,
            solution: industry.solutions[0]
          });
        }
      }
    }

    // 按匹配度排序，返回前3个
    matches.sort((a, b) => b.score - a.score);
    return matches.slice(0, 3);
  }

  // 计算关键词匹配分数
  calculateKeywordScore(input, keywords) {
    let score = 0;
    for (const keyword of keywords) {
      if (input.includes(keyword)) {
        score += 2;
      }
    }
    return score;
  }

  // 计算痛点描述匹配分数
  calculatePainPointScore(input, painPoint) {
    const painPointLower = painPoint.toLowerCase();
    const words = input.split(/\s+/);
    let score = 0;

    for (const word of words) {
      if (word.length > 1 && painPointLower.includes(word)) {
        score += 1;
      }
    }
    return score;
  }

  // 获取所有行业列表（用于前端显示）
  getAllIndustries() {
    return this.solutions.industries.map(industry => ({
      id: industry.id,
      name: industry.name,
      keywords: industry.keywords
    }));
  }

  // 根据行业ID获取解决方案（备用）
  getSolutionsByIndustry(industryId) {
    const industry = this.solutions.industries.find(ind => ind.id === industryId);
    return industry ? industry.solutions : [];
  }
}

module.exports = SolutionMatcher;
