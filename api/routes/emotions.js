const { Router } = require('express')
const axios = require('axios')
const FormData = require('form-data')

const router = Router()

// FacePlusPlus Serializers
const serializeFaceDetect = (data) => {
  return {
    id: data.image_id,
    faces: (data.faces || []).map((face) => {
      return {
        rectangle: face.face_rectangle,
        token: face.face_token,
      }
    }),
  }
}
const serializeFaceAnalyze = (data) => {
  return {
    people: (data.faces || []).map((face) => {
      const landmark = face.landmark || {}
      return {
        person_id: face.face_token,
        demographics: {
            gender: (face.attributes?.gender?.value || 'unknown'),
            age: (face.attributes?.gender?.value || 'unknown')
        },
        emotions: (face.attributes?.emotion || {}),
        landmarks: Object.keys(landmark).map((key) => {
          const pos = landmark[key]
          return {
            [key]: pos,
          }
        }),
        rectangle: face.face_rectangle,
      }
    }),
  }
}

// take a snapshot stream and run face detection
const detect = async (dataURL) => {
  // Relay snapshot to faceplusplus
  const base64 = dataURL.replace(/^data:image\/(png|jpg);base64,/, '')
  const formData = new FormData()
  formData.append('api_key', process.env.FACE_PLUS_KEY)
  formData.append('api_secret', process.env.FACE_PLUS_SECRET)
  formData.append('image_base64', base64)
  const formHeaders = formData.getHeaders();
 
  const result = await axios.post('https://api-us.faceplusplus.com/facepp/v3/detect', formData, {
    headers: {
      ...formHeaders,
    },
  })
  return result.data
}

// Receive a valid face token and run
// through analysis for enotion data, etc
const analyze = async (token) => {
  const formData = new FormData()
  formData.append('api_key', process.env.FACE_PLUS_KEY)
  formData.append('api_secret', process.env.FACE_PLUS_SECRET)
  formData.append('face_tokens', token)
  formData.append('return_landmark', 1)
  formData.append('return_attributes', 'gender,age,emotion,facequality')
  const formHeaders = formData.getHeaders();
 
  const result = await axios.post('https://api-us.faceplusplus.com/facepp/v3/face/analyze', formData, {
    headers: {
      ...formHeaders,
    },
  })
  return result.data
}

router.post('/emotions', async function (req, res, next) {
  const detectData = await detect(req.body.url)
  const detectFormatted = serializeFaceDetect(detectData)

  const token = detectFormatted && detectFormatted.faces.length ? detectFormatted.faces[0].token : false
  if (token) {
    const analysisData = await analyze(token)
    const analysisFormatted = serializeFaceAnalyze(analysisData)
    res.send({ detection: detectFormatted, analysis: analysisFormatted })
  }
})

module.exports = router