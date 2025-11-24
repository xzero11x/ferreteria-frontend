// Punto de entrada principal de la aplicación React
import "@fontsource/geist";
import "@/global.css";
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './router/AppRouter'
import { AuthProvider } from './auth/AuthContext'

// Scrollbar visibility: per-container (no global effect, no content shift)
(() => {
  const timers = new WeakMap<HTMLElement, number>()
  const show = (el: HTMLElement) => {
    el.setAttribute('data-scrollable', 'true')
    el.setAttribute('data-scrolling', 'true')
    const t = timers.get(el)
    if (t) window.clearTimeout(t)
    timers.set(el, window.setTimeout(() => {
      el.removeAttribute('data-scrolling')
    }, 800))
  }
  const onScroll = (e: Event) => {
    const el = e.currentTarget as HTMLElement
    show(el)
  }
  const mightScroll = (el: Element) => {
    if (!(el instanceof HTMLElement)) return false
    const style = getComputedStyle(el)
    const oy = style.overflowY
    const ox = style.overflowX
    const canY = (oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight
    const canX = (ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth
    return canY || canX
  }
  const attach = (el: Element) => {
    if (!(el instanceof HTMLElement)) return
    if (!mightScroll(el)) return
    el.setAttribute('data-scrollable', 'true')
    el.addEventListener('scroll', onScroll, { passive: true })
  }
  const scan = (root: ParentNode) => {
    // Explicit known containers
    root.querySelectorAll('[data-sidebar="content"], .pos-page, .scrollable').forEach(attach)
    // Heuristic: any element currently scrollable
    const all = root.querySelectorAll('*')
    all.forEach((n) => attach(n))
  }
  const observer = new MutationObserver((records) => {
    for (const r of records) {
      r.addedNodes.forEach((n) => {
        if (n instanceof HTMLElement) {
          attach(n)
          scan(n)
        }
      })
    }
  })
  window.addEventListener('load', () => {
    scan(document)
    observer.observe(document.body, { childList: true, subtree: true })
  })
})()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  </StrictMode>,
)
