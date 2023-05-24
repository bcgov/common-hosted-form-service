<template>
  <div id="create">
    <v-speed-dial
      v-model="fab"
      :bottom="bottom"
      :left="left"
      :direction="direction"
      :transition="transition"
    >
      <template v-slot:activator>
        <div>
          <div class="fabAction">
            <div class="text" v-text="fab ? 'Collapse' : 'Actions'" />
            <v-btn v-model="fab" class="fabItemsInvertColor" x-small dark fab>
              <v-icon v-if="fab"> close </v-icon>
              <v-icon v-else> menu </v-icon>
            </v-btn>
          </div>
        </div>
      </template>
      <div
        class="fabAction"
        ref="publishRouterLink"
        data-cy="publishRouterLink"
      >
        <div class="text" v-text="$t('trans.floatButton.publish')" />
        <v-btn
          fab
          dark
          x-small
          @click.stop="gotoPublish"
          class="fabItemsInvertColor"
          :class="{ 'disable-events': !formId }"
        >
          <v-icon
            :color="
              saved ? fabItemsInvertedColor : disabledInvertedFabItemsColor
            "
            >upload_file</v-icon
          >
        </v-btn>
      </div>
      <div
        class="fabAction"
        data-cy="settingsRouterLink"
        ref="settingsRouterLink"
      >
        <div class="text" v-text="$t('trans.floatButton.manage')" />
        <v-btn
          fab
          dark
          x-small
          class="fabItemsInvertColor"
          :class="{ 'disable-events': !formId }"
          @click.stop="gotoManage"
        >
          <v-icon
            :color="
              saved ? fabItemsInvertedColor : disabledInvertedFabItemsColor
            "
            >settings</v-icon
          >
        </v-btn>
      </div>
      <div
        class="fabAction"
        :class="{ 'disable-events': !redoEnabled }"
        ref="redoButton"
        data-cy="redoButton"
      >
        <div class="text" v-text="$t('trans.floatButton.redo')" />
        <v-btn
          fab
          dark
          x-small
          color="#ffffff"
          class="fabItems"
          @click.stop="toParent('redo')"
        >
          <v-icon :color="!isFormSaved ? fabItemsColor : disabledFabItemsColor"
            >redo</v-icon
          >
        </v-btn>
      </div>
      <div
        class="fabAction"
        :class="{ 'disable-events': !undoEnabled }"
        data-cy="undoButton"
        ref="undoButton"
      >
        <div class="text" v-text="$t('trans.floatButton.undo')" />
        <v-btn
          fab
          dark
          x-small
          color="#ffffff"
          class="fabItems"
          @click.stop="toParent('undo')"
        >
          <v-icon :color="!isFormSaved ? fabItemsColor : disabledFabItemsColor"
            >undo</v-icon
          >
        </v-btn>
      </div>
      <div class="fabAction" :class="{ 'disable-events': !formId || !draftId }">
        <div class="text" v-text="$t('trans.floatButton.preview')" />
        <v-btn
          fab
          dark
          x-small
          color="#ffffff"
          class="fabItems"
          ref="previewRouterLink"
          @click.stop="gotoPreview"
        >
          <v-icon :color="!isFormSaved ? fabItemsColor : disabledFabItemsColor"
            >remove_red_eye</v-icon
          >
        </v-btn>
      </div>
      <v-btn fab dark x-small color="red">
        <v-icon>mdi-delete</v-icon>
      </v-btn>
      <div class="fabAction" :class="{ 'disable-events': isFormSaved }">
        <div class="text" v-text="this.savedStatus" />
        <v-btn
          fab
          dark
          x-small
          ref="saveButton"
          color="#ffffff"
          class="fabItems"
          @click.stop="toParent('save')"
        >
          <v-icon
            v-if="!this.saving"
            :color="!isFormSaved ? fabItemsColor : disabledFabItemsColor"
            dark
            >save</v-icon
          >
          <v-progress-circular
            v-if="this.saving"
            indeterminate
            color="#1A5A96"
            size="25"
          ></v-progress-circular>
        </v-btn>
      </div>
    </v-speed-dial>
  </div>
