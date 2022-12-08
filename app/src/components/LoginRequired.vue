<template>
  <div class="page-not-found">
    <i class="material-icons page-not-found-header u--padding-zero" >lock_person</i>
    <h2 class="u_margin-bottom-small">Login required</h2>
    <p>The page you are trying to access requires authentication.
      Would you like to <a>log in</a> or return to the
      <router-link to=""><a @click="$router.go(-1)">previous page</a></router-link>?
    </p>
  </div>
</template>
