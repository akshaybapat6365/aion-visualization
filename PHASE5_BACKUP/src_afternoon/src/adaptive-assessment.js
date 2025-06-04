// Adaptive Assessment System with Personalized Testing
// Uses Item Response Theory for intelligent question selection

class AdaptiveAssessment {
  constructor(options = {}) {
    this.options = {
      initialDifficulty: 0.5,
      minQuestions: 5,
      maxQuestions: 20,
      targetAccuracy: 0.05,
      timeLimit: 300000, // 5 minutes per question
      enableHints: true,
      adaptiveDifficulty: true,
      ...options
    };
        
    this.questionBank = new QuestionBank();
    this.userAbility = 0; // Theta in IRT
    this.abilityHistory = [];
    this.responsesHistory = [];
    this.currentQuestion = null;
    this.sessionStartTime = Date.now();
    this.questionCount = 0;
        
    this.init();
  }
    
  init() {
    this.loadQuestionBank();
    this.setupIRTModel();
  }
    
  loadQuestionBank() {
    // Load Jungian concept questions
    const questions = [
      // Ego-related questions
      {
        id: 'ego-1',
        concept: 'ego',
        type: 'multiple-choice',
        difficulty: 0.3,
        discrimination: 1.2,
        guessing: 0.25,
        question: 'According to Jung, the ego is best described as:',
        options: [
          'The totality of the psyche',
          'The center of consciousness',
          'The repressed unconscious',
          'The collective unconscious'
        ],
        correct: 1,
        explanation: 'The ego is the center of consciousness and our sense of identity.',
        hints: ['Think about what you\'re aware of in daily life'],
        relatedConcepts: ['consciousness', 'self', 'persona']
      },
      {
        id: 'ego-2',
        concept: 'ego',
        type: 'true-false',
        difficulty: 0.4,
        discrimination: 1.0,
        guessing: 0.5,
        question: 'The ego encompasses both conscious and unconscious elements.',
        correct: false,
        explanation: 'The ego is purely conscious; it doesn\'t include unconscious elements.',
        hints: ['Consider the definition of consciousness'],
        relatedConcepts: ['consciousness', 'unconscious']
      },
            
      // Shadow questions
      {
        id: 'shadow-1',
        concept: 'shadow',
        type: 'multiple-choice',
        difficulty: 0.5,
        discrimination: 1.5,
        guessing: 0.25,
        question: 'The shadow archetype contains:',
        options: [
          'Only negative traits',
          'Only positive traits',
          'Both positive and negative repressed aspects',
          'Collective memories'
        ],
        correct: 2,
        explanation: 'The shadow contains both positive and negative aspects that have been repressed or remain undeveloped.',
        hints: ['It\'s not just about darkness'],
        relatedConcepts: ['repression', 'projection', 'unconscious']
      },
      {
        id: 'shadow-2',
        concept: 'shadow',
        type: 'scenario',
        difficulty: 0.7,
        discrimination: 1.8,
        guessing: 0.25,
        question: 'When someone intensely dislikes a trait in another person that they unconsciously possess themselves, this is an example of:',
        options: [
          'Shadow projection',
          'Anima possession',
          'Ego inflation',
          'Collective unconscious'
        ],
        correct: 0,
        explanation: 'Shadow projection occurs when we project our own repressed qualities onto others.',
        hints: ['What do we do with traits we don\'t want to acknowledge?'],
        relatedConcepts: ['projection', 'shadow', 'defense-mechanisms']
      },
            
      // Anima/Animus questions
      {
        id: 'anima-1',
        concept: 'anima-animus',
        type: 'matching',
        difficulty: 0.4,
        discrimination: 1.1,
        guessing: 0.5,
        question: 'Match the concept to its description:',
        items: [
          { term: 'Anima', description: 'Feminine aspect in men' },
          { term: 'Animus', description: 'Masculine aspect in women' }
        ],
        correct: { 'Anima': 'Feminine aspect in men', 'Animus': 'Masculine aspect in women' },
        explanation: 'Anima represents the feminine qualities in men, while Animus represents the masculine qualities in women.',
        relatedConcepts: ['contrasexual', 'psyche', 'integration']
      },
            
      // Self questions
      {
        id: 'self-1',
        concept: 'self',
        type: 'multiple-choice',
        difficulty: 0.6,
        discrimination: 1.6,
        guessing: 0.25,
        question: 'The Self in Jungian psychology represents:',
        options: [
          'The ego consciousness',
          'The personal unconscious only',
          'The totality of conscious and unconscious',
          'The social mask we wear'
        ],
        correct: 2,
        explanation: 'The Self represents the unified whole of conscious and unconscious parts of the psyche.',
        hints: ['Think about wholeness and totality'],
        relatedConcepts: ['individuation', 'wholeness', 'mandala']
      },
            
      // Individuation questions
      {
        id: 'individuation-1',
        concept: 'individuation',
        type: 'open-ended',
        difficulty: 0.8,
        discrimination: 2.0,
        question: 'Describe the process of individuation in your own words.',
        rubric: {
          excellent: ['journey', 'wholeness', 'integration', 'conscious', 'unconscious', 'self-realization'],
          good: ['development', 'growth', 'self', 'awareness'],
          fair: ['change', 'psychology', 'Jung']
        },
        explanation: 'Individuation is the psychological process of integrating the conscious and unconscious parts of the psyche to achieve self-realization and wholeness.',
        relatedConcepts: ['self', 'integration', 'psychological-development']
      },
            
      // Archetype questions
      {
        id: 'archetype-1',
        concept: 'archetypes',
        type: 'multiple-select',
        difficulty: 0.5,
        discrimination: 1.3,
        guessing: 0.125,
        question: 'Which of the following are considered universal archetypes? (Select all that apply)',
        options: [
          'The Hero',
          'The Mother',
          'The Ego',
          'The Wise Old Man',
          'The Trickster'
        ],
        correct: [0, 1, 3, 4], // Ego is not an archetype
        explanation: 'The Hero, Mother, Wise Old Man, and Trickster are universal archetypes. The Ego is not an archetype but the center of consciousness.',
        relatedConcepts: ['collective-unconscious', 'universal-patterns']
      },
            
      // Complex integration questions
      {
        id: 'integration-1',
        concept: 'integration',
        type: 'scenario',
        difficulty: 0.9,
        discrimination: 2.2,
        guessing: 0.25,
        question: 'A 40-year-old successful businessman begins to feel empty despite his achievements and starts exploring art and spirituality. In Jungian terms, this is likely:',
        options: [
          'Ego inflation',
          'Midlife individuation crisis',
          'Shadow possession',
          'Anima projection'
        ],
        correct: 1,
        explanation: 'This scenario describes a typical midlife individuation crisis where the person begins to integrate previously neglected aspects of their psyche.',
        hints: ['Consider the timing and the shift in interests'],
        relatedConcepts: ['individuation', 'midlife', 'self-realization']
      }
    ];
        
    this.questionBank.loadQuestions(questions);
  }
    
