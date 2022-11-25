<template>
  <div :style="[{display:'flex',
                 width:'92px',
                 flexDirection:fabItemsDirection,
                 gap:fabItemsGap,
                 zIndex:fabZIndex,
                 position:'fixed'},
                fabItemsPosition,]"
  >
    <div class="fabAction" @click="onOpenFABActionItems">
      {{baseFABItemName}}
      <v-avatar
        class="fabItemsInverColor"
        :size=fabItemsSize
      >
        <v-icon
          :color="baseIconColor"
          :size="fabItemsIconsSize"
        >
          {{baseIconName}}
        </v-icon>
      </v-avatar>
    </div>
    <div :style="[{display:'flex', flexDirection:fabItemsDirection, gap:fabItemsGap}]" v-if="isFABActionsOpen">
      <router-link
        ref="publishRouterLink"
        data-cy="publishRouterLink"
        class="fabAction"
        :to="{ name: 'FormManage', query: {f: formId, fd:'formDesigner',d: draftId } }"
        :class="{ 'disabled-router': !formId}"
        tag="div"
      >
        <div v-text="'Publish'"/>
        <v-avatar
          class="fabItemsInverColor"
          :size=fabItemsSize
        >
          <v-icon

            :color="saved?fabItemsInvertedColor:disabledInvertedFabItemsColor"
            :size="fabItemsIconsSize"
          >
            upload_file
          </v-icon>
        </v-avatar>
      </router-link>
      <router-link
        class="fabAction"
        data-cy="settingsRouterLink"
        ref="settingsRouterLink"
        :to="{ name: 'FormManage', query: { f: formId } }"
        :class="{ 'disabled-router': !formId }"
        tag="div"
      >
        <div v-text="'Manage'"/>
        <v-avatar
          class="fabItemsInverColor"
          :size=fabItemsSize
        >
          <v-icon
            :color="saved?fabItemsInvertedColor:disabledInvertedFabItemsColor"
            :size="fabItemsIconsSize"
          >

            settings
          </v-icon>
        </v-avatar>

      </router-link>

      <div
        ref="redoButton"
        class="fabAction"
        data-cy="redoButton"
        :class="{ 'disabled-router': !redoEnabled}"
      >
        <div v-text="'Redo'"/>
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          @click="toParent('redo')"
        >
          <v-icon
            :color="redoEnabled?fabItemsColor:disabledFabItemsColor"
            :size="fabItemsIconsSize"
          >
            redo
          </v-icon>
        </v-avatar>
      </div>
      <div
        ref="undoButton"
        class="fabAction"
        data-cy="undoButton"
        :class="{ 'disabled-router': !undoEnabled}"
      >

        <div v-text="'Undo'"/>
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          @click="toParent('undo')"
        >
          <v-icon
            :color="undoEnabled?fabItemsColor:disabledFabItemsColor"
            :size="fabItemsIconsSize"
          >
            undo
          </v-icon>
        </v-avatar>
      </div>
      <div
        class="fabAction"
        ref="previewRouterLink"
        @click="gotoPreview"
        :class="{ 'disabled-router': !formId || !draftId}"
      >
        <div v-text="'Preview'"/>
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
        >
          <v-icon
            :color="formId?fabItemsColor:disabledFabItemsColor"
            :size="fabItemsIconsSize"
          >
            remove_red_eye
          </v-icon>
        </v-avatar>

      </div>
      <div class="fabAction"
           data-cy="saveButton"
           ref="saveButton"
           :class="{ 'disabled-router': isFormSaved}">
        <div>{{this.savedStatus}}</div>
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          @click="toParent('save')"
        >
          <v-icon
            v-if='!this.saving'
            :color="!isFormSaved?fabItemsColor:disabledFabItemsColor"
            :size="fabItemsIconsSize"
            dark
          >

            save
          </v-icon>

          <v-progress-circular
            v-if='this.saving'
            indeterminate
            color="#1A5A96"
            size=25
          ></v-progress-circular>

        </v-avatar>

      </div>
      <div class="fabAction">
        <div>{{scrollName}}</div>

        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          @click="onHandleScroll"
        >
          <v-icon
            :color="fabItemsColor"
            :size="fabItemsIconsSize"
          >
            {{scrollIconName}}
          </v-icon>
        </v-avatar>

      </div>

    </div>
    <div class="fabAction" v-if="!isFABActionsOpen">
      <div>{{scrollName}}</div>
      <v-avatar
        class="fabItems"
        :size=fabItemsSize
        @click="onHandleScroll"
      >
        <v-icon
          :color="fabItemsColor"
          :size="fabItemsIconsSize"
        >
          {{scrollIconName}}
        </v-icon>
      </v-avatar>

    </div>
  </div>
</template>

<script>

