<script setup>
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

const authStore = useAuthStore();
const formStore = useFormStore();

const { authenticated } = storeToRefs(authStore);
const { isRTL } = storeToRefs(formStore);
</script>

<template>
  <div class="landing-layout" :class="{ 'dir-rtl': isRTL }">
    <!-- Hero Section -->
    <v-container fluid class="hero-section">
      <v-row justify="center" align="center" class="fill-height">
        <v-col cols="12" md="8" lg="6" class="text-center">
          <h1 class="text-h3 font-weight-bold mb-4" :lang="locale">
            Welcome to CHEFS
          </h1>
          <p class="text-h5 mb-6" :lang="locale">
            Create beautiful, accessible forms with ease
          </p>
          <v-btn
            :to="{ name: 'FormCreate' }"
            size="x-large"
            color="primary"
            class="mr-4"
            data-test="create-form-btn"
          >
            <v-icon start>mdi-plus</v-icon>
            {{ authenticated ? 'Create New Form' : 'Get Started' }}
          </v-btn>
          <v-btn
            v-if="!authenticated"
            :to="{ name: 'Login' }"
            size="x-large"
            variant="outlined"
            color="primary"
          >
            <v-icon start>mdi-login</v-icon>
            Sign In
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Features Section -->
    <v-container class="py-16">
      <v-row>
        <v-col cols="12" class="text-center mb-12">
          <h2 class="text-h4 font-weight-bold mb-4" :lang="locale">
            Why Choose CHEFS?
          </h2>
          <p class="text-subtitle-1 text--secondary" :lang="locale">
            Powerful form building tools designed for government and enterprise
          </p>
        </v-col>
      </v-row>

      <v-row>
        <v-col cols="12" md="4" class="text-center mb-8">
          <v-card flat class="feature-card">
            <v-card-text>
              <v-icon size="64" color="primary" class="mb-4">mdi-drag</v-icon>
              <h3 class="text-h5 mb-3" :lang="locale">Drag & Drop Builder</h3>
              <p class="text-body-1" :lang="locale">
                Build forms visually with our intuitive drag-and-drop interface.
                No coding required.
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4" class="text-center mb-8">
          <v-card flat class="feature-card">
            <v-card-text>
              <v-icon size="64" color="primary" class="mb-4"
                >mdi-shield-check</v-icon
              >
              <h3 class="text-h5 mb-3" :lang="locale">Secure & Compliant</h3>
              <p class="text-body-1" :lang="locale">
                Built with security and accessibility in mind. Meets government
                standards.
              </p>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="4" class="text-center mb-8">
          <v-card flat class="feature-card">
            <v-card-text>
              <v-icon size="64" color="primary" class="mb-4"
                >mdi-chart-line</v-icon
              >
              <h3 class="text-h5 mb-3" :lang="locale">Analytics & Reports</h3>
              <p class="text-body-1" :lang="locale">
                Track submissions, generate reports, and gain insights from your
                form data.
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- CTA Section -->
    <v-container fluid class="cta-section">
      <v-row justify="center">
        <v-col cols="12" md="8" class="text-center">
          <h2 class="text-h4 font-weight-bold mb-4" :lang="locale">
            Ready to Get Started?
          </h2>
          <p class="text-h5 mb-6" :lang="locale">
            Join thousands of users who trust CHEFS for their form needs
          </p>
          <v-btn
            :to="{ name: 'FormCreate' }"
            size="x-large"
            color="primary"
            class="mr-4"
          >
            <v-icon start>mdi-rocket-launch</v-icon>
            Start Building
          </v-btn>
          <v-btn
            :to="{ name: 'About' }"
            size="x-large"
            variant="outlined"
            color="primary"
          >
            <v-icon start>mdi-information</v-icon>
            Learn More
          </v-btn>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style lang="scss" scoped>
.landing-layout {
  .hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    min-height: 70vh;
  }

  .feature-card {
    height: 100%;
    transition: transform 0.3s ease;

    &:hover {
      transform: translateY(-8px);
    }
  }

  .cta-section {
    background-color: #f5f5f5;
    padding: 80px 0;
  }
}
</style>
