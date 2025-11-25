<script setup>
import { computed, ref } from 'vue';
import { storeToRefs } from 'pinia';
import { useI18n } from 'vue-i18n';
import { Form } from '@formio/vue';

// import { useAuthStore } from '~/store/auth';
import { useFormStore } from '~/store/form';

// Import form example images
import demographicSurvey from '~/assets/images/examples/demographic-survey.png';
import calculationsGrid from '~/assets/images/examples/calculations-grid.png';
import postCourseSurvey from '~/assets/images/examples/post-course-survey.png';
import architectureForum from '~/assets/images/examples/architecture-forum.png';
import conditionalLogic from '~/assets/images/examples/conditional-logic.png';
import calculatedValues from '~/assets/images/examples/calculated-values.png';
import teamLunchOrder from '~/assets/images/examples/team-lunch-order.png';
import navigationButtons from '~/assets/images/examples/navigation-buttons.png';
import successStories from '~/assets/images/examples/success-stories.png';

// Import testimonial screenshots
import screenshot1 from '~/assets/images/testimonials/Leah-M-testimonial-image.png';
import screenshot2 from '~/assets/images/testimonials/Karl-M-testimonial-image.png';
import screenshot3 from '~/assets/images/testimonials/Emma-A-testimonial-image.png';

// Import example form JSONs
import demographicSurveyJson from '~/assets/example_form_json/1. toolkit_for_evaluation_and_design_post-course_online_survey__schema.json';
import calculationsGridJson from '~/assets/example_form_json/example_calculations_in_datagrid_schema.json';
import postCourseSurveyJson from '~/assets/example_form_json/1. toolkit_for_evaluation_and_design_post-course_online_survey__schema.json';
import architectureForumJson from '~/assets/example_form_json/chefs_architecture_forum_survey_schema.json';
import conditionalLogicJson from '~/assets/example_form_json/example_conditional_logic_schema.json';
import calculatedValuesJson from '~/assets/example_form_json/example_calculated_values_schema (1).json';
import teamLunchOrderJson from '~/assets/example_form_json/team_lunch_order_schema.json';
import navigationButtonsJson from '~/assets/example_form_json/example_navigation_buttons_schema.json';
import successStoriesJson from '~/assets/example_form_json/chefs_success_stories_schema.json';

const { locale } = useI18n({ useScope: 'global' });

// const authStore = useAuthStore();
const formStore = useFormStore();

// const { authenticated } = storeToRefs(authStore);
const { isRTL } = storeToRefs(formStore);

// Tech Docs URL
const techDocsUrl =
  'https://developer.gov.bc.ca/docs/default/component/chefs-techdocs/';

// Kudos Page URL
const kudosPageUrl =
  'https://citz-do.atlassian.net/wiki/spaces/CCP/pages/338722826/CHEFS+Kudos+Page';

// Determine CSTAR URL based on environment
const cstarUrl = computed(() => {
  const hostname = window.location.hostname;

  // Check if localhost, dev, or pr environment
  if (
    hostname === 'localhost' ||
    hostname.includes('dev') ||
    hostname.includes('-pr-')
  ) {
    return 'https://tenant-management-system-dev-frontend.apps.silver.devops.gov.bc.ca/tenants';
  }

  // For test and prod environments
  // TODO: Update prod URL when available
  return 'https://tenant-management-system-test-frontend.apps.silver.devops.gov.bc.ca/tenants';
});

