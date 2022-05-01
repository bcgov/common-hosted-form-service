<template>
  <div :style="[{display:'flex',width:'92px', flexDirection:fbActionDirection, gap:fbActionGap},fbPosition,{position:'fixed'},{zIndex:fbZIndex}]">
    <div class="fbAction" @click="onOpenFBActionItems">
      <label :style={fontSize:labelTextSize}>{{baseName}}</label>
      <v-avatar
        :style="{backgroundColor:baseBGColor,border: '1px solid '+baseFBBorderColor}"
        :size=fbSize
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
    <div :style="[{display:'flex', flexDirection:fbActionDirection, gap:fbActionGap}]" v-if="isfbActionsOpen" >
      <router-link
        class="fbAction"
        tag="div"
        :to="{ name: 'FormManage', query: { f: formId } }"
        target="_blank"
        :class="{ 'disabled-router': !formId }"
      >
        <label :style={fontSize:labelTextSize}>
          Manage  
        </label>
        <v-avatar
          :style="{backgroundColor:baseBGColor,border: '1px solid #C0C0C0'}"
          :size=fbSize
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
      <div class="fbAction" >
        <label :style={fontSize:labelTextSize}>
          Redo  
        </label>
        <v-avatar
          :style="{backgroundColor:baseBGColor,border: '1px solid #C0C0C0'}"
          :size=fbSize
          :elevation="24"
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
        
      </div>
      <div class="fbAction">
        <label :style={fontSize:labelTextSize}>
          Undo  
        </label>
        <v-avatar
          :style="{backgroundColor:baseBGColor,border: '1px solid #C0C0C0'}"
          :size=fbSize
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
        
      </div>
      <router-link
        class="fbAction"
        tag="div"
        :to="{ name: 'FormPreview', query: { f: formId, d: draftId } }"
        :class="{ 'disabled-router': !formId || !draftId}"
      >
        <label :style={fontSize:labelTextSize}>
          Preview  
        </label>
        <v-avatar
          :style="{backgroundColor:baseBGColor,border: '1px solid #C0C0C0'}"
          :size=fbSize
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
        
      </router-link>
      <div class="fbAction" >
        <label :style={fontSize:labelTextSize}>
          {{this.savedStatus}} 
          <v-progress-circular
            v-if='this.saving'
            indeterminate
            color="primary"
            size=25
          ></v-progress-circular>
        </label>
        <v-avatar
          :style="{backgroundColor:baseBGColor,border: '1px solid #C0C0C0'}"
          :size=fbSize
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
      <div class="fbAction">
        <label :style={fontSize:labelTextSize}>
          {{scrollName}} 
        </label>
        <v-avatar
          :style="{backgroundColor:baseBGColor,border: '1px solid #C0C0C0'}"
          :size=fbSize
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
      fbActionDirection:'column-reverse',
      isfbActionsOpen:false,
      fbPosition:{},
      fbSize:36,
      baseName:'Open',
      baseIconName:'add',
      smallIcon:false,
      largeIcon:false,
      xLargeIcon:false,
      xSmallIcon:false,
      labelTextSize:'15px',
      scrollIconName:'north',
      scrollName:'Top',
      isScrollTop:true,
    };
  },
  props: {
    formId:String,
    draftId:String,
    saving:{
      default:false
    },
    savedStatus:{
      type:String
    },
    position: {
      default:'bottom-right' 
    },
    
    fbActionGap:{
      default:'15px'
    },
    size:{
      default:'medium'
    },
    baseIconColor:{
      default:'#1976D2'
    },
    direction:{
      type:String
    },
    baseFBBorderColor:{
      default:'#C0C0C0'
    },
    baseBGColor:{
      default:'#ffffff'
    },
    fbZIndex:{default:1000},
    screenPosition:{
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
    onOpenFBActionItems(){
      if(this.isfbActionsOpen){
        this.baseIconName='add';
        this.isfbActionsOpen=false;
        this.baseName='Open';
      }
      else{
        this.baseIconName='close';
        this.isfbActionsOpen=true;
        this.baseName='Close';
      }
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
    topLeftRight(){
      if (this.position==='top-right'|| this.position==='top-left' ){
        this.fbActionDirection='column';
      }
    },
   
    bottomLeftRight(){
      if(this.position==='bottom-right' || this.position==='bottom-left'){
        this.fbActionDirection='column-reverse';
      }
    },
    setPosition(){
      this.fbPosition={};

      this.bottomLeftRight();
      this.topLeftRight();

      if(this.screenPosition && Object.keys(this.screenPosition).length > 0)
      {
        Object.assign(this.fbPosition, this.screenPosition);
        return;
      }
      switch (this.position) {
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
    handleScroll () {
      if(window.scrollY==0){
        this.scrollIconName='south';
        this.scrollName='Bottom';
        this.isScrollTop=false;
      }
      else if((window.innerHeight + window.scrollY) >= document.body.offsetHeight){
        this.scrollIconName='north';
        this.scrollName='Top';
        this.isScrollTop=true;
      }
      // Any code to be executed when the window is scrolled
    },
    onHandleScroll(){
      if(this.isScrollTop){
        window.scrollTo(0,0);
        this.scrollIconName='north';
        this.scrollName='Top';
        this.isScrollTop=false;
        return;
      }
      window.scrollTo({ left: 0, top: document.body.scrollHeight, behavior: 'smooth' });
      this.scrollIconName='south';
      this.scrollName='Bottom';
      this.isScrollTop=true;
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
 
 .fbAction{
   display:flex; 
   flex-direction:column;
   align-items:center;
   text-align: center;
   overflow: hidden;
   width:auto;
   height:auto;
 }

</style>