  setupIRTModel() {
    // Initialize Item Response Theory model
    this.irtModel = {
      // 3-parameter logistic model
      probability: (theta, difficulty, discrimination, guessing) => {
        const z = discrimination * (theta - difficulty);
        return guessing + (1 - guessing) / (1 + Math.exp(-z));
      },
            
      // Information function
      information: (theta, difficulty, discrimination, guessing) => {
        const p = this.irtModel.probability(theta, difficulty, discrimination, guessing);
        const q = 1 - p;
        const numerator = Math.pow(discrimination, 2) * q * Math.pow(p - guessing, 2);
        const denominator = p * Math.pow(1 - guessing, 2);
        return numerator / denominator;
      },
            
      // Standard error
      standardError: (information) => {
        return 1 / Math.sqrt(information);
      }
    };
  }
    
  generateNextQuestion() {
    // Select question with maximum information at current ability level
    const availableQuestions = this.questionBank.getAvailableQuestions();
        
    if (availableQuestions.length === 0) {
      return null;
    }
        
    // Calculate information for each question
    const questionsWithInfo = availableQuestions.map(question => {
      const info = this.irtModel.information(
        this.userAbility,
        question.difficulty,
        question.discrimination,
        question.guessing || 0.25
      );
            
      return {
        question,
        information: info
      };
    });
        
    // Sort by information value
    questionsWithInfo.sort((a, b) => b.information - a.information);
        
    // Add some randomness to avoid always selecting the same question
    const topCandidates = questionsWithInfo.slice(0, 3);
    const selected = topCandidates[Math.floor(Math.random() * topCandidates.length)];
        
    this.currentQuestion = selected.question;
    this.questionCount++;
        
    return this.formatQuestion(selected.question);
  }
    
