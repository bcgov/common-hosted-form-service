<template>
  <div :style="[{display:'flex',width:'52px', flexDirection:fbActionDirection, gap:fbActionGap},fbPosition,{position:'fixed'},{zIndex:fbZIndex}]">
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
    <div :style="[{display:'flex', flexDirection:fbActionDirection, gap:fbActionGap}]" v-if="isfbActionsOpen">
      <transition-group name="fbActionItems" tag="div">
        <div class="fbAction" v-for="item in fbActionItems" :key="item.id">
          <label>{{item.name}}</label>
          <v-avatar
            :style="{backgroundColor:baseBGColor,border: '1px solid'+item.borderColor}"
            :size=fbSize
            :elevation="24"
            :class="elevation24"
          >
            <v-icon 
              :color=item.IconColor
              :small="smallIcon"
              :large="largeIcon"
              :x-small="xSmallIcon"
            >
              {{item.IconName}}
            </v-icon>
          </v-avatar>
        </div>
      </transition-group>
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
      baseName:'open',
      baseIconName:'add',
      smallIcon:false,
      largeIcon:false,
      xLargeIcon:false,
      xSmallIcon:false,
      labelTextSize:'15px'
    };
  },
  props: {
    position: {
      default:'bottom-right' 
    },
    fbActionItems:{
      type:Array
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
    onOpenFBActionItems(){
      if(this.isfbActionsOpen){
        this.baseIconName='add';
        this.isfbActionsOpen=false;
        this.baseName='open';
      }
      else{
        this.baseIconName='close';
        this.isfbActionsOpen=true;
        this.baseName='close';
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
          this.fbPosition.right = '3vw';
          this.fbPosition.bottom = '8vh';
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
    }
  },
  watch: {
    size(){
      this.setSizes();
    }
  },
  mounted(){
    this.setPosition();
    this.setSizes();
  }
 
};
</script>

<style>
 
 .fbAction{
   display:flex; 
   flex-direction:column;
   align-items:center;
   text-align: center;
   overflow: hidden;
   width:auto;
   height:auto;
 }
 

 .fbActionItems-enter-active {
   transition: all 50.5s ease;
 }

 .fbActionItems-enter-from {
   
   opacity:0;
 }
 .fbActionItems-enter-to {
   opacity:1;
 }

 .list-enter-active {
   transition: opacity 5000000s ease;
 }



 .list-enter-to {
   opacity:0;
 }
 
 .list-enter-from
 {
   opacity: 0;
 }

 .animated.quick {
    -webkit-animation-duration: .7s !important;
    animation-duration: .7s !important;
  }
</style>
