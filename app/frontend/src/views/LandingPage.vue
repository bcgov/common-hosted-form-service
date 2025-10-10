<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

// import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

// const authStore = useAuthStore();
const formStore = useFormStore();

// const { authenticated } = storeToRefs(authStore);
const { isRTL } = storeToRefs(formStore);
</script>

<template>
  <div class="landing-layout" :class="{ 'dir-rtl': isRTL }">
    <!-- Hero Section -->
    <v-container class="hero-section py-16">
      <v-row>
        <v-col cols="12" md="6">
          <div class="hero-content">
            <span class="online-builder-tag" :lang="locale">
              ONLINE FORM BUILDER
            </span>

            <h1 class="hero-title mt-4 mb-6" :lang="locale">
              Discover how CHEFS can help you
            </h1>

            <p class="hero-description mb-8" :lang="locale">
              With multi-tenancy, you can manage roles, share forms across
              projects, and collaborate securely in one place. Click Get Started
              to experience the new Enterprise CHEFS.
            </p>

            <v-btn
              color="primary"
              size="large"
              :to="{ name: 'FormCreate' }"
              class="get-started-btn"
              data-test="get-started-btn"
            >
              Get Started
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Multi-tenancy Section -->
    <v-container class="multi-tenancy-section py-16">
      <v-row align="center">
        <v-col cols="12" md="5">
          <div class="illustration-wrapper">
            <img
              src="/images/person-at-computer.png"
              alt="Person working at computer"
              class="hero-illustration"
            />
          </div>
        </v-col>

        <v-col cols="12" md="7">
          <div class="content-wrapper">
            <h2 class="section-title mb-4" :lang="locale">
              Transforming CHEFS from a single-player experience into a true
              team sport with Multi-tenancy
            </h2>

            <p class="section-description mb-6" :lang="locale">
              Need to create a tenant for your team or project? At CSTAR
              <em>(Connected Services, Team Access, and Roles)</em> you can
              check your existing Tenant memberships — or request a new Tenant
              if you're starting from scratch.
            </p>

            <v-btn
              variant="outlined"
              color="primary"
              size="large"
              class="cstar-btn"
            >
              Go To CSTAR
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.landing-layout {
  background-color: #ffffff;

  .hero-section {
    max-width: 1200px;

    .hero-content {
      .online-builder-tag {
        display: inline-block;
        color: #f8bb47;
        font-size: 24px;
        font-weight: 400;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .hero-title {
        font-size: 48px;
        font-weight: 700;
        color: #2d2d2d;
        line-height: 1.2;
      }

      .hero-description {
        font-size: 20px;
        font-weight: 400;
        color: #2d2d2d;
        line-height: 1.7;
        max-width: 800px;
      }

      .get-started-btn {
        background-color: #003366;
        color: white;
        padding: 12px 32px;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }
    }

    .dotted-separator {
      width: 100%;
      height: 2px;
      background-image: repeating-linear-gradient(
        to right,
        #f8bb47 0,
        #f8bb47 10px,
        transparent 10px,
        transparent 20px
      );
      margin-top: 40px;
    }
  }

  .multi-tenancy-section {
    max-width: 1200px;

    .illustration-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;

      .hero-illustration {
        max-width: 100%;
        height: auto;
      }
    }

    .content-wrapper {
      .section-title {
        font-size: 28px;
        font-weight: 600;
        color: #2d2d2d;
        line-height: 1.4;
      }

      .section-description {
        font-size: 16px;
        font-weight: 400;
        color: #2d2d2d;
        line-height: 1.6;

        em {
          font-style: italic;
        }
      }

      .cstar-btn {
        border: 2px solid #003366;
        color: #003366;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }
    }
  }
}

// RTL Support
.dir-rtl {
  direction: rtl;
}
</style>
