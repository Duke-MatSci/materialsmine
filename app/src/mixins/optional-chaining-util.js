
export default {
  methods: {
    optionalChaining (fn) {
      try {
        return fn()
      } catch (e) { console.log(e) }
    }
  }
}
