<template>
  <div :style="[{display:'flex',width:'92px', flexDirection:fabActionDirection, gap:fabItemsGap},fabItemsPosition,{position:'fixed'},{zIndex:fabZIndex}]">
    <div class="fabAction" @click="onOpenFABActionItems">
     {{baseFABItemName}}
      <v-avatar
        class="fabItems"
        :style="[{backgroundColor:baseFABItemBGColor}]"
        :size=fabItemsSize
      >
        <v-icon 
          :color="baseIconColor" 
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
        Manage  
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
        >
          <v-icon 
            :color="fabItemsColor"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            settings
          </v-icon>
        </v-avatar>
        
      </router-link>
      <div class="fabAction" >
        Redo  
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          @click="toParent('redo')"
        >
          <v-icon 
            :color="fabItemsColor"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            redo
          </v-icon>
        </v-avatar>
      </div>
      <div class="fabAction">
        Undo  
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          :elevation="24"
          @click="toParent('undo')"
        >
          <v-icon 
            :color="fabItemsColor"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            undo
          </v-icon>
        </v-avatar>
      </div>
      <div
        class="fabAction"
        @click="gotoPreview"
        :class="{ 'disabled-router': !formId || !draftId}"
      >
        
        Preview  
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
        >
          <v-icon 
            :color="fabItemsColor"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
          >
            remove_red_eye
          </v-icon>
        </v-avatar>
        
      </div>
      <div class="fabAction" >
     
        {{this.savedStatus}} 
       
        <v-progress-circular
          v-if='this.saving'
          indeterminate
          color="#1A5A96"
          size=25
        ></v-progress-circular>
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          :elevation="24"
          @click="toParent('save')"
        >
          <v-icon
            :color="fabItemsColor"
            :small="smallIcon"
            :large="largeIcon"
            :x-small="xSmallIcon"
            dark
          >
            save  
          </v-icon>
         
        </v-avatar>
        
      </div>
      <div class="fabAction">
        {{scrollName}} 
        <v-avatar
          class="fabItems"
          :size=fabItemsSize
          :elevation="24"
          @click="onHandleScroll"
        >
          <v-icon 
            :color="fabItemsColor"
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
      isFABActionsOpen:false,
      fabItemsPosition:{},
      fabItemsSize:36,


      //base fab item variable start
      baseFABItemBGColor:'#004B8D',
      baseFABItemName:'Actions',
      baseIconName:'menu',
      baseIconColor:'#ffffff', //end
      
      // fab items icons variables start
      smallIcon:false,
      largeIcon:false,
      xLargeIcon:false,
      xSmallIcon:false,
      fabItemsColor:'#1A5A96',// end
      
    
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
    fabItemsGap:{
      type:String,
      default:'15px'
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
        this.baseIconColor='#ffffff';
        this.baseFABItemBGColor='#004B8D';
      }
      else{
        this.baseIconName='close';
        this.isFABActionsOpen=true;
        this.baseFABItemName='Collapse';
        this.baseIconColor='#E55673';
        this.baseFABItemBGColor='#ffffff';
        
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
          this.smallIcon=false;
          this.largeIcon=true;
          this.xSmallIcon=false;
          break;
        case 'large':
          this.fabItemsSize=44;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=false;
          break;
        case 'medium':
          this.fabItemsSize=36;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=false;
          break;
        case 'small':
          this.fabItemsSize=28;
          this.smallIcon=false;
          this.largeIcon=false;
          this.xSmallIcon=false;
          break;
        default:
          this.fabItemsSize=36;
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

 .fabItemlabels{
   font: normal normal normal 12px/26px Open Sans;
 }
 
 .fabAction{

  display: -ms-flexbox;
  display: -webkit-flex;
  display: flex;
  justify-content: center;
  flex-direction:column;
  -ms-flex-align: center;
  -webkit-align-items: center;
  -webkit-box-align: center;
  align-items: center;
  overflow: hidden;
   width:auto;
   height:auto;
   column-gap:0px;
 }

 .fabItems{
  background: #FFFFFF 0% 0% no-repeat padding-box;
  box-shadow: 0px 3px 6px #00000029; 
  border: 1px solid #70707063
 }

</style>