  formatQuestion(question) {
    const formatted = {
      id: question.id,
      number: this.questionCount,
      totalQuestions: this.options.maxQuestions,
      type: question.type,
      question: question.question,
      timeLimit: this.options.timeLimit,
      allowHints: this.options.enableHints
    };
        
    // Add type-specific formatting
    switch (question.type) {
    case 'multiple-choice':
      formatted.options = question.options.map((option, index) => ({
        id: index,
        text: option
      }));
      break;
                
    case 'true-false':
      formatted.options = [
        { id: 0, text: 'True' },
        { id: 1, text: 'False' }
      ];
      break;
                
    case 'multiple-select':
      formatted.options = question.options.map((option, index) => ({
        id: index,
        text: option,
        selected: false
      }));
      formatted.instruction = 'Select all that apply';
      break;
                
    case 'matching':
      formatted.items = question.items;
      formatted.instruction = 'Match each term to its description';
      break;
                
    case 'scenario':
      formatted.scenario = question.question;
      formatted.options = question.options.map((option, index) => ({
        id: index,
        text: option
      }));
      break;
                
    case 'open-ended':
      formatted.instruction = 'Type your answer below';
      formatted.minLength = 50;
      formatted.maxLength = 500;
      break;
    }
        
    // Add progress information
    formatted.progress = {
      current: this.questionCount,
      total: this.options.maxQuestions,
      estimatedTimeRemaining: this.estimateRemainingTime(),
      currentAbility: this.getAbilityLevel(),
      confidence: this.getConfidenceInterval()
    };
        
    return formatted;
  }
    
  processResponse(response, responseTime) {
    if (!this.currentQuestion) {
      throw new Error('No current question to process');
    }
        
    const question = this.currentQuestion;
    const isCorrect = this.evaluateResponse(question, response);
        
    // Store response
    this.responsesHistory.push({
      questionId: question.id,
      response,
      correct: isCorrect,
      responseTime,
      timestamp: Date.now()
    });
        
    // Update ability estimate using Maximum Likelihood Estimation
    this.updateAbilityEstimate(question, isCorrect);
        
    // Generate feedback
    const feedback = this.generateFeedback(question, response, isCorrect, responseTime);
        
    // Mark question as used
    this.questionBank.markAsUsed(question.id);
        
    // Check if assessment should end
    const shouldContinue = this.shouldContinueAssessment();
        
    return {
      feedback,
      shouldContinue,
      nextQuestion: shouldContinue ? this.generateNextQuestion() : null,
      summary: !shouldContinue ? this.generateAssessmentSummary() : null
    };
  }
    
  evaluateResponse(question, response) {
    switch (question.type) {
    case 'multiple-choice':
    case 'true-false':
    case 'scenario':
      return response === question.correct;
                
    case 'multiple-select':
      if (!Array.isArray(response)) return false;
      const correctSet = new Set(question.correct);
      const responseSet = new Set(response);
      return correctSet.size === responseSet.size &&
                       [...correctSet].every(item => responseSet.has(item));
                
    case 'matching':
      return Object.keys(question.correct).every(key => 
        response[key] === question.correct[key]
      );
                
    case 'open-ended':
      return this.evaluateOpenEnded(response, question.rubric);
                
    default:
      return false;
    }
  }
    
