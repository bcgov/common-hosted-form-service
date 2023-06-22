<script setup>
import { ref } from 'vue';

const emits = defineEmits(['increment']);

const count = ref(0);

function handleClick() {
  emits('increment', count.value);
}
</script>

<template>
  <v-dialog></v-dialog>
  <span>{{ count }}</span>
  <v-btn @click="handleClick">Increment</v-btn>
</template>
