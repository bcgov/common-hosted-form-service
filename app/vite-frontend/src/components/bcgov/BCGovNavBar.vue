<script setup>
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useAuthStore } from '~/store/auth';
import { IdentityProviders } from '~/utils/constants';

const authStore = useAuthStore();

const { authenticated } = storeToRefs(authStore);
const hideNavBar = computed(() => useRoute()?.meta?.formSubmitMode);
const hasPrivileges = computed(
  () => authStore?.tokenParsed?.identity_provider === IdentityProviders.IDIR
);
</script>

<template>
  <nav
    v-if="!hideNavBar"
    class="elevation-20 navigation-main d-print-none px-md-16 px-4"
  >
    <div class="nav-holder">
      <ul>
        <li>
          <router-link data-cy="aboutLinks" :to="{ name: 'About' }"
            >About</router-link
          >
        </li>
        <li v-if="authenticated">
          <router-link data-cy="userFormsLinks" :to="{ name: 'UserForms' }"
            >My Forms</router-link
          >
        </li>
        <li v-if="hasPrivileges">
          <router-link :to="{ name: 'FormCreate' }"
            >Create a New Form</router-link
          >
        </li>
        <li v-if="hasPrivileges">
          <a
            href="https://github.com/bcgov/common-hosted-form-service/wiki"
            target="_blank"
            >Help</a
          >
        </li>
        <li v-if="hasPrivileges">
          <a
            href="https://chefs-fider.apps.silver.devops.gov.bc.ca/"
            target="_blank"
            >Feedback</a
          >
        </li>
        <!-- <li>
          <router-link :to="{ name: 'User' }">User (TBD)</router-link>
        </li> -->
        <li v-if="isAdmin">
          <router-link :to="{ name: 'Admin' }">Admin</router-link>
        </li>
      </ul>
    </div>
  </nav>
</template>

<style lang="scss" scoped>
.navigation-main {
  box-shadow: 0 6px 8px -4px #b3b1b3;
  display: flex;
  color: #fcba19;
  background-color: #38598a;
  width: 100%;
  -webkit-box-shadow: 0 6px 8px -4px #b3b1b3;
  -moz-box-shadow: 0 6px 8px -4px #b3b1b3;

  .nav-holder {
    padding: 0;
    ul {
      display: flex;
      flex-direction: row;
      margin: 0;
      color: #ffffff;
      list-style: none;
      margin-left: -1.7rem;

      li {
        a {
          display: flex;
          font-weight: normal;
          min-height: 2rem;
          color: #ffffff;
          padding: 0.75rem 1rem 0.75rem 1rem;
          text-decoration: none;

          &:focus {
            outline: none;
            outline-offset: 0;
          }
          &:hover {
            text-decoration: underline;
          }
        }

        & ~ li {
          border-left: 1px solid #9b9b9b;
          margin: 0;
        }
      }

      .router-link-exact-active {
        background-color: #7ba2cc80;
        border-bottom: 2px solid #fcba19;
        font-weight: bold;
      }
    }
  }
}
</style>