  evaluateOpenEnded(response, rubric) {
    const lowercaseResponse = response.toLowerCase();
    let score = 0;
        
    // Check for excellent keywords
    const excellentMatches = rubric.excellent.filter(keyword => 
      lowercaseResponse.includes(keyword.toLowerCase())
    ).length;
        
    if (excellentMatches >= rubric.excellent.length * 0.6) {
      score = 1.0;
    } else {
      // Check for good keywords
      const goodMatches = rubric.good.filter(keyword => 
        lowercaseResponse.includes(keyword.toLowerCase())
      ).length;
            
      if (goodMatches >= rubric.good.length * 0.5) {
        score = 0.7;
      } else {
        // Check for fair keywords
        const fairMatches = rubric.fair.filter(keyword => 
          lowercaseResponse.includes(keyword.toLowerCase())
        ).length;
                
        if (fairMatches >= rubric.fair.length * 0.3) {
          score = 0.4;
        }
      }
    }
        
    return score >= 0.6; // Consider 60% or higher as correct
  }
    
  updateAbilityEstimate(question, isCorrect) {
    // Maximum Likelihood Estimation with Newton-Raphson method
    const maxIterations = 20;
    const tolerance = 0.001;
        
    let theta = this.userAbility;
    let iteration = 0;
        
    while (iteration < maxIterations) {
      let firstDerivative = 0;
      let secondDerivative = 0;
            
      // Include all previous responses
      this.responsesHistory.forEach((resp, index) => {
        const q = this.questionBank.getQuestion(resp.questionId);
        if (!q) return;
                
        const p = this.irtModel.probability(
          theta, 
          q.difficulty, 
          q.discrimination, 
          q.guessing || 0.25
        );
                
        const u = resp.correct ? 1 : 0;
                
        firstDerivative += q.discrimination * (u - p) * (p - q.guessing) / (p * (1 - q.guessing));
        secondDerivative -= Math.pow(q.discrimination, 2) * (p - q.guessing) * (1 - p) / 
                                   (p * Math.pow(1 - q.guessing, 2));
      });
            
      const delta = firstDerivative / secondDerivative;
      theta -= delta;
            
      if (Math.abs(delta) < tolerance) {
        break;
      }
            
      iteration++;
    }
        
    // Constrain theta to reasonable bounds
    this.userAbility = Math.max(-3, Math.min(3, theta));
    this.abilityHistory.push(this.userAbility);
  }
    
  generateFeedback(question, response, isCorrect, responseTime) {
    const feedback = {
      correct: isCorrect,
      correctAnswer: this.getCorrectAnswerText(question),
      explanation: question.explanation,
      responseTime,
      difficulty: question.difficulty,
      yourAbility: this.userAbility,
      relatedConcepts: question.relatedConcepts || []
    };
        
    // Add performance-specific feedback
    if (isCorrect) {
      if (responseTime < 10000) { // Less than 10 seconds
        feedback.speedBonus = 'Excellent response time!';
      }
            
      if (question.difficulty > this.userAbility + 0.5) {
        feedback.achievement = 'Great job on a challenging question!';
      }
    } else {
      if (question.hints && question.hints.length > 0) {
        feedback.hint = question.hints[0];
      }
            
      if (question.difficulty < this.userAbility - 0.5) {
        feedback.encouragement = 'Take your time and read carefully.';
      }
    }
        
    // Add learning recommendations
    feedback.recommendations = this.generateRecommendations(question, isCorrect);
        
    return feedback;
  }
    
  getCorrectAnswerText(question) {
    switch (question.type) {
    case 'multiple-choice':
    case 'scenario':
      return question.options[question.correct];
                
    case 'true-false':
      return question.correct ? 'True' : 'False';
                
    case 'multiple-select':
      return question.correct.map(index => question.options[index]).join(', ');
                
    case 'matching':
      return Object.entries(question.correct)
        .map(([term, desc]) => `${term}: ${desc}`)
        .join('; ');
                
    case 'open-ended':
      return `Key concepts: ${question.rubric.excellent.join(', ')}`;
                
    default:
      return 'See explanation';
    }
  }
    
