<template>
  <div class="section_teams">
    <div class="wrapper">
      <div class="howto_item" v-for="(video, idx) in videos" :key="idx">
        <div class="howto_item-header" @click="displayVideo(idx)">
          <span class="material-icons">desktop_windows</span>
          <h1 :title="video.title" class="visualize_header-h1">
            {{ video.title }}
          </h1>
        </div>
        <p class="u_margin-bottom-med">{{ video.text }}</p>
        <div v-if="!video.hide">
          <video controls autoplay :src="video.url"></video>
        </div>
      </div>
      <div class="howto_item">
        <div
          class="howto_item-header"
          @click="displayVideo('null', 'https://youtu.be/o2FA1yM85M8')"
        >
          <span class="material-icons">smart_display</span>
          <h1 title="Nanomine Visualization Gallery" class="visualize_header-h1">
            Nanomine Visualization Gallery
          </h1>
        </div>
        <p class="u_margin-bottom-med">
          This video tutorial is a short overview of the charts platform.
        </p>
      </div>
      <div class="howto_item">
        <div class="howto_item-header" @click="displayVideo('null', 'https://vimeo.com/199084718')">
          <span class="material-icons">smart_display</span>
          <h1 title="Data Voyager" class="visualize_header-h1">Data Voyager</h1>
        </div>
        <p class="u_margin-bottom-med">
          This narrated video tutorial gives an overview of Voyager 2, the data exploration and
          automated chart creation tool.
        </p>
      </div>
      <div class="howto_item">
        <div
          class="howto_item-header"
          @click="
            displayVideo(
              'null',
              'https://drive.google.com/file/d/11sDYjqTxUdYSSs1nmFy-C9krEbe8xi3F/view?usp=sharing'
            )
          "
        >
          <span class="material-icons">smart_display</span>
          <h1 title="Data Voyager" class="visualize_header-h1">Material Visualization</h1>
        </div>
        <p class="u_margin-bottom-med">
          This narrated video tutorial gives an overview of Metamine Material Visualization.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';

// Component name for debugging
defineOptions({
  name: 'HowTo',
});

// Store
const store = useStore();

// Reactive data
const videos = ref<any[]>([]);

// Methods
const showBox = () => {
  console.log('showBox called');
};

const hideVideos = (idx: number) => {
  let noTouch: number | null = null;
  if (idx >= 0) {
    noTouch = idx;
  }
  videos.value.forEach((v, i) => {
    if (i !== noTouch && videos.value[i]) {
      const o = { ...videos.value[i] };
      o.hide = true;
      videos.value[i] = o;
    }
  });
};

const displayVideo = (idx: number | string, link?: string) => {
  if (link) {
    // console.log('Opening ' + link);
    return window.open(link, '_blank');
  }

  const index = Number(idx);
  if (index >= 0 && index < videos.value.length && videos.value[index]) {
    hideVideos(index);
    const isHidden = videos.value[index].hide;
    const o = { ...videos.value[index] };
    o.hide = !isHidden;
    videos.value[index] = o;
    // console.log('Hidden(' + index + ') = ' + videos.value[index].hide);
  } else {
    console.warn('Invalid video index:', index);
  }
};

// Lifecycle hooks
onMounted(() => {
  const vids = store.getters.videos;

  if (vids && typeof vids === 'object') {
    Object.keys(vids).forEach((v, idx) => {
      const key = v;
      const o = { ...vids[key] };
      o.hide = true;
      o.nm = key;
      videos.value.push(o);
    });
    hideVideos(-1);
  } else {
    console.warn('Videos data not found in store');
  }

  // Set app header info on component creation
  store.commit('setAppHeaderInfo', { icon: 'smart_display', name: 'How To' });
});
</script>
