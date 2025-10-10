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

// Form examples data
const formExamples = [
  {
    title: 'Demographic Data Collection Survey',
    image: '/images/examples/demographic-survey.png',
  },
  {
    title: 'Example | Calculations in Data Grid',
    image: '/images/examples/calculations-grid.png',
  },
  {
    title: 'POST-COURSE SURVEY',
    image: '/images/examples/post-course-survey.png',
  },
];

// Testimonials data
const testimonials = [
  {
    rating: 4.5,
    label: 'Verified User',
    title: 'Great communication and collaboration',
    date: 'Reviewed in Victoria, BC, Canada on May 19, 2024',
    screenshot: '/images/testimonials/screenshot-1.png',
    content:
      'The responsiveness and willingness to help with any issue I had was very much appreciated. The team was available to answer my questions.',
  },
  {
    rating: 5,
    label: 'Verified User',
    title: 'Accessible yet powerful',
    date: 'Reviewed in Victoria, BC, Canada on Jul 12, 2023',
    screenshot: '/images/testimonials/screenshot-2.png',
    content:
      'CHEFS makes it easy to create forms without technical knowledge, while still providing advanced features for power users.',
  },
  {
    rating: 4.5,
    label: 'Verified User',
    title: 'Clear documentation and helpful support',
    date: 'Reviewed in Victoria, BC, Canada on May 5, 2023',
    screenshot: '/images/testimonials/screenshot-3.png',
    content:
      'The documentation is comprehensive and the support team is always ready to help. Makes form building straightforward.',
  },
];
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

    <!-- Examples Section -->
    <v-container class="examples-section py-16">
      <v-row>
        <v-col cols="12" md="6" class="text-section">
          <h2 class="examples-title mb-8" :lang="locale">
            Not sure where to start? Below are examples of forms created by our
            users.
          </h2>
        </v-col>
        <v-col cols="12" md="6" class="illustration-section">
          <div class="person-laptop-wrapper">
            <div class="organic-shape-beige"></div>
            <img
              src="/images/person-laptop.png"
              alt="Person with laptop"
              class="person-laptop-img"
            />
          </div>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col
          v-for="(example, index) in formExamples"
          :key="index"
          cols="12"
          md="4"
        >
          <v-card class="example-card" elevation="2">
            <v-img
              :src="example.image"
              :alt="example.title"
              height="300"
              cover
            ></v-img>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Testimonials Section -->
    <v-container class="testimonials-section py-16">
      <v-row align="center">
        <v-col cols="12" md="5">
          <div class="testimonial-illustration-wrapper">
            <div class="organic-shape-blue"></div>
            <img
              src="/images/person-presenting.png"
              alt="Person presenting"
              class="person-presenting-img"
            />
          </div>
        </v-col>
        <v-col cols="12" md="7">
          <h2 class="testimonials-title mb-8" :lang="locale">
            Don't take our word for it, hear what our users have to say about
            us.
          </h2>
        </v-col>
      </v-row>

      <v-row class="mt-8">
        <v-col
          v-for="(testimonial, index) in testimonials"
          :key="index"
          cols="12"
          md="4"
        >
          <v-card class="testimonial-card" elevation="2">
            <v-card-title class="text-subtitle-2 font-weight-bold">
              CHEFS User
            </v-card-title>
            <v-card-subtitle class="mb-2">
              <v-rating
                :model-value="testimonial.rating"
                color="orange"
                density="compact"
                size="small"
                readonly
              ></v-rating>
              <span class="text-caption text-orange">{{
                testimonial.label
              }}</span>
            </v-card-subtitle>
            <v-card-text>
              <h3 class="text-body-1 font-weight-bold mb-2">
                {{ testimonial.title }}
              </h3>
              <p class="text-caption text-medium-emphasis">
                {{ testimonial.date }}
              </p>
              <v-img
                v-if="testimonial.screenshot"
                :src="testimonial.screenshot"
                class="my-3"
                height="120"
                cover
              ></v-img>
              <p class="text-body-2 mt-3">
                {{ testimonial.content }}
              </p>
            </v-card-text>
          </v-card>
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
    padding-top: 48px !important;
    padding-bottom: 48px !important;

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

  .examples-section {
    max-width: 1200px;
    padding-top: 64px !important;
    padding-bottom: 64px !important;

    .text-section {
      .examples-title {
        font-size: 32px;
        font-weight: 700;
        color: #1e5189;
        line-height: 1.3;
      }
    }

    .illustration-section {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;

      .person-laptop-wrapper {
        position: relative;
        width: 100%;
        height: 400px;

        .organic-shape-beige {
          position: absolute;
          width: 450px;
          height: 450px;
          background-color: #fef5e7;
          border-radius: 50% 40% 60% 40%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .person-laptop-img {
          position: relative;
          max-width: 350px;
          height: auto;
          z-index: 2;
          margin: 0 auto;
          display: block;
        }
      }
    }

    .example-card {
      height: 100%;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
      cursor: pointer;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      }
    }
  }

  .testimonials-section {
    max-width: 1200px;
    padding-top: 64px !important;
    padding-bottom: 64px !important;

    .testimonial-illustration-wrapper {
      position: relative;
      width: 100%;
      height: 400px;
      display: flex;
      justify-content: center;
      align-items: center;

      .organic-shape-blue {
        position: absolute;
        width: 500px;
        height: 450px;
        background-color: #e3f2fd;
        border-radius: 60% 40% 50% 50%;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
      }

      .person-presenting-img {
        position: relative;
        max-width: 300px;
        height: auto;
        z-index: 2;
      }
    }

    .testimonials-title {
      font-size: 32px;
      font-weight: 700;
      color: #1e5189;
      line-height: 1.3;
    }

    .testimonial-card {
      height: 100%;
      padding: 8px;

      .text-orange {
        color: #ff9800;
        margin-left: 8px;
      }
    }
  }
}

// RTL Support
.dir-rtl {
  direction: rtl;
}
</style>
