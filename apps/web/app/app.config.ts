export default defineAppConfig({
  ui: {
    colors: {
      primary: 'blue',
      secondary: 'violet',
      success: 'emerald',
      info: 'blue',
      warning: 'amber',
      error: 'rose',
      neutral: 'zinc'
    },
    button: {
      slots: {
        base: 'font-bold'
      },
      defaultVariants: {
        size: 'lg'
      }
    }
  }
})