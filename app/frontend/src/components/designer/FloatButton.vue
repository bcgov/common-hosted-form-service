<template>
  <div :style="[{display:'flex',width:'92px', flexDirection:fabActionDirection, gap:fbActionGap},fbPosition,{position:'fixed'},{zIndex:fabZIndex}]">
    <div class="fabAction" @click="onOpenFABActionItems">
      <label :style={fontSize:labelTextSize}>{{baseName}}</label>
      <v-avatar
        :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid '+baseFABBorderColor}"
        :size=fabItemsSize
      >
        <v-icon 
          :color="baseFABIconColor" 
          :small="smallIcon"
          :large="largeIcon"
          :x-small="xSmallIcon"
        >
          {{baseIconName}}
        </v-icon>
      </v-avatar>
    </div>
    <div :style="[{display:'flex', flexDirection:fabActionDirection, gap:fabItemsGap}]" v-if="isFABActionsOpen" >
      <router-link
        class="fabAction"
        :to="{ name: 'FormManage', query: { f: formId } }"
        :class="{ 'disabled-router': !formId }"
        tag="div"
      >
        <label :style={fontSize:labelTextSize}>
          Manage  
        </label>
        <v-avatar
          :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid #C0C0C0'}"
          :size=fabItemsSize
        >
          <v-icon 
            color="primary"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            settings
          </v-icon>
        </v-avatar>
        
      </router-link>
      <div class="fabAction" >
        <label :style={fontSize:labelTextSize}>
          Redo  
        </label>
        <v-badge
          left
          overlap
          color="pink"
          :content="redocount"
        >
          <v-avatar
            :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid #C0C0C0'}"
            :size=fabItemsSize
            @click="toParent('redo')"
          >
            <v-icon 
              color="primary"
              :small="smallIcon"
              :large="largeIcon"
              :x-small="xSmallIcon"
            >
              redo
            </v-icon>
          </v-avatar>
        </v-badge>
        
      </div>
      <div class="fabAction">
        <label :style={fontSize:labelTextSize}>
          Undo  
        </label>
        <v-badge
          left
          overlap
          color="pink"
          :content="undocount"
        >
          <v-avatar
            :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid #C0C0C0'}"
            :size=fabItemsSize
            :elevation="24"
            @click="toParent('undo')"
          >
            <v-icon 
              color="primary"
              :small="smallIcon"
              :large="largeIcon"
              :x-small="xSmallIcon"
            >
              undo
            </v-icon>
          </v-avatar>
        </v-badge>
      </div>
      <div
        class="fabAction"
        @click="gotoPreview"
        :class="{ 'disabled-router': !formId || !draftId}"
      >
        <label :style={fontSize:labelTextSize}>
          Preview  
        </label>
        <v-avatar
          :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid #C0C0C0'}"
          :size=fabItemsSize
        >
          <v-icon 
            color="primary"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            remove_red_eye
          </v-icon>
        </v-avatar>
        
      </div>
      <div class="fabAction" >
        <label :style={fontSize:labelTextSize}>
          {{this.savedStatus}} 
          
        </label>
        <v-progress-circular
          v-if='this.saving'
          indeterminate
          color="primary"
          size=25
        ></v-progress-circular>
        <v-avatar
          :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid #C0C0C0'}"
          :size=fabItemsSize
          :elevation="24"
          @click="toParent('save')"
        >
          <v-icon 
            color="primary"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            save  
          </v-icon>
         
        </v-avatar>
        
      </div>
      <div class="fabAction">
        <label :style={fontSize:labelTextSize}>
          {{scrollName}} 
        </label>
        <v-avatar
          :style="{backgroundColor:baseFABItemsBGColor,border: '1px solid #C0C0C0'}"
          :size=fabItemsSize
          :elevation="24"
          @click="onHandleScroll"
        >
          <v-icon 
            color="primary"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            {{scrollIconName}}
          </v-icon>
        </v-avatar>
        
      </div>
      
    </div>
  </div>
</template>

<script>

