<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';

// import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

const { locale } = useI18n({ useScope: 'global' });

// const authStore = useAuthStore();
const formStore = useFormStore();

// const { authenticated } = storeToRefs(authStore);
const { isRTL } = storeToRefs(formStore);

// Determine CSTAR URL based on environment
const cstarUrl = computed(() => {
  const hostname = window.location.hostname;

  // Check if localhost, dev, or pr environment
  if (
    hostname === 'localhost' ||
    hostname.includes('dev') ||
    hostname.includes('-pr-')
  ) {
    return 'https://tenant-management-system-pr-202-frontend.apps.silver.devops.gov.bc.ca/tenants';
  }

  // For test and prod environments
  // TODO: Update prod URL when available
  return 'https://tenant-management-system-test-frontend.apps.silver.devops.gov.bc.ca/tenants';
});

// Form examples data
const formExamples = [
  {
    title: 'Demographic Data Collection Survey',
    image: '/app/src/assets/images/demographic-survey.png',
  },
  {
    title: 'Example | Calculations in Data Grid',
    image: '/app/src/assets/images/calculations-grid.png',
  },
  {
    title: 'POST-COURSE SURVEY',
    image: '/app/src/assets/images/post-course-survey.png',
  },
  {
    title: 'CHEFS Architecture Forum Survey',
    image: '/app/src/assets/images/architecture-forum.png',
  },
  {
    title: 'Example | Conditional Logic',
    image: '/app/src/assets/images/conditional-logic.png',
  },
  {
    title: 'Example | Calculated Values',
    image: '/app/src/assets/images/calculated-values.png',
  },
  {
    title: 'Team Lunch Order',
    image: '/app/src/assets/images/team-lunch-order.png',
  },
  {
    title: 'Example | Navigation Buttons',
    image: '/app/src/assets/images/navigation-buttons.png',
  },
  {
    title: 'CHEFS Success Stories',
    image: '/app/src/assets/images/success-stories.png',
  },
];