// Form examples data
const formExamples = [
  {
    title: 'Example | Demographic Data Collection Survey',
    image: demographicSurvey,
    schema: demographicSurveyJson,
    fileName: 'demographic-survey.json',
  },
  {
    title: 'Example | Calculations in Data Grid',
    image: calculationsGrid,
    schema: calculationsGridJson,
    fileName: 'calculations-in-datagrid.json',
  },
  {
    title: 'Example | POST-COURSE SURVEY',
    image: postCourseSurvey,
    schema: postCourseSurveyJson,
    fileName: 'post-course-survey.json',
  },
  {
    title: 'Example | CHEFS Architecture Forum Survey',
    image: architectureForum,
    schema: architectureForumJson,
    fileName: 'architecture-forum-survey.json',
  },
  {
    title: 'Example | Conditional Logic',
    image: conditionalLogic,
    schema: conditionalLogicJson,
    fileName: 'conditional-logic.json',
  },
  {
    title: 'Example | Calculated Values',
    image: calculatedValues,
    schema: calculatedValuesJson,
    fileName: 'calculated-values.json',
  },
  {
    title: 'Example | Team Lunch Order',
    image: teamLunchOrder,
    schema: teamLunchOrderJson,
    fileName: 'team-lunch-order.json',
  },
  {
    title: 'Example | Navigation Buttons',
    image: navigationButtons,
    schema: navigationButtonsJson,
    fileName: 'navigation-buttons.json',
  },
  {
    title: 'Example | CHEFS Success Stories',
    image: successStories,
    schema: successStoriesJson,
    fileName: 'success-stories.json',
  },
];

// Modal state for form viewer
const showFormViewer = ref(false);
const selectedFormExample = ref(null);

// Method to open form viewer modal
const openFormViewer = (example) => {
  selectedFormExample.value = example;
  showFormViewer.value = true;
};

// Method to close form viewer modal
const closeFormViewer = () => {
  showFormViewer.value = false;
  selectedFormExample.value = null;
};

// Method to download form JSON
const downloadFormJSON = (example) => {
  const jsonString = JSON.stringify(example.schema, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = example.fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Method to open kudos page
const openKudosPage = () => {
  window.open(kudosPageUrl, '_blank');
};

// Formio form viewer options - readonly mode
const formViewerOptions = {
  readOnly: true,
  disableAlerts: false,
  noAlerts: false,
  builder: false,
};

// Formio form preview options - compact readonly mode for cards
// Testimonials data
const testimonials = [
  {
    rating: 4.5,
    label: 'Verified User',
    title: 'Great communication and collaboration',
    date: 'Reviewed in Victoria, BC, Canada on May 19, 2024',
    screenshot: screenshot1,
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
    screenshot: screenshot2,
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
    screenshot: screenshot3,
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
    <!-- Hero Section with Enterprise CHEFS and CSTAR -->
    <div class="enterprise-hero-wrapper">
      <v-container class="enterprise-hero-section py-8">
        <!-- Main Heading -->
        <v-row justify="center" class="mb-12">
          <v-col cols="12" class="text-center">
            <p class="hero-subtitle mb-2" :lang="locale">
              Want to work securely with your team, deliver forms faster, and
              collaborate across government?
            </p>
            <h1 class="enterprise-hero-title mb-8" :lang="locale">
              Introducing Enterprise CHEFS and CSTAR!
            </h1>
          </v-col>
        </v-row>

        <!-- Two Column Content -->
        <v-row class="mb-8">
          <!-- Left Column: Enterprise CHEFS -->
          <v-col cols="12" md="6" class="mb-8 mb-md-0">
            <div class="enterprise-card-content">
              <h2 class="enterprise-section-title mb-4" :lang="locale">
                Experience the new Enterprise CHEFS
              </h2>

              <p class="enterprise-description mb-4" :lang="locale">
                Enterprise CHEFS expands on the classic
                <router-link :to="{ name: 'FormCreate' }" class="text-link"
                  >CHEFS (Common Hosted Forms Service)</router-link
                >
                by working together with
                <a
                  :href="cstarUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-link"
                  >CSTAR — Connected Services, Team Access, and Roles</a
                >
                — to create a shared, collaborative workspace.
              </p>

              <p class="enterprise-description mb-6" :lang="locale">
                With Enterprise CHEFS, teams can securely share forms, assign
                roles, and manage projects within their organization's
                <strong>tenant</strong> — a dedicated workspace that keeps your
                projects and permissions organized.
              </p>

              <p class="enterprise-description mb-8" :lang="locale">
                Welcome to Enterprise CHEFS, where teams across government can
                collaborate safely and efficiently.
              </p>

              <v-btn
                color="primary"
                size="large"
                :to="{ name: 'FormCreate' }"
                class="go-to-chefs-btn"
                data-test="go-to-chefs-btn"
              >
                Go to CHEFS
                <v-icon end>mdi-arrow-right</v-icon>
              </v-btn>
            </div>
          </v-col>

          <!-- Right Column: CSTAR and Access Management -->
          <v-col cols="12" md="6">
            <div class="enterprise-card-content">
              <h2 class="enterprise-section-title mb-4" :lang="locale">
                CSTAR and Access Management
              </h2>

              <p class="enterprise-description mb-4" :lang="locale">
                Enterprise CHEFS works hand-in-hand with
                <a
                  :href="cstarUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-link"
                  >CSTAR</a
                >. CSTAR helps you manage who has access to your forms and
                guides users into <strong>tenants</strong>, assigning
                <strong>roles</strong>, and connecting
                <strong>services</strong>.
              </p>

              <p class="enterprise-description mb-6" :lang="locale">
                Access to CSTAR is managed by
                <strong
                  >administrators within your ministry or organization</strong
                >, ensuring permissions and memberships are securely controlled.
              </p>

              <p class="enterprise-description mb-8" :lang="locale">
                You can use CSTAR to review your current tenant memberships or
                request a new tenant if you're starting from scratch.
              </p>

              <v-btn
                variant="outlined"
                color="primary"
                size="large"
                class="go-to-cstar-btn"
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

        <!-- Alert Box -->
        <v-row justify="center" class="mb-8">
          <v-col cols="12" md="10">
            <v-alert
              type="info"
              variant="outlined"
              class="attention-alert"
              icon="mdi-information"
              closable
            >
              <template #title>
                <strong>ATTENTION BCeID USERS</strong>
              </template>
              <div class="alert-content-wrapper">
                <div class="alert-text">
                  To ensure your account can be found by your team, please log
                  in to CSTAR before using Enterprise CHEFS. This step allows
                  your team admin to locate and add you to a tenant or group,
                  making your account active and searchable in CSTAR.
                </div>
                <v-btn
                  size="small"
                  color="primary"
                  class="alert-btn"
                  :href="cstarUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Log in to CSTAR
                </v-btn>
              </div>
            </v-alert>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Getting Started Section -->
    <div class="getting-started-section-wrapper">
      <v-container class="getting-started-section py-16">
        <v-row align="center" class="mb-12">
          <v-col cols="12" md="6" class="text-section">
            <h2 class="getting-started-title mb-6" :lang="locale">
              New to CHEFS and not sure where to start?
            </h2>
            <p class="getting-started-description mb-0" :lang="locale">
              Start by exploring our
              <a
                :href="techDocsUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="doc-link"
                >CHEFS Technical Documentation</a
              >
              (Tech Docs) for setup guidance, or browse the example forms below
              — each one was created by real CHEFS users.
            </p>
          </v-col>
          <v-col cols="12" md="6" class="illustration-section">
            <div class="person-computer-wrapper">
              <img
                src="/images/person-at-computer-nb.png"
                alt="Person working at computer"
                class="person-computer-img"
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
            <v-card
              class="example-card"
              elevation="2"
              role="link"
              tabindex="0"
              @click="openFormViewer(example)"
              @keyup.enter="openFormViewer(example)"
            >
              <div class="example-image-wrapper">
                <v-img
                  v-if="example.image"
                  :src="example.image"
                  :alt="example.title"
                  height="300"
                  cover
                  style="cursor: pointer"
                  @click="openFormViewer(example)"
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
                  style="height: 300px; cursor: pointer"
                  @click="openFormViewer(example)"
                >
                  <v-icon size="64" color="grey-darken-1"
                    >mdi-file-document-outline</v-icon
                  >
                </div>
                <div class="example-overlay">
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-btn
                        size="small"
                        color="primary"
                        class="mr-2"
                        v-bind="props"
                        @click="openFormViewer(example)"
                      >
                        <v-icon start>mdi-eye</v-icon>
                        View Form
                      </v-btn>
                    </template>
                    <span>View form in fullscreen</span>
                  </v-tooltip>
                  <v-tooltip location="top">
                    <template #activator="{ props }">
                      <v-btn
                        size="small"
                        variant="outlined"
                        color="primary"
                        v-bind="props"
                        @click="downloadFormJSON(example)"
                      >
                        <v-icon start>mdi-download</v-icon>
                        Download
                      </v-btn>
                    </template>
                    <span>Download form as JSON</span>
                  </v-tooltip>
                </div>
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
          <v-card
            class="testimonial-card"
            elevation="2"
            role="link"
            tabindex="0"
            @click="openKudosPage"
            @keyup.enter="openKudosPage"
          >
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
              Get Started Using Enterprise CHEFS
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

    <!--    &lt;!&ndash; Footer Acknowledgment Section &ndash;&gt;
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
    </div>-->

    <!-- Form Viewer Modal -->
    <v-dialog
      v-model="showFormViewer"
      max-width="1200px"
      class="form-viewer-dialog"
    >
      <v-card v-if="selectedFormExample" class="form-viewer-card">
        <!-- Modal Header -->
        <v-card-title
          class="bg-primary text-white d-flex justify-space-between align-center"
        >
          <span>{{ selectedFormExample.title }}</span>
          <div>
            <v-btn
              size="small"
              variant="text"
              color="white"
              icon="mdi-download"
              title="Download JSON"
              class="mr-2"
              @click="downloadFormJSON(selectedFormExample)"
            />
            <v-btn
              size="small"
              variant="text"
              color="white"
              icon="mdi-close"
              title="Close"
              @click="closeFormViewer"
            />
          </div>
        </v-card-title>

        <!-- Modal Content -->
        <v-card-text class="form-viewer-content pa-0">
          <!-- Form rendered using Formio Vue component -->
          <div id="formContainer" class="form-container">
            <Form
              v-if="selectedFormExample"
              :form="selectedFormExample.schema"
              :options="formViewerOptions"
              @submit="() => {}"
            />
          </div>
        </v-card-text>

        <!-- Modal Footer with Actions -->
        <v-card-actions class="form-viewer-footer">
          <v-spacer />
          <v-btn
            color="primary"
            variant="outlined"
            @click="downloadFormJSON(selectedFormExample)"
          >
            <v-icon start>mdi-download</v-icon>
            Download JSON
          </v-btn>
          <v-btn color="primary" @click="closeFormViewer"> Close </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<style lang="scss" scoped>
.landing-layout {
  background-color: #ffffff;

  .enterprise-hero-wrapper {
    background: linear-gradient(135deg, #f5f9fc 0%, #ffffff 100%);
    border-radius: 8px;
    margin: 32px auto;
    max-width: 1200px;
  }

  .enterprise-hero-section {
    max-width: 1200px;

    .hero-subtitle {
      font-size: 16px;
      font-weight: 400;
      color: #2d2d2d;
      line-height: 1.5;
    }

    .enterprise-hero-title {
      font-size: 48px;
      font-weight: 700;
      color: #003366;
      line-height: 1.3;
    }

    .enterprise-card-content {
      padding: 0 16px;

      .enterprise-section-title {
        font-size: 20px;
        font-weight: 700;
        color: #003366;
        line-height: 1.3;
      }

      .enterprise-description {
        font-size: 15px;
        font-weight: 400;
        color: #2d2d2d;
        line-height: 1.6;

        strong {
          font-weight: 600;
        }

        a.text-link {
          color: #003366;
          text-decoration: none;
          border-bottom: 1px solid #003366;

          &:hover {
            text-decoration: underline;
          }
        }
      }

      .go-to-chefs-btn {
        background-color: #003366;
        color: white;
        padding: 12px 32px;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }

      .go-to-cstar-btn {
        border: 2px solid #003366;
        color: #003366;
        padding: 12px 32px;
        font-weight: 600;
        text-transform: none;
        letter-spacing: 0;
      }
    }

    .attention-alert {
      border: 2px solid #e3f2fd !important;
      background-color: #f5f9fc !important;
      border-radius: 8px;
      padding: 16px;

      ::v-deep(.v-alert__content) {
        font-size: 15px;
        color: #2d2d2d;
        line-height: 1.6;
      }

      ::v-deep(.v-alert__title) {
        color: #003366;
        font-weight: 700;
        margin-bottom: 12px;
      }

      ::v-deep(.v-alert__icon) {
        color: #1976d2;
      }

      .alert-content-wrapper {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 16px;

        .alert-text {
          flex: 1;
          font-size: 15px;
          color: #2d2d2d;
          line-height: 1.6;
        }

        .alert-btn {
          flex-shrink: 0;
          white-space: nowrap;
          background-color: #003366 !important;
          color: white !important;
          padding: 8px 16px !important;
        }
      }
    }
  }

  .getting-started-section-wrapper {
    background-color: #f1f8fe;
    width: 100%;
  }

  .getting-started-section {
    max-width: 1200px;
    padding-top: 48px !important;
    padding-bottom: 48px !important;

    .text-section {
      .getting-started-title {
        font-size: 24px;
        font-weight: 700;
        color: #1e5189;
        line-height: 1.3;
      }

      .getting-started-description {
        font-size: 15px;
        font-weight: 400;
        color: #2d2d2d;
        line-height: 1.6;
        word-break: break-word;

        a.doc-link {
          color: #003366;
          text-decoration: none;
          border-bottom: 1px solid #003366;
          font-weight: 500;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .illustration-section {
      position: relative;
      display: flex;
      justify-content: center;
      align-items: center;

      .person-computer-wrapper {
        position: relative;
        width: 100%;
        height: 300px;
        display: flex;
        justify-content: center;
        align-items: center;

        .person-computer-img {
          position: relative;
          max-width: 100%;
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
      transition: transform 0.3s ease, box-shadow 0.3s ease,
        border-color 0.3s ease;
      position: relative;
      cursor: pointer;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        border-color: #003366;

        .example-overlay {
          opacity: 1;
          visibility: visible;
        }

        &::after {
          opacity: 1;
          visibility: visible;
        }
      }

      &:focus {
        outline: 2px solid #003366;
        outline-offset: 2px;
      }

      &::after {
        content: 'Explore Example Form →';
        position: absolute;
        top: 12px;
        right: 12px;
        background-color: #003366;
        color: white;
        padding: 8px 16px;
        border-radius: 4px;
        font-size: 13px;
        font-weight: 600;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        white-space: nowrap;
        z-index: 15;
      }

      .example-image-wrapper {
        position: relative;
        overflow: hidden;
        height: 300px;

        .example-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.6);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
          z-index: 10;

          .v-btn {
            background-color: white !important;
            color: #003366 !important;
          }
        }
      }

      .form-title-section {
        padding: 12px 8px !important;
        background-color: white;
        border-top: 1px solid #e0e0e0;
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
      cursor: pointer;
      transition: transform 0.3s ease, box-shadow 0.3s ease,
        border-color 0.3s ease;
      position: relative;
      border: 2px solid transparent;

      &:hover {
        transform: translateY(-8px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        border-color: #003366;

        &::after {
          opacity: 1;
          visibility: visible;
        }
      }

      &:focus {
        outline: 2px solid #003366;
        outline-offset: 2px;
      }

      &::after {
        content: 'View on Kudos Page →';
        position: absolute;
        top: 8px;
        right: 8px;
        background-color: #003366;
        color: white;
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 600;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
        white-space: nowrap;
        z-index: 5;
      }

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

// Form Viewer Modal Styles
.form-viewer-dialog {
  :deep(.v-overlay__content) {
    max-height: 90vh;
    border-radius: 8px;
  }
}

.form-viewer-card {
  display: flex;
  flex-direction: column;
  max-height: 90vh;

  .form-viewer-content {
    flex: 1;
    overflow-y: auto;
    background-color: #f5f5f5;
    min-height: 400px;

    .form-container {
      background-color: white;
      padding: 24px;
      margin: 16px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    }
  }

  .form-viewer-footer {
    border-top: 1px solid #e0e0e0;
    padding: 16px;
  }

  .bg-primary {
    background-color: #003366 !important;
  }

  .text-white {
    color: white !important;
  }
}

// RTL Support
.dir-rtl {
  direction: rtl;
}
</style>
