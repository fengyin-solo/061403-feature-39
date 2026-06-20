<template>
  <div class="log-panel">
    <h3 class="panel-title">
      日志
      <span class="log-count">共 {{ logs.length }} 条</span>
    </h3>
    <div class="log-list" ref="logListRef">
      <div 
        v-for="(log, index) in logs" 
        :key="index" 
        class="log-item" 
        :class="[log.type, { highlight: log.isHighlight }"
      >
        <span class="log-pin" v-if="log.isHighlight">⭐</span>
        <span class="log-time">[{{ log.timestamp }}]</span>
        <span class="log-message">{{ log.message }}</span>
      </div>
      <div v-if="logs.length === 0" class="empty-log">
        暂无日志
      </div>
    </div>
  </div>
  </template>

<script setup>
defineProps({
  logs: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.log-panel {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 340px;
}

.panel-title {
  color: white;
  font-size: 18px;
  margin-bottom: 15px;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.log-count {
  font-size: 11px;
  font-weight: normal;
  color: rgba(255, 255, 255, 0.5);
}

.log-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 10px;
}

.log-list::-webkit-scrollbar {
  width: 6px;
}

.log-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.log-list::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.log-item {
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  animation: fadeIn 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateX(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.log-item.highlight {
  border-width: 3px;
  font-weight: 500;
  animation: highlightPulse 0.6s ease;
  position: relative;
}

@keyframes highlightPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.02); }
  100% { transform: scale(1); }
}

.log-pin {
  flex-shrink: 0;
  font-size: 12px;
}

.log-item.info {
  background: rgba(52, 152, 219, 0.3);
  border-left: 3px solid #3498db;
  color: #aed6f1;
}
.log-item.info.highlight {
  background: rgba(52, 152, 219, 0.45);
  border-left: 3px solid #5dade2;
  box-shadow: 0 0 10px rgba(52, 152, 219, 0.3);
}

.log-item.success {
  background: rgba(46, 204, 113, 0.3);
  border-left: 3px solid #2ecc71;
  color: #abebc6;
}
.log-item.success.highlight {
  background: rgba(46, 204, 113, 0.45);
  border-left: 3px solid #58d68d;
  box-shadow: 0 0 10px rgba(46, 204, 113, 0.3);
}

.log-item.warning {
  background: rgba(243, 156, 18, 0.3);
  border-left: 3px solid #f39c12;
  color: #fad7a0;
}
.log-item.warning.highlight {
  background: rgba(243, 156, 18, 0.45);
  border-left: 3px solid #f5b041;
  box-shadow: 0 0 10px rgba(243, 156, 18, 0.3);
}

.log-item.danger {
  background: rgba(231, 76, 60, 0.3);
  border-left: 3px solid #e74c3c;
  color: #f5b7b1;
}
.log-item.danger.highlight {
  background: rgba(231, 76, 60, 0.5);
  border-left: 3px solid #ec7063;
  box-shadow: 0 0 15px rgba(231, 76, 60, 0.4);
  animation: dangerPulse 1s ease-in-out infinite alternate;
}

@keyframes dangerPulse {
  from { box-shadow: 0 0 8px rgba(231, 76, 60, 0.3); }
  to { box-shadow: 0 0 18px rgba(231, 76, 60, 0.5); }
}

.log-item.action {
  background: rgba(155, 89, 182, 0.3);
  border-left: 3px solid #9b59b6;
  color: #d2b4de;
}

.log-item.goal {
  background: linear-gradient(135deg, rgba(241, 196, 15, 0.35), rgba(243, 156, 18, 0.25));
  border-left: 3px solid #f1c40f;
  color: #fdebd0;
  box-shadow: 0 0 12px rgba(241, 196, 15, 0.35);
  animation: goalGlow 2s ease-in-out infinite alternate;
}

@keyframes goalGlow {
  from { box-shadow: 0 0 8px rgba(241, 196, 15, 0.25); }
  to { box-shadow: 0 0 18px rgba(241, 196, 15, 0.5); }
}

.log-item.phase {
  background: linear-gradient(135deg, rgba(155, 89, 182, 0.4), rgba(142, 68, 173, 0.3));
  border-left: 3px solid #9b59b6;
  color: #e8daef;
  box-shadow: 0 0 12px rgba(155, 89, 182, 0.35);
}

.log-time {
  color: rgba(255, 255, 255, 0.5);
  margin-right: 4px;
  font-size: 10px;
  flex-shrink: 0;
  white-space: nowrap;
}

.empty-log {
  text-align: center;
  color: rgba(255, 255, 255, 0.4);
  padding: 20px;
  font-style: italic;
}
</style>