  generateRecommendations(question, isCorrect) {
    const recommendations = [];
        
    if (!isCorrect) {
      recommendations.push({
        type: 'review',
        concept: question.concept,
        message: `Review the concept of ${question.concept}`,
        resources: this.getConceptResources(question.concept)
      });
            
      question.relatedConcepts?.forEach(concept => {
        recommendations.push({
          type: 'related',
          concept,
          message: `Also explore: ${concept}`
        });
      });
    } else if (question.difficulty < this.userAbility - 1) {
      recommendations.push({
        type: 'advance',
        message: 'You\'re ready for more challenging material!',
        suggestedTopics: this.getAdvancedTopics(question.concept)
      });
    }
        
    return recommendations;
  }
    
  shouldContinueAssessment() {
    // Check minimum questions
    if (this.questionCount < this.options.minQuestions) {
      return true;
    }
        
    // Check maximum questions
    if (this.questionCount >= this.options.maxQuestions) {
      return false;
    }
        
    // Check if we've reached target accuracy
    const currentSE = this.getCurrentStandardError();
    if (currentSE <= this.options.targetAccuracy) {
      return false;
    }
        
    // Check if ability estimate has stabilized
    if (this.abilityHistory.length >= 5) {
      const recent = this.abilityHistory.slice(-5);
      const variance = this.calculateVariance(recent);
      if (variance < 0.01) {
        return false;
      }
    }
        
    return true;
  }
    
  getCurrentStandardError() {
    let totalInformation = 0;
        
    this.responsesHistory.forEach(resp => {
      const question = this.questionBank.getQuestion(resp.questionId);
      if (!question) return;
            
      const info = this.irtModel.information(
        this.userAbility,
        question.difficulty,
        question.discrimination,
        question.guessing || 0.25
      );
            
      totalInformation += info;
    });
        
    return this.irtModel.standardError(totalInformation);
  }
    
  calculateVariance(values) {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }
    
  generateAssessmentSummary() {
    const totalQuestions = this.responsesHistory.length;
    const correctAnswers = this.responsesHistory.filter(r => r.correct).length;
    const accuracy = correctAnswers / totalQuestions;
        
    const conceptPerformance = this.analyzeConceptPerformance();
    const strengthsWeaknesses = this.identifyStrengthsWeaknesses();
    const learningPath = this.generateLearningPath();
        
    return {
      summary: {
        totalQuestions,
        correctAnswers,
        accuracy: Math.round(accuracy * 100),
        estimatedAbility: this.userAbility,
        abilityLevel: this.getAbilityLevel(),
        confidenceInterval: this.getConfidenceInterval(),
        totalTime: Date.now() - this.sessionStartTime,
        averageResponseTime: this.getAverageResponseTime()
      },
      performance: {
        byDifficulty: this.analyzeByDifficulty(),
        byConcept: conceptPerformance,
        strengths: strengthsWeaknesses.strengths,
        weaknesses: strengthsWeaknesses.weaknesses
      },
      recommendations: {
        immediateActions: this.getImmediateActions(),
        learningPath,
        estimatedTimeToMastery: this.estimateTimeToMastery()
      },
      detailedResults: this.getDetailedResults()
    };
  }
    
  getAbilityLevel() {
    if (this.userAbility >= 2) return 'Expert';
    if (this.userAbility >= 1) return 'Advanced';
    if (this.userAbility >= 0) return 'Intermediate';
    if (this.userAbility >= -1) return 'Beginner';
    return 'Novice';
  }
    
  getConfidenceInterval() {
    const se = this.getCurrentStandardError();
    return {
      lower: this.userAbility - 1.96 * se,
      upper: this.userAbility + 1.96 * se,
      precision: se
    };
  }
    
