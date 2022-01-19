<template>
    <div class="section_footer">
        <div class="wrapper">
            <div class="grid grid_col-space-right grid_gap-smaller">
                <div class="footer_content u_toggle-display-off">
                    <router-link to="/">
                        <img src="@/assets/img/materialsmine_logo.png" href="/" class="footer_icon-img" alt="Materialsmine Logo">
                    </router-link>
                    <span class="footer_icon-text">&copy; 2014 - {{ new Date().getFullYear() }} Nanomine. All Rights Reserved.</span>
                </div>
                <div class="footer_content">
                    <div class="grid grid_col-3">
                        <div class="footer_list">
                            <ul>
                                <li><a href="/nm">Nanomine</a></li>
                                <li><a href="/mm">Metamine</a></li>
                            </ul>
                        </div>
                        <div class="footer_list">
                            <ul>
                                <li><router-link to="/about">About Us</router-link></li>
                                <li><router-link to="/how">How To</router-link></li>
                                <li><router-link to="/news">Research & News</router-link></li>
                            </ul>
                        </div>
                        <div class="footer_list">
                            <ul>
                                <li><a href="https://oarc.duke.edu/privacy/duke-university-privacy-statement" target="_blank">Privacy Policy</a></li>
                                <li><a href="https://security.duke.edu/node/82" target="_blank">Terms of Use</a></li>
                                <li><router-link to="/contact">Contact Us</router-link></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <div class="footer_content-mobile">
                <img src="@/assets/img/materialsmine_logo.png" class="footer_icon-img" alt="Materialsmine Logo">
                <span class="footer_icon-text">&copy; 2014-{{ new Date().getFullYear() }} Materialsmine. All Rights Reserved.</span>
            </div>
        </div>
    </div>
</template>

<style scoped lang="scss">
</style>
<script>
// import AppMixin from './mixins'
export default {
  name: 'Footer'
  // mixins: [AppMixin],
}
</script>
