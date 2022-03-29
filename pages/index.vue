<template>
  <div class="page home">
  </div>
</template>

<script>
export default {
  async asyncData ({ $http }) {
    const test = await $http.$get('/api/test')
    return {
      test
    }
  }
}
</script>

<style scoped lang="scss">
</style>
