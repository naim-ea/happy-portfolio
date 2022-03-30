<template>
  <div class="page home">
    <video ref="stream" />
    <h1>
      {{ `You are ${highestEmotion}` }}
    </h1>
  </div>
</template>

<script>
import { contain } from 'intrinsic-scale'
export default {
  name: 'home',
  data() {
    return {
      emotions: {
        analysis: null,
        canvas: null,
        ctx: null,
        detection: null,
        interval: null,
      },
      stream: null,
      video: null
    }
  },
  async mounted() {
    this.stream = await this.getStream()
  },
  destroyed() {
    this.emotions.interval = null
  },
  computed: {
    highestEmotion() {
      if (
        !this.emotions.analysis ||
        !this.emotions.analysis.people ||
        !this.emotions.analysis.people[0]
      ) {
        return 'nothing'
      }
      const obj = this.emotions.analysis.people[0].emotions
      return Object.keys(obj).reduce((a, b) => obj[a] > obj[b] ? a : b)
    }
  },
  methods: {
    async getStream() {
      if (this.stream) return this.stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: 'user' },
          audio: true,
        })

        // Return stream
        return stream
      } catch (err) {
        // Denied, or no camera
        console.log('Failed to get user media')
        alert(
          'You must grant access to your camera and microphone to play the game.'
        )
        return false
      }
    },
    async detectEmotion() {
      // Set up canvas  if  not set up yet
      if (!this.emotions.canvas) {
          this.emotions.canvas = document.createElement('canvas')
          this.emotions.canvas.width = 150
          this.emotions.canvas.height = 150
          this.emotions.ctx = this.emotions.canvas.getContext('2d')
      }

      // draw video frame to canvas
      const { width, height, x, y } = contain(
        150,
        150,
        this.video.dataset.streamWidth,
        this.video.dataset.streamHeight
      )
      this.emotions.ctx.drawImage(this.video, x, y, width, height)

      const imageURL = this.emotions.canvas.toDataURL('image/jpeg', 0.5)

      const data = await this.$http.$post('/api/emotions/', { url: imageURL })
      console.log(data)
      this.emotions.detection = data.detection
      this.emotions.analysis = data.analysis
    },
    startVideoStream() {
      const streamW = this.stream.getVideoTracks()[0].getSettings().width
      const streamH = this.stream.getVideoTracks()[0].getSettings().height

      this.video = this.$refs.stream
      this.video.dataset.streamWidth = streamW
      this.video.dataset.streamHeight = streamH
      this.video.srcObject = this.stream
      this.video.onloadedmetadata = async () => {
        this.video.play()
        await new Promise((res) => setTimeout(res, 100))

        // Init emotion detection loop
        this.emotions.interval = setInterval(() => this.detectEmotion(), 500)
      }
    }
  },
  watch: {
    stream(val) {
      if (val) this.startVideoStream()
    }
  }
}
</script>

<style scoped lang="scss">
.home {
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
h1 {
  position: absolute;
  font-size: 76px;
}
</style>
