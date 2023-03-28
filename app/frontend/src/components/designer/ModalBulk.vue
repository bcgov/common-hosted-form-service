<template>
  <div class="box-progress">
    <b>{{(value)? value : "0"}}%</b>
    <div class="meter">
      <span :style="'width:'+value+'%;'" :class="color" >
      </span>
    </div>


    <v-row v-if="file" class="mt-4 fileinfo">
      <v-col cols="12" md="6">
        <label>{{ file.name }}</label>
      </v-col>
      <v-col cols="12" md="6">
        <label>{{ fileSize }}</label>
      </v-col>
    </v-row>

  </div>

</template>
<script>

export default {
  name: 'ModalBulk',
  props: {
  },
  data() {
    return {
    };
  },
  computed: {
    color(){
      if(this.value<100) {
        return 'loading ';
      } else {
        if (this.error) return 'fail';
        else return 'success';
      }
    },
    fileSize(){
      if(this.file.size< 1024) return this.file.size.toFixed(2)+' bytes';
      if(this.file.size< 1024 * 1024) return (this.file.size / 1024).toFixed(2)+' KB';
      return (this.file.size / (1024 *1024)).toFixed(2)+' MB';
    }
  },
  methods: {
  }
};
</script>

<style lang="scss" scoped>
  .box-progress {
   margin-top:3%;
   b {
     float: left;
     width:10%;
     height: 20px;
     color: #003366;
   }
  .meter {
    width:90%;
    height: 20px;
    float: right;
    position: relative;
    background: white;
    border-radius: 25px;
    border :1px solid #38598a;
    box-shadow: inset 0 -1px 1px rgba(255, 255, 255, 0.3);
     span {
        display: block;
        height: 100%;

        box-shadow:
          inset 0 2px 9px  rgba(255,255,255,0.3),
          inset 0 -2px 6px rgba(0,0,0,0.4);
        position: relative;
        overflow: hidden;
        border-top-left-radius: 20px;
        border-bottom-left-radius: 20px;
     }
  }
}

.loading {
    background-color: #38598a;
    background-image: linear-gradient(
      center bottom,
      #38598a 37%,
      #5071a2 69%
    );
    border-top-right-radius: 8px;
    border-bottom-right-radius: 8px;
}

.success{
    background-color: #20de46;
    background-image: linear-gradient(
      center bottom,
      #20de46 37%,
      #49d966 69%
    );
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;

}

.fail{
    background-color: rgb(233, 50, 78);
    background-image: linear-gradient(
      center bottom,
      rgb(233, 50, 78) 37%,
      rgb(244, 91, 114)  69%
    );
    border-top-right-radius: 20px;
    border-bottom-right-radius: 20px;
}

.fileinfo{
  position: relative;
  width:100%;
  margin-top: 1%;
  padding: 1px;
  label {
    font-size: 12px;
    color: #38598a;
    text-align:right;
    float: right;
  }
}



</style>