  getAverageResponseTime() {
    const total = this.responsesHistory.reduce((sum, r) => sum + r.responseTime, 0);
    return Math.round(total / this.responsesHistory.length);
  }
    
  analyzeByDifficulty() {
    const ranges = {
      easy: { min: -3, max: -0.5, correct: 0, total: 0 },
      medium: { min: -0.5, max: 0.5, correct: 0, total: 0 },
      hard: { min: 0.5, max: 3, correct: 0, total: 0 }
    };
        
    this.responsesHistory.forEach(resp => {
      const question = this.questionBank.getQuestion(resp.questionId);
      if (!question) return;
            
      for (const [level, range] of Object.entries(ranges)) {
        if (question.difficulty >= range.min && question.difficulty < range.max) {
          range.total++;
          if (resp.correct) range.correct++;
          break;
        }
      }
    });
        
    const results = {};
    for (const [level, data] of Object.entries(ranges)) {
      if (data.total > 0) {
        results[level] = {
          accuracy: Math.round((data.correct / data.total) * 100),
          questionsAttempted: data.total
        };
      }
    }
        
    return results;
  }
    
  analyzeConceptPerformance() {
    const conceptMap = new Map();
        
    this.responsesHistory.forEach(resp => {
      const question = this.questionBank.getQuestion(resp.questionId);
      if (!question) return;
            
      if (!conceptMap.has(question.concept)) {
        conceptMap.set(question.concept, {
          correct: 0,
          total: 0,
          avgDifficulty: 0,
          avgResponseTime: 0
        });
      }
            
      const conceptData = conceptMap.get(question.concept);
      conceptData.total++;
      if (resp.correct) conceptData.correct++;
      conceptData.avgDifficulty += question.difficulty;
      conceptData.avgResponseTime += resp.responseTime;
    });
        
    const results = {};
    conceptMap.forEach((data, concept) => {
      results[concept] = {
        accuracy: Math.round((data.correct / data.total) * 100),
        questionsAttempted: data.total,
        averageDifficulty: data.avgDifficulty / data.total,
        averageResponseTime: Math.round(data.avgResponseTime / data.total)
      };
    });
        
    return results;
  }
    
  identifyStrengthsWeaknesses() {
    const conceptPerformance = this.analyzeConceptPerformance();
    const strengths = [];
    const weaknesses = [];
        
    Object.entries(conceptPerformance).forEach(([concept, data]) => {
      if (data.accuracy >= 80 && data.questionsAttempted >= 2) {
        strengths.push({
          concept,
          accuracy: data.accuracy,
          confidence: 'High'
        });
      } else if (data.accuracy < 50) {
        weaknesses.push({
          concept,
          accuracy: data.accuracy,
          suggestedFocus: this.getSuggestedFocus(concept)
        });
      }
    });
        
    return { strengths, weaknesses };
  }
    
  getSuggestedFocus(concept) {
    const focusAreas = {
      'ego': 'Review the distinction between ego and Self',
      'shadow': 'Practice identifying shadow projections in daily life',
      'anima-animus': 'Explore contrasexual aspects through creative expression',
      'self': 'Study mandala symbolism and wholeness',
      'individuation': 'Read case studies of individuation journeys',
      'archetypes': 'Analyze archetypal patterns in myths and stories',
      'integration': 'Practice active imagination techniques'
    };
        
    return focusAreas[concept] || 'Review core concepts and examples';
  }
    
  generateLearningPath() {
    const weakConcepts = this.identifyStrengthsWeaknesses().weaknesses
      .map(w => w.concept);
        
    const path = [];
        
    // Start with fundamental concepts
    if (weakConcepts.includes('ego')) {
      path.push({
        step: 1,
        concept: 'ego',
        activities: ['Review Chapter 1', 'Complete ego awareness exercise'],
        estimatedTime: '30 minutes'
      });
    }
        
    // Build up to complex concepts
    const conceptOrder = ['ego', 'shadow', 'anima-animus', 'self', 'individuation'];
    let step = path.length + 1;
        
    conceptOrder.forEach(concept => {
      if (weakConcepts.includes(concept) && !path.some(p => p.concept === concept)) {
        path.push({
          step: step++,
          concept,
          activities: this.getConceptActivities(concept),
          estimatedTime: this.estimateStudyTime(concept)
        });
      }
    });
        
    return path;
  }
    
