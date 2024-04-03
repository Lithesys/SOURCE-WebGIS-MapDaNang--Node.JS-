import vue3GoogleLogin from 'vue3-google-login'

// import GAuth from 'vue3-google-oauth2'

const vue3GoogleLoginOPtions = {
    clientId: process.env.GOOGLE_CLIENT_ID,
    // scope: 'email',
    // prompt: 'consent',
}
export default ({ app }) => {
  app.use(vue3GoogleLogin , vue3GoogleLoginOPtions)
}
