const defaultWhyIsUrl = 'https://materialsmine.org/wi'

function getViewUrl ({ whyIsUrl = defaultWhyIsUrl, uri, view = null }) {
  if (view != null) {
    return `${whyIsUrl}/about?view=${view || 'view'}&uri=${uri}`
  } else {
    return `${whyIsUrl}/about?uri=${uri}`
  }
}

async function loadJsonView ({ whyIsUrl = defaultWhyIsUrl, uri, view = null }) {
  const url = getViewUrl({ whyIsUrl, uri, view })
  const resp = await fetch(url)
  const json = await resp.json()
  return json
}

export { getViewUrl, loadJsonView }
