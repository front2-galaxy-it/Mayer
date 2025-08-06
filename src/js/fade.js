/**
 * @param { HTMLElement } $el
 * @param { number } delay
 * @param { function | undefined } callback
 * @param { string } display
 *
 * @return void
 * */
const fadeIn = ($el, delay, callback, display = "block") => {
  $el.style.transition = `opacity ${delay}ms`
  $el.style.opacity = "0"
  $el.style.display = display

  setTimeout(() => {
    $el.style.opacity = "1"

    callback && callback($el)
  }, delay)
}

/**
 * @param { HTMLElement } $el
 * @param { number } delay
 * @param { function | undefined } callback
 *
 * @return void
 * */
const fadeOut = ($el, delay, callback) => {
  $el.style.transition = `opacity ${delay}ms`
  $el.style.opacity = "0"


  setTimeout(() => {
    $el.style.opacity = "0"
    $el.style.display = "none"

    callback && callback($el)
  }, delay)
}

export { fadeIn, fadeOut }
