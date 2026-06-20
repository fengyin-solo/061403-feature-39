import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'

const PHASE_GOALS = [
  {
    id: 'phase1',
    name: '初入雪原',
    dayRange: [1, 2],
    description: '熟悉环境，建立基本生存条件',
    goals: [
      {
        id: 'chop10',
        name: '砍柴达人',
        description: '累计砍柴获得 20 木头',
        type: 'cumulative',
        metric: 'woodGained',
        target: 20,
        reward: 10
      },
      {
        id: 'fire2',
        name: '点燃希望',
        description: '生火 2 次',
        type: 'cumulative',
        metric: 'fireMade',
        target: 2,
        reward: 10
      },
      {
        id: 'survive2',
        name: '寒夜求生',
        description: '存活到第 2 天结束',
        type: 'threshold',
        metric: 'dayCount',
        target: 2,
        checkTime: 'night',
        reward: 15
      }
    ]
  },
  {
    id: 'phase2',
    name: '狩猎时代',
    dayRange: [3, 4],
    description: '制作工具，开拓食物来源',
    goals: [
      {
        id: 'tools2',
        name: '能工巧匠',
        description: '制作 2 把工具',
        type: 'cumulative',
        metric: 'toolsMade',
        target: 2,
        reward: 15
      },
      {
        id: 'hunt3',
        name: '猎手本色',
        description: '狩猎成功 3 次',
        type: 'cumulative',
        metric: 'huntSuccess',
        target: 3,
        reward: 15
      },
      {
        id: 'food10',
        name: '未雨绸缪',
        description: '食物储备达到 10',
        type: 'threshold',
        metric: 'food',
        target: 10,
        checkTime: 'any',
        reward: 10
      }
    ]
  },
  {
    id: 'phase3',
    name: '凛冬将至',
    dayRange: [5, 7],
    description: '强化储备，应对恶劣天气',
    goals: [
      {
        id: 'wood50',
        name: '薪火相传',
        description: '累计砍柴获得 50 木头',
        type: 'cumulative',
        metric: 'woodGained',
        target: 50,
        reward: 20
      },
      {
        id: 'hide5',
        name: '织裘御寒',
        description: '拥有 5 张兽皮',
        type: 'threshold',
        metric: 'hide',
        target: 5,
        checkTime: 'any',
        reward: 15
      },
      {
        id: 'noBlizzard',
        name: '风调雨顺',
        description: '本阶段不遭遇暴风雪',
        type: 'flag',
        metric: 'phaseBlizzard',
        target: false,
        checkTime: 'phaseEnd',
        reward: 25
      }
    ]
  },
  {
    id: 'phase4',
    name: '荒野之王',
    dayRange: [8, Infinity],
    description: '长期生存，征服雪原',
    goals: [
      {
        id: 'survive10',
        name: '十日传奇',
        description: '存活到第 10 天',
        type: 'threshold',
        metric: 'dayCount',
        target: 10,
        checkTime: 'day',
        reward: 30
      },
      {
        id: 'tools5',
        name: '兵工厂',
        description: '累计制作 5 把工具',
        type: 'cumulative',
        metric: 'toolsMade',
        target: 5,
        reward: 20
      },
      {
        id: 'hunt10',
        name: '狩猎大师',
        description: '累计狩猎成功 10 次',
        type: 'cumulative',
        metric: 'huntSuccess',
        target: 10,
        reward: 25
      }
    ]
  }
]

