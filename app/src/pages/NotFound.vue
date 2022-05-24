<template>
    <div>
        <div class="page-not-found">
            <h1 class="page-not-found-header">Oops!</h1>
            <h2 class="sample-page_header">404 - Page Not Found</h2>
            <p>The page you are looking for might have been removed, had its name changed or is temporarily unavailable. Would you like to go back to <router-link to=""><a @click="$router.go(-1)">previous page</a></router-link>?</p>
        </div>
    </div>
</template>
