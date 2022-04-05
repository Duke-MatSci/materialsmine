<template>
  <md-card class="md-layout-item">
    <md-card-header key="tool_title">
      <md-card-header-text>
        <div class="md-title">
          <slot name="title"></slot>
        </div>
      </md-card-header-text>
      <md-card-media class="tool_card_image" key="image" md-big>
        <slot name="image"></slot>
      </md-card-media>
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

<style scoped>
.tool_card_image {
  width: 33%;
}
</style>