export function useGame() {
  const temperature = ref(80)
  const heat = ref(50)
  const wood = ref(10)
  const food = ref(5)
  const hide = ref(0)
  const tools = ref(0)
  const isDay = ref(true)
  const dayCount = ref(1)
  const isBlizzard = ref(false)
  const gameOver = ref(false)
  const gameOverReason = ref('')
  const actionLog = ref([])

  const stats = reactive({
    woodGained: 0,
    fireMade: 0,
    toolsMade: 0,
    huntSuccess: 0,
    huntFail: 0,
    foodEaten: 0,
    nightsSurvived: 0,
    blizzardsEncountered: 0
  })

  const goalProgress = reactive({})
  const completedGoals = ref(new Set())
  const phaseBlizzardFlags = reactive({})
  let currentPhaseId = null

  const initGoals = () => {
    PHASE_GOALS.forEach(phase => {
      phase.goals.forEach(goal => {
        if (!(goal.id in goalProgress)) {
          goalProgress[goal.id] = goal.type === 'flag' ? false : 0
        }
      })
      if (!(phase.id in phaseBlizzardFlags)) {
        phaseBlizzardFlags[phase.id] = false
      }
    })
    updateCurrentPhase()
  }

  const getCurrentPhase = computed(() => {
    const day = dayCount.value
    return PHASE_GOALS.find(p => day >= p.dayRange[0] && day <= p.dayRange[1]) || null
  })

  const getPhaseGoals = computed(() => {
    const phase = getCurrentPhase.value
    if (!phase) return []
    return phase.goals.map(goal => ({
      ...goal,
      current: getGoalProgress(goal),
      completed: completedGoals.value.has(goal.id),
      percentage: getGoalPercentage(goal)
    }))
  })

  const allPhasesWithProgress = computed(() => {
    return PHASE_GOALS.map(phase => ({
      ...phase,
      isActive: phase === getCurrentPhase.value,
      isPast: dayCount.value > phase.dayRange[1],
      isFuture: dayCount.value < phase.dayRange[0],
      goals: phase.goals.map(goal => ({
        ...goal,
        current: getGoalProgress(goal),
        completed: completedGoals.value.has(goal.id),
        percentage: getGoalPercentage(goal)
      })),
      totalReward: phase.goals.reduce((s, g) => s + g.reward, 0),
      earnedReward: phase.goals.reduce((s, g) => s + (completedGoals.value.has(g.id) ? g.reward : 0), 0),
      completedCount: phase.goals.filter(g => completedGoals.value.has(g.id)).length
    }))
  })

  const totalScore = computed(() => {
    let score = dayCount.value * 5
    completedGoals.value.forEach(id => {
      const phase = PHASE_GOALS.find(p => p.goals.some(g => g.id === id))
      if (phase) {
        const goal = phase.goals.find(g => g.id === id)
        if (goal) score += goal.reward
      }
    })
    score += tools.value * 3
    score += wood.value
    score += food.value * 2
    score += hide.value * 2
    return score
  })

  const completedGoalsCount = computed(() => completedGoals.value.size)
  const totalGoalsCount = computed(() => PHASE_GOALS.reduce((s, p) => s + p.goals.length, 0))

  function getGoalProgress(goal) {
    if (goal.type === 'cumulative') {
      return stats[goal.metric] || 0
    }
    if (goal.type === 'threshold') {
      if (goal.metric === 'dayCount') return dayCount.value
      if (goal.metric === 'food') return food.value
      if (goal.metric === 'hide') return hide.value
      if (goal.metric === 'tools') return tools.value
      if (goal.metric === 'wood') return wood.value
      return 0
    }
    if (goal.type === 'flag') {
      if (goal.metric === 'phaseBlizzard') {
        const phase = PHASE_GOALS.find(p => p.goals.some(g => g.id === goal.id))
        return phase ? !phaseBlizzardFlags[phase.id] : false
      }
      return goalProgress[goal.id] || false
    }
    return 0
  }

  function getGoalPercentage(goal) {
    const current = getGoalProgress(goal)
    if (goal.type === 'flag') {
      return current === goal.target ? 100 : 0
    }
    if (goal.target === Infinity) return current > 0 ? 100 : 0
    return Math.min(100, Math.floor((current / goal.target) * 100))
  }

  function updateCurrentPhase() {
    const phase = getCurrentPhase.value
    if (phase && phase.id !== currentPhaseId) {
      if (currentPhaseId) {
        checkPhaseEndGoals(currentPhaseId)
      }
      currentPhaseId = phase.id
      addLog(`进入阶段：${phase.name} — ${phase.description}`, 'phase')
    }
  }

  function checkGoals(checkTime = 'any') {
    const phase = getCurrentPhase.value
    if (!phase) return

    phase.goals.forEach(goal => {
      if (completedGoals.value.has(goal.id)) return
      if (goal.checkTime && goal.checkTime !== 'any' && goal.checkTime !== checkTime) return
      if (goal.type === 'flag') return

      const current = getGoalProgress(goal)
      const isDone = goal.type === 'threshold' ? current >= goal.target : current >= goal.target

      if (isDone) {
        completedGoals.value.add(goal.id)
        addLog(`🎯 目标达成：${goal.name}！奖励 +${goal.reward} 分`, 'goal')
      }
    })
  }

  function checkPhaseEndGoals(phaseId) {
    const phase = PHASE_GOALS.find(p => p.id === phaseId)
    if (!phase) return

    phase.goals.forEach(goal => {
      if (completedGoals.value.has(goal.id)) return
      if (goal.checkTime !== 'phaseEnd' && goal.type !== 'flag') return

      if (goal.type === 'flag') {
        const current = getGoalProgress(goal)
        if (current === goal.target) {
          completedGoals.value.add(goal.id)
          addLog(`🎯 目标达成：${goal.name}！奖励 +${goal.reward} 分`, 'goal')
        } else {
          addLog(`❌ 目标失败：${goal.name}`, 'warning')
        }
      }
    })
  }

  const DAY_DURATION = 30000
  const NIGHT_DURATION = 20000
  const HEAT_CONSUMPTION_RATE = 2
  const BLIZZARD_CHANCE = 0.15

  let dayNightTimer = null
  let nightConsumptionTimer = null
  let autoSaveTimer = null

  const isNight = computed(() => !isDay.value)
  const isDanger = computed(() => temperature.value < 30)
  const canMakeFire = computed(() => wood.value >= 3)
  const canHunt = computed(() => tools.value > 0)
  const huntSuccessRate = computed(() => 0.3 + tools.value * 0.15)

  function addLog(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString()
    const isHighlight = type === 'goal' || type === 'phase' || type === 'danger'
    actionLog.value.unshift({ message, type, timestamp, isHighlight })
    if (actionLog.value.length > 50) {
      actionLog.value.pop()
    }
  }

  function checkGameOver() {
    if (temperature.value <= 20) {
      gameOver.value = true
      gameOverReason.value = '体温过低，你在严寒中失去了意识...'
      stopTimers()
      if (currentPhaseId) {
        checkPhaseEndGoals(currentPhaseId)
      }
      addLog('游戏结束：体温过低！', 'danger')
    }
    if (temperature.value >= 100) {
      temperature.value = 100
    }
  }

  function consumeHeat() {
    if (gameOver.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const consumption = HEAT_CONSUMPTION_RATE * multiplier
    
    if (heat.value >= consumption) {
      heat.value -= consumption
      if (temperature.value < 80) {
        temperature.value = Math.min(80, temperature.value + 1)
      }
    } else {
      heat.value = 0
      temperature.value = Math.max(0, temperature.value - consumption)
      addLog('热量不足！体温正在下降...', 'warning')
    }
    
    checkGameOver()
  }

  function startNightCycle() {
    addLog(`夜幕降临，第 ${dayCount.value} 天结束`, 'info')
    stats.nightsSurvived++
    checkGoals('night')
    nightConsumptionTimer = setInterval(() => {
      consumeHeat()
    }, 1000)
    
    if (Math.random() < BLIZZARD_CHANCE) {
      triggerBlizzard()
    }
  }

  function startDayCycle() {
    dayCount.value++
    addLog(`天亮了，第 ${dayCount.value} 天开始`, 'success')
    isBlizzard.value = false
    updateCurrentPhase()
    checkGoals('day')
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
  }

  function toggleDayNight() {
    isDay.value = !isDay.value
    if (isDay.value) {
      startDayCycle()
    } else {
      startNightCycle()
    }
  }

  function triggerBlizzard() {
    isBlizzard.value = true
    stats.blizzardsEncountered++
    const phase = getCurrentPhase.value
    if (phase) {
      phaseBlizzardFlags[phase.id] = true
    }
    addLog('⚠️ 暴风雪来袭！所有消耗加倍！', 'danger')
  }

  function chopWood() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 5 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    const woodGained = Math.floor(Math.random() * 3) + 2
    wood.value += woodGained
    stats.woodGained += woodGained
    
    addLog(`砍柴：获得 ${woodGained} 木头，消耗 ${tempCost} 体温`, 'action')
    checkGoals('any')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function hunt() {
    if (gameOver.value || isNight.value) return
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 8 * multiplier
    
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    if (Math.random() < huntSuccessRate.value) {
      const foodGained = Math.floor(Math.random() * 3) + 2
      const hideGained = Math.floor(Math.random() * 2) + 1
      food.value += foodGained
      hide.value += hideGained
      stats.huntSuccess++
      addLog(`狩猎成功：获得 ${foodGained} 食物，${hideGained} 兽皮，消耗 ${tempCost} 体温`, 'success')
    } else {
      stats.huntFail++
      addLog(`狩猎失败：消耗 ${tempCost} 体温，空手而归`, 'warning')
    }
    checkGoals('any')
    
    if (Math.random() < BLIZZARD_CHANCE * 0.5) {
      triggerBlizzard()
    }
    
    checkGameOver()
  }

  function makeTools() {
    if (gameOver.value || isNight.value) return
    if (wood.value < 2 || hide.value < 1) {
      addLog('材料不足：需要 2 木头和 1 兽皮', 'warning')
      return
    }
    
    const multiplier = isBlizzard.value ? 2 : 1
    const tempCost = 6 * multiplier
    
    wood.value -= 2
    hide.value -= 1
    tools.value += 1
    stats.toolsMade++
    temperature.value = Math.max(0, temperature.value - tempCost)
    
    addLog(`制作工具：获得 1 工具，消耗 ${tempCost} 体温`, 'success')
    checkGoals('any')
    checkGameOver()
  }

  function makeFire() {
    if (gameOver.value || !canMakeFire.value) {
      addLog('木头不足：生火需要 3 木头', 'warning')
      return
    }
    
    wood.value -= 3
    const heatGained = Math.floor(Math.random() * 20) + 25
    heat.value = Math.min(100, heat.value + heatGained)
    temperature.value = Math.min(100, temperature.value + 10)
    stats.fireMade++
    
    addLog(`生火：获得 ${heatGained} 热量，体温上升 10`, 'success')
    checkGoals('any')
  }

  function eatFood() {
    if (gameOver.value || food.value < 1) {
      addLog('没有食物了！', 'warning')
      return
    }
    
    food.value -= 1
    const tempGained = Math.floor(Math.random() * 10) + 5
    temperature.value = Math.min(100, temperature.value + tempGained)
    stats.foodEaten++
    
    addLog(`进食：体温恢复 ${tempGained}`, 'success')
  }

  function startTimers() {
    dayNightTimer = setInterval(() => {
      toggleDayNight()
    }, isDay.value ? DAY_DURATION : NIGHT_DURATION)
    
    autoSaveTimer = setInterval(() => {
      saveGame('auto')
    }, 10000)
  }

  function stopTimers() {
    if (dayNightTimer) {
      clearInterval(dayNightTimer)
      dayNightTimer = null
    }
    if (nightConsumptionTimer) {
      clearInterval(nightConsumptionTimer)
      nightConsumptionTimer = null
    }
    if (autoSaveTimer) {
      clearInterval(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function saveGame(slot = 'manual') {
    const gameState = {
      temperature: temperature.value,
      heat: heat.value,
      wood: wood.value,
      food: food.value,
      hide: hide.value,
      tools: tools.value,
      isDay: isDay.value,
      dayCount: dayCount.value,
      isBlizzard: isBlizzard.value,
      stats: { ...stats },
      completedGoals: Array.from(completedGoals.value),
      goalProgress: { ...goalProgress },
      phaseBlizzardFlags: { ...phaseBlizzardFlags },
      currentPhaseId,
      savedAt: Date.now()
    }
    localStorage.setItem(`snowSurvival_${slot}`, JSON.stringify(gameState))
    addLog(`游戏已保存到存档位：${slot === 'auto' ? '自动存档' : slot}`, 'info')
  }

  function loadGame(slot = 'auto') {
    const saved = localStorage.getItem(`snowSurvival_${slot}`)
    if (!saved) {
      addLog('没有找到存档', 'warning')
      return false
    }
    
    try {
      const gameState = JSON.parse(saved)
      temperature.value = gameState.temperature
      heat.value = gameState.heat
      wood.value = gameState.wood
      food.value = gameState.food
      hide.value = gameState.hide
      tools.value = gameState.tools
      isDay.value = gameState.isDay
      dayCount.value = gameState.dayCount
      isBlizzard.value = gameState.isBlizzard
      
      if (gameState.stats) {
        Object.assign(stats, gameState.stats)
      }
      if (gameState.completedGoals) {
        completedGoals.value = new Set(gameState.completedGoals)
      }
      if (gameState.goalProgress) {
        Object.assign(goalProgress, gameState.goalProgress)
      }
      if (gameState.phaseBlizzardFlags) {
        Object.assign(phaseBlizzardFlags, gameState.phaseBlizzardFlags)
      }
      if (gameState.currentPhaseId) {
        currentPhaseId = gameState.currentPhaseId
      }
      
      gameOver.value = false
      gameOverReason.value = ''
      actionLog.value = []
      
      stopTimers()
      startTimers()
      
      if (!isDay.value) {
        startNightCycle()
      }
      
      addLog(`成功加载存档：${slot === 'auto' ? '自动存档' : slot}`, 'success')
      return true
    } catch (e) {
      addLog('存档损坏，无法加载', 'danger')
      return false
    }
  }

  function getSaveSlots() {
    const slots = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key.startsWith('snowSurvival_')) {
        const slotName = key.replace('snowSurvival_', '')
        try {
          const data = JSON.parse(localStorage.getItem(key))
          slots.push({
            name: slotName,
            dayCount: data.dayCount,
            savedAt: data.savedAt
          })
        } catch (e) {}
      }
    }
    return slots
  }

  function deleteSave(slot) {
    localStorage.removeItem(`snowSurvival_${slot}`)
    addLog(`已删除存档：${slot}`, 'info')
  }

  function restartGame() {
    temperature.value = 80
    heat.value = 50
    wood.value = 10
    food.value = 5
    hide.value = 0
    tools.value = 0
    isDay.value = true
    dayCount.value = 1
    isBlizzard.value = false
    gameOver.value = false
    gameOverReason.value = ''
    actionLog.value = []
    
    Object.assign(stats, {
      woodGained: 0,
      fireMade: 0,
      toolsMade: 0,
      huntSuccess: 0,
      huntFail: 0,
      foodEaten: 0,
      nightsSurvived: 0,
      blizzardsEncountered: 0
    })
    
    completedGoals.value = new Set()
    Object.keys(goalProgress).forEach(k => delete goalProgress[k])
    Object.keys(phaseBlizzardFlags).forEach(k => delete phaseBlizzardFlags[k])
    currentPhaseId = null
    
    initGoals()
    stopTimers()
    startTimers()
    
    addLog('新游戏开始！祝你好运！', 'success')
  }

  onMounted(() => {
    initGoals()
    startTimers()
    addLog('欢迎来到雪地生存！白天收集资源，夜晚保持温暖。', 'info')
  })

  onUnmounted(() => {
    stopTimers()
  })

  return {
    temperature,
    heat,
    wood,
    food,
    hide,
    tools,
    isDay,
    isNight,
    dayCount,
    isBlizzard,
    gameOver,
    gameOverReason,
    actionLog,
    isDanger,
    canMakeFire,
    canHunt,
    huntSuccessRate,
    getCurrentPhase,
    getPhaseGoals,
    allPhasesWithProgress,
    totalScore,
    completedGoalsCount,
    totalGoalsCount,
    stats,
    chopWood,
    hunt,
    makeTools,
    makeFire,
    eatFood,
    saveGame,
    loadGame,
    getSaveSlots,
    deleteSave,
    restartGame
  }
}