  getConceptActivities(concept) {
    const activities = {
      'ego': [
        'Read "The Ego and the Unconscious"',
        'Practice ego-awareness meditation',
        'Journal about daily ego experiences'
      ],
      'shadow': [
        'Complete shadow work exercises',
        'Identify personal shadow projections',
        'Explore shadow in dreams'
      ],
      'anima-animus': [
        'Analyze contrasexual figures in dreams',
        'Creative expression exercise',
        'Study anima/animus in relationships'
      ],
      'self': [
        'Create personal mandala',
        'Study symbols of wholeness',
        'Practice Self-dialogue technique'
      ],
      'individuation': [
        'Map your individuation journey',
        'Identify life patterns',
        'Set integration goals'
      ]
    };
        
    return activities[concept] || ['Study concept materials', 'Complete practice exercises'];
  }
    
  estimateStudyTime(concept) {
    const conceptPerformance = this.analyzeConceptPerformance()[concept];
    if (!conceptPerformance) return '45 minutes';
        
    const accuracy = conceptPerformance.accuracy;
    if (accuracy < 30) return '2 hours';
    if (accuracy < 50) return '1.5 hours';
    if (accuracy < 70) return '1 hour';
    return '30 minutes';
  }
    
  estimateTimeToMastery() {
    const weaknesses = this.identifyStrengthsWeaknesses().weaknesses;
    let totalHours = 0;
        
    weaknesses.forEach(weakness => {
      const studyTime = this.estimateStudyTime(weakness.concept);
      const hours = parseFloat(studyTime.split(' ')[0]);
      totalHours += hours;
    });
        
    return {
      hours: totalHours,
      weeks: Math.ceil(totalHours / 5), // Assuming 5 hours per week
      recommendation: totalHours > 10 
        ? 'Consider a structured study plan' 
        : 'Regular practice will achieve mastery'
    };
  }
    
  getImmediateActions() {
    const actions = [];
    const performance = this.identifyStrengthsWeaknesses();
        
    if (performance.weaknesses.length > 0) {
      actions.push({
        priority: 'high',
        action: `Focus on ${performance.weaknesses[0].concept}`,
        reason: `Current accuracy: ${performance.weaknesses[0].accuracy}%`
      });
    }
        
    if (this.userAbility < 0) {
      actions.push({
        priority: 'medium',
        action: 'Review foundational concepts',
        reason: 'Build stronger conceptual understanding'
      });
    }
        
    const avgResponseTime = this.getAverageResponseTime();
    if (avgResponseTime > 60000) { // More than 1 minute average
      actions.push({
        priority: 'low',
        action: 'Practice timed exercises',
        reason: 'Improve response confidence and speed'
      });
    }
        
    return actions;
  }
    
  getDetailedResults() {
    return this.responsesHistory.map((resp, index) => {
      const question = this.questionBank.getQuestion(resp.questionId);
      return {
        questionNumber: index + 1,
        concept: question.concept,
        difficulty: question.difficulty,
        correct: resp.correct,
        responseTime: resp.responseTime,
        question: question.question,
        yourAnswer: resp.response,
        correctAnswer: this.getCorrectAnswerText(question),
        explanation: question.explanation
      };
    });
  }
    
  getConceptResources(concept) {
    const resources = {
      'ego': [
        { type: 'chapter', title: 'Chapter 1: The Ego', url: 'chapter1.html' },
        { type: 'video', title: 'Understanding the Ego', url: '#' },
        { type: 'exercise', title: 'Ego Awareness Practice', url: '#' }
      ],
      'shadow': [
        { type: 'chapter', title: 'Chapter 6: Shadow Work', url: 'chapter6.html' },
        { type: 'visualization', title: 'Shadow Projection Explorer', url: 'enhanced-chapter6.html' },
        { type: 'worksheet', title: 'Shadow Integration Guide', url: '#' }
      ],
      // Add more resources for other concepts
    };
        
    return resources[concept] || [];
  }
    
