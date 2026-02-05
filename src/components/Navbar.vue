<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <nav class="navbar">
    <div class="container">
      <RouterLink to="/" class="brand">Toggl Track Analytics</RouterLink>
      <div class="links">
        <RouterLink to="/" active-class="active">Dashboard</RouterLink>
        <RouterLink to="/raw" active-class="active">Raw Data</RouterLink>
      </div>
    </div>
  </nav>
</template>
