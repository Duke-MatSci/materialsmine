<template>
  <md-app md-waterfall md-mode="fixed-last">
    <md-app-toolbar :toggler='toggleMenu' />
    <md-app-drawer :md-active.sync="toggleMenuVisibility">
      <drawer />
    </md-app-drawer>
    <md-app-content>
      <!-- **** Content Goes Here *** -->
      <div class="article">
        <h1>{{ doi }}</h1>
        <div>{{articleMetadata}}</div>
        <div>{{referencesMetadata}}</div>
        <div>{{citationsMetadata}}</div>
      </div>
    </md-app-content>
  </md-app>
</template>
<script src='./article.js'></script>