</template>
<script>
export default {
  data: () => ({
    isFABActionsOpen: true,
    direction: 'top',
    fab: false,
    fabs: false,
    fabsss: false,
    tabs: null,
    left: true,
    bottom: true,
    right: false,
    transition: 'slide-y-reverse-transition',
    fabItemsInvertedColor: '#ffffff',
    disabledInvertedFabItemsColor: '#ffffff',
    fabItemsColor: '#1A5A96',
    disabledFabItemsColor: '#707070C1',
    baseIconName: 'close',
    baseFABItemName: 'Collapse', // end
  }),
  props: {
    formId: String,
    draftId: String,
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
    savedStatus: String,
  },

  watch: {
    top(val) {
      this.bottom = !val;
    },
    right(val) {
      this.left = !val;
    },
    bottom(val) {
      this.top = !val;
    },
    left(val) {
      this.right = !val;
    },
  },
  methods: {
    onOpenFABActionItems() {
      if (this.isFABActionsOpen) {
        this.baseIconName = 'menu';
        this.isFABActionsOpen = false;
        this.baseFABItemName = 'Actions';
      } else {
        this.baseIconName = 'close';
        this.isFABActionsOpen = true;
        this.baseFABItemName = 'Collapse';
      }
    },
    toParent(name) {
      this.$emit(name);
    },
    gotoPreview() {
      let route = this.$router.resolve({
        name: 'FormPreview',
        query: { f: this.formId, d: this.draftId },
      });
      window.open(route.href);
    },
    gotoManage() {
      this.$router.push({
        name: 'FormManage',
        query: { f: this.formId },
      });
    },
    gotoPublish() {
      this.$router.push({
        name: 'FormManage',
        query: { f: this.formId, fd: 'formDesigner', d: this.draftId },
      });
    },
  },
  mounted() {
    // Apply a @click.stop to the .v-speed-dial__list that wraps the default slot
    this.$el
      .querySelector('.v-speed-dial__list')
      .addEventListener('click', (e) => {
        console.log('+++++++++++++');
        e.stopPropagation();
      });
  },
};
</script>

<style lang="css" scoped>
/* This is for documentation purposes and will not be needed in your application */
#create {
  display: flex !important;
  justify-content: center !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: start !important;
  align-content: center;
  background-color: red;
  position: fixed;
  bottom: 0px;
  right: 0px;
}

#create .v-speed-dial {
  position: absolute;
  margin-bottom: 20px;
}

#create .v-btn--floating {
  position: relative;
}

.text {
  overflow-wrap: break-word;
  width: 48px;
  text-align: center;
  word-break: break-word;
}

.fabItems {
  border: 1px solid #70707063 !important;
  transition: border 1s !important;
  box-shadow: 0px 3px 6px #00000029 !important;
  margin: 0px;
  opacity: 1 !important;
}

.fabItems:hover {
  border: 1px solid #003366 !important;
  opacity: 1 !important;
}

.fabItemsInvertColor {
  background: #1a5a96 0% 0% no-repeat padding-box !important;
  box-shadow: 0px 3px 6px #00000029 !important;
  transition: background 1s !important;
  margin: 0px;
  opacity: 1 !important;
}

.fabItemsInvertColor:hover {
  background: #003366 0% 0% no-repeat padding-box !important;
  border: none !important;
  opacity: 1 !important;
}

.fabAction {
  display: flex !important;
  justify-content: center !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: start !important;
  align-content: center;
  pointer-events: cursor;
  width: auto !important;
  height: auto !important;
  font-size: 12px !important;
  font-style: normal !important;
  font-weight: normal !important;
  font-family: BCSans !important;
  cursor: pointer !important;
  margin-top: 8px !important;
}

.disable-events {
  pointer-events: none !important;
}
</style>
