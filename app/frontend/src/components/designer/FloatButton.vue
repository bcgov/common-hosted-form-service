<script>
import { mapState } from 'pinia';
import { i18n } from '~/internationalization';

import { useFormStore } from '~/store/form';

export default {
  props: {
    formId: {
      type: String,
      default: null,
    },
    draftId: {
      type: String,
      default: null,
    },
    saving: {
      type: Boolean,
      default: false,
    },
    undoEnabled: {
      type: Boolean,
      default: false,
    },
    redoEnabled: {
      type: Boolean,
      default: false,
    },
    saved: {
      type: Boolean,
      default: false,
    },
    isFormSaved: Boolean,
    canSave: Boolean,
    savedStatus: {
      type: String,
      default: null,
    },
    placement: {
      type: String,
      default: 'bottom-right',
    },
    fabItemsGap: {
      type: String,
      default: '13px',
    },
    size: {
      type: String,
      default: 'medium',
    },
    fabZIndex: {
      type: Number,
      default: 1000,
    },
    positionOffset: {
      type: Object,
      validator: function (value) {
        // The value must match one of these strings
        return ['top', 'bottom', 'right', 'left'].includes(
          ...Object.keys(value)
        );
      },
      default: () => {
        return { bottom: true, right: true };
      },
    },
  },
  emits: ['undo', 'redo', 'save'],
  data() {
    return {
      fabItemsDirection: 'column-reverse',
      isFABActionsOpen: true,
      fabItemsPosition: {},
      fabItemsSize: 36,
      fabItemsIconsSize: 31,

      //base fab item variable start
      baseFABItemName: i18n.t('trans.floatButton.collapse'),
      baseIconName: 'mdi:mdi-close',
      baseIconColor: '#ffffff', //end

      // fab items icons variables start
      fabItemsColor: '#1A5A96',
      fabItemsInvertedColor: '#ffffff',
      disabledInvertedFabItemsColor: '#ffffff',
      disabledFabItemsColor: '#707070C1', // end

      savedMsg: i18n.t('trans.floatButton.save'),
      scrollIconName: 'mdi:mdi-arrow-down',
      scrollName: i18n.t('trans.floatButton.bottom'),
    };
  },
  computed: {
    ...mapState(useFormStore, ['lang', 'isRTL']),
    computedStyles() {
      let baseStyles = {
        display: 'flex',
        width: '92px',
        flexDirection: this.fabItemsDirection,
        gap: this.fabItemsGap,
        zIndex: this.fabZIndex,
        position: 'fixed',
        right: '0',
        bottom: '20px',
      };

      let conditionalStyles = {};
      let fabItemsPosition = { ...this.fabItemsPosition };

      switch (this.$i18n.locale) {
        case 'uk':
          baseStyles.width = '111px';
          fabItemsPosition.right = '-.3vw';
          break;
      }

      return [baseStyles, fabItemsPosition, conditionalStyles];
    },
  },
  watch: {
    size() {
      this.setSizes();
    },
    savedStatus(value) {
      switch (value) {
        case 'Saved':
          this.savedMsg = i18n.t('trans.floatButton.saved');
          break;
        case 'Save':
          this.savedMsg = i18n.t('trans.floatButton.save');
          break;
        case 'Saving':
          this.savedMsg = i18n.t('trans.floatButton.saving');
          break;
        case 'Not Saved':
          this.savedMsg = i18n.t('trans.floatButton.notSaved');
          break;
      }
    },
    lang() {
      this.scrollName = i18n.t('trans.floatButton.bottom');

      if (this.isFABActionsOpen) {
        this.baseFABItemName = i18n.t('trans.floatButton.actions');
      } else {
        this.baseFABItemName = i18n.t('trans.floatButton.collapse');
      }

      if (this.savedStatus === 'Saved') {
        this.savedMsg = i18n.t('trans.floatButton.saved');
      } else if (this.savedStatus === 'Save') {
        this.savedMsg = i18n.t('trans.floatButton.save');
      } else if (this.savedStatus === 'Saving') {
        this.savedMsg = i18n.t('trans.floatButton.saving');
      } else if (this.savedStatus === 'Not Saved') {
        this.savedMsg = i18n.t('trans.floatButton.notSaved');
      }
    },
  },
  created() {
    window.addEventListener('scroll', this.handleScroll);
  },
  mounted() {
    window.scrollTo(0, 0);
    this.setPosition();
    this.setSizes();
  },
  unmounted() {
    window.removeEventListener('scroll', this.handleScroll);
  },
  methods: {
    toParent(name) {
      this.$emit(name);
    },
    onOpenFABActionItems() {
      if (this.isFABActionsOpen) {
        this.baseIconName = 'mdi:mdi-menu';
        this.isFABActionsOpen = false;
        this.baseFABItemName = i18n.t('trans.floatButton.actions');
      } else {
        this.baseIconName = 'mdi:mdi-close';
        this.isFABActionsOpen = true;
        this.baseFABItemName = i18n.t('trans.floatButton.collapse');
      }
    },

    gotoPreview() {
      let route = this.$router.resolve({
        name: 'FormPreview',
        query: { f: this.formId, d: this.draftId },
      });
      window.open(route.href);
    },
    setSizes() {
      switch (this.size) {
        case 'x-large':
          this.fabItemsSize = 52;
          this.fabItemsIconsSize = 47;
          break;
        case 'large':
          this.fabItemsSize = 44;
          this.fabItemsIconsSize = 39;
          break;
        case 'medium':
          this.fabItemsSize = 36;
          this.fabItemsIconsSize = 31;
          break;
        case 'small':
          this.fabItemsSize = 28;
          this.fabItemsIconsSize = 18;
          break;
        default:
          this.fabItemsSize = 36;
          this.fabItemsIconsSize = 31;
      }
    },

    //checks if FAB is placed at the top right or top left of the screen
    topLeftRight() {
      if (this.placement === 'top-right' || this.placement === 'top-left') {
        this.fabItemsDirection = 'column';
      }
    },

    //checks if FAB is placed at the bottom right or bottom left of the screen
    bottomLeftRight() {
      if (
        this.placement === 'bottom-right' ||
        this.placement === 'bottom-left'
      ) {
        this.fabItemsDirection = 'column-reverse';
      }
    },

    // set where on the screen FAB will be displayed
    setPosition() {
      this.fabItemsPosition = {};

      this.bottomLeftRight();
      this.topLeftRight();

      if (this.positionOffset && Object.keys(this.positionOffset).length > 0) {
        Object.assign(this.fabItemsPosition, this.positionOffset);
        return;
      }
      switch (this.placement) {
        case 'bottom-right':
          this.fabItemsPosition.right = '-.5vw';
          this.fabItemsPosition.bottom = '7vh';
          break;
        case 'bottom-left':
          this.fabItemsPosition.left = '5vw';
          this.fabItemsPosition.bottom = '4vh';
          break;
        case 'top-left':
          this.fabItemsPosition.left = '5vw';
          this.fabItemsPosition.top = '4vh';
          break;
        case 'top-right':
          this.fabItemsPosition.right = '1vw';
          this.fabItemsPosition.top = '8vh';
          break;
        default:
          this.fabItemsPosition.right = '5vw';
          this.fabItemsPosition.bottom = '4vh';
      }
    },

    // callback function for window scroll event
    handleScroll() {
      if (window.scrollY === 0) {
        this.scrollIconName = 'mdi:mdi-arrow-down';
        this.scrollName = i18n.t('trans.floatButton.bottom');
      } else if (
        window.pageYOffset + window.innerHeight >=
        document.documentElement.scrollHeight - 50
      ) {
        this.scrollIconName = 'mdi:mdi-arrow-up';
        this.scrollName = i18n.t('trans.floatButton.top');
      }
    },

    // function for click scroll event
    onHandleScroll() {
      if (window.scrollY === 0) {
        this.bottomScroll();
      } else if (
        this.scrollName === i18n.t('trans.floatButton.bottom') &&
        window.scrollY > 0
      ) {
        this.bottomScroll();
      } else if (
        this.scrollName === i18n.t('trans.floatButton.top') &&
        window.scrollY > 0
      ) {
        this.topScroll();
      } else {
        this.topScroll();
      }
    },
    topScroll() {
      window.scrollTo(0, 0);
      this.scrollIconName = 'mdi:mdi-arrow-down';
      this.scrollName = i18n.t('trans.floatButton.bottom');
    },
    bottomScroll() {
      window.scrollTo({
        left: 0,
        top: document.body.scrollHeight,
        behavior: 'smooth',
      });
      this.scrollIconName = 'mdi:mdi-arrow-up';
      this.scrollName = i18n.t('trans.floatButton.top');
    },
  },
};
</script>

