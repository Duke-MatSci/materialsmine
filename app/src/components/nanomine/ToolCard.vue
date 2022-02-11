<template>
  <div class="md-layout-item" v-if="display" key="should_display">
    <md-card>
      <md-card-media v-if="imageFile" key="image">
        <img :src="require(`@/assets/img/${imageFile}`)" :alt="imageFile"></img>
      </md-card-media>
      <md-card-header v-if="title" key="tool_title">
          <div class="md-title" v-if="link" key="has_tool_link">
            <router-link :to="link">{{ title }}</router-link>
          </div>
          <div class="md-title" v-else key="no_tool_link">
            {{ title }}
          </div>
      </md-card-header>
      <md-card-content v-if="text" key="has_tool_text">
        {{ text }}
      </md-card-content>
    </md-card>
  </div>
</template>

<script>
export default {
  name: 'ToolCard',
  props: {
    imageFile: {
      type: String,
      required: false
    },
    title: {
      type: String,
      required: true
    },
    link: {
      type: String,
      required: false
    },
    text: {
      type: String,
      required: true
    },
    display: {
      type: Boolean,
      required: false,
      default: false
    }
  }
}
</script>