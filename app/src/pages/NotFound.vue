<template>
  <div>
    <header class="header">
      <div class="wrapper">
        <router-link to="/" class="header-logo">
          <div class="">
            <img
              src="@/assets/img/materialsmine_logo.png"
              alt="MaterialsMine Logo"
            />
          </div>
        </router-link>
        <div class="nav_mobile-icon">
          <div class="nav_mobile-icon-menu"></div>
        </div>
        <div class="header_nav header_404_nav">
          <div class="nav nav_menu u--inline">
            <ul>
              <li><a href="/nm">NanoMine</a></li>
              <li><a href="/mm">MetaMine</a></li>
            </ul>
          </div>
          <div class="u--inline">
            <div
              v-if="$store.getters['auth/isAuthenticated']"
              class="nav_menu--container"
            >
              <a
                class="u--default-size nav_menu--handler"
                style="color: #fff; font-size: 1.2rem !important"
              >
                <i class="material-icons" style="vertical-align: middle"
                  >perm_identity</i
                >
                {{ $store.getters['auth/displayName'] }}
              </a>
              <div class="nav_menu--siblings nav_menu--sibheader">
                <span
                  class="nav_menu--siblings-lists"
                  @click="$store.dispatch('logout')"
                  ><a>Logout</a></span
                >
              </div>
            </div>
            <div v-else>
              <a class="btn btn--tertiary btn--noradius" href="/secure"
                >Login/Register</a
              >
            </div>
          </div>
        </div>
      </div>
    </header>
    <div class="page-not-found">
      <h1 class="page-not-found-header u_margin-bottom-small">Oops!</h1>
      <h2 class="u_margin-top-med u_margin-bottom-small">
        404 - Page Not Found
      </h2>
      <p>
        The page you are looking for might have been removed, had its name
        changed or is temporarily unavailable. Would you like to go back to
        <router-link to=""
          ><a @click="$router.go(-1)">previous page</a></router-link
        >?
      </p>
    </div>
  </div>
</template>
