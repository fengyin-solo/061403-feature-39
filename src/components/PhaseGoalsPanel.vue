<template>
  <div class="phase-goals-panel" :class="{ expanded: isExpanded }">
    <div class="panel-header" @click="toggleExpand">
      <div class="header-left">
        <span class="phase-icon">🎯</span>
        <div class="phase-info">
          <span class="phase-name">{{ currentPhase?.name || '未知阶段' }}</span>
          <span class="phase-days" v-if="currentPhase">
            第 {{ currentPhase.dayRange[0] }}-{{ currentPhase.dayRange[1] === Infinity ? '∞' : currentPhase.dayRange[1] }} 天
          </span>
        </div>
      </div>
      <div class="header-right">
        <div class="score-badge">
          <span class="score-icon">🏆</span>
          <span class="score-value">{{ totalScore }}</span>
        </div>
        <div class="progress-badge">
          {{ completedGoalsCount }}/{{ totalGoalsCount }}
        </div>
        <span class="expand-icon">{{ isExpanded ? '▲' : '▼' }}</span>
      </div>
    </div>

    <div class="phase-description" v-if="currentPhase && isExpanded">
      {{ currentPhase.description }}
    </div>

    <transition name="slide">
      <div class="goals-container" v-show="isExpanded">
        <div class="phases-tabs">
          <div 
            v-for="phase in allPhases" 
            :key="phase.id"
            class="phase-tab"
            :class="{ 
              active: phase.isActive, 
              past: phase.isPast,
              future: phase.isFuture,
              complete: phase.completedCount === phase.goals.length
            }"
          >
            <span class="tab-name">{{ phase.name.split('').slice(0, 2).join('') }}</span>
            <span class="tab-progress">{{ phase.completedCount }}/{{ phase.goals.length }}</span>
          </div>
        </div>

        <div 
          v-for="goal in phaseGoals" 
          :key="goal.id" 
          class="goal-card"
          :class="{ done: goal.completed, active: !goal.completed }"
        >
          <div class="goal-header">
            <div class="goal-status">
              <span class="status-icon">{{ goal.completed ? '✅' : '⭕' }}</span>
              <span class="goal-title">{{ goal.name }}</span>
            </div>
            <span class="goal-reward-badge" :class="{ earned: goal.completed }">
              +{{ goal.reward }}
            </span>
          </div>
          
          <div class="goal-desc">{{ goal.description }}</div>
          
          <div class="goal-progress-bar">
            <div 
              class="progress-fill" 
              :style="{ width: goal.percentage + '%' }"
              :class="{ done: goal.completed }"
            ></div>
          </div>
          
          <div class="goal-progress-text">
            <span>{{ formatCurrent(goal) }}</span>
            <span>{{ goal.percentage }}%</span>
          </div>
        </div>

        <div class="panel-footer" v-if="phaseGoals.length > 0">
          <div class="phase-stats">
            <div class="stat-mini">
              <span>阶段奖励</span>
              <span class="golden">{{ activePhase?.earnedReward || 0 }}/{{ activePhase?.totalReward || 0 }}</span>
            </div>
            <div class="stat-mini">
              <span>已完成</span>
              <span class="golden">{{ activePhase?.completedCount || 0 }}/{{ activePhase?.goals.length || 0 }}</span>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  currentPhase: {
    type: Object,
    default: null
  },
  phaseGoals: {
    type: Array,
    default: () => []
  },
  allPhases: {
    type: Array,
    default: () => []
  },
  totalScore: {
    type: Number,
    default: 0
  },
  completedGoalsCount: {
    type: Number,
    default: 0
  },
  totalGoalsCount: {
    type: Number,
    default: 0
  }
})

const isExpanded = ref(true)

const activePhase = computed(() => props.allPhases.find(p => p.isActive))

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function formatCurrent(goal) {
  if (goal.type === 'flag') {
    return goal.completed ? '达成' : '进行中'
  }
  const target = goal.target === Infinity ? '∞' : goal.target
  const current = goal.current
  if (typeof current === 'boolean') {
    return current ? '达成' : '未达成'
  }
  return `${current}/${target}`
}
</script>

<style scoped>
.phase-goals-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 215, 0, 0.3);
  overflow: hidden;
  transition: all 0.3s ease;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 18px;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15), rgba(243, 156, 18, 0.1));
  transition: background 0.3s;
}

.panel-header:hover {
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.25), rgba(243, 156, 18, 0.2));
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.phase-icon {
  font-size: 24px;
}

