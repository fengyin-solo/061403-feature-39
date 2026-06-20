<template>
  <div class="game-over-overlay">
    <div class="game-over-content">
      <div class="rank-icon">{{ rankIcon }}</div>
      <h2 class="game-over-title" :class="rankClass">{{ rankTitle }}</h2>
      <p class="game-over-reason">{{ reason }}</p>

      <div class="rank-badge" :class="rankClass">
        <span class="rank-label">生存评级</span>
        <span class="rank-value">{{ rankName }}</span>
      </div>

      <div class="total-score-section">
        <div class="score-label">总得分</div>
        <div class="score-value">{{ totalScore }}</div>
        <div class="score-breakdown">
          <div>存活天数 × 5 = {{ dayCount * 5 }}</div>
          <div>目标奖励 = {{ goalReward }}</div>
          <div>资源加成 = {{ resourceBonus }}</div>
        </div>
      </div>

      <div class="goals-summary">
        <h4>🎯 目标完成情况 ({{ completedGoalsCount }}/{{ totalGoalsCount }})</h4>
        <div class="goals-list">
          <div
            v-for="goal in flatGoals"
            :key="goal.id"
            class="goal-summary-item"
            :class="{ done: goal.completed, failed: !goal.completed && goal.isPast }"
          >
            <span class="goal-icon">{{ goal.completed ? '✅' : (goal.isPast ? '❌' : '⏳') }}</span>
            <div class="goal-text">
              <div class="goal-name-row">
                <span class="goal-name">{{ goal.name }}</span>
                <span class="goal-reward" v-if="goal.completed">+{{ goal.reward }}</span>
              </div>
              <span class="goal-desc">{{ goal.description }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="final-stats">
        <div class="stat-item">
          <span class="stat-label">存活天数</span>
          <span class="stat-value">{{ dayCount }} 天</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">最终体温</span>
          <span class="stat-value">{{ temperature }}°C</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">收集木头</span>
          <span class="stat-value">{{ wood }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">制作工具</span>
          <span class="stat-value">{{ tools }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">狩猎成功</span>
          <span class="stat-value">{{ huntSuccessCount }} 次</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">暴风雪</span>
          <span class="stat-value">{{ blizzardCount }} 次</span>
        </div>
      </div>
      <div class="game-over-actions">
        <button class="action-btn restart" @click="$emit('restart')">
          🔄 重新开始
        </button>
        <button class="action-btn load" @click="$emit('load')">
          📂 读取存档
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  reason: { type: String, default: '' },
  dayCount: { type: Number, default: 1 },
  temperature: { type: Number, default: 0 },
  wood: { type: Number, default: 0 },
  tools: { type: Number, default: 0 },
  totalScore: { type: Number, default: 0 },
  completedGoalsCount: { type: Number, default: 0 },
  totalGoalsCount: { type: Number, default: 12 },
  allPhases: { type: Array, default: () => [] },
  stats: { type: Object, default: () => ({}) }
})

defineEmits(['restart', 'load'])

const flatGoals = computed(() => {
  const list = []
  props.allPhases.forEach(phase => {
    if (!phase.goals) return
    phase.goals.forEach(g => {
      list.push({
        id: g.id,
        name: g.name,
        description: g.description,
        completed: !!g.completed,
        reward: g.reward || 0,
        isPast: !!phase.isPast || !!phase.isActive
      })
    })
  })
  return list
})

const huntSuccessCount = computed(() => props.stats?.huntSuccess || 0)
const blizzardCount = computed(() => props.stats?.blizzardsEncountered || 0)

const goalReward = computed(() => {
  let reward = 0
  flatGoals.value.forEach(g => { if (g.completed) reward += g.reward })
  return reward
})

const resourceBonus = computed(() => {
  return props.tools * 3 + props.wood
})

const completionRate = computed(() => {
  if (props.totalGoalsCount === 0) return 0
  return props.completedGoalsCount / props.totalGoalsCount
})

function getRank() {
  const d = props.dayCount
  const r = completionRate.value
  if (d >= 10 && r >= 0.8) return { name: 'S - 荒野之王', title: '传奇结局', icon: '👑', cls: 'rank-s' }
  if (d >= 7 && r >= 0.6) return { name: 'A - 生存专家', title: '辉煌结局', icon: '🏆', cls: 'rank-a' }
  if (d >= 5 && r >= 0.4) return { name: 'B - 老练探险家', title: '荣耀结局', icon: '🎖️', cls: 'rank-b' }
  if (d >= 3 && r >= 0.2) return { name: 'C - 初级生存者', title: '普通结局', icon: '⭐', cls: 'rank-c' }
  if (d >= 2) return { name: 'D - 菜鸟探险者', title: '遗憾结局', icon: '💫', cls: 'rank-d' }
  return { name: 'F - 雪原亡魂', title: '悲惨结局', icon: '💀', cls: 'rank-f' }
}

const rankName = computed(() => getRank().name)
const rankTitle = computed(() => getRank().title)
const rankIcon = computed(() => getRank().icon)
const rankClass = computed(() => getRank().cls)
</script>

<style scoped>
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(10px);
  animation: fadeIn 0.5s ease;
  overflow-y: auto;
  padding: 20px;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.game-over-content {
  text-align: center;
  padding: 40px;
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  border-radius: 20px;
  border: 2px solid rgba(231, 76, 60, 0.5);
  box-shadow: 0 0 50px rgba(231, 76, 60, 0.3);
  animation: slideUp 0.5s ease;
  max-width: 550px;
  width: 100%;
  margin: auto;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.rank-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.game-over-title {
  font-size: 36px;
  margin-bottom: 15px;
  text-shadow: 0 0 20px currentColor;
}
.game-over-title.rank-s { color: #ffd700; }
.game-over-title.rank-a { color: #e74c3c; }
.game-over-title.rank-b { color: #3498db; }
.game-over-title.rank-c { color: #2ecc71; }
.game-over-title.rank-d { color: #9b59b6; }
.game-over-title.rank-f { color: #e74c3c; }

.game-over-reason {
  color: rgba(255, 255, 255, 0.8);
  font-size: 16px;
  margin-bottom: 20px;
  line-height: 1.6;
}

.rank-badge {
  display: inline-block;
  padding: 12px 30px;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 2px solid;
}
.rank-badge.rank-s { background: linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,165,0,0.3)); border-color: #ffd700; }
.rank-badge.rank-a { background: linear-gradient(135deg, rgba(231,76,60,0.3), rgba(192,57,43,0.3)); border-color: #e74c3c; }
.rank-badge.rank-b { background: linear-gradient(135deg, rgba(52,152,219,0.3), rgba(41,128,185,0.3)); border-color: #3498db; }
.rank-badge.rank-c { background: linear-gradient(135deg, rgba(46,204,113,0.3), rgba(39,174,96,0.3)); border-color: #2ecc71; }
.rank-badge.rank-d { background: linear-gradient(135deg, rgba(155,89,182,0.3), rgba(142,68,173,0.3)); border-color: #9b59b6; }
.rank-badge.rank-f { background: linear-gradient(135deg, rgba(127,140,141,0.3), rgba(149,165,166,0.3)); border-color: #7f8c8d; }

.rank-label {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 4px;
}

.rank-value {
  display: block;
  font-size: 20px;
  font-weight: bold;
  color: white;
}

.total-score-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.score-label {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 5px;
}

.score-value {
  font-size: 48px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  line-height: 1;
  margin-bottom: 10px;
}

.score-breakdown {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;
}

.goals-summary {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  padding: 15px;
  margin-bottom: 20px;
  text-align: left;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.goals-summary h4 {
  color: white;
  font-size: 14px;
  margin: 0 0 12px 0;
  text-align: center;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 180px;
  overflow-y: auto;
  padding-right: 5px;
}

.goals-list::-webkit-scrollbar { width: 4px; }
.goals-list::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); border-radius: 2px; }
.goals-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.3); border-radius: 2px; }

.goal-summary-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.05);
}

.goal-summary-item.done {
  background: rgba(46, 204, 113, 0.15);
  border-left: 2px solid #2ecc71;
}

.goal-summary-item.failed {
  background: rgba(231, 76, 60, 0.1);
  border-left: 2px solid rgba(231, 76, 60, 0.5);
  opacity: 0.8;
}

.goal-icon { flex-shrink: 0; font-size: 14px; }

.goal-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.goal-name-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.goal-name {
  color: white;
  font-weight: 500;
}

.goal-reward {
  color: #ffd700;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
}

.goal-desc {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
  margin-top: 2px;
}

.final-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 25px;
}

.stat-item {
  background: rgba(0, 0, 0, 0.3);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.stat-label {
  display: block;
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  color: white;
  font-size: 18px;
  font-weight: bold;
}

.game-over-actions {
  display: flex;
  gap: 15px;
  justify-content: center;
}

.action-btn {
  padding: 15px 30px;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  flex: 1;
}

.action-btn.restart {
  background: linear-gradient(135deg, #2ecc71, #27ae60);
  color: white;
}

.action-btn.load {
  background: linear-gradient(135deg, #3498db, #2980b9);
  color: white;
}

.action-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
}

@media (max-width: 500px) {
  .game-over-content { padding: 25px 20px; }
  .final-stats { grid-template-columns: repeat(2, 1fr); }
  .score-value { font-size: 36px; }
}
</style>
