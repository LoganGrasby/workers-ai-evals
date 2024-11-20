<template>
  <header>
    <nav>
      <router-link to="/">LLM Evaluator</router-link>
    </nav>
  </header>

  <main>
    <router-view></router-view>
  </main>
</template>

<style>
header {
  background: #2c3e50;
  padding: 1rem;
  color: white;
}

nav a {
  color: white;
  text-decoration: none;
  font-size: 1.4rem;
  font-weight: bold;
}

main {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>
