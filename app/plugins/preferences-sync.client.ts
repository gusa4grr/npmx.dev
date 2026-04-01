export default defineNuxtPlugin({
  name: 'preferences-sync',
  setup() {
    // Initialize server sync for authenticated users
    void useInitUserPreferencesSync().initSync()
  },
})