// Testimonials data
const testimonials = [
  {
    rating: 4.5,
    label: 'Verified User',
    title: 'Great communication and collaboration',
    date: 'Reviewed in Victoria, BC, Canada on May 19, 2024',
    screenshot: '/app/src/assets/images/screenshot-1.png',
    content:
      '"The Polysomnography team would like to share how appreciative we are of you taking our feedback into consideration during your sprint planning, we are very excited for the opportunity to contribute to improving CHEFS for end users. The collaboration and communication amongst the teams is greatly appreciated by our client!"',
    reviewer: 'Leah Macdonald',
    role: 'External User, CGI',
    initials: 'LM',
  },
  {
    rating: 5,
    label: 'Verified User',
    title: 'Accessible yet powerful',
    date: 'Reviewed in Victoria, BC, Canada on Jun 24, 2023',
    screenshot: '/app/src/assets/images/screenshot-2.png',
    content:
      '"CHEFS is a very straightforward for non-coders. You can unlock more options if you want, but the basic functionality is very easy to use for the non-super-tech/code-savvy people."',
    reviewer: 'Karl Martinson',
    role: 'Senior Emergency Planning Analyst, Climate Resilience, Competitiveness and Reconciliation Division, Agriculture and Food',
    initials: 'KM',
  },
  {
    rating: 4.5,
    label: 'Verified User',
    title: 'Clear documentation and helpful support',
    date: 'Reviewed in Victoria, BC, Canada on May 6, 2025',
    screenshot: '/app/src/assets/images/screenshot-3.png',
    content:
      '"The CHEFS docs are clear and well-structured so understand how to build forms and connect to the add a shout out to the CHEFS Teams channel for timely responses to my remaining questions."',
    reviewer: 'Emma Armitage',
    role: 'GIS Geospatial Analyst, Natural Resource Information and Digital Services',
    initials: 'EA',
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
              :href="cstarUrl"
              target="_blank"
              rel="noopener noreferrer"
            >
              Go To CSTAR
              <v-icon end>mdi-arrow-right</v-icon>
            </v-btn>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <!-- Examples Section -->
    <div class="examples-section-wrapper">
      <v-container class="examples-section py-16">
        <v-row>
          <v-col cols="12" md="6" class="text-section">
            <h2 class="examples-title mb-8" :lang="locale">
              Not sure where to start? Below are examples of forms created by
              our users.
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
                v-if="example.image"
                :src="example.image"
                :alt="example.title"
                height="300"
                cover
              >
                <template #error>
                  <div
                    class="d-flex align-center justify-center fill-height bg-grey-lighten-3"
                  >
                    <v-icon size="64" color="grey-darken-1"
                      >mdi-file-document-outline</v-icon
                    >
                  </div>
                </template>
              </v-img>
              <div
                v-else
                class="d-flex align-center justify-center bg-grey-lighten-3"
                style="height: 300px"
              >
                <v-icon size="64" color="grey-darken-1"
                  >mdi-file-document-outline</v-icon
                >
              </div>
              <v-card-text class="text-center">
                <p class="text-subtitle-2 font-weight-medium">
                  {{ example.title }}
                </p>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </div>

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
            <v-card-text class="pa-6">
              <h3 class="testimonial-card-title mb-3">CHEFS User</h3>
              <div class="d-flex align-center mb-4">
                <v-rating
                  :model-value="testimonial.rating"
                  color="orange"
                  density="compact"
                  size="small"
                  readonly
                  class="mr-2"
                ></v-rating>
                <span class="verified-label">{{ testimonial.label }}</span>
              </div>

              <h4 class="review-title mb-2">{{ testimonial.title }}</h4>
              <p class="review-date mb-4">{{ testimonial.date }}</p>

              <v-img
                v-if="testimonial.screenshot"
                :src="testimonial.screenshot"
                class="review-screenshot mb-4"
                height="180"
                cover
              >
                <template #error>
                  <div class="review-screenshot-placeholder"></div>
                </template>
              </v-img>
              <div v-else class="review-screenshot-placeholder mb-4"></div>

              <p class="review-content mb-4">{{ testimonial.content }}</p>

              <div class="d-flex align-center mb-4">
                <v-avatar size="48" color="grey-lighten-2" class="mr-3">
                  <span class="text-body-2 font-weight-bold">{{
                    testimonial.initials
                  }}</span>
                </v-avatar>
                <div>
                  <p class="reviewer-name mb-0">{{ testimonial.reviewer }}</p>
                  <p class="reviewer-role text-caption mb-0">
                    {{ testimonial.role }}
                  </p>
                </div>
              </div>

              <div class="d-flex align-center">
                <v-btn
                  variant="outlined"
                  size="small"
                  class="helpful-btn mr-2"
                  color="grey-darken-2"
                >
                  Helpful
                </v-btn>
                <v-btn
                  variant="outlined"
                  size="small"
                  class="support-btn mr-2"
                  color="grey-darken-2"
                >
                  Great Support
                </v-btn>
                <v-btn
                  icon=""
                  size="small"
                  variant="text"
                  color="grey-darken-2"
                >
                  <v-icon size="20">mdi-share-variant</v-icon>
                </v-btn>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Final CTA Section -->
    <div class="final-cta-wrapper">
      <v-container class="final-cta-section py-16">
        <v-row justify="center">
          <v-col cols="12" md="8" class="text-center">
            <h2 class="final-cta-title mb-4" :lang="locale">
              Get Started Using CHEFS
            </h2>
            <p class="final-cta-description mb-6" :lang="locale">
              Create online forms to collect information from your clients and
              improve your workflows.
            </p>
            <v-btn
              color="primary"
              size="large"
              :to="{ name: 'Login' }"
              class="login-btn"
            >
              Login to Get Started
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Footer Acknowledgment Section -->
    <div class="footer-acknowledgment-wrapper">
      <v-container>
        <v-row>
          <v-col cols="12">
            <p class="footer-acknowledgment" :lang="locale">
              The B.C. Public Service acknowledges the territories of First
              Nations around B.C. and is grateful to carry out our work on these
              lands. We acknowledge the rights, interests, priorities, and
              concerns of all Indigenous Peoples - First Nations, Métis, and
              Inuit - respecting and acknowledging their distinct cultures,
              histories, rights, laws, and governments.
            </p>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Footer Section -->
    <v-footer class="footer-section">
      <v-container class="footer-content">
        <v-row>
          <v-col cols="12" md="6">
            <div class="footer-logo-section">
              <img
                src="/images/bc-logo.png"
                alt="British Columbia"
                class="footer-logo mb-4"
              />
              <p class="footer-text" :lang="locale">
                We can help in over 220 languages and through other accessible
                options.
                <a href="tel:" class="footer-link">Call</a>,
                <a href="mailto:" class="footer-link">email</a> or
                <a href="#" class="footer-link">text us</a>, or
                <a href="#" class="footer-link">find a service centre</a>.
              </p>
            </div>
          </v-col>

          <v-col cols="12" md="3">
            <ul class="footer-links">
              <li><a href="#" class="footer-link">Home</a></li>
              <li><a href="#" class="footer-link">About gov.bc.ca</a></li>
              <li><a href="#" class="footer-link">Disclaimer</a></li>
              <li><a href="#" class="footer-link">Privacy</a></li>
            </ul>
          </v-col>

          <v-col cols="12" md="3">
            <ul class="footer-links">
              <li><a href="#" class="footer-link">Accessibility</a></li>
              <li><a href="#" class="footer-link">Copyright</a></li>
              <li><a href="#" class="footer-link">Contact Us</a></li>
            </ul>
          </v-col>
        </v-row>

        <v-row class="mt-8">
          <v-col cols="12">
            <p class="footer-copyright" :lang="locale">
              © 2024 Government of British Columbia.
            </p>
          </v-col>
        </v-row>
      </v-container>
    </v-footer>
  </div>
</template>

<style lang="scss" scoped>
.landing-layout {
  background-color: #ffffff;

  .hero-section {
    max-width: 1200px;
    padding-top: 60px !important;
    padding-bottom: 40px !important;

    .hero-content {
      max-width: 600px;

      .online-builder-tag {
        display: inline-block;
        color: #f8bb47;
        font-size: 20px;
        font-weight: 400;
        letter-spacing: 0.5px;
        text-transform: uppercase;
      }

      .hero-title {
        font-size: 44px;
        font-weight: 700;
        color: #2d2d2d;
        line-height: 1.2;
      }

      .hero-description {
        font-size: 18px;
        font-weight: 400;
        color: #2d2d2d;
        line-height: 1.5;
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
  }

  .multi-tenancy-section {
    max-width: 1200px;
    padding-top: 24px !important;
    padding-bottom: 48px !important;

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
      padding-left: 24px;
      max-width: 650px;
      .section-title {
        font-size: 26px;
        font-weight: 600;
        color: #5a5a5a;
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
        border: 1px solid #5a5a5a;
        color: #2d2d2d;
        font-weight: 500;
        text-transform: none;
        letter-spacing: 0;
        font-size: 14px;
      }
    }
  }

  .examples-section-wrapper {
    background-color: #f1f8fe;
    width: 100%;
  }

  .examples-section {
    max-width: 1200px;
    padding-top: 48px !important;
    padding-bottom: 48px !important;

    .text-section {
      .examples-title {
        font-size: 36px;
        font-weight: 700;
        color: #1e5189;
        line-height: 1.3;
        max-width: 480px;
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
        height: 350px;
        display: flex;
        justify-content: center;
        align-items: center;

        .organic-shape-beige {
          position: absolute;
          width: 400px;
          height: 400px;
          background-color: #fef1d8;
          border-radius: 50% 40% 60% 40%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 1;
        }

        .person-laptop-img {
          position: relative;
          max-width: 300px;
          height: auto;
          z-index: 2;
          margin: 0 auto;
          display: block;
        }

        .placeholder-illustration {
          position: relative;
          z-index: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
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

      .placeholder-illustration {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
        height: 100%;
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
      border-radius: 8px;

      .testimonial-card-title {
        font-size: 18px;
        font-weight: 700;
        color: #003366;
      }

      .verified-label {
        font-size: 12px;
        color: #ff9800;
        font-weight: 500;
      }

      .review-title {
        font-size: 16px;
        font-weight: 700;
        color: #2d2d2d;
        line-height: 1.3;
      }

      .review-date {
        font-size: 12px;
        color: #666666;
      }

      .review-screenshot {
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }

      .review-screenshot-placeholder {
        height: 180px;
        background-color: #f5f5f5;
        border-radius: 4px;
        border: 1px solid #e0e0e0;
      }

      .review-content {
        font-size: 14px;
        color: #2d2d2d;
        line-height: 1.6;
      }

      .reviewer-name {
        font-size: 14px;
        font-weight: 600;
        color: #2d2d2d;
      }

      .reviewer-role {
        font-size: 12px;
        color: #666666;
      }

      .helpful-btn,
      .support-btn {
        text-transform: none;
        font-size: 12px;
        border-color: #d0d0d0;
      }
    }
  }

  .final-cta-wrapper {
    background-color: #f1f8fe;
    width: 100%;
  }

  .final-cta-section {
    max-width: 1200px;

    .final-cta-title {
      font-size: 32px;
      font-weight: 700;
      color: #2d2d2d;
      line-height: 1.3;
    }

    .final-cta-description {
      font-size: 16px;
      font-weight: 400;
      color: #2d2d2d;
      line-height: 1.6;
    }

    .login-btn {
      background-color: #003366;
      color: white;
      padding: 12px 32px;
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0;
    }
  }

  .footer-acknowledgment-wrapper {
    background-color: #252423;
    border-bottom: 4px solid #fbd389;
    border-top: 4px solid #fbd389;
    width: 100%;
    margin: 0;
    padding: 0;

    .footer-acknowledgment {
      font-size: 14px;
      line-height: 21px;
      color: #ffffff;
      padding: 32px 0;
      margin: 0;
    }
  }

  .footer-section {
    background-color: #ffffff !important;
    color: #2d2d2d;
    padding: 0 !important;
    border: none !important;

    .footer-content {
      padding-top: 32px;
      padding-bottom: 16px;
    }

    .footer-logo-section {
      .footer-logo {
        max-width: 200px;
        height: auto;

        .footer-logo-text {
          font-size: 18px;
          font-weight: 700;
          color: #2d2d2d;
        }
      }

      .footer-text {
        font-size: 14px;
        line-height: 1.6;
        color: #2d2d2d;
      }
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;

      li {
        margin-bottom: 12px;
      }
    }

    .footer-link {
      color: #2d2d2d;
      text-decoration: underline;
      font-size: 14px;

      &:hover {
        text-decoration: none;
      }
    }

    .footer-copyright {
      font-size: 14px;
      color: #2d2d2d;
      margin: 32px 0 0 0;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }
  }
}

// RTL Support
.dir-rtl {
  direction: rtl;
}
</style>
