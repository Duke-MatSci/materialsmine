<template>
  <md-card class="md-layout-item">
    <md-card-media key="image">
      <slot name="image"></slot>
      <!-- <img :src="require(`@/assets/img/${imageFile}`)" :alt="imageFile"/> -->
    </md-card-media>
    <md-card-header key="tool_title">
      <slot name="title"></slot>
    </md-card-header>
    <md-card-content>
      <slot name="content"></slot>
    </md-card-content>
    <md-card-actions>
      <slot name="actions"></slot>
    </md-card-actions>
  </md-card>
</template>

<script>
export default {
  name: 'ToolCard'
}
</script>