export default {
  name: 'FloatButton',
  data(){
    return {

      fabItemsDirection:'column-reverse',
      isFABActionsOpen:true,
      fabItemsPosition:{},
      fabItemsSize:36,
      fabItemsIconsSize:31,

      //base fab item variable start
      baseFABItemName:'Collapse',
      baseIconName:'close',
      baseIconColor:'#ffffff', //end

      // fab items icons variables start
      fabItemsColor:'#1A5A96',
      fabItemsInvertedColor:'#ffffff',
      disabledInvertedFabItemsColor:'#ffffff',
      disabledFabItemsColor:'#707070C1',// end

      scrollIconName:'south',
      scrollName:'Bottom',
    };
  },
  props: {
    formId:String,
    draftId:String,
    saving:{
      type:Boolean,
      default:false
    },
    undoEnabled:{
      type:Boolean,
      default:false
    },
    redoEnabled:{
      type:Boolean,
      default:false
    },
    saved: {
      type: Boolean,
      default: false,
    },
    isFormSaved:Boolean,
    savedStatus:String,
    placement: {
      type:String,
      default:'bottom-right'
    },
    fabItemsGap:{
      type:String,
      default:'13px'
    },
    size:{
      type:String,
      default:'medium'
    },
    fabZIndex:{
      type:Number,
      default:1000
    },
    positionOffset:{
      type:Object,
      validator: function(value) {
        // The value must match one of these strings
        return ['top', 'bottom', 'right', 'left'].includes(...Object.keys(value));
      }
    }
  },
  methods:{
    toParent(name) {
      this.$emit(name);
    },
    onOpenFABActionItems(){
      if(this.isFABActionsOpen){
        this.baseIconName='menu';
        this.isFABActionsOpen=false;
        this.baseFABItemName='Actions';
      }
      else{
        this.baseIconName='close';
        this.isFABActionsOpen=true;
        this.baseFABItemName='Collapse';
      }
    },
    gotoPreview() {
      let route = this.$router.resolve({name: 'FormPreview', query: { f: this.formId, d: this.draftId }});
      window.open(route.href);
    },
    setSizes(){
      this.floatButtonSize={};

      switch(this.size){

        case 'x-large':
          this.fabItemsSize=52;
          this.fabItemsIconsSize=47;
          this.smallIcon=false;
          this.largeIcon=true;
          this.xSmallIcon=false;
          break;
        case 'large':
          this.fabItemsSize=44;
          this.fabItemsIconsSize=39;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=false;
          break;
        case 'medium':
          this.fabItemsSize=36;
          this.fabItemsIconsSize=31;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=false;
          break;
        case 'small':
          this.fabItemsSize=28;
          this.fabItemsIconsSize=18;
          break;
        default:
          this.fabItemsSize=36;
          this.fabItemsIconsSize=31;
      }
    },

    //checks if FAB is placed at the top right or top left of the screen
    topLeftRight(){
      if (this.placement==='top-right'|| this.placement==='top-left' ){
        this.fabItemsDirection='column';
      }
    },

    //checks if FAB is placed at the bottom right or bottom left of the screen
    bottomLeftRight(){
      if(this.placement==='bottom-right' || this.placement==='bottom-left'){
        this.fabItemsDirection='column-reverse';
      }
    },

    // set where on the screen FAB will be displayed
    setPosition(){
      this.fabItemsPosition={};

      this.bottomLeftRight();
      this.topLeftRight();

      if(this.positionOffset && Object.keys(this.positionOffset).length > 0)
      {
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
    handleScroll () {
      if(window.scrollY===0){
        this.scrollIconName='south';
        this.scrollName='Bottom';
      }
      else if(window.pageYOffset + window.innerHeight >= document.documentElement.scrollHeight-50){
        this.scrollIconName='north';
        this.scrollName='Top';
      }
    },

    // function for click scroll event
    onHandleScroll(){
      if(window.scrollY===0) {
        this.bottomScroll();
      }
      else if (this.scrollName==='Bottom' && window.scrollY>0) {
        this.bottomScroll();
      }
      else if (this.scrollName==='Top' && window.scrollY>0) {
        this.topScroll();
      }
      else {
        this.topScroll();
      }

    },
    topScroll() {
      window.scrollTo(0,0);
      this.scrollIconName='south';
      this.scrollName='Bottom';
    },
    bottomScroll() {
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'smooth' });
      this.scrollIconName='north';
      this.scrollName='Top';
    }
  },
  watch: {
    size(){
      this.setSizes();
    }
  },
  mounted(){
    window.scrollTo(0,0);
    this.setPosition();
    this.setSizes();
  },
  created(){
    window.addEventListener('scroll', this.handleScroll);
  },
  destroyed () {
    window.removeEventListener('scroll', this.handleScroll);
  },

};
</script>

<style>

 /* disable router-link */
.disabled-router {
  pointer-events: none;
}


 .fabAction{

  display: flex;
  justify-content: center;
  flex-direction:column;
  align-items: center;
  align-content: center;
  overflow: hidden;
  width:auto;
  height:auto;
  pointer-events: cursor;
  color:#313132;
  font-size:12px;
  font-style:normal;
  font-weight:normal;
  font-family: BCSans !important;
  cursor: pointer;
  border-radius: 100%;
  padding:3px;
 }

 .fabItemsInverColor{
  background: #1A5A96 0% 0% no-repeat padding-box;
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
  transition: background 1s;
 }

 .fabItemsInverColor:hover{
   background: #003366 0% 0% no-repeat padding-box;
   border: none;
 }

 .fabItems{
  background: #FFFFFF 0% 0% no-repeat padding-box;
  border: 1px solid #70707063;
  transition: border 1s;
  display: flex;
  align-items: center;
  justify-content: space-around;
  border-radius: 100%;
  box-shadow: 0px 3px 6px #00000029;
 }

 .fabItems:hover{
   border: 1px solid #003366;
 }

</style>