.phase-info {
  display: flex;
  flex-direction: column;
}

.phase-name {
  color: white;
  font-size: 16px;
  font-weight: bold;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
}

.phase-days {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-top: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.score-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(255, 215, 0, 0.2);
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(255, 215, 0, 0.4);
}

.score-icon {
  font-size: 14px;
}

.score-value {
  color: #ffd700;
  font-weight: bold;
  font-size: 14px;
}

.progress-badge {
  background: rgba(46, 204, 113, 0.2);
  padding: 5px 10px;
  border-radius: 8px;
  border: 1px solid rgba(46, 204, 113, 0.4);
  color: #2ecc71;
  font-weight: bold;
  font-size: 12px;
}

.expand-icon {
  color: rgba(255, 255, 255, 0.6);
  font-size: 10px;
  transition: transform 0.3s;
}

.phase-description {
  padding: 8px 18px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 12px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.goals-container {
  padding: 15px 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.phases-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 15px;
  overflow-x: auto;
  padding-bottom: 5px;
}

.phases-tabs::-webkit-scrollbar {
  height: 3px;
}
.phases-tabs::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}
.phases-tabs::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.phase-tab {
  flex-shrink: 0;
  padding: 6px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
  opacity: 0.6;
}

.phase-tab.active {
  background: linear-gradient(135deg, rgba(155, 89, 182, 0.3), rgba(142, 68, 173, 0.2));
  border-color: rgba(155, 89, 182, 0.6);
  opacity: 1;
}

.phase-tab.past {
  opacity: 0.8;
}

.phase-tab.future {
  opacity: 0.4;
}

.phase-tab.complete {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.3), rgba(39, 174, 96, 0.2));
  border-color: rgba(46, 204, 113, 0.6);
  opacity: 0.9;
}

.tab-name {
  color: white;
  font-size: 11px;
  font-weight: bold;
}

.tab-progress {
  color: rgba(255, 255, 255, 0.6);
  font-size: 9px;
}

.goal-card {
  padding: 12px;
  border-radius: 10px;
  margin-bottom: 10px;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.goal-card:last-child {
  margin-bottom: 0;
}

.goal-card.done {
  background: linear-gradient(135deg, rgba(46, 204, 113, 0.2), rgba(39, 174, 96, 0.1));
  border-color: rgba(46, 204, 113, 0.4);
}

.goal-card.active {
  animation: gentlePulse 3s ease-in-out infinite;
}

@keyframes gentlePulse {
  0%, 100% { box-shadow: 0 0 0 rgba(255, 215, 0, 0); }
  50% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.1); }
}

.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.goal-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 14px;
  flex-shrink: 0;
}

.goal-title {
  color: white;
  font-weight: bold;
  font-size: 13px;
}

.goal-reward-badge {
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255, 215, 0, 0.15);
  border: 1px solid rgba(255, 215, 0, 0.3);
  color: #ffd700;
  font-size: 11px;
  font-weight: bold;
  flex-shrink: 0;
}

.goal-reward-badge.earned {
  background: rgba(46, 204, 113, 0.2);
  border-color: rgba(46, 204, 113, 0.5);
  color: #2ecc71;
}

.goal-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
  margin-bottom: 10px;
  padding-left: 22px;
}

.goal-progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 5px;
  padding-left: 22px;
  box-sizing: border-box;
  padding: 0;
  margin-left: 22px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #f39c12, #f1c40f);
  border-radius: 4px;
  transition: width 0.5s ease;
}

.progress-fill.done {
  background: linear-gradient(90deg, #27ae60, #2ecc71);
}

.goal-progress-text {
  display: flex;
  justify-content: space-between;
  padding: 0 22px;
  font-size: 10px;
  color: rgba(255, 255, 255, 0.5);
}

.panel-footer {
  margin-top: 15px;
  padding-top: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.phase-stats {
  display: flex;
  justify-content: space-around;
  gap: 15px;
}

.stat-mini {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}

.stat-mini span:first-child {
  color: rgba(255, 255, 255, 0.6);
  font-size: 11px;
}

.stat-mini .golden {
  color: #ffd700;
  font-size: 14px;
  font-weight: bold;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 800px;
}

@media (max-width: 600px) {
  .panel-header {
    padding: 10px 14px;
  }
  .phase-name {
    font-size: 14px;
  }
  .goals-container {
    padding: 12px 14px;
  }
  .score-badge,
  .progress-badge {
    padding: 4px 8px;
    font-size: 11px;
  }
}
</style>
