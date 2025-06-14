// TransformationEngine.js - Alchemical combination logic and recipe system
export default class TransformationEngine {
    constructor() {
        // Define transformation recipes
        this.recipes = this.initializeRecipes();
        
        // Track transformation history
        this.transformationHistory = [];
    }
    
    initializeRecipes() {
        return [
            // Nigredo Stage - The Blackening
            {
                stage: 'nigredo',
                ingredients: ['prima-materia', 'sulphur'],
                result: 'black-sun',
                recipe: 'Prima Materia + Sulphur → Sol Niger',
                description: 'The shadow emerges from chaos',
                points: 150,
                hint: 'Combine the undifferentiated with passion'
            },
            {
                stage: 'nigredo',
                ingredients: ['mercury', 'salt'],
                result: 'aqua-vitae',
                recipe: 'Mercury + Salt → Aqua Vitae',
                description: 'Spirit and body create the water of life',
                points: 100,
                hint: 'Unite the volatile with the stable'
            },
            
            // Albedo Stage - The Whitening
            {
                stage: 'albedo',
                ingredients: ['black-sun', 'aqua-vitae'],
                result: 'philosophical-mercury',
                recipe: 'Sol Niger + Aqua Vitae → Philosophical Mercury',
                description: 'From darkness, refined consciousness emerges',
                points: 200,
                progressStage: true,
                hint: 'Dissolve the shadow in the water of life'
            },
            {
                stage: 'albedo',
                ingredients: ['mercury', 'mercury', 'salt'],
                result: 'white-stone',
                recipe: 'Mercury + Mercury + Salt → White Stone',
                description: 'Purification through repeated distillation',
                points: 250,
                hint: 'Double the spirit and crystallize'
            },
            
            // Citrinitas Stage - The Yellowing
            {
                stage: 'citrinitas',
                ingredients: ['philosophical-mercury', 'sulphur'],
                result: 'azoth',
                recipe: 'Philosophical Mercury + Sulphur → Azoth',
                description: 'The universal medicine is formed',
                points: 300,
                progressStage: true,
                hint: 'Refined spirit meets the soul'
            },
            {
                stage: 'citrinitas',
                ingredients: ['white-stone', 'prima-materia'],
                result: 'quintessence',
                recipe: 'White Stone + Prima Materia → Quintessence',
                description: 'The fifth element transcends the four',
                points: 350,
                hint: 'Return purity to chaos'
            },
            
            // Rubedo Stage - The Reddening
            {
                stage: 'rubedo',
                ingredients: ['azoth', 'quintessence'],
                result: 'red-stone',
                recipe: 'Azoth + Quintessence → Red Stone',
                description: 'The Philosopher\'s Stone is achieved',
                points: 500,
                progressStage: true,
                hint: 'Unite the universal with the essential'
            },
            {
                stage: 'rubedo',
                ingredients: ['mercury', 'sulphur', 'salt', 'prima-materia'],
                result: 'rebis',
                recipe: 'All Four Elements → Rebis',
                description: 'The divine hermaphrodite, perfect unity',
                points: 1000,
                hint: 'Combine all four base elements in harmony'
            },
            
            // Universal combinations (work in any stage)
            {
                stage: 'any',
                ingredients: ['mercury', 'prima-materia'],
                result: 'philosophical-mercury',
                recipe: 'Mercury + Prima Materia → Philosophical Mercury',
                description: 'Basic refinement of the spirit',
                points: 75,
                hint: 'Refine the volatile with potential'
            },
            {
                stage: 'any',
                ingredients: ['sulphur', 'salt'],
                result: 'black-sun',
                recipe: 'Sulphur + Salt → Sol Niger',
                description: 'Passion crystallized reveals the shadow',
                points: 75,
                hint: 'Combine soul and body'
            }
        ];
    }
    
    checkCombination(elements, currentStage) {
        // Sort element IDs for consistent checking
        const elementIds = elements.map(e => e.id).sort();
        
        // Check each recipe
        for (const recipe of this.recipes) {
            // Check if recipe is valid for current stage
            if (recipe.stage !== 'any' && recipe.stage !== currentStage) {
                continue;
            }
            
            // Sort recipe ingredients for comparison
            const recipeIngredients = [...recipe.ingredients].sort();
            
            // Check if ingredients match
            if (this.arraysEqual(elementIds, recipeIngredients)) {
                // Record transformation
                this.recordTransformation(recipe, currentStage);
                
                return {
                    elementId: recipe.result,
                    recipe: recipe.recipe,
                    description: recipe.description,
                    points: recipe.points,
                    progressStage: recipe.progressStage || false
                };
            }
        }
        
        // No valid combination found
        return null;
    }
    
    arraysEqual(a, b) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }
    
    recordTransformation(recipe, stage) {
        this.transformationHistory.push({
            recipe: recipe.recipe,
            result: recipe.result,
            stage: stage,
            timestamp: Date.now()
        });
    }
    
    getHintsForStage(stage) {
        return this.recipes
            .filter(r => r.stage === stage || r.stage === 'any')
            .map(r => ({
                hint: r.hint,
                difficulty: r.points
            }));
    }
    
    getRecipeForElements(elementIds) {
        const sortedIds = [...elementIds].sort();
        
        for (const recipe of this.recipes) {
            const recipeIngredients = [...recipe.ingredients].sort();
            if (this.arraysEqual(sortedIds, recipeIngredients)) {
                return recipe;
            }
        }
        
        return null;
    }
    
    getDiscoverableElements(currentStage) {
        // Get all elements that can be discovered in current stage
        const discoverableIds = new Set();
        
        this.recipes.forEach(recipe => {
            if (recipe.stage === currentStage || recipe.stage === 'any') {
                discoverableIds.add(recipe.result);
            }
        });
        
        return Array.from(discoverableIds);
    }
    
    getTransformationHistory() {
        return this.transformationHistory;
    }
    
    getProgressForStage(stage, discoveries) {
        // Calculate progress percentage for a stage
        const stageRecipes = this.recipes.filter(r => r.stage === stage);
        const discoveredCount = stageRecipes.filter(r => discoveries.has(r.result)).length;
        
        return stageRecipes.length > 0 
            ? (discoveredCount / stageRecipes.length) * 100 
            : 0;
    }
    
    validateCombination(elements) {
        // Check if combination makes alchemical sense
        const elementTypes = elements.map(e => e.properties).flat();
        
        // Some basic rules
        if (elementTypes.filter(p => p === 'volatile').length > 2) {
            return { valid: false, reason: 'Too many volatile elements' };
        }
        
        if (elementTypes.includes('masculine') && elementTypes.includes('feminine')) {
            return { valid: true, bonus: 'Opposites attract' };
        }
        
        return { valid: true };
    }
}