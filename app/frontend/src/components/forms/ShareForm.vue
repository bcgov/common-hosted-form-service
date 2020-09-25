<template>
  <span>
    <v-dialog v-model="dialog" width="900">
      <template v-slot:activator="{ on, attrs }">
        <v-btn color="blue" text small v-bind="attrs" v-on="on">
          <v-icon class="mr-1">share</v-icon>
          <span>Share</span>
        </v-btn>
      </template>

      <v-card>
        <v-card-title class="headline grey lighten-2">Get sharing link for this form</v-card-title>

        <v-card-text>
          <v-icon class="mr-1 my-5" color="primary">info</v-icon>
          <span>Use the link below to share with the users you wish to fill out this form</span>
          <v-text-field
            readonly
            dense
            flat
            outlined
            label="URL"
            data-test="text-shareUrl"
            :value="formLink"
          >
            <template v-slot:prepend>
              <v-icon>link</v-icon>
            </template>
          </v-text-field>
          <p class="text-right">
            <BaseCopyToClipboard :copyText="formLink" />
          </p>
          <p class="text-right">
            <v-btn color="blue" text small @click="qrShow = true">
              <v-icon class="mr-1">qr_code</v-icon>
              <span>Generate a QR Code</span>
            </v-btn>
          </p>
          <div v-if="qrShow" class="qrCodeContainer text-center">
            <qrcode-vue :value="formLink" :size="qrSize" renderAs="canvas" level="M"></qrcode-vue>
            <v-container>
              <v-row>
                <v-col cols="12" lg="6" offset-lg="3">
                  <v-slider
                    v-model="qrSize"
                    label="Size"
                    :tick-labels="ticksLabels"
                    :min="200"
                    :max="600"
                    step="200"
                    ticks="always"
                    tick-size="4"
                  ></v-slider>
                </v-col>
              </v-row>
              <v-btn color="blue" text small @click="downloadQr">
                <v-icon class="mr-1">cloud_download</v-icon>
                <span>Download Image</span>
              </v-btn>
            </v-container>
          </div>
        </v-card-text>
        <v-divider></v-divider>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary" text @click="dialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </span>
</template>

<script>
import QrcodeVue from 'qrcode.vue';

export default {
  components: {
    QrcodeVue,
  },
  props: {
    formId: {
      type: String,
      required: true,
    },
    versionId: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      dialog: false,
      qrShow: false,
      qrSize: 400,
      ticksLabels: ['Small', 'Medium', 'Large'],
    };
  },
  computed: {
    formLink() {
      return `${window.location.origin}${process.env.BASE_URL}form/${this.formId}/versions/${this.versionId}/submit`;
    },
  },
  methods: {
    downloadQr() {
      var link = document.createElement('a');
      link.download = 'filename.png';
      link.href = document.querySelector('.qrCodeContainer canvas').toDataURL();
      link.click();
    },
  },
};
</script>

<style>
</style>
