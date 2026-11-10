export default defineAppConfig({
  ui: {
    colors: {
      primary: 'sky',
      secondary: 'pink',
      success: 'lime',
      info: 'cyan',
      warning: 'amber',
      error: 'rose',
      neutral: 'mist'
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