<template>
  <div :class="{ 'dir-rtl': isRTL }" :style="computedStyles">
    <div class="fabAction" :lang="lang" @click="onOpenFABActionItems">
      <div class="text" :lang="lang" v-text="baseFABItemName" />
      <v-btn class="fabItemsInverColor" :size="fabItemsSize">
        <v-icon
          :color="baseIconColor"
          :size="fabItemsIconsSize"
          :icon="baseIconName"
        >
        </v-icon>
      </v-btn>
    </div>
    <div
      v-if="isFABActionsOpen"
      :style="[
        { display: 'flex', flexDirection: fabItemsDirection, gap: fabItemsGap },
      ]"
    >
      <router-link
        v-slot="{ navigate }"
        :to="{
          name: 'PublishForm',
          query: { f: formId, fd: true, d: draftId },
        }"
        custom
      >
        <div
          ref="publishRouterLink"
          role="link"
          data-cy="publishRouterLink"
          :class="{ fabAction: true, 'disabled-router': !formId }"
        >
          <div
            class="text"
            :lang="lang"
            v-text="$t('trans.floatButton.publish')"
          />
          <v-btn
            class="fabItemsInverColor"
            :size="fabItemsSize"
            @click="navigate"
          >
            <v-icon
              :color="
                saved ? fabItemsInvertedColor : disabledInvertedFabItemsColor
              "
              :size="fabItemsIconsSize"
              icon="mdi:mdi-file-upload"
            >
            </v-icon>
          </v-btn>
        </div>
      </router-link>
      <router-link
        v-slot="{ navigate }"
        :to="{
          name: 'PublishForm',
          query: { f: formId, fd: false, d: draftId },
        }"
        custom
      >
        <div
          ref="settingsRouterLink"
          role="link"
          data-cy="settingsRouterLink"
          :class="{ fabAction: true, 'disabled-router': !formId }"
        >
          <div
            class="text"
            :lang="lang"
            v-text="$t('trans.floatButton.manage')"
          />
          <v-btn
            class="fabItemsInverColor"
            :size="fabItemsSize"
            @click="navigate"
          >
            <v-icon
              :color="
                saved ? fabItemsInvertedColor : disabledInvertedFabItemsColor
              "
              :size="fabItemsIconsSize"
              icon="mdi:mdi-cog"
            >
            </v-icon>
          </v-btn>
        </div>
      </router-link>

      <div
        ref="redoButton"
        class="fabAction"
        data-cy="redoButton"
        :class="{ 'disabled-router': !redoEnabled }"
      >
        <div class="text" :lang="lang" v-text="$t('trans.floatButton.redo')" />
        <v-btn class="fabItems" :size="fabItemsSize" @click="toParent('redo')">
          <v-icon
            :color="redoEnabled ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-redo"
          >
          </v-icon>
        </v-btn>
      </div>
      <div
        ref="undoButton"
        class="fabAction"
        data-cy="undoButton"
        :class="{ 'disabled-router': !undoEnabled }"
      >
        <div class="text" :lang="lang" v-text="$t('trans.floatButton.undo')" />
        <v-btn class="fabItems" :size="fabItemsSize" @click="toParent('undo')">
          <v-icon
            :color="undoEnabled ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-undo"
          >
          </v-icon>
        </v-btn>
      </div>
      <div
        ref="previewRouterLink"
        class="fabAction"
        :class="{ 'disabled-router': !formId || !draftId }"
        @click="gotoPreview"
      >
        <div
          class="text"
          :lang="lang"
          v-text="$t('trans.floatButton.preview')"
        />
        <v-btn class="fabItems" :size="fabItemsSize">
          <v-icon
            :color="formId ? fabItemsColor : disabledFabItemsColor"
            :size="fabItemsIconsSize"
            icon="mdi:mdi-eye"
          >
          </v-icon>
        </v-btn>
      </div>
      <div
        ref="saveButton"
        class="fabAction"
        data-cy="saveButton"
        :class="{ 'disabled-router': isFormSaved && !canSave }"
      >
        <div class="text" :lang="lang">{{ savedMsg }}</div>
        <v-btn
          class="fabItems"
          :size="fabItemsSize"
          @click="canSave ? toParent('save') : null"
        >
          <v-icon
            v-if="!saving"
            :color="
              !isFormSaved && canSave ? fabItemsColor : disabledFabItemsColor
            "
            :size="fabItemsIconsSize"
            dark
            icon="mdi:mdi-content-save"
          >
          </v-icon>

          <v-progress-circular
            v-if="saving"
            indeterminate
            color="#1A5A96"
            size="25"
          ></v-progress-circular>
        </v-btn>
      </div>
      <div class="fabAction">
        <div :lang="lang">{{ scrollName }}</div>

        <v-btn class="fabItems" :size="fabItemsSize" @click="onHandleScroll">
          <v-icon
            :color="fabItemsColor"
            :size="fabItemsIconsSize"
            :icon="scrollIconName"
          >
          </v-icon>
        </v-btn>
      </div>
    </div>
    <div v-if="!isFABActionsOpen" class="fabAction">
      <div :lang="lang">{{ scrollName }}</div>
      <v-btn class="fabItems" :size="fabItemsSize" @click="onHandleScroll">
        <v-icon
          :color="fabItemsColor"
          :size="fabItemsIconsSize"
          :icon="scrollIconName"
        >
        </v-icon>
      </v-btn>
    </div>
  </div>
</template>

<style>
/* disable router-link */
.disabled-router {
  pointer-events: none;
}

.fabAction {
  display: flex;
  justify-content: center;
  flex-direction: column;
  align-items: center;
  align-content: center;
  overflow: hidden;
  width: auto;
  height: auto;
  pointer-events: cursor;
  color: #313132;
  font-size: 12px;
  font-style: normal;
  font-weight: normal;
  font-family: BCSans !important;
  cursor: pointer;
  border-radius: 100%;
}

.fabItemsInverColor {
  background: #1a5a96 0% 0% no-repeat padding-box;
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
  transition: background 1s;
}

.fabItemsInverColor:hover {
  background: #003366 0% 0% no-repeat padding-box;
  border: none;
}

.fabItems {
  background: #ffffff 0% 0% no-repeat padding-box;
  border: 1px solid #70707063;
  transition: border 1s;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
}

.fabItems:hover {
  border: 1px solid #003366;
}
.text {
  text-align: center;
}
</style>