export default {
  name: 'FloatButton',
  data(){
    return {
      fabActionDirection:'column-reverse',
      isFABActionsOpen:true,
      fbPosition:{},
      fabItemsSize:36,
      baseName:'Open',
      baseIconName:'add',
      smallIcon:false,
      largeIcon:false,
      xLargeIcon:false,
      xSmallIcon:false,
      labelTextSize:'15px',
      scrollIconName:'north',
      scrollName:'Top',
      isScrollToTop:true,
    };
  },
  props: {
    formId:String,
    draftId:String,
    saving:{
      type:Boolean,
      default:false
    },
    savedStatus:String,
    placement: {
      type:String,
      default:'bottom-right' 
    },
    redocount:{
      type:Number,
      default:0
    },
    undocount:{
      type:Number,
      default:0
    },
    fabItemsGap:{
      type:String,
      default:'15px'
    },
    size:{
      type:String,
      default:'medium'
    },
    baseFABIconColor:{
      type:String,
      default:'#1976D2'
    },
    baseFABBorderColor:{
      type:String,
      default:'#C0C0C0'
    },
    baseFABItemsBGColor:{
      type:String,
      default:'#ffffff'
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
        this.baseIconName='add';
        this.isFABActionsOpen=false;
        this.baseName='Open';
      }
      else{
        this.baseIconName='close';
        this.isFABActionsOpen=true;
        this.baseName='Close';
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
          this.fbSize=52;
          this.smallIcon=false;
          this.largeIcon=true;
          this.xSmallIcon=false;
          this.labelTextSize='19px';
          break;
        case 'large':
          this.fbSize=44;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=false;
          this.labelTextSize='17px';
          break;
        case 'medium':
          this.fbSize=36;
          this.smallIcon=true;
          this.largeIcon=false;
          this.xSmallIcon=false;
          this.labelTextSize='15px';
          break;
        case 'small':
          this.fbSize=28;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=true;
          this.labelTextSize='13px';
          break;
        default:
          this.fbSize=36;
      }
    },

    //checks if FAB is placed at the top right or top left of the screen
    topLeftRight(){
      if (this.placement==='top-right'|| this.placement==='top-left' ){
        this.fabActionDirection='column';
      }
    },
   
    //checks if FAB is placed at the bottom right or bottom left of the screen
    bottomLeftRight(){
      if(this.placement==='bottom-right' || this.placement==='bottom-left'){
        this.fabActionDirection='column-reverse';
      }
    },

    // set where on the screen FAB will be displayed
    setPosition(){
      this.fbPosition={};

      this.bottomLeftRight();
      this.topLeftRight();

      if(this.positionOffset && Object.keys(this.positionOffset).length > 0)
      {
        Object.assign(this.fbPosition, this.positionOffset);
        return;
      }
      switch (this.placement) {
        case 'bottom-right':
          this.fbPosition.right = '2vw';
          this.fbPosition.bottom = '7vh';
          break;
        case 'bottom-left':
          this.fbPosition.left = '5vw';
          this.fbPosition.bottom = '4vh';
          break;
        case 'top-left':
          this.fbPosition.left = '5vw';
          this.fbPosition.top = '4vh';
          break;
        case 'top-right':
          this.fbPosition.right = '1vw';
          this.fbPosition.top = '8vh';
          break;
        default:
          this.fbPosition.right = '5vw';
          this.fbPosition.bottom = '4vh';
      }
    },

    // callback function for window scroll event
    handleScroll () {
      if(window.scrollY==0){
        this.scrollIconName='south';
        this.scrollName='Bottom';
        this.isScrollToTop=false;
      }
      else if((window.innerHeight + window.scrollY) >= document.body.offsetHeight){
        this.scrollIconName='north';
        this.scrollName='Top';
        this.isScrollToTop=true;
      }
    },

    // function for click scroll event
    onHandleScroll(){
      if(this.isScrollToTop){
        window.scrollTo(0,0);
        this.scrollIconName='north';
        this.scrollName='Top';
        this.isScrollToTop=false;
        return;
      }
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'smooth' });
      this.scrollIconName='south';
      this.scrollName='Bottom';
      this.isScrollToTop=true;
    },
  },
  watch: {
    size(){
      this.setSizes();
    },
  },
  mounted(){
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
   display:flex; 
   flex-direction:column;
   align-items:center;
   text-align: center;
   overflow: hidden;
   width:auto;
   height:auto;
 }

</style>