  getAdvancedTopics(concept) {
    const advancedTopics = {
      'ego': ['Ego-Self axis', 'Ego development stages', 'Transcendent function'],
      'shadow': ['Cultural shadow', 'Collective shadow', 'Shadow and creativity'],
      'anima-animus': ['Syzygy', 'Contrasexual development', 'Anima/Animus possession'],
      'self': ['Self-realization', 'Circumambulation', 'Self as imago Dei'],
      'individuation': ['Second half of life', 'Spiritual emergence', 'Mystical experience']
    };
        
    return advancedTopics[concept] || [];
  }
    
  // Hint system
  getHint() {
    if (!this.currentQuestion || !this.currentQuestion.hints) {
      return null;
    }
        
    const hintsUsed = this.responsesHistory.filter(r => 
      r.questionId === this.currentQuestion.id && r.hintUsed
    ).length;
        
    if (hintsUsed < this.currentQuestion.hints.length) {
      return this.currentQuestion.hints[hintsUsed];
    }
        
    return null;
  }
    
  // Public API
  startAssessment() {
    this.sessionStartTime = Date.now();
    this.questionCount = 0;
    this.responsesHistory = [];
    this.abilityHistory = [this.userAbility];
        
    return this.generateNextQuestion();
  }
    
  submitAnswer(response, responseTime) {
    return this.processResponse(response, responseTime);
  }
    
  skipQuestion() {
    if (!this.currentQuestion) return null;
        
    this.responsesHistory.push({
      questionId: this.currentQuestion.id,
      response: null,
      correct: false,
      responseTime: 0,
      skipped: true,
      timestamp: Date.now()
    });
        
    this.questionBank.markAsUsed(this.currentQuestion.id);
        
    return {
      feedback: {
        skipped: true,
        explanation: this.currentQuestion.explanation,
        correctAnswer: this.getCorrectAnswerText(this.currentQuestion)
      },
      shouldContinue: this.shouldContinueAssessment(),
      nextQuestion: this.shouldContinueAssessment() ? this.generateNextQuestion() : null
    };
  }
    
  getProgress() {
    return {
      questionsAnswered: this.questionCount,
      currentAbility: this.userAbility,
      abilityLevel: this.getAbilityLevel(),
      estimatedAccuracy: this.getCurrentStandardError(),
      timeElapsed: Date.now() - this.sessionStartTime
    };
  }
    
  endAssessment() {
    return this.generateAssessmentSummary();
  }
}

// Question Bank Manager
class QuestionBank {
  constructor() {
    this.questions = new Map();
    this.usedQuestions = new Set();
    this.conceptIndex = new Map();
  }
    
  loadQuestions(questions) {
    questions.forEach(question => {
      this.questions.set(question.id, question);
            
      // Index by concept
      if (!this.conceptIndex.has(question.concept)) {
        this.conceptIndex.set(question.concept, []);
      }
      this.conceptIndex.get(question.concept).push(question.id);
    });
  }
    
  getQuestion(id) {
    return this.questions.get(id);
  }
    
  getAvailableQuestions() {
    return Array.from(this.questions.values()).filter(q => 
      !this.usedQuestions.has(q.id)
    );
  }
    
  getQuestionsByConcept(concept) {
    const questionIds = this.conceptIndex.get(concept) || [];
    return questionIds.map(id => this.questions.get(id)).filter(q => 
      q && !this.usedQuestions.has(q.id)
    );
  }
    
  markAsUsed(questionId) {
    this.usedQuestions.add(questionId);
  }
    
  resetUsed() {
    this.usedQuestions.clear();
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AdaptiveAssessment;
